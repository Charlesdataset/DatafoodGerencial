export const EventStatus = {
  WAITING: "Aguardando",
  IN_PROGRESS: "Em andamento",
  FINISHED: "Finalizado",
  CANCELED: "Cancelado",
} as const;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];
