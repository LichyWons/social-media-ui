// js/pages/authPage.js

import { clearAuth, clearApiKey } from '../utils/storage.js';
import { isNoroffEmail, loginOrRegister } from '../utils/auth.js';

function setError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
}

function setLoading(form, isLoading) {
  const btn = form.querySelector('button[type="submit"]');
  if (btn) {
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Working...' : 'Login / Register';
  }
}

export function initAuthPage() {
  // Treat landing page as logged-out state.
  clearAuth();
  clearApiKey();

  const form = document.getElementById('auth-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError('');

    const email = form.querySelector('#email')?.value?.trim();
    const password = form.querySelector('#password')?.value;

    if (!isNoroffEmail(email)) {
      setError('Use a @noroff.no or @stud.noroff.no email');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(form, true);
      await loginOrRegister({ email, password });
      window.location.href = '/feed/index.html';
    } catch (err) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(form, false);
    }
  });
}
