import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { blogAPI } from '../api/blog';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getImageUrl } from '../utils/api';
import {
    FiArrowLeft, FiCalendar, FiUser, FiEye, FiShare2,
    FiHeart, FiTag, FiClock, FiBookOpen, FiList, FiLink,
} from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { MotionCard } from '../components/motion';
import { motionEase, staggerContainer, staggerItem } from '../utils/motion';
import './BlogPost.css';

const BlogPost = () => {
    const { slug } = useParams();
    const { isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [similarPosts, setSimilarPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [liked, setLiked] = useState(false);
    const [toc, setToc] = useState([]);
    const [readProgress, setReadProgress] = useState(0);

    const contentRef = useRef(null);
    const reduceMotion = useReducedMotion();

    useEffect(() => {
        loadPost();
    }, [slug, language]);

    useEffect(() => {
        if (!post) return undefined;
        const id = window.setTimeout(() => {
            const root = contentRef.current;
            if (!root) return;
            const headingEls = root.querySelectorAll('h2, h3');
            const items = [];
            headingEls.forEach((el, i) => {
                if (!el.id) {
                    el.id = `bp-${slug}-${i}`;
                }
                items.push({
                    id: el.id,
                    text: el.textContent?.trim() || '',
                    level: el.tagName === 'H2' ? 2 : 3,
                });
            });
            setToc(items);
        }, 0);
        return () => window.clearTimeout(id);
    }, [post, slug]);

    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement;
            const h = el.scrollHeight - el.clientHeight;
            setReadProgress(h > 0 ? Math.min(100, (el.scrollTop / h) * 100) : 0);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [post]);

    const scrollToHeading = useCallback(
        (id) => {
            document.getElementById(id)?.scrollIntoView({
                behavior: reduceMotion ? 'auto' : 'smooth',
                block: 'start',
            });
        },
        [reduceMotion],
    );

    const dateLocale = language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE';

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString(dateLocale, {
            year: 'numeric',
            month: language === 'tr' ? 'long' : 'short',
            day: 'numeric',
        });
    };

    const loadPost = async () => {
        try {
            setLoading(true);
            const response = await blogAPI.getPost(slug, { lang: language });
            setPost(response.data.post);
            setComments(response.data.comments || []);
            setSimilarPosts(response.data.similarPosts || []);
        } catch (error) {
            console.error('Blog post load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert(t('blog.login_to_comment'));
            return;
        }

        if (!commentText.trim()) {
            return;
        }

        try {
            await blogAPI.addComment(post.id, { comment: commentText });
            alert(t('blog.comment_added'));
            setCommentText('');
            setShowCommentForm(false);
            loadPost();
        } catch (error) {
            alert(error.response?.data?.error || t('blog.comment_error'));
        }
    };

    const getShareUrl = useCallback(() => window.location.href, []);

    const copyShareLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(getShareUrl());
            alert(t('blog.link_copied'));
        } catch {
            alert(t('blog.share_copy_error'));
        }
    }, [getShareUrl, t]);

    const handleNativeShare = useCallback(() => {
        if (navigator.share && post) {
            navigator.share({
                title: post.title,
                text: post.excerpt || post.title,
                url: getShareUrl(),
            }).catch(() => copyShareLink());
        } else {
            copyShareLink();
        }
    }, [post, getShareUrl, copyShareLink]);

    const handleInstagramShare = useCallback(async () => {
        await copyShareLink();
        alert(t('blog.share_instagram_hint'));
    }, [copyShareLink, t]);

    const calculateReadingTime = (content) => {
        if (!content) return 1;
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.split(/\s+/).length;
        return Math.ceil(words / 200);
    };

    if (loading) {
        return (
            <div className="blog-post-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>{t('blog.loading')}</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="blog-post-page">
                <div className="container">
                    <div className="not-found">
                        <h2>{t('blog.post_not_found')}</h2>
                        <Link to="/blog" className="btn-primary">{t('blog.back_to_blog')}</Link>
                    </div>
                </div>
            </div>
        );
    }

    const readingTime = calculateReadingTime(post.content);

    return (
        <div className="blog-post-page" data-theme={theme}>
            <div className="blog-read-progress-track" aria-hidden="true">
                <M.div
                    className="blog-read-progress-bar"
                    animate={{ width: `${readProgress}%` }}
                    transition={{ duration: reduceMotion ? 0 : 0.12, ease: motionEase }}
                />
            </div>

            <div className="blog-hero blog-hero--compact">
                <div className="container">
                    <Link to="/blog" className="back-link">
                        <FiArrowLeft /> {t('blog.back_to_blog')}
                    </Link>
                </div>
            </div>

            <div className="blog-post-shell">
                <div className="container blog-post-layout">
                    <article className="blog-post-modern blog-post-article">
                        <header className="post-header-modern">
                            {post.category_name && (
                                <div className="post-category">
                                    <FiBookOpen /> {post.category_name}
                                </div>
                            )}
                            <h1 className="post-title-modern">{post.title}</h1>

                            <div className="post-meta-modern">
                                <div className="meta-item">
                                    <FiUser className="meta-icon" />
                                    <span>{post.author_name || t('blog.author')}</span>
                                </div>
                                <div className="meta-item">
                                    <FiCalendar className="meta-icon" />
                                    <span>
                                        {t('blog.published_date', {
                                            date: formatDate(post.published_at || post.created_at),
                                        })}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <FiClock className="meta-icon" />
                                    <span>{t('blog.reading_time', { minutes: readingTime })}</span>
                                </div>
                                {post.view_count > 0 && (
                                    <div className="meta-item">
                                        <FiEye className="meta-icon" />
                                        <span>{post.view_count}</span>
                                    </div>
                                )}
                            </div>
                        </header>

                        {(post.featured_image || post.cover_image) && (
                            <div className="post-image-modern">
                                <img
                                    src={getImageUrl(post.featured_image || post.cover_image)}
                                    alt={post.title}
                                    loading="lazy"
                                />
                            </div>
                        )}

                        <div
                            ref={contentRef}
                            className="post-content-modern"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {(post.tags || post.meta_keywords) && (
                            <div className="post-tags-modern">
                                <FiTag className="tags-icon" />
                                {(post.tags || post.meta_keywords).split(',').map((tag, idx) => (
                                    <Link
                                        key={idx}
                                        to={`/blog?tag=${encodeURIComponent(tag.trim())}`}
                                        className="tag-modern"
                                    >
                                        {tag.trim()}
                                    </Link>
                                ))}
                            </div>
                        )}

                        <div className="post-actions-modern">
                            <button
                                type="button"
                                className={`action-btn ${liked ? 'liked' : ''}`}
                                onClick={() => setLiked(!liked)}
                            >
                                <FiHeart /> {liked ? 'Beğendin' : 'Beğen'}
                            </button>
                            <button type="button" className="action-btn blog-share-mobile" onClick={handleNativeShare}>
                                <FiShare2 /> {t('blog.share_title')}
                            </button>
                        </div>
                    </article>

                    <aside className="blog-post-sidebar" aria-label={t('blog.sidebar_label')}>
                        <div className="blog-sidebar-sticky">
                            {toc.length > 0 && (
                                <nav className="blog-toc">
                                    <h2 className="blog-toc-title">
                                        <FiList aria-hidden /> {t('blog.toc_title')}
                                    </h2>
                                    <ul className="blog-toc-list">
                                        {toc.map((item) => (
                                            <li
                                                key={item.id}
                                                className={item.level === 3 ? 'blog-toc-item blog-toc-item--sub' : 'blog-toc-item'}
                                            >
                                                <button type="button" className="blog-toc-link" onClick={() => scrollToHeading(item.id)}>
                                                    {item.text}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            )}
                            <div className="blog-share-sticky">
                                <h2 className="blog-toc-title">
                                    <FiShare2 aria-hidden /> {t('blog.share_title')}
                                </h2>
                                <div className="blog-share-actions" role="group" aria-label={t('blog.share_title')}>
                                    <button
                                        type="button"
                                        className="blog-share-btn blog-share-btn--copy"
                                        onClick={copyShareLink}
                                        title={t('blog.share_copy')}
                                        aria-label={t('blog.share_copy')}
                                    >
                                        <FiLink aria-hidden />
                                        <span>{t('blog.share_copy')}</span>
                                    </button>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${getShareUrl()}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="blog-share-btn blog-share-btn--whatsapp"
                                        title={t('blog.share_whatsapp')}
                                        aria-label={t('blog.share_whatsapp')}
                                    >
                                        <FaWhatsapp aria-hidden />
                                        <span>{t('blog.share_whatsapp')}</span>
                                    </a>
                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="blog-share-btn blog-share-btn--facebook"
                                        title={t('blog.share_facebook')}
                                        aria-label={t('blog.share_facebook')}
                                    >
                                        <FaFacebookF aria-hidden />
                                        <span>{t('blog.share_facebook')}</span>
                                    </a>
                                    <button
                                        type="button"
                                        className="blog-share-btn blog-share-btn--instagram"
                                        onClick={handleInstagramShare}
                                        title={t('blog.share_instagram')}
                                        aria-label={t('blog.share_instagram')}
                                    >
                                        <FaInstagram aria-hidden />
                                        <span>{t('blog.share_instagram')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {similarPosts.length > 0 && (
                <div className="similar-posts-section">
                    <div className="container">
                        <h2 className="section-title">Benzer Yazılar</h2>
                        <M.div
                            className="similar-posts-grid"
                            variants={staggerContainer(0.08, 0.05)}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: '-40px' }}
                        >
                            {similarPosts.map((similarPost) => (
                                <M.div key={similarPost.id} variants={staggerItem} className="similar-post-item">
                                    <MotionCard
                                        as={Link}
                                        to={`/blog/${similarPost.slug}`}
                                        className="similar-post-card"
                                        enableHover={false}
                                    >
                                        {similarPost.featured_image && (
                                            <div className="similar-post-image">
                                                <img
                                                    src={getImageUrl(similarPost.featured_image)}
                                                    alt={similarPost.title}
                                                    loading="lazy"
                                                />
                                                <div className="image-overlay"></div>
                                            </div>
                                        )}
                                        <div className="similar-post-content">
                                            <h3 className="similar-post-title">{similarPost.title}</h3>
                                            {similarPost.excerpt && (
                                                <p className="similar-post-excerpt">
                                                    {similarPost.excerpt.length > 100
                                                        ? `${similarPost.excerpt.substring(0, 100)}...`
                                                        : similarPost.excerpt}
                                                </p>
                                            )}
                                            <div className="similar-post-meta">
                                                <span className="similar-post-date">
                                                    {formatDate(similarPost.created_at)}
                                                </span>
                                                {similarPost.author_name && (
                                                    <span className="similar-post-author">
                                                        {similarPost.author_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </MotionCard>
                                </M.div>
                            ))}
                        </M.div>
                    </div>
                </div>
            )}

            <div className="comments-section-modern">
                <div className="container">
                    <h2 className="section-title">
                        {t('blog.comments_title', { count: comments.length })}
                    </h2>

                    {isAuthenticated && !showCommentForm && (
                        <button
                            type="button"
                            onClick={() => setShowCommentForm(true)}
                            className="btn-comment"
                        >
                            {t('blog.add_comment')}
                        </button>
                    )}

                    <AnimatePresence mode="wait">
                        {showCommentForm && (
                            <M.form
                                key="comment-form"
                                onSubmit={handleAddComment}
                                className="comment-form-modern"
                                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                                transition={{ duration: 0.22, ease: motionEase }}
                            >
                                <textarea
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder={t('blog.comment_placeholder')}
                                    required
                                    rows="4"
                                />
                                <div className="comment-form-actions">
                                    <button type="submit" className="btn-primary">{t('common.submit')}</button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowCommentForm(false);
                                            setCommentText('');
                                        }}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                </div>
                            </M.form>
                        )}
                    </AnimatePresence>

                    {comments.length === 0 ? (
                        <div className="no-comments">
                            <p>{t('blog.no_comments')}</p>
                        </div>
                    ) : (
                        <div className="comments-list-modern">
                            {comments.map((comment) => (
                                <div key={comment.id} className="comment-item-modern">
                                    <div className="comment-avatar">
                                        {comment.username ? comment.username.charAt(0).toUpperCase() : 'A'}
                                    </div>
                                    <div className="comment-content">
                                        <div className="comment-header">
                                            <strong>{comment.username || 'Anonim'}</strong>
                                            <span>{formatDate(comment.created_at)}</span>
                                        </div>
                                        <div className="comment-body">{comment.comment}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogPost;
