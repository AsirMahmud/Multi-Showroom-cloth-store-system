"use client";

import { useState, useEffect } from "react";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  Upload,
  Image as ImageIcon,
  Type,
  Save,
  Globe,
  Layout,
  BarChart3,
  MapPin,
  Trash2,
  Loader2,
  CheckCircle2,
  Package,
  Grid2x2,
  ShoppingBag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHomePageSettings, useUpdateHomePageSettings } from "@/hooks/queries/useEcommerce";
import { cn } from "@/lib/utils";

interface HomePageSettings {
  id?: number;
  min_product_buying_count?: number;
  min_order_amount?: number;
  logo_image?: string;
  logo_image_url?: string;
  logo_text?: string;
  footer_tagline?: string;
  footer_address?: string;
  footer_phone?: string;
  footer_email?: string;
  footer_facebook_url?: string;
  footer_instagram_url?: string;
  footer_twitter_url?: string;
  footer_github_url?: string;
  footer_map_embed_url?: string;
  hero_badge_text?: string;
  hero_heading_line1?: string;
  hero_heading_line2?: string;
  hero_heading_line3?: string;
  hero_heading_line4?: string;
  hero_heading_line5?: string;
  hero_description?: string;
  hero_primary_image?: string;
  hero_primary_image_url?: string;
  hero_secondary_image?: string;
  hero_secondary_image_url?: string;
  stat_brands?: string;
  stat_products?: string;
  stat_customers?: string;
  collage_enabled?: boolean;
  collage_badge_text?: string;
  collage_heading?: string;
  collage_description?: string;
  collage_card_1_title?: string;
  collage_card_1_subtitle?: string;
  collage_card_1_link?: string;
  collage_card_1_image?: File | string;
  collage_card_1_image_url?: string;
  collage_card_2_title?: string;
  collage_card_2_subtitle?: string;
  collage_card_2_link?: string;
  collage_card_2_image?: File | string;
  collage_card_2_image_url?: string;
  collage_card_3_title?: string;
  collage_card_3_subtitle?: string;
  collage_card_3_link?: string;
  collage_card_3_image?: File | string;
  collage_card_3_image_url?: string;
  collage_card_4_title?: string;
  collage_card_4_subtitle?: string;
  collage_card_4_link?: string;
  collage_card_4_image?: File | string;
  collage_card_4_image_url?: string;
}

// Framer motion variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const collageImageFields = [
  "collage_card_1_image",
  "collage_card_2_image",
  "collage_card_3_image",
  "collage_card_4_image",
] as const;

