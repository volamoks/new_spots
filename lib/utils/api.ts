import { NextResponse } from "next/server";

/**
 * Универсальная функция для обработки ошибок в API-маршрутах
 * @param error Объект ошибки (неизвестного типа)
 * @returns NextResponse с сообщением об ошибке и статусом 500
 */
export function handleApiError(error: unknown) {
  const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
  console.error("[API Error]:", error);
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}