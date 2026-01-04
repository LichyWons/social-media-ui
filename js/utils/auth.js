// js/utils/auth.js

import { APP } from '../config.js';
import { apiRequest } from './api.js';
import { getApiKey, setApiKey, setAuth } from './storage.js';

const ALLOWED_DOMAINS = ['noroff.no', 'stud.noroff.no'];

export function isNoroffEmail(email) {
  const domain = String(email).trim().toLowerCase().split('@')[1] || '';
  return ALLOWED_DOMAINS.includes(domain);
}

function deriveNameFromEmail(email) {
  const local = String(email).split('@')[0] || 'student';
  // API requires a profile name with only letters/numbers/underscore, so sanitize.
  return local.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20) || 'student';
}

export async function register({ email, password, name }) {
  const profileName = name?.trim() || deriveNameFromEmail(email);
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: profileName, email, password }),
  });
}

export async function login({ email, password }) {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // v2 wraps response in { data }
  const data = res?.data;
  if (!data?.accessToken) throw new Error('Login succeeded but access token was missing');

  setAuth({
    accessToken: data.accessToken,
    name: data.name,
    email: data.email,
  });

  return data;
}

export async function ensureApiKey() {
  const existing = getApiKey();
  if (existing) return existing;

  const res = await apiRequest('/auth/create-api-key', {
    method: 'POST',
    body: JSON.stringify({ name: APP.apiKeyName }),
  });

  const key = res?.data?.key;
  if (!key) throw new Error('Failed to create API key');
  setApiKey(key);
  return key;
}

/**
 * Convenience flow for the current UI: try login; if it fails, try register then login.
 */
export async function loginOrRegister({ email, password }) {
  try {
    const user = await login({ email, password });
    await ensureApiKey();
    return user;
  } catch (err) {
    // If login fails because the user doesn't exist, register then login.
    // If register fails because user already exists, surface the original login error.
    try {
      await register({ email, password });
    } catch (regErr) {
      const status = regErr?.status;
      if (status === 409) throw err;
      throw regErr;
    }
    const user = await login({ email, password });
    await ensureApiKey();
    return user;
  }
}
