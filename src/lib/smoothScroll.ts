import { useEffect } from 'react';
import Lenis from 'lenis';

/*
 * Smooth scrolling with Lenis, set up once for the whole app.
 *
 * Why modals never get stuck:
 * 1. While a modal or sheet is open, Lenis is stopped (so the page behind doesn't move).
 *    A stopped Lenis blocks every wheel/touch event it handles, including ones inside the modal.
 * 2. So the `prevent` option below tells Lenis to completely ignore events that happen inside
 *    a dialog, inside anything marked data-lenis-prevent, or inside any box that has its own
 *    scrollbar (modal body, notification list, textarea…). The browser scrolls those natively.
 * 3. Locks are counted, so closing one modal while another is still open keeps the page locked.
 */

let lenis: Lenis | null = null;
let rafId = 0;
let locks = 0;

/** True for elements that scroll by themselves vertically (overflow auto/scroll and content taller than the box). */
function scrollsOnItsOwn(el: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(el);
  return (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && el.scrollHeight > el.clientHeight + 1;
}

/** Elements Lenis must leave alone: the browser scrolls them normally. */
function shouldPrevent(node: HTMLElement): boolean {
  if (!(node instanceof HTMLElement) || node === document.body || node === document.documentElement) return false;
  return node.matches('[role="dialog"], [aria-modal="true"], [data-lenis-prevent]') || scrollsOnItsOwn(node);
}

/** Starts Lenis and returns a cleanup function. */
export function initSmoothScroll(): () => void {
  if (lenis || typeof window === 'undefined') return () => {};
 

  lenis = new Lenis({
    lerp: 0.1,   
    duration: 2,         // how "floaty" the wheel feels; lower = smoother, higher = snappier
    smoothWheel: true,    // mouse wheel and trackpad
    syncTouch: true,      // keep touch scrolling smooth on phones and tablets too
    respectReducedMotion: false,
    prevent: shouldPrevent,
  });

  const loop = (time: number) => {
    lenis?.raf(time);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);

  if (locks > 0) lenis.stop(); // a modal was already open before Lenis started

  return () => {
    cancelAnimationFrame(rafId);
    lenis?.destroy();
    lenis = null;
  };
}

/**
 * Locks page scrolling (for modals and sheets). Returns an unlock function;
 * calling it more than once is safe.
 */
export function lockScroll(): () => void {
  locks += 1;
  if (locks === 1) {
    document.documentElement.classList.add('scroll-locked');
    lenis?.stop();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks === 0) {
      document.documentElement.classList.remove('scroll-locked');
      lenis?.start();
    }
  };
}

/** Keeps the page locked while `active` is true (use in any modal-like component). */
export function useScrollLock(active: boolean) {
  useEffect(() => (active ? lockScroll() : undefined), [active]);
}

/** Jumps to the top instantly, e.g. after changing page. */
export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo({ top: 0 });
}

/** Smoothly scrolls to an element, leaving room for the sticky header. */
export function scrollToElement(el: HTMLElement, headerOffset = 72) {
  if (lenis) lenis.scrollTo(el, { offset: -headerOffset });
  else {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headerOffset, behavior: reduce ? 'auto' : 'smooth' });
  }
}
