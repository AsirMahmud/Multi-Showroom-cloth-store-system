"use client";

import { useState } from "react";
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
import { PageHeader, DataPanel } from "@/components/ui/professional";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PlusCircle, Trash2, Upload, X, Image as ImageIcon, Tag, Layers } from "lucide-react";
import {
  useCreateProduct,
  useCategories,
  useOnlineCategories,
  useCreateOnlineCategory,
  useSuppliers
} from "@/hooks/queries/useInventory";
import type { CreateProductDTO } from "@/types/inventory";
import { useToast } from "@/hooks/use-toast";

import { HierarchicalCategorySelect } from "@/components/inventory/hierarchical-category-select";
import { MultiOnlineCategorySelect } from "@/components/inventory/multi-online-category-select";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage, getFirstFormError } from "@/utils/form-error";

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
});

type ProductFormValues = z.infer<typeof productFormSchema>;

type DesignImage = {
  id: string;
  file: File | null;
  preview: string | null;
  imageType: 'PRIMARY' | 'SECONDARY' | 'THIRD' | 'FOURTH';
};

type DesignVariantItem = {
  id: string;
  name: string;
  description?: string;
  stock: number;
  images: DesignImage[];
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

const createDefaultImages = (): DesignImage[] => [
  { id: crypto.randomUUID(), file: null, preview: null, imageType: 'PRIMARY' },
  { id: crypto.randomUUID(), file: null, preview: null, imageType: 'SECONDARY' },
  { id: crypto.randomUUID(), file: null, preview: null, imageType: 'THIRD' },
  { id: crypto.randomUUID(), file: null, preview: null, imageType: 'FOURTH' },
];

const createDesignItem = (index: number): DesignVariantItem => ({
  id: crypto.randomUUID(),
  name: `Design ${index}`,
  stock: 0,
  images: createDefaultImages(),
});

export default function AddProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const { data: onlineCategories = [] } = useOnlineCategories();
  const createOnlineCategory = useCreateOnlineCategory();
  const { data: suppliers = [] } = useSuppliers();

  // Form setup
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

  // Automatically initialize with 1 design
  const [designs, setDesigns] = useState<DesignVariantItem[]>([createDesignItem(1)]);

  // State for additional product information
  const [materialCompositions, setMaterialCompositions] = useState<MaterialComposition[]>([]);
  const [whoIsThisFor, setWhoIsThisFor] = useState<WhoIsThisFor[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);

  // Function to add a new design with auto name, smooth scroll and focus
  const addDesign = () => {
    const nextIndex = designs.length + 1;
    const newDesign = createDesignItem(nextIndex);
    setDesigns(prev => [...prev, newDesign]);

    toast({
      title: `Design #${nextIndex} Added`,
      description: `Added "${newDesign.name}". Focus has shifted to the new design.`,
    });

    setTimeout(() => {
      const el = document.getElementById(`design-card-${newDesign.id}`);
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

  const updateDesignName = (id: string, name: string) => {
    setDesigns(designs.map(d => d.id === id ? { ...d, name } : d));
  };

  const updateDesignStock = (id: string, stock: number) => {
    setDesigns(designs.map(d => d.id === id ? { ...d, stock } : d));
  };

  const removeDesign = (id: string) => {
    if (designs.length <= 1) {
      toast({ title: "Design Required", description: "Product must have at least one design.", variant: "destructive" });
      return;
    }
    setDesigns(designs.filter(d => d.id !== id));
  };

  // Image handling per design
  const handleImageUpload = (designId: string, imageId: string, file: File) => {
    const preview = URL.createObjectURL(file);
    setDesigns(designs.map(d => {
      if (d.id === designId) {
        return {
          ...d,
          images: d.images.map(img => img.id === imageId ? { ...img, file, preview } : img)
        };
      }
      return d;
    }));
  };

  const handleImageRemove = (designId: string, imageId: string) => {
    setDesigns(designs.map(d => {
      if (d.id === designId) {
        return {
          ...d,
          images: d.images.map(img => {
            if (img.id === imageId) {
              if (img.preview) URL.revokeObjectURL(img.preview);
              return { ...img, file: null, preview: null };
            }
            return img;
          })
        };
      }
      return d;
    }));
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const unnamedDesign = designs.find((design) => !design.name.trim());
      if (unnamedDesign) {
        toast({ title: "Design Name Required", description: "Every design must have a valid name.", variant: "destructive" });
        return;
      }
      const duplicateDesign = designs.find((design, index) =>
        designs.findIndex((item) => item.name.trim().toLowerCase() === design.name.trim().toLowerCase()) !== index
      );
      if (duplicateDesign) {
        toast({ title: "Duplicate Design", description: `Design name "${duplicateDesign.name}" is already used.`, variant: "destructive" });
        return;
      }

      if (designs.length === 0) {
        toast({ title: "Designs Required", description: "Please add at least one design", variant: "destructive" });
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
          colors: [
            {
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

      const createdProduct = await createProduct.mutateAsync(productData);
      const uploadFailures: string[] = [];

      if (createdProduct?.id) {
        const createdDesigns = createdProduct.designs || [];
        for (const design of designs) {
          const imagesToUpload = design.images.filter(img => img.file !== null);
          if (imagesToUpload.length > 0) {
            const createdDesign = createdDesigns.find(
              cd => cd.name.trim().toLowerCase() === design.name.trim().toLowerCase()
            );
            if (!createdDesign) {
              throw new Error(`Created design not found for: ${design.name}`);
            }
            const formData = new FormData();
            formData.append('design_id', String(createdDesign.id));
            formData.append('color', 'Standard');
            formData.append('color_hax', '#FFFFFF');
            formData.append('alt_text', design.name);
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
              console.error(`Error uploading images for ${design.name}:`, err);
              uploadFailures.push(design.name);
            }
          }
        }
      }

      if (uploadFailures.length > 0) {
        toast({
          title: "Product created with image upload warnings",
          description: `Product #${createdProduct.id} was saved, but images failed for: ${uploadFailures.join(", ")}.`,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Success", description: "Product created successfully" });
      designs.forEach(d => d.images.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); }));
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
        description="Create a new product entry with auto-named designs and photos."
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
                        <Input placeholder="E.g. Premium Three Piece Saree" {...field} />
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
            <DataPanel title="Pricing & Profit Margins" description="Configure cost, wholesale, and retail pricing.">
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

                {/* Profit Margin Indicator */}
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
                          <span className="font-bold">Profit per item: </span>
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

          {/* Designs & Pictures Section */}
          <DataPanel
            title="Product Designs & Photos"
            description="Add one or more designs for this product. Design names are customizable and each design has its stock and photo gallery."
            actions={
              <Button
                data-testid="add-design"
                type="button"
                onClick={addDesign}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Another Design
              </Button>
            }
          >
            <div className="space-y-6">
              {designs.map((design, index) => (
                <div
                  key={design.id}
                  id={`design-card-${design.id}`}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Design Header Banner */}
                  <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                        #{index + 1}
                      </div>
                      <span className="font-bold text-sm tracking-wide text-white">
                        {design.name || `Design ${index + 1}`}
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
                          onClick={() => removeDesign(design.id)}
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
                          data-testid="design-name"
                          placeholder="e.g. Design 1, Floral Print, Blue Embroided"
                          value={design.name}
                          onChange={(e) => updateDesignName(design.id, e.target.value)}
                          className="bg-white font-semibold text-slate-900 border-slate-200 h-10 rounded-lg focus-visible:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <FormLabel className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-emerald-600" />
                          Initial Stock Quantity (স্টক পরিমাণ)
                        </FormLabel>
                        <Input
                          data-testid="design-stock"
                          type="number"
                          min="0"
                          placeholder="0"
                          value={design.stock}
                          onChange={(e) => updateDesignStock(design.id, parseInt(e.target.value || "0", 10))}
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
                          {design.images.filter(img => img.file).length} / 4 Uploaded
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {design.images.map((img) => (
                          <div
                            key={img.id}
                            className={`relative aspect-square rounded-2xl border-2 transition-all duration-200 overflow-hidden group shadow-xs ${
                              img.preview
                                ? "border-emerald-500 bg-slate-900"
                                : "border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/20"
                            }`}
                          >
                            {img.preview ? (
                              <>
                                <img
                                  src={img.preview}
                                  alt={design.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleImageRemove(design.id, img.id)}
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
                                    if (file) handleImageUpload(design.id, img.id, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        ))}
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
