// js/utils/api.js

import { API_BASE_URL } from '../config.js';
import { getAuth, getApiKey } from './storage.js';

/**
 * Make an authenticated request to the Noroff API (v2).
 *
 * Automatically attaches `Authorization: Bearer ...` and `X-Noroff-API-Key` headers
 * when they are available in localStorage.
 *
 * @param {string} path - API path starting with `/` e.g. `/social/posts`.
 * @param {RequestInit} [options] - Fetch options.
 * @returns {Promise<any>} Parsed JSON response.
 *
 * @example
 * const posts = await apiRequest('/social/posts?limit=12')
 * console.log(posts.data)
 */
export async function apiRequest(path, options = {}) {
  const auth = getAuth();
  const apiKey = getApiKey();

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (auth?.accessToken) headers.set('Authorization', `Bearer ${auth.accessToken}`);
  if (apiKey) headers.set('X-Noroff-API-Key', apiKey);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = body?.errors?.[0]?.message || body?.message || res.statusText;
    const error = new Error(message);
    error.status = res.status;
    error.body = body;
    throw error;
  }

  return body;
}
