import { useState, useEffect, useCallback } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getImageUrl } from '../utils/api';
import { MotionModal } from './motion';
import './ImageLightbox.css';

const ImageLightbox = ({ images, isOpen, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex || 0);

    useEffect(() => {
        setCurrentIndex(initialIndex || 0);
    }, [initialIndex, isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const goToPrevious = useCallback(() => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, [images.length]);

    const goToSlide = useCallback((index) => {
        setCurrentIndex(index);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, goToPrevious, goToNext, onClose]);

    if (!images || images.length === 0) return null;

    const idx = Math.min(Math.max(0, currentIndex), images.length - 1);
    const currentImage = images[idx];
    const imageUrl = currentImage.is_demo
        ? currentImage.image_path
        : getImageUrl(currentImage.image_path);

    return (
        <MotionModal
            isOpen={isOpen}
            onClose={onClose}
            variant="fullscreen"
            overlayClassName="image-lightbox-overlay"
            panelClassName="image-lightbox-container"
        >
                <button className="lightbox-close" onClick={onClose} aria-label="Kapat">
                    <FiX />
                </button>

                {images.length > 1 && (
                    <>
                        <button 
                            className="lightbox-nav lightbox-prev" 
                            onClick={(e) => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                            aria-label="Önceki"
                        >
                            <FiChevronLeft />
                        </button>
                        <button 
                            className="lightbox-nav lightbox-next" 
                            onClick={(e) => {
                                e.stopPropagation();
                                goToNext();
                            }}
                            aria-label="Sonraki"
                        >
                            <FiChevronRight />
                        </button>
                    </>
                )}

                <div className="lightbox-image-wrapper">
                    <img 
                        src={imageUrl}
                        alt={`Image ${currentIndex + 1}`}
                        className="lightbox-image"
                        onError={(e) => {
                            e.target.src = '/img/default.svg';
                        }}
                    />
                </div>

                {images.length > 1 && (
                    <>
                        <div className="lightbox-thumbnails">
                            {images.map((image, index) => {
                                const thumbUrl = image.is_demo 
                                    ? image.image_path 
                                    : getImageUrl(image.image_path);
                                
                                return (
                                    <div
                                        key={image.id || index}
                                        className={`lightbox-thumb ${index === currentIndex ? 'active' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToSlide(index);
                                        }}
                                    >
                                        <img 
                                            src={thumbUrl}
                                            alt={`Thumbnail ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = '/img/default.svg';
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="lightbox-counter">
                            {idx + 1} / {images.length}
                        </div>
                    </>
                )}
        </MotionModal>
    );
};

export default ImageLightbox;
