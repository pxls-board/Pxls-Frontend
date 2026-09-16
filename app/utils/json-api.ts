export interface ApiResult<T = unknown> {
  success?: boolean;
  details?: T;
}

async function request<T>(url: string, method: string, body?: unknown): Promise<ApiResult<T>> {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json;q=1.0, */*;q=0.5',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  try {
    return JSON.parse(text) as ApiResult<T>;
  } catch {
    return { success: false, details: text as T };
  }
}

/** JSON helpers for the profile/faction endpoints, which answer `{ success, details }`. */
export const jsonApi = {
  get: <T>(url: string) => request<T>(url, 'GET'),
  post: <T>(url: string, data: unknown = {}) => request<T>(url, 'POST', data),
  put: <T>(url: string, data: unknown = {}) => request<T>(url, 'PUT', data),
  delete: <T>(url: string, data?: unknown) => request<T>(url, 'DELETE', data),
};
