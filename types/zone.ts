export enum ZoneStatus {
  AVAILABLE = "AVAILABLE",
  BOOKED = "BOOKED",
  UNAVAILABLE = "UNAVAILABLE"
}

export interface Zone {
  id: string;
  uniqueIdentifier: string;
  region: string | null | undefined;
  city: string;
  number: string;
  market: string;
  newFormat: string;
  equipmentFormat: string | null | undefined;
  equipment: string;
  price?: number | null;
  externalId?: string | null;
  dimensions: string;
  mainMacrozone: string;
  adjacentMacrozone: string;
  sector?: string | null;
  km?: string | null;
  dmpNeighborhood?: string | null;
  purpose?: string | null;
  subpurpose?: string | null;
  status: ZoneStatus;
  supplier?: string | null;
  brand?: string | null;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoneData {
  Область: string
  Город: string
  "№": string
  Маркет: string
  "Формат маркета": string
  "Формат оборудования": string
  Оборудование: string
  Цена: number
  ID: string
  Габариты: string
  "Уникальный идентификатор": string
  Сектор: string
  КМ: string
  "Основная Макрозона": string
  "Смежная макрозона": string
  "Товарное соседство ДМП": string
  Назначение: string
  Подназначение: string
  Категория: string
  Поставщик: string
  Brand: string
  "Категория товара": string
  Статус: string
}
