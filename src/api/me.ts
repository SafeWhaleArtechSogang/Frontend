import { http } from "./http";
import type { Report, User, AppNotification } from "@/types";
import type { Page } from "./http";

export const meApi = {
  getProfile: () => http.get<User>("/me/profile"),

  getReports: (page = 0, size = 20) =>
    http.get<Page<Report>>(`/me/reports?page=${page}&size=${size}`),

  getNotifications: (page = 0, size = 20) =>
    http.get<Page<AppNotification>>(
      `/me/notifications?page=${page}&size=${size}`,
    ),

  readNotification: (id: string) =>
    http.patch<null>(`/me/notifications/${id}/read`),
};
