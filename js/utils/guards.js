// js/utils/guards.js

import { getAuth } from './storage.js';

export function requireAuthOrRedirect() {
  const auth = getAuth();
  if (!auth?.accessToken) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}
