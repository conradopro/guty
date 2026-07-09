// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  // Reveal-on-scroll animation
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  // Build email links from data attributes to keep the address out of the page source
  document.querySelectorAll('.js-email').forEach(function (el) {
    var address = el.dataset.user + '@' + el.dataset.domain;
    var link = document.createElement('a');
    link.href = 'mailto:' + address;
    link.textContent = address;
    el.replaceWith(link);
  });
});

// Baner zgody na pliki cookie
(function () {
  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.css';
  document.head.appendChild(css);

  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/gh/orestbida/cookieconsent@3.0.1/dist/cookieconsent.umd.js';
  script.onload = function () {
    window.CookieConsent.run({
      guiOptions: {
        consentModal: { layout: 'box', position: 'bottom left' }
      },
      categories: {
        necessary: { enabled: true, readOnly: true }
      },
      language: {
        default: 'pl',
        translations: {
          pl: {
            consentModal: {
              title: 'Używamy plików cookie',
              description: 'Ta strona korzysta wyłącznie z niezbędnych plików cookie do prawidłowego działania.',
              acceptAllBtn: 'Akceptuję'
            }
          }
        }
      }
    });
  };
  document.head.appendChild(script);
})();
