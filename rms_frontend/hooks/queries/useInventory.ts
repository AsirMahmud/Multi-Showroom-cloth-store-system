'use client'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import {
    categoriesApi,
    onlineCategoriesApi,
    productsApi,
    productVariationsApi,
    galleriesApi,
    galleryImagesApi,
    dashboardApi
} from '@/lib/api/inventory';
import { supplierApi } from '@/lib/api/supplier';
import { useBranch } from '@/contexts/branch-context';
import { useToast } from '../use-toast';
import {
    Category,
    Product,
    ProductVariation,
    Gallery,
    GalleryImage,
    CreateCategoryDTO,
    CreateProductDTO,
    CreateProductVariationDTO,
    CreateGalleryDTO,
    CreateGalleryImageDTO,
    UpdateCategoryDTO,
    UpdateProductDTO,
    UpdateProductVariationDTO,
    UpdateGalleryDTO,
    UpdateGalleryImageDTO,
    DashboardOverview,
    CategoryMetrics,
    StockMovementAnalysis
} from '@/types/inventory';

// Query Keys
export const inventoryKeys = {
    all: ['inventory'] as const,
    dashboard: {
        all: () => [...inventoryKeys.all, 'dashboard'] as const,
        overview: (period: string) => [...inventoryKeys.dashboard.all(), 'overview', period] as const,
        stockAlerts: () => [...inventoryKeys.dashboard.all(), 'stock-alerts'] as const,
        categoryMetrics: () => [...inventoryKeys.dashboard.all(), 'category-metrics'] as const,
        stockMovementAnalysis: (period: string) => [...inventoryKeys.dashboard.all(), 'stock-movement-analysis', period] as const,
    },
    categories: {
        all: () => [...inventoryKeys.all, 'categories'] as const,
        lists: () => [...inventoryKeys.categories.all(), 'list'] as const,
        list: (filters: string) => [...inventoryKeys.categories.lists(), { filters }] as const,
        details: () => [...inventoryKeys.categories.all(), 'detail'] as const,
        detail: (id: number) => [...inventoryKeys.categories.details(), id] as const,
    },
    suppliers: {
        all: () => [...inventoryKeys.all, 'suppliers'] as const,
        lists: () => [...inventoryKeys.suppliers.all(), 'list'] as const,
        list: (filters: string) => [...inventoryKeys.suppliers.lists(), { filters }] as const,
        details: () => [...inventoryKeys.suppliers.all(), 'detail'] as const,
        detail: (id: number) => [...inventoryKeys.suppliers.details(), id] as const,
    },
    products: {
        all: () => [...inventoryKeys.all, 'products'] as const,
        lists: () => [...inventoryKeys.products.all(), 'list'] as const,
        list: (params?: any) => [...inventoryKeys.products.lists(), { params }] as const,
        details: () => [...inventoryKeys.products.all(), 'detail'] as const,
        detail: (id: number) => [...inventoryKeys.products.details(), id] as const,
        variations: (productId: number) => [...inventoryKeys.products.detail(productId), 'variations'] as const,
        variation: (productId: number, id: number) => [...inventoryKeys.products.variations(productId), id] as const,
        galleries: (productId: number) => [...inventoryKeys.products.detail(productId), 'galleries'] as const,
        gallery: (productId: number, id: number) => [...inventoryKeys.products.galleries(productId), id] as const,
        analytics: (productId: number, days?: number) => [...inventoryKeys.products.detail(productId), 'analytics', days] as const,
        stockHistory: (productId: number, days?: number) => [...inventoryKeys.products.detail(productId), 'stock-history', days] as const,
        salesHistory: (productId: number, days?: number) => [...inventoryKeys.products.detail(productId), 'sales-history', days] as const,
    },
};

// Category Hooks
export const useCategories = (filters?: string) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.categories.list(filters || ''), selectedBranchId],
        queryFn: categoriesApi.getAll,
    });
};

export const useOnlineCategories = (filters?: string) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['online-categories', filters, selectedBranchId],
        queryFn: () => onlineCategoriesApi.getAll(),
    });
};

export const useCreateOnlineCategory = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: onlineCategoriesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['online-categories'] });
            toast({ title: 'Success', description: 'Online category created' });
        },
    });
};

export const useUpdateOnlineCategory = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: onlineCategoriesApi.update,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['online-categories'] });
            queryClient.invalidateQueries({ queryKey: ['online-categories', data.id] });
            toast({ title: 'Success', description: 'Online category updated' });
        },
    });
};

export const useDeleteOnlineCategory = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: onlineCategoriesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['online-categories'] });
            toast({ title: 'Success', description: 'Online category deleted' });
        },
    });
};

export const useUpdateOnlineCategoryOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: onlineCategoriesApi.updateOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['online-categories'] });
        },
    });
};

export const useCategory = (id: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.categories.detail(id), selectedBranchId],
        queryFn: () => categoriesApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateCategory = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: categoriesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.lists() });
            toast({ title: 'Success', description: 'Category created' });
        },
    });
};

export const useUpdateCategory = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: categoriesApi.update,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.lists() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.detail(data.id) });
            toast({ title: 'Success', description: 'Category updated' });
        },
    });
};

export const useDeleteCategory = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: categoriesApi.delete,
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.lists() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.categories.detail(id) });
            toast({ title: 'Success', description: 'Category deleted' });
        },
    });
};

// Supplier Hooks
export const useSuppliers = (filters?: string) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['suppliers', filters, selectedBranchId],
        queryFn: supplierApi.getAll,
    });
};

export const useSupplier = (id: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['suppliers', id, selectedBranchId],
        queryFn: () => supplierApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: supplierApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        },
    });
};

export const useUpdateSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: supplierApi.update,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers', data.id] });
        },
    });
};

