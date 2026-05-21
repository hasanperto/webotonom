import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function scrollAppToTop() {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
}

/**
 * Rota değişince görünümü sayfa başına alır (SPA scroll sıfırlama).
 */
export default function ScrollToTop() {
    const { pathname, hash } = useLocation();

    useLayoutEffect(() => {
        if (hash) {
            const id = hash.replace(/^#/, '');
            const target = document.getElementById(id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
        }
        scrollAppToTop();
    }, [pathname, hash]);

    return null;
}
