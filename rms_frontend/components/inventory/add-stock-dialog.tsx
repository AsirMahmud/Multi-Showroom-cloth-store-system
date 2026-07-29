"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProduct, useProduct } from "@/hooks/queries/useInventory";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

interface AddStockDialogProps {
  productId: number;
  designs: Array<{
    id: number;
    name: string;
    colors: Array<{ id: number; color: string; stock: number }>;
  }>;
  trigger?: React.ReactNode;
}

export function AddStockDialog({ productId, designs, trigger }: AddStockDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDesignIndex, setSelectedDesignIndex] = React.useState<number>(-1);
  const [selectedColorIndex, setSelectedColorIndex] = React.useState<number>(-1);
  const [quantity, setQuantity] = React.useState<number>(1);
  const [notes, setNotes] = React.useState<string>("");
  
  const updateProduct = useUpdateProduct();
  const { data: product } = useProduct(productId);



  const resetForm = () => {
    setSelectedDesignIndex(-1);
    setSelectedColorIndex(-1);
    setQuantity(1);
    setNotes("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const handleDesignChange = (value: string) => {
    const index = parseInt(value);
    setSelectedDesignIndex(index);
    setSelectedColorIndex(-1); // Reset color when design changes
  };

  const handleColorChange = (value: string) => {
    const index = parseInt(value);
    setSelectedColorIndex(index);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = Number(e.target.value);
    setQuantity(newQuantity);
  };

  const handleAddStock = async () => {
    if (selectedVariationIndex === -1) {
      toast.error("Please select a variation.");
      return;
    }
    
    if (quantity <= 0) {
      toast.error("Please enter a valid quantity greater than 0.");
      return;
    }

    if (!product) {
      toast.error("Product data not available.");
      return;
    }

    try {
      // Create updated designs structure with the new stock quantity
      const updatedDesigns = designs.map((design, dIndex) => {
        if (dIndex === selectedDesignIndex) {
          return {
            ...design,
            colors: design.colors.map((color, cIndex) => {
              if (cIndex === selectedColorIndex) {
                return {
                  ...color,
                  stock: color.stock + quantity
                };
              }
              return color;
            })
          };
        }
        return design;
      });

      // Prepare the product data for update (similar to edit-product page)
      const productData = {
        name: product.name,
        description: product.description || "",
        category: product.category?.id || 0,
        supplier: product.supplier?.id,
        cost_price: product.cost_price,
        wholesale_price: product.wholesale_price,
        retail_price: product.retail_price,
        minimum_stock: product.minimum_stock,
        is_active: product.is_active,
        gender: product.gender || "UNISEX",
        designs: updatedDesigns,
      };
      
      await updateProduct.mutateAsync({
        id: productId,
        ...productData,
      });

      toast.success("Stock added successfully!");
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error adding stock:", error);
      const errorMessage = error?.response?.data?.detail || error?.message || "Failed to add stock.";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Stock
        </Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Stock</DialogTitle>
          <DialogDescription>
            Choose a variation and enter the quantity to add to stock. This will be recorded in stock history.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="design" className="text-right">
              Design
            </Label>
            <div className="col-span-3">
              <Select onValueChange={handleDesignChange} value={selectedDesignIndex >= 0 ? String(selectedDesignIndex) : ""}>
                <SelectTrigger id="design">
                  <SelectValue placeholder="Select design" />
                </SelectTrigger>
                <SelectContent>
                  {designs.map((d, index) => (
                    <SelectItem key={d.id} value={String(index)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color
            </Label>
            <div className="col-span-3">
              <Select 
                onValueChange={handleColorChange} 
                value={selectedColorIndex >= 0 ? String(selectedColorIndex) : ""}
                disabled={selectedDesignIndex === -1}
              >
                <SelectTrigger id="color">
                  <SelectValue placeholder={selectedDesignIndex === -1 ? "Select design first" : "Select color"} />
                </SelectTrigger>
                <SelectContent>
                  {selectedDesignIndex >= 0 && designs[selectedDesignIndex].colors.map((c, index) => (
                    <SelectItem key={c.id} value={String(index)}>
                      {c.color} (Current Stock: {c.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity to Add
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={handleQuantityChange}
              className="col-span-3"
            />
          </div>
          {selectedDesignIndex >= 0 && selectedColorIndex >= 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm text-muted-foreground">
                New Stock
              </Label>
              <div className="col-span-3 text-sm">
                {designs[selectedDesignIndex].colors[selectedColorIndex]?.stock + quantity} units
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right pt-2">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddStock} disabled={updateProduct.isPending}>
            {updateProduct.isPending ? "Adding..." : "Add Stock"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
