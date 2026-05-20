import { Link } from 'react-router-dom';
import { LayoutGroup, motion as M, useReducedMotion } from 'framer-motion';
import { FiLock, FiLayers } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import { motionEase } from '../../utils/motion';

/**
 * Login / Register ortak split layout: sol görsel, sağ form alanı + segment sekmeler.
 */
export default function AuthSplitShell({ mode, children }) {
    const { t } = useLanguage();
    const reduceMotion = useReducedMotion();

    return (
        <div className="auth-page auth-page--split">
            <div className="auth-split">
                <aside className="auth-split-visual" aria-hidden>
                    <div className="auth-visual-bg" />
                    <M.div
                        className="auth-visual-mark"
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.45, ease: motionEase }}
                    >
                        <FiLayers className="auth-visual-icon auth-visual-icon--layers" />
                        <FiLock className="auth-visual-icon auth-visual-icon--lock" />
                    </M.div>
                    {!reduceMotion && (
                        <>
                            <M.div
                                className="auth-orb auth-orb--1"
                                animate={{ y: [0, -12, 0], opacity: [0.5, 0.85, 0.5] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <M.div
                                className="auth-orb auth-orb--2"
                                animate={{ y: [0, 14, 0], opacity: [0.4, 0.75, 0.4] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            />
                            <M.div
                                className="auth-orb auth-orb--3"
                                animate={{ scale: [1, 1.06, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            />
                        </>
                    )}
                    <p className="auth-visual-tagline">
                        {t('auth.split_tagline', 'Projelerinizi güvenle yönetin ve keşfedin.')}
                    </p>
                </aside>

                <div className="auth-split-panel">
                    <LayoutGroup id="auth-mode-tabs">
                        <div className="auth-segmented" role="tablist" aria-label={t('auth.segment_label', 'Giriş veya kayıt')}>
                            <Link
                                to="/login"
                                role="tab"
                                aria-selected={mode === 'login'}
                                className={`auth-segment ${mode === 'login' ? 'is-active' : ''}`}
                            >
                                {mode === 'login' && (
                                    <M.span
                                        layoutId="auth-segment-pill"
                                        className="auth-segment-pill"
                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 34 }}
                                    />
                                )}
                                <span className="auth-segment-label">{t('auth.login_tab', 'Giriş')}</span>
                            </Link>
                            <Link
                                to="/register"
                                role="tab"
                                aria-selected={mode === 'register'}
                                className={`auth-segment ${mode === 'register' ? 'is-active' : ''}`}
                            >
                                {mode === 'register' && (
                                    <M.span
                                        layoutId="auth-segment-pill"
                                        className="auth-segment-pill"
                                        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 34 }}
                                    />
                                )}
                                <span className="auth-segment-label">{t('auth.register_tab', 'Kayıt')}</span>
                            </Link>
                        </div>
                    </LayoutGroup>

                    <M.div
                        className="auth-card auth-card--split"
                        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: motionEase }}
                    >
                        {children}
                    </M.div>
                </div>
            </div>
        </div>
    );
}
