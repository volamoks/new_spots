import { NextResponse } from "next/server";
// Import useLoaderStore
import { useLoaderStore } from '@/lib/stores/loaderStore'; // Adjust path if necessary

/**
 * Custom Error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data?: unknown; // Store potential error data from the response body

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}


/**
 * Универсальная функция для обработки ошибок в API-маршрутах
 * @param error Объект ошибки (неизвестного типа)
 * @returns NextResponse с сообщением об ошибке и статусом 500
 */
export function handleApiError(error: unknown) {
  console.error("[API Error]:", error);
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, data: error.data }, { status: error.status });
  }
  const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred";
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}

/**
 * Универсальная функция для выполнения запросов к API (без глобального лоадера)
 * @param url URL эндпоинта API (относительный или абсолютный)
 * @param method HTTP метод ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
 * @param body Тело запроса (для POST, PUT, PATCH)
 * @param options Дополнительные опции для fetch
 * @returns Промис с результатом запроса (распарсенный JSON)
 */
export async function fetchApi<T = unknown>( // Changed default to unknown
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: Record<string, unknown> | FormData, // Changed any to unknown
  options: RequestInit = {}
): Promise<T> {
  const defaultHeaders: HeadersInit = {};
  let requestBody: BodyInit | null = null;

  // Don't set Content-Type for FormData, browser does it with boundary
  if (body && !(body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  } else if (body instanceof FormData) {
    requestBody = body;
  }

  const config: RequestInit = {
    method: method,
    headers: {
      ...defaultHeaders,
      ...options.headers, // Allow overriding default headers
    },
    ...options, // Spread other options like cache, mode, etc.
  };

  if (requestBody) {
    config.body = requestBody;
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData: unknown;
      try {
        // Try to parse error response from API
        errorData = await response.json();
      } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        // If parsing fails, use status text as a fallback message
        errorData = { message: response.statusText };
      }
      // Type guard to check for message property
      const isErrorWithMessage = (error: unknown): error is { message: string } => {
        return (
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof error['message'] === 'string' // Check if message is string using index access
        );
      };
      const message = isErrorWithMessage(errorData) ? errorData.message : `HTTP error! status: ${response.status}`;
      console.error(`API Error (${response.status}):`, errorData);
      // Throw custom ApiError
      throw new ApiError(message, response.status, errorData); // Use ApiError
    }

    // Handle cases with no content (e.g., 204 No Content)
    if (response.status === 204) {
      return undefined as T; // Or null, depending on desired behavior
    }

    // Assuming the successful response is always JSON
    return await response.json() as T;

  } catch (error) {
    // Log if it's not already an ApiError (which we logged before throwing)
    if (!(error instanceof ApiError)) {
      console.error("Fetch API request failed:", error);
    }
    // Re-throw the error so the calling code can handle it
    throw error;
  }
}

/**
 * Выполняет запрос к API с использованием глобального индикатора загрузки.
 * Обертка над fetchApi, интегрированная с useLoaderStore.
 * @param url URL эндпоинта API
 * @param method HTTP метод
 * @param loadingMessage Сообщение для отображения во время загрузки
 * @param body Тело запроса (опционально)
 * @param options Дополнительные опции fetch (опционально)
 * @returns Промис с результатом запроса (распарсенный JSON)
 */
export async function fetchWithLoading<T = unknown>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  loadingMessage: string,
  body?: Record<string, unknown> | FormData,
  options: RequestInit = {}
): Promise<T> {
  const { withLoading } = useLoaderStore.getState();

  // Wrap the fetchApi call with the loader
  return withLoading(
    fetchApi<T>(url, method, body, options), // Call the original fetchApi
    loadingMessage
  );
}