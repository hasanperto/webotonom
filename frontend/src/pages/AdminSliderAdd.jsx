import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { getImageUrl } from '../utils/api';
import { 
    FiX, FiUpload, FiImage, FiSave, FiLoader, FiPlus,
    FiChevronLeft, FiChevronRight, FiPlay, FiPause, FiLink
} from 'react-icons/fi';
import './AdminSliderAdd.css';

const AdminSliderAdd = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [autoPlay, setAutoPlay] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const intervalRef = useRef(null);
    
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        order: 0,
        status: 'active'
    });

    // Animasyonlu slider önizleme için demo sliderlar
    const [previewSliders, setPreviewSliders] = useState([]);
    const [existingSliders, setExistingSliders] = useState([]);

    useEffect(() => {
        // Mevcut sliderları yükle (önizleme için)
        loadExistingSliders();
    }, []);

    useEffect(() => {
        // Önizleme sliderlarını güncelle
        const newSliders = [...existingSliders];
        
        // Eğer yeni resim yüklendiyse, önizleme sliderlarının başına ekle
        if (imagePreview) {
            const newSlider = {
                id: 'preview-new',
                title: formData.title || 'Yeni Slider',
                image: imagePreview,
                link: formData.link || '',
                order: 0,
                status: 'active',
                isPreview: true
            };
            newSliders.unshift(newSlider);
        }
        
        setPreviewSliders(newSliders);
    }, [imagePreview, formData.title, formData.link, existingSliders]);

    useEffect(() => {
        // Otomatik oynatma
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

    const loadExistingSliders = async () => {
        try {
            const response = await api.get('/admin/sliders');
            const sliders = response.data.sliders || [];
            // Sadece aktif olanları al ve önizleme için hazırla
            const activeSliders = sliders
                .filter(s => s.status === 'active')
                .slice(0, 4); // En fazla 4 tane göster
            setExistingSliders(activeSliders);
        } catch (error) {
            console.error('Load sliders error:', error);
        }
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
        
        if (!formData.title || !image) {
            alert('Lütfen başlık ve resim girin');
            return;
        }

        try {
            setLoading(true);
            
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('link', formData.link || '');
            submitData.append('order', formData.order || 0);
            submitData.append('status', formData.status);
            submitData.append('image', image);

            await api.post('/admin/sliders', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert('Slider başarıyla eklendi!');
            navigate('/admin/slider');
        } catch (error) {
            console.error('Create slider error:', error);
            alert(error.response?.data?.error || 'Slider eklenirken hata oluştu');
        } finally {
            setLoading(false);
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

    return (
        <AdminLayout>
            <div className="admin-slider-add-page">
                <div className="page-header">
                    <div>
                        <h1>Yeni Slider Ekle</h1>
                        <p>Animasyonlu slider oluşturun</p>
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
                                <label>
                                    Resim <span className="required">*</span>
                                </label>
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
                                    disabled={loading}
                                >
                                    {loading ? (
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
                                    <p>Henüz slider yok</p>
                                    <small>Resim yükleyerek önizlemeyi görün</small>
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
                                                            Yeni
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Navigation Buttons */}
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

                                        {/* Dots Indicator */}
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

                                    {/* Slider Info */}
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

export default AdminSliderAdd;

