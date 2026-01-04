// js/pages/postPage.js

import { apiRequest } from '../utils/api.js';
import { getAuth } from '../utils/storage.js';

function qs(id) {
  return document.getElementById(id);
}

function getIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function getFirstMediaUrl(post) {
  if (Array.isArray(post?.media) && post.media[0]?.url) return post.media[0].url;
  if (post?.media?.url) return post.media.url;
  return null;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

async function getPostById(id) {
  const res = await apiRequest(`/social/posts/${encodeURIComponent(id)}`);
  return res?.data;
}

async function updatePost(id, { title, body }) {
  const res = await apiRequest(`/social/posts/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({ title, body }),
  });
  return res?.data;
}

async function deletePost(id) {
  await apiRequest(`/social/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function initPostPage() {
  const id = getIdFromQuery();
  const container = qs('post-container');
  const status = qs('post-status');
  if (!container || !id) {
    if (status) status.textContent = 'Missing post id';
    return;
  }

  const auth = getAuth();
  const currentUserName = auth?.name;

  const setStatus = (msg) => {
    if (!status) return;
    status.textContent = msg || '';
    status.classList.toggle('hidden', !msg);
  };

  try {
    setStatus('Loading post...');
    let post = await getPostById(id);
    setStatus('');

    const mediaUrl = getFirstMediaUrl(post);
    const authorName = post?.owner || post?.author?.name || 'Unknown';
    const canEdit = authorName === currentUserName;

    container.innerHTML = `
      <article class="bg-white p-6 rounded-xl shadow-md">
        <p class="text-sm text-gray-500 mb-2">Posted by <span class="font-semibold text-black">${authorName}</span> • ${formatDate(post?.created)}</p>
        <h2 class="text-2xl font-bold mb-4">${post?.title || '(Untitled)'}</h2>
        ${mediaUrl ? `<img src="${mediaUrl}" alt="" class="w-full max-h-[420px] object-cover rounded-md mb-4">` : ''}
        <p class="text-gray-800 whitespace-pre-wrap">${post?.body || ''}</p>
        <div class="mt-6 flex gap-4">
          <a href="/feed/index.html" class="text-blue-600 hover:underline">Back to feed</a>
          ${canEdit ? `<button id="post-edit" class="text-black underline">Edit</button>` : ''}
          ${canEdit ? `<button id="post-delete" class="text-red-600 underline">Delete</button>` : ''}
        </div>
      </article>
    `;

    if (canEdit) {
      container.querySelector('#post-delete')?.addEventListener('click', async () => {
        const ok = window.confirm('Delete this post?');
        if (!ok) return;
        try {
          setStatus('Deleting...');
          await deletePost(id);
          window.location.href = '/feed/index.html';
        } catch (err) {
          setStatus(err?.message || 'Failed to delete');
        }
      });

      container.querySelector('#post-edit')?.addEventListener('click', async () => {
        const nextTitle = window.prompt('Edit title', post?.title || '');
        if (nextTitle === null) return;
        const nextBody = window.prompt('Edit content', post?.body || '');
        if (nextBody === null) return;
        try {
          setStatus('Updating...');
          post = await updatePost(id, { title: nextTitle, body: nextBody });
          setStatus('Updated');
          // re-render by reloading the page state
          window.location.reload();
        } catch (err) {
          setStatus(err?.message || 'Failed to update');
        }
      });
    }
  } catch (err) {
    setStatus(err?.message || 'Failed to load post');
  }
}
