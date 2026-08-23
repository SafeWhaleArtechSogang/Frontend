import { http } from "./http";
import type { Building, Report } from "@/types";

export const buildingApi = {
  list: () => http.get<Building[]>("/buildings"),
  get: (id: number) => http.get<Building>(`/buildings/${id}`),
  reports: (id: number) => http.get<Report[]>(`/buildings/${id}/reports`),
};
