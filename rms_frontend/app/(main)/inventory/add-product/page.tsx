"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { PageHeader, DataPanel } from "@/components/ui/professional";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PlusCircle, Trash2, ShoppingCart, Upload, X, Image as ImageIcon } from "lucide-react";
import {
  useCreateProduct,
  useCategories,
  useOnlineCategories,
  useCreateOnlineCategory,
  useSuppliers
} from "@/hooks/queries/useInventory";
import type { CreateProductDTO } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { HierarchicalCategorySelect } from "@/components/inventory/hierarchical-category-select";
import { MultiOnlineCategorySelect } from "@/components/inventory/multi-online-category-select";
import { ColorSelect } from "@/components/inventory/color-select";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage, getFirstFormError } from "@/utils/form-error";
import { COLORS } from "./constants";

// Define the form schema using Zod
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

// Define types for our designs and colors
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

// Define types for gallery images
type GalleryImage = {
  id: string;
  file: File | null;
  preview: string | null;
  imageType: 'PRIMARY' | 'SECONDARY' | 'THIRD' | 'FOURTH';
};

type ColorGallery = {
  designId: string;
  colorId: string;
  designName: string;
  color: string;
  colorHex: string;
  images: GalleryImage[];
};

// Additional product information types
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

export default function AddProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { toast } = useToast();
  const { data: categories = [], isLoading: isLoadingCategories } =
    useCategories();
  const { data: onlineCategories = [], isLoading: isLoadingOnlineCategories } =
    useOnlineCategories();
  const createOnlineCategory = useCreateOnlineCategory();
  const { data: suppliers = [], isLoading: isLoadingSuppliers } =
    useSuppliers();

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
      gender: undefined,
    },
  });

  // State for designs
  const [designs, setDesigns] = useState<DesignVariant[]>([]);

  // State for galleries (one per design-color combination)
  const [galleries, setGalleries] = useState<ColorGallery[]>([]);

  // State for additional product information
  const [materialCompositions, setMaterialCompositions] = useState<MaterialComposition[]>([]);
  const [whoIsThisFor, setWhoIsThisFor] = useState<WhoIsThisFor[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);

  // State for creating new online category
  const [isCreatingOnlineCategory, setIsCreatingOnlineCategory] = useState(false);
  const [newOnlineCategoryName, setNewOnlineCategoryName] = useState("");
  const [newOnlineCategoryDescription, setNewOnlineCategoryDescription] = useState("");

  // Function to add a new design
  const addDesign = () => {
    const newDesign: DesignVariant = {
      id: crypto.randomUUID(),
      name: "Default Design",
      colors: [],
    };
    setDesigns([...designs, newDesign]);
  };

  // Function to add a new color to a design
  const addColorVariant = (designId: string) => {
    const availableColors = getAvailableColorsForVariant(designId);
    const firstAvailableColor = availableColors[0] || "New Color";
    const colorHex = COLORS[firstAvailableColor as keyof typeof COLORS] || "#000000";

    setDesigns(
      designs.map((design) => {
        if (design.id === designId) {
          return {
            ...design,
            colors: [
              ...design.colors,
              {
                id: crypto.randomUUID(),
                color: firstAvailableColor,
                colorHex: colorHex,
                stock: 0,
              },
            ],
          };
        }
        return design;
      })
    );
  };

  const updateDesignName = (id: string, name: string) => {
    setDesigns(designs.map(d => d.id === id ? { ...d, name } : d));
  };

  const updateColorVariant = (designId: string, colorId: string, field: keyof ColorVariant, value: string | number) => {
    setDesigns(designs.map(d => {
      if (d.id === designId) {
        return {
          ...d,
          colors: d.colors.map(c => {
            if (c.id === colorId) {
              if (field === "color" && typeof value === "string") {
                return { ...c, color: value, colorHex: COLORS[value as keyof typeof COLORS] || "#000000" };
              }
              return { ...c, [field]: value };
            }
            return c;
          })
        };
      }
      return d;
    }));
  };

  const removeDesign = (id: string) => setDesigns(designs.filter(d => d.id !== id));
  const removeColorVariant = (designId: string, colorId: string) => {
    setDesigns(designs.map(d => {
      if (d.id === designId) {
        return { ...d, colors: d.colors.filter(c => c.id !== colorId) };
      }
      return d;
    }));
  };

  const getAvailableColorsForVariant = (designId: string) => {
    const design = designs.find(d => d.id === designId);
    if (!design) return Object.keys(COLORS);
    const used = design.colors.map(c => c.color.toLowerCase());
    return Object.keys(COLORS).filter(c => !used.includes(c.toLowerCase()));
  };

  // Image handling
  const handleImageUpload = (designId: string, colorId: string, imageId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setGalleries(galleries.map(g => {
      if (g.designId === designId && g.colorId === colorId) {
        return {
          ...g,
          images: g.images.map(img => img.id === imageId ? { ...img, file, preview } : img)
        };
      }
      return g;
    }));
  };



  // Sync one gallery for every design-color combination.
  const syncGalleriesWithVariants = useCallback(() => {
    setGalleries(current => designs.flatMap(design =>
      design.colors.map(color => {
        const existing = current.find(
          gallery => gallery.designId === design.id && gallery.colorId === color.id
        );
        return existing
          ? {
              ...existing,
              designName: design.name,
              color: color.color,
              colorHex: color.colorHex,
            }
          : {
              designId: design.id,
              colorId: color.id,
              designName: design.name,
              color: color.color,
              colorHex: color.colorHex,
              images: [
                { id: crypto.randomUUID(), file: null, preview: null, imageType: 'PRIMARY' as const },
                { id: crypto.randomUUID(), file: null, preview: null, imageType: 'SECONDARY' as const },
                { id: crypto.randomUUID(), file: null, preview: null, imageType: 'THIRD' as const },
                { id: crypto.randomUUID(), file: null, preview: null, imageType: 'FOURTH' as const },
              ],
            };
      })
    ));
  }, [designs]);

  useEffect(() => {
    syncGalleriesWithVariants();
  }, [designs]);

    const handleImageRemove = (designId: string, colorId: string, imageId: string) => {
      setGalleries(galleries.map((gallery) => {
        if (gallery.designId === designId && gallery.colorId === colorId) {
          return {
            ...gallery,
            images: gallery.images.map((img) => {
              if (img.id === imageId) {
                // Revoke preview URL if exists
                if (img.preview) {
                  URL.revokeObjectURL(img.preview);
                }
                return { ...img, file: null, preview: null };
              }
              return img;
            }),
          };
        }
        return gallery;
      }));
    };

    // Material Composition functions
  const addMaterialComposition = () => {
    setMaterialCompositions([...materialCompositions, { id: crypto.randomUUID(), percentage: 0, title: "" }]);
  };
  const updateMaterialComposition = (id: string, field: keyof MaterialComposition, value: string | number) => {
    setMaterialCompositions(materialCompositions.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const removeMaterialComposition = (id: string) => {
    setMaterialCompositions(materialCompositions.filter(item => item.id !== id));
  };

  const addWhoIsThisFor = () => {
    setWhoIsThisFor([...whoIsThisFor, { id: crypto.randomUUID(), title: "", description: "" }]);
  };
  const updateWhoIsThisFor = (id: string, field: keyof WhoIsThisFor, value: string) => {
    setWhoIsThisFor(whoIsThisFor.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const removeWhoIsThisFor = (id: string) => {
    setWhoIsThisFor(whoIsThisFor.filter(item => item.id !== id));
  };

  const addFeature = () => {
    setFeatures([...features, { id: crypto.randomUUID(), title: "", description: "" }]);
  };
  const updateFeature = (id: string, field: keyof Feature, value: string) => {
    setFeatures(features.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  const removeFeature = (id: string) => {
    setFeatures(features.filter(item => item.id !== id));
  };

  const handleCreateOnlineCategory = async () => {
    if (!newOnlineCategoryName.trim()) {
      toast({ title: "Name Required", description: "Please enter a category name", variant: "destructive" });
      return;
    }

    try {
      const newCategory = await createOnlineCategory.mutateAsync({
        name: newOnlineCategoryName.trim(),
        description: newOnlineCategoryDescription.trim() || undefined,
      });
      form.setValue("online_categories", [...(form.getValues("online_categories") || []), newCategory.id.toString()]);
      setNewOnlineCategoryName("");
      setNewOnlineCategoryDescription("");
      setIsCreatingOnlineCategory(false);
      toast({ title: "Success", description: "Online category created successfully" });
    } catch (error) {
      console.error("Error creating online category:", error);
      toast({ title: "Error", description: "Failed to create online category", variant: "destructive" });
    }
  };

  const cancelCreateOnlineCategory = () => {
    setIsCreatingOnlineCategory(false);
    setNewOnlineCategoryName("");
    setNewOnlineCategoryDescription("");
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const unnamedDesign = designs.find((design) => !design.name.trim());
      if (unnamedDesign) {
        toast({ title: "Design Name Required", description: "Every design must have a name.", variant: "destructive" });
        return;
      }
      const duplicateDesign = designs.find((design, index) =>
        designs.findIndex((item) => item.name.trim().toLowerCase() === design.name.trim().toLowerCase()) !== index
      );
      if (duplicateDesign) {
        toast({ title: "Duplicate Design", description: `Design name "${duplicateDesign.name}" is already used.`, variant: "destructive" });
        return;
      }
      const invalidColor = designs.flatMap((design) =>
        design.colors.map((color) => ({ design, color }))
      ).find(({ color }) => !color.color.trim() || !Number.isFinite(color.stock) || color.stock < 0);
      if (invalidColor) {
        toast({ title: "Invalid Color Variant", description: `Check color name and stock for ${invalidColor.design.name}.`, variant: "destructive" });
        return;
      }

      if (designs.length === 0) {
        toast({ title: "Designs Required", description: "Please add at least one design", variant: "destructive" });
        return;
      }

      const invalidDesigns = designs.filter(d => d.colors.length === 0);
      if (invalidDesigns.length > 0) {
        toast({ title: "Colors Required", description: `Please add at least one color for design ${invalidDesigns[0].name}`, variant: "destructive" });
        return;
      }

      const productData: CreateProductDTO = {
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
        designs: designs.map(d => ({
          name: d.name,
          description: d.description,
          colors: d.colors.map(c => ({
            color: c.color,
            color_hax: c.colorHex,
            stock: c.stock
          }))
        })),
        material_composition: materialCompositions.map(item => ({ percentige: item.percentage, title: item.title || null })),
        who_is_this_for: whoIsThisFor.map(item => ({ title: item.title || null, description: item.description || null })),
        features: features.map(item => ({ title: item.title || null, description: item.description || null })),
      };

      const createdProduct = await createProduct.mutateAsync(productData);
      const uploadFailures: string[] = [];

      if (createdProduct?.id) {
        const createdDesigns = createdProduct.designs || [];
        for (const gallery of galleries) {
          const imagesToUpload = gallery.images.filter(img => img.file !== null);
          if (imagesToUpload.length > 0) {
            const createdDesign = createdDesigns.find(
              design => design.name.trim().toLowerCase() === gallery.designName.trim().toLowerCase()
            );
            if (!createdDesign) {
              throw new Error(`Created design not found for gallery: ${gallery.designName}`);
            }
            const formData = new FormData();
            formData.append('design_id', String(createdDesign.id));
            formData.append('color', gallery.color);
            formData.append('color_hax', gallery.colorHex);
            formData.append('alt_text', gallery.color);
            imagesToUpload.forEach(img => {
              if (img.file) {
                formData.append('images', img.file);
                formData.append('image_types', img.imageType);
              }
            });

            try {
              const { galleriesApi } = await import('@/lib/api/inventory');
              await galleriesApi.uploadColorImages(createdProduct.id, formData);
            } catch (err) {
              console.error(`Error uploading images for ${gallery.designName} / ${gallery.color}:`, err);
              uploadFailures.push(`${gallery.designName} / ${gallery.color}`);
            }
          }
        }
      }

      if (uploadFailures.length > 0) {
        toast({
          title: "Product created with image upload errors",
          description: `Product #${createdProduct.id} was saved, but images failed for: ${uploadFailures.join(", ")}. You can retry from Edit Product.`,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Success", description: "Product created successfully" });
      galleries.forEach(g => g.images.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); }));
      router.push("/inventory/products");
    } catch (error) {
      console.error("Error creating product:", error);
      toast({ title: "Unable to Save Product", description: getApiErrorMessage(error, "Failed to create product"), variant: "destructive" });
    }
  };

const onInvalid = (errors: unknown) => {
    toast({
      title: "Missing or Invalid Fields",
      description: getFirstFormError(errors),
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-8">
        <PageHeader
          title="Add New Product"
          description="Create a new product entry in the global inventory system."
          icon={<PlusCircle className="h-6 w-6" />}
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Information */}
              <DataPanel title="Product Information" description="Enter basic details about your product.">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g. Premium Silk Saree" {...field} />
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
                          <Textarea placeholder="Describe your product..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            testId="product-category-select"
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="gender-select">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MALE">Male</SelectItem>
                              <SelectItem value="FEMALE">Female</SelectItem>
                              <SelectItem value="UNISEX">Unisex</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="online_categories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Online Categories</FormLabel>
                        <FormControl>
                          <MultiOnlineCategorySelect
                            categories={onlineCategories}
                            values={field.value}
                            onValuesChange={field.onChange}
                            placeholder="Select Online Categories"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </DataPanel>

              {/* Pricing Information */}
              <DataPanel title="Pricing & Profit Margins" description="Configure cost, wholesale, and retail pricing model.">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price (৳)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                          <FormLabel>Wholesale Price (৳)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                          <FormLabel>Retail Price (৳)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Real-time Profit Margin Indicator */}
                  {(() => {
                    const cost = parseFloat(form.watch("cost_price") || "0");
                    const retail = parseFloat(form.watch("retail_price") || "0");
                    if (cost > 0 && retail > cost) {
                      const profit = retail - cost;
                      const marginPct = ((profit / retail) * 100).toFixed(1);
                      const markupPct = ((profit / cost) * 100).toFixed(1);
                      return (
                        <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
                          <div>
                            <span className="font-bold">Estimated Profit per item: </span>
                            <span className="font-mono font-bold text-emerald-700">৳ {profit.toFixed(2)}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="bg-emerald-600 text-white font-bold">Margin: {marginPct}%</Badge>
                            <Badge variant="outline" className="border-emerald-600 text-emerald-700 font-bold">Markup: {markupPct}%</Badge>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

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
                </div>
              </DataPanel>
            </div>

            {/* Designs & Variations Section */}
            <DataPanel
              title="Designs & Color Variations"
              description="Manage designs and their respective color variations with 100+ standard and custom colors."
              actions={
                <Button data-testid="add-design" type="button" variant="outline" size="sm" onClick={addDesign} className="border-brand-primary/10 hover:bg-brand-primary/5 text-brand-primary">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Design
                </Button>
              }
            >
              <div className="space-y-6">
                {designs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 border-2 border-dashed border-slate-200/80 rounded-xl bg-slate-50/50">
                    <p className="text-sm mb-3">No designs added yet. Click below to create your first design and color variations.</p>
                    <Button type="button" size="sm" onClick={addDesign} className="bg-brand-primary text-white">
                      <PlusCircle className="mr-2 h-4 w-4" /> Create First Design
                    </Button>
                  </div>
                ) : (
                  designs.map((design) => (
                    <div key={design.id} className="p-4 rounded-xl bg-slate-50 border border-brand-primary/10 space-y-4 shadow-xs">
                      <div className="flex items-start justify-between gap-4">
                        <FormItem className="flex-1">
                          <FormLabel className="font-semibold text-slate-700">Design Name</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="design-name"
                              placeholder="Design Name (e.g. Floral Embroidery, Solid Standard)"
                              value={design.name}
                              onChange={(e) => updateDesignName(design.id, e.target.value)}
                              className="bg-white"
                            />
                          </FormControl>
                        </FormItem>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeDesign(design.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 mt-7">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4 pl-4 border-l-2 border-brand-primary/20">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Colors & Stock Inventory</h4>
                          <Button data-testid="add-color" type="button" variant="outline" size="sm" onClick={() => addColorVariant(design.id)} className="border-brand-primary/20 hover:bg-brand-primary/10 text-brand-primary h-7 text-xs">
                            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Add Color
                          </Button>
                        </div>

                        {design.colors.map((color) => (
                          <div key={color.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                            <FormItem className="sm:col-span-2">
                              <FormLabel className="text-xs text-slate-500 font-semibold">Select Color (100+ Available)</FormLabel>
                              <ColorSelect
                                value={color.color}
                                valueHex={color.colorHex}
                                availableColors={getAvailableColorsForVariant(design.id)}
                                onSelect={(name, hex) => {
                                  updateColorVariant(design.id, color.id, "color", name);
                                }}
                              />
                            </FormItem>
                            <div className="flex items-end gap-2">
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs text-slate-500 font-semibold">Initial Stock</FormLabel>
                                <Input
                                  data-testid="color-stock"
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={color.stock}
                                  onChange={(e) => updateColorVariant(design.id, color.id, "stock", parseInt(e.target.value || "0", 10))}
                                />
                              </FormItem>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeColorVariant(design.id, color.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 shrink-0 h-10 w-10 p-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DataPanel>

            {/* Gallery Section - Moved here for better flow */}
            <DataPanel title="Design & Color Media" description="Upload a separate image gallery for every design and color combination.">
              <div className="space-y-8">
                {galleries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm">Add a color to your designs to enable image uploads.</p>
                  </div>
                ) : (
                  galleries.map((gallery) => (
                    <div key={`${gallery.designId}-${gallery.colorId}`} className="space-y-4 p-4 rounded-2xl bg-slate-50/50 border border-brand-primary/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: gallery.colorHex }} />
                          <h4 className="font-bold text-lg capitalize text-brand-primary">
                            {gallery.designName} / {gallery.color}
                          </h4>
                        </div>
                        <Badge variant="outline" className="bg-brand-primary/5 text-brand-primary border-brand-primary/10">
                          {gallery.images.filter(img => img.file).length} / 4 Images
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
                        {gallery.images.map((img) => (
                          <div key={img.id} className="relative aspect-square rounded-xl border-2 border-dashed border-brand-primary/10 overflow-hidden group hover:border-brand-primary/30 transition-all bg-white shadow-sm">
                            {img.preview ? (
                              <>
                                <img src={img.preview} alt={gallery.color} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleImageRemove(gallery.designId, gallery.colorId, img.id)}
                                    className="p-2 bg-rose-500 rounded-full text-white shadow-lg hover:bg-rose-600 transform hover:scale-110 transition-all"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-white font-bold uppercase tracking-wider">
                                  {img.imageType}
                                </div>
                              </>
                            ) : (
                              <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-brand-primary/5 transition-all">
                                <Upload className="h-6 w-6 text-brand-primary/30 group-hover:text-brand-primary/50 group-hover:scale-110 transition-all" />
                                <span className="text-[10px] text-brand-primary/40 mt-2 uppercase font-bold tracking-widest">{img.imageType}</span>
                                <input
                                  data-testid={`gallery-file-${gallery.designName}-${gallery.color}-${img.imageType}`}
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageUpload(gallery.designId, gallery.colorId, img.id, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DataPanel>

            <div className="flex justify-end gap-4 pb-10">
              <Button type="button" variant="outline" onClick={() => router.back()} className="border-brand-primary/10 text-brand-primary hover:bg-slate-50">Cancel</Button>
              <Button data-testid="save-product" type="submit" disabled={createProduct.isPending} className="bg-brand-primary hover:bg-emerald-900 text-brand-secondary shadow-lg shadow-brand-primary/20">
                {createProduct.isPending ? "Creating..." : "Save Product"}
              </Button>
            </div>
          </form>
        </Form>
    </div>
  );
}
