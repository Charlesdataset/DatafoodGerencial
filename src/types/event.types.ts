import type { EventStatus } from "./EventStatus";

// Tipos de evento
export interface Event {
  id: number;
  title: string;
  ticket: string;
  startDate: string | Date;
  endDate: string | Date;
  status: EventStatus;
  caminhoLogo: string | null;
  companyId: number;
  companyName: string;
  printValue: "S" | "N";
  printControl: "S" | "N";
  printPayment: "S" | "N";
  printDatetime: "S" | "N";
  printValid: "S" | "N";
  printFinish: "S" | "N";
  confirmation: "S" | "N";
  passwordCancel: "S" | "N";
  passwordItem: "S" | "N";
  noLogin: "S" | "N";
  noStock: "S" | "N";
  validTime: number;
  canceled: boolean;
}

export interface EventFormData {
  title: string;
  ticket: string;
  startDate: Date;
  endDate: Date;
  printValue: "S" | "N";
  printControl: "S" | "N";
  printPayment: "S" | "N";
  printDatetime: "S" | "N";
  printValid: "S" | "N";
  printFinish: "S" | "N";
  confirmation: "S" | "N";
  passwordCancel: "S" | "N";
  passwordItem: "S" | "N";
  noLogin: "S" | "N";
  noStock: "S" | "N";
  validTime: number;
  canceled: boolean;
  companyId?: number;
}

export interface EventFilters {
  textSearch: string;
  status: string;
  clientId: number;
}

export interface EventReport {
  eventId: number;
  companyId: number;
  fileName: string;
  blobUrl: string;
}
