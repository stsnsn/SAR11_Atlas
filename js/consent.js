(function () {
  'use strict';

  var storageKey = 'sar11-analytics-consent';
  var measurementId = 'G-4J68VLT52H';

  function loadAnalytics() {
    if (window.__sar11AnalyticsLoaded) return;
    window.__sar11AnalyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId);
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
  }

  function saveChoice(choice) {
    localStorage.setItem(storageKey, choice);
    document.documentElement.classList.remove('analytics-consent-visible');
    var banner = document.getElementById('analytics-consent-banner');
    if (banner) banner.remove();
    addSettingsButton();
    if (choice === 'granted') loadAnalytics();
  }

  function addSettingsButton() {
    if (document.getElementById('analytics-settings-button')) return;
    var button = document.createElement('button');
    button.id = 'analytics-settings-button';
    button.type = 'button';
    button.textContent = 'Privacy settings';
    button.addEventListener('click', function () {
      var existing = document.getElementById('analytics-consent-banner');
      if (existing) existing.remove();
      showBanner();
    });
    document.body.appendChild(button);
  }

  function showBanner() {
    var banner = document.createElement('section');
    banner.id = 'analytics-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'analytics-consent-title');
    banner.innerHTML =
      '<div class="analytics-consent-content">' +
        '<strong id="analytics-consent-title">Analytics cookies</strong>' +
        '<p>We use Google Analytics to understand how this site is used. You can accept or decline analytics measurement. <a href="' + privacyPolicyUrl() + '">Privacy Policy</a></p>' +
        '<div class="analytics-consent-actions">' +
          '<button type="button" data-analytics-choice="denied" class="analytics-consent-secondary">Decline</button>' +
          '<button type="button" data-analytics-choice="granted" class="analytics-consent-primary">Accept analytics</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', function (event) {
      var choice = event.target.getAttribute('data-analytics-choice');
      if (choice) saveChoice(choice);
    });
  }

  function privacyPolicyUrl() {
    var script = document.currentScript || document.querySelector('script[src*="consent.js"]');
    return script ? new URL('../privacy.html', script.src).href : 'privacy.html';
  }

  function init() {
    var choice = localStorage.getItem(storageKey);
    if (choice === 'granted') loadAnalytics();
    if (choice === 'granted' || choice === 'denied') addSettingsButton();
    else showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
