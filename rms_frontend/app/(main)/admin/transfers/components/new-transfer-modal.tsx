"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranch } from "@/contexts/branch-context";
import { transfersApi } from "@/lib/api/transfers";
import { productsApi } from "@/lib/api/inventory";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface NewTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTransferModal({ open, onOpenChange }: NewTransferModalProps) {
  const { availableBranches } = useBranch();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [sourceBranch, setSourceBranch] = useState<string>("");
  const [destBranch, setDestBranch] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ product: string; variation: string; quantity: number }[]>([
    { product: "", variation: "", quantity: 1 }
  ]);

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsApi.getAll({ page_size: 200, expand: "variations" }),
    enabled: open
  });

  const products = productsData?.results || [];

  const createMutation = useMutation({
    mutationFn: transfersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast({ title: "Transfer Created", description: "Stock transfer request has been initiated." });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => toast({ title: "Failed to create", description: error.response?.data?.detail || "An error occurred.", variant: "destructive" })
  });

  const resetForm = () => {
    setSourceBranch("");
    setDestBranch("");
    setNotes("");
    setItems([{ product: "", variation: "", quantity: 1 }]);
  };

  const handleAddItem = () => {
    setItems([...items, { product: "", variation: "", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceBranch || !destBranch) {
      toast({ title: "Error", description: "Source and destination branches are required.", variant: "destructive" });
      return;
    }
    if (sourceBranch === destBranch) {
      toast({ title: "Error", description: "Source and destination cannot be the same.", variant: "destructive" });
      return;
    }
    const validItems = items.filter(i => i.product && i.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: "Error", description: "At least one valid item is required.", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      source_branch: parseInt(sourceBranch),
      dest_branch: parseInt(destBranch),
      notes,
      items: validItems.map(i => ({
        product: parseInt(i.product),
        variation: i.variation && i.variation !== "none" ? parseInt(i.variation) : undefined,
        quantity: i.quantity
      }))
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Stock Transfer</DialogTitle>
          <DialogDescription>Create a new stock migration request between branches.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Node</label>
              <Select value={sourceBranch} onValueChange={setSourceBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination Node</label>
              <Select value={destBranch} onValueChange={setDestBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Destination" />
                </SelectTrigger>
                <SelectContent>
                  {availableBranches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Transfer Items</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>
            
            {items.map((item, index) => {
              const selectedProduct = products.find((p: any) => p.id.toString() === item.product);
              return (
                <div key={index} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="flex-1 space-y-2">
                    <Select value={item.product} onValueChange={(val) => { updateItem(index, "product", val); updateItem(index, "variation", ""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Select value={item.variation} onValueChange={(val) => updateItem(index, "variation", val)} disabled={!item.product || (selectedProduct?.variations?.length || 0) === 0}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Variation" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct?.variations?.length === 0 ? (
                          <SelectItem value="none" disabled>No variations</SelectItem>
                        ) : (
                          selectedProduct?.variations?.map((v: any) => (
                            <SelectItem key={v.id} value={v.id.toString()}>{v.design?.name} / {v.color}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-24 space-y-2">
                    <Input 
                      type="number" 
                      min={1} 
                      value={item.quantity} 
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                      placeholder="Qty" 
                    />
                  </div>
                  
                  <div className="pt-2">
                    <Button type="button" variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleRemoveItem(index)} disabled={items.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for transfer..." />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || isLoadingProducts}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Initiate Transfer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
