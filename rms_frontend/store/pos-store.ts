import { create } from 'zustand';
import { Customer, CreateCustomerData, createCustomer, searchCustomers, lookupCustomerByPhone } from '@/lib/api/customer';
import { Product } from '@/types/inventory';
import { PaymentMethod, Sale } from '@/types/sales';
import { createSale } from '@/lib/api/sales';
import { toast } from '@/hooks/use-toast';
import { calculateCartTotals, sanitizeDiscount } from '@/utils/pos-calculations';
import { normalizeProductPrice } from '@/utils/product-price';

export interface CartItem {
    id: number;
    productId: number;
    name: string;
    price: number;
    quantity: number;
    design: string;
    color: string;
    colorHex?: string;
    image: string;
    sku?: string;
    availableStock: number;
    retailPrice: number;
    wholesalePrice: number;
    wholesaleCutoff: number;
    priceType: 'retail' | 'wholesale';
    discount?: {
        type: "percentage" | "fixed";
        value: number;
    };
}

interface AddToCartInput {
    product: Product;
    design: string;
    color: string;
    quantity?: number;
}

interface POSState {
    showNewCustomerForm: boolean;
    setShowNewCustomerForm: (show: boolean) => void;
    newCustomer: CreateCustomerData;
    setNewCustomer: (customer: CreateCustomerData) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchResults: Customer[];
    setSearchResults: (results: Customer[]) => void;
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;
    handleSearch: (query: string) => Promise<void>;
    handleAddNewCustomer: () => Promise<void>;
    resetNewCustomer: () => void;

    cart: CartItem[];
    setCart: (cart: CartItem[]) => void;
    cartDiscount: { type: "percentage" | "fixed"; value: number } | null;
    setCartDiscount: (discount: { type: "percentage" | "fixed"; value: number } | null) => void;
    handleAddToCart: (product: Product, design: string, color: string, quantity?: number) => void;
    handleAddMultipleToCart: (items: AddToCartInput[]) => void;
    handleUpdateQuantity: (itemId: number, change: number) => void;
    handleSetQuantity: (itemId: number, quantity: number) => void;
    handleRemoveItem: (itemId: number) => void;
    handleClearCart: () => void;
    handleItemDiscount: (itemId: number, discountType: "percentage" | "fixed", discountValue: number) => void;
    handleRemoveItemDiscount: (itemId: number) => void;

    paymentMethod: PaymentMethod;
    setPaymentMethod: (method: PaymentMethod) => void;
    showSplitPayment: boolean;
    setShowSplitPayment: (show: boolean) => void;
    splitPayments: { method: PaymentMethod; amount: string }[];
    setSplitPayments: (payments: { method: PaymentMethod; amount: string }[]) => void;
    cashAmount: string;
    setCashAmount: (amount: string) => void;
    currentSaleData: Partial<Sale> | null;
    setCurrentSaleData: (data: Partial<Sale> | null) => void;

    showCustomerSearch: boolean;
    setShowCustomerSearch: (show: boolean) => void;
    showDiscountModal: boolean;
    setShowDiscountModal: (show: boolean) => void;
    showReceiptModal: boolean;
    setShowReceiptModal: (show: boolean) => void;
    receiptData: {
        id: string;
        date: string;
        items: CartItem[];
        subtotal: number;
        discountedSubtotal?: number;
        itemDiscounts?: number;
        globalDiscount?: number;
        discount?: { type: "percentage" | "fixed"; value: number } | null;
        tax: number;
        total: number;
        paymentMethod: PaymentMethod;
        cashAmount: number | null;
        changeDue: number | null;
        customer: Customer | null;
        splitPayments: { method: PaymentMethod; amount: string }[] | null;
        storeCredit?: number;
        isPaid: boolean;
        isDue?: boolean;
    } | null;
    setReceiptData: (data: POSState['receiptData']) => void;
    handleCompletePayment: (toastFn: (props: { title: string; description: string; variant?: "default" | "destructive" }) => void, markAsDue?: boolean) => Promise<Sale | undefined>;
}

