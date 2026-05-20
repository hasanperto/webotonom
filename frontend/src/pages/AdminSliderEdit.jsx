import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { getImageUrl } from '../utils/api';
import { 
    FiX, FiUpload, FiImage, FiSave, FiLoader,
    FiChevronLeft, FiChevronRight, FiPlay, FiPause, FiLink
} from 'react-icons/fi';
import './AdminSliderAdd.css';

const AdminSliderEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [existingImage, setExistingImage] = useState(null);
    const [autoPlay, setAutoPlay] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const intervalRef = useRef(null);
    
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        order: 0,
        status: 'active'
    });

    const [previewSliders, setPreviewSliders] = useState([]);
    const [existingSliders, setExistingSliders] = useState([]);

    useEffect(() => {
        loadSlider();
        loadExistingSliders();
    }, [id]);

    useEffect(() => {
        updatePreviewSliders();
    }, [imagePreview, formData.title, formData.link, existingSliders]);

    useEffect(() => {
        if (autoPlay && previewSliders.length > 1) {
            intervalRef.current = setInterval(() => {
                setCurrentSlide(prev => 
                    prev === previewSliders.length - 1 ? 0 : prev + 1
                );
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
    }, [autoPlay, previewSliders.length]);

    const loadSlider = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/sliders/${id}`);
            const slider = response.data.slider;
            
            setFormData({
                title: slider.title || '',
                link: slider.link || '',
                order: slider.order || 0,
                status: slider.status || 'active'
            });
            
            if (slider.image) {
                setExistingImage(slider.image);
            }
        } catch (error) {
            console.error('Slider load error:', error);
            alert('Slider yüklenirken hata oluştu');
            navigate('/admin/slider');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingSliders = async () => {
        try {
            const response = await api.get('/admin/sliders');
            const sliders = response.data.sliders || [];
            const activeSliders = sliders
                .filter(s => s.status === 'active' && s.id !== parseInt(id))
                .slice(0, 3);
            setExistingSliders(activeSliders);
        } catch (error) {
            console.error('Load sliders error:', error);
        }
    };

    const updatePreviewSliders = () => {
        const newSliders = [...existingSliders];
        
        // Mevcut sliderı da ekle (düzenlenen)
        const currentSlider = {
            id: id,
            title: formData.title || 'Slider',
            image: imagePreview || (existingImage ? getImageUrl(existingImage) : null),
            link: formData.link || '',
            order: formData.order || 0,
            status: formData.status || 'active',
            isPreview: !!imagePreview
        };
        
        if (currentSlider.image) {
            newSliders.unshift(currentSlider);
        }
        
        setPreviewSliders(newSliders);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title) {
            alert('Lütfen başlık girin');
            return;
        }

        try {
            setSaving(true);
            
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('link', formData.link || '');
            submitData.append('order', formData.order || 0);
            submitData.append('status', formData.status);
            
            if (image) {
                submitData.append('image', image);
            } else if (existingImage) {
                submitData.append('image', existingImage);
            }

            await api.put(`/admin/sliders/${id}`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert('Slider başarıyla güncellendi!');
            navigate('/admin/slider');
        } catch (error) {
            console.error('Update slider error:', error);
            alert(error.response?.data?.error || 'Slider güncellenirken hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setAutoPlay(false);
    };

    const goToPrevious = () => {
        setCurrentSlide(prev => 
            prev === 0 ? previewSliders.length - 1 : prev - 1
        );
    };

    const goToNext = () => {
        setCurrentSlide(prev => 
            prev === previewSliders.length - 1 ? 0 : prev + 1
        );
    };

    const getImageUrl = (slider) => {
        if (slider.isPreview) {
            return slider.image;
        }
        if (slider.image) {
            if (slider.image.startsWith('http')) {
                return slider.image;
            }
            return getImageUrl(slider.image);
        }
        return '/img/default.svg';
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-slider-add-page">
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
            <div className="admin-slider-add-page">
                <div className="page-header">
                    <div>
                        <h1>Slider Düzenle</h1>
                        <p>Slider bilgilerini güncelleyin</p>
                    </div>
                    <button 
                        className="btn btn-outline"
                        onClick={() => navigate('/admin/slider')}
                    >
                        <FiX /> İptal
                    </button>
                </div>

                <div className="slider-add-container">
                    {/* Sol Taraf - Form */}
                    <div className="form-section">
                        <form onSubmit={handleSubmit} className="slider-form">
                            <div className="form-group">
                                <label>
                                    Başlık <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    placeholder="Slider başlığını girin"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Link (İsteğe Bağlı)</label>
                                <div className="input-with-icon">
                                    <FiLink className="input-icon" />
                                    <input
                                        type="url"
                                        value={formData.link}
                                        onChange={(e) => setFormData({...formData, link: e.target.value})}
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Sıra</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Durum</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Pasif</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Resim</label>
                                <div className="image-upload-area">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        id="slider-image"
                                    />
                                    <label htmlFor="slider-image" className="upload-label">
                                        {imagePreview ? (
                                            <div className="image-preview-small">
                                                <img src={imagePreview} alt="Preview" />
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setImage(null);
                                                        setImagePreview(null);
                                                    }}
                                                >
                                                    <FiX />
                                                </button>
                                            </div>
                                        ) : existingImage ? (
                                            <div className="image-preview-small">
                                                <img src={getImageUrl(existingImage)} alt="Current" />
                                                <button
                                                    type="button"
                                                    className="remove-image"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setExistingImage(null);
                                                        setFormData({...formData, image: null});
                                                    }}
                                                >
                                                    <FiX />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="upload-placeholder">
                                                <FiUpload className="upload-icon" />
                                                <span>Resim Yükle</span>
                                                <small>PNG, JPG, GIF (Max 10MB)</small>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <FiLoader className="spinning" /> Kaydediliyor...
                                        </>
                                    ) : (
                                        <>
                                            <FiSave /> Kaydet
                                        </>
                                    )}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-outline"
                                    onClick={() => navigate('/admin/slider')}
                                >
                                    <FiX /> İptal
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sağ Taraf - Animasyonlu Önizleme */}
                    <div className="preview-section">
                        <div className="preview-header">
                            <h3>Canlı Önizleme</h3>
                            <div className="preview-controls">
                                <button
                                    type="button"
                                    className="control-btn"
                                    onClick={() => setAutoPlay(!autoPlay)}
                                    title={autoPlay ? 'Duraklat' : 'Oynat'}
                                >
                                    {autoPlay ? <FiPause /> : <FiPlay />}
                                </button>
                            </div>
                        </div>

                        <div className="slider-preview-container">
                            {previewSliders.length === 0 ? (
                                <div className="preview-empty">
                                    <FiImage className="empty-icon" />
                                    <p>Önizleme için resim yükleyin</p>
                                </div>
                            ) : (
                                <>
                                    <div 
                                        className="slider-preview-wrapper"
                                        onMouseEnter={() => setAutoPlay(false)}
                                        onMouseLeave={() => setAutoPlay(true)}
                                    >
                                        <div 
                                            className="slider-track"
                                            style={{
                                                transform: `translateX(-${currentSlide * 100}%)`,
                                            }}
                                        >
                                            {previewSliders.map((slider, index) => (
                                                <div 
                                                    key={slider.id || index} 
                                                    className="slider-slide"
                                                >
                                                    <div className="slide-image">
                                                        <img 
                                                            src={getImageUrl(slider)} 
                                                            alt={slider.title}
                                                            onError={(e) => {
                                                                e.target.src = '/img/default.svg';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="slide-overlay">
                                                        <div className="slide-content">
                                                            <h2 className="slide-title">{slider.title}</h2>
                                                            {slider.link && (
                                                                <a 
                                                                    href={slider.link} 
                                                                    className="slide-link"
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    Detayları Gör
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {slider.isPreview && (
                                                        <div className="preview-badge">
                                                            Düzenleniyor
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {previewSliders.length > 1 && (
                                            <>
                                                <button
                                                    className="slider-nav-btn prev"
                                                    onClick={goToPrevious}
                                                >
                                                    <FiChevronLeft />
                                                </button>
                                                <button
                                                    className="slider-nav-btn next"
                                                    onClick={goToNext}
                                                >
                                                    <FiChevronRight />
                                                </button>
                                            </>
                                        )}

                                        {previewSliders.length > 1 && (
                                            <div className="slider-dots">
                                                {previewSliders.map((_, index) => (
                                                    <button
                                                        key={index}
                                                        className={`dot ${currentSlide === index ? 'active' : ''}`}
                                                        onClick={() => goToSlide(index)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="preview-info">
                                        <div className="info-item">
                                            <span className="info-label">Toplam:</span>
                                            <span className="info-value">{previewSliders.length} Slider</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Aktif:</span>
                                            <span className="info-value">{currentSlide + 1}/{previewSliders.length}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminSliderEdit;

