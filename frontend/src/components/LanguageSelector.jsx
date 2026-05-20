import { useState, useEffect, useRef } from 'react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = () => {
    const { language, languages, changeLanguage, loading } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleLanguageChange = (langCode) => {
        changeLanguage(langCode);
        setIsOpen(false);
    };

    const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

    if (loading || languages.length === 0) {
        return null;
    }

    return (
        <div className="language-selector-wrapper" ref={wrapperRef}>
            <button
                className="language-selector-button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                aria-label="Select language"
                type="button"
            >
                <FiGlobe className="language-icon" />
                <span className="language-code">{currentLanguage?.code.toUpperCase() || 'TR'}</span>
                <FiChevronDown className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="language-dropdown">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            type="button"
                            className={`language-option ${language === lang.code ? 'active' : ''}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLanguageChange(lang.code);
                            }}
                        >
                            <span className="language-name">{lang.nativeName || lang.name}</span>
                            <span className="language-code-small">{lang.code.toUpperCase()}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;

