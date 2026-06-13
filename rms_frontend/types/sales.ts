export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'credit' | 'mobile' | 'gift' | 'split';
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded' | 'partially_paid' | 'gifted';
export type SaleType = 'shop' | 'online_preorder' | 'offline_preorder';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface SaleItem {
    id?: number;
    product_id: number;
    product?: {
        id: number;
        name: string;
        sku: string;
        cost_price: number;
    };
    design?: string;
    design_name?: string;
    color: string;
    quantity: number;
    price_type?: 'retail' | 'wholesale';
    unit_price: number;
    applied_unit_price?: number;
    retail_price_snapshot?: number;
    wholesale_price_snapshot?: number;
    wholesale_cutoff_snapshot?: number;
    discount: number;
    total?: number;
    profit?: number;
    loss?: number;
    created_at?: string;
}

export interface SalePayment {
    id?: number;
    sale?: number;
    payment_method: PaymentMethod;
    amount: number;
    status: PaymentStatus;
    transaction_id?: string;
    is_gift_payment?: boolean;
    notes?: string;
    created_at?: string;
}

export interface DuePayment {
    id?: number;
    sale?: number;
    amount_due: number;
    amount_paid: number;
    due_date?: string;
    status: 'pending' | 'completed' | 'overdue';
    notes?: string;
    created_at?: string;
}

export interface Sale {
    id?: number;
    invoice_number?: string;
    branch?: number | null;
    branch_name?: string | null;
    customer?: (
        | number
        | null
        | {
            id: number;
            first_name: string;
            last_name: string;
            email?: string;
            phone?: string;
        }
    );
    customer_phone: string | null;
    date?: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    payment_method: PaymentMethod;
    status?: SaleStatus;
    sale_type?: SaleType;

    // New payment system fields
    amount_paid?: number;
    amount_due?: number;
    gift_amount?: number;
    is_fully_paid?: boolean;
    payment_status?: 'unpaid' | 'partially_paid' | 'fully_paid' | 'overpaid';

    total_profit?: number;
    total_loss?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    items: SaleItem[];

    // Payment data for split payments
    payment_data?: Array<{
        method: string;
        amount: string;
        notes?: string;
        transaction_id?: string;
    }>;

    // Related payment data
    sale_payments?: SalePayment[];
    due_payments?: DuePayment[];
    payments?: Payment[]; // Legacy payments
    returns?: Return[];
}

export interface Payment {
    id: number;
    sale: number;
    amount: number;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    transaction_id: string;
    payment_date: string;
    notes: string;
    created_at: string;
}

export interface ReturnItem {
    id?: number;
    return_order?: number;
    sale_item?: number | SaleItem;
    sale_item_id?: number;
    quantity: number;
    reason: string;
    created_at: string;
}

export interface Return {
    id: number;
    return_number: string;
    sale: number;
    sale_invoice_number?: string;
    sale_branch_name?: string | null;
    sale_customer_name?: string | null;
    reason: string;
    status: ReturnStatus;
    refund_amount: number;
    processed_date: string | null;
    created_at: string;
    updated_at: string;
    items: ReturnItem[];
}

export interface CustomerLookupResponse {
    exists: boolean;
    customer?: {
        id: number;
        name: string;
        phone: string;
        email: string;
    };
    message?: string;
}

export interface DashboardStats {
    today: {
        gross_sales: number;
        returns_total: number;
        net_sales: number;
        total_sales: number;
        total_transactions: number;
        total_profit: number;
        gross_profit?: number;
        total_loss?: number;
        total_discount?: number;
        average_transaction_value?: number;
        total_customers?: number;
    };
    monthly: {
        gross_sales: number;
        returns_total: number;
        net_sales: number;
        total_sales: number;
        total_transactions: number;
        total_profit: number;
        gross_profit?: number;
        total_loss?: number;
        total_discount?: number;
        average_transaction_value?: number;
        total_customers?: number;
    };
    customer_analytics?: {
        new_customers_today: number;
        active_customers_today: number;
        customer_retention_rate: number;
        top_customers: Array<{
            customer_name: string;
            customer__phone?: string;
            total_spent: number;
            visit_count: number;
        }>;
    };
    payment_method_distribution?: Array<{
        payment_method: string;
        count: number;
        total: number;
    }>;
    sales_by_hour?: Array<{
        hour: number;
        count: number;
        total: number;
    }>;
    top_products: Array<{
        product__name: string;
        total_quantity: number;
        total_revenue: number;
        total_profit: number;
    }>;
    sales_trend: Array<{
        sale__date__date: any;
        date__date: string;
        gross_sales?: number;
        returns_total?: number;
        sales: number;
        gross_profit?: number;
        profit: number;
        orders: number;
    }>;
    sales_distribution: Array<{
        product__category__name: string;
        value: number;
        profit: number;
    }>;
} 
