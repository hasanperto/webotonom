import { useState } from 'react';
import { translateText } from '../api/i18n';
import { FiGlobe, FiLoader, FiCheck, FiAlertCircle, FiCopy } from 'react-icons/fi';
import './TranslationTest.css';

const TranslationTest = () => {
    const [sourceText, setSourceText] = useState('');
    const [sourceLang, setSourceLang] = useState('tr');
    const [targetLang, setTargetLang] = useState('en');
    const [translatedText, setTranslatedText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);

    const languages = [
        { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' }
    ];

    const handleTranslate = async () => {
        if (!sourceText.trim()) {
            setError('Lütfen çevrilecek metni girin');
            return;
        }

        if (sourceLang === targetLang) {
            setError('Kaynak ve hedef dil aynı olamaz');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setInfo(null);
            setTranslatedText('');

            const result = await translateText(sourceText, sourceLang, targetLang);
            
            if (result.translatedText) {
                setTranslatedText(result.translatedText);
                if (result.warning) {
                    setInfo(result.warning);
                }
                if (result.provider) {
                    setInfo(`Çeviri sağlayıcı: ${result.provider}`);
                }
            } else {
                setError('Çeviri sonucu alınamadı');
            }
        } catch (err) {
            console.error('Translation error:', err);
            setError(err.response?.data?.message || 'Çeviri sırasında hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        alert('Kopyalandı!');
    };

    const handleSwapLanguages = () => {
        const tempLang = sourceLang;
        const tempText = sourceText;
        setSourceLang(targetLang);
        setTargetLang(tempLang);
        setSourceText(translatedText);
        setTranslatedText(tempText);
    };

    const exampleTexts = {
        tr: 'Bu bir test metnidir. Proje başlığı ve açıklaması için çeviri yapılacak.',
        en: 'This is a test text. Translation will be done for project title and description.',
        de: 'Dies ist ein Testtext. Übersetzung wird für Projekttitel und -beschreibung durchgeführt.',
        fr: 'Ceci est un texte de test. La traduction sera effectuée pour le titre et la description du projet.',
        es: 'Este es un texto de prueba. La traducción se realizará para el título y la descripción del proyecto.',
        ar: 'هذا نص تجريبي. سيتم الترجمة لعنوان المشروع والوصف.',
        ru: 'Это тестовый текст. Перевод будет выполнен для названия и описания проекта.'
    };

    const loadExample = () => {
        setSourceText(exampleTexts[sourceLang] || exampleTexts.tr);
    };

    return (
        <div className="translation-test-page">
            <div className="container">
                <div className="test-header">
                    <h1>
                        <FiGlobe /> Gemini AI Çeviri Test Sayfası
                    </h1>
                    <p>Google Gemini AI ile çeviri özelliğini test edin</p>
                </div>

                <div className="test-content">
                    {/* Dil Seçimi */}
                    <div className="language-selector">
                        <div className="lang-group">
                            <label>Kaynak Dil</label>
                            <select 
                                value={sourceLang} 
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="lang-select"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button 
                            className="swap-btn"
                            onClick={handleSwapLanguages}
                            title="Dilleri Değiştir"
                        >
                            ⇄
                        </button>

                        <div className="lang-group">
                            <label>Hedef Dil</label>
                            <select 
                                value={targetLang} 
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="lang-select"
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.flag} {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Kaynak Metin */}
                    <div className="text-input-section">
                        <div className="section-header">
                            <label>
                                Kaynak Metin ({languages.find(l => l.code === sourceLang)?.name})
                            </label>
                            <button 
                                className="btn-example"
                                onClick={loadExample}
                                type="button"
                            >
                                Örnek Metin Yükle
                            </button>
                        </div>
                        <textarea
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            placeholder="Çevrilecek metni buraya yazın..."
                            className="text-input"
                            rows={6}
                        />
                        {sourceText && (
                            <button 
                                className="btn-copy"
                                onClick={() => handleCopy(sourceText)}
                                title="Kopyala"
                            >
                                <FiCopy /> Kopyala
                            </button>
                        )}
                    </div>

                    {/* Çeviri Butonu */}
                    <div className="translate-action">
                        <button
                            className="btn-translate"
                            onClick={handleTranslate}
                            disabled={loading || !sourceText.trim()}
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="spinning" /> Çevriliyor...
                                </>
                            ) : (
                                <>
                                    <FiGlobe /> Çevir
                                </>
                            )}
                        </button>
                    </div>

                    {/* Hata/Info Mesajları */}
                    {error && (
                        <div className="alert alert-error">
                            <FiAlertCircle /> {error}
                        </div>
                    )}

                    {info && (
                        <div className="alert alert-info">
                            <FiCheck /> {info}
                        </div>
                    )}

                    {/* Çeviri Sonucu */}
                    {translatedText && (
                        <div className="text-output-section">
                            <div className="section-header">
                                <label>
                                    Çeviri Sonucu ({languages.find(l => l.code === targetLang)?.name})
                                </label>
                                <button 
                                    className="btn-copy"
                                    onClick={() => handleCopy(translatedText)}
                                    title="Kopyala"
                                >
                                    <FiCopy /> Kopyala
                                </button>
                            </div>
                            <div className="text-output">
                                {translatedText}
                            </div>
                        </div>
                    )}

                    {/* HTML Test */}
                    <div className="html-test-section">
                        <h3>HTML İçerik Testi</h3>
                        <p>HTML etiketlerinin korunup korunmadığını test edin:</p>
                        <button
                            className="btn-example"
                            onClick={() => {
                                setSourceText('<h2>Proje Başlığı</h2><p>Bu bir <strong>kalın</strong> metin ve <em>italik</em> metin içerir.</p><ul><li>Madde 1</li><li>Madde 2</li></ul>');
                            }}
                            type="button"
                        >
                            HTML Örnek Yükle
                        </button>
                    </div>

                    {/* API Durumu */}
                    <div className="api-status">
                        <h3>API Durumu</h3>
                        <div className="status-info">
                            <p><strong>Çeviri Sağlayıcı:</strong> Otomatik seçim (USE_TRANSLATE_API)</p>
                            <p><strong>Desteklenen API'ler:</strong> OpenRouter, Gemini, OpenAI</p>
                            <p><strong>Fallback:</strong> Bir API başarısız olursa diğerleri denenir</p>
                            <p><strong>API Key:</strong> Backend'de kontrol edilir</p>
                            <p className="note">
                                <small>
                                    ℹ️ API key backend'de (.env) yapılandırılmalıdır. 
                                    Eğer yapılandırılmamışsa fallback modu aktif olur.
                                </small>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranslationTest;

