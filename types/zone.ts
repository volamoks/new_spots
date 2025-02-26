export enum ZoneStatus {
  AVAILABLE = "AVAILABLE",
  BOOKED = "BOOKED",
  UNAVAILABLE = "UNAVAILABLE"
}

export interface Zone {
  id: string;
  uniqueIdentifier: string;
  region?: string;
  city: string;
  number: string;
  market: string;
  newFormat: string;
  equipmentFormat?: string;
  equipment: string;
  price?: number;
  externalId?: string;
  dimensions: string;
  mainMacrozone: string;
  adjacentMacrozone: string;
  sector?: string;
  km?: string;
  dmpNeighborhood?: string;
  purpose?: string;
  subpurpose?: string;
  status: ZoneStatus;
  supplier?: string;
  brand?: string;
  category?: string;
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

