(function () {
  'use strict';

  function initializeMobileNavigation() {
    var sidebar = document.getElementById('atlas-sidebar');
    var toggle = document.querySelector('[data-mobile-menu-toggle]');
    if (!sidebar || !toggle) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'mobile-sidebar-backdrop';
    document.body.appendChild(backdrop);

    function closeMenu() {
      sidebar.classList.remove('mobile-sidebar-open');
      backdrop.classList.remove('mobile-sidebar-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var open = sidebar.classList.toggle('mobile-sidebar-open');
      backdrop.classList.toggle('mobile-sidebar-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });

    backdrop.addEventListener('click', closeMenu);
    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileNavigation);
  } else {
    initializeMobileNavigation();
  }
}());
