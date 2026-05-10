"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateCategory } from "@/hooks/queries/useInventory";
import { useToast } from "@/components/ui/use-toast";
import { PageHeader, DataPanel } from "@/components/ui/professional";
import { Tag, Plus, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddCategoryPage() {
  const router = useRouter();
  const createCategory = useCreateCategory();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const response = await createCategory.mutateAsync(values);

      if (!response) {
        toast({
          variant: "destructive",
          title: "Provisioning Error",
          description: "The system failed to map the new category node.",
        });
        return;
      }

      toast({
        title: "Node Mapped",
        description: "The organizational category has been successfully initialized.",
      });
      router.push("/inventory/categories");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Provisioning Fault",
        description: error?.message || "Failed to initialize category node.",
      });
      console.error("Failed to create category:", error);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <PageHeader
        title="Category Initialization"
        description="Define a new organizational node for product taxonomy."
        icon={<Tag className="h-6 w-6" />}
        actions={
          <Button
            variant="ghost"
            onClick={() => router.push("/inventory/categories")}
            className="h-10 text-slate-400 hover:text-brand-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>
        }
      />

      <DataPanel
        title="Node Configuration"
        description="Specify the metadata for the new organizational category."
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unique Identifier (Name)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Summer Essentials" 
                      {...field} 
                      className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm focus-visible:ring-brand-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold uppercase tracking-tight" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Node Context (Description)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Brief context for this node..." 
                      {...field} 
                      className="h-11 bg-slate-50 border-none rounded-xl font-bold text-sm focus-visible:ring-brand-primary"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px] font-bold uppercase tracking-tight" />
                </FormItem>
              )}
            />
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={createCategory.isPending}
                className="h-12 px-8 rounded-xl font-bold bg-brand-primary text-brand-secondary hover:bg-emerald-900 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
              >
                {createCategory.isPending ? "Provisioning..." : "Initialize Node"}
                <Plus className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </Form>
      </DataPanel>
    </motion.div>
  );
}
