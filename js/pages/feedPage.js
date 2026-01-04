// js/pages/feedPage.js

import { apiRequest } from '../utils/api.js';
import { getAuth } from '../utils/storage.js';

function qs(id) {
  return document.getElementById(id);
}

function setStatus(msg, type = 'info') {
  const el = qs('feed-status');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
  el.dataset.type = type;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '';
  }
}

function getFirstMediaUrl(post) {
  // v2 uses Media objects; support either object or array.
  if (Array.isArray(post?.media) && post.media[0]?.url) return post.media[0].url;
  if (post?.media?.url) return post.media.url;
  return null;
}

function renderPostCard(post, currentUserName) {
  const article = document.createElement('article');
  article.className = 'bg-white p-4 rounded-xl shadow-md w-full max-w-3xl flex flex-col items-center text-center';
  const mediaUrl = getFirstMediaUrl(post);
  const authorName = post?.owner || post?.author?.name || 'Unknown';
  const canEdit = authorName === currentUserName;

  article.innerHTML = `
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 rounded-full border-2 border-black bg-gray-200 flex items-center justify-center font-bold">@</div>
      <p class="text-sm text-gray-500">
        Posted by <span class="font-semibold text-black">${authorName}</span>
        <span class="ml-2">• ${formatDate(post?.created)}</span>
      </p>
    </div>
    ${mediaUrl ? `<img src="${mediaUrl}" alt="" class="w-full h-60 object-cover rounded-md mb-4">` : ''}
    <h4 class="text-lg font-bold mb-2">${post?.title || '(Untitled)'}</h4>
    <p class="text-sm text-gray-700 mb-4">${(post?.body || '').slice(0, 160)}${(post?.body || '').length > 160 ? '…' : ''}</p>
    <div class="flex gap-3">
      <a href="/post/index.html?id=${encodeURIComponent(post?.id)}" class="text-blue-600 hover:underline">Read more</a>
      ${canEdit ? `<button data-action="edit" data-id="${post.id}" class="text-black underline">Edit</button>` : ''}
      ${canEdit ? `<button data-action="delete" data-id="${post.id}" class="text-red-600 underline">Delete</button>` : ''}
    </div>
  `;

  return article;
}

async function fetchPosts() {
  // Use pagination limit; sorting done client-side to keep UI simple.
  const res = await apiRequest('/social/posts?limit=50');
  return res?.data || [];
}

function applySearchAndSort(posts, { query, sort, filter, currentUserName }) {
  let list = [...posts];

  if (filter === 'mine' && currentUserName) {
    list = list.filter((p) => (p.owner || p.author?.name) === currentUserName);
  }
  if (filter === 'with_media') {
    list = list.filter((p) => Boolean(getFirstMediaUrl(p)));
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter((p) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.body || '').toLowerCase().includes(q) ||
      (p.owner || '').toLowerCase().includes(q)
    );
  }

  switch (sort) {
    case 'date_desc':
      list.sort((a, b) => new Date(b.created) - new Date(a.created));
      break;
    case 'date_asc':
      list.sort((a, b) => new Date(a.created) - new Date(b.created));
      break;
    default:
      list.sort((a, b) => new Date(b.created) - new Date(a.created));
      break;
  }
  return list;
}

async function createPost({ title, body }) {
  const payload = { title, body };
  const res = await apiRequest('/social/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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
  await apiRequest(`/social/posts/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function initFeedPage() {
  const postsContainer = qs('posts-container');
  const searchInput = qs('search-input');
  const sortSelect = qs('sort-select');
  const filterSelect = qs('filter-select');
  const form = qs('create-post-form');

  if (!postsContainer || !searchInput || !sortSelect || !form) return;

  const auth = getAuth();
  const currentUserName = auth?.name;

  let allPosts = [];

  const render = () => {
    const query = searchInput.value.trim();
    const sort = sortSelect.value;
    const filter = filterSelect ? filterSelect.value : 'all';
    const visible = applySearchAndSort(allPosts, { query, sort, filter, currentUserName });
    postsContainer.innerHTML = '';
    if (!visible.length) {
      postsContainer.innerHTML = '<p class="text-center text-gray-600">No posts found.</p>';
      return;
    }
    visible.forEach((post) => postsContainer.appendChild(renderPostCard(post, currentUserName)));
  };

  const reload = async () => {
    try {
      setStatus('Loading posts...');
      allPosts = await fetchPosts();
      setStatus('');
      render();
    } catch (err) {
      setStatus(err?.message || 'Failed to load posts', 'error');
    }
  };

  searchInput.addEventListener('input', render);
  sortSelect.addEventListener('change', render);
  if (filterSelect) filterSelect.addEventListener('change', render);
  if (filterSelect) filterSelect.addEventListener('change', render);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = form.querySelector('#title')?.value?.trim();
    const body = form.querySelector('#content')?.value?.trim();

    if (!title || !body) {
      setStatus('Title and content are required', 'error');
      return;
    }
    try {
      setStatus('Creating post...');
      const newPost = await createPost({ title, body });
      form.reset();
      setStatus('');
      allPosts = [newPost, ...allPosts];
      render();
    } catch (err) {
      setStatus(err?.message || 'Failed to create post', 'error');
    }
  });

  postsContainer.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!id) return;

    try {
      if (action === 'delete') {
        const ok = window.confirm('Delete this post?');
        if (!ok) return;
        setStatus('Deleting post...');
        await deletePost(id);
        allPosts = allPosts.filter((p) => String(p.id) !== String(id));
        setStatus('');
        render();
      }

      if (action === 'edit') {
        const post = allPosts.find((p) => String(p.id) === String(id));
        if (!post) return;
        const nextTitle = window.prompt('Edit title', post.title || '');
        if (nextTitle === null) return;
        const nextBody = window.prompt('Edit content', post.body || '');
        if (nextBody === null) return;
        setStatus('Updating post...');
        const updated = await updatePost(id, { title: nextTitle, body: nextBody });
        allPosts = allPosts.map((p) => (String(p.id) === String(id) ? updated : p));
        setStatus('');
        render();
      }
    } catch (err) {
      setStatus(err?.message || 'Action failed', 'error');
    }
  });

  reload();
}
