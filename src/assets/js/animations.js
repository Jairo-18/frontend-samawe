(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('js-anim');

  var EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  var seen = new WeakSet();
  var active = false;
  var moRef = null;
  var heroObservers = [];

  function debounce(fn, ms) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function qsa(sel) {
    try {
      return Array.from(document.querySelectorAll(sel));
    } catch (e) {
      return [];
    }
  }

  var PUBLIC_PATHS = [
    '/home',
    '/about-us',
    '/accommodation',
    '/gastronomy',
    '/how-to-arrive',
    '/blog',
    '/legal/terms',
    '/legal/privacity'
  ];

  var LEGAL_PATHS = ['/legal/terms', '/legal/privacity'];

  function isPublicRoute() {
    var p = window.location.pathname;
    return p === '/' || PUBLIC_PATHS.indexOf(p) !== -1;
  }

  function isPublicView() {
    var p = window.location.pathname;

    if (LEGAL_PATHS.indexOf(p) !== -1) return true;
    return isPublicRoute() && !document.querySelector('app-base-page');
  }

  function reveal(el, opts) {
    if (!el || seen.has(el)) return;
    seen.add(el);

    var dur = opts.dur || 700;
    var del = opts.del || 0;
    var from = opts.from || 'bottom';
    var px = opts.px || 30;

    var tx =
      from === 'left'
        ? 'translateX(-' + px + 'px)'
        : from === 'right'
          ? 'translateX(' + px + 'px)'
          : from === 'scale'
            ? 'scale(0.95)'
            : 'translateY(' + px + 'px)';

    var tIn =
      'opacity ' +
      dur +
      'ms ' +
      EASE +
      ' ' +
      del +
      'ms,' +
      'transform ' +
      dur +
      'ms ' +
      EASE +
      ' ' +
      del +
      'ms';
    var tOut = 'opacity 350ms ' + EASE + ',transform 350ms ' + EASE;

    el.style.opacity = '0';
    el.style.transform = tx;
    el.style.willChange = 'opacity,transform';
    el.style.transition = tIn;

    var revealed = false;

    var io = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        if (entry.isIntersecting) {
          el.style.willChange = 'opacity,transform';
          el.style.transition = tIn;
          el.style.opacity = '1';
          el.style.transform = 'none';
          revealed = true;
          setTimeout(
            function () {
              if (revealed) el.style.willChange = 'auto';
            },
            dur + del + 80
          );
        } else if (revealed) {
          el.style.willChange = 'opacity,transform';
          el.style.transition = tOut;
          el.style.opacity = '0';
          el.style.transform = tx;
          revealed = false;
        }
      },
      { threshold: 0.12 }
    );

    io.observe(el);
  }

  var imgSeen = new WeakSet();
  function setupImageLoaders() {
    qsa('img').forEach(function (img) {
      if (imgSeen.has(img) || img.complete) return;
      imgSeen.add(img);
      img.classList.add('img-loading');
      function done() {
        img.classList.remove('img-loading');
      }
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }

  function heroFade(wrap) {
    if (!wrap) return;
    Array.from(wrap.children).forEach(function (el, i) {
      if (seen.has(el)) return;
      seen.add(el);
      var d = 300 + i * 160;
      var scrollDelay = i * 100;

      requestAnimationFrame(function () {
        el.style.transition =
          'opacity 1200ms ' +
          EASE +
          ' ' +
          d +
          'ms,' +
          'transform 1200ms ' +
          EASE +
          ' ' +
          d +
          'ms';
        requestAnimationFrame(function () {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      });

      setTimeout(
        function () {
          if (!active) return;
          var out = false;
          var hio = new IntersectionObserver(
            function (entries) {
              var entry = entries[0];
              if (entry.isIntersecting && out) {
                el.style.willChange = 'opacity,transform';
                el.style.transition =
                  'opacity 900ms ' +
                  EASE +
                  ' ' +
                  scrollDelay +
                  'ms,' +
                  'transform 900ms ' +
                  EASE +
                  ' ' +
                  scrollDelay +
                  'ms';
                el.style.opacity = '1';
                el.style.transform = 'none';
                out = false;
                setTimeout(
                  function () {
                    el.style.willChange = 'auto';
                  },
                  900 + scrollDelay + 80
                );
              } else if (!entry.isIntersecting && !out) {
                el.style.willChange = 'opacity,transform';
                el.style.transition =
                  'opacity 300ms ' + EASE + ',transform 300ms ' + EASE;
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                out = true;
              }
            },
            { threshold: 0.1 }
          );
          hio.observe(el);
          heroObservers.push(hio);
        },
        d + 1200 + 100
      );
    });
  }

  function applyAll() {
    if (!isPublicView()) return;

    setupImageLoaders();

    qsa('.relative.z-10').forEach(function (w) {
      var p = w.parentElement;
      if (!p) return;
      if (
        p.querySelector(':scope > img.absolute') &&
        p.querySelector(':scope > div.absolute')
      ) {
        heroFade(w);
      }
    });

    qsa('app-section-header span').forEach(function (el) {
      reveal(el, { dur: 700, del: 0, from: 'left', px: 15 });
    });
    qsa('app-section-header h2').forEach(function (el) {
      reveal(el, { dur: 700, del: 100, from: 'bottom', px: 30 });
    });
    qsa('app-section-header p').forEach(function (el) {
      reveal(el, { dur: 700, del: 200, from: 'bottom', px: 20 });
    });

    qsa('app-benefits-section .flex-col.items-center span').forEach(
      function (el) {
        reveal(el, { dur: 700, del: 0, from: 'left', px: 15 });
      }
    );
    qsa('app-benefits-section h2').forEach(function (el) {
      reveal(el, { dur: 700, del: 100, from: 'bottom', px: 30 });
    });
    qsa('app-benefits-section .grid > div').forEach(function (el, i) {
      reveal(el, {
        dur: 600,
        del: Math.min(i * 55, 440),
        from: 'bottom',
        px: 20
      });
    });

    qsa('app-most-requested-section h3').forEach(function (el) {
      reveal(el, { dur: 700, del: 0, from: 'bottom', px: 30 });
    });
    qsa('app-most-requested-section .flex-1 p').forEach(function (el) {
      reveal(el, { dur: 700, del: 100, from: 'bottom', px: 20 });
    });
    qsa('app-most-requested-section .text-xl.font-bold').forEach(function (el) {
      reveal(el, { dur: 700, del: 150, from: 'bottom', px: 20 });
    });

    qsa('app-most-requested-section .shrink-0').forEach(function (el, i) {
      reveal(el, {
        dur: 900,
        del: 80,
        from: i % 2 === 0 ? 'right' : 'left',
        px: 40
      });
    });

    qsa('app-about-us-section .overflow-hidden').forEach(function (el) {
      reveal(el, { dur: 900, del: 120, from: 'left', px: 40 });
    });
    qsa('app-experience-section .overflow-hidden').forEach(function (el) {
      reveal(el, { dur: 900, del: 120, from: 'right', px: 40 });
    });

    qsa('app-how-to-arrive-section .rounded-2xl').forEach(function (el) {
      reveal(el, { dur: 800, del: 0, from: 'bottom', px: 30 });
    });
    qsa('app-how-to-arrive-section .grid > div').forEach(function (el, i) {
      reveal(el, { dur: 700, del: i * 80, from: 'bottom', px: 25 });
    });

    qsa('div.flex-shrink-0.overflow-hidden').forEach(function (el) {
      if (!el.querySelector('img')) return;
      reveal(el, { dur: 900, del: 100, from: 'bottom', px: 30 });
    });

    qsa('div.overflow-hidden').forEach(function (el) {
      if (seen.has(el)) return;
      if (
        el.querySelector(':scope > img') &&
        el.querySelector(':scope > div.absolute')
      ) {
        reveal(el, { dur: 800, del: 0, from: 'scale', px: 0 });
      }
    });

    qsa('app-card-accommodation').forEach(function (el) {
      reveal(el, { dur: 700, del: 0, from: 'bottom', px: 30 });
    });

    qsa('app-review-card').forEach(function (el) {
      reveal(el, { dur: 600, del: 0, from: 'bottom', px: 25 });
    });

    qsa('div.shadow-md.border').forEach(function (el) {
      if (seen.has(el)) return;

      if (el.closest('nav, mat-menu, mat-select-panel, mat-dialog-container'))
        return;
      reveal(el, { dur: 600, del: 0, from: 'bottom', px: 25 });
    });

    qsa('app-privacity h3, app-terms h3').forEach(function (el) {
      reveal(el, { dur: 700, del: 0, from: 'bottom', px: 25 });
    });
    qsa('app-privacity .legal-section, app-terms .legal-section').forEach(
      function (el, i) {
        reveal(el, {
          dur: 600,
          del: Math.min(i * 60, 360),
          from: 'bottom',
          px: 20
        });
      }
    );

    qsa('app-button-landing').forEach(function (el) {
      var heroParent = el.closest(
        'div.relative.overflow-hidden, article.relative'
      );
      if (heroParent || el.closest('nav')) return;
      reveal(el, { dur: 700, del: 150, from: 'scale' });
    });

    qsa('[data-counter]').forEach(function (el) {
      if (seen.has(el)) return;
      seen.add(el);
      var tgt = parseInt(el.getAttribute('data-counter'), 10) || 0;
      var sfx = el.getAttribute('data-suffix') || '';
      el.textContent = '0' + sfx;
      var cio = new IntersectionObserver(
        function (entries) {
          if (!entries[0].isIntersecting) return;
          var t0 = performance.now();
          (function step(now) {
            var p = Math.min((now - t0) / 2000, 1);
            var e = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.floor(e * tgt) + sfx;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = tgt + sfx;
          })(t0);
          cio.disconnect();
        },
        { threshold: 0.5 }
      );
      cio.observe(el);
    });
  }

  function start() {
    if (active) return;
    active = true;

    setTimeout(function () {
      if (!active) return;
      if (!isPublicView()) {
        active = false;
        return;
      }

      applyAll();

      if (moRef) moRef.disconnect();
      moRef = new MutationObserver(
        debounce(function () {
          if (active && isPublicView()) applyAll();
        }, 150)
      );
      moRef.observe(document.body, { childList: true, subtree: true });

      setTimeout(function () {
        if (moRef) {
          moRef.disconnect();
          moRef = null;
        }
      }, 10000);
    }, 50);
  }

  function stop() {
    active = false;
    if (moRef) {
      moRef.disconnect();
      moRef = null;
    }
    heroObservers.forEach(function (o) {
      o.disconnect();
    });
    heroObservers = [];
  }

  function onRouteChange() {
    stop();
    seen = new WeakSet();
    if (isPublicRoute()) start();
  }

  (function patchHistory() {
    var origPush = history.pushState;
    var origReplace = history.replaceState;
    history.pushState = function () {
      origPush.apply(history, arguments);
      onRouteChange();
    };
    history.replaceState = function () {
      origReplace.apply(history, arguments);
      onRouteChange();
    };
    window.addEventListener('popstate', onRouteChange);
  })();

  function boot() {
    if (isPublicRoute()) start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
