type GTMEvent = 'add_to_cart' | 'purchase' | 'view_item' | 'begin_checkout' | 'remove_from_cart' | 'view_item_list';

interface GTMItem {
    item_id: string;
    item_name: string;
    price?: number;
    quantity?: number;
    currency?: string;
    item_variant?: string;
    discount?: number;
    [key: string]: any;
}

interface GTMParams {
    currency?: string;
    value?: number;
    items?: GTMItem[];
    transaction_id?: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
    [key: string]: any;
}

export const sendGTMEvent = (event: GTMEvent, params: GTMParams) => {
    // Tracking disabled
};

/**
 * Normalizes a product ID by extracting the numeric part if it's a composite ID (e.g., "123/color-slug")
 */
export const normalizeProductId = (id: string | number): string => {
    if (!id) return '';
    return id.toString().replace(/\//g, '-');
};
