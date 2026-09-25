import { useEffect, useState } from 'react';
import { scrollToTop } from './smoothScroll';

/** Tiny hash router (no dependency). Routes look like #/app/budgets */
const read = () => window.location.hash.replace(/^#/, '') || '/';

export function useRoute() {
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => { setPath(read()); scrollToTop(); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}

export const navigate = (to: string) => { window.location.hash = to; };
