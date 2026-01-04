// js/menu.js

export function initMenu() {
    console.log('Popup menu with scale + toggle icon loaded');
  
    const menuToggle = document.getElementById('menu-toggle');
    const menuOverlay = document.getElementById('menu-overlay');
  
    if (menuToggle && menuOverlay) {
      menuToggle.addEventListener('click', () => {
        if (menuOverlay.classList.contains('hidden')) {
          openMenu();
        } else {
          closeMenu();
        }
      });
  
      const openMenu = () => {
        menuOverlay.classList.remove('hidden');
        requestAnimationFrame(() => {
          menuOverlay.classList.remove('scale-0');
          menuOverlay.classList.add('scale-100');
        });
        menuToggle.textContent = '×'; // zmiana na krzyżyk
      };
  
      const closeMenu = () => {
        menuOverlay.classList.remove('scale-100');
        menuOverlay.classList.add('scale-0');
        menuOverlay.addEventListener('transitionend', function handler() {
          menuOverlay.classList.add('hidden');
          menuOverlay.removeEventListener('transitionend', handler);
        });
        menuToggle.textContent = '☰'; // powrót do burgera
      };
  
      // Opcjonalnie: zamykanie kliknięciem poza menu
      document.addEventListener('click', (e) => {
        if (!menuOverlay.contains(e.target) && e.target !== menuToggle) {
          if (!menuOverlay.classList.contains('hidden')) {
            closeMenu();
          }
        }
      });
    }
  }
  