const initialNewCustomer: CreateCustomerData = {
    first_name: '',
    phone: '',
};

const getVariation = (product: Product, designName: string, colorName: string) => {
    const design = (product.designs || []).find((item) => item.name === designName);
    return design?.colors.find((item) => item.color === colorName);
};

const getResolvedWholesaleCutoff = (product: Product): number => {
    return product.wholesale_cutoff || product.resolved_wholesale_cutoff || product.category?.wholesale_cutoff || 10;
};

const resolveCartPricing = (retailPrice: number, wholesalePrice: number, wholesaleCutoff: number, quantity: number) => {
    const useWholesale = wholesalePrice > 0 && quantity >= wholesaleCutoff;
    return {
        price: normalizeProductPrice(useWholesale ? wholesalePrice : retailPrice),
        priceType: useWholesale ? 'wholesale' as const : 'retail' as const,
    };
};

const clampQuantity = (quantity: number, availableStock: number) => {
    if (!Number.isFinite(quantity)) {
        return 1;
    }
    return Math.max(1, Math.min(Math.floor(quantity), availableStock));
};

export const usePOSStore = create<POSState>((set, get) => ({
    showNewCustomerForm: false,
    setShowNewCustomerForm: (show) => set({ showNewCustomerForm: show }),

    newCustomer: initialNewCustomer,
    setNewCustomer: (customer) => set({ newCustomer: customer }),

    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),

    searchResults: [],
    setSearchResults: (results) => set({ searchResults: results }),

    selectedCustomer: null,
    setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),

    handleSearch: async (query) => {
        try {
            const response = await searchCustomers(query);
            set({ searchResults: response.results || [] });
        } catch (error) {
            console.error('Error searching customers:', error);
            set({ searchResults: [] });
        }
    },

    handleAddNewCustomer: async () => {
        const { newCustomer } = get();
        try {
            const existingCustomer = await lookupCustomerByPhone(newCustomer.phone);
            if (existingCustomer) {
                toast({
                    title: "Customer Already Exists",
                    description: "A customer with this phone number already exists.",
                    variant: "destructive",
                });
                return;
            }

            const createdCustomer = await createCustomer(newCustomer);
            set({
                selectedCustomer: createdCustomer,
                showNewCustomerForm: false,
                newCustomer: initialNewCustomer
            });
            toast({
                title: "Success",
                description: "Customer created successfully",
            });
        } catch (error) {
            console.error('Error adding customer:', error);
            toast({
                title: "Error",
                description: "Failed to create customer",
                variant: "destructive",
            });
        }
    },

    resetNewCustomer: () => set({ newCustomer: initialNewCustomer }),

    cart: [],
    setCart: (cart) => set({ cart }),

    cartDiscount: null,
    setCartDiscount: (discount) => set({ cartDiscount: discount }),

    handleAddToCart: (product, design, color, quantity = 1) => {
        const variation = getVariation(product, design, color);
        const availableStock = variation?.stock || 0;
        const safeQuantity = clampQuantity(quantity, availableStock);

        if (availableStock <= 0) {
            toast({
                title: "Out of Stock",
                description: `${product.name} (${design}, ${color}) is unavailable.`,
                variant: "destructive",
            });
            return;
        }

        const retailPrice = Number(product.retail_price || 0);
        const wholesalePrice = Number(product.wholesale_price || 0);
        const wholesaleCutoff = getResolvedWholesaleCutoff(product);
        const pricing = resolveCartPricing(retailPrice, wholesalePrice, wholesaleCutoff, safeQuantity);

        const { cart } = get();
        const existingItem = cart.find(
            (item) => item.productId === product.id && item.design === design && item.color === color
        );

        if (existingItem) {
            const mergedQuantity = clampQuantity(existingItem.quantity + safeQuantity, existingItem.availableStock);
            const mergedPricing = resolveCartPricing(existingItem.retailPrice, existingItem.wholesalePrice, existingItem.wholesaleCutoff, mergedQuantity);
            set({
                cart: cart.map((item) =>
                    item.id === existingItem.id
                        ? {
                            ...item,
                            quantity: mergedQuantity,
                            price: mergedPricing.price,
                            priceType: mergedPricing.priceType,
                        }
                        : item
                )
            });
        } else {
            const newItem: CartItem = {
                id: Date.now() + Math.floor(Math.random() * 1000),
                productId: product.id,
                name: product.name,
                price: pricing.price,
                quantity: safeQuantity,
                design,
                color,
                colorHex: variation?.color_hax,
                image: product.image || '/placeholder.svg',
                sku: product.sku,
                availableStock,
                retailPrice,
                wholesalePrice,
                wholesaleCutoff,
                priceType: pricing.priceType,
            };
            set({ cart: [...cart, newItem] });
        }

        toast({
            title: "Added to Cart",
            description: `${product.name} (${design}, ${color}) added.`,
        });
    },

    handleAddMultipleToCart: (items) => {
        items.forEach((item) => {
            get().handleAddToCart(item.product, item.design, item.color, item.quantity || 1);
        });
    },

    handleUpdateQuantity: (itemId, change) => {
        const { cart } = get();
        const updatedCart = cart.map((item) => {
            if (item.id !== itemId) {
                return item;
            }
            const newQuantity = clampQuantity(item.quantity + change, item.availableStock);
            const pricing = resolveCartPricing(item.retailPrice, item.wholesalePrice, item.wholesaleCutoff, newQuantity);
            return {
                ...item,
                quantity: newQuantity,
                price: pricing.price,
                priceType: pricing.priceType,
            };
        });
        set({ cart: updatedCart });
    },

    handleSetQuantity: (itemId, quantity) => {
        const { cart } = get();
        const updatedCart = cart.map((item) => {
            if (item.id !== itemId) {
                return item;
            }
            const nextQuantity = clampQuantity(quantity, item.availableStock);
            const pricing = resolveCartPricing(item.retailPrice, item.wholesalePrice, item.wholesaleCutoff, nextQuantity);
            return {
                ...item,
                quantity: nextQuantity,
                price: pricing.price,
                priceType: pricing.priceType,
            };
        });
        set({ cart: updatedCart });
    },

    handleRemoveItem: (itemId) => {
        const { cart } = get();
        const itemToRemove = cart.find((item) => item.id === itemId);
        set({ cart: cart.filter((item) => item.id !== itemId) });
        if (itemToRemove) {
            toast({
                title: "Removed from Cart",
                description: `${itemToRemove.name} removed.`,
            });
        }
    },

    handleClearCart: () => {
        set({ cart: [], cartDiscount: null });
        toast({
            title: "Cart Cleared",
            description: "All items have been removed.",
        });
    },

    handleItemDiscount: (itemId, discountType, discountValue) => {
        const { cart } = get();
        set({
            cart: cart.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        discount: sanitizeDiscount(
                            { type: discountType, value: Number(discountValue) },
                            item.price * item.quantity
                        ) || undefined,
                    }
                    : item
            )
        });
    },

    handleRemoveItemDiscount: (itemId) => {
        const { cart } = get();
        set({
            cart: cart.map((item) => {
                if (item.id !== itemId) {
                    return item;
                }
                const { discount, ...rest } = item;
                return rest;
            })
        });
    },

    paymentMethod: "cash",
    setPaymentMethod: (method) => set({ paymentMethod: method }),
    showSplitPayment: false,
    setShowSplitPayment: (show) => set({ showSplitPayment: show }),
    splitPayments: [{ method: 'cash' as PaymentMethod, amount: '' }],
    setSplitPayments: (payments) => set({ splitPayments: payments }),
    cashAmount: "",
    setCashAmount: (amount) => set({ cashAmount: amount }),
    currentSaleData: null,
    setCurrentSaleData: (data) => set({ currentSaleData: data }),

    showCustomerSearch: false,
    setShowCustomerSearch: (show) => set({ showCustomerSearch: show }),
    showDiscountModal: false,
    setShowDiscountModal: (show) => set({ showDiscountModal: show }),
    showReceiptModal: false,
    setShowReceiptModal: (show) => set({ showReceiptModal: show }),
    receiptData: null,
    setReceiptData: (data) => set({ receiptData: data }),

    handleCompletePayment: async (toastFn, markAsDue = false) => {
        const { cart, selectedCustomer, paymentMethod, cashAmount, splitPayments, cartDiscount } = get();
        if (cart.length === 0) {
            toastFn({
                title: "Empty Cart",
                description: "Your cart is empty",
                variant: "destructive",
            });
            return;
        }

        try {
            const {
                itemsWithDiscounts,
                subtotalBeforeDiscount,
                discountedSubtotal,
                totalItemDiscounts,
                globalDiscount,
                subtotal,
                tax,
                total,
            } = calculateCartTotals(cart, cartDiscount);

            let paymentData: any[] = [];
            if (markAsDue) {
                paymentData = [];
            } else if (paymentMethod === "split") {
                paymentData = splitPayments
                    .filter((payment) => payment.amount && parseFloat(payment.amount) > 0)
                    .map((payment) => ({
                        method: payment.method,
                        amount: payment.amount,
                        notes: `Split payment - ${payment.method}`
                    }));
            } else if (paymentMethod === "cash") {
                const cashAmountNum = parseFloat(cashAmount) || total;
                paymentData = [{
                    method: "cash",
                    amount: cashAmountNum.toString(),
                    notes: "Cash payment"
                }];
            } else if (["card", "mobile", "gift"].includes(paymentMethod)) {
                paymentData = [{
                    method: paymentMethod,
                    amount: total.toString(),
                    notes: `${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)} payment`
                }];
            }

            const saleData: Partial<Sale> = {
                customer: selectedCustomer?.id,
                customer_phone: selectedCustomer?.phone,
                subtotal: subtotalBeforeDiscount,
                tax,
                discount: globalDiscount,
                total,
                payment_method: markAsDue ? "credit" : paymentMethod,
                ...(markAsDue ? { payment_data: [] } : { payment_data: paymentData }),
                items: itemsWithDiscounts.map((item) => ({
                    product_id: item.productId,
                    design_name: item.design,
                    color: item.color,
                    quantity: item.quantity,
                    price_type: item.priceType,
                    unit_price: item.price,
                    applied_unit_price: item.price,
                    retail_price_snapshot: item.retailPrice,
                    wholesale_price_snapshot: item.wholesalePrice,
                    wholesale_cutoff_snapshot: item.wholesaleCutoff,
                    discount: item.itemDiscount,
                    total: item.discountedTotal
                }))
            };

            const sale = await createSale(saleData);
            if (!sale.id) {
                throw new Error('Sale ID not returned from API');
            }

            const receipt = {
                id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
                date: new Date().toISOString(),
                items: itemsWithDiscounts,
                subtotal: subtotalBeforeDiscount,
                discountedSubtotal,
                itemDiscounts: totalItemDiscounts,
                globalDiscount,
                discount: cartDiscount,
                tax,
                total,
                paymentMethod: markAsDue ? "credit" : paymentMethod,
                cashAmount: paymentMethod === "cash" && !markAsDue ? Number.parseFloat(cashAmount) : null,
                changeDue: paymentMethod === "cash" && !markAsDue ? Number.parseFloat(cashAmount) - total : null,
                customer: selectedCustomer,
                splitPayments: paymentMethod === "split" && !markAsDue ? splitPayments : null,
                storeCredit: 0,
                isPaid: !markAsDue,
                isDue: markAsDue,
            };

            set({ receiptData: receipt, showReceiptModal: true, cart: [], cartDiscount: null });

            toastFn({
                title: markAsDue ? "Sale Created as Due" : "Success",
                description: markAsDue ? "Sale created with pending payment" : "Payment processed successfully",
            });

            return sale;
        } catch (error) {
            console.error('Error processing payment:', error);
            const errorMessage = error instanceof Error ? error.message : "Failed to process payment";
            toastFn({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
            throw error;
        }
    },
}));
