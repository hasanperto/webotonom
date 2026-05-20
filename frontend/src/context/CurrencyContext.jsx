import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useLanguage } from './LanguageContext';

const CurrencyContext = createContext();

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within CurrencyProvider');
    }
    return context;
};

// Dil -> Para Birimi Eşleştirmesi
const languageCurrencyMap = {
    'tr': 'TRY',  // Türkçe -> Türk Lirası
    'en': 'USD',  // İngilizce -> Dolar
    'de': 'EUR'   // Almanca -> Euro
};

export const CurrencyProvider = ({ children }) => {
    const { language } = useLanguage();
    const [currency, setCurrency] = useState('TRY');
    const [exchangeRates, setExchangeRates] = useState({});
    const [loading, setLoading] = useState(true);
    const ratesLoadedRef = useRef(false);
    const lastBaseCurrencyRef = useRef('TRY');

    // Dil değiştiğinde para birimini otomatik güncelle
    useEffect(() => {
        if (language && languageCurrencyMap[language]) {
            const newCurrency = languageCurrencyMap[language];
            setCurrency(newCurrency);
        }
    }, [language]);

    // İlk yüklemede site ayarlarından para birimini al (dil yoksa)
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            try {
                // Eğer dil varsa, dil'e göre para birimini kullan
                if (language && languageCurrencyMap[language]) {
                    const mappedCurrency = languageCurrencyMap[language];
                    if (isMounted) {
                        setCurrency(mappedCurrency);
                        setLoading(false);
                    }
                    return;
                }

                // Dil yoksa site ayarlarından al
                const response = await api.get('/public/settings/general');
                if (isMounted && response.data?.currency) {
                    setCurrency(response.data.currency);
                }
            } catch (error) {
                console.error('Currency settings load error:', error);
                if (isMounted) {
                    setCurrency('TRY');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            isMounted = false;
        };
    }, [language]);

    // Döviz kurlarını yükle - TRY bazlı (tüm para birimleri için)
    const loadExchangeRates = useCallback(async (baseCurrency = 'TRY') => {
        // Aynı base currency için tekrar yükleme
        if (lastBaseCurrencyRef.current === baseCurrency && Object.keys(exchangeRates).length > 0) {
            return;
        }
        
        try {
            // ExchangeRateAPI kullanarak döviz kurlarını al (her zaman TRY bazlı)
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/TRY`);
            if (response.ok) {
                const data = await response.json();
                setExchangeRates(data.rates || {});
                lastBaseCurrencyRef.current = 'TRY';
            } else {
                throw new Error('Exchange rate API failed');
            }
        } catch (error) {
            console.error('Exchange rates load error:', error);
            // Fallback: Manuel kurlar (TRY bazlı - 1 TRY = X diğer para birimi)
            setExchangeRates({
                USD: 0.034,  // 1 TRY = 0.034 USD
                EUR: 0.031,  // 1 TRY = 0.031 EUR
                GBP: 0.027,  // 1 TRY = 0.027 GBP
                JPY: 5.1,    // 1 TRY = 5.1 JPY
                CNY: 0.24,   // 1 TRY = 0.24 CNY
                RUB: 3.1     // 1 TRY = 3.1 RUB
            });
            lastBaseCurrencyRef.current = 'TRY';
        }
    }, []);

    // Para birimi değiştiğinde veya ilk yüklemede kurları yükle
    useEffect(() => {
        if (!loading) {
            ratesLoadedRef.current = false;
            loadExchangeRates('TRY');
        }
    }, [loading]);



    const convertPrice = (price, fromCurrency = 'TRY', toCurrency = null) => {
        if (!price || isNaN(price)) return 0;
        
        const targetCurrency = toCurrency || currency;
        
        // Aynı para birimiyse çevirme yapma
        if (targetCurrency === fromCurrency) {
            return parseFloat(price);
        }

        // TRY'den hedef para birimine çevir
        if (fromCurrency === 'TRY') {
            const rate = exchangeRates[targetCurrency];
            if (rate) {
                return parseFloat(price) * rate;
            }
            // Rate yoksa fiyatı olduğu gibi döndür
            return parseFloat(price);
        }

        // Hedef para biriminden TRY'ye çevir, sonra hedef para birimine
        if (fromCurrency !== 'TRY') {
            // Önce TRY'ye çevir: fromCurrency'den TRY'ye
            // exchangeRates[fromCurrency] = 1 TRY = X fromCurrency
            // Yani 1 fromCurrency = 1 / X TRY
            const fromRate = exchangeRates[fromCurrency];
            if (fromRate) {
                const tryPrice = parseFloat(price) / fromRate;
                
                // TRY'den hedef para birimine çevir
                if (targetCurrency === 'TRY') {
                    return tryPrice;
                }
                
                const toRate = exchangeRates[targetCurrency];
                if (toRate) {
                    return tryPrice * toRate;
                }
            }
        }

        // Çeviri yapılamazsa orijinal fiyatı döndür
        return parseFloat(price);
    };

    const formatPrice = (price, fromCurrency = 'TRY', showSymbol = true) => {
        const convertedPrice = convertPrice(price, fromCurrency);
        const targetCurrency = currency;

        const currencySymbols = {
            'TRY': '₺',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CNY': '¥',
            'RUB': '₽'
        };

        const localeMap = {
            'TRY': 'tr-TR',
            'USD': 'en-US',
            'EUR': 'de-DE',
            'GBP': 'en-GB',
            'JPY': 'ja-JP',
            'CNY': 'zh-CN',
            'RUB': 'ru-RU'
        };

        const locale = localeMap[targetCurrency] || 'tr-TR';
        const formatted = new Intl.NumberFormat(locale, {
            style: showSymbol ? 'currency' : 'decimal',
            currency: targetCurrency,
            minimumFractionDigits: targetCurrency === 'JPY' ? 0 : 2,
            maximumFractionDigits: targetCurrency === 'JPY' ? 0 : 2
        }).format(convertedPrice);

        return formatted;
    };

    const getCurrencySymbol = () => {
        const symbols = {
            'TRY': '₺',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CNY': '¥',
            'RUB': '₽'
        };
        return symbols[currency] || '₺';
    };

    // Döviz kurlarını manuel olarak yenile
    const refreshExchangeRates = useCallback(async (force = false) => {
        if (force) {
            ratesLoadedRef.current = false;
            lastBaseCurrencyRef.current = '';
        }
        await loadExchangeRates('TRY');
    }, [loadExchangeRates]);

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                setCurrency,
                exchangeRates,
                convertPrice,
                formatPrice,
                getCurrencySymbol,
                loading,
                refreshExchangeRates
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
};
