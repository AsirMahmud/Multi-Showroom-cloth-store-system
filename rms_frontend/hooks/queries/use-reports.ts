import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { reportsApi, formatDateRange, ReportDateRange, SalesReport, ExpenseReport, InventoryReport, CustomerReport, CategoryReport, ProfitLossReport, ProductPerformanceReport, OverviewReport, OnlinePreorderAnalytics, IntegrityReport } from '@/lib/api/reports';
import { useBranch } from '@/contexts/branch-context';

export const useSalesReport = (dateRange: DateRange | undefined) => {
    const formattedDateRange = formatDateRange(dateRange);

    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['sales-report', formattedDateRange, selectedBranchId],
        queryFn: () => reportsApi.getSalesReport(formattedDateRange!),
        enabled: !!formattedDateRange,
    });
};

export const useExpenseReport = (dateRange: DateRange | undefined) => {
    const formattedDateRange = formatDateRange(dateRange);

    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['expense-report', formattedDateRange, selectedBranchId],
        queryFn: () => reportsApi.getExpenseReport(formattedDateRange!),
        enabled: !!formattedDateRange,
    });
};

export const useInventoryReport = () => {
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['inventory-report', selectedBranchId],
        queryFn: reportsApi.getInventoryReport,
    });
};

export const useCustomerReport = (dateRange: DateRange | undefined) => {
    const formattedDateRange = formatDateRange(dateRange);

    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['customer-report', formattedDateRange, selectedBranchId],
        queryFn: () => reportsApi.getCustomerReport(formattedDateRange!),
        enabled: !!formattedDateRange,
    });
};

export const useCategoryReport = (dateRange: DateRange | undefined) => {
    const formattedDateRange = formatDateRange(dateRange);
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['category-report', formattedDateRange, selectedBranchId],
        queryFn: () => reportsApi.getCategoryReport(formattedDateRange!),
        enabled: !!formattedDateRange,
    });
};

export const useProfitLossReport = (dateRange: DateRange | undefined) => {
    const formattedDateRange = formatDateRange(dateRange);

    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['profit-loss-report', formattedDateRange, selectedBranchId],
        queryFn: () => reportsApi.getProfitLossReport(formattedDateRange!),
        enabled: !!formattedDateRange,
    });
};

export const useProductPerformanceReport = (dateRange: DateRange | undefined) => {
    const formattedDateRange = formatDateRange(dateRange);

    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['product-performance-report', formattedDateRange, selectedBranchId],
        queryFn: () => reportsApi.getProductPerformanceReport(formattedDateRange!),
        enabled: !!formattedDateRange,
    });
};

export function useOverviewReport(dateRange: DateRange) {
    const formattedDateRange = formatDateRange(dateRange);
    const { selectedBranchId } = useBranch();
    return useQuery<OverviewReport, Error>({
        queryKey: ['overviewReport', formattedDateRange, selectedBranchId],
        queryFn: () => reportsApi.getOverviewReport(formattedDateRange!),
        enabled: !!formattedDateRange,
    });
}

export function useOnlinePreorderAnalytics(dateRange: DateRange | undefined) {
    const formattedDateRange = formatDateRange(dateRange);
    const { selectedBranchId } = useBranch();
    return useQuery({
        queryKey: ['online-preorder-analytics', formattedDateRange, selectedBranchId],
        queryFn: () => reportsApi.getOnlinePreorderAnalytics(formattedDateRange!),
        enabled: !!formattedDateRange,
    });
} 

export function useIntegrityCheck() {
    return useQuery<IntegrityReport, Error>({
        queryKey: ['integrity-check'],
        queryFn: reportsApi.getIntegrityCheck,
        refetchOnWindowFocus: false,
    });
}