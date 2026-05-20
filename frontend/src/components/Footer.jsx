import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion as M, useReducedMotion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/motion';
import { 
    FiHome, FiGrid, FiBook, FiMail, FiGithub, FiTwitter, 
    FiLinkedin, FiFacebook, FiInstagram, FiYoutube, 
    FiPhone, FiMapPin, FiClock
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useModules } from '../context/ModulesContext';
import api from '../api/axios';
import './Footer.css';

const Footer = () => {
    const { t } = useLanguage();
    const { modules } = useModules();
    const reduceMotion = useReducedMotion();
    const [socialSettings, setSocialSettings] = useState({
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        github: ''
    });
    const [contactSettings, setContactSettings] = useState({
        email: '',
        phone: '',
        address: '',
        workingHours: ''
    });
    const [generalSettings, setGeneralSettings] = useState({
        siteName: 'TeknoProje',
        siteDescription: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // Sosyal medya ayarları
            const socialResponse = await api.get('/public/settings/social');
            if (socialResponse.data) {
                setSocialSettings(socialResponse.data);
            }

            // İletişim ayarları
            const contactResponse = await api.get('/public/settings/contact');
            if (contactResponse.data) {
                setContactSettings(contactResponse.data);
            }

            // Genel ayarlar
            const generalResponse = await api.get('/public/settings/general');
            if (generalResponse.data) {
                setGeneralSettings({
                    siteName: generalResponse.data.siteName || generalResponse.data.site_name || 'TeknoProje',
                    siteDescription: generalResponse.data.siteDescription || generalResponse.data.site_description || ''
                });
            }
        } catch (error) {
            console.error('Footer settings load error:', error);
        }
    };

    // Sosyal medya linklerini filtrele (sadece dolu olanları)
    const socialLinks = [
        { key: 'facebook', url: socialSettings.facebook, icon: FiFacebook, label: 'Facebook' },
        { key: 'twitter', url: socialSettings.twitter, icon: FiTwitter, label: 'Twitter' },
        { key: 'instagram', url: socialSettings.instagram, icon: FiInstagram, label: 'Instagram' },
        { key: 'linkedin', url: socialSettings.linkedin, icon: FiLinkedin, label: 'LinkedIn' },
        { key: 'youtube', url: socialSettings.youtube, icon: FiYoutube, label: 'YouTube' },
        { key: 'github', url: socialSettings.github, icon: FiGithub, label: 'GitHub' }
    ].filter(link => link.url && link.url.trim() !== '');

    const gridVariants = reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : staggerContainer(0.07, 0.04);
    const itemVariants = reduceMotion
        ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
        : staggerItem;

    return (
        <M.footer
            className="main-footer"
            initial={reduceMotion ? false : { opacity: 0 }}
            whileInView={reduceMotion ? undefined : { opacity: 1 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.35 }}
        >
            <div className="footer-content container">
                <M.div
                    className="footer-grid"
                    variants={gridVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                >
                    <M.div className="footer-section" variants={itemVariants}>
                        <h3>
                            <span className="logo-icon">⚡</span>
                            {generalSettings.siteName}
                        </h3>
                        {generalSettings.siteDescription && (
                            <p>{generalSettings.siteDescription}</p>
                        )}
                        {socialLinks.length > 0 && (
                            <div className="social-links">
                                {socialLinks.map((link) => {
                                    const IconComponent = link.icon;
                                    return (
                                        <a 
                                            key={link.key}
                                            href={link.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            aria-label={link.label}
                                            className="social-link"
                                        >
                                            <IconComponent />
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </M.div>

                    <M.div className="footer-section" variants={itemVariants}>
                        <h4>{t('footer.quick_links')}</h4>
                        <ul>
                            <li>
                                <Link to="/">
                                    <FiHome /> {t('nav.home')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/projects">
                                    <FiGrid /> {t('nav.projects')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog">
                                    <FiBook /> {t('nav.blog')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact">
                                    <FiMail /> {t('nav.contact')}
                                </Link>
                            </li>
                        </ul>
                    </M.div>

                    <M.div className="footer-section" variants={itemVariants}>
                        <h4>{t('footer.support')}</h4>
                        <ul>
                            {modules.ticketsEnabled && (
                                <li><Link to="/tickets">{t('footer.support_center')}</Link></li>
                            )}
                            <li><Link to="/faq">{t('footer.faq')}</Link></li>
                            <li><Link to="/terms">{t('footer.terms')}</Link></li>
                            <li><Link to="/privacy">{t('footer.privacy')}</Link></li>
                        </ul>
                    </M.div>

                    <M.div className="footer-section" variants={itemVariants}>
                        <h4>{t('footer.contact')}</h4>
                        <ul className="contact-info-list">
                            {contactSettings.email && (
                                <li>
                                    <FiMail className="contact-icon" />
                                    <a href={`mailto:${contactSettings.email}`}>
                                        {contactSettings.email}
                                    </a>
                                </li>
                            )}
                            {contactSettings.phone && (
                                <li>
                                    <FiPhone className="contact-icon" />
                                    <a href={`tel:${contactSettings.phone.replace(/\s/g, '')}`}>
                                        {contactSettings.phone}
                                    </a>
                                </li>
                            )}
                            {contactSettings.address && (
                                <li>
                                    <FiMapPin className="contact-icon" />
                                    <span>{contactSettings.address}</span>
                                </li>
                            )}
                            {contactSettings.workingHours && (
                                <li>
                                    <FiClock className="contact-icon" />
                                    <span>{contactSettings.workingHours}</span>
                                </li>
                            )}
                            {!contactSettings.email && !contactSettings.phone && !contactSettings.address && (
                                <li className="no-contact-info">
                                    {t('footer.no_contact_info') || 'İletişim bilgileri henüz eklenmemiş.'}
                                </li>
                            )}
                        </ul>
                    </M.div>
                </M.div>

                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} {generalSettings.siteName}. {t('footer.copyright')}</p>
                </div>
            </div>
        </M.footer>
    );
};

export default Footer;
