"use client";

import { useState, useEffect } from "react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { PlusCircle, Trash2, ArrowLeft, Upload, X, Image as ImageIcon, Tag, Layers } from "lucide-react";
import {
  useUpdateProduct,
  useProduct,
  useCategories,
  useSuppliers,
  useOnlineCategories,
} from "@/hooks/queries/useInventory";
import type { CreateProductDTO } from "@/types/inventory";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { HydrationWrapper } from "@/components/hydration-wrapper";
import { HierarchicalCategorySelect } from "@/components/inventory/hierarchical-category-select";
import { MultiOnlineCategorySelect } from "@/components/inventory/multi-online-category-select";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/utils";
import { getApiErrorMessage, getFirstFormError } from "@/utils/form-error";

type GenderType = "MALE" | "FEMALE" | "UNISEX";

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
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type DesignImage = {
  id?: number | string;
  image?: string;
  image_url?: string;
  file: File | null;
  preview: string | null;
  imageType: 'PRIMARY' | 'SECONDARY' | 'THIRD' | 'FOURTH';
};

type EditDesignItem = {
  id?: number | string;
  name: string;
  description?: string;
  stock: number;
  variationId?: number;
  images: DesignImage[];
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

const createDefaultImages = (): DesignImage[] => [
  { id: crypto.randomUUID(), file: null, preview: null, imageType: 'PRIMARY' },
  { id: crypto.randomUUID(), file: null, preview: null, imageType: 'SECONDARY' },
  { id: crypto.randomUUID(), file: null, preview: null, imageType: 'THIRD' },
  { id: crypto.randomUUID(), file: null, preview: null, imageType: 'FOURTH' },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = typeof params.id === "string" ? parseInt(params.id) : 0;
  const updateProduct = useUpdateProduct();
  const { data: product, isLoading: isLoadingProduct } = useProduct(productId);
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const { data: suppliers = [] } = useSuppliers();
  const { data: onlineCategories = [] } = useOnlineCategories();

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
    },
  });

  const [designs, setDesigns] = useState<EditDesignItem[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [materialCompositions, setMaterialCompositions] = useState<MaterialComposition[]>([]);
  const [whoIsThisFor, setWhoIsThisFor] = useState<WhoIsThisFor[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);

  // Load existing product details into form & designs state
  useEffect(() => {
    if (product) {
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

      if (product.designs && product.designs.length > 0) {
        const loadedDesigns: EditDesignItem[] = product.designs.map((design: any) => {
          const firstColor = design.colors && design.colors.length > 0 ? design.colors[0] : null;
          const stock = firstColor ? firstColor.stock : 0;
          const variationId = firstColor ? firstColor.id : undefined;

          // Find gallery matching this design
          const gallery = (product.galleries || []).find((g: any) => g.design === design.id || g.design_name === design.name);
          const existingMap = new Map();
          if (gallery && gallery.images) {
            gallery.images.forEach((img: any) => {
              const previewUrl = img.image_url ? getImageUrl(img.image_url) : (img.image ? getImageUrl(img.image) : null);
              existingMap.set(img.imageType, {
                id: img.id,
                imageType: img.imageType,
                image: img.image,
                image_url: img.image_url,
                file: null,
                preview: previewUrl,
              });
            });
          }

          const imageTypes: ('PRIMARY' | 'SECONDARY' | 'THIRD' | 'FOURTH')[] = ['PRIMARY', 'SECONDARY', 'THIRD', 'FOURTH'];
          const images: DesignImage[] = imageTypes.map(t => existingMap.get(t) || {
            id: crypto.randomUUID(),
            imageType: t,
            file: null,
            preview: null,
          });

          return {
            id: design.id,
            name: design.name,
            description: design.description,
            stock,
            variationId,
            images,
          };
        });
        setDesigns(loadedDesigns);
      } else {
        setDesigns([{
          id: crypto.randomUUID(),
          name: "Design 1",
          stock: product.stock_quantity || 0,
          images: createDefaultImages(),
        }]);
      }

      if (product.material_composition) {
        setMaterialCompositions(product.material_composition.map((m: any) => ({
          id: m.id?.toString() || crypto.randomUUID(),
          percentage: m.percentige,
          title: m.title || "",
        })));
      }

      if (product.who_is_this_for) {
        setWhoIsThisFor(product.who_is_this_for.map((w: any) => ({
          id: w.id?.toString() || crypto.randomUUID(),
          title: w.title || "",
          description: w.description || "",
        })));
      }

      if (product.features) {
        setFeatures(product.features.map((f: any) => ({
          id: f.id?.toString() || crypto.randomUUID(),
          title: f.title || "",
          description: f.description || "",
        })));
      }
    }
  }, [product, form]);

  const addDesign = () => {
    const nextIndex = designs.length + 1;
    const newId = crypto.randomUUID();
    const newDesignName = `Design ${nextIndex}`;
    setDesigns(prev => [...prev, {
      id: newId,
      name: newDesignName,
      stock: 0,
      images: createDefaultImages(),
    }]);

    toast({
      title: `Design #${nextIndex} Added`,
      description: `Added "${newDesignName}". Focus has shifted to the new design.`,
    });

    setTimeout(() => {
      const el = document.getElementById(`design-card-${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el.querySelector<HTMLInputElement>('input[data-testid="design-name"]');
        if (input) {
          input.focus();
          input.select();
        }
      }
    }, 100);
  };

  const updateDesignName = (index: number, name: string) => {
    setDesigns(designs.map((d, i) => i === index ? { ...d, name } : d));
  };

  const updateDesignStock = (index: number, stock: number) => {
    setDesigns(designs.map((d, i) => i === index ? { ...d, stock } : d));
  };

  const removeDesign = (index: number) => {
    if (designs.length <= 1) {
      toast({ title: "Design Required", description: "Product must have at least one design.", variant: "destructive" });
      return;
    }
    setDesigns(designs.filter((_, i) => i !== index));
  };

  const handleImageUpload = (designIndex: number, imageIndex: number, file: File) => {
    const newDesigns = [...designs];
    const targetDesign = newDesigns[designIndex];
    if (targetDesign && targetDesign.images[imageIndex]) {
      const img = targetDesign.images[imageIndex];

      if (typeof img.id === 'number' && img.image && !img.file) {
        setImagesToDelete(prev => prev.includes(img.id as number) ? prev : [...prev, img.id as number]);
      }

      if (img.preview && img.file) {
        URL.revokeObjectURL(img.preview);
      }

      img.file = file;
      img.preview = URL.createObjectURL(file);
      img.image = '';
      img.image_url = '';
      setDesigns(newDesigns);
    }
  };

  const handleImageRemove = (designIndex: number, imageIndex: number) => {
    const newDesigns = [...designs];
    const targetDesign = newDesigns[designIndex];
    if (targetDesign && targetDesign.images[imageIndex]) {
      const img = targetDesign.images[imageIndex];
      if (img.file) {
        if (img.preview) URL.revokeObjectURL(img.preview);
        img.file = null;
        img.preview = null;
      } else if (typeof img.id === 'number' && img.image) {
        setImagesToDelete(prev => [...prev, img.id as number]);
        img.preview = null;
        img.image = '';
        img.image_url = '';
      }
      setDesigns(newDesigns);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const unnamedDesign = designs.find(d => !d.name.trim());
      if (unnamedDesign) {
        toast({ title: "Design Name Required", description: "Every design must have a valid name.", variant: "destructive" });
        return;
      }

      if (imagesToDelete.length > 0) {
        try {
          const { galleriesApi } = await import('@/lib/api/inventory');
          await Promise.all(imagesToDelete.map(id => galleriesApi.deleteImage(id)));
        } catch (err) {
          console.error("Error deleting old images:", err);
        }
      }

      const updateData: Partial<CreateProductDTO> = {
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
          id: typeof d.id === 'number' ? d.id : undefined,
          name: d.name,
          description: d.description,
          colors: [
            {
              id: d.variationId,
              color: "Standard",
              color_hax: "#FFFFFF",
              stock: d.stock || 0
            }
          ]
        })),
        material_composition: materialCompositions.map(item => ({ percentige: item.percentage, title: item.title || null })),
        who_is_this_for: whoIsThisFor.map(item => ({ title: item.title || null, description: item.description || null })),
        features: features.map(item => ({ title: item.title || null, description: item.description || null })),
      };

      const updatedProduct = await updateProduct.mutateAsync({ id: productId, ...updateData });

      if (updatedProduct?.id) {
        const updatedDesigns = updatedProduct.designs || [];
        for (const design of designs) {
          const newFilesToUpload = design.images.filter(img => img.file !== null);
          if (newFilesToUpload.length > 0) {
            const matchedDesign = updatedDesigns.find(
              ud => ud.name.trim().toLowerCase() === design.name.trim().toLowerCase()
            );
            if (matchedDesign) {
              const formData = new FormData();
              formData.append('design_id', String(matchedDesign.id));
              formData.append('color', 'Standard');
              formData.append('color_hax', '#FFFFFF');
              formData.append('alt_text', design.name);
              newFilesToUpload.forEach(img => {
                if (img.file) {
                  formData.append('images', img.file);
                  formData.append('image_types', img.imageType);
                }
              });

              try {
                const { galleriesApi } = await import('@/lib/api/inventory');
                await galleriesApi.uploadColorImages(updatedProduct.id, formData);
              } catch (err) {
                console.error(`Error uploading images for ${design.name}:`, err);
              }
            }
          }
        }
      }

      toast({ title: "Success", description: "Product updated successfully" });
      router.push("/inventory/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast({ title: "Unable to Save Changes", description: getApiErrorMessage(error, "Failed to update product"), variant: "destructive" });
    }
  };

  const onInvalid = (errors: unknown) => {
    toast({
      title: "Missing or Invalid Fields",
      description: getFirstFormError(errors),
      variant: "destructive",
    });
  };

  if (isLoadingProduct) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <HydrationWrapper>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        </div>

        <PageHeader
          title={`Edit Product: ${product?.name || ""}`}
          description="Update product details, design stock, and photos."
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Info */}
              <DataPanel title="Product Information" description="Basic product metadata.">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Textarea {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
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

              {/* Pricing Info */}
              <DataPanel title="Pricing Information" description="Update prices and margins.">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price (৳)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
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
                            <Input type="number" step="0.01" {...field} />
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
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

            {/* Designs & Pictures Section */}
            <DataPanel
              title="Product Designs & Photos"
              description="Manage product designs, stock quantities, and design photo galleries."
              actions={
                <Button
                  type="button"
                  onClick={addDesign}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Another Design
                </Button>
              }
            >
              <div className="space-y-6">
                {designs.map((design, dIdx) => (
                  <div
                    key={design.id || dIdx}
                    id={`design-card-${design.id}`}
                    className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {/* Design Header Banner */}
                    <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                          #{dIdx + 1}
                        </div>
                        <span className="font-bold text-sm tracking-wide text-white">
                          {design.name || `Design ${dIdx + 1}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold text-xs">
                          Stock: {design.stock || 0} pcs
                        </Badge>
                        {designs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDesign(dIdx)}
                            className="h-8 px-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition-all"
                            title="Remove Design"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="text-xs font-semibold">Remove</span>
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Design Inputs */}
                    <div className="p-5 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="space-y-1.5">
                          <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-emerald-600" />
                            Design Name (ডিজাইনের নাম)
                          </FormLabel>
                          <Input
                            placeholder="e.g. Design 1, Floral Print, Blue Embroided"
                            value={design.name}
                            onChange={(e) => updateDesignName(dIdx, e.target.value)}
                            className="bg-white font-semibold text-slate-900 border-slate-200 h-10 rounded-lg focus-visible:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-emerald-600" />
                            Stock Quantity (স্টক পরিমাণ)
                          </FormLabel>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={design.stock}
                            onChange={(e) => updateDesignStock(dIdx, parseInt(e.target.value || "0", 10))}
                            className="bg-white font-semibold text-slate-900 border-slate-200 h-10 rounded-lg focus-visible:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Photos Grid */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <FormLabel className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <ImageIcon className="h-4 w-4 text-emerald-600" /> Design Gallery Photos
                          </FormLabel>
                          <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-bold text-[11px]">
                            {design.images.filter(img => img.preview || img.image_url || img.image).length} / 4 Uploaded
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {design.images.map((img, imgIdx) => {
                            const displaySrc = img.preview || (img.image_url ? getImageUrl(img.image_url) : (img.image ? getImageUrl(img.image) : null));
                            return (
                              <div
                                key={img.id || imgIdx}
                                className={`relative aspect-square rounded-2xl border-2 transition-all duration-200 overflow-hidden group shadow-xs ${
                                  displaySrc
                                    ? "border-emerald-500 bg-slate-900"
                                    : "border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/20"
                                }`}
                              >
                                {displaySrc ? (
                                  <>
                                    <img
                                      src={displaySrc}
                                      alt={design.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleImageRemove(dIdx, imgIdx)}
                                        className="p-2.5 bg-rose-600 hover:bg-rose-700 rounded-full text-white shadow-lg transform hover:scale-110 transition-all"
                                        title="Remove Photo"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <div className="absolute top-2 left-2 flex items-center gap-1">
                                      <Badge className="bg-slate-900/80 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-white border-0">
                                        {img.imageType === "PRIMARY" ? "★ Main Cover" : img.imageType}
                                      </Badge>
                                    </div>
                                  </>
                                ) : (
                                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-3 text-center">
                                    <div className="h-9 w-9 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-300 transition-all">
                                      <Upload className="h-4 w-4" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700 mt-2">
                                      {img.imageType === "PRIMARY" ? "Primary Photo" : `${img.imageType} Photo`}
                                    </span>
                                    <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Click to upload</span>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(dIdx, imgIdx, file);
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Bottom Add Design Button Bar */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addDesign}
                  className="w-full py-6 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <PlusCircle className="h-5 w-5 text-emerald-600" />
                  <span>Add Another Design Option</span>
                </Button>
              </div>
            </DataPanel>

            <div className="flex justify-end gap-4 pb-10">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={updateProduct.isPending} className="bg-brand-primary hover:bg-emerald-900 text-brand-secondary">
                {updateProduct.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </HydrationWrapper>
  );
}
