(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let headerOffset = 0;
    let animId = 0;

    const computeHeaderOffset = () => {
        const manual = document.querySelector('[data-scroll-offset]');
        if (manual) {
            const v = Number(manual.getAttribute('data-scroll-offset'));
            if (!Number.isNaN(v)) { headerOffset = v; return; }
        }
        headerOffset = 0;
        const candidates = document.querySelectorAll('header, .header, nav, .navbar, .nav');
        for (const el of candidates) {
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' && (parseInt(cs.top || '0', 10) === 0)) {
                headerOffset = el.getBoundingClientRect().height;
                break;
            }
        }
    };

    const getTargetFromLink = (link) => {
        let id = '';
        try {
            const url = new URL(link.href, window.location.href);
            if (url.origin !== window.location.origin || url.pathname !== window.location.pathname) return null;
            id = decodeURIComponent(url.hash.slice(1));
        } catch { return null; }
        if (!id) return null;
        return document.getElementById(id) || document.querySelector(`[name="${CSS.escape(id)}"]`);
    };

    const smoothScrollTo = (el) => {
        const targetY = Math.max(0, window.scrollY + el.getBoundingClientRect().top - headerOffset);

        if (prefersReduced) { window.scrollTo(0, targetY); return; }

        cancelAnimationFrame(animId);

        const startY = window.scrollY;
        const distance = targetY - startY;
        if (Math.abs(distance) < 1) { window.scrollTo(0, targetY); return; }

       
        const duration = Math.min(1400, Math.max(300, Math.abs(distance) * 0.6));
        const easeOut = t => 1 - Math.pow(1 - t, 4); 

        let startTs = null;
        const step = (ts) => {
            if (startTs == null) startTs = ts;
            const t = Math.min(1, (ts - startTs) / duration);
            const eased = easeOut(t);
            window.scrollTo(0, startY + distance * eased);
            if (t < 1) animId = requestAnimationFrame(step);
        };

        animId = requestAnimationFrame(step);
    };

    const onClick = (e) => {
        const link = e.target.closest('a[href*="#"]');
        if (!link) return;
        const target = getTargetFromLink(link);
        if (!target) return;
        e.preventDefault();
        computeHeaderOffset();
        smoothScrollTo(target);
        if (target.id) {
            if (history.pushState) history.pushState(null, '', `#${target.id}`);
            else window.location.hash = target.id;
        }
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    };

    document.addEventListener('click', onClick);
    window.addEventListener('resize', computeHeaderOffset);
    document.addEventListener('DOMContentLoaded', computeHeaderOffset);
})();

/* === Mobile menu toggle === */
document.addEventListener('DOMContentLoaded', () => {
  const toggle   = document.querySelector('.nav-toggle');          // the MENU button
  const menu     = document.getElementById('mobile-menu');         // <aside id="mobile-menu">
  const backdrop = document.querySelector('.menu-backdrop');       // .menu-backdrop overlay
  if (!toggle || !menu || !backdrop) {
    console.warn('Mobile menu markup missing');
    return;
  }

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    menu.hidden = false;
    backdrop.hidden = false;
    // allow CSS transitions to kick in
    requestAnimationFrame(() => {
      menu.classList.add('is-open');
      backdrop.classList.add('is-open');
    });
    // lock scroll
    document.documentElement.style.overflow = 'hidden';
    // focus first focusable thing in the menu
    const first = menu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
    first && first.focus();
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.documentElement.style.overflow = '';
    // hide after transition so it stays accessible during the slide-out
    setTimeout(() => {
      menu.hidden = true;
      backdrop.hidden = true;
    }, 250);
    toggle.focus();
  }

  toggle.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) closeMenu(); });

  // close when any link in the drawer is clicked
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
});
