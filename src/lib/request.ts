/**
 * API request utilities
 */

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

export async function apiRequest(
  url: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { method = "GET", headers = {}, body } = options;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return response;
}

export async function apiRequestJson<T = any>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await apiRequest(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  return response.json() as T;
}

