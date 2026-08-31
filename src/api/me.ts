import { http } from "./http";
import type { Report, User, AppNotification } from "@/types";

export interface ProfileUpdateRequest {
  name: string;
  major: string;
  studentNo: string;
  phone: string;
}

export const meApi = {
  getProfile: () => http.get<User>("/me/profile"),

  updateProfile: (body: ProfileUpdateRequest) => http.patch<User>("/me/profile", body),

  getReports: () => http.get<Report[]>("/me/reports"),

  getNotifications: () => http.get<AppNotification[]>("/me/notifications"),

  readNotification: (id: number) =>
    http.patch<null>(`/me/notifications/${id}/read`),
};
