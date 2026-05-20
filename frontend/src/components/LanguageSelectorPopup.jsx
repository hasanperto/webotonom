import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { setCookie, getCookie } from '../utils/cookies';
import { FiGlobe, FiX, FiCheck } from 'react-icons/fi';
import { motionEase } from '../utils/motion';
import './LanguageSelectorPopup.css';

const LanguageSelectorPopup = () => {
    const { languages, language, changeLanguage, t } = useLanguage();
    const [showPopup, setShowPopup] = useState(false);
    const [selectedLang, setSelectedLang] = useState(language);
    const panelRef = useRef(null);
    const reduceMotion = useReducedMotion();

    const handleClose = useCallback(() => {
        setCookie('language_popup_shown', 'true', 1);
        setShowPopup(false);
    }, []);

    useEffect(() => {
        const languagePopupShown = getCookie('language_popup_shown');

        if (!languagePopupShown) {
            const browserLang = navigator.language.split('-')[0].toLowerCase();
            const supportedLangs = languages.length > 0 ? languages.map((l) => l.code.toLowerCase()) : ['tr', 'en', 'de'];

            if (supportedLangs.includes(browserLang)) {
                setSelectedLang(browserLang);
            } else {
                setSelectedLang(language || 'tr');
            }

            const tId = window.setTimeout(() => setShowPopup(true), 500);
            return () => window.clearTimeout(tId);
        }
        return undefined;
    }, [languages, language]);

    useEffect(() => {
        if (!showPopup) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [showPopup]);

    useEffect(() => {
        if (!showPopup) return undefined;

        const onKeyDown = (e) => {
            const node = panelRef.current;
            if (!node) return;
            const focusables = Array.from(
                node.querySelectorAll(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.key === 'Escape') {
                e.preventDefault();
                handleClose();
                return;
            }
            if (e.key !== 'Tab' || focusables.length === 0) return;
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                }
            } else if (document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        };

        const tId = window.setTimeout(() => {
            const node = panelRef.current;
            if (!node) return;
            const first = node.querySelector('button');
            first?.focus();
        }, 60);

        document.addEventListener('keydown', onKeyDown);
        return () => {
            window.clearTimeout(tId);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [showPopup, handleClose]);

    const handleLanguageSelect = (langCode) => {
        setSelectedLang(langCode);
    };

    const handleConfirm = useCallback(() => {
        changeLanguage(selectedLang);
        setCookie('language_popup_shown', 'true', 1);
        setCookie('selected_language', selectedLang, 365);
        setShowPopup(false);
    }, [changeLanguage, selectedLang]);

    const flagFor = (code) => {
        const c = (code || '').toLowerCase();
        if (c === 'tr') return '🇹🇷';
        if (c === 'en') return '🇬🇧';
        if (c === 'de') return '🇩🇪';
        return '🌐';
    };

    if (languages.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            {showPopup ? (
                <M.div
                    className="language-popup-overlay"
                    role="presentation"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2, ease: motionEase }}
                    onClick={handleClose}
                >
                    <M.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="language-popup-title"
                        className="language-popup-container"
                        initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ duration: reduceMotion ? 0 : 0.28, ease: motionEase }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="language-popup-close"
                            onClick={handleClose}
                            aria-label={t('language_popup.close', 'Kapat')}
                        >
                            <FiX />
                        </button>

                        <div className="language-popup-header">
                            <M.div
                                className="language-popup-icon"
                                animate={reduceMotion ? {} : { scale: [1, 1.04, 1] }}
                                transition={reduceMotion ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <FiGlobe />
                            </M.div>
                            <h3 id="language-popup-title" className="language-popup-title">
                                {t('language_popup.title') || 'Dil Seçin / Choose Language / Sprache Wählen'}
                            </h3>
                            <p className="language-popup-subtitle">
                                {t('language_popup.subtitle') ||
                                    'Lütfen tercih ettiğiniz dili seçin / Please select your preferred language / Bitte wählen Sie Ihre bevorzugte Sprache'}
                            </p>
                        </div>

                        <div className="language-popup-languages" role="listbox" aria-label={t('language_popup.title', 'Dil')}>
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    type="button"
                                    role="option"
                                    aria-selected={selectedLang === lang.code}
                                    className={`language-popup-option ${selectedLang === lang.code ? 'selected' : ''}`}
                                    onClick={() => handleLanguageSelect(lang.code)}
                                >
                                    <div className="language-popup-option-content">
                                        <span className="language-popup-flag">{flagFor(lang.code)}</span>
                                        <div className="language-popup-option-text">
                                            <span className="language-popup-option-name">{lang.nativeName || lang.name}</span>
                                            {lang.name !== lang.nativeName && (
                                                <span className="language-popup-option-english">{lang.name}</span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedLang === lang.code && (
                                        <M.div
                                            className="language-popup-check"
                                            initial={reduceMotion ? false : { scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                                        >
                                            <FiCheck />
                                        </M.div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="language-popup-actions">
                            <button type="button" className="language-popup-confirm" onClick={handleConfirm}>
                                {t('language_popup.confirm') || 'Devam Et / Continue / Fortfahren'}
                            </button>
                        </div>
                    </M.div>
                </M.div>
            ) : null}
        </AnimatePresence>
    );
};

export default LanguageSelectorPopup;
