import { useState, useEffect, useRef, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getImageUrl } from '../utils/api';
import './ProjectGallerySlider.css';

const SWIPE_PX = 45;

const ProjectGallerySlider = ({ images, projectTitle, projectId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [galleryHover, setGalleryHover] = useState(false);
    const touchStartX = useRef(null);

    // Varsayılan demo resimler
    const getDefaultImages = () => {
        return [
            {
                id: 'demo-1',
                image_path: '/img/default.svg',
                is_demo: true
            },
            {
                id: 'demo-2',
                image_path: '/img/default.svg',
                is_demo: true
            },
            {
                id: 'demo-3',
                image_path: '/img/default.svg',
                is_demo: true
            }
        ];
    };

    const displayImages = (!images || images.length === 0) ? getDefaultImages() : images;

    const goToSlide = useCallback((index) => {
        setCurrentIndex(index);
    }, []);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
    }, [displayImages.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
    }, [displayImages.length]);

    const onTouchStart = useCallback((e) => {
        if (e.changedTouches?.length) {
            touchStartX.current = e.changedTouches[0].clientX;
        }
    }, []);

    const onTouchEnd = useCallback((e) => {
        if (touchStartX.current == null || !e.changedTouches?.length || displayImages.length < 2) {
            touchStartX.current = null;
            return;
        }
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (dx > SWIPE_PX) {
            goToPrevious();
        } else if (dx < -SWIPE_PX) {
            goToNext();
        }
    }, [displayImages.length, goToPrevious, goToNext]);

    useEffect(() => {
        if (!galleryHover || displayImages.length < 2) {
            return undefined;
        }
        const onKey = (e) => {
            if (e.target.closest('input, textarea, select, [contenteditable="true"]')) {
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToNext();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [galleryHover, displayImages.length, goToPrevious, goToNext]);

    // Lightbox2'yi başlat - React component mount olduğunda
    useEffect(() => {
        if (typeof window !== 'undefined' && window.$ && window.$.fn && window.$.fn.lightbox) {
            // Lightbox2 zaten init edilmiş olmalı, sadece yeni linkleri aktif hale getir
            // Lightbox2 otomatik olarak data-lightbox attribute'lu linkleri dinler
        }
    }, [displayImages, projectId]);

    return (
        <div className="project-gallery-wrapper">
            {/* Ana Görsel Slider */}
            <div
                className="swiper-project-gallery"
                tabIndex={0}
                onMouseEnter={() => setGalleryHover(true)}
                onMouseLeave={() => setGalleryHover(false)}
                onFocus={() => setGalleryHover(true)}
                onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                        setGalleryHover(false);
                    }
                }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div className="swiper-wrapper">
                    {displayImages.map((image, index) => {
                        let imageUrl;
                        if (image.is_demo) {
                            imageUrl = image.image_path;
                        } else if (image.image_path) {
                            imageUrl = getImageUrl(image.image_path);
                        } else {
                            imageUrl = '/img/default.svg';
                        }
                        
                        return (
                            <div 
                                key={image.id || index}
                                className={`swiper-slide ${index === currentIndex ? 'active' : ''}`}
                            >
                                <div className="image-container">
                                    <a 
                                        href={imageUrl}
                                        data-lightbox={`project-${projectId}`}
                                        data-title={`${projectTitle} - ${index + 1}`}
                                    >
                                        <img 
                                            src={imageUrl}
                                            alt={`${projectTitle} - ${index + 1}`}
                                            className="img-fluid rounded project-image"
                                            onError={(e) => {
                                                // Resim bulunamazsa SVG'yi göster
                                                e.target.src = '/img/default.svg';
                                                // Parent link'in href'ini de güncelle
                                                const parentLink = e.target.closest('a');
                                                if (parentLink) {
                                                    parentLink.href = '/img/default.svg';
                                                }
                                            }}
                                        />
                                    </a>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {displayImages.length > 1 && (
                    <>
                        <button 
                            className="swiper-button-prev"
                            onClick={goToPrevious}
                            aria-label="Önceki"
                        >
                            <FiChevronLeft />
                        </button>
                        <button 
                            className="swiper-button-next"
                            onClick={goToNext}
                            aria-label="Sonraki"
                        >
                            <FiChevronRight />
                        </button>
                    </>
                )}
            </div>

            {/* Thumbnail Slider */}
            {displayImages.length > 1 && (
                <div className="swiper-project-thumbs">
                    <div className="swiper-wrapper">
                        {displayImages.map((image, index) => {
                            let imageUrl;
                            if (image.is_demo) {
                                imageUrl = image.image_path;
                            } else if (image.image_path) {
                                if (image.image_path.startsWith('http')) {
                                    imageUrl = image.image_path;
                                } else {
                                    imageUrl = getImageUrl(image.image_path);
                                }
                            } else {
                                imageUrl = '/img/default.svg';
                            }
                            
                            return (
                                <div 
                                    key={image.id || index}
                                    className={`swiper-slide ${index === currentIndex ? 'active' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <a 
                                        href={imageUrl}
                                        data-lightbox={`project-${projectId}`}
                                        data-title={`${projectTitle} - ${index + 1}`}
                                        onClick={(e) => {
                                            // Lightbox açılsın, sonra slider'ı güncelle
                                            setTimeout(() => {
                                                goToSlide(index);
                                            }, 100);
                                        }}
                                    >
                                        <img 
                                            src={imageUrl}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="img-fluid rounded"
                                            onError={(e) => {
                                                // Resim bulunamazsa SVG'yi göster
                                                e.target.src = '/img/default.svg';
                                                // Parent link'in href'ini de güncelle
                                                const parentLink = e.target.closest('a');
                                                if (parentLink) {
                                                    parentLink.href = '/img/default.svg';
                                                }
                                            }}
                                        />
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectGallerySlider;
