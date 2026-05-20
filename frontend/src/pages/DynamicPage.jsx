import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import pagesAPI from '../api/pages';
import { useLanguage } from '../context/LanguageContext';
import './DynamicPage.css';

const DynamicPage = () => {
    const { slug } = useParams();
    const { language } = useLanguage();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(null);
    const [translations, setTranslations] = useState({});

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError('');
                setPage(null);
                setTranslations({});

                const res = await pagesAPI.getBySlug(slug);
                if (cancelled) return;

                setPage(res.data.page);
                setTranslations(res.data.translations || {});
            } catch (e) {
                if (cancelled) return;
                const msg = e?.response?.data?.error || 'Sayfa yüklenemedi';
                setError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (slug) load();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    const view = useMemo(() => {
        const baseTitle = page?.title || '';
        const baseContent = page?.content || '';
        const t = translations?.[language];

        return {
            title: t?.title || baseTitle,
            content: t?.description || baseContent,
            metaTitle: page?.meta_title || '',
        };
    }, [page, translations, language]);

    useEffect(() => {
        if (!page) return;
        const title = view.metaTitle || view.title || 'TeknoProje';
        document.title = title;
    }, [page, view.metaTitle, view.title]);

    if (loading) {
        return (
            <div className="dynamic-page">
                <div className="dynamic-page__container">
                    <div className="dynamic-page__loading">Yükleniyor...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dynamic-page">
                <div className="dynamic-page__container">
                    <div className="dynamic-page__error">
                        <h1>Sayfa bulunamadı</h1>
                        <p>İstenen adres: /{slug}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dynamic-page">
            <div className="dynamic-page__container">
                {view.title ? <h1 className="dynamic-page__title">{view.title}</h1> : null}
                <div
                    className="dynamic-page__content"
                    dangerouslySetInnerHTML={{ __html: view.content || '' }}
                />
            </div>
        </div>
    );
};

export default DynamicPage;


