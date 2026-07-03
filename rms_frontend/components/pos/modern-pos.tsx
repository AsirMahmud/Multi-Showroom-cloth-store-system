"use client";

import { Label } from "@/components/ui/label";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Tag,
  Filter,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  AlertCircle,
  PinIcon as PantsIcon,
  Shirt,
  Briefcase,
  Watch,
  Footprints,
  History,
  Percent,
  ScanLine,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProductGrid from "./ProductGrid";
import CustomerSearchModal from "./CustomerSearchModal";
import CustomerAddModal from "./CustomerAddModal";
import CartAndCheckout from "./CartAndCheckout";
import DiscountModal from "./DiscountModal";
import { usePOSStore } from "@/store/pos-store";
import { Product, ProductVariation } from "@/types/inventory";
import ReceiptModal from "./ReceiptModal";
import { productsApi } from "@/lib/api/inventory";
import { cn } from "@/lib/utils";

// Sample product data

// Sample categories

// Sample customers

const productTags = [
  { id: "bestseller", name: "Bestseller", color: "bg-blue-100 text-blue-800" },
  {
    id: "new arrival",
    name: "New Arrival",
    color: "bg-green-100 text-green-800",
  },
  { id: "discounted", name: "Discounted", color: "bg-red-100 text-red-800" },
  { id: "premium", name: "Premium", color: "bg-purple-100 text-purple-800" },
  { id: "seasonal", name: "Seasonal", color: "bg-yellow-100 text-yellow-800" },
];

// Helper function to get tag color
const getTagColor = (tagId: string): string => {
  const tag = productTags.find((t) => t.id === tagId);
  return tag ? tag.color : "bg-gray-100 text-gray-800";
};

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Cart item type
type CartItem = {
  id: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  design: string;
  color: string;
  image: string;
  discount?: {
    type: "percentage" | "fixed";
    value: number;
  };
};

interface Tag {
  id: string;
  name: string;
}

interface SplitPayment {
  method: string;
  amount: string;
}

