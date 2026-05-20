import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { getCookie, setCookie } from '../utils/cookies';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('tr');
    const [translations, setTranslations] = useState({});
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dil tercihini yükle (cookie veya localStorage'dan)
    useEffect(() => {
        const cookieLang = getCookie('selected_language');
        const savedLang = localStorage.getItem('language');
        const browserLang = navigator.language.split('-')[0].toLowerCase();
        
        // Öncelik sırası: Cookie > LocalStorage > Tarayıcı Dili > Varsayılan (tr)
        const initialLang = cookieLang || savedLang || 
            (['tr', 'en', 'de'].includes(browserLang) ? browserLang : 'tr');
        
        setLanguage(initialLang);
    }, []);

    // Dilleri yükle
    useEffect(() => {
        loadLanguages();
    }, []);

    // Çevirileri yükle
    useEffect(() => {
        if (language) {
            loadTranslations(language);
        }
    }, [language]);

    const loadLanguages = async () => {
        try {
            const response = await api.get('/i18n/languages');
            setLanguages(response.data);
        } catch (error) {
            console.error('Error loading languages:', error);
            setLanguages([
                { code: 'tr', name: 'Türkçe', nativeName: 'Türkçe' },
                { code: 'en', name: 'English', nativeName: 'English' },
                { code: 'de', name: 'German', nativeName: 'Deutsch' }
            ]);
        }
    };

    const loadTranslations = async (lang) => {
        try {
            setLoading(true);
            const response = await api.get(`/i18n/translations?lang=${lang}`);
            setTranslations(response.data);
            
            // Kullanıcı giriş yapmışsa dil tercihini kaydet
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    await api.put('/i18n/users/language', { language_code: lang });
                } catch (error) {
                    console.error('Error saving language preference:', error);
                }
            }
        } catch (error) {
            console.error('Error loading translations:', error);
            setTranslations({});
        } finally {
            setLoading(false);
        }
    };

    const changeLanguage = async (lang) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
        document.documentElement.setAttribute('lang', lang);
        
        // Cookie'ye de kaydet (1 yıl)
        setCookie('selected_language', lang, 365);
        
        // RTL kontrolü
        const selectedLang = languages.find(l => l.code === lang);
        if (selectedLang?.rtl) {
            document.documentElement.setAttribute('dir', 'rtl');
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
        }
        
        // Çevirileri yeniden yükle
        await loadTranslations(lang);
        
        // Sayfayı yenile (opsiyonel - sadece gerekirse)
        // window.location.reload();
    };

    const t = (key, params = {}) => {
        // İkinci parametre string ise fallback metin olarak kabul et
        const fallback = typeof params === 'string' ? params : null;
        const replacements = typeof params === 'object' && params !== null ? params : {};
        let text = translations[key] || fallback || key;
        
        // Parametreleri değiştir (hem :param hem de {param} formatlarını destekle)
        Object.keys(replacements).forEach(param => {
            text = text.replace(`:${param}`, replacements[param]);
            text = text.replace(`{${param}}`, replacements[param]);
        });
        
        return text;
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                languages,
                translations,
                loading,
                changeLanguage,
                t
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

