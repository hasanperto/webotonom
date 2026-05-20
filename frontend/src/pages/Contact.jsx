import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion as M, useReducedMotion } from 'framer-motion';
import { leadsAPI } from '../api/leads';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';
import {
    FiMail, FiPhone, FiMapPin, FiClock, FiSend,
    FiMessageSquare, FiUser, FiCheckCircle, FiExternalLink,
} from 'react-icons/fi';
import { RevealOnScroll } from '../components/motion';
import { motionEase, staggerContainer, staggerItem } from '../utils/motion';
import './Contact.css';

const Contact = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        interest_areas: [],
        project_interest: '',
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [contactSettings, setContactSettings] = useState({
        email: '',
        phone: '',
        address: '',
        workingHours: '',
        mapEmbed: '',
    });
    const [loadingSettings, setLoadingSettings] = useState(true);
    const reduceMotion = useReducedMotion();

    const mapsSearchUrl = useMemo(() => {
        if (!contactSettings.address?.trim()) return '';
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactSettings.address.trim())}`;
    }, [contactSettings.address]);

    useEffect(() => {
        loadContactSettings();
    }, []);

    const loadContactSettings = async () => {
        try {
            const response = await api.get('/public/settings/contact');
            if (response.data) {
                setContactSettings(response.data);
            }
        } catch (error) {
            console.error('Contact settings load error:', error);
        } finally {
            setLoadingSettings(false);
        }
    };

    const interestOptions = [
        { key: 'web_development', label: t('contact.interest.web_development'), icon: '🌐' },
        { key: 'mobile_app', label: t('contact.interest.mobile_app'), icon: '📱' },
        { key: 'ai_ml', label: t('contact.interest.ai_ml'), icon: '🤖' },
        { key: 'ecommerce', label: t('contact.interest.ecommerce'), icon: '🛒' },
        { key: 'consulting', label: t('contact.interest.consulting'), icon: '💼' },
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleInterestChange = (area) => {
        setFormData({
            ...formData,
            interest_areas: formData.interest_areas.includes(area)
                ? formData.interest_areas.filter((a) => a !== area)
                : [...formData.interest_areas, area],
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await leadsAPI.submit(formData);
            setSubmitted(true);
            setFormData({
                name: '',
                email: '',
                phone: '',
                message: '',
                interest_areas: [],
                project_interest: '',
            });
        } catch (error) {
            alert(error.response?.data?.error || t('contact.send_failed'));
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="contact-page-modern">
                <div className="container">
                    <AnimatePresence mode="wait">
                        <M.div
                            key="success"
                            className="success-message-modern"
                            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3, ease: motionEase }}
                        >
                            <M.div
                                className="success-icon"
                                initial={reduceMotion ? false : { scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            >
                                <FiCheckCircle />
                            </M.div>
                            <h2>{t('contact.message_received')}</h2>
                            <p>{t('contact.will_respond_soon')}</p>
                            <button type="button" onClick={() => setSubmitted(false)} className="btn btn-primary btn-large">
                                {t('contact.send_new_message')}
                            </button>
                        </M.div>
                    </AnimatePresence>
                </div>
            </div>
        );
    }

    return (
        <div className="contact-page-modern">
            <div className="contact-hero">
                <M.div
                    className="contact-hero-orb contact-hero-orb--1"
                    aria-hidden
                    animate={reduceMotion ? {} : { y: [0, -12, 0], opacity: [0.35, 0.55, 0.35] }}
                    transition={reduceMotion ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <M.div
                    className="contact-hero-orb contact-hero-orb--2"
                    aria-hidden
                    animate={reduceMotion ? {} : { y: [0, 14, 0] }}
                    transition={reduceMotion ? {} : { duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="container">
                    <RevealOnScroll>
                        <h1 className="contact-title">{t('contact.title')}</h1>
                        <p className="contact-subtitle-modern">{t('contact.subtitle')}</p>
                    </RevealOnScroll>
                </div>
            </div>

            <div className="container">
                <div className="contact-content">
                    <M.div
                        className="contact-info-cards"
                        variants={staggerContainer(0.06, 0.05)}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: '-30px' }}
                    >
                        {contactSettings.email && (
                            <M.div variants={staggerItem} className="info-card-modern">
                                <div className="info-card-icon email">
                                    <FiMail />
                                </div>
                                <h3>{t('contact.email')}</h3>
                                <a href={`mailto:${contactSettings.email}`} className="info-link">
                                    {contactSettings.email}
                                </a>
                            </M.div>
                        )}

                        {contactSettings.phone && (
                            <M.div variants={staggerItem} className="info-card-modern">
                                <div className="info-card-icon phone">
                                    <FiPhone />
                                </div>
                                <h3>{t('contact.phone')}</h3>
                                <a href={`tel:${contactSettings.phone.replace(/\s/g, '')}`} className="info-link">
                                    {contactSettings.phone}
                                </a>
                            </M.div>
                        )}

                        {contactSettings.address && (
                            <M.div variants={staggerItem} className="info-card-modern">
                                <div className="info-card-icon address">
                                    <FiMapPin />
                                </div>
                                <h3>{t('contact.address')}</h3>
                                <p className="info-text">{contactSettings.address}</p>
                                {mapsSearchUrl && (
                                    <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="contact-maps-link">
                                        <FiExternalLink /> {t('contact.open_in_maps', 'Haritada aç')}
                                    </a>
                                )}
                            </M.div>
                        )}

                        {contactSettings.workingHours && (
                            <M.div variants={staggerItem} className="info-card-modern">
                                <div className="info-card-icon hours">
                                    <FiClock />
                                </div>
                                <h3>{t('contact.working_hours')}</h3>
                                <p className="info-text">{contactSettings.workingHours}</p>
                            </M.div>
                        )}
                    </M.div>

                    <div className="contact-main-grid contact-two-column">
                        <M.div
                            className="contact-form-modern"
                            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.35, ease: motionEase }}
                        >
                            <div className="form-header">
                                <FiMessageSquare className="form-icon" />
                                <h2>{t('contact.contact_us')}</h2>
                                <p>{t('contact.form_description')}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="modern-form">
                                <div className="form-row">
                                    <div className="form-group-modern">
                                        <label htmlFor="contact-name">
                                            <FiUser /> {t('contact.full_name')} *
                                        </label>
                                        <input
                                            id="contact-name"
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder={t('contact.name_placeholder')}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group-modern">
                                        <label htmlFor="contact-email">
                                            <FiMail /> {t('contact.email')} *
                                        </label>
                                        <input
                                            id="contact-email"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder={t('contact.email_placeholder')}
                                        />
                                    </div>
                                    <div className="form-group-modern">
                                        <label htmlFor="contact-phone">
                                            <FiPhone /> {t('contact.phone')}
                                        </label>
                                        <input
                                            id="contact-phone"
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder={t('contact.phone_placeholder')}
                                        />
                                    </div>
                                </div>

                                <div className="form-group-modern">
                                    <span className="form-label-static">{t('contact.interest_areas')}</span>
                                    <div className="interest-grid-modern">
                                        {interestOptions.map((option) => (
                                            <label key={option.key} className="interest-card">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.interest_areas.includes(option.key)}
                                                    onChange={() => handleInterestChange(option.key)}
                                                />
                                                <div className="interest-content">
                                                    <span className="interest-icon">{option.icon}</span>
                                                    <span className="interest-label">{option.label}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group-modern">
                                    <label htmlFor="contact-project">{t('contact.project_interest')}</label>
                                    <input
                                        id="contact-project"
                                        type="text"
                                        name="project_interest"
                                        value={formData.project_interest}
                                        onChange={handleChange}
                                        placeholder={t('contact.project_interest_placeholder')}
                                    />
                                </div>

                                <div className="form-group-modern">
                                    <label htmlFor="contact-message">
                                        <FiMessageSquare /> {t('contact.message')} *
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        placeholder={t('contact.message_placeholder')}
                                    />
                                </div>

                                <button type="submit" className="btn-submit-modern" disabled={loading}>
                                    {loading ? (
                                        <>
                                            <span className="spinner-small"></span>
                                            {t('contact.sending')}
                                        </>
                                    ) : (
                                        <>
                                            <FiSend /> {t('contact.send')}
                                        </>
                                    )}
                                </button>
                            </form>
                        </M.div>

                        <M.div
                            className="contact-aside-column"
                            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.35, ease: motionEase }}
                        >
                            {(contactSettings.mapEmbed || mapsSearchUrl) && (
                                <div className="contact-map-modern">
                                    <div className="map-header">
                                        <FiMapPin className="map-icon map-pin-deco" />
                                        <h2>{t('contact.our_location')}</h2>
                                    </div>
                                    {contactSettings.mapEmbed ? (
                                        <div className="map-container">
                                            <div
                                                className="map-embed"
                                                dangerouslySetInnerHTML={{ __html: contactSettings.mapEmbed }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="contact-map-fallback">
                                            <FiMapPin className="contact-map-fallback-icon" aria-hidden />
                                            <p>{contactSettings.address}</p>
                                        </div>
                                    )}
                                    {mapsSearchUrl && (
                                        <a
                                            href={mapsSearchUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="contact-map-cta"
                                        >
                                            <FiExternalLink /> {t('contact.open_in_maps', 'Google Haritalar’da aç')}
                                        </a>
                                    )}
                                </div>
                            )}
                            {!loadingSettings && !contactSettings.mapEmbed && !mapsSearchUrl && (
                                <div className="contact-map-placeholder">
                                    <FiMapPin />
                                    <p>{t('contact.map_placeholder', 'Harita ve adres bilgisi yönetim panelinden eklenebilir.')}</p>
                                </div>
                            )}
                        </M.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
