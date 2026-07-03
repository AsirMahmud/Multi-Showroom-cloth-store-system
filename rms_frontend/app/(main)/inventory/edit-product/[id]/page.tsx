"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PlusCircle, Trash2, ShoppingCart, ArrowLeft, Upload, X } from "lucide-react";
import {
  useUpdateProduct,
  useProduct,
  useCategories,
  useSuppliers,
  useOnlineCategories,
  useCreateOnlineCategory,
} from "@/hooks/queries/useInventory";
import type {
  CreateProductDTO,
  Product,
  ProductVariation as ImportedProductVariation,
  GalleryImage,
} from "@/types/inventory";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { HydrationWrapper } from "@/components/hydration-wrapper";
import { HierarchicalCategorySelect } from "@/components/inventory/hierarchical-category-select";
import { MultiOnlineCategorySelect } from "@/components/inventory/multi-online-category-select";
import { COLORS, globalSizes } from "../../add-product/constants";
import { getImageUrl } from "@/lib/utils";
import { getApiErrorMessage, getFirstFormError } from "@/lib/form-error";

// Import the same global sizes and colors from add-product

// Add type definitions for globalSizes
type SizeType = keyof typeof globalSizes;
type GenderType = "MALE" | "FEMALE" | "UNISEX";
type SizeCategoryType = "US" | "EU" | "UK" | "Asia" | "international";

// Define the form schema using Zod (same as add-product)
const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string({ required_error: "Please select a category" }),
  online_categories: z.array(z.string()).optional(),
  supplier: z.string({ required_error: "Please select a supplier" }).optional(),
  cost_price: z.string().trim().min(1, "Cost price is required").refine((value) => Number(value) > 0, "Cost price must be greater than 0"),
  wholesale_price: z.string().trim().min(1, "Wholesale price is required").refine((value) => Number(value) > 0, "Wholesale price must be greater than 0"),
  retail_price: z.string().trim().min(1, "Retail price is required").refine((value) => Number(value) > 0, "Retail price must be greater than 0"),
  wholesale_cutoff: z.number().min(1, "Wholesale cutoff must be at least 1").default(10),
  status: z.enum(["active", "inactive", "discontinued"]),
  minimum_stock: z.number().min(0, "Minimum stock cannot be negative").default(10),
  gender: z.string({ required_error: "Please select a gender" }),
  designs: z
    .array(
      z.object({
        name: z.string().min(1, "Design name is required"),
        description: z.string().optional(),
        colors: z.array(
          z.object({
            color: z.string().min(1, "Color is required"),
            stock: z.number().min(0, "Stock must be 0 or greater"),
          })
        ),
      })
    )
    .optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// Define types for our variants (same as add-product)
type ColorVariant = {
  id: string;
  color: string;
  colorHex: string;
  stock: number;
};

type DesignVariant = {
  id: string;
  name: string;
  description?: string;
  colors: ColorVariant[];
};

type ColorGallery = {
  designId: string;
  colorId: string;
  designName: string;
  color: string;
  colorHex: string;
  color_hax?: string;
  images: (GalleryImage & {
    file?: File | null;
    preview?: string | null;
    image_url?: string;
  })[];
};

type MaterialComposition = {
  id: string;
  percentage: number;
  title?: string;
};

type WhoIsThisFor = {
  id: string;
  title?: string;
  description?: string;
};

type Feature = {
  id: string;
  title?: string;
  description?: string;
};

// Add type guards
const isValidSizeType = (value: string): value is SizeType => {
  return [
    "pants",
    "shoes",
    "belts",
    "underwear",
    "jersey",
    "shirts",
    "tshirts",
  ].includes(value);
};

const isValidGender = (value: string): value is GenderType => {
  return ["MALE", "FEMALE", "UNISEX"].includes(value);
};

