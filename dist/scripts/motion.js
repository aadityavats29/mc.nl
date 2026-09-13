/*
 * Maison Coiffure motion and interaction controller.
 * Implements the MC motion specification: section reveals, quote word reveal,
 * treatment hover previews, navigation dropdowns and the compact drawer.
 * Content is fully readable without this file; hidden initial states are only
 * applied once this controller marks the document ready (html.mjs).
 */
(function () {
  'use strict';

  var doc = document.documentElement;
  var MOTION = doc.classList.contains('js-motion'); // set pre-paint; absent when reduced motion
  var SMALL = window.matchMedia('(max-width: 767px)');

  if (MOTION) doc.classList.add('mjs');

  /* ---------------------------------------------------------------- */
  /* Ordinary section reveals                                          */
  /* ---------------------------------------------------------------- */

  if (MOTION && 'IntersectionObserver' in window) {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    // Restored positions / deep links: settle anything already above the viewport.
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.bottom < 0) el.classList.add('settle', 'is-in');
    });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          // Stagger up to 3 siblings by 70ms.
          var group = el.getAttribute('data-reveal-group');
          if (group) {
            var idx = Number(el.getAttribute('data-reveal-index') || 0);
            el.style.setProperty('--reveal-delay', Math.min(idx, 2) * 70 + 'ms');
          }
          el.classList.add('is-in');
          io.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px 0px 0px' }
    );
    reveals.forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      // Sections taller than the viewport: reveal from the first visible edge.
      if (el.offsetHeight > window.innerHeight * 0.85) {
        el.classList.add('is-in');
        return;
      }
      io.observe(el);
    });
  }

  /* ---------------------------------------------------------------- */
  /* MC quote word reveal                                              */
  /* ---------------------------------------------------------------- */

  (function () {
    var quote = document.querySelector('.mc-quote');
    if (!quote) return;
    if (!MOTION || !('IntersectionObserver' in window)) return;

    var words = Array.prototype.slice.call(quote.querySelectorAll('.quote-word'));
    var rect = quote.getBoundingClientRect();
    // Deep link or restored position past the section: final state immediately.
    if (rect.bottom < 0) return;

    if (!SMALL.matches) {
      // Cap the whole sequence at 1200ms: reduce stagger for longer copy.
      var stagger = words.length > 1 ? Math.min(24, (1200 - 650) / (words.length - 1)) : 0;
      words.forEach(function (w, i) {
        w.style.setProperty('--word-delay', Math.round(i * stagger) + 'ms');
      });
    }
    quote.setAttribute('data-armed', '');

    var played = false;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (played || !entry.isIntersecting) return;
          played = true;
          // Fast scroll past: settle immediately instead of animating.
          if (entry.boundingClientRect.bottom < 0) quote.classList.add('settle');
          quote.classList.add('is-in');
          io.disconnect();
        });
      },
      // Trigger when the section enters the lower 78% of the viewport.
      { rootMargin: '0px 0px -22% 0px', threshold: 0 }
    );
    io.observe(quote);
  })();

  /* ---------------------------------------------------------------- */
  /* Desktop dropdown navigation                                       */
  /* ---------------------------------------------------------------- */

  (function () {
    var groups = Array.prototype.slice.call(document.querySelectorAll('.primary-nav .nav-group'));
    if (!groups.length) return;
    var hoverFine = window.matchMedia('(hover: hover) and (pointer: fine)');

    function closeAll(except) {
      groups.forEach(function (g) {
        if (g === except) return;
        g.classList.remove('open');
        var b = g.querySelector('button[aria-expanded]');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
    }

    groups.forEach(function (g) {
      var btn = g.querySelector('button[aria-expanded]');
      if (!btn) return;
      var openT = null;
      var closeT = null;

      function setOpen(open) {
        g.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
        if (open) closeAll(g);
      }

      btn.addEventListener('click', function () {
        setOpen(!g.classList.contains('open'));
      });

      // Pointer hover: open after 120ms, close with 180ms exit tolerance.
      g.addEventListener('pointerenter', function () {
        if (!hoverFine.matches) return;
        clearTimeout(closeT);
        openT = setTimeout(function () { setOpen(true); }, 120);
      });
      g.addEventListener('pointerleave', function () {
        if (!hoverFine.matches) return;
        clearTimeout(openT);
        closeT = setTimeout(function () { setOpen(false); }, 180);
      });

      g.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && g.classList.contains('open')) {
          e.stopPropagation();
          setOpen(false);
          btn.focus();
        }
      });
      g.addEventListener('focusout', function () {
        requestAnimationFrame(function () {
          if (!g.contains(document.activeElement)) setOpen(false);
        });
      });
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest || !e.target.closest('.nav-group')) closeAll(null);
    });
  })();

  /* ---------------------------------------------------------------- */
  /* Compact menu drawer                                               */
  /* ---------------------------------------------------------------- */

  (function () {
    var drawer = document.getElementById('menu-drawer');
    var openBtn = document.getElementById('menu-open');
    if (!drawer || !openBtn) return;

    openBtn.addEventListener('click', function () {
      if (typeof drawer.showModal === 'function') drawer.showModal();
      else drawer.setAttribute('open', '');
    });
    drawer.addEventListener('close', function () {
      openBtn.focus();
    });
    drawer.addEventListener('click', function (e) {
      if (e.target === drawer) drawer.close(); // backdrop click
      var link = e.target.closest && e.target.closest('a');
      if (link) drawer.close();
    });
    var closeBtn = drawer.querySelector('.drawer-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { drawer.close(); });

    // Expandable categories: measured-height accordion, 220ms.
    Array.prototype.slice.call(drawer.querySelectorAll('.drawer-group-btn')).forEach(function (btn) {
      var sub = document.getElementById(btn.getAttribute('aria-controls'));
      if (!sub) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        if (!MOTION) {
          sub.style.height = open ? '0px' : 'auto';
          return;
        }
        if (open) {
          sub.style.height = sub.scrollHeight + 'px';
          requestAnimationFrame(function () { sub.style.height = '0px'; });
        } else {
          sub.style.height = sub.scrollHeight + 'px';
          sub.addEventListener('transitionend', function fix(e) {
            if (e.propertyName === 'height') {
              if (btn.getAttribute('aria-expanded') === 'true') sub.style.height = 'auto';
              sub.removeEventListener('transitionend', fix);
            }
          });
        }
      });
    });
  })();

  /* ---------------------------------------------------------------- */
  /* Treatment explorer previews                                       */
  /* ---------------------------------------------------------------- */

  (function () {
    var explorers = Array.prototype.slice.call(document.querySelectorAll('[data-explorer]'));
    if (!explorers.length) return;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 900px)');

    var panel = null;
    var showT = null;
    var hideT = null;
    var raf = null;
    var lastX = 0;
    var lastY = 0;
    var active = null;

    function ensurePanel() {
      if (panel) return panel;
      panel = document.createElement('div');
      panel.className = 'preview-panel';
      panel.setAttribute('aria-hidden', 'true');
      document.body.appendChild(panel);
      return panel;
    }

    function position() {
      raf = null;
      if (!panel) return;
      var pw = panel.offsetWidth;
      var ph = panel.offsetHeight;
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var x = lastX + 20;
      var y = lastY + 20;
      if (x + pw > vw - 16) x = lastX - pw - 20; // flip horizontally
      if (y + ph > vh - 16) y = lastY - ph - 20; // flip vertically
      x = Math.max(16, Math.min(x, vw - pw - 16));
      y = Math.max(16, Math.min(y, vh - ph - 16));
      panel.style.left = x + 'px';
      panel.style.top = y + 'px';
    }

    function show(link) {
      var p = ensurePanel();
      active = link;
      p.innerHTML = '';
      var h = document.createElement('h4');
      h.textContent = link.getAttribute('data-preview-title') || '';
      var body = document.createElement('p');
      body.textContent = link.getAttribute('data-preview') || '';
      p.appendChild(h);
      p.appendChild(body);
      p.classList.remove('hiding');
      position();
      p.classList.add('show');
    }

    function hideNow() {
      clearTimeout(showT);
      clearTimeout(hideT);
      active = null;
      if (panel) panel.classList.remove('show', 'hiding');
    }

    explorers.forEach(function (list) {
      Array.prototype.slice.call(list.querySelectorAll('a[data-preview]')).forEach(function (link) {
        link.addEventListener('pointerenter', function (e) {
          if (!fine.matches || e.pointerType === 'touch') return;
          lastX = e.clientX;
          lastY = e.clientY;
          clearTimeout(hideT);
          clearTimeout(showT);
          if (active && active !== link) {
            show(link); // replace content without stacking panels
          } else {
            showT = setTimeout(function () { show(link); }, 120);
          }
        });
        link.addEventListener('pointermove', function (e) {
          if (!active && !showT) return;
          lastX = e.clientX;
          lastY = e.clientY;
          if (!raf) raf = requestAnimationFrame(position);
        });
        link.addEventListener('pointerleave', function () {
          clearTimeout(showT);
          showT = null;
          clearTimeout(hideT);
          hideT = setTimeout(function () {
            active = null;
            if (panel && panel.classList.contains('show')) {
              panel.classList.add('hiding');
              panel.classList.remove('show');
            }
          }, 100); // exit grace
        });
        link.addEventListener('click', hideNow);

        // Keyboard focus: stable panel anchored beside the focused row.
        link.addEventListener('focus', function () {
          if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;
          var li = link.closest('li');
          if (!li || li.querySelector('.focus-preview')) return;
          var fp = document.createElement('div');
          fp.className = 'focus-preview';
          fp.setAttribute('aria-hidden', 'true'); // same text is linked via aria-describedby
          fp.textContent = link.getAttribute('data-preview') || '';
          li.style.position = 'relative';
          fp.style.top = '100%';
          fp.style.right = '0';
          fp.style.marginTop = '-8px';
          li.appendChild(fp);
        });
        link.addEventListener('blur', function () {
          var li = link.closest('li');
          var fp = li && li.querySelector('.focus-preview');
          if (fp) fp.remove();
        });
      });
    });

    // Clear immediately on scroll, route change, Escape or loss of window focus.
    window.addEventListener('scroll', hideNow, { passive: true });
    window.addEventListener('blur', hideNow);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hideNow();
    });
  })();

  /* ---------------------------------------------------------------- */
  /* WhatsApp enquiry forms                                            */
  /* ---------------------------------------------------------------- */

  Array.prototype.slice.call(document.querySelectorAll('form[data-wa-form]')).forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var lines = [form.getAttribute('data-wa-intro') || 'Hello Maison Coiffure,'];
      Array.prototype.slice.call(form.elements).forEach(function (el) {
        if (!el.name || el.disabled) return;
        var label = el.getAttribute('data-label') || el.name;
        if (el.type === 'checkbox') {
          if (el.checked) lines.push(label + ': yes');
          return;
        }
        if (el.type === 'radio') {
          if (el.checked) lines.push(label + ': ' + el.value);
          return;
        }
        if (el.tagName === 'BUTTON' || el.type === 'submit') return;
        if (String(el.value).trim() !== '') lines.push(label + ': ' + String(el.value).trim());
      });
      var base = form.getAttribute('data-wa-base');
      window.open(base + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  });
})();
