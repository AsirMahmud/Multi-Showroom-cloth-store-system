"use client";

import { useState, useEffect } from "react";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
    CalendarIcon,
    Trash2,
    Edit,
    Plus,
    Loader2,
    Image as ImageIcon,
    Target,
    Zap,
    Clock,
    Layout,
    Palette,
    X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { promotionalModalsApi, type PromotionalModal } from "@/lib/api/ecommerce";

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

export function PromotionalModalManager() {
    const [modals, setModals] = useState<PromotionalModal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { toast } = useToast();

    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        discount_code: string;
        cta_text: string;
        cta_url: string;
        image: File | null;
        imagePreview: string | null;
        layout: string;
        color_theme: string;
        trigger: string;
        delay_seconds: number;
        frequency: string;
        start_date: Date | undefined;
        end_date: Date | undefined;
        is_active: boolean;
    }>({
        title: "",
        description: "",
        discount_code: "",
        cta_text: "Shop Now",
        cta_url: "",
        image: null,
        imagePreview: null,
        layout: "centered",
        color_theme: "light",
        trigger: "timer",
        delay_seconds: 5,
        frequency: "once_per_session",
        start_date: new Date(),
        end_date: new Date(new Date().setDate(new Date().getDate() + 7)),
        is_active: true,
    });

    const fetchModals = async () => {
        setIsLoading(true);
        try {
            const data = await promotionalModalsApi.getAll();
            setModals(data);
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch promotions.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchModals();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file),
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            discount_code: "",
            cta_text: "Shop Now",
            cta_url: "",
            image: null,
            imagePreview: null,
            layout: "centered",
            color_theme: "light",
            trigger: "timer",
            delay_seconds: 5,
            frequency: "once_per_session",
            start_date: new Date(),
            end_date: new Date(new Date().setDate(new Date().getDate() + 7)),
            is_active: true,
        });
        setEditingId(null);
    };

    const handleEdit = (modal: PromotionalModal) => {
        setEditingId(modal.id);
        setFormData({
            title: modal.title,
            description: modal.description || "",
            discount_code: modal.discount_code || "",
            cta_text: modal.cta_text,
            cta_url: modal.cta_url || "",
            image: null,
            imagePreview: modal.image_url,
            layout: modal.layout,
            color_theme: modal.color_theme,
            trigger: modal.display_rules?.trigger || "timer",
            delay_seconds: modal.display_rules?.delay_seconds || 5,
            frequency: modal.display_rules?.frequency || "once_per_session",
            start_date: new Date(modal.start_date),
            end_date: new Date(modal.end_date),
            is_active: modal.is_active,
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await promotionalModalsApi.delete(id);
            toast({ title: "Success", description: "Promotion deleted successfully." });
            fetchModals();
        } catch (error) {
            toast({ title: "Error", description: "Delete failed.", variant: "destructive" });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.start_date || !formData.end_date) {
            toast({ title: "Warning", description: "Title and dates are required.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const displayRules = {
            trigger: formData.trigger,
            delay_seconds: Number(formData.delay_seconds),
            frequency: formData.frequency,
        };

        const modalData = {
            title: formData.title,
            description: formData.description,
            discount_code: formData.discount_code,
            cta_text: formData.cta_text,
            cta_url: formData.cta_url,
            layout: formData.layout,
            color_theme: formData.color_theme,
            start_date: formData.start_date.toISOString(),
            end_date: formData.end_date.toISOString(),
            is_active: formData.is_active,
            display_rules: displayRules,
            image: formData.image || undefined,
        };

        try {
            if (editingId) {
                await promotionalModalsApi.update({ id: editingId, ...modalData });
                toast({ title: "Updated", description: "Promotion updated successfully." });
            } else {
                await promotionalModalsApi.create(modalData);
                toast({ title: "Created", description: "New promotion created." });
            }
            setIsDialogOpen(false);
            resetForm();
            fetchModals();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save protocol.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <PageHeader
                title="Promotions"
                description="Create and manage popups to boost sales and engage customers."
                icon={<Target className="h-6 w-6" />}
                actions={
                    <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-4 bg-brand-primary text-brand-secondary hover:bg-emerald-900 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-brand-primary/20">
                                <Plus className="h-3.5 w-3.5 mr-2" />
                                Add Popup
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl rounded-[32px] border-brand-primary/5 shadow-2xl p-0 overflow-hidden">
                            <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-brand-primary">
                                    {editingId ? "Edit Popup" : "Create New Popup"}
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Set how and when your popup appears.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Popup Title</Label>
                                        <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. FLASH SALE" className="h-12 rounded-xl bg-slate-50 border-none font-bold" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discount Code</Label>
                                        <Input value={formData.discount_code} onChange={(e) => setFormData({ ...formData, discount_code: e.target.value })} placeholder="e.g. SAVE20" className="h-12 rounded-xl bg-slate-50 border-none font-black text-emerald-600" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</Label>
                                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter the text for your popup..." className="rounded-xl bg-slate-50 border-none font-medium min-h-[100px]" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Button Text</Label>
                                        <Input value={formData.cta_text} onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })} className="h-12 rounded-xl bg-slate-50 border-none font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target URL</Label>
                                        <Input value={formData.cta_url} onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })} placeholder="/shop/now" className="h-12 rounded-xl bg-slate-50 border-none font-bold text-blue-600" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Layout className="h-3 w-3"/> Layout Style</Label>
                                        <Select value={formData.layout} onValueChange={(val) => setFormData({ ...formData, layout: val })}>
                                            <SelectTrigger className="h-10 bg-white border-none rounded-xl font-bold text-[10px] uppercase tracking-widest">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-brand-primary/5">
                                                <SelectItem value="centered" className="font-bold text-[10px] uppercase">Centered</SelectItem>
                                                <SelectItem value="split-left" className="font-bold text-[10px] uppercase">Split (Image Left)</SelectItem>
                                                <SelectItem value="split-right" className="font-bold text-[10px] uppercase">Split (Image Right)</SelectItem>
                                                <SelectItem value="full-cover" className="font-bold text-[10px] uppercase">Full Cover</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Palette className="h-3 w-3"/> Color Theme</Label>
                                        <Select value={formData.color_theme} onValueChange={(val) => setFormData({ ...formData, color_theme: val })}>
                                            <SelectTrigger className="h-10 bg-white border-none rounded-xl font-bold text-[10px] uppercase tracking-widest">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-brand-primary/5">
                                                <SelectItem value="light" className="font-bold text-[10px] uppercase">Luminous (Light)</SelectItem>
                                                <SelectItem value="dark" className="font-bold text-[10px] uppercase">Shadow (Dark)</SelectItem>
                                                <SelectItem value="brand" className="font-bold text-[10px] uppercase">Brand Style</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Display Rules</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase">When to show</Label>
                                            <Select value={formData.trigger} onValueChange={(val) => setFormData({ ...formData, trigger: val })}>
                                                <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl font-bold text-[10px] uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-brand-primary/5">
                                                    <SelectItem value="timer">After a few seconds</SelectItem>
                                                    <SelectItem value="exit_intent">When leaving page</SelectItem>
                                                    <SelectItem value="first_visit">On first visit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {formData.trigger === "timer" && (
                                            <div className="space-y-2">
                                                <Label className="text-[9px] font-bold text-slate-400 uppercase">Delay (S)</Label>
                                                <Input type="number" value={formData.delay_seconds} onChange={(e) => setFormData({ ...formData, delay_seconds: parseInt(e.target.value) })} className="h-10 bg-slate-50 border-none rounded-xl font-black" />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Frequency</Label>
                                            <Select value={formData.frequency} onValueChange={(val) => setFormData({ ...formData, frequency: val })}>
                                                <SelectTrigger className="h-10 bg-slate-50 border-none rounded-xl font-bold text-[10px] uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-brand-primary/5">
                                                    <SelectItem value="once_per_session">Once per session</SelectItem>
                                                    <SelectItem value="once_ever">Only once ever</SelectItem>
                                                    <SelectItem value="always">Show every time</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full h-12 justify-start rounded-xl border-none bg-slate-50 font-bold text-xs">
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-brand-primary" />
                                                    {formData.start_date ? format(formData.start_date, "PPP") : <span>Select Date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl border-brand-primary/5 shadow-2xl">
                                                <Calendar mode="single" selected={formData.start_date} onSelect={(date) => setFormData({ ...formData, start_date: date })} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className="w-full h-12 justify-start rounded-xl border-none bg-slate-50 font-bold text-xs">
                                                    <CalendarIcon className="mr-2 h-4 w-4 text-brand-primary" />
                                                    {formData.end_date ? format(formData.end_date, "PPP") : <span>Select Date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-2xl border-brand-primary/5 shadow-2xl">
                                                <Calendar mode="single" selected={formData.end_date} onSelect={(date) => setFormData({ ...formData, end_date: date })} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-black uppercase tracking-tight text-emerald-900">Active Status</Label>
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Turn this promotion on or off</p>
                                    </div>
                                    <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                                </div>
                            </form>

                            <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
                                <Button variant="ghost" type="button" onClick={() => setIsDialogOpen(false)} className="font-black text-[10px] uppercase tracking-widest">Cancel</Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-brand-primary text-brand-secondary font-black text-[10px] uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg">
                                    {isSubmitting && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                                    Save Promotion
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <motion.div variants={item}>
                <DataPanel title="Our Promotions" description="List of all active and past promotional popups.">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[32px]" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {modals.map((modal) => (
                                    <motion.div
                                        key={modal.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="group relative overflow-hidden bg-white rounded-[32px] border border-brand-primary/5 shadow-sm hover:shadow-xl transition-all duration-500"
                                    >
                                        {modal.image_url && (
                                            <div className="relative h-40 w-full overflow-hidden">
                                                <Image src={modal.image_url} alt={modal.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            </div>
                                        )}
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-black tracking-tighter text-brand-primary uppercase">{modal.title}</h3>
                                                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest mt-1 border-none", modal.is_active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-400")}>
                                                        {modal.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(modal)} className="h-8 w-8 rounded-lg hover:bg-slate-50"><Edit className="h-3.5 w-3.5 text-slate-400" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(modal.id)} className="h-8 w-8 rounded-lg hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5 text-rose-400" /></Button>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed italic">"{modal.description}"</p>
                                                
                                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-50">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Trigger</span>
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                            <Zap className="h-3 w-3 text-brand-primary" />
                                                            {modal.display_rules.trigger}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Frequency</span>
                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                            <Clock className="h-3 w-3 text-brand-primary" />
                                                            {modal.display_rules.frequency.split('_').join(' ')}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Active Dates</span>
                                                        <span className="text-[10px] font-black text-slate-500 uppercase">
                                                            {format(new Date(modal.start_date), "MMM d")} — {format(new Date(modal.end_date), "MMM d, yyyy")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                        <span className="text-[9px] font-black text-brand-primary uppercase">{modal.layout}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {modals.length === 0 && (
                                <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50">
                                    <Target className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Promotions Found</h3>
                                    <p className="text-xs text-slate-300 font-bold mt-1 uppercase tracking-tighter">Create your first promotional popup to start.</p>
                                </div>
                            )}
                        </div>
                    )}
                </DataPanel>
            </motion.div>
        </motion.div>
    );
}
