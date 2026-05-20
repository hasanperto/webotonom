import { useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { FiAlertCircle, FiHome } from 'react-icons/fi';
import { motionEase } from '../utils/motion';
import './NotFound.css';

export default function NotFound() {
    const location = useLocation();
    const reduceMotion = useReducedMotion();
    const pageRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: pageRef,
        offset: ['start start', 'end start'],
    });

    const yFar = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 0.35]);
    const yMid = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 0.18]);
    const yNear = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, -0.08]);
    const megaY = useTransform(scrollYProgress, [0, 1], reduceMotion ? [0, 0] : [0, 0.12]);

    const farPx = useTransform(yFar, (v) => `${v * 100}%`);
    const midPx = useTransform(yMid, (v) => `${v * 100}%`);
    const nearPx = useTransform(yNear, (v) => `${v * -100}%`);
    const megaPx = useTransform(megaY, (v) => `${v * 100}%`);

    return (
        <div className="notfound-page" ref={pageRef}>
            <motion.div
                className="notfound-parallax notfound-parallax--far"
                style={{ y: farPx }}
                aria-hidden
            />
            <motion.div
                className="notfound-parallax notfound-parallax--mid"
                style={{ y: midPx }}
                aria-hidden
            />
            <motion.div
                className="notfound-parallax notfound-parallax--near"
                style={{ y: nearPx }}
                aria-hidden
            />
            <div className="notfound-mega-wrap" aria-hidden>
                <motion.div className="notfound-mega" style={{ y: megaPx }}>
                    404
                </motion.div>
            </div>

            <motion.div
                className="notfound-inner"
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: motionEase }}
            >
                <div className="notfound-card">
                    <motion.div
                        className="notfound-icon"
                        initial={reduceMotion ? false : { scale: 0.85 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    >
                        <FiAlertCircle />
                    </motion.div>
                    <h1>Sayfa bulunamadı</h1>
                    <p className="notfound-path">
                        İstenen adres: <code>{location.pathname}</code>
                    </p>
                    <Link to="/" className="notfound-btn">
                        <FiHome /> Ana Sayfa
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
