// js/main.js

import { initMenu } from './menu.js';
import { initAuthPage } from './pages/authPage.js';
import { initFeedPage } from './pages/feedPage.js';
import { initProfilePage } from './pages/profilePage.js';
import { initPostPage } from './pages/postPage.js';
import { requireAuthOrRedirect } from './utils/guards.js';

document.addEventListener('DOMContentLoaded', () => {
  initMenu();

  const page = document.body?.dataset?.page;

  switch (page) {
    case 'auth':
      initAuthPage();
      break;
    case 'feed':
      requireAuthOrRedirect();
      initFeedPage();
      break;
    case 'profile':
      requireAuthOrRedirect();
      initProfilePage();
      break;
    case 'post':
      requireAuthOrRedirect();
      initPostPage();
      break;
    default:
      // No-op for static pages
      break;
  }
});
