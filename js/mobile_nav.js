(function () {
  'use strict';

  function initializeMobileNavigation() {
    var sidebar = document.getElementById('atlas-sidebar');
    var toggle = document.querySelector('[data-mobile-menu-toggle]');
    if (!sidebar || !toggle) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'mobile-sidebar-backdrop';
    document.body.appendChild(backdrop);
    var lastFocusedElement = null;

    function closeMenu() {
      sidebar.classList.remove('mobile-sidebar-open');
      sidebar.classList.add('d-none');
      backdrop.classList.remove('mobile-sidebar-open');
      document.body.classList.remove('mobile-menu-is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
      lastFocusedElement = null;
    }

    toggle.addEventListener('click', function () {
      if (!sidebar.classList.contains('mobile-sidebar-open')) {
        lastFocusedElement = document.activeElement;
      }
      sidebar.classList.remove('d-none');
      var open = sidebar.classList.toggle('mobile-sidebar-open');
      if (!open) sidebar.classList.add('d-none');
      backdrop.classList.toggle('mobile-sidebar-open', open);
      document.body.classList.toggle('mobile-menu-is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (open) {
        var activeLink = sidebar.querySelector('.nav-link.active') || sidebar.querySelector('.nav-link');
        if (activeLink) activeLink.focus();
      }
    });

    backdrop.addEventListener('click', closeMenu);
    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
      if (event.key !== 'Tab' || !sidebar.classList.contains('mobile-sidebar-open')) return;
      var focusable = sidebar.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMobileNavigation);
  } else {
    initializeMobileNavigation();
  }
}());
