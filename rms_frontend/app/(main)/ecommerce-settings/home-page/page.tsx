"use client";

import { useState, useEffect } from "react";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useHomePageSettings, useUpdateHomePageSettings } from "@/hooks/queries/useEcommerce";
import { cn } from "@/lib/utils";

interface HomePageSettings {
  id?: number;
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
      const helperUrlFields = new Set(["logo_image_url", "hero_primary_image_url", "hero_secondary_image_url"]);

      Object.keys(settings).forEach((key) => {
        const value = settings[key as keyof HomePageSettings];
        const isHelperUrlField = helperUrlFields.has(key);
        const isImageField = key === "logo_image" || key === "hero_primary_image" || key === "hero_secondary_image";

        if (value && typeof value === "string" && !isHelperUrlField && !isImageField) {
          formData.append(key, value);
        }
      });

      const maybeAppendFile = (field: keyof HomePageSettings) => {
        const v = settings[field as keyof HomePageSettings] as any;
        if (v instanceof File) formData.append(field as string, v);
      };
      maybeAppendFile("logo_image");
      maybeAppendFile("hero_primary_image");
      maybeAppendFile("hero_secondary_image");

      const updated = await updateSettingsMutation.mutateAsync(formData);
      if (updated) setSettings(updated as HomePageSettings);

      toast({ title: "Protocol Updated", description: "Global storefront configurations synchronized successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to synchronize configurations.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (field: 'logo_image' | 'hero_primary_image' | 'hero_secondary_image') => {
    setSaving(true);
    try {
      const formData = new FormData();
      const flagMap: Record<string, string> = {
        logo_image: 'remove_logo_image',
        hero_primary_image: 'remove_hero_primary_image',
        hero_secondary_image: 'remove_hero_secondary_image',
      };
      formData.append(flagMap[field], 'true');
      await updateSettingsMutation.mutateAsync(formData);
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
        title="Storefront Architect"
        description="Configure the primary landing page, brand identity, and global footer matrix."
        icon={<Home className="h-6 w-6" />}
        actions={
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-6 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Sync Storefront
          </Button>
        }
      />

      <motion.div variants={item}>
        <DataPanel title="Global Configuration" description="Manage the visual and structural data of your ecommerce landing page.">
          <Tabs defaultValue="logo" className="w-full">
            <TabsList className="flex bg-slate-50 p-1.5 rounded-2xl border-none mb-8">
              <TabsTrigger value="logo" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><ImageIcon className="h-3 w-3 mr-2" /> Identity</TabsTrigger>
              <TabsTrigger value="hero" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><Layout className="h-3 w-3 mr-2" /> Hero Matrix</TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><BarChart3 className="h-3 w-3 mr-2" /> Metrics</TabsTrigger>
              <TabsTrigger value="footer" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest py-3 transition-all"><Globe className="h-3 w-3 mr-2" /> Footer</TabsTrigger>
            </TabsList>

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
