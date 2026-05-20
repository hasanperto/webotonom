import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { motionEase } from '../utils/motion';

/**
 * Outlet çevresinde sayfa geçişi (MaintenanceGuard içindeki rotalar).
 */
export default function PageTransitionLayout() {
    const location = useLocation();
    const reduceMotion = useReducedMotion();

    return (
        <AnimatePresence mode="wait" initial={false}>
            <M.div
                key={location.pathname}
                className="page-transition-root"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{
                    duration: reduceMotion ? 0 : 0.22,
                    ease: motionEase,
                }}
                style={{ width: '100%' }}
            >
                <Outlet />
            </M.div>
        </AnimatePresence>
    );
}
