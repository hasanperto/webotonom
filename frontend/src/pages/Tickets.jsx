import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketsAPI } from '../api/tickets';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useModules } from '../context/ModulesContext';
import SellerLayout from '../components/SellerLayout';
import UserLayout from '../components/UserLayout';
import { FiPlus, FiSearch, FiFilter, FiX, FiSend, FiClock, FiCheckCircle, FiAlertCircle, FiMessageCircle, FiTag, FiUser, FiMail, FiFileText, FiChevronDown, FiChevronUp, FiEdit, FiTrash2, FiEye, FiHelpCircle, FiZap, FiTrendingUp, FiRefreshCw, FiXCircle, FiCircle } from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import './Tickets.css';

const Tickets = () => {
    const { isAuthenticated, user, isAdmin, isSeller } = useAuth();
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const { modules } = useModules();
    const [tickets, setTickets] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [purchasedProjects, setPurchasedProjects] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [showFAQ, setShowFAQ] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        subject: '',
        message: '',
        category: 'general',
        priority: 'medium',
        department_id: '',
        project_id: ''
    });
    const [replyMessage, setReplyMessage] = useState('');
    const [expandedRows, setExpandedRows] = useState(new Set());
    
    // Tiptap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
        ],
        content: replyMessage,
        onUpdate: ({ editor }) => {
            setReplyMessage(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor',
                'data-placeholder': t('tickets.detail.reply_placeholder'),
            },
        },
    });
    
    // Editor içeriğini senkronize et
    useEffect(() => {
        if (editor && replyMessage === '') {
            editor.commands.setContent('');
        }
    }, [replyMessage, editor]);

    useEffect(() => {
        if (isAuthenticated) {
            loadDepartments();
            loadPurchasedProjects();
            loadTickets();
            loadFAQ();
        }
    }, [isAuthenticated, filterStatus, filterDepartment, language]);

    const loadDepartments = async () => {
        try {
            const response = await ticketsAPI.getDepartments();
            setDepartments(response.data.departments || []);
        } catch (error) {
            console.error('Departments load error:', error);
        }
    };

    const loadPurchasedProjects = async () => {
        try {
            const response = await ticketsAPI.getPurchasedProjects({ lang: language });
            setPurchasedProjects(response.data.projects || []);
        } catch (error) {
            console.error('Purchased projects load error:', error);
        }
    };

    const loadTickets = async () => {
        // Token kontrolü
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('Token bulunamadı, ticket listesi yüklenemiyor');
            setTickets([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterDepartment) params.department_id = filterDepartment;
            
            const response = await ticketsAPI.getMyTickets(params);
            let ticketsData = response.data.tickets || [];
            
            console.log('Loaded tickets:', ticketsData.length);
            
            // Arama filtresi
            if (searchQuery) {
                ticketsData = ticketsData.filter(ticket => {
                    const subject = (ticket.subject || '').toLowerCase();
                    const message = (ticket.message || '').toLowerCase();
                    const ticketNumber = (ticket.ticket_number || '').toLowerCase();
                    const query = searchQuery.toLowerCase();
                    return subject.includes(query) || message.includes(query) || ticketNumber.includes(query);
                });
            }
            
            setTickets(ticketsData);
        } catch (error) {
            console.error('Tickets load error:', error);
            console.error('Error details:', error.response?.data);
            
            // 401 hatası - Token geçersiz
            if (error.response?.status === 401) {
                alert(t('tickets.errors.session_expired'));
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }
            
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const loadFAQ = async () => {
        try {
            const response = await ticketsAPI.getFAQ();
            setFaqs(response.data.faqs || []);
        } catch (error) {
            console.error('FAQ load error:', error);
        }
    };

    const loadTicketDetail = async (id) => {
        // Token kontrolü
        const token = localStorage.getItem('token');
        if (!token) {
            alert(t('tickets.errors.session_expired'));
            window.location.href = '/login';
            return;
        }

        try {
            setLoading(true);
            const response = await ticketsAPI.getTicket(id);
            
            if (response.data && response.data.ticket) {
                const ticketData = response.data.ticket;
                let repliesData = response.data.replies || [];
                
                // Replies array'ini garanti et
                if (!Array.isArray(repliesData)) {
                    repliesData = [];
                }
                
                // Ticket objesine replies ekle
                ticketData.replies = [...repliesData];
                
                // Ticket'ın ilk mesajını (message alanı) da replies'e ekle (eğer varsa)
                if (ticketData.message && ticketData.message.trim()) {
                    // İlk mesaj zaten replies'te var mı kontrol et
                    const hasInitialMessage = ticketData.replies.some(reply => 
                        reply.id === 'initial' ||
                        (reply.message === ticketData.message && reply.user_id === ticketData.user_id && !reply.is_admin)
                    );
                    
                    if (!hasInitialMessage) {
                        // İlk mesajı replies'in başına ekle
                        ticketData.replies.unshift({
                            id: 'initial',
                            ticket_id: ticketData.id,
                            user_id: ticketData.user_id,
                            message: ticketData.message,
                            is_admin: 0,
                            created_at: ticketData.created_at,
                            username: ticketData.creator_username,
                            user_role: ticketData.creator_role || 'user' // Ticket oluşturan kullanıcının rolü
                        });
                    }
                }
                
                // Tüm mesajları tarihe göre sırala
                ticketData.replies.sort((a, b) => {
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    return dateA - dateB;
                });
                
                setSelectedTicket({ ticket: ticketData, replies: ticketData.replies });
                setShowForm(false);
                // Sayfayı yukarı kaydır
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error('Ticket verisi bulunamadı');
            }
        } catch (error) {
            console.error('Ticket detail error:', error);
            
            // 401 hatası - Token geçersiz
            if (error.response?.status === 401) {
                alert(t('tickets.errors.session_expired'));
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }
            
            const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || t('tickets.errors.load_failed');
            alert(`${t('tickets.errors.error')}: ${errorMessage}`);
            // Hata durumunda listeye geri dön
            setSelectedTicket(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.department_id) {
            alert(t('tickets.form.department_required'));
            return;
        }
        
        try {
            await ticketsAPI.create(formData);
            alert(t('tickets.form.create_success'));
            setShowForm(false);
            setFormData({ subject: '', message: '', category: 'general', priority: 'medium', department_id: '', project_id: '' });
            loadTickets();
        } catch (error) {
            alert(error.response?.data?.error || t('tickets.form.create_failed'));
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        
        // HTML'den sadece metni çıkar (boş HTML kontrolü için)
        const textContent = replyMessage.replace(/<[^>]*>/g, '').trim();
        
        if (!textContent) {
            alert(t('tickets.detail.message_required'));
            return;
        }

        // Token kontrolü
        const token = localStorage.getItem('token');
        if (!token) {
            alert(t('tickets.errors.session_expired'));
            window.location.href = '/login';
            return;
        }

        try {
            await ticketsAPI.reply(selectedTicket.ticket.id, { message: replyMessage });
            setReplyMessage('');
            if (editor) {
                editor.commands.setContent('');
            }
            
            // Başarı mesajı
            const successMsg = document.createElement('div');
            successMsg.className = 'success-toast';
            successMsg.textContent = `✓ ${t('tickets.detail.reply_success')}`;
            document.body.appendChild(successMsg);
            setTimeout(() => {
                successMsg.classList.add('show');
            }, 10);
            setTimeout(() => {
                successMsg.classList.remove('show');
                setTimeout(() => document.body.removeChild(successMsg), 300);
            }, 3000);
            
            // Ticket detayını yeniden yükle
            await loadTicketDetail(selectedTicket.ticket.id);
            // Ticket listesini de güncelle
            loadTickets();
        } catch (error) {
            console.error('Reply error:', error);
            
            // 401 hatası - Token geçersiz
            if (error.response?.status === 401) {
                alert(t('tickets.errors.session_expired'));
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return;
            }
            
            alert(error.response?.data?.error || t('tickets.detail.reply_failed'));
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'open':
                return <FiCircle />;
            case 'in_progress':
                return <FiClock />;
            case 'resolved':
                return <FiCheckCircle />;
            case 'closed':
                return <FiXCircle />;
            default:
                return <FiHelpCircle />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return '#696cff';
            case 'in_progress': return '#03c3ec';
            case 'waiting': return '#f59e0b';
            case 'resolved': return '#10b981';
            case 'closed': return '#6b7280';
            default: return '#6b7280';
        }
    };

    const getStatusLabel = (status) => {
        if (!status) return '-';
        
        const statusKey = `tickets.status.${status}`;
        const translated = t(statusKey);
        
        // Eğer çeviri anahtarı dönerse (çeviri bulunamadıysa), fallback kullan
        if (translated === statusKey || !translated || translated.startsWith('tickets.status.')) {
            const fallback = {
                'open': language === 'tr' ? 'Açık' : language === 'de' ? 'Offen' : 'Open',
                'in_progress': language === 'tr' ? 'İşlemde' : language === 'de' ? 'In Bearbeitung' : 'In Progress',
                'waiting': language === 'tr' ? 'Beklemede' : language === 'de' ? 'Wartend' : 'Waiting',
                'resolved': language === 'tr' ? 'Çözüldü' : language === 'de' ? 'Gelöst' : 'Resolved',
                'closed': language === 'tr' ? 'Kapatıldı' : language === 'de' ? 'Geschlossen' : 'Closed'
            };
            return fallback[status] || status;
        }
        return translated;
    };
    
    const toggleRowExpansion = (ticketId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(ticketId)) {
            newExpanded.delete(ticketId);
        } else {
            newExpanded.add(ticketId);
        }
        setExpandedRows(newExpanded);
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'low': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'high': return '#ef4444';
            case 'urgent': return '#dc2626';
            default: return '#6b7280';
        }
    };

    const getPriorityLabel = (priority) => {
        return t(`tickets.priority.${priority}`) || priority;
    };

    const handleDepartmentSelect = (deptId) => {
        setSelectedDepartment(deptId);
        setFormData({ ...formData, department_id: deptId });
    };

    // Layout seçimi - rol bazlı
    const getLayout = (content) => {
        if (isSeller || isAdmin) {
            return <SellerLayout>{content}</SellerLayout>;
        } else {
            return <UserLayout>{content}</UserLayout>;
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="tickets-page">
                <div className="container">
                    <div className="auth-required-message">
                        <FiMessageCircle className="auth-icon" />
                        <h2>{t('tickets.auth.required')}</h2>
                        <p>{t('tickets.auth.message')}</p>
                        <Link to="/login" className="btn btn-primary">
                            {t('tickets.auth.login')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // İlk yükleme sırasında loading göster
    if (loading && tickets.length === 0 && !selectedTicket && !showForm) {
        return getLayout(
            <div className="tickets-page">
                <div className="dashboard-content-wrapper">
                    <div className="container">
                        <div className="loading-fullscreen">
                            <div className="spinner-large"></div>
                            <p>{t('tickets.loading')}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Debug: State kontrolü
    console.log('Render - showForm:', showForm, 'selectedTicket:', selectedTicket ? 'SET' : 'NULL', 'tickets.length:', tickets.length);

    const pageContent = (
        <div className="tickets-page">
            <div className="dashboard-content-wrapper">
                <div className="container">
                <div className="tickets-header-modern">
                    <div className="header-content">
                        <div className="header-badge">
                            <FiZap /> {t('tickets.header.title')}
                        </div>
                        <div className="header-stats">
                            <div className="stat-item">
                                <FiMessageCircle />
                                <span>{tickets.length} {t('tickets.header.active_tickets')}</span>
                            </div>
                            <div className="stat-item">
                                <FiTrendingUp />
                                <span>{departments.length} {t('tickets.header.departments')}</span>
                            </div>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button 
                            onClick={() => {
                                setShowForm(!showForm);
                                setSelectedTicket(null);
                                if (!showForm) {
                                    setSelectedDepartment(null);
                                    setFormData({ subject: '', message: '', category: 'general', priority: 'medium', department_id: '', project_id: '' });
                                }
                            }}
                            className="btn btn-primary btn-large btn-create-ticket"
                        >
                            <FiPlus /> {showForm ? t('tickets.form.cancel') : t('tickets.form.create_new')}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <div className="ticket-form-modern">
                        <h2>{t('tickets.form.new_request')}</h2>
                        
                        {/* Departman Seçimi */}
                        <div className="form-group-modern">
                            <label>
                                <FiTag /> {t('tickets.form.select_department')} <span className="required">*</span>
                            </label>
                            <select
                                value={formData.department_id || ''}
                                onChange={(e) => {
                                    const deptId = e.target.value ? parseInt(e.target.value) : '';
                                    handleDepartmentSelect(deptId);
                                }}
                                required
                                className="department-select"
                            >
                                <option value="">{t('tickets.form.select_department')}</option>
                                {departments.map(dept => {
                                    // Icon'u emoji'ye çevir (React icon component adları için)
                                    let iconDisplay = dept.icon || '💬';
                                    
                                    // Eğer React icon component adı ise (Fi ile başlıyorsa), emoji'ye çevir
                                    if (typeof iconDisplay === 'string' && iconDisplay.startsWith('Fi')) {
                                        const iconMap = {
                                            'FiHelpCircle': '💬',
                                            'FiSettings': '🔧',
                                            'FiUser': '👤',
                                            'FiCreditCard': '💳',
                                            'FiCrown': '👑',
                                            'FiZap': '⚡',
                                            'FiTrendingUp': '📈',
                                            'FiMail': '📧',
                                            'FiTag': '🏷️'
                                        };
                                        iconDisplay = iconMap[iconDisplay] || '💬';
                                    }
                                    
                                    // Eğer icon boş veya geçersiz ise, varsayılan emoji kullan
                                    if (!iconDisplay || iconDisplay.trim() === '') {
                                        iconDisplay = '💬';
                                    }
                                    
                                    // Icon'u temizle (sadece emoji karakterlerini bırak)
                                    iconDisplay = iconDisplay.replace(/[^\p{Emoji}]/gu, '').trim() || '💬';
                                    
                                    return (
                                        <option key={dept.id} value={dept.id}>
                                            {iconDisplay} {dept.name}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group-modern">
                                    <label>
                                        <FiFileText /> {t('tickets.form.subject')} <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                        placeholder={t('tickets.form.subject_placeholder')}
                                        required
                                    />
                                </div>
                                
                                <div className="form-group-modern">
                                    <label>
                                        <FiTag /> {t('tickets.form.category')}
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="general">{t('tickets.form.category_general')}</option>
                                        <option value="technical">{t('tickets.form.category_technical')}</option>
                                        <option value="billing">{t('tickets.form.category_billing')}</option>
                                        <option value="account">{t('tickets.form.category_account')}</option>
                                        <option value="other">{t('tickets.form.category_other')}</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group-modern">
                                    <label>
                                        <FiAlertCircle /> {t('tickets.form.priority')}
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                                    >
                                        <option value="low">{t('tickets.form.priority_low')}</option>
                                        <option value="medium">{t('tickets.form.priority_medium')}</option>
                                        <option value="high">{t('tickets.form.priority_high')}</option>
                                        <option value="urgent">{t('tickets.form.priority_urgent')}</option>
                                    </select>
                                </div>
                                
                                <div className="form-group-modern">
                                    <label>
                                        <FiFileText /> {t('tickets.form.purchased_project')}
                                    </label>
                                    <select
                                        value={formData.project_id || ''}
                                        onChange={(e) => setFormData({...formData, project_id: e.target.value || ''})}
                                        className="department-select"
                                    >
                                        <option value="">{t('tickets.form.select_project_optional')}</option>
                                        {purchasedProjects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            <div className="form-group-modern">
                                <label>
                                    <FiMessageCircle /> {t('tickets.form.message')} <span className="required">*</span>
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    placeholder={t('tickets.form.message_placeholder')}
                                    required
                                    rows="8"
                                />
                            </div>
                            
                            <button type="submit" className="btn btn-primary btn-large btn-submit">
                                <FiSend /> {t('tickets.form.submit')}
                            </button>
                        </form>
                    </div>
                )}

                {/* FAQ Bölümü - Modern Accordion */}
                {faqs.length > 0 && !showForm && !selectedTicket && (
                    <div className="faq-section-modern">
                        <div className="faq-header">
                            <div className="faq-header-content">
                                <h2>
                                    <FiHelpCircle /> {t('tickets.faq.title')}
                                </h2>
                                <p>{t('tickets.faq.subtitle')}</p>
                            </div>
                            <button 
                                className="btn btn-outline btn-toggle-faq"
                                onClick={() => setShowFAQ(!showFAQ)}
                            >
                                {showFAQ ? <FiChevronUp /> : <FiChevronDown />}
                                {showFAQ ? t('tickets.faq.hide') : t('tickets.faq.show')}
                            </button>
                        </div>
                        
                        {showFAQ && (
                            <div className="faq-accordion-wrapper">
                                {faqs.map((faq, idx) => (
                                    <div 
                                        key={faq.id || idx} 
                                        className={`faq-accordion-item ${openFaqIndex === idx ? 'active' : ''}`}
                                    >
                                        <button 
                                            className="faq-accordion-button"
                                            onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                                        >
                                            <span className="faq-question">{faq.question}</span>
                                            {openFaqIndex === idx ? (
                                                <FiChevronUp className="faq-icon" />
                                            ) : (
                                                <FiChevronDown className="faq-icon" />
                                            )}
                                        </button>
                                        {openFaqIndex === idx && (
                                            <div className="faq-accordion-content">
                                                <p>{faq.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Ticket Detay Sayfası */}
                {!showForm && selectedTicket && selectedTicket.ticket && (
                    <div className="ticket-detail-modern">
                                <div className="ticket-detail-actions">
                                    <button 
                                        onClick={() => {
                                            setSelectedTicket(null);
                                            loadTickets();
                                        }}
                                        className="btn btn-outline btn-back"
                                    >
                                        <FiX /> {t('tickets.detail.back')}
                                    </button>
                                    <div className="ticket-actions-right">
                                        <span className="ticket-created-info">
                                            {t('tickets.detail.created')}: {new Date(selectedTicket.ticket.created_at).toLocaleDateString(language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : 'en-US')}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="ticket-detail-header">
                                    <div className="ticket-header-info">
                                        <div className="ticket-number">
                                            <FiTag /> {selectedTicket.ticket.ticket_number || `#${selectedTicket.ticket.id}`}
                                        </div>
                                        <h2>{selectedTicket.ticket.subject}</h2>
                                        {selectedTicket.ticket.department_name && (
                                            <div className="ticket-department">
                                                <span 
                                                    className="department-badge"
                                                    style={{ backgroundColor: selectedTicket.ticket.department_color || '#696cff' }}
                                                >
                                                    {selectedTicket.ticket.department_icon} {selectedTicket.ticket.department_name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ticket-header-meta">
                                        <span 
                                            className="status-badge-modern"
                                            style={{ backgroundColor: getStatusColor(selectedTicket.ticket.status) }}
                                        >
                                            {getStatusLabel(selectedTicket.ticket.status)}
                                        </span>
                                        <span 
                                            className="priority-badge"
                                            style={{ backgroundColor: getPriorityColor(selectedTicket.ticket.priority) }}
                                        >
                                            {getPriorityLabel(selectedTicket.ticket.priority)}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="ticket-messages-modern" data-theme={theme}>
                                    <div className="messages-header-compact">
                                        <h3>{t('tickets.detail.messages')}</h3>
                                        <button 
                                            className="btn btn-outline btn-sm"
                                            onClick={() => {
                                                loadTicketDetail(selectedTicket.ticket.id);
                                            }}
                                            title={t('tickets.detail.refresh')}
                                        >
                                            <FiRefreshCw /> {t('tickets.detail.refresh')}
                                        </button>
                                    </div>
                                    
                                    <div className="messages-list-compact">
                                        {(() => {
                                            // Replies array'ini kontrol et
                                            const replies = selectedTicket.ticket.replies || [];
                                            
                                            if (!Array.isArray(replies) || replies.length === 0) {
                                                return <div className="no-messages-compact">{t('tickets.detail.no_messages')}</div>;
                                            }
                                            
                                            // Tüm mesajları göster (zaten sıralı geliyor)
                                            return replies.map((reply, index) => {
                                                if (!reply || !reply.message) {
                                                    return null;
                                                }
                                                
                                                const isAdmin = reply.is_admin === 1 || reply.is_admin === true;
                                                const userRole = reply.user_role || 'user'; // Backend'den gelen rol bilgisi
                                                const authorName = reply.username || selectedTicket.ticket.creator_username || t('tickets.detail.user');
                                                const initials = authorName.substring(0, 1).toUpperCase();
                                                const shortDate = new Date(reply.created_at).toLocaleString(language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : 'en-US', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });
                                                
                                                // Rol badge metni
                                                const getRoleBadge = (role) => {
                                                    const roleMap = {
                                                        'admin': t('tickets.detail.role_admin'),
                                                        'seller': t('tickets.detail.role_seller'),
                                                        'user': t('tickets.detail.role_user'),
                                                        'moderator': t('tickets.detail.role_moderator')
                                                    };
                                                    return roleMap[role] || t('tickets.detail.role_user');
                                                };
                                                
                                                return (
                                                    <div 
                                                        key={reply.id || `msg-${index}`} 
                                                        className={`message-item-compact ${isAdmin || userRole === 'admin' ? 'admin-message' : 'user-message'}`}
                                                        data-theme={theme}
                                                    >
                                                        <div className="message-avatar-compact">
                                                            {initials}
                                                        </div>
                                                        <div className="message-content-compact">
                                                            <div className="message-header-compact">
                                                                <span className="message-author-compact">
                                                                    <strong>{authorName}</strong>
                                                                    <span className="message-badge-compact">
                                                                        {getRoleBadge(userRole)}
                                                                    </span>
                                                                </span>
                                                                <span className="message-date-compact">{shortDate}</span>
                                                            </div>
                                                            <div 
                                                                className="message-text-compact"
                                                                dangerouslySetInnerHTML={{ __html: reply.message || '' }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            }).filter(Boolean);
                                        })()}
                                    </div>
                                </div>
                                
                                {/* Kapatılan ticket'lara sadece admin'ler yazabilir */}
                                {selectedTicket.ticket.status === 'closed' && !isAdmin ? (
                                    <div className="reply-section-modern reply-disabled">
                                        <div className="closed-ticket-message">
                                            <FiXCircle className="closed-icon" />
                                            <h3>{t('tickets.detail.closed_title')}</h3>
                                            <p>{t('tickets.detail.closed_message')}</p>
                                            <p className="closed-note">{t('tickets.detail.closed_note')}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="reply-section-modern">
                                        <h3>
                                            <FiSend /> {t('tickets.detail.write_reply')}
                                        </h3>
                                        <form onSubmit={handleReply} className="reply-form-modern">
                                        <div className="reply-input-wrapper">
                                            <div className="tiptap-editor-wrapper">
                                                {/* Toolbar */}
                                                <div className="tiptap-toolbar">
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().toggleBold().run()}
                                                        className={editor?.isActive('bold') ? 'active' : ''}
                                                        title={t('tickets.editor.bold')}
                                                    >
                                                        <strong>B</strong>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                                                        className={editor?.isActive('italic') ? 'active' : ''}
                                                        title={t('tickets.editor.italic')}
                                                    >
                                                        <em>I</em>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().toggleStrike().run()}
                                                        className={editor?.isActive('strike') ? 'active' : ''}
                                                        title={t('tickets.editor.strike')}
                                                    >
                                                        <s>S</s>
                                                    </button>
                                                    <div className="toolbar-divider"></div>
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                                                        className={editor?.isActive('heading', { level: 1 }) ? 'active' : ''}
                                                        title={t('tickets.editor.heading1')}
                                                    >
                                                        H1
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                                        className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''}
                                                        title={t('tickets.editor.heading2')}
                                                    >
                                                        H2
                                                    </button>
                                                    <div className="toolbar-divider"></div>
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                                        className={editor?.isActive('bulletList') ? 'active' : ''}
                                                        title={t('tickets.editor.bullet_list')}
                                                    >
                                                        •
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                                        className={editor?.isActive('orderedList') ? 'active' : ''}
                                                        title={t('tickets.editor.ordered_list')}
                                                    >
                                                        1.
                                                    </button>
                                                    <div className="toolbar-divider"></div>
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().undo().run()}
                                                        title={t('tickets.editor.undo')}
                                                    >
                                                        ↶
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => editor?.chain().focus().redo().run()}
                                                        title={t('tickets.editor.redo')}
                                                    >
                                                        ↷
                                                    </button>
                                                </div>
                                                {/* Editor */}
                                                <div className="tiptap-editor-container">
                                                    <EditorContent editor={editor} />
                                                </div>
                                            </div>
                                            <div className="reply-actions">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline btn-cancel"
                                                    onClick={() => {
                                                        setReplyMessage('');
                                                        editor?.commands.setContent('');
                                                    }}
                                                >
                                                    {t('tickets.detail.clear')}
                                                </button>
                                                <button type="submit" className="btn btn-primary btn-reply">
                                                    <FiSend /> {t('tickets.detail.send_reply')}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                )}
                            </div>
                        )}

                        {/* Ticket Listesi - Tablo Görünümü */}
                        {!showForm && !selectedTicket && (
                            <>
                                {/* Filtreler ve Arama */}
                                <div className="tickets-filters">
                                    <div className="search-box">
                                        <FiSearch className="search-icon" />
                                        <input
                                            type="text"
                                            placeholder={t('tickets.filters.search_placeholder')}
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                loadTickets();
                                            }}
                                        />
                                    </div>
                                    
                                    <div className="filter-group">
                                        <select
                                            value={filterDepartment}
                                            onChange={(e) => {
                                                setFilterDepartment(e.target.value);
                                                loadTickets();
                                            }}
                                            className="filter-select"
                                        >
                                            <option value="">{t('tickets.filters.all_departments')}</option>
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                        
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => {
                                                setFilterStatus(e.target.value);
                                                loadTickets();
                                            }}
                                            className="filter-select"
                                        >
                                            <option value="">{t('tickets.filters.all_statuses')}</option>
                                            <option value="open">{t('tickets.status.open')}</option>
                                            <option value="in_progress">{t('tickets.status.in_progress')}</option>
                                            <option value="waiting">{t('tickets.status.waiting')}</option>
                                            <option value="resolved">{t('tickets.status.resolved')}</option>
                                            <option value="closed">{t('tickets.status.closed')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Tablo Görünümü - Desktop & Mobil */}
                                <div className="tickets-table-wrapper">
                                {loading && tickets.length === 0 ? (
                                    <div className="loading-tickets">
                                        <div className="spinner-large"></div>
                                            <p>{t('tickets.loading')}</p>
                                    </div>
                                ) : tickets.length === 0 ? (
                                    <div className="empty-tickets">
                                        <FiMessageCircle className="empty-icon" />
                                            <h3>{t('tickets.empty.title')}</h3>
                                            <p>{t('tickets.empty.message')}</p>
                                        <button 
                                            onClick={() => setShowForm(true)}
                                            className="btn btn-primary"
                                            style={{ marginTop: '1.5rem' }}
                                        >
                                                <FiPlus /> {t('tickets.empty.create_first')}
                                        </button>
                                    </div>
                                ) : (
                                        <>
                                            {/* Desktop Tablo Görünümü - Şablon Tasarımı */}
                                            <div className="table-responsive-support">
                                                <div className="table-controls-support">
                                                    <div className="table-length-support">
                                                        <label>
                                                            {t('tickets.table.show')} <select className="form-control-sm">
                                                                <option value="5">5</option>
                                                                <option value="10">10</option>
                                                                <option value="15">15</option>
                                                                <option value="5000">{t('tickets.table.all')}</option>
                                                            </select> {t('tickets.table.records')}
                                                        </label>
                                                    </div>
                                                    <div className="table-info-support">
                                                        <span>
                                                            {tickets.length} {t('tickets.table.records_from')} 1 - {tickets.length} {t('tickets.table.records_showing')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="tickets-table-wrapper">
                                                    <table className="tickets-table-compact">
                                                        <thead>
                                                            <tr>
                                                                <th className="sortable">{t('tickets.table.ticket_no')}</th>
                                                                <th className="sortable">{t('tickets.table.title')}</th>
                                                                <th>{t('tickets.table.department')}</th>
                                                                <th>{t('tickets.table.status')}</th>
                                                                <th>{t('tickets.table.priority')}</th>
                                                                <th className="sortable">{t('tickets.table.last_update')} ↓</th>
                                                                <th className="text-center">{t('tickets.table.actions')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tickets.map((ticket, index) => (
                                                                <tr 
                                            key={ticket.id} 
                                                                    className="ticket-row-clickable"
                                            onClick={() => loadTicketDetail(ticket.id)}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <td className="ticket-number-cell">
                                                                        <strong>{ticket.ticket_number || `#${ticket.id}`}</strong>
                                                                    </td>
                                                                    <td className="ticket-subject-cell">
                                                                        <span className="subject-text">{ticket.subject}</span>
                                                                    </td>
                                                                    <td className="ticket-department-cell">
                                                                        {ticket.department_name || t('tickets.table.general')}
                                                                    </td>
                                                                    <td className="ticket-status-cell">
                                                <span 
                                                                            className="status-badge"
                                                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                                                >
                                                                            {getStatusIcon(ticket.status)} {getStatusLabel(ticket.status)}
                                                </span>
                                                                    </td>
                                                                    <td className="ticket-priority-cell">
                                                    <span 
                                                                            className="priority-badge"
                                                                            style={{ backgroundColor: getPriorityColor(ticket.priority || 'medium') }}
                                                    >
                                                                            {getPriorityLabel(ticket.priority || 'medium')}
                                                    </span>
                                                                    </td>
                                                                    <td className="ticket-date-cell">
                                                                        {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString(
                                                                            language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : 'en-US',
                                                                            { 
                                                                                day: '2-digit', 
                                                                                month: '2-digit',
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            }
                                                                        )}
                                                                    </td>
                                                                    <td className="ticket-action-cell text-center">
                                                                        <button
                                                                            className="btn-view-compact"
                                                                            title={t('tickets.table.view')}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                loadTicketDetail(ticket.id);
                                                                            }}
                                                                        >
                                                                            <FiEye />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Mobil Liste Görünümü */}
                                            <div className="tickets-list-mobile">
                                                {tickets.map((ticket, index) => (
                                                    <div 
                                                        key={ticket.id} 
                                                        className={`ticket-card-mobile ${expandedRows.has(ticket.id) ? 'expanded' : ''}`}
                                                        style={{ '--priority-color': getPriorityColor(ticket.priority || 'medium') }}
                                                    >
                                                        <div 
                                                            className="ticket-card-header-mobile"
                                                            onClick={() => toggleRowExpansion(ticket.id)}
                                                        >
                                                            <div className="ticket-mobile-left">
                                                                <div className="ticket-mobile-top-row">
                                                                    <div className="ticket-mobile-number">
                                                                        <FiTag /> {ticket.ticket_number || `#${ticket.id}`}
                                                </div>
                                                    {ticket.reply_count > 0 && (
                                                                        <div className="ticket-mobile-reply-badge">
                                                                            <FiMessageCircle /> {ticket.reply_count} {t('tickets.list.replies')}
                                                                        </div>
                                                    )}
                                                    {ticket.unread_replies > 0 && (
                                                                        <div className="ticket-mobile-unread-badge">
                                                                            {ticket.unread_replies} {t('tickets.mobile.unread')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="ticket-mobile-title">{ticket.subject}</div>
                                                                <div className="ticket-mobile-department">
                                                                    {ticket.department_name || t('tickets.table.general')}
                                                                </div>
                                                            </div>
                                                            <div className="ticket-mobile-right">
                                                                <span 
                                                                    className="status-badge-mobile"
                                                                    style={{ backgroundColor: getStatusColor(ticket.status) }}
                                                                >
                                                                    {getStatusLabel(ticket.status)}
                                                                </span>
                                                                {expandedRows.has(ticket.id) ? (
                                                                    <FiChevronUp className="expand-icon" />
                                                                ) : (
                                                                    <FiChevronDown className="expand-icon" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {expandedRows.has(ticket.id) && (
                                                            <div className="ticket-card-content-mobile">
                                                                {ticket.message && (
                                                                    <div className="ticket-mobile-message">
                                                                        <strong>{t('tickets.mobile.message')}:</strong>
                                                                        <p>{ticket.message.length > 200 ? ticket.message.substring(0, 200) + '...' : ticket.message}</p>
                                                                    </div>
                                                                )}
                                                                <div className="ticket-mobile-meta">
                                                                    <div className="ticket-mobile-meta-item">
                                                                        <FiClock /> 
                                                                        <span>{t('tickets.mobile.last_update')}: {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString(
                                                                            language === 'tr' ? 'tr-TR' : language === 'de' ? 'de-DE' : 'en-US',
                                                                            { 
                                                                                day: '2-digit', 
                                                                                month: 'long', 
                                                                                year: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            }
                                                                        )}</span>
                                                                    </div>
                                                                    {ticket.priority && (
                                                                        <div className="ticket-mobile-meta-item">
                                                                            <FiAlertCircle />
                                                                            <span>{t('tickets.mobile.priority')}: {getPriorityLabel(ticket.priority)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="ticket-mobile-actions">
                                                    <button 
                                                                        className="btn btn-primary btn-mobile-action"
                                                                        onClick={() => loadTicketDetail(ticket.id)}
                                                                    >
                                                                        <FiEye /> {t('tickets.table.view')}
                                                    </button>
                                                </div>
                                            </div>
                                                        )}
                                        </div>
                                                ))}
                                            </div>
                                        </>
                                )}
                            </div>
                        </>
                        )}
                </div>
            </div>
        </div>
    );

    return getLayout(pageContent);
};

export default Tickets;

