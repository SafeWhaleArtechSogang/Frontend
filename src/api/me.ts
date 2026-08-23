import { http } from "./http";
import type { Report, User, AppNotification } from "@/types";

export const meApi = {
  getProfile: () => http.get<User>("/me/profile"),

  getReports: () => http.get<Report[]>("/me/reports"),

  getNotifications: () => http.get<AppNotification[]>("/me/notifications"),

  readNotification: (id: number) =>
    http.patch<null>(`/me/notifications/${id}/read`),
};
