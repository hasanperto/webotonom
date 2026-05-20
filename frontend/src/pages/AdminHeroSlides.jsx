import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { getImageUrl } from '../utils/api';
import { 
    FiPlus, FiEdit, FiTrash2, FiMove, FiCheck, FiX,
    FiChevronLeft, FiChevronRight, FiImage,
    FiRefreshCw, FiEye, FiEyeOff
} from 'react-icons/fi';
import { 
    getHeroSlides, deleteHeroSlide,
    updateHeroSlideOrder, updateHeroSlideStatus
} from '../api/sections';
import './AdminHeroSlides.css';

const AdminHeroSlides = () => {
    const navigate = useNavigate();
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedSlide, setDraggedSlide] = useState(null);
    const [autoPlay, setAutoPlay] = useState(true);
    const [currentPreview, setCurrentPreview] = useState(0);
    const intervalRef = useRef(null);

    useEffect(() => {
        loadSlides();
    }, []);

    useEffect(() => {
        if (autoPlay && slides.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentPreview(prev => (prev + 1) % slides.length);
            }, 3000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoPlay, slides.length]);

    const loadSlides = async () => {
        try {
            setLoading(true);
            const loadedSlides = await getHeroSlides();
            setSlides(loadedSlides.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch (error) {
            console.error('Error loading slides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        navigate('/admin/sections/hero/slides/add');
    };

    const handleEdit = (slide) => {
        navigate(`/admin/sections/hero/slides/edit/${slide.id}`);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bu slide\'ı silmek istediğinize emin misiniz?')) return;
        try {
            await deleteHeroSlide(id);
            await loadSlides();
        } catch (error) {
            console.error('Error deleting slide:', error);
            alert('Slide silinirken hata oluştu');
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await updateHeroSlideStatus(id, newStatus);
            await loadSlides();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Durum güncellenirken hata oluştu');
        }
    };

    // Drag & Drop
    const handleDragStart = (e, slide) => {
        setDraggedSlide(slide);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, targetSlide) => {
        e.preventDefault();
        if (!draggedSlide || draggedSlide.id === targetSlide.id) {
            setDraggedSlide(null);
            return;
        }

        const draggedIndex = slides.findIndex(s => s.id === draggedSlide.id);
        const targetIndex = slides.findIndex(s => s.id === targetSlide.id);

        const newSlides = [...slides];
        const [removed] = newSlides.splice(draggedIndex, 1);
        newSlides.splice(targetIndex, 0, removed);

        const updatedSlides = newSlides.map((s, i) => ({ ...s, order: i + 1 }));

        try {
            await updateHeroSlideOrder(updatedSlides);
            setSlides(updatedSlides);
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Sıra güncellenirken hata oluştu');
            await loadSlides();
        } finally {
            setDraggedSlide(null);
        }
    };

    const nextPreview = () => {
        setCurrentPreview((prev) => (prev + 1) % slides.length);
    };

    const prevPreview = () => {
        setCurrentPreview((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const activeSlides = slides.filter(s => s.status === 'active');

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-hero-slides-page">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-hero-slides-page">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <button className="btn-back" onClick={() => navigate('/admin/sections')}>
                            <FiChevronLeft /> Bölümlere Dön
                        </button>
                        <h1>Hero Slider Yönetimi</h1>
                        <p>Ana sayfa hero slider öğelerini yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadSlides}>
                            <FiRefreshCw /> Yenile
                        </button>
                        <button className="btn-add" onClick={handleAdd}>
                            <FiPlus /> Yeni Slide
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <FiImage />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Toplam Slide</span>
                            <span className="stat-value">{slides.length}</span>
                        </div>
                    </div>
                    <div className="stat-card active">
                        <div className="stat-icon">
                            <FiCheck />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Aktif Slide</span>
                            <span className="stat-value">{activeSlides.length}</span>
                        </div>
                    </div>
                    <div className="stat-card inactive">
                        <div className="stat-icon">
                            <FiEyeOff />
                        </div>
                        <div className="stat-content">
                            <span className="stat-label">Pasif Slide</span>
                            <span className="stat-value">{slides.length - activeSlides.length}</span>
                        </div>
                    </div>
                </div>

                {/* Live Preview */}
                {activeSlides.length > 0 && (
                    <div className="preview-section">
                        <div className="preview-header">
                            <h3>Canlı Önizleme</h3>
                            <div className="preview-controls">
                                <button 
                                    className="btn-preview-control"
                                    onClick={() => setAutoPlay(!autoPlay)}
                                >
                                    {autoPlay ? '⏸ Duraklat' : '▶ Oynat'}
                                </button>
                                <button className="btn-preview-control" onClick={prevPreview}>
                                    <FiChevronLeft />
                                </button>
                                <button className="btn-preview-control" onClick={nextPreview}>
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                        <div className="preview-container">
                            {activeSlides.map((slide, index) => {
                                const imageUrl = slide.image?.startsWith('http') 
                                    ? slide.image 
                                    : slide.image 
                                        ? getImageUrl(slide.image)
                                        : null;
                                return (
                                    <div
                                        key={slide.id}
                                        className={`preview-slide ${index === currentPreview ? 'active' : ''}`}
                                        style={{
                                            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                                            background: slide.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        }}
                                    >
                                        <div className="preview-overlay" style={{ background: slide.gradient || 'linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%)' }}></div>
                                        <div className="preview-content">
                                            <h2>{slide.title}</h2>
                                            {slide.subtitle && <p>{slide.subtitle}</p>}
                                            <div className="preview-buttons">
                                                {slide.button_text && (
                                                    <button className="btn-preview">{slide.button_text}</button>
                                                )}
                                                {slide.button_text_2 && (
                                                    <button className="btn-preview outline">{slide.button_text_2}</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="preview-dots">
                                {activeSlides.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`dot ${index === currentPreview ? 'active' : ''}`}
                                        onClick={() => setCurrentPreview(index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Slides List */}
                <div className="slides-section">
                    <h3>Slide Listesi</h3>
                    {slides.length === 0 ? (
                        <div className="empty-state">
                            <FiImage />
                            <h4>Henüz slide eklenmemiş</h4>
                            <p>Yeni slide eklemek için "Yeni Slide" butonuna tıklayın</p>
                            <button className="btn-add-empty" onClick={handleAdd}>
                                <FiPlus /> İlk Slide'ı Ekle
                            </button>
                        </div>
                    ) : (
                        <div className="slides-grid">
                            {slides.map((slide, index) => {
                                const imageUrl = slide.image?.startsWith('http') 
                                    ? slide.image 
                                    : slide.image 
                                        ? getImageUrl(slide.image)
                                        : null;
                                return (
                                    <div
                                        key={slide.id}
                                        className={`slide-card ${slide.status === 'inactive' ? 'inactive' : ''}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, slide)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, slide)}
                                    >
                                        <div className="slide-drag-handle">
                                            <FiMove />
                                        </div>
                                        <div className="slide-order">{index + 1}</div>
                                        <div 
                                            className="slide-image"
                                            style={{
                                                backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                                                background: slide.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            }}
                                        >
                                            {!imageUrl && <FiImage />}
                                        </div>
                                        <div className="slide-info">
                                            <h4>{slide.title}</h4>
                                            {slide.subtitle && <p>{slide.subtitle}</p>}
                                        </div>
                                        <div className="slide-actions">
                                            <button
                                                className={`btn-status ${slide.status === 'active' ? 'active' : 'inactive'}`}
                                                onClick={() => handleStatusToggle(slide.id, slide.status)}
                                                title={slide.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                                            >
                                                {slide.status === 'active' ? <FiCheck /> : <FiX />}
                                            </button>
                                            <button
                                                className="btn-edit"
                                                onClick={() => handleEdit(slide)}
                                                title="Düzenle"
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDelete(slide.id)}
                                                title="Sil"
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminHeroSlides;

