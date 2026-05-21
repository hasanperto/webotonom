import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import {
    FiArrowLeft,
    FiRefreshCw,
    FiPlus,
    FiCheck,
    FiAlertCircle,
    FiExternalLink,
    FiZap,
    FiFilter,
    FiLayers,
} from 'react-icons/fi';
import './AdminBlog.css';
import './AdminBlogBot.css';

const DEFAULT_SOURCE = 'fullprogramlarindir';

const AdminBlogBot = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [sourceId, setSourceId] = useState(DEFAULT_SOURCE);
    const [sources, setSources] = useState([]);
    const [categoryPath, setCategoryPath] = useState('');
    const [categories, setCategories] = useState([{ label: 'Tümü', path: '' }]);
    const [loading, setLoading] = useState(true);
    const [importingUrl, setImportingUrl] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [error, setError] = useState(null);
    const [importStatus, setImportStatus] = useState('draft');
    const [selected, setSelected] = useState(() => new Set());

    useEffect(() => {
        api.get('/admin/blog/news-bot/sources')
            .then((res) => {
                if (res.data.sources?.length) {
                    setSources(res.data.sources);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        api.get('/admin/blog/news-bot/categories', { params: { source: sourceId } })
            .then((res) => {
                if (res.data.categories?.length) {
                    setCategories(res.data.categories);
                }
            })
            .catch(() => {});
    }, [sourceId]);

    const loadList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/admin/blog/news-bot/list', {
                params: {
                    page,
                    source: sourceId,
                    category: categoryPath || undefined,
                },
            });
            setItems(response.data.items || []);
            setSelected(new Set());
        } catch (err) {
            console.error('News bot list error:', err);
            const status = err.response?.status;
            const apiError = err.response?.data?.error;
            const details = err.response?.data?.details;
            let message =
                apiError ||
                details ||
                err.message ||
                'Kaynak siteden gönderiler alınamadı.';
            if (status === 404) {
                message =
                    'Haber Botu API bulunamadı (404). Sunucuda backend güncellenmeli ve PM2 backend klasöründen yeniden başlatılmalı.';
            } else if (!err.response) {
                message += ' Sunucuya bağlanılamadı veya istek zaman aşımına uğradı.';
            } else if (details && apiError && details !== apiError) {
                message = `${apiError}: ${details}`;
            }
            setError(message);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, categoryPath, sourceId]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const selectableItems = useMemo(
        () => items.filter((item) => !item.exists),
        [items]
    );

    const allSelected =
        selectableItems.length > 0 &&
        selectableItems.every((item) => selected.has(item.url));

    const handleSourceChange = (id) => {
        setSourceId(id);
        setCategoryPath('');
        setPage(1);
    };

    const handleCategoryChange = (path) => {
        setCategoryPath(path);
        setPage(1);
    };

    const activeSourceLabel =
        sources.find((s) => s.id === sourceId)?.label || sourceId;

    const toggleSelect = (url) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(url)) next.delete(url);
            else next.add(url);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(selectableItems.map((i) => i.url)));
        }
    };

    const markImported = (urls) => {
        const urlSet = new Set(urls);
        setItems((prev) =>
            prev.map((row) => (urlSet.has(row.url) ? { ...row, exists: true } : row))
        );
        setSelected((prev) => {
            const next = new Set(prev);
            urls.forEach((u) => next.delete(u));
            return next;
        });
    };

    const handleImport = async (item) => {
        if (item.exists) {
            alert('Bu başlıkta bir yazı zaten mevcut.');
            return;
        }

        if (
            !window.confirm(
                `"${item.title}" eklenecek (${importStatus === 'published' ? 'Yayınla' : 'Taslak'}). Devam?`
            )
        ) {
            return;
        }

        try {
            setImportingUrl(item.url);
            const response = await api.post('/admin/blog/news-bot/import', {
                url: item.url,
                status: importStatus,
            });
            alert(response.data.message || 'Yazı eklendi');
            markImported([item.url]);
        } catch (err) {
            if (err.response?.status === 409) {
                alert(err.response.data.error || 'Bu başlık zaten kayıtlı.');
                markImported([item.url]);
            } else {
                alert(
                    err.response?.data?.error ||
                        err.response?.data?.details ||
                        'İçe aktarma başarısız'
                );
            }
        } finally {
            setImportingUrl(null);
        }
    };

    const handleBulkImport = async () => {
        const urls = [...selected];
        if (urls.length === 0) {
            alert('Lütfen en az bir gönderi seçin.');
            return;
        }

        if (
            !window.confirm(
                `${urls.length} yazı ${importStatus === 'published' ? 'yayınlanarak' : 'taslak olarak'} eklenecek. Devam?`
            )
        ) {
            return;
        }

        try {
            setBulkLoading(true);
            const response = await api.post('/admin/blog/news-bot/import-bulk', {
                urls,
                status: importStatus,
            });
            const { success, skipped, failed, message } = response.data;
            alert(
                `${message}\n\nBaşarılı: ${success?.length || 0}\nAtlanan: ${skipped?.length || 0}\nHata: ${failed?.length || 0}`
            );
            markImported([
                ...(success || []).map((s) => s.url),
                ...(skipped || []).map((s) => s.url),
            ]);
        } catch (err) {
            alert(
                err.response?.data?.error ||
                    err.response?.data?.details ||
                    'Toplu içe aktarma başarısız'
            );
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="admin-blog-page admin-blog-bot-page">
                <div className="admin-header-minimal">
                    <div>
                        <h1 className="page-title-advanced">
                            <FiZap className="bot-title-icon" /> Haber Botu
                        </h1>
                        <p className="page-subtitle-advanced">
                            {activeSourceLabel} — toplu veya tek tek içe aktarın
                        </p>
                    </div>
                    <div className="header-actions">
                        <button
                            type="button"
                            className="btn-refresh"
                            onClick={() => navigate('/admin/blog')}
                        >
                            <FiArrowLeft /> Blog
                        </button>
                        <button
                            type="button"
                            className="btn-refresh"
                            onClick={loadList}
                            disabled={loading || bulkLoading}
                        >
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                <div className="bot-toolbar">
                    <div className="bot-status-group">
                        <span className="bot-toolbar-label">Durum:</span>
                        <label className={`bot-status-opt ${importStatus === 'draft' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="importStatus"
                                value="draft"
                                checked={importStatus === 'draft'}
                                onChange={() => setImportStatus('draft')}
                            />
                            Taslak
                        </label>
                        <label className={`bot-status-opt ${importStatus === 'published' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="importStatus"
                                value="published"
                                checked={importStatus === 'published'}
                                onChange={() => setImportStatus('published')}
                            />
                            Yayınla
                        </label>
                    </div>

                    <button
                        type="button"
                        className="btn-primary bot-bulk-btn"
                        disabled={bulkLoading || selected.size === 0}
                        onClick={handleBulkImport}
                    >
                        <FiLayers />
                        {bulkLoading
                            ? 'Ekleniyor...'
                            : `Seçilenleri Ekle (${selected.size})`}
                    </button>

                    {selectableItems.length > 0 && (
                        <button
                            type="button"
                            className="btn-refresh bot-select-all"
                            onClick={toggleSelectAll}
                        >
                            {allSelected ? 'Seçimi Kaldır' : 'Sayfadakileri Seç'}
                        </button>
                    )}
                </div>

                <div className="bot-filters bot-filters--source">
                    <span className="bot-filters-label">Kaynak</span>
                    <div className="bot-category-chips">
                        {(sources.length ? sources : [{ id: DEFAULT_SOURCE, label: 'fullprogramlarindir.net' }]).map(
                            (src) => (
                                <button
                                    key={src.id}
                                    type="button"
                                    className={`bot-chip bot-chip--source ${sourceId === src.id ? 'active' : ''}`}
                                    onClick={() => handleSourceChange(src.id)}
                                >
                                    {src.label}
                                </button>
                            )
                        )}
                    </div>
                </div>

                <div className="bot-filters">
                    <span className="bot-filters-label">
                        <FiFilter /> Kategori
                    </span>
                    <div className="bot-category-chips">
                        {categories.map((cat) => (
                            <button
                                key={cat.path || 'all'}
                                type="button"
                                className={`bot-chip ${categoryPath === cat.path ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(cat.path)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bot-pagination">
                    <button
                        type="button"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Önceki
                    </button>
                    <span>Sayfa {page}</span>
                    <button
                        type="button"
                        disabled={loading || items.length === 0}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Sonraki
                    </button>
                </div>

                {error && (
                    <div className="bot-error-banner">
                        <FiAlertCircle />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner-large" />
                    </div>
                ) : (
                    <div className="blog-posts-grid bot-posts-grid">
                        {items.map((item) => (
                            <div
                                key={item.url}
                                className={`blog-post-card-minimal bot-card ${item.exists ? 'bot-card--exists' : ''} ${selected.has(item.url) ? 'bot-card--selected' : ''}`}
                            >
                                {!item.exists && (
                                    <label className="bot-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(item.url)}
                                            onChange={() => toggleSelect(item.url)}
                                        />
                                    </label>
                                )}
                                {item.imageUrl && (
                                    <div className="bot-card-thumb">
                                        <img src={item.imageUrl} alt="" loading="lazy" />
                                    </div>
                                )}
                                <div className="post-header">
                                    <h3>{item.title}</h3>
                                    {item.exists && (
                                        <span className="status-badge-minimal published">
                                            <FiCheck /> Mevcut
                                        </span>
                                    )}
                                </div>
                                <div className="post-body">
                                    {item.sourceCategory && (
                                        <span className="bot-source-cat">{item.sourceCategory}</span>
                                    )}
                                    {item.excerpt && (
                                        <p className="post-excerpt">{item.excerpt}</p>
                                    )}
                                    {item.date && (
                                        <p className="bot-date">{item.date}</p>
                                    )}
                                </div>
                                <div className="post-actions bot-card-actions">
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-icon"
                                        title="Kaynağı aç"
                                    >
                                        <FiExternalLink />
                                    </a>
                                    <button
                                        type="button"
                                        className={`btn-primary bot-add-btn ${item.exists ? 'disabled' : ''}`}
                                        disabled={
                                            item.exists ||
                                            importingUrl === item.url ||
                                            bulkLoading
                                        }
                                        onClick={() => handleImport(item)}
                                    >
                                        {importingUrl === item.url ? (
                                            'Ekleniyor...'
                                        ) : item.exists ? (
                                            <>
                                                <FiCheck /> Eklendi
                                            </>
                                        ) : (
                                            <>
                                                <FiPlus /> Ekle
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && items.length === 0 && (
                    <div className="empty-state-minimal">
                        <p>Bu sayfada gönderi bulunamadı.</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminBlogBot;
