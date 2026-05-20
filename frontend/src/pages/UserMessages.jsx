import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import { useLanguage } from '../context/LanguageContext';
import { usersAPI } from '../api/users';
import { 
    FiMessageCircle, FiSend, FiSearch, FiUser, FiX, 
    FiMenu, FiChevronLeft, FiChevronRight, FiMoreVertical,
    FiPhone, FiVideo, FiImage, FiMic, FiCheck, FiCheckCircle, FiMail, FiArrowLeft
} from 'react-icons/fi';
import './UserMessages.css';

const UserMessages = () => {
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
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        loadMessages();
        // Sayfa yüklendiğinde scroll pozisyonunu sıfırla
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        // URL'den seller_id ve project_id varsa yeni mesaj başlat
        const sellerId = searchParams.get('seller_id');
        const projectId = searchParams.get('project_id');
        const subject = searchParams.get('subject');
        
        if (sellerId && conversations.length > 0) {
            const sellerIdInt = parseInt(sellerId);
            // Mevcut konuşmayı bul
            const existingConv = conversations.find(c => c.other_user_id === sellerIdInt);
            
            if (existingConv) {
                // Mevcut konuşmayı seç
                setSelectedConversation(existingConv);
                // Okunmamış mesajları işaretle
                if (existingConv.unread_count > 0) {
                    usersAPI.markMessagesRead(existingConv.other_user_id).catch(console.error);
                }
                // Subject varsa mesaj alanına ekle
                if (subject) {
                    const decodedSubject = decodeURIComponent(subject);
                    // Eğer mesaj alanı boşsa subject'i ekle
                    if (!newMessage.trim()) {
                        setNewMessage(decodedSubject);
                    }
                }
            } else {
                // Yeni konuşma için seller bilgisini yükle ve konuşma oluştur
                loadSellerAndStartConversation(sellerIdInt, subject);
            }
        }
    }, [searchParams, conversations]);

    // Scroll sadece yeni mesaj gönderildiğinde yapılacak, sayfa yüklendiğinde değil
    const scrollToBottom = () => {
        // Sadece chat-history-body içinde scroll yap, sayfa scroll yapma
        const chatBody = messagesContainerRef.current;
        if (chatBody) {
            setTimeout(() => {
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 100);
        }
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getMessages();
            const loadedConversations = response.data.conversations || [];
            setConversations(loadedConversations);
            
            // URL parametrelerini kontrol et
            const sellerId = searchParams.get('seller_id');
            const subject = searchParams.get('subject');
            
            if (sellerId) {
                const sellerIdInt = parseInt(sellerId);
                const existingConv = loadedConversations.find(c => c.other_user_id === sellerIdInt);
                if (existingConv) {
                    setSelectedConversation(existingConv);
                    // Okunmamış mesajları işaretle
                    if (existingConv.unread_count > 0) {
                        usersAPI.markMessagesRead(existingConv.other_user_id).catch(console.error);
                    }
                    // Subject varsa mesaj alanına ekle (eğer boşsa)
                    if (subject && !newMessage.trim()) {
                        const decodedSubject = decodeURIComponent(subject);
                        if (decodedSubject.startsWith('order_detail.actions.message_subject')) {
                            const projectTitle = searchParams.get('project_title') || '';
                            setNewMessage(t('order_detail.actions.message_subject', { project: projectTitle }));
                        } else {
                            setNewMessage(decodedSubject);
                        }
                    }
                    // URL parametrelerini temizle
                    navigate('/user/messages', { replace: true });
                    // Mesaj alanına odaklan
                    setTimeout(() => {
                        const messageInput = document.querySelector('.message-input');
                        if (messageInput) {
                            messageInput.focus();
                        }
                    }, 100);
                } else {
                    // Yeni konuşma başlat
                    await loadSellerAndStartConversation(sellerIdInt, subject);
                }
            } else {
                // İlk konuşmayı seç
                if (loadedConversations.length > 0 && !selectedConversation) {
                    setSelectedConversation(loadedConversations[0]);
                }
            }
        } catch (error) {
            console.error('Messages load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSellerAndStartConversation = async (sellerId, subject) => {
        try {
            // Seller bilgisini getir
            const sellerResponse = await usersAPI.getUserById(sellerId);
            
            if (sellerResponse?.data?.user) {
                const seller = sellerResponse.data.user;
                // Yeni konuşma objesi oluştur
                const newConversation = {
                    other_user_id: sellerId,
                    other_user_name: seller.username || t('messages.user.unknown'),
                    other_user_email: seller.email || null,
                    last_message: null,
                    last_message_time: new Date().toISOString(),
                    unread_count: 0,
                    messages: []
                };
                
                setSelectedConversation(newConversation);
                // Subject varsa mesaj alanına ekle
                if (subject) {
                    const decodedSubject = decodeURIComponent(subject);
                    // Eğer çeviri anahtarı ise çevir
                    if (decodedSubject.startsWith('order_detail.actions.message_subject')) {
                        const projectTitle = searchParams.get('project_title') || '';
                        setNewMessage(t('order_detail.actions.message_subject', { project: projectTitle }));
                    } else {
                        setNewMessage(decodedSubject);
                    }
                }
                
                // URL parametrelerini temizle
                navigate('/user/messages', { replace: true });
                
                // Mesaj alanına odaklan
                setTimeout(() => {
                    const messageInput = document.querySelector('.message-input');
                    if (messageInput) {
                        messageInput.focus();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Load seller error:', error);
            // Hata durumunda da yeni konuşma objesi oluştur
            const newConversation = {
                other_user_id: sellerId,
                other_user_name: t('messages.user.unknown'),
                other_user_email: null,
                last_message: null,
                last_message_time: new Date().toISOString(),
                unread_count: 0,
                messages: []
            };
            setSelectedConversation(newConversation);
            if (subject) {
                const decodedSubject = decodeURIComponent(subject);
                if (decodedSubject.startsWith('order_detail.actions.message_subject')) {
                    const projectTitle = searchParams.get('project_title') || '';
                    setNewMessage(t('order_detail.actions.message_subject', { project: projectTitle }));
                } else {
                    setNewMessage(decodedSubject);
                }
            }
            navigate('/user/messages', { replace: true });
            
            // Mesaj alanına odaklan
            setTimeout(() => {
                const messageInput = document.querySelector('.message-input');
                if (messageInput) {
                    messageInput.focus();
                }
            }, 100);
        }
    };

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            await usersAPI.sendMessage({
                receiver_id: selectedConversation.other_user_id,
                message: newMessage,
                subject: null
            });
            setNewMessage('');
            await loadMessages();
            // Yeni mesaj gönderildiğinde scroll yap
            setTimeout(() => scrollToBottom(), 200);
            // Stats'ı yenilemek için event dispatch et
            window.dispatchEvent(new CustomEvent('messageSent'));
        } catch (error) {
            console.error('Send message error:', error);
            alert(t('messages.errors.send_failed'));
        }
    };

    const handleSelectConversation = async (conversation) => {
        setSelectedConversation(conversation);
        // Okunmamış mesajları işaretle
        if (conversation.unread_count > 0) {
            try {
                await usersAPI.markMessagesRead(conversation.other_user_id);
                loadMessages();
            } catch (error) {
                console.error('Mark read error:', error);
            }
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return t('messages.time.just_now');
        if (minutes < 60) return `${minutes} ${t('messages.time.minutes_ago')}`;
        if (hours < 24) return `${hours} ${t('messages.time.hours_ago')}`;
        if (days < 7) return `${days} ${t('messages.time.days_ago')}`;
        
        return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const formatMessageTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString(language === 'tr' ? 'tr-TR' : language === 'en' ? 'en-US' : 'de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredConversations = conversations.filter(conv => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return conv.other_user_name?.toLowerCase().includes(query) ||
               conv.last_message?.toLowerCase().includes(query);
    });

    if (loading) {
        return (
            <UserLayout>
                <div className="user-messages-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>{t('messages.loading')}</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <div className="user-messages-page">
                <div className="app-chat-container">
                    <div className="row g-0">
                        {/* Left Sidebar - User Profile */}
                        <div className={`col app-chat-sidebar-left app-sidebar ${showLeftSidebar ? 'show' : ''}`} id="app-chat-sidebar-left">
                            <div className="chat-sidebar-left-user sidebar-header">
                                <div className="avatar avatar-xl avatar-online">
                                    <FiUser />
                                </div>
                                <h5 className="mt-2 mb-0">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'User'}</h5>
                                <span>{t('messages.user.role')}</span>
                                <i className="close-sidebar" onClick={() => setShowLeftSidebar(false)}>
                                    <FiX />
                                </i>
                            </div>
                            <div className="sidebar-body">
                                <div className="my-4">
                                    <small className="text-muted text-uppercase">{t('messages.sidebar.about')}</small>
                                    <textarea 
                                        className="form-control chat-sidebar-left-user-about mt-3" 
                                        rows="4" 
                                        maxLength="120"
                                        placeholder={t('messages.sidebar.about_placeholder')}
                                    />
                                </div>
                                <div className="my-4">
                                    <small className="text-muted text-uppercase">{t('messages.sidebar.status')}</small>
                                    <div className="d-grid gap-2 mt-3">
                                        <div className="form-check form-check-success">
                                            <input name="chat-user-status" className="form-check-input" type="radio" value="active" id="user-active" defaultChecked />
                                            <label className="form-check-label" htmlFor="user-active">{t('messages.status.active')}</label>
                                        </div>
                                        <div className="form-check form-check-danger">
                                            <input name="chat-user-status" className="form-check-input" type="radio" value="busy" id="user-busy" />
                                            <label className="form-check-label" htmlFor="user-busy">{t('messages.status.busy')}</label>
                                        </div>
                                        <div className="form-check form-check-warning">
                                            <input name="chat-user-status" className="form-check-input" type="radio" value="away" id="user-away" />
                                            <label className="form-check-label" htmlFor="user-away">{t('messages.status.away')}</label>
                                        </div>
                                        <div className="form-check form-check-secondary">
                                            <input name="chat-user-status" className="form-check-input" type="radio" value="offline" id="user-offline" />
                                            <label className="form-check-label" htmlFor="user-offline">{t('messages.status.offline')}</label>
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
                                            placeholder={t('messages.search.placeholder')}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <i className="cursor-pointer d-lg-none d-block position-absolute mt-2 me-1 top-0 end-0" onClick={() => navigate('/user/dashboard')}>
                                    <FiX />
                                </i>
                            </div>
                            <hr className="container-m-nx m-0" />
                            <div className="sidebar-body ps ps--active-y">
                                <div className="chat-contact-list-item-title">
                                    <h5 className="text-primary mb-0 px-4 pt-3 pb-2">{t('messages.chats.title')}</h5>
                        </div>

                                {filteredConversations.length === 0 ? (
                                    <div className="chat-contact-list-item">
                                        <h6 className="text-muted mb-0 px-4">{t('messages.chats.no_chats')}</h6>
                                    </div>
                                ) : (
                                    <ul className="list-unstyled chat-contact-list">
                                        {filteredConversations.map((conv, index) => (
                                            <li 
                                                key={conv.other_user_id || index}
                                                className={`chat-contact-list-item ${selectedConversation?.other_user_id === conv.other_user_id ? 'active' : ''}`}
                                                onClick={() => handleSelectConversation(conv)}
                                            >
                                                <a className="d-flex align-items-center">
                                                    <div className="flex-shrink-0 avatar avatar-online">
                                                        <span className="avatar-initial rounded-circle bg-label-primary">
                                                            {conv.other_user_name?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                                    <div className="chat-contact-info flex-grow-1 ms-2">
                                                        <h6 className="chat-contact-name text-truncate m-0">
                                                            {conv.other_user_name || t('messages.user.unknown')}
                                                        </h6>
                                                        <p className="chat-contact-status text-muted text-truncate mb-0">
                                                            {conv.last_message || t('messages.chats.no_message')}
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
                                                    <button type="button" className="btn-icon-header d-lg-none d-block me-2" onClick={() => navigate('/user/dashboard')}>
                                                        <FiMenu />
                                                    </button>
                                                    <div className="flex-shrink-0 avatar" onClick={() => setShowRightSidebar(true)}>
                                                        <span className="avatar-initial rounded-circle bg-label-primary">
                                                            {selectedConversation.other_user_name?.charAt(0).toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div className="chat-contact-info flex-grow-1 ms-2">
                                                        <h6 className="m-0">{selectedConversation.other_user_name || t('messages.user.unknown')}</h6>
                                                        <small className="user-status text-muted">{t('messages.user.status.online')}</small>
                                                    </div>
                                                </div>
                                                <div className="d-flex align-items-center">
                                                    <button 
                                                        type="button" 
                                                        className="btn-icon-header btn-back-messages" 
                                                        title={t('messages.actions.back') || 'Geri'}
                                                        onClick={() => navigate('/user/dashboard')}
                                                    >
                                                        <FiArrowLeft />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="chat-history-body bg-body ps ps--active-y" ref={messagesContainerRef}>
                                            <ul className="list-unstyled chat-history">
                                                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                                                    selectedConversation.messages.map((msg) => {
                                                        const isSender = msg.is_sender;
                                                        const senderName = isSender ? (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Ben') : selectedConversation.other_user_name || t('messages.user.unknown');
                                                        const senderInitial = isSender ? (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username?.charAt(0).toUpperCase() : 'B') : selectedConversation.other_user_name?.charAt(0).toUpperCase() || 'U';
                                                        
                                                        return (
                                                            <li key={msg.id} className={`chat-message ${isSender ? 'chat-message-right' : 'chat-message-left'}`}>
                                                                <div className="chat-message-container">
                                                                    {!isSender && (
                                                                        <div className="user-avatar flex-shrink-0">
                                                                            <div className="avatar avatar-sm">
                                                                                <span className="avatar-initial rounded-circle bg-label-primary">
                                                                                    {senderInitial}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="chat-message-content">
                                                                        <div className="chat-message-text">
                                                                            <p className="mb-0">{msg.message}</p>
                                                                        </div>
                                                                        <div className="chat-message-footer">
                                                                            {isSender && (
                                                                                <FiCheckCircle className="me-1 text-success" style={{ fontSize: '0.75rem' }} />
                                                                            )}
                                                                            <small>{formatMessageTime(msg.created_at)}</small>
                                                                        </div>
                                                                        <div className="chat-message-header">
                                                                            <span className="chat-message-sender">{senderName}</span>
                                                                        </div>
                                                                    </div>
                                                                    {isSender && (
                                                                        <div className="user-avatar flex-shrink-0">
                                                                            <div className="avatar avatar-sm">
                                                                                <span className="avatar-initial rounded-circle bg-label-primary">
                                                                                    {senderInitial}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </li>
                                                        );
                                                    })
                                                ) : (
                                                    <li className="text-center text-muted py-5">
                                                        <p>{t('messages.chats.no_messages')}</p>
                                                    </li>
                                                )}
                                                <li ref={messagesEndRef}></li>
                                            </ul>
                                    </div>
                                        <div className="chat-history-footer shadow-sm">
                                            <form className="form-send-message d-flex justify-content-between align-items-center" onSubmit={handleSendMessage}>
                                        <input
                                                    className="form-control message-input border-0 me-3 shadow-none" 
                                                    placeholder={t('messages.input.placeholder')}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                                />
                                                <div className="message-actions d-flex align-items-center">
                                                    <button type="button" className="btn-icon-action" title={t('messages.actions.voice')}>
                                                        <FiMic />
                                                    </button>
                                                    <label htmlFor="attach-doc" className="form-label mb-0 btn-icon-action" title={t('messages.actions.attach')}>
                                                        <FiImage />
                                                        <input type="file" id="attach-doc" hidden />
                                                    </label>
                                                    <button type="submit" className="btn btn-primary d-flex send-msg-btn">
                                                        <FiSend className="me-md-1 me-0" />
                                                        <span className="align-middle d-md-inline-block d-none">{t('messages.input.send')}</span>
                                                    </button>
                                                </div>
                                            </form>
                                    </div>
                                </>
                            ) : (
                                    <div className="chat-history-empty">
                                    <FiMessageCircle className="empty-icon" />
                                        <h4>{t('messages.empty.title')}</h4>
                                        <p>{t('messages.empty.description')}</p>
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
                                            {selectedConversation.other_user_name?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <h6 className="mt-2 mb-0">{selectedConversation.other_user_name || t('messages.user.unknown')}</h6>
                                    <span>{t('messages.user.status.online')}</span>
                                    <i className="close-sidebar" onClick={() => setShowRightSidebar(false)}>
                                        <FiX />
                                    </i>
                                </div>
                                <div className="sidebar-body">
                                    <div className="my-4">
                                        <small className="text-muted text-uppercase">{t('messages.sidebar.about')}</small>
                                        <p className="mb-0 mt-3">
                                            {t('messages.contact.about_placeholder')}
                                        </p>
                                    </div>
                                    <div className="my-4">
                                        <small className="text-muted text-uppercase">{t('messages.contact.info')}</small>
                                        <ul className="list-unstyled d-grid gap-2 mt-3">
                                            <li className="d-flex align-items-center">
                                                <FiUser className="me-2" />
                                                <span className="align-middle">{selectedConversation.other_user_name || t('messages.user.unknown')}</span>
                                            </li>
                                            {selectedConversation.other_user_email && (
                                                <li className="d-flex align-items-center">
                                                    <FiMail className="me-2" />
                                                    <span className="align-middle">{selectedConversation.other_user_email}</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                    <div className="mt-4">
                                        <small className="text-muted text-uppercase">{t('messages.contact.options')}</small>
                                        <ul className="list-unstyled d-grid gap-2 mt-3">
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiUser className="me-2" />
                                                <span className="align-middle">{t('messages.actions.add_tag')}</span>
                                            </li>
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiUser className="me-2" />
                                                <span className="align-middle">{t('messages.actions.important')}</span>
                                            </li>
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiImage className="me-2" />
                                                <span className="align-middle">{t('messages.actions.shared_media')}</span>
                                            </li>
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiX className="me-2" />
                                                <span className="align-middle">{t('messages.actions.delete')}</span>
                                            </li>
                                            <li className="cursor-pointer d-flex align-items-center">
                                                <FiX className="me-2" />
                                                <span className="align-middle">{t('messages.actions.block')}</span>
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
        </UserLayout>
    );
};

export default UserMessages;
