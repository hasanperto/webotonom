import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import SellerLayout from '../components/SellerLayout';
import { useLanguage } from '../context/LanguageContext';
import { sellerAPI } from '../api/seller';
import { 
    FiMessageCircle, FiSend, FiSearch, FiUser, FiX, 
    FiMenu, FiMoreVertical, FiPhone, FiVideo, FiImage, 
    FiMic, FiCheckCircle, FiMail
} from 'react-icons/fi';
import './SellerMessages.css';

const SellerMessages = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLeftSidebar, setShowLeftSidebar] = useState(false);
    const [showRightSidebar, setShowRightSidebar] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadMessages();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [selectedConversation?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getMessages();
            const loadedConversations = response.data.messages || [];
            setConversations(loadedConversations);
            
            // İlk konuşmayı seç
            if (loadedConversations.length > 0 && !selectedConversation) {
                setSelectedConversation(loadedConversations[0]);
            }
        } catch (error) {
            console.error('Messages load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            await sellerAPI.sendMessage({
                receiver_id: selectedConversation.customer_id || selectedConversation.conversation_id || selectedConversation.id,
                message: newMessage
            });
            setNewMessage('');
            loadMessages();
            // Stats'ı yenilemek için event dispatch et (eğer seller layout'da stats varsa)
            window.dispatchEvent(new CustomEvent('messageSent'));
        } catch (error) {
            console.error('Send message error:', error);
            alert(t('messages.errors.send_failed') || 'Mesaj gönderilemedi');
        }
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t('messages.time.just_now') || 'Az önce';
        if (minutes < 60) return `${minutes} ${t('messages.time.minutes_ago') || 'dakika önce'}`;
        if (hours < 24) return `${hours} ${t('messages.time.hours_ago') || 'saat önce'}`;
        if (days < 7) return `${days} ${t('messages.time.days_ago') || 'gün önce'}`;
        
        return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatMessageTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return conv.customer_name?.toLowerCase().includes(query) ||
               conv.last_message?.toLowerCase().includes(query);
    });

    if (loading) {
        return (
            <SellerLayout>
                <div className="seller-messages-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('messages.loading') || 'Yükleniyor...'}</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="seller-messages-page">
                <div className="app-chat-container">
                    <div className="row g-0">
                        {/* Left Sidebar - Seller Profile */}
                        <div className={`col app-chat-sidebar-left app-sidebar ${showLeftSidebar ? 'show' : ''}`} id="app-chat-sidebar-left">
                            <div className="chat-sidebar-left-user sidebar-header">
                                <div className="avatar avatar-xl avatar-online">
                                    <FiUser />
                                </div>
                                <h5 className="mt-2 mb-0">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Seller'}</h5>
                                <span>{t('messages.user.role') || 'Satıcı'}</span>
                                <i className="close-sidebar" onClick={() => setShowLeftSidebar(false)}>
                                    <FiX />
                                </i>
                            </div>
                            <div className="sidebar-body">
                                <div className="my-4">
                                    <small className="text-muted text-uppercase">{t('messages.sidebar.about') || 'Hakkında'}</small>
                                    <textarea 
                                        className="form-control chat-sidebar-left-user-about mt-3" 
                                        rows="4" 
                                        maxLength="120"
                                        placeholder={t('messages.sidebar.about_placeholder') || 'Hakkınızda bir şeyler yazın...'}
                                    />
                                </div>
                                <div className="my-4">
                                    <small className="text-muted text-uppercase">{t('messages.sidebar.status') || 'Durum'}</small>
                                    <div className="d-grid gap-2 mt-3">
                                        <div className="form-check form-check-success">
                                            <input name="chat-user-status" className="form-check-input" type="radio" value="active" id="seller-active" defaultChecked />
                                            <label className="form-check-label" htmlFor="seller-active">{t('messages.status.active') || 'Aktif'}</label>
                                        </div>
                                        <div className="form-check form-check-danger">
                                            <input name="chat-user-status" className="form-check-input" type="radio" value="busy" id="seller-busy" />
                                            <label className="form-check-label" htmlFor="seller-busy">{t('messages.status.busy') || 'Meşgul'}</label>
                                        </div>
                                        <div className="form-check form-check-warning">
                                            <input name="chat-user-status" className="form-check-input" type="radio" value="away" id="seller-away" />
                                            <label className="form-check-label" htmlFor="seller-away">{t('messages.status.away') || 'Uzakta'}</label>
                                        </div>
                                        <div className="form-check form-check-secondary">
                                            <input name="chat-user-status" className="form-check-input" type="radio" value="offline" id="seller-offline" />
                                            <label className="form-check-label" htmlFor="seller-offline">{t('messages.status.offline') || 'Çevrimdışı'}</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat Contacts Sidebar */}
                        <div className="col app-chat-contacts app-sidebar flex-grow-0 border-end" id="app-chat-contacts">
                            <div className="sidebar-header">
                                <div className="d-flex align-items-center me-3 me-lg-0">
                                    <div className="flex-shrink-0 avatar avatar-online me-3" onClick={() => setShowLeftSidebar(true)}>
                                        <FiUser />
                                    </div>
                                    <div className="flex-grow-1 input-group input-group-merge rounded-pill">
                                        <span className="input-group-text">
                                            <FiSearch />
                                        </span>
                                        <input 
                                            type="text" 
                                            className="form-control chat-search-input" 
                                            placeholder={t('messages.search.placeholder') || 'Ara...'}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <i className="cursor-pointer d-lg-none d-block position-absolute mt-2 me-1 top-0 end-0" onClick={() => navigate('/seller/dashboard')}>
                                    <FiX />
                                </i>
                            </div>
                            <hr className="container-m-nx m-0" />
                            <div className="sidebar-body ps ps--active-y">
                                <div className="chat-contact-list-item-title">
                                    <h5 className="text-primary mb-0 px-4 pt-3 pb-2">{t('messages.chats.title') || 'Sohbetler'}</h5>
                                </div>
                                
                                {filteredConversations.length === 0 ? (
                                    <div className="chat-contact-list-item">
                                        <h6 className="text-muted mb-0 px-4">{t('messages.chats.no_chats') || 'Sohbet bulunamadı'}</h6>
                                    </div>
                                ) : (
                                    <ul className="list-unstyled chat-contact-list">
                                        {filteredConversations.map((conv, index) => (
                                            <li 
                                                key={conv.customer_id || conv.conversation_id || conv.id || index}
                                                className={`chat-contact-list-item ${selectedConversation?.customer_id === conv.customer_id || selectedConversation?.conversation_id === conv.conversation_id || selectedConversation?.id === conv.id ? 'active' : ''}`}
                                                onClick={() => handleSelectConversation(conv)}
                                            >
                                                <a className="d-flex align-items-center">
                                                    <div className="flex-shrink-0 avatar avatar-online">
                                                        <span className="avatar-initial rounded-circle bg-label-primary">
                                                            {conv.customer_name?.charAt(0).toUpperCase() || 'M'}
                                                        </span>
                                                    </div>
                                                    <div className="chat-contact-info flex-grow-1 ms-2">
                                                        <h6 className="chat-contact-name text-truncate m-0">
                                                            {conv.customer_name || t('messages.user.unknown') || 'Müşteri'}
                                                        </h6>
                                                        <p className="chat-contact-status text-muted text-truncate mb-0">
                                                            {conv.last_message || t('messages.chats.no_message') || 'Mesaj yok'}
                                                        </p>
                                                    </div>
                                                    {conv.unread_count > 0 && (
                                                        <span className="unread-badge">{conv.unread_count}</span>
                                                    )}
                                                    <small className="text-muted mb-auto ms-2">
                                                        {conv.last_message_time ? formatTime(conv.last_message_time) : ''}
                                                    </small>
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Chat History */}
                        <div className="col app-chat-history bg-body">
                            <div className="chat-history-wrapper">
                                {selectedConversation ? (
                                    <>
                                        <div className="chat-history-header border-bottom">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex overflow-hidden align-items-center">
                                                    <button type="button" className="btn-icon-header d-lg-none d-block me-2" onClick={() => navigate('/seller/dashboard')}>
                                                        <FiMenu />
                                                    </button>
                                                    <div className="flex-shrink-0 avatar" onClick={() => setShowRightSidebar(true)}>
                                                        <span className="avatar-initial rounded-circle bg-label-primary">
                                                            {selectedConversation.customer_name?.charAt(0).toUpperCase() || 'M'}
                                                        </span>
                                                    </div>
                                                    <div className="chat-contact-info flex-grow-1 ms-2">
                                                        <h6 className="m-0">{selectedConversation.customer_name || t('messages.user.unknown') || 'Müşteri'}</h6>
                                                        <small className="user-status text-muted">{t('messages.user.status.online') || 'Çevrimiçi'}</small>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <button type="button" className="btn-icon-header d-sm-block d-none me-3" title={t('messages.actions.call') || 'Ara'}>
                                                        <FiPhone />
                                                    </button>
                                                    <button type="button" className="btn-icon-header d-sm-block d-none me-3" title={t('messages.actions.video') || 'Video Ara'}>
                                                        <FiVideo />
                                                    </button>
                                                    <button type="button" className="btn-icon-header d-sm-block d-none me-3" title={t('messages.actions.search') || 'Ara'}>
                                                        <FiSearch />
                                                    </button>
                                                    <div className="dropdown d-flex align-self-center">
                                                        <button className="btn p-0" type="button" onClick={(e) => e.stopPropagation()}>
                                                            <FiMoreVertical />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="chat-history-body bg-body ps ps--active-y">
                                            <ul className="list-unstyled chat-history">
                                                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                                                    selectedConversation.messages.map((msg) => (
                                                        <li key={msg.id} className={`chat-message ${msg.is_seller ? 'chat-message-right' : ''}`}>
                                                            <div className="d-flex overflow-hidden">
                                                                <div className={`chat-message-wrapper flex-grow-1 ${msg.is_seller ? '' : 'w-50'}`}>
                                                                    <div className="chat-message-text">
                                                                        <p className="mb-0">{msg.message}</p>
                                                                    </div>
                                                                    <div className={`text-muted mt-1 ${msg.is_seller ? 'text-end' : ''}`}>
                                                                        {msg.is_seller && (
                                                                            <FiCheckCircle className="me-1 text-success" style={{ fontSize: '0.75rem' }} />
                                                                        )}
                                                                        <small>{formatMessageTime(msg.created_at)}</small>
                                                                    </div>
                                                                </div>
                                                                {!msg.is_seller && (
                                                                    <div className="user-avatar flex-shrink-0 me-3">
                                                                        <div className="avatar avatar-sm">
                                                                            <span className="avatar-initial rounded-circle bg-label-primary">
                                                                                {selectedConversation.customer_name?.charAt(0).toUpperCase() || 'M'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {msg.is_seller && (
                                                                    <div className="user-avatar flex-shrink-0 ms-3">
                                                                        <div className="avatar avatar-sm">
                                                                            <FiUser />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-center text-muted py-5">
                                                        <p>{t('messages.chats.no_messages') || 'Henüz mesaj yok'}</p>
                                                    </li>
                                                )}
                                                <li ref={messagesEndRef}></li>
                                            </ul>
                                        </div>
                                        <div className="chat-history-footer shadow-sm">
                                            <form className="form-send-message d-flex justify-content-between align-items-center" onSubmit={handleSendMessage}>
                                                <input 
                                                    className="form-control message-input border-0 me-3 shadow-none" 
                                                    placeholder={t('messages.input.placeholder') || 'Mesajınızı buraya yazın'}
                                                    value={newMessage}
                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                />
                                                <div className="message-actions d-flex align-items-center">
                                                    <button type="button" className="btn-icon-action" title={t('messages.actions.voice') || 'Sesli Mesaj'}>
                                                        <FiMic />
                                                    </button>
                                                    <label htmlFor="attach-doc-seller" className="form-label mb-0 btn-icon-action" title={t('messages.actions.attach') || 'Dosya Ekle'}>
                                                        <FiImage />
                                                        <input type="file" id="attach-doc-seller" hidden />
                                                    </label>
                                                    <button type="submit" className="btn btn-primary d-flex send-msg-btn">
                                                        <FiSend className="me-md-1 me-0" />
                                                        <span className="align-middle d-md-inline-block d-none">{t('messages.input.send') || 'Gönder'}</span>
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </>
                                ) : (
                                    <div className="chat-history-empty">
                                        <FiMessageCircle className="empty-icon" />
                                        <h4>{t('messages.empty.title') || 'Bir konuşma seçin'}</h4>
                                        <p>{t('messages.empty.description') || 'Mesajlaşmaya başlamak için sol taraftan bir konuşma seçin.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar - Contact Info */}
                        {selectedConversation && (
                            <div className={`col app-chat-sidebar-right app-sidebar ${showRightSidebar ? 'show' : ''}`} id="app-chat-sidebar-right">
                                <div className="sidebar-header">
                                    <div className="avatar avatar-xl avatar-online">
                                        <span className="avatar-initial rounded-circle bg-label-primary">
                                            {selectedConversation.customer_name?.charAt(0).toUpperCase() || 'M'}
                                        </span>
                                    </div>
                                    <h6 className="mt-2 mb-0">{selectedConversation.customer_name || t('messages.user.unknown') || 'Müşteri'}</h6>
                                    <span>{t('messages.user.status.online') || 'Çevrimiçi'}</span>
                                    <i className="close-sidebar" onClick={() => setShowRightSidebar(false)}>
                                        <FiX />
                                    </i>
                                </div>
                                <div className="sidebar-body">
                                    <div className="my-4">
                                        <small className="text-muted text-uppercase">{t('messages.sidebar.about') || 'Hakkında'}</small>
                                        <p className="mb-0 mt-3">
                                            {t('messages.contact.about_placeholder') || 'Müşteri hakkında bilgi bulunmuyor.'}
                                        </p>
                                    </div>
                                    <div className="my-4">
                                        <small className="text-muted text-uppercase">{t('messages.contact.info') || 'Kişisel Bilgiler'}</small>
                                        <ul className="list-unstyled d-grid gap-2 mt-3">
                                            <li className="d-flex align-items-center">
                                                <FiUser className="me-2" />
                                                <span className="align-middle">{selectedConversation.customer_name || t('messages.user.unknown') || 'Müşteri'}</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="mt-4">
                                        <small className="text-muted text-uppercase">{t('messages.contact.options') || 'Seçenekler'}</small>
                                        <ul className="list-unstyled d-grid gap-2 mt-3">
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiUser className="me-2" />
                                                <span className="align-middle">{t('messages.actions.add_tag') || 'Etiket Ekle'}</span>
                                            </li>
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiUser className="me-2" />
                                                <span className="align-middle">{t('messages.actions.important') || 'Önemli Kişi'}</span>
                                            </li>
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiImage className="me-2" />
                                                <span className="align-middle">{t('messages.actions.shared_media') || 'Paylaşılan Medya'}</span>
                                            </li>
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiX className="me-2" />
                                                <span className="align-middle">{t('messages.actions.delete') || 'Kişiyi Sil'}</span>
                                            </li>
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiX className="me-2" />
                                                <span className="align-middle">{t('messages.actions.block') || 'Kişiyi Engelle'}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="app-overlay" onClick={() => { setShowLeftSidebar(false); setShowRightSidebar(false); }}></div>
                    </div>
                </div>
            </div>
        </SellerLayout>
    );
};

export default SellerMessages;