export default function HomePageSettingsPage() {
  const [settings, setSettings] = useState<HomePageSettings>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const { data: homePageSettings, isLoading } = useHomePageSettings();
  const updateSettingsMutation = useUpdateHomePageSettings();

  useEffect(() => {
    if (homePageSettings) {
      setSettings(homePageSettings);
    }
  }, [homePageSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      const helperUrlFields = new Set([
        "logo_image_url",
        "hero_primary_image_url",
        "hero_secondary_image_url",
        "collage_card_1_image_url",
        "collage_card_2_image_url",
        "collage_card_3_image_url",
        "collage_card_4_image_url",
      ]);

      Object.keys(settings).forEach((key) => {
        const value = settings[key as keyof HomePageSettings];
        const isHelperUrlField = helperUrlFields.has(key);
        const isImageField =
          key === "logo_image" ||
          key === "hero_primary_image" ||
          key === "hero_secondary_image" ||
          collageImageFields.includes(key as typeof collageImageFields[number]);

        if (typeof value === "string" && !isHelperUrlField && !isImageField) {
          formData.append(key, value);
        }
        if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        }
      });

      const maybeAppendFile = (field: keyof HomePageSettings) => {
        const v = settings[field as keyof HomePageSettings] as any;
        if (v instanceof File) formData.append(field as string, v);
      };
      maybeAppendFile("logo_image");
      maybeAppendFile("hero_primary_image");
      maybeAppendFile("hero_secondary_image");
      maybeAppendFile("collage_card_1_image");
      maybeAppendFile("collage_card_2_image");
      maybeAppendFile("collage_card_3_image");
      maybeAppendFile("collage_card_4_image");

      const updated = await updateSettingsMutation.mutateAsync(formData);
      if (updated) setSettings(updated as HomePageSettings);

      toast({ title: "Protocol Updated", description: "Global storefront configurations synchronized successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to synchronize configurations.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (
    field:
      | 'logo_image'
      | 'hero_primary_image'
      | 'hero_secondary_image'
      | 'collage_card_1_image'
      | 'collage_card_2_image'
      | 'collage_card_3_image'
      | 'collage_card_4_image'
  ) => {
    setSaving(true);
    try {
      const formData = new FormData();
      const flagMap: Record<string, string> = {
        logo_image: 'remove_logo_image',
        hero_primary_image: 'remove_hero_primary_image',
        hero_secondary_image: 'remove_hero_secondary_image',
        collage_card_1_image: 'remove_collage_card_1_image',
        collage_card_2_image: 'remove_collage_card_2_image',
        collage_card_3_image: 'remove_collage_card_3_image',
        collage_card_4_image: 'remove_collage_card_4_image',
      };
      formData.append(flagMap[field], 'true');
      const updated = await updateSettingsMutation.mutateAsync(formData);
      if (updated) setSettings(updated as HomePageSettings);
      toast({ title: 'Resource Terminated', description: 'Visual asset removed from core stream.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to terminate resource.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const normalizeMapEmbedValue = (value: string) => {
    if (!value) return value;
    if (value.includes("<iframe")) {
      const match = value.match(/src=["']([^"']+)["']/);
      if (match && match[1]) return match[1];
    }
    return value;
  };

  const handleChange = (field: keyof HomePageSettings, value: string) => {
    let nextValue = value;
    if (field === "footer_map_embed_url") nextValue = normalizeMapEmbedValue(value);
    setSettings(prev => ({ ...prev, [field]: nextValue }));
  };

  const handleImageChange = (field: string, file: File | null) => {
    if (file) setSettings(prev => ({ ...prev, [field]: file as any }));
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-[600px] rounded-[32px]" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      <PageHeader
        title="Home page"
        description="Update your storefront branding, landing content, business highlights, and footer."
        icon={<Home className="h-6 w-6" />}
        actions={
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-6 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save changes
          </Button>
        }
      />

      <motion.div variants={item}>
        <DataPanel title="Global Configuration" description="Manage the visual and structural data of your ecommerce landing page.">
          <Tabs defaultValue="logo" className="w-full">
            <TabsList className="flex bg-slate-50 p-1.5 rounded-2xl border-none mb-8">
              <TabsTrigger value="logo" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><ImageIcon className="h-3 w-3 mr-2" /> Identity</TabsTrigger>
              <TabsTrigger value="hero" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><Layout className="h-3 w-3 mr-2" /> Hero Matrix</TabsTrigger>
              <TabsTrigger value="collage" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><Grid2x2 className="h-3 w-3 mr-2" /> Category Collage</TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><BarChart3 className="h-3 w-3 mr-2" /> Metrics</TabsTrigger>
              <TabsTrigger value="ordering" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><ShoppingBag className="h-3 w-3 mr-2" /> Ordering Rules</TabsTrigger>
              <TabsTrigger value="footer" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><Globe className="h-3 w-3 mr-2" /> Footer</TabsTrigger>
            </TabsList>

            <TabsContent value="ordering" className="space-y-8 focus-visible:outline-none">
              <div className="bg-slate-50/70 border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Product Purchase Limits & Ordering Rules</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Control minimum buying count and total order thresholds for customers purchasing from the online store.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Minimum Product Buying Count (Quantity)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={settings.min_product_buying_count ?? 1}
                      onChange={(e) => handleChange('min_product_buying_count', Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="1"
                      className="h-12 rounded-xl bg-white border border-slate-200 font-bold"
                    />
                    <p className="text-[11px] font-medium text-slate-400 ml-1">
                      Customers will not be allowed to place an order with fewer than this total number of items.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                      Minimum Order Total Amount (৳ BDT)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={settings.min_order_amount ?? 0}
                      onChange={(e) => handleChange('min_order_amount', Math.max(0, parseFloat(e.target.value) || 0))}
                      placeholder="0.00"
                      className="h-12 rounded-xl bg-white border border-slate-200 font-bold"
                    />
                    <p className="text-[11px] font-medium text-slate-400 ml-1">
                      Customers must meet or exceed this order subtotal (in BDT) to checkout. Set 0 for no minimum amount limit.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logo" className="space-y-8 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Brand Designation (Text)</Label>
                    <Input
                      value={settings.logo_text || ''}
                      onChange={(e) => handleChange('logo_text', e.target.value)}
                      placeholder="e.g. MODERNA RETAIL"
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Symbolic Identity (Logo)</Label>
                    <div className="flex flex-col gap-4">
                      {settings.logo_image_url && (
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-slate-100 bg-white group">
                          <img src={settings.logo_image_url} alt="Logo" className="w-full h-full object-contain p-4" />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => handleDeleteImage('logo_image')}
                            className="absolute top-2 right-2 h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="relative group">
                        <input
                          id="logo_image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange('logo_image', e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <Label htmlFor="logo_image" className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-brand-primary/20 hover:bg-slate-50 transition-all">
                          <Upload className="h-6 w-6 text-slate-300 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Logo</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-[32px] p-8 flex flex-col items-center justify-center border border-brand-primary/5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Preview Identity</div>
                  <div className="flex items-center gap-3">
                    {settings.logo_image_url ? <img src={settings.logo_image_url} className="h-10 w-10 object-contain" alt="" /> : <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse" />}
                    <span className="text-xl font-black tracking-tighter text-brand-primary">{settings.logo_text || "STOREFRONT"}</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hero" className="space-y-8 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Accent Badge</Label>
                    <Input value={settings.hero_badge_text || ''} onChange={(e) => handleChange('hero_badge_text', e.target.value)} placeholder="e.g. SEASONAL 2024" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <div key={num} className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Heading Vector {num}</Label>
                        <Input
                          value={settings[`hero_heading_line${num}` as keyof HomePageSettings] as string || ''}
                          onChange={(e) => handleChange(`hero_heading_line${num}` as keyof HomePageSettings, e.target.value)}
                          placeholder={`Line ${num}`}
                          className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Narrative Summary</Label>
                    <Textarea value={settings.hero_description || ''} onChange={(e) => handleChange('hero_description', e.target.value)} placeholder="Core value proposition..." className="rounded-xl bg-slate-50 border-none font-medium min-h-[120px]" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Primary Asset</Label>
                      {settings.hero_primary_image_url && (
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-100 group">
                          <img src={settings.hero_primary_image_url} alt="" className="w-full h-full object-cover" />
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteImage('hero_primary_image')} className="absolute top-2 right-2 h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                      <input id="hero_primary_image" type="file" onChange={(e) => handleImageChange('hero_primary_image', e.target.files?.[0] || null)} className="hidden" />
                      <Label htmlFor="hero_primary_image" className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all"><Upload className="h-4 w-4 text-slate-300" /></Label>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Secondary Asset</Label>
                      {settings.hero_secondary_image_url && (
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-100 group">
                          <img src={settings.hero_secondary_image_url} alt="" className="w-full h-full object-cover" />
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteImage('hero_secondary_image')} className="absolute top-2 right-2 h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                      <input id="hero_secondary_image" type="file" onChange={(e) => handleImageChange('hero_secondary_image', e.target.files?.[0] || null)} className="hidden" />
                      <Label htmlFor="hero_secondary_image" className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all"><Upload className="h-4 w-4 text-slate-300" /></Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="collage" className="space-y-8 focus-visible:outline-none">
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-3xl border border-brand-primary/10 bg-slate-50 p-6">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section visibility</Label>
                    <p className="text-sm font-semibold text-slate-600">Enable the curated category collage on the storefront home page.</p>
                  </div>
                  <Switch
                    checked={Boolean(settings.collage_enabled)}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, collage_enabled: checked }))}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Badge text</Label>
                      <Input
                        value={settings.collage_badge_text || ""}
                        onChange={(e) => handleChange("collage_badge_text", e.target.value)}
                        placeholder="e.g. Curated for you"
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Section heading</Label>
                      <Input
                        value={settings.collage_heading || ""}
                        onChange={(e) => handleChange("collage_heading", e.target.value)}
                        placeholder="e.g. Category collage"
                        className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Section description</Label>
                      <Textarea
                        value={settings.collage_description || ""}
                        onChange={(e) => handleChange("collage_description", e.target.value)}
                        placeholder="Optional supporting copy for the collage section..."
                        className="rounded-xl bg-slate-50 border-none font-medium min-h-[110px]"
                      />
                    </div>
                  </div>

                  <div className="rounded-[32px] border border-brand-primary/5 bg-[#f7f1eb] p-6">
                    <div className="mb-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#b7773c]">
                        {settings.collage_badge_text || "Curated for you"}
                      </p>
                      {settings.collage_heading ? (
                        <h3 className="mt-2 text-2xl font-black tracking-tight text-brand-primary">{settings.collage_heading}</h3>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative row-span-2 min-h-[280px] overflow-hidden rounded-[24px] bg-white">
                        {settings.collage_card_1_image_url ? (
                          <img src={settings.collage_card_1_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-slate-200" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                          <p className="text-lg font-black">{settings.collage_card_1_title || "Card one"}</p>
                          <p className="text-xs uppercase tracking-widest text-white/80">{settings.collage_card_1_subtitle || "Shop now"}</p>
                        </div>
                      </div>
                      <div className="relative min-h-[134px] overflow-hidden rounded-[24px] bg-white">
                        {settings.collage_card_2_image_url ? (
                          <img src={settings.collage_card_2_image_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-slate-200" />
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                          <p className="text-sm font-black">{settings.collage_card_2_title || "Card two"}</p>
                          <p className="text-[10px] uppercase tracking-widest text-white/80">{settings.collage_card_2_subtitle || "Discover"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative min-h-[134px] overflow-hidden rounded-[24px] bg-white">
                          {settings.collage_card_3_image_url ? (
                            <img src={settings.collage_card_3_image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-slate-200" />
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                            <p className="text-sm font-black">{settings.collage_card_3_title || "Card three"}</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/80">{settings.collage_card_3_subtitle || "Explore"}</p>
                          </div>
                        </div>
                        <div className="relative min-h-[134px] overflow-hidden rounded-[24px] bg-white">
                          {settings.collage_card_4_image_url ? (
                            <img src={settings.collage_card_4_image_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-slate-200" />
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                            <p className="text-sm font-black">{settings.collage_card_4_title || "Card four"}</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/80">{settings.collage_card_4_subtitle || "Browse"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {[
                    { index: 1, titleField: "collage_card_1_title", subtitleField: "collage_card_1_subtitle", linkField: "collage_card_1_link", imageField: "collage_card_1_image", imageUrlField: "collage_card_1_image_url", label: "Large left card" },
                    { index: 2, titleField: "collage_card_2_title", subtitleField: "collage_card_2_subtitle", linkField: "collage_card_2_link", imageField: "collage_card_2_image", imageUrlField: "collage_card_2_image_url", label: "Top right card" },
                    { index: 3, titleField: "collage_card_3_title", subtitleField: "collage_card_3_subtitle", linkField: "collage_card_3_link", imageField: "collage_card_3_image", imageUrlField: "collage_card_3_image_url", label: "Bottom right card A" },
                    { index: 4, titleField: "collage_card_4_title", subtitleField: "collage_card_4_subtitle", linkField: "collage_card_4_link", imageField: "collage_card_4_image", imageUrlField: "collage_card_4_image_url", label: "Bottom right card B" },
                  ].map((card) => (
                    <div key={card.index} className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</Label>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          value={settings[card.titleField as keyof HomePageSettings] as string || ""}
                          onChange={(e) => handleChange(card.titleField as keyof HomePageSettings, e.target.value)}
                          placeholder="Title"
                          className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                        />
                        <Input
                          value={settings[card.subtitleField as keyof HomePageSettings] as string || ""}
                          onChange={(e) => handleChange(card.subtitleField as keyof HomePageSettings, e.target.value)}
                          placeholder="Subtitle"
                          className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                        />
                        <Input
                          value={settings[card.linkField as keyof HomePageSettings] as string || ""}
                          onChange={(e) => handleChange(card.linkField as keyof HomePageSettings, e.target.value)}
                          placeholder="/category/women or /products?gender=women"
                          className="h-11 rounded-xl bg-slate-50 border-none font-bold"
                        />
                        <div className="space-y-3">
                          {settings[card.imageUrlField as keyof HomePageSettings] ? (
                            <div className="relative h-40 overflow-hidden rounded-2xl border border-slate-100 group">
                              <img
                                src={settings[card.imageUrlField as keyof HomePageSettings] as string}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteImage(card.imageField as any)}
                                className="absolute top-2 right-2 h-7 w-7 rounded-lg opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : null}
                          <input
                            id={card.imageField}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(card.imageField, e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <Label
                            htmlFor={card.imageField}
                            className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 transition-all hover:bg-slate-50"
                          >
                            <Upload className="h-4 w-4 text-slate-300" />
                            <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Upload image</span>
                          </Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-8 focus-visible:outline-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl">
                {[
                  { id: 'stat_brands', label: 'Global Brands', icon: <CheckCircle2 className="w-4 h-4 text-brand-primary" />, placeholder: '200+' },
                  { id: 'stat_products', label: 'Active SKUs', icon: <Package className="w-4 h-4 text-brand-primary" />, placeholder: '2,000+' },
                  { id: 'stat_customers', label: 'Registered Users', icon: <BarChart3 className="w-4 h-4 text-brand-primary" />, placeholder: '30,000+' },
                ].map((stat) => (
                  <div key={stat.id} className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-brand-primary/5">
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</Label>
                    </div>
                    <Input
                      value={settings[stat.id as keyof HomePageSettings] as string || ''}
                      onChange={(e) => handleChange(stat.id as keyof HomePageSettings, e.target.value)}
                      placeholder={stat.placeholder}
                      className="h-12 rounded-xl bg-white border-none font-black text-xl shadow-sm text-brand-primary"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="footer" className="space-y-8 focus-visible:outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Footer Tagline</Label>
                    <Input value={settings.footer_tagline || ''} onChange={(e) => handleChange('footer_tagline', e.target.value)} placeholder="Modern retail excellence..." className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fulfillment Hub Address</Label>
                    <Textarea value={settings.footer_address || ''} onChange={(e) => handleChange('footer_address', e.target.value)} placeholder="123 Retail Lane..." className="rounded-xl bg-slate-50 border-none font-medium min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Support Phone</Label>
                      <Input value={settings.footer_phone || ''} onChange={(e) => handleChange('footer_phone', e.target.value)} placeholder="+880..." className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Official Email</Label>
                      <Input value={settings.footer_email || ''} onChange={(e) => handleChange('footer_email', e.target.value)} placeholder="ops@shop.com" className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Social Connectivity Matrix</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {['facebook', 'instagram', 'twitter', 'github'].map((platform) => (
                        <div key={platform} className="space-y-1">
                          <Label className="text-[9px] font-bold text-slate-300 uppercase ml-1">{platform}</Label>
                          <Input
                            value={settings[`footer_${platform}_url` as keyof HomePageSettings] as string || ''}
                            onChange={(e) => handleChange(`footer_${platform}_url` as keyof HomePageSettings, e.target.value)}
                            placeholder={`https://${platform}.com/...`}
                            className="h-10 rounded-lg bg-slate-50 border-none font-bold text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2"><MapPin className="w-3 h-3"/> Geolocation Embed Vector</Label>
                    <Input value={settings.footer_map_embed_url || ''} onChange={(e) => handleChange('footer_map_embed_url', e.target.value)} placeholder="Paste Google Maps iframe src..." className="h-12 rounded-xl bg-slate-50 border-none font-bold text-xs" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DataPanel>
      </motion.div>
    </motion.div>
  );
}
