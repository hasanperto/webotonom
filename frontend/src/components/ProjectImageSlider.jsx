import { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { getImageUrl } from '../utils/api';
import './ProjectImageSlider.css';

const ProjectImageSlider = ({ images, projectTitle, autoSlide = true, slideInterval = 4000 }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const intervalRef = useRef(null);

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
            }
        ];
    };

    // Görseller yoksa demo resimler göster
    const displayImages = (!images || images.length === 0) ? getDefaultImages() : images;

    // Otomatik slider (kancalar erken dönüşten önce — rules-of-hooks)
    useEffect(() => {
        if (displayImages.length <= 1) {
            return undefined;
        }
        if (autoSlide && !isHovered) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) =>
                    prevIndex === displayImages.length - 1 ? 0 : prevIndex + 1
                );
            }, slideInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoSlide, isHovered, displayImages.length, slideInterval]);

    // Tek görsel varsa
    if (displayImages.length === 1) {
        const image = displayImages[0];
        let imageUrl;
        if (image.is_demo) {
            imageUrl = image.image_path;
        } else if (image.image_path) {
            imageUrl = getImageUrl(image.image_path);
        } else {
            imageUrl = '/img/default.svg';
        }

        return (
            <div className="project-image-single">
                <img
                    src={imageUrl}
                    alt={projectTitle}
                    className="project-image"
                    onError={(e) => {
                        console.error('Image load error:', imageUrl);
                        e.target.src = '/img/default.svg';
                    }}
                />
            </div>
        );
    }

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prevIndex) => 
            prevIndex === displayImages.length - 1 ? 0 : prevIndex + 1
        );
    };

    return (
        <div 
            className="project-image-slider"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div 
                className="slider-container"
                style={{
                    transform: `translateX(-${currentIndex * 100}%)`,
                }}
            >
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
                            className="slide"
                        >
                            <img 
                                src={imageUrl}
                                alt={`${projectTitle} - ${index + 1}`}
                                className="project-image"
                                onError={(e) => {
                                    console.error('Image load error:', imageUrl, 'for image:', image);
                                    e.target.src = '/img/default.svg';
                                }}
                                onLoad={() => {
                                    console.log('Image loaded successfully:', imageUrl);
                                }}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Navigation Buttons */}
            {displayImages.length > 1 && (
                <>
                    <button 
                        className="slider-btn slider-btn-prev"
                        onClick={goToPrevious}
                        aria-label="Önceki görsel"
                    >
                        <FiChevronLeft />
                    </button>
                    <button 
                        className="slider-btn slider-btn-next"
                        onClick={goToNext}
                        aria-label="Sonraki görsel"
                    >
                        <FiChevronRight />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {displayImages.length > 1 && (
                <div className="slider-dots">
                    {displayImages.map((_, index) => (
                        <button
                            key={index}
                            className={`dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Görsel ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectImageSlider;

