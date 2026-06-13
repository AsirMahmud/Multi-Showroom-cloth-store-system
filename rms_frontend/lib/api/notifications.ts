import axiosInstance from "@/lib/api/axios-config";

export interface Notification {
  id: number;
  kind: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  branch: number | null;
  branch_name: string | null;
  created_at: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const notificationsApi = {
  list: async (params?: { is_read?: boolean; page?: number }) => {
    const res = await axiosInstance.get<PaginatedResponse<Notification>>(
      "/notifications/",
      { params }
    );
    return res.data;
  },

  unreadCount: async () => {
    const res = await axiosInstance.get<{ count: number }>(
      "/notifications/unread_count/"
    );
    return res.data.count;
  },

  markRead: async (id: number) => {
    const res = await axiosInstance.post<Notification>(
      `/notifications/${id}/mark_read/`
    );
    return res.data;
  },

  markAllRead: async () => {
    const res = await axiosInstance.post<{ updated: number }>(
      "/notifications/mark_all_read/"
    );
    return res.data;
  },
};