export const useDeleteSupplier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: supplierApi.delete,
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            queryClient.invalidateQueries({ queryKey: ['suppliers', id] });
        },
    });
};

// Product Hooks
export const useProducts = (params?: any) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.list(params), selectedBranchId],
        queryFn: () => productsApi.getAll(params),
    });
};

export const useProductStats = (params?: any) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.lists(), 'stats', { params }, selectedBranchId],
        queryFn: () => productsApi.getStats(params),
    });
};

export const useInfiniteProducts = (params?: any, options?: any) => {
    const { selectedBranchId } = useBranch();
    return useInfiniteQuery({
        queryKey: [...inventoryKeys.products.lists(), 'infinite', { params }, selectedBranchId],
        queryFn: ({ pageParam = 1 }) => productsApi.getAll({ ...params, page: pageParam }),
        getNextPageParam: (lastPage) => {
            if (lastPage.next) {
                const url = new URL(lastPage.next);
                return parseInt(url.searchParams.get('page') || '1');
            }
            return undefined;
        },
        initialPageParam: 1,
        ...options,
    });
};

export const useProduct = (id: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.detail(id), selectedBranchId],
        queryFn: () => productsApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: productsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.lists() });
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: productsApi.update,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.lists() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.detail(data.id) });
            toast({ title: 'Success', description: 'Product updated' });
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: productsApi.delete,
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.lists() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.detail(id) });
            toast({ title: 'Success', description: 'Product deleted' });
        },
        onError: (error: any) => {
            // Only log actual errors, not successful 204/200 responses
            if (error?.response?.status !== 204 && error?.response?.status !== 200) {
                console.error('Delete product failed:', error.response?.data || error.message);
                toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
            }
        },
    });
};

// Product Variation Hooks
export const useProductVariations = (productId: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.variations(productId), selectedBranchId],
        queryFn: () => productVariationsApi.getAll(productId),
        enabled: !!productId,
    });
};

export const useProductVariation = (productId: number, id: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.variation(productId, id), selectedBranchId],
        queryFn: () => productVariationsApi.getById(productId, id),
        enabled: !!productId && !!id,
    });
};

export const useCreateProductVariation = (productId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variation: CreateProductVariationDTO) => productVariationsApi.create(productId, variation),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.variations(productId) });
        },
    });
};

export const useUpdateProductVariation = (productId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variation: UpdateProductVariationDTO) => productVariationsApi.update(productId, variation),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.variations(productId) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.variation(productId, data.id) });
        },
    });
};

export const useDeleteProductVariation = (productId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => productVariationsApi.delete(productId, id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.variations(productId) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.variation(productId, id) });
        },
    });
};

// Gallery Hooks
export const useProductGalleries = (productId: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.galleries(productId), selectedBranchId],
        queryFn: () => galleriesApi.getAll(productId),
        enabled: !!productId,
    });
};

export const useGallery = (id: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['gallery', id, selectedBranchId],
        queryFn: () => galleriesApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateGallery = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (gallery: CreateGalleryDTO) => galleriesApi.create(gallery),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.galleries(data.id) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.detail(data.id) });
        },
    });
};

export const useUploadColorImages = (productId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (formData: FormData) => galleriesApi.uploadColorImages(productId, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.galleries(productId) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.detail(productId) });
        },
    });
};

// Gallery Image Hooks
export const useCreateGalleryImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (image: CreateGalleryImageDTO) => galleryImagesApi.create(image),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['galleries'] });
        },
    });
};

export const useDeleteGalleryImage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => galleryImagesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['galleries'] });
        },
    });
};

// Dashboard Hooks
export const useDashboardOverview = (period: 'day' | 'month' | 'year' = 'day') => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.dashboard.overview(period), selectedBranchId],
        queryFn: () => dashboardApi.getOverview(period),
    });
};

export const useStockAlerts = () => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.dashboard.stockAlerts(), selectedBranchId],
        queryFn: dashboardApi.getStockAlerts,
    });
};

export const useCategoryMetrics = () => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.dashboard.categoryMetrics(), selectedBranchId],
        queryFn: dashboardApi.getCategoryMetrics,
    });
};

export const useStockMovementAnalysis = (period: 'day' | 'month' | 'year' = 'month') => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.dashboard.stockMovementAnalysis(period), selectedBranchId],
        queryFn: () => dashboardApi.getStockMovementAnalysis(period),
    });
};

// Product Analytics Hooks
export const useProductAnalytics = (productId: number, days?: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.analytics(productId, days), selectedBranchId],
        queryFn: () => productsApi.getAnalytics(productId, days),
        enabled: !!productId,
    });
};

export const useProductStockHistory = (productId: number, days?: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.stockHistory(productId, days), selectedBranchId],
        queryFn: () => productsApi.getStockHistory(productId, days),
        enabled: !!productId,
    });
};

export const useProductSalesHistory = (productId: number, days?: number) => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: [...inventoryKeys.products.salesHistory(productId, days), selectedBranchId],
        queryFn: () => productsApi.getSalesHistory(productId, days),
        enabled: !!productId,
    });
};

// Add Stock Hook
export const useAddStock = (productId: number) => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: ({ variationId, quantity, notes }: { variationId: number; quantity: number; notes?: string }) =>
            productsApi.addStock(productId, variationId, quantity, notes),
        onSuccess: () => {
            // Invalidate relevant queries to refresh data
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.detail(productId) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.variations(productId) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.analytics(productId, 30) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.products.stockHistory(productId, 90) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboard.stockAlerts() });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.dashboard.stockMovementAnalysis('month') });
            toast({ title: 'Success', description: 'Stock added successfully' });
        },
    });
}; 