// Add gender mapping
const genderToSizeKey = {
  MALE: "men",
  FEMALE: "women",
  UNISEX: "men", // Use men's sizes for unisex
} as const;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = typeof params.id === "string" ? parseInt(params.id) : 0;
  const updateProduct = useUpdateProduct();
  const { data: product, isLoading: isLoadingProduct } = useProduct(productId);
  const { toast } = useToast();
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } =
    useSuppliers();
  const { data: onlineCategories = [] } = useOnlineCategories();
  const createOnlineCategory = useCreateOnlineCategory();

  // Initialize form with react-hook-form and zod resolver
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      barcode: "",
      category: undefined,
      online_categories: [],
      supplier: undefined,
      cost_price: "",
      wholesale_price: "",
      retail_price: "",
      wholesale_cutoff: 10,
      status: "active",
      minimum_stock: 10,
      gender: "UNISEX",
      designs: [],
    },
  });

  // State for designs
  const [designs, setDesigns] = useState<DesignVariant[]>([]);

  // State for galleries
  const [galleries, setGalleries] = useState<ColorGallery[]>([]);

  // State to track images that should be deleted from backend
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

  // State for material composition
  const [materialCompositions, setMaterialCompositions] = useState<MaterialComposition[]>([]);

  // State for who is this for
  const [whoIsThisFor, setWhoIsThisFor] = useState<WhoIsThisFor[]>([]);

  // State for features
  const [features, setFeatures] = useState<Feature[]>([]);

  // State for online category creation
  const [isCreatingOnlineCategory, setIsCreatingOnlineCategory] = useState(false);
  const [newOnlineCategoryName, setNewOnlineCategoryName] = useState("");
  const [newOnlineCategoryDescription, setNewOnlineCategoryDescription] = useState("");

  // Watch form values for dynamic updates
  const watchedGender = form.watch("gender");

  // Sync galleries with variants
  const syncGalleriesWithVariants = useCallback((currentGalleries: ColorGallery[], currentDesigns: DesignVariant[]) => {
    return currentDesigns.flatMap(design => design.colors.map(color => {
      const gallery = currentGalleries.find(
        item => item.designId === design.id && item.colorId === color.id
      );
      const imageTypes: ('PRIMARY' | 'SECONDARY' | 'THIRD' | 'FOURTH')[] = ['PRIMARY', 'SECONDARY', 'THIRD', 'FOURTH'];
      const existingImages = new Map();

      gallery?.images.forEach(img => {
        existingImages.set(img.imageType, img);
      });

      const completeImages = imageTypes.map(imageType => {
        return existingImages.get(imageType) || {
          id: Math.floor(Math.random() * 1000000),
          imageType: imageType,
          image: '',
          image_url: '',
          alt_text: '',
          file: null,
          preview: null,
        };
      });

      return {
        designId: design.id,
        colorId: color.id,
        designName: design.name,
        color: color.color,
        colorHex: color.colorHex,
        color_hax: color.colorHex,
        images: completeImages,
      };
    }));
  }, []);

  // Sync galleries when designs change
  useEffect(() => {
    if (designs.length > 0) {
      setGalleries(prevGalleries => syncGalleriesWithVariants(prevGalleries, designs));
    }
  }, [designs, syncGalleriesWithVariants]);

  // Load product data into form when available
  useEffect(() => {
    if (product) {
      console.log('Loading product data:', product);
      console.log('Product galleries:', product.galleries);
      // Set form values with proper type assertions
      form.reset({
        name: product.name,
        description: product.description || "",
        barcode: product.barcode || "",
        category: product.category?.id.toString(),
        online_categories: (product as any).online_categories?.map((cat: any) => cat.id.toString()) || [],
        supplier: product.supplier?.id.toString(),
        cost_price: product.cost_price.toString(),
        wholesale_price: product.wholesale_price?.toString() || "",
        retail_price: product.retail_price?.toString() || "",
        wholesale_cutoff: product.wholesale_cutoff || product.resolved_wholesale_cutoff || 10,
        status: product.is_active ? "active" : "inactive",
        minimum_stock: product.minimum_stock,
        gender: (product.gender || "UNISEX") as GenderType,
      });

      const designVariants: DesignVariant[] = (product.designs || []).map((design: any) => ({
          id: design.id.toString(),
          name: design.name,
          description: design.description,
          colors: design.colors.map((color: any) => ({
            id: color.id.toString(),
            color: color.color,
            colorHex: color.color_hax || "#000000",
            stock: color.stock,
          })),
        }));

      // Set designs
      if (product.designs) {
        setDesigns(designVariants);
      }

      // Load galleries
      if (product.galleries) {
        console.log('Loading galleries:', product.galleries);
        const loadedGalleries: ColorGallery[] = product.galleries.map((gallery: any) => {
          console.log('Processing gallery:', gallery);

          // Create a map of existing images by type for easy lookup
          const existingImages = new Map();
          if (gallery.images) {
            gallery.images.forEach((img: any) => {
              const previewUrl = img.image_url ? getImageUrl(img.image_url) : (img.image ? getImageUrl(img.image) : null);
              existingImages.set(img.imageType, {
                id: img.id,
                imageType: img.imageType,
                image: img.image,
                image_url: img.image_url,
                alt_text: img.alt_text,
                file: null,
                preview: previewUrl,
              });
            });
          }

          // Always create exactly 4 image slots
          const imageTypes: ('PRIMARY' | 'SECONDARY' | 'THIRD' | 'FOURTH')[] = ['PRIMARY', 'SECONDARY', 'THIRD', 'FOURTH'];
          const images = imageTypes.map(imageType => {
            return existingImages.get(imageType) || {
              id: Math.floor(Math.random() * 1000000),
              imageType: imageType,
              image: '',
              image_url: '',
              alt_text: '',
              file: null,
              preview: null,
            };
          });

          return {
            designId: String(gallery.design),
            colorId: designVariants
              .find(design => design.id === String(gallery.design))
              ?.colors.find(color => color.color.toLowerCase() === gallery.color.toLowerCase())
              ?.id || `${gallery.design}-${gallery.color}`,
            designName: gallery.design_name || "",
            color: gallery.color,
            colorHex: gallery.color_hax || "#000000",
            color_hax: gallery.color_hax,
            images: images,
          };
        });
        console.log('Loaded galleries:', loadedGalleries);
        setGalleries(loadedGalleries);
      }

      // Load material compositions
      if (product.material_composition) {
        const loadedMaterialCompositions: MaterialComposition[] = product.material_composition.map((item: any) => ({
          id: item.id,
          percentage: item.percentige,
          title: item.title,
        }));
        setMaterialCompositions(loadedMaterialCompositions);
      }

      // Load who is this for
      if (product.who_is_this_for) {
        const loadedWhoIsThisFor: WhoIsThisFor[] = product.who_is_this_for.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
        }));
        setWhoIsThisFor(loadedWhoIsThisFor);
      }

      // Load features
      if (product.features) {
        const loadedFeatures: Feature[] = product.features.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
        }));
        setFeatures(loadedFeatures);
      }
    }
  }, [product, form]);


  const addDesign = () => {
    const newDesign: DesignVariant = {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      colors: [],
    };
    setDesigns([...designs, newDesign]);
  };

  const updateDesignName = (id: string, name: string) => {
    setDesigns(
      designs.map((design) =>
        design.id === id ? { ...design, name } : design
      )
    );
  };

  const removeDesign = (id: string) => {
    setDesigns(designs.filter((design) => design.id !== id));
  };

  const addColorVariant = (designId: string) => {
    const availableColors = getAvailableColorsForDesign(designId);
    const firstAvailableColor = availableColors[0] || "Black";

    setDesigns(
      designs.map((design) =>
        design.id === designId
          ? {
            ...design,
            colors: [
              ...design.colors,
              {
                id: Math.random().toString(36).substr(2, 9),
                color: firstAvailableColor,
                colorHex: COLORS[firstAvailableColor as keyof typeof COLORS] || "#000000",
                stock: 0,
              },
            ],
          }
          : design
      )
    );
  };

  const updateColorVariant = (
    designId: string,
    colorId: string,
    field: keyof ColorVariant,
    value: string | number
  ) => {
    setDesigns(
      designs.map((design) =>
        design.id === designId
          ? {
            ...design,
            colors: design.colors.map((color) =>
              color.id === colorId ? { 
                ...color, 
                [field]: value,
                ...(field === 'color' && typeof value === 'string' ? { colorHex: COLORS[value as keyof typeof COLORS] || color.colorHex } : {})
              } : color
            ),
          }
          : design
      )
    );
  };

  const removeColorVariant = (designId: string, colorId: string) => {
    setDesigns(
      designs.map((design) =>
        design.id === designId
          ? {
            ...design,
            colors: design.colors.filter((color) => color.id !== colorId),
          }
          : design
      )
    );
  };

  const getAvailableColorsForDesign = (designId: string) => {
    const design = designs.find((d) => d.id === designId);
    if (!design) return Object.keys(COLORS);

    const usedColors = design.colors.map((c) => c.color.toLowerCase());
    return Object.keys(COLORS).filter((c) => !usedColors.includes(c.toLowerCase()));
  };

  // Online category functions
  const handleCreateOnlineCategory = async () => {
    if (!newOnlineCategoryName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCategory = await createOnlineCategory.mutateAsync({
        name: newOnlineCategoryName,
        description: newOnlineCategoryDescription,
      });

      form.setValue("online_categories", [
        ...(form.getValues("online_categories") || []),
        newCategory.id.toString(),
      ]);
      setNewOnlineCategoryName("");
      setNewOnlineCategoryDescription("");
      setIsCreatingOnlineCategory(false);

      toast({
        title: "Success",
        description: "Online category created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create online category",
        variant: "destructive",
      });
    }
  };

  const cancelCreateOnlineCategory = () => {
    setIsCreatingOnlineCategory(false);
    setNewOnlineCategoryName("");
    setNewOnlineCategoryDescription("");
  };

  // Material composition functions
  const addMaterialComposition = () => {
    const newItem: MaterialComposition = {
      id: Math.random().toString(36).substr(2, 9),
      percentage: 0,
      title: "",
    };
    setMaterialCompositions([...materialCompositions, newItem]);
  };

  const updateMaterialComposition = (id: string, field: keyof MaterialComposition, value: string | number) => {
    setMaterialCompositions(materialCompositions.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeMaterialComposition = (id: string) => {
    setMaterialCompositions(materialCompositions.filter(item => item.id !== id));
  };

  // Who is this for functions
  const addWhoIsThisFor = () => {
    const newItem: WhoIsThisFor = {
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      description: "",
    };
    setWhoIsThisFor([...whoIsThisFor, newItem]);
  };

  const updateWhoIsThisFor = (id: string, field: keyof WhoIsThisFor, value: string) => {
    setWhoIsThisFor(whoIsThisFor.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeWhoIsThisFor = (id: string) => {
    setWhoIsThisFor(whoIsThisFor.filter(item => item.id !== id));
  };

  // Features functions
  const addFeature = () => {
    const newItem: Feature = {
      id: Math.random().toString(36).substr(2, 9),
      title: "",
      description: "",
    };
    setFeatures([...features, newItem]);
  };

  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setFeatures(features.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeFeature = (id: string) => {
    setFeatures(features.filter(item => item.id !== id));
  };

  // Gallery functions
  const handleImageUpload = (galleryIndex: number, imageIndex: number, file: File) => {
    const newGalleries = [...galleries];
    const gallery = newGalleries[galleryIndex];
    if (gallery && gallery.images[imageIndex]) {
      const image = gallery.images[imageIndex];

      // If replacing an existing image (has id and image_url), mark it for deletion first
      if (image.id && image.image && !image.file) {
        // This is an existing image being replaced, mark it for deletion
        setImagesToDelete(prev => {
          // Only add if not already in the list
          if (!prev.includes(image.id)) {
            return [...prev, image.id];
          }
          return prev;
        });
      }

      // Revoke old preview URL if exists
      if (image.preview) {
        URL.revokeObjectURL(image.preview);
      }

      // Set the new file and preview
      image.file = file;
      image.preview = URL.createObjectURL(file);
      // Clear the old image URL since we're replacing it
      image.image = '';
      image.image_url = '';

      setGalleries(newGalleries);
    }
  };

  const removeImage = (galleryIndex: number, imageIndex: number) => {
    const newGalleries = [...galleries];
    const gallery = newGalleries[galleryIndex];
    if (gallery && gallery.images[imageIndex]) {
      const image = gallery.images[imageIndex];

      // If it's a new file upload, clear both file and preview
      if (image.file) {
        image.file = null;
        image.preview = null;
      } else if (image.id && image.image) {
        // If it's an existing image from backend, add to deletion list
        setImagesToDelete(prev => [...prev, image.id]);
        image.preview = null;
        image.image = '';
        image.image_url = '';
      } else {
        // If it's an empty slot, just clear the preview
        image.preview = null;
      }
      setGalleries(newGalleries);
    }
  };

  // Submit handler
  const onSubmit = async (data: ProductFormValues) => {
    try {
      const unnamedDesign = designs.find((design) => !design.name.trim());
      if (unnamedDesign) {
        toast({ title: "Design Name Required", description: "Every design must have a name.", variant: "destructive" });
        return;
      }
      const invalidColor = designs.flatMap((design) =>
        design.colors.map((color) => ({ design, color }))
      ).find(({ color }) => !color.color.trim() || !Number.isFinite(color.stock) || color.stock < 0);
      if (invalidColor) {
        toast({ title: "Invalid Color Variant", description: `Check color name and stock for ${invalidColor.design.name}.`, variant: "destructive" });
        return;
      }

      // Validate that at least one design exists
      if (designs.length === 0) {
        toast({
          title: "Design Required",
          description: "Please add at least one design",
          variant: "destructive",
        });
        return;
      }

      // Validate that each design has at least one color
      const invalidDesigns = designs.filter((d) => d.colors.length === 0);
      if (invalidDesigns.length > 0) {
        toast({
          title: "Color Required",
          description: `Please add at least one color for design ${invalidDesigns[0].name || "unnamed"}`,
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate design names
      const designNames = designs.map(d => d.name.toLowerCase());
      const duplicateDesigns = designNames.filter((name, index) => designNames.indexOf(name) !== index);
      if (duplicateDesigns.length > 0) {
        toast({
          title: "Duplicate Designs",
          description: "Each design must have a unique name",
          variant: "destructive",
        });
        return;
      }

      // Prepare the product data
      const productData = {
        name: data.name,
        description: data.description || "",
        barcode: data.barcode || undefined,
        category: parseInt(data.category),
        online_categories: data.online_categories?.map(id => parseInt(id)),
        supplier: data.supplier ? parseInt(data.supplier) : undefined,
        cost_price: parseFloat(data.cost_price),
        wholesale_price: parseFloat(data.wholesale_price),
        retail_price: parseFloat(data.retail_price),
        wholesale_cutoff: data.wholesale_cutoff,
        minimum_stock: data.minimum_stock,
        is_active: data.status === "active",
        gender: data.gender,
        designs: designs.map((design) => ({
          id: /^\d+$/.test(design.id) ? Number(design.id) : undefined,
          name: design.name,
          description: design.description || "",
          colors: design.colors.map((color) => ({
            id: /^\d+$/.test(color.id) ? Number(color.id) : undefined,
            color: color.color,
            color_hax: color.colorHex,
            stock: color.stock,
          })),
        })),
        material_composition: materialCompositions.map((item) => ({
          percentige: item.percentage,
          title: item.title || null,
        })),
        who_is_this_for: whoIsThisFor.map((item) => ({
          title: item.title || null,
          description: item.description || null,
        })),
        features: features.map((item) => ({
          title: item.title || null,
          description: item.description || null,
        })),
      };

      // Update the product with proper typing
      // Note: We don't include galleries data here to avoid deleting all existing galleries
      // Gallery updates (image deletion/upload) are handled separately below
      const updatedProduct = await updateProduct.mutateAsync({
        id: productId,
        ...productData,
      });

      // Delete images that were marked for deletion FIRST (before uploading new ones)
      if (imagesToDelete.length > 0) {
        try {
          const { galleryImagesApi } = await import('@/lib/api/inventory');
          await Promise.all(
            imagesToDelete.map(imageId =>
              galleryImagesApi.delete(imageId).catch(error => {
                console.error(`Error deleting image ${imageId}:`, error);
                return null; // Continue with other deletions even if one fails
              })
            )
          );
          console.log(`Successfully deleted ${imagesToDelete.length} images`);
        } catch (error) {
          console.error('Error deleting images:', error);
          toast({
            title: "Image Deletion Warning",
            description: "Product updated but some images failed to delete from server",
            variant: "default",
          });
        }
      }

      // Upload images for galleries that have new images (after deletion is complete)
      const galleriesWithImages = galleries.filter((g) =>
        g.images.some((img) => img.file !== null)
      );

      if (galleriesWithImages.length > 0) {
        for (const gallery of galleriesWithImages) {
          const imagesToUpload = gallery.images.filter((img) => img.file !== null);

          if (imagesToUpload.length > 0) {
            const persistedDesign = (updatedProduct.designs || []).find(
              design => design.name.trim().toLowerCase() === gallery.designName.trim().toLowerCase()
            );
            if (!persistedDesign) {
              throw new Error(`Updated design not found for gallery: ${gallery.designName}`);
            }
            const formData = new FormData();
            formData.append('design_id', String(persistedDesign.id));
            formData.append('color', gallery.color);
            formData.append('color_hax', gallery.color_hax || gallery.colorHex);
            formData.append('alt_text', gallery.color);

            imagesToUpload.forEach((img) => {
              if (img.file) {
                formData.append('images', img.file);
                // Send the imageType for each image so backend knows which type to assign
                formData.append('image_types', img.imageType);
              }
            });

            try {
              const { galleriesApi } = await import('@/lib/api/inventory');
              await galleriesApi.uploadColorImages(productId, formData);
            } catch (uploadError) {
                console.error(`Error uploading images for ${gallery.designName} / ${gallery.color}:`, uploadError);
              toast({
                title: "Image Upload Warning",
                description: `Product updated but some images for ${gallery.color} failed to upload`,
                variant: "default",
              });
            }
          }
        }
      }

      const hasImages = galleries.some((g) =>
        g.images.some((img) => img.file !== null)
      );

      const hasDeletedImages = imagesToDelete.length > 0;

      let description = "Product updated successfully";
      if (hasImages && hasDeletedImages) {
        description = "Product, images uploaded, and images deleted successfully";
      } else if (hasImages) {
        description = "Product and images updated successfully";
      } else if (hasDeletedImages) {
        description = "Product updated and images deleted successfully";
      }

      toast({
        title: "Product Updated",
        description: description,
      });

      router.push("/inventory/products");
    } catch (error) {
      toast({
        title: "Unable to Save Product",
        description: getApiErrorMessage(error, "Failed to update product. Please try again."),
        variant: "destructive",
      });
    }
  };

  const onInvalid = (errors: unknown) => {
    toast({
      title: "Missing or Invalid Fields",
      description: getFirstFormError(errors),
      variant: "destructive",
    });
  };

  if (isLoadingProduct || isLoadingCategories || isLoadingSuppliers) {
    return <ProductFormSkeleton />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground opacity-30" />
        <p className="text-xl font-medium text-muted-foreground">
          Product not found
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Update product information and inventory
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details of the product
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product barcode" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter product description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <HierarchicalCategorySelect
                        categories={categories}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select Category"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="online_categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Online Categories</FormLabel>
                      <div className="space-y-2">
                        {!isCreatingOnlineCategory ? (
                          <div className="space-y-2">
                            <FormControl>
                              <MultiOnlineCategorySelect
                                categories={onlineCategories}
                                values={field.value || []}
                                onValuesChange={field.onChange}
                                placeholder="Select online categories"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreatingOnlineCategory(true)}
                              className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Create New Online Category
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              placeholder="Category name"
                              value={newOnlineCategoryName}
                              onChange={(e) => setNewOnlineCategoryName(e.target.value)}
                            />
                            <Textarea
                              placeholder="Category description (optional)"
                              value={newOnlineCategoryDescription}
                              onChange={(e) => setNewOnlineCategoryDescription(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleCreateOnlineCategory}
                                disabled={createOnlineCategory.isPending}
                              >
                                {createOnlineCategory.isPending ? "Creating..." : "Create"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelCreateOnlineCategory}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={product.supplier?.id.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a supplier">
                              {product.supplier?.company_name}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem
                              key={supplier.id}
                              value={supplier.id.toString()}
                            >
                              {supplier.company_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing and Stock Card */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing and Stock</CardTitle>
              <CardDescription>
                Set the product pricing (Cost, Wholesale, Retail) and stock levels
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wholesale_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wholesale Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retail_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retail Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minimum_stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Stock Level</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="wholesale_cutoff"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wholesale Cutoff Qty</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="10"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value || "10", 10))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="discontinued">
                            Discontinued
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Designs & Colors Card */}
          <Card>
            <CardHeader>
              <CardTitle>Designs & Colors</CardTitle>
              <CardDescription>
                Manage product designs and their color variations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Who is this for? (Gender)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="UNISEX">Unisex</SelectItem>
                          <SelectItem value="KIDS">Kids</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Design Variations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Designs</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDesign}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Design
                  </Button>
                </div>

                {designs.map((design) => (
                  <Card key={design.id} className="p-4 bg-slate-50 dark:bg-slate-900 border-2">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <FormLabel>Design Name</FormLabel>
                          <Input
                            placeholder="e.g. Classic Slim Fit"
                            value={design.name}
                            onChange={(e) => updateDesignName(design.id, e.target.value)}
                            className="bg-white"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addColorVariant(design.id)}
                          className="mt-8 bg-white"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Color
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDesign(design.id)}
                          className="mt-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Color Variants for this Design */}
                      <div className="space-y-4 pl-4 border-l-2 border-slate-200">
                        {design.colors.map((color) => (
                          <div
                            key={color.id}
                            className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm"
                          >
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Color</FormLabel>
                              <Select
                                value={color.color}
                                onValueChange={(value) =>
                                  updateColorVariant(design.id, color.id, "color", value)
                                }
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.keys(COLORS).map((colorName) => (
                                    <SelectItem key={colorName} value={colorName}>
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-4 h-4 rounded-full border"
                                          style={{ backgroundColor: COLORS[colorName as keyof typeof COLORS] }}
                                        />
                                        {colorName}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>

                            <FormItem className="w-32">
                              <FormLabel className="text-xs">Stock</FormLabel>
                              <Input
                                type="number"
                                min="0"
                                className="h-9"
                                value={color.stock}
                                onChange={(e) =>
                                  updateColorVariant(
                                    design.id,
                                    color.id,
                                    "stock",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                              />
                            </FormItem>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeColorVariant(design.id, color.id)
                              }
                              className="mt-6 text-destructive h-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {design.colors.length === 0 && (
                          <p className="text-xs text-muted-foreground italic py-2">
                            No colors added yet. Click "Add Color" to begin.
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Material Composition Card */}
          <Card>
            <CardHeader>
              <CardTitle>Material Composition</CardTitle>
              <CardDescription>
                Define the material composition of the product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {materialCompositions.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Percentage"
                    value={item.percentage}
                    onChange={(e) => updateMaterialComposition(item.id, 'percentage', parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Input
                    placeholder="Material name"
                    value={item.title || ""}
                    onChange={(e) => updateMaterialComposition(item.id, 'title', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMaterialComposition(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMaterialComposition}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </CardContent>
          </Card>

          {/* Who Is This For Card */}
          <Card>
            <CardHeader>
              <CardTitle>Who Is This For</CardTitle>
              <CardDescription>
                Define the target audience for this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {whoIsThisFor.map((item, index) => (
                <div key={item.id} className="space-y-2">
                  <Input
                    placeholder="Title"
                    value={item.title || ""}
                    onChange={(e) => updateWhoIsThisFor(item.id, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="Description"
                    value={item.description || ""}
                    onChange={(e) => updateWhoIsThisFor(item.id, 'description', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeWhoIsThisFor(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWhoIsThisFor}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Target Audience
              </Button>
            </CardContent>
          </Card>

          {/* Product Features Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Features</CardTitle>
              <CardDescription>
                Define the key features of this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((item, index) => (
                <div key={item.id} className="space-y-2">
                  <Input
                    placeholder="Feature title"
                    value={item.title || ""}
                    onChange={(e) => updateFeature(item.id, 'title', e.target.value)}
                  />
                  <Textarea
                    placeholder="Feature description"
                    value={item.description || ""}
                    onChange={(e) => updateFeature(item.id, 'description', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeature(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </CardContent>
          </Card>

          {/* Product Gallery Card */}
          <Card>
            <CardHeader>
              <CardTitle>Product Gallery</CardTitle>
                <CardDescription>
                  Upload separate images for every design and color combination
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {galleries.map((gallery, galleryIndex) => (
                <div key={`${gallery.designId}-${gallery.colorId}`} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: gallery.color_hax || gallery.colorHex }}
                    />
                    <h4 className="font-medium">{gallery.designName} / {gallery.color}</h4>
                    <span className="text-sm text-muted-foreground">
                      ({gallery.images.filter(img => img.file || img.preview).length}/4 images)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gallery.images.map((image, imageIndex) => (
                      <div key={image.id} className="space-y-2">
                        <div className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden ${image.preview ? 'border-gray-300' :
                          imagesToDelete.includes(image.id) ? 'border-red-300 bg-red-50' :
                            'border-gray-300'
                          }`}>
                          {image.preview ? (
                            <div className="relative w-full h-full">
                              <img
                                src={image.preview}
                                alt={`${gallery.color} ${image.imageType.toLowerCase()}`}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0"
                                onClick={() => removeImage(galleryIndex, imageIndex)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : imagesToDelete.includes(image.id) ? (
                            <div className="text-center">
                              <X className="h-8 w-8 text-red-400 mx-auto mb-2" />
                              <p className="text-xs text-red-500">Will be deleted</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">{image.imageType}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          {!image.preview && !imagesToDelete.includes(image.id) && (
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(galleryIndex, imageIndex, file);
                                }
                              }}
                              className="text-xs"
                            />
                          )}
                          {image.preview && (
                            <div className="text-center">
                              <p className="text-xs text-green-600 font-medium">✓ Image loaded</p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => {
                                  const fileInput = document.createElement('input');
                                  fileInput.type = 'file';
                                  fileInput.accept = 'image/*';
                                  fileInput.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      handleImageUpload(galleryIndex, imageIndex, file);
                                    }
                                  };
                                  fileInput.click();
                                }}
                              >
                                Replace Image
                              </Button>
                            </div>
                          )}
                          {imagesToDelete.includes(image.id) && (
                            <div className="text-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full text-xs text-red-600 border-red-300"
                                onClick={() => {
                                  // Restore the image by removing it from deletion list
                                  setImagesToDelete(prev => prev.filter(id => id !== image.id));
                                  // Restore the image data if it exists
                                  if (image.image) {
                                    image.preview = getImageUrl(image.image_url || image.image);
                                  }
                                }}
                              >
                                Restore Image
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {galleries.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Add color variants to see gallery options</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" className="w-full md:w-auto">
              Update Product
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function ProductFormSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-10 w-[100px]" />
      </div>

      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
