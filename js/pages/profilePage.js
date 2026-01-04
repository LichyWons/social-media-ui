// js/pages/profilePage.js

import { apiRequest } from '../utils/api.js';
import { getAuth } from '../utils/storage.js';

function qs(id) {
  return document.getElementById(id);
}

function getFirstMediaUrl(post) {
  if (Array.isArray(post?.media) && post.media[0]?.url) return post.media[0].url;
  if (post?.media?.url) return post.media.url;
  return null;
}

async function fetchMyProfile(name) {
  const res = await apiRequest(`/social/profiles/${encodeURIComponent(name)}`);
  return res?.data;
}

async function fetchMyPosts(name) {
  const res = await apiRequest(`/social/profiles/${encodeURIComponent(name)}/posts?limit=50`);
  return res?.data || [];
}

function renderPost(post) {
  const article = document.createElement('article');
  article.className = 'bg-white p-4 rounded-xl shadow-md w-full max-w-3xl flex flex-col items-center text-center';
  const mediaUrl = getFirstMediaUrl(post);
  article.innerHTML = `
    ${mediaUrl ? `<img src="${mediaUrl}" alt="" class="w-full h-60 object-cover rounded-md mb-4">` : ''}
    <h4 class="text-lg font-bold mb-2">${post?.title || '(Untitled)'}</h4>
    <p class="text-sm text-gray-700 mb-4">${(post?.body || '').slice(0, 160)}${(post?.body || '').length > 160 ? '…' : ''}</p>
    <a href="/post/index.html?id=${encodeURIComponent(post?.id)}" class="text-blue-600 hover:underline">Read more</a>
  `;
  return article;
}

export async function initProfilePage() {
  const auth = getAuth();
  const name = auth?.name;
  const usernameEl = qs('profile-username');
  const avatarEl = qs('profile-avatar');
  const postsEl = qs('profile-posts');
  const statusEl = qs('profile-status');

  if (!name || !postsEl) return;

  const setStatus = (msg) => {
    if (!statusEl) return;
    statusEl.textContent = msg || '';
    statusEl.classList.toggle('hidden', !msg);
  };

  try {
    setStatus('Loading profile...');
    const profile = await fetchMyProfile(name);
    const posts = await fetchMyPosts(name);
    setStatus('');

    if (usernameEl) usernameEl.textContent = profile?.name || name;
    if (avatarEl && profile?.avatar?.url) avatarEl.src = profile.avatar.url;

    postsEl.innerHTML = '';
    if (!posts.length) {
      postsEl.innerHTML = '<p class="text-center text-gray-600">No posts yet.</p>';
      return;
    }
    posts.forEach((p) => postsEl.appendChild(renderPost(p)));
  } catch (err) {
    setStatus(err?.message || 'Failed to load profile');
  }
}