export function ModernPOS() {
  const { toast } = useToast();
  const {
    cart,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveItem,
    handleClearCart,
    handleItemDiscount,
    handleRemoveItemDiscount,
    handleCompletePayment: completePayment,
    showReceiptModal,
    setShowReceiptModal,
    receiptData,
    setReceiptData,
  } = usePOSStore();

  // Note: We no longer fetch all products for scanning - we fetch from backend on each scan

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cashAmount, setCashAmount] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [selectedDesigns, setSelectedDesigns] = useState<Record<number, string>>(
    {}
  );
  const [selectedColors, setSelectedColors] = useState<Record<number, string>>(
    {}
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showSplitPayment, setShowSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    { method: "card", amount: "" },
    { method: "cash", amount: "" },
  ]);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellProducts, setUpsellProducts] = useState<Product[]>([]);
  const [barcodeMode, setBarcodeMode] = useState(false); // Toggle barcode mode on/off
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [showProductHistory, setShowProductHistory] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const [cartDiscount, setCartDiscount] = useState<{
    type: "percentage" | "fixed";
    value: number;
  } | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [applyDuePayment, setApplyDuePayment] = useState(false);
  const [applyStoreCredit, setApplyStoreCredit] = useState(false);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  // Calculate cart totals
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    if (item.discount) {
      if (item.discount.type === "percentage") {
        return sum + itemTotal * (1 - item.discount.value / 100);
      } else {
        return sum + (itemTotal - item.discount.value);
      }
    }
    return sum + itemTotal;
  }, 0);

  // Remove tax calculation completely
  const tax = 0;
  let total = subtotal;

  // Apply cart-wide discount if any
  let discountedSubtotal = subtotal;
  if (cartDiscount) {
    if (cartDiscount.type === "percentage") {
      discountedSubtotal = subtotal * (1 - cartDiscount.value / 100);
    } else {
      discountedSubtotal = subtotal - cartDiscount.value;
    }
    total = discountedSubtotal;
  }

  // Apply store credit if selected
  if (selectedCustomer && applyStoreCredit && selectedCustomer.credit > 0) {
    if (selectedCustomer.credit >= total) {
      total = 0;
    } else {
      total -= selectedCustomer.credit;
    }
  }

  const changeDue = cashAmount ? Number.parseFloat(cashAmount) - total : 0;

  // Handle completing payment
  const handleCompletePayment = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before completing payment.",
        variant: "destructive",
      });
      return;
    }

    if (
      paymentMethod === "cash" &&
      (!cashAmount || Number.parseFloat(cashAmount) < total)
    ) {
      toast({
        title: "Insufficient Cash",
        description: "Please enter a cash amount that covers the total.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "split") {
      const totalSplitAmount = splitPayments.reduce((sum, payment) => {
        return sum + (payment.amount ? Number.parseFloat(payment.amount) : 0);
      }, 0);

      if (Math.abs(totalSplitAmount - total) > 0.01) {
        toast({
          title: "Invalid Split Payment",
          description: "The split payment amounts must equal the total amount.",
          variant: "destructive",
        });
        return;
      }
    }

    // Handle due payment
    let isPaid = true;
    let updatedCustomer = selectedCustomer;

    if (applyDuePayment && selectedCustomer) {
      isPaid = false;

      // Update customer's due amount
      if (updatedCustomer) {
        updatedCustomer = {
          ...updatedCustomer,
          due: updatedCustomer.due + total,
          purchaseHistory: [
            {
              date: new Date().toISOString().split("T")[0],
              amount: total,
              items: cart.length,
              paid: false,
            },
            ...updatedCustomer.purchaseHistory,
          ],
        };
      }
    } else if (selectedCustomer) {
      // Add to customer's purchase history as paid
      updatedCustomer = {
        ...updatedCustomer,
        purchaseHistory: [
          {
            date: new Date().toISOString().split("T")[0],
            amount: total,
            items: cart.length,
            paid: true,
          },
          ...updatedCustomer.purchaseHistory,
        ],
      };
    }

    // Create receipt data
    const receipt = {
      id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      discount: cartDiscount,
      discountedSubtotal,
      tax,
      total,
      amountPaid: isPaid ? total : 0,
      amountDue: isPaid ? 0 : total,
      paymentMethod,
      cashAmount:
        paymentMethod === "cash" ? Number.parseFloat(cashAmount) : null,
      changeDue: paymentMethod === "cash" ? changeDue : null,
      customer: updatedCustomer,
      splitPayments: paymentMethod === "split" ? splitPayments : null,
      storeCredit:
        applyStoreCredit && selectedCustomer ? selectedCustomer.credit : 0,
      isPaid,
    };

    // Add to sales history
    setSalesHistory((prev) => [receipt, ...prev]);

    setReceiptData(receipt);
    setShowReceiptModal(true);

    // Update the selected customer with new purchase history
    if (updatedCustomer) {
      setSelectedCustomer(updatedCustomer);
    }

    // Save transaction to backend in a real app

    completePayment(toast);
  };

  // Handle starting a new sale after receipt
  const handleNewSale = () => {
    handleClearCart();
    setSelectedCustomer(null);
    setPaymentMethod("card");
    setCashAmount("");
    setShowReceiptModal(false);
    setCartDiscount(null);
    setShowSplitPayment(false);
    setSplitPayments([
      { method: "card", amount: "" },
      { method: "cash", amount: "" },
    ]);
  };

  // Handle closing the receipt modal
  const handleCloseReceiptModal = () => {
    setShowReceiptModal(false);
  };

  // Filter products based on search, category, tags, and price range

  // Filter customers based on search query

  // Handle adding product to cart

  // Handle updating cart item quantity

  // Handle removing item from cart

  // Keep barcode input focused for continuous scanning when barcode mode is enabled
  useEffect(() => {
    if (!barcodeMode) return;

    const barcodeInput = barcodeInputRef.current;
    if (!barcodeInput) return;

    const handleFocusCheck = () => {
      // Check if any dialog or modal is open
      const isModalOpen = !!document.querySelector('[role="dialog"], [data-state="open"]');
      if (isModalOpen) return;

      // Check if any other input is focused
      const activeElement = document.activeElement;
      const isOtherInputFocused = 
        activeElement && 
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' || 
         activeElement.tagName === 'SELECT') &&
        activeElement !== barcodeInput;

      if (!isOtherInputFocused) {
        barcodeInput.focus();
      }
    };

    // Initial check
    handleFocusCheck();

    // Use a periodic check as a fallback and handle common interaction events
    const interval = setInterval(handleFocusCheck, 1000);
    document.addEventListener('click', handleFocusCheck);
    document.addEventListener('keydown', handleFocusCheck);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleFocusCheck);
      document.removeEventListener('keydown', handleFocusCheck);
    };
  }, [barcodeMode]);

  // Decode QR code data
  const decodeQRCodeData = (scannedValue: string): { productId: string; color: string; design: string } | null => {
    try {
      // Validate input
      if (!scannedValue || typeof scannedValue !== 'string' || scannedValue.trim().length === 0) {
        return null;
      }

      // Try to decode base64
      let decodedString: string;
      try {
        decodedString = atob(scannedValue.trim());
      } catch (decodeError) {
        // Not valid base64, probably a regular barcode
        return null;
      }

      // Validate decoded string is valid JSON
      if (!decodedString || decodedString.length === 0) {
        return null;
      }

      // Try to parse as JSON
      let cartData: any;
      try {
        cartData = JSON.parse(decodedString);
      } catch (parseError) {
        // Not valid JSON, probably a regular barcode
        return null;
      }
      
      // Check if it's our QR code format
      if (cartData && typeof cartData === 'object' && cartData.items && Array.isArray(cartData.items) && cartData.items.length > 0) {
        const item = cartData.items[0];
        if (item && typeof item === 'object' && item.productId && item.variations) {
          return {
            productId: String(item.productId),
            color: item.variations.color || "",
            design: item.variations.design || "",
          };
        }
      }
      return null;
    } catch (error) {
      // Not a valid QR code format, might be regular barcode
      console.error("Error decoding QR code:", error);
      return null;
    }
  };

  // Handle barcode/QR code scanning - fetches from backend
  const handleBarcodeScan = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Only process barcode scan if barcode mode is enabled
    if (!barcodeMode && event.key === "Enter") {
      // Normal search behavior - let it work as regular search
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const scannedValue = searchQuery.trim();
      if (!scannedValue) return;

      // Set processing flag and clear input immediately for next scan
      setIsProcessingScan(true);
      setSearchQuery("");

      // Process scan immediately (no delay needed since we already cleared input)
      try {
        // Try to decode as QR code first
        const qrData = decodeQRCodeData(scannedValue);
         
        if (qrData) {
          // It's a QR code - fetch product from backend by ID
          const productId = parseInt(qrData.productId);
          if (isNaN(productId)) {
            toast({
              title: "Invalid QR Code",
              description: "QR code contains invalid product ID",
              variant: "destructive",
            });
            setIsProcessingScan(false);
            return;
          }

          try {
            // Fetch product from backend
            const product = await productsApi.getById(productId);
            
            if (product) {
              // Verify variation exists in the new hierarchy
              let foundDesign = null;
              let foundColor = null;

              for (const design of product.designs || []) {
                if (design.name === qrData.design) {
                  const colorMatch = design.colors.find(c => c.color === qrData.color);
                  if (colorMatch) {
                    foundDesign = design;
                    foundColor = colorMatch;
                    break;
                  }
                }
              }

              if (foundDesign && foundColor && foundColor.stock > 0) {
                handleAddToCart(product, qrData.design, qrData.color);
                toast({
                  title: "Added",
                  description: `${product.name}`,
                });
              } else {
                toast({
                  title: "Out of Stock",
                  description: `Variant unavailable`,
                  variant: "destructive",
                });
              }
            } else {
              toast({
                title: "Not Found",
                description: `Product ID ${qrData.productId}`,
                variant: "destructive",
              });
            }
          } catch (error) {
            toast({
              title: "Not Found",
              description: `Product ID ${qrData.productId} not found`,
              variant: "destructive",
            });
          }
          setIsProcessingScan(false);
        } else {
          // Try to find product by SKU or barcode from backend
          try {
            const product = await productsApi.searchByBarcode(scannedValue);
            
            if (product) {
              // Get first available variation from the new hierarchy
              let firstDesign = null;
              let firstColor = null;

              for (const design of product.designs || []) {
                const colorMatch = design.colors.find(c => c.stock > 0);
                if (colorMatch) {
                  firstDesign = design;
                  firstColor = colorMatch;
                  break;
                }
              }
              
              if (firstDesign && firstColor) {
                handleAddToCart(product, firstDesign.name, firstColor.color);
                toast({
                  title: "Added",
                  description: `${product.name}`,
                });
              } else {
                toast({
                  title: "Out of Stock",
                  description: `${product.name}`,
                  variant: "destructive",
                });
              }
            } else {
              // Not found - set it back as search query for text search
              setSearchQuery(scannedValue);
            }
          } catch (error) {
            console.error("Error fetching product by barcode:", error);
            // Not found - set it back as search query for text search
            setSearchQuery(scannedValue);
          }
          setIsProcessingScan(false);
        }
      } catch (error) {
        console.error("Error processing barcode scan:", error);
        toast({
          title: "Scan Error",
          description: "Failed to process code",
          variant: "destructive",
        });
        setIsProcessingScan(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Main POS Interface - Two Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Product Selection - 30% Space */}
        <div className="flex-[0.3] min-w-0 bg-slate-50/50 backdrop-blur-xl overflow-y-auto border-r border-brand-primary/5">
          <div className="p-4">
            {/* Search & Filter Bar */}
            <div className="mb-4 space-y-2">
              <div className="flex flex-col gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={barcodeInputRef}
                    placeholder={
                      barcodeMode
                        ? "Scan..."
                        : "Search..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleBarcodeScan}
                    className={`pl-10 ${barcodeMode ? "pr-24" : ""}`}
                  />
                  {barcodeMode && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Badge variant="default" className="bg-green-600 text-white text-[10px] px-1.5 py-0">
                        Scan
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={barcodeMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setBarcodeMode(!barcodeMode);
                      if (!barcodeMode) {
                        setTimeout(() => {
                          barcodeInputRef.current?.focus();
                        }, 100);
                      }
                    }}
                    className={cn("flex-1 text-[10px] font-black uppercase tracking-widest h-9", barcodeMode ? "bg-green-600 hover:bg-green-700" : "")}
                  >
                    <ScanLine className="h-3 w-3 mr-2" />
                    {barcodeMode ? "ON" : "Scan"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex-1 text-[10px] font-black uppercase tracking-widest h-9"
                  >
                    <Filter className="h-3 w-3 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Expanded Filters - Compact version for 30% column */}
              {isFilterOpen && (
                <div className="bg-white/80 backdrop-blur-md p-4 rounded-[24px] border border-brand-primary/5 shadow-premium space-y-4">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Price</h3>
                    <Slider
                      defaultValue={priceRange}
                      min={0}
                      max={300}
                      step={5}
                      onValueChange={setPriceRange}
                    />
                  </div>

                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 text-slate-400">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {productTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer text-[9px] px-2 py-0.5"
                          onClick={() => {
                            if (selectedTags.includes(tag.id)) {
                              setSelectedTags(selectedTags.filter((t) => t !== tag.id));
                            } else {
                              setSelectedTags([...selectedTags, tag.id]);
                            }
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Grid */}
            <ProductGrid
              searchQuery={isProcessingScan ? "" : searchQuery}
              selectedCategory={selectedCategory}
              priceRange={priceRange}
            />
          </div>
        </div>

        {/* Right Column - Cart & Checkout - 70% Space */}
        <div className="flex-[0.7] overflow-hidden">
          <CartAndCheckout />
        </div>
      </div>

      {/* Customer Search Modal */}
      <CustomerSearchModal />

      {/* New Customer Form Modal */}
      <CustomerAddModal />

      {/* Discount Modal */}
      <DiscountModal />

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceiptModal}
        onOpenChange={handleCloseReceiptModal}
        data={receiptData}
        onNewSale={handleNewSale}
        formatCurrency={formatCurrency}
      />

      {/* Upsell Modal */}
      <Dialog open={showUpsellModal} onOpenChange={setShowUpsellModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Your Look</DialogTitle>
            <DialogDescription>
              Consider adding these accessories to your purchase.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {upsellProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative h-32 bg-gray-100">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold mb-2">
                    {formatCurrency(Number(product.retail_price))}
                  </p>
                  <Button
                    className="w-full mt-2"
                    onClick={() => {
                      const design = product.designs?.[0];
                      const color = design?.colors?.[0];
                      if (design && color) {
                        handleAddToCart(
                          product,
                          design.name,
                          color.color
                        );
                      }
                      setShowUpsellModal(false);
                    }}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
