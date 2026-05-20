import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { motionEase } from '../../utils/motion';

/**
 * Ortak modal: backdrop + panel, AnimatePresence ile giriş/çıkış.
 * @param {'center' | 'fullscreen'} variant — fullscreen lightbox tarzı için hafif scale
 */
export default function MotionModal({
    isOpen,
    onClose,
    overlayClassName = '',
    panelClassName = '',
    children,
    variant = 'center',
}) {
    const reduceMotion = useReducedMotion();
    const dur = reduceMotion ? 0 : 0.22;
    const ease = motionEase;

    const panelInitial = reduceMotion
        ? false
        : variant === 'fullscreen'
            ? { opacity: 0, scale: 0.992 }
            : { opacity: 0, y: 18, scale: 0.98 };

    const panelAnimate = { opacity: 1, y: 0, scale: 1 };

    const panelExit = reduceMotion
        ? undefined
        : variant === 'fullscreen'
            ? { opacity: 0, scale: 0.992 }
            : { opacity: 0, y: 10, scale: 0.98 };

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div
                    className={overlayClassName}
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: dur, ease }}
                    onClick={onClose}
                >
                    <motion.div
                        className={panelClassName}
                        initial={panelInitial}
                        animate={panelAnimate}
                        exit={panelExit}
                        transition={{ duration: reduceMotion ? 0 : 0.26, ease }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
