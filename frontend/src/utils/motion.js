/** Paylaşılan framer-motion variant'ları — public sayfalar için */

export const motionEase = [0.16, 1, 0.3, 1];

export const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: motionEase },
    },
};

export const fadeIn = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { duration: 0.3, ease: motionEase },
    },
};

export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0.05) => ({
    hidden: {},
    show: {
        transition: { staggerChildren, delayChildren },
    },
});

export const staggerItem = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.32, ease: motionEase },
    },
};

export const cardHover = {
    rest: { y: 0, scale: 1 },
    hover: {
        y: -6,
        scale: 1.02,
        transition: { type: 'spring', stiffness: 400, damping: 24 },
    },
};

export const tapScale = {
    tap: { scale: 0.97 },
};

export const slideInRight = {
    hidden: { opacity: 0, x: 24 },
    show: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.35, ease: motionEase },
    },
};

export const slideInLeft = {
    hidden: { opacity: 0, x: -24 },
    show: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.35, ease: motionEase },
    },
};

export const modalBackdrop = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent = {
    hidden: { opacity: 0, scale: 0.96, y: 12 },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.28, ease: motionEase },
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        y: 8,
        transition: { duration: 0.2 },
    },
};
