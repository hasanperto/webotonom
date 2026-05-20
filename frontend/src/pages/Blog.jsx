import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion as M, useReducedMotion } from 'framer-motion';
import { blogAPI } from '../api/blog';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl } from '../utils/api';
import { FiArrowRight, FiSearch } from 'react-icons/fi';
import { RevealOnScroll, MotionCard } from '../components/motion';
import { staggerContainer, staggerItem } from '../utils/motion';
import './Blog.css';

const Blog = () => {
    const { language, t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        loadPosts();
    }, [language]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getPosts({ lang: language });
            setPosts(response.data.posts || []);
        } catch (error) {
            console.error('Blog load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const locale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';
        return date.toLocaleDateString(locale);
    };

    const truncateExcerpt = (text, maxLength = 150) => {
        if (!text) return '';
        const plainText = text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        if (plainText.length <= maxLength) return plainText;
        return `${plainText.substring(0, maxLength).trim()}...`;
    };

    const categories = useMemo(() => {
        const set = new Set();
        posts.forEach((p) => {
            if (p.category_name) set.add(p.category_name);
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b, language === 'tr' ? 'tr' : 'en'));
    }, [posts, language]);

    const filteredPosts = useMemo(() => {
        let list = [...posts];
        const tagParam = searchParams.get('tag')?.trim().toLowerCase();
        const q = searchQuery.trim().toLowerCase();

        if (categoryFilter) {
            list = list.filter((p) => p.category_name === categoryFilter);
        }
        if (tagParam) {
            list = list.filter((p) => (p.tags || '').toLowerCase().includes(tagParam));
        }
        if (q) {
            list = list.filter((p) => {
                const ex = truncateExcerpt(p.excerpt, 500).toLowerCase();
                return (
                    (p.title || '').toLowerCase().includes(q) ||
                    ex.includes(q) ||
                    (p.tags || '').toLowerCase().includes(q)
                );
            });
        }
        return list;
    }, [posts, categoryFilter, searchQuery, searchParams]);

    const featured = filteredPosts[0];
    const gridPosts = filteredPosts.slice(1);

    const clearFilters = () => {
        setCategoryFilter(null);
        setSearchQuery('');
        setSearchParams({});
    };

    const selectCategory = (cat) => {
        setCategoryFilter(cat);
        setSearchParams({});
    };

    if (loading) {
        return (
            <div className="blog-page blog-page--loading">
                <div className="container">
                    <M.div
                        className="blog-skeleton-hero"
                        initial={reduceMotion ? false : { opacity: 0.6 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={reduceMotion ? {} : { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <p className="blog-loading-text">{t('blog.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="blog-page">
            <div className="container">
                <RevealOnScroll>
                    <h1 className="blog-page-title">{t('blog.title')}</h1>
                    <p className="blog-subtitle">{t('blog.subtitle')}</p>
                </RevealOnScroll>

                <div className="blog-toolbar">
                    <div className="blog-search-wrap">
                        <FiSearch className="blog-search-icon" aria-hidden />
                        <input
                            type="search"
                            className="blog-search-input"
                            placeholder={t('blog.search_placeholder', 'Yazılarda ara...')}
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                            aria-label={t('blog.search_placeholder', 'Yazılarda ara...')}
                        />
                    </div>
                    <div className="blog-chips" role="group" aria-label={t('blog.categories', 'Kategoriler')}>
                        <button
                            type="button"
                            className={`blog-chip ${!categoryFilter ? 'is-active' : ''}`}
                            onClick={() => clearFilters()}
                        >
                            {t('blog.all_posts', 'Tümü')}
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                className={`blog-chip ${categoryFilter === cat ? 'is-active' : ''}`}
                                onClick={() => selectCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredPosts.length === 0 ? (
                    <div className="no-posts">
                        <p>{t('blog.no_posts')}</p>
                        {(categoryFilter || searchQuery || searchParams.get('tag')) && (
                            <button type="button" className="blog-clear-filters" onClick={clearFilters}>
                                {t('blog.clear_filters', 'Filtreleri temizle')}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {featured && (
                            <RevealOnScroll delay={0.04}>
                                <MotionCard as={Link} to={`/blog/${featured.slug}`} className="blog-featured" enableHover={false}>
                                    <div className="blog-featured-inner">
                                        {featured.cover_image && (
                                            <div className="blog-featured-image">
                                                <img src={getImageUrl(featured.cover_image)} alt={featured.title} />
                                            </div>
                                        )}
                                        <div className="blog-featured-content">
                                            <span className="blog-featured-badge">{t('blog.featured')}</span>
                                            {featured.category_name && (
                                                <span className="blog-category blog-category--featured">{featured.category_name}</span>
                                            )}
                                            <h2 className="blog-featured-title">{featured.title}</h2>
                                            {featured.excerpt && (
                                                <p className="blog-featured-excerpt">{truncateExcerpt(featured.excerpt, 220)}</p>
                                            )}
                                            <span className="read_more read_more--featured">
                                                {t('blog.read_more')} <FiArrowRight />
                                            </span>
                                            <div className="blog-meta blog-meta--featured">
                                                <span>{featured.author_name || t('blog.admin')}</span>
                                                <span>{formatDate(featured.published_at || featured.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </MotionCard>
                            </RevealOnScroll>
                        )}

                        {gridPosts.length > 0 && (
                            <M.div
                                className="blog-grid"
                                variants={staggerContainer(0.07, 0.06)}
                                initial="hidden"
                                whileInView="show"
                                viewport={{ once: true, margin: '-40px' }}
                            >
                                {gridPosts.map((post) => (
                                    <M.div key={post.id} variants={staggerItem} className="blog-grid-item">
                                        <MotionCard as={Link} to={`/blog/${post.slug}`} className="blog-card" enableHover={false}>
                                            {post.cover_image && (
                                                <div className="blog-image">
                                                    <img src={getImageUrl(post.cover_image)} alt={post.title} />
                                                </div>
                                            )}
                                            <div className="blog-content">
                                                {post.category_name && (
                                                    <span className="blog-category">{post.category_name}</span>
                                                )}
                                                <h2>{post.title}</h2>
                                                {post.excerpt && (
                                                    <>
                                                        <p className="blog-excerpt">{truncateExcerpt(post.excerpt, 150)}</p>
                                                        <div className="entry-footer">
                                                            <span className="read_more">
                                                                {t('blog.read_more')} <FiArrowRight />
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="blog-meta">
                                                    <span>{post.author_name || t('blog.admin')}</span>
                                                    <span>{formatDate(post.published_at || post.created_at)}</span>
                                                    {post.comment_count > 0 && <span>💬 {post.comment_count}</span>}
                                                </div>
                                            </div>
                                        </MotionCard>
                                    </M.div>
                                ))}
                            </M.div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Blog;
