// js/utils/storage.js

import { STORAGE_KEYS } from '../config.js';

export function getAuth() {
  const raw = localStorage.getItem(STORAGE_KEYS.auth);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(auth) {
  localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(auth));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.auth);
}

export function getApiKey() {
  return localStorage.getItem(STORAGE_KEYS.apiKey);
}

export function setApiKey(key) {
  localStorage.setItem(STORAGE_KEYS.apiKey, key);
}

export function clearApiKey() {
  localStorage.removeItem(STORAGE_KEYS.apiKey);
}
