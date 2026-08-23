import { http } from "./http";
import type { Building, Report } from "@/types";

export const buildingApi = {
  list: () => http.get<Building[]>("/buildings"),
  get: (id: string) => http.get<Building>(`/buildings/${id}`),
  reports: (id: string) => http.get<Report[]>(`/buildings/${id}/reports`),
};
