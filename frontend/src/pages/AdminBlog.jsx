import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiBookOpen, FiPlus, FiEdit, FiTrash2, FiEye, FiEyeOff,
    FiSearch, FiRefreshCw, FiSave, FiX, FiCalendar, FiUser, FiZap
} from 'react-icons/fi';
import './AdminBlog.css';
import './AdminBlogBot.css';

const AdminBlog = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingPost, setEditingPost] = useState(null);

    useEffect(() => {
        loadPosts();
    }, [filter, searchTerm]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/blog');
            let fetchedPosts = response.data.posts || [];
            
            // Filter by status
            let filtered = filter !== 'all' 
                ? fetchedPosts.filter(p => p.status === filter)
                : fetchedPosts;
            
            // Filter by search term
            if (searchTerm) {
                filtered = filtered.filter(p => 
                    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.slug?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            
            setPosts(filtered);
        } catch (error) {
            console.error('Posts load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-blog-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-blog-page">
                <div className="admin-header-minimal">
                    <div>
                        <h1 className="page-title-advanced">Blog Yönetimi</h1>
                        <p className="page-subtitle-advanced">Blog yazılarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadPosts}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button
                            type="button"
                            className="btn-bot"
                            onClick={() => navigate('/admin/blog/haber-botu')}
                        >
                            <FiZap /> Haber Botu
                        </button>
                        <button className="btn-primary" onClick={() => navigate('/admin/blog/add')}>
                            <FiPlus /> Yeni Yazı
                        </button>
                    </div>
                </div>

                <div className="admin-filters-minimal">
                    <div className="search-box-minimal">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Yazı ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab-minimal ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Tümü
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'published' ? 'active' : ''}`}
                            onClick={() => setFilter('published')}
                        >
                            <FiEye /> Yayınlanan
                        </button>
                        <button
                            className={`filter-tab-minimal ${filter === 'draft' ? 'active' : ''}`}
                            onClick={() => setFilter('draft')}
                        >
                            <FiEyeOff /> Taslak
                        </button>
                    </div>
                </div>

                <div className="blog-posts-grid">
                    {posts.map(post => (
                        <div key={post.id} className="blog-post-card-minimal">
                            <div className="post-header">
                                <h3>{post.title}</h3>
                                <span className={`status-badge-minimal ${post.status}`}>
                                    {post.status === 'published' ? 'Yayınlandı' : 'Taslak'}
                                </span>
                            </div>
                            <div className="post-body">
                                {post.excerpt && (
                                    <p className="post-excerpt">{post.excerpt}</p>
                                )}
                                <div className="post-meta">
                                    <div className="meta-item">
                                        <FiUser />
                                        <span>{post.username || 'Yazar'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <FiCalendar />
                                        <span>{formatDate(post.created_at)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <FiEye />
                                        <span>{post.view_count || 0} görüntülenme</span>
                                    </div>
                                </div>
                            </div>
                            <div className="post-actions">
                                <button className="btn-icon" onClick={() => {
                                    window.location.href = `/admin/blog/${post.id}/edit`;
                                }}>
                                    <FiEdit />
                                </button>
                                <button className="btn-icon btn-danger" onClick={async () => {
                                    if (!window.confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;
                                    try {
                                        await api.delete(`/admin/blog/${post.id}`);
                                        loadPosts();
                                    } catch (error) {
                                        console.error('Delete post error:', error);
                                    }
                                }}>
                                    <FiTrash2 />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {posts.length === 0 && (
                    <div className="empty-state-minimal">
                        <FiBookOpen />
                        <p>Blog yazısı bulunamadı</p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminBlog;

