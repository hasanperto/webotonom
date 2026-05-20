import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { 
    FiMessageSquare, FiSearch, FiFilter, FiRefreshCw, FiEye,
    FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiUser,
    FiMail, FiTag, FiCalendar, FiTrendingUp, FiTrendingDown,
    FiEdit, FiSend, FiX, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import './AdminSupport.css';

const AdminSupport = () => {
    const { theme } = useTheme();
    const [tickets, setTickets] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [showResolved, setShowResolved] = useState(false);
    const [showClosed, setShowClosed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [stats, setStats] = useState({
        total: 0,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
    });

    useEffect(() => {
        loadTickets();
        loadDepartments();
    }, [filterStatus, filterPriority, filterDepartment, showResolved, showClosed]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterPriority) params.priority = filterPriority;
            if (filterDepartment) params.department_id = filterDepartment;
            
            const response = await api.get('/tickets/all', { params });
            const ticketsData = response.data.tickets || [];
            setTickets(ticketsData);
            
            // İstatistikleri hesapla
            const newStats = {
                total: ticketsData.length,
                open: ticketsData.filter(t => t.status === 'open').length,
                in_progress: ticketsData.filter(t => t.status === 'in_progress').length,
                resolved: ticketsData.filter(t => t.status === 'resolved').length,
                closed: ticketsData.filter(t => t.status === 'closed').length
            };
            setStats(newStats);
        } catch (error) {
            console.error('Tickets load error:', error);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const loadDepartments = async () => {
        try {
            const response = await api.get('/tickets/departments');
            setDepartments(response.data.departments || []);
        } catch (error) {
            console.error('Departments load error:', error);
        }
    };

    const loadTicketDetail = async (ticketId) => {
        try {
            const response = await api.get(`/tickets/${ticketId}`);
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
            
            setSelectedTicket(ticketData);
        } catch (error) {
            console.error('Ticket detail load error:', error);
            alert('Ticket detayı yüklenirken bir hata oluştu: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            await api.put(`/tickets/${ticketId}/status`, { status: newStatus });
            loadTickets();
            if (selectedTicket && selectedTicket.id === ticketId) {
                loadTicketDetail(ticketId);
            }
        } catch (error) {
            console.error('Status update error:', error);
            alert('Durum güncellenirken bir hata oluştu');
        }
    };

    const handlePriorityChange = async (ticketId, newPriority) => {
        try {
            await api.put(`/tickets/${ticketId}/priority`, { priority: newPriority });
            loadTickets();
            if (selectedTicket && selectedTicket.id === ticketId) {
                loadTicketDetail(ticketId);
            }
        } catch (error) {
            console.error('Priority update error:', error);
            alert('Öncelik güncellenirken bir hata oluştu');
        }
    };

    const handleReply = async () => {
        if (!replyMessage.trim() || !selectedTicket) return;
        
        try {
            await api.post(`/tickets/${selectedTicket.id}/reply`, {
                message: replyMessage,
                is_admin: true
            });
            setReplyMessage('');
            loadTicketDetail(selectedTicket.id);
            loadTickets();
        } catch (error) {
            console.error('Reply error:', error);
            alert('Yanıt gönderilirken bir hata oluştu');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'open': { label: 'Açık', color: '#3b82f6', icon: FiClock },
            'in_progress': { label: 'İşlemde', color: '#f59e0b', icon: FiAlertCircle },
            'resolved': { label: 'Çözüldü', color: '#10b981', icon: FiCheckCircle },
            'closed': { label: 'Kapatıldı', color: '#6b7280', icon: FiXCircle }
        };
        const statusInfo = statusMap[status] || statusMap['open'];
        const Icon = statusInfo.icon;
        return (
            <span className="status-badge" style={{ backgroundColor: statusInfo.color }}>
                <Icon /> {statusInfo.label}
            </span>
        );
    };

    const getPriorityBadge = (priority) => {
        const priorityMap = {
            'low': { label: 'Düşük', color: '#10b981' },
            'medium': { label: 'Orta', color: '#f59e0b' },
            'high': { label: 'Yüksek', color: '#ef4444' },
            'urgent': { label: 'Acil', color: '#dc2626' }
        };
        const priorityInfo = priorityMap[priority] || priorityMap['medium'];
        return (
            <span className="priority-badge" style={{ backgroundColor: priorityInfo.color }}>
                {priorityInfo.label}
            </span>
        );
    };

    // İstatistik kartına tıklama ile filtreleme
    const handleStatClick = (status) => {
        if (status === 'total') {
            setFilterStatus('');
            setShowResolved(true);
            setShowClosed(true);
        } else if (status === 'open') {
            setFilterStatus('open');
            setShowResolved(false);
            setShowClosed(false);
        } else if (status === 'in_progress') {
            setFilterStatus('in_progress');
            setShowResolved(false);
            setShowClosed(false);
        } else if (status === 'resolved') {
            setFilterStatus('resolved');
            setShowResolved(true);
            setShowClosed(false);
        } else if (status === 'closed') {
            setFilterStatus('closed');
            setShowResolved(false);
            setShowClosed(true);
        }
        setCurrentPage(1); // Sayfayı sıfırla
    };

    // Filtreleme ve sıralama
    const filteredTickets = tickets
        .filter(ticket => {
            // Varsayılan olarak resolved ve closed'ları gizle
            if (!showResolved && ticket.status === 'resolved') return false;
            if (!showClosed && ticket.status === 'closed') return false;
            
            // Durum filtresi
            if (filterStatus && ticket.status !== filterStatus) return false;
            
            // Öncelik filtresi
            if (filterPriority && ticket.priority !== filterPriority) return false;
            
            // Departman filtresi
            if (filterDepartment && ticket.department_id !== parseInt(filterDepartment)) return false;
            
            // Arama filtresi
            const matchesSearch = !searchQuery || 
                ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.creator_username?.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Kullanıcı filtresi
            const matchesUser = !filterUser || 
                ticket.creator_username?.toLowerCase().includes(filterUser.toLowerCase());
            
            // Tarih filtresi
            const ticketDate = new Date(ticket.created_at);
            const matchesDateFrom = !filterDateFrom || ticketDate >= new Date(filterDateFrom);
            const matchesDateTo = !filterDateTo || ticketDate <= new Date(filterDateTo + 'T23:59:59');
            
            return matchesSearch && matchesUser && matchesDateFrom && matchesDateTo;
        })
        .sort((a, b) => {
            let aValue, bValue;
            
            if (sortBy === 'updated_at' || sortBy === 'created_at') {
                aValue = new Date(a[sortBy]);
                bValue = new Date(b[sortBy]);
            } else {
                aValue = a[sortBy] || '';
                bValue = b[sortBy] || '';
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });

    // Sayfalama hesaplamaları
    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTickets = itemsPerPage === 5000 
        ? filteredTickets 
        : filteredTickets.slice(startIndex, endIndex);
    
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    if (loading && tickets.length === 0) {
        return (
            <AdminLayout>
                <div className="admin-support-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-support-page">
                <div className="admin-header-support">
                    <div>
                        <h1 className="page-title-support">Destek Yönetimi</h1>
                        <p className="page-subtitle-support">Tüm destek ticket'larını görüntüleyin ve yönetin</p>
                    </div>
                    <div className="header-actions-support">
                        <button className="btn-refresh" onClick={loadTickets}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                {/* İstatistikler */}
                <div className="support-stats-grid">
                    <div 
                        className="stat-card-support total" 
                        onClick={() => handleStatClick('total')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon-support">
                            <FiMessageSquare />
                        </div>
                        <div className="stat-content-support">
                            <span className="stat-label-support">Toplam</span>
                            <span className="stat-value-support">{stats.total}</span>
                        </div>
                    </div>
                    <div 
                        className="stat-card-support open" 
                        onClick={() => handleStatClick('open')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon-support">
                            <FiClock />
                        </div>
                        <div className="stat-content-support">
                            <span className="stat-label-support">Açık</span>
                            <span className="stat-value-support">{stats.open}</span>
                        </div>
                    </div>
                    <div 
                        className="stat-card-support in-progress" 
                        onClick={() => handleStatClick('in_progress')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon-support">
                            <FiAlertCircle />
                        </div>
                        <div className="stat-content-support">
                            <span className="stat-label-support">İşlemde</span>
                            <span className="stat-value-support">{stats.in_progress}</span>
                        </div>
                    </div>
                    <div 
                        className="stat-card-support resolved" 
                        onClick={() => handleStatClick('resolved')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon-support">
                            <FiCheckCircle />
                        </div>
                        <div className="stat-content-support">
                            <span className="stat-label-support">Çözüldü</span>
                            <span className="stat-value-support">{stats.resolved}</span>
                        </div>
                    </div>
                    <div 
                        className="stat-card-support closed" 
                        onClick={() => handleStatClick('closed')}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="stat-icon-support">
                            <FiXCircle />
                        </div>
                        <div className="stat-content-support">
                            <span className="stat-label-support">Kapatıldı</span>
                            <span className="stat-value-support">{stats.closed}</span>
                        </div>
                    </div>
                </div>

                {/* Filtreler ve Arama */}
                <div className="filters-section-support">
                    <div className="filters-header-support">
                        <div className="search-box-support">
                            <FiSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Ticket numarası, konu veya kullanıcı adı ile ara..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <button 
                            className="btn-toggle-filters"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <FiFilter /> {showFilters ? 'Filtreleri Gizle' : 'Gelişmiş Filtreleme'}
                        </button>
                    </div>
                    
                    {showFilters && (
                        <div className="advanced-filters-support">
                            <div className="filter-row-support">
                                <div className="filter-group-support">
                                    <label>Durum</label>
                                    <select 
                                        value={filterStatus} 
                                        onChange={(e) => {
                                            setFilterStatus(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="filter-select"
                                    >
                                        <option value="">Tüm Durumlar</option>
                                        <option value="open">Açık</option>
                                        <option value="in_progress">İşlemde</option>
                                        <option value="resolved">Çözüldü</option>
                                        <option value="closed">Kapatıldı</option>
                                    </select>
                                </div>
                                <div className="filter-group-support">
                                    <label>Öncelik</label>
                                    <select 
                                        value={filterPriority} 
                                        onChange={(e) => {
                                            setFilterPriority(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="filter-select"
                                    >
                                        <option value="">Tüm Öncelikler</option>
                                        <option value="low">Düşük</option>
                                        <option value="medium">Orta</option>
                                        <option value="high">Yüksek</option>
                                        <option value="urgent">Acil</option>
                                    </select>
                                </div>
                                <div className="filter-group-support">
                                    <label>Departman</label>
                                    <select 
                                        value={filterDepartment} 
                                        onChange={(e) => {
                                            setFilterDepartment(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="filter-select"
                                    >
                                        <option value="">Tüm Departmanlar</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group-support">
                                    <label>Kullanıcı</label>
                                    <input
                                        type="text"
                                        placeholder="Kullanıcı adı..."
                                        value={filterUser}
                                        onChange={(e) => {
                                            setFilterUser(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="filter-input"
                                    />
                                </div>
                            </div>
                            <div className="filter-row-support">
                                <div className="filter-group-support">
                                    <label>Başlangıç Tarihi</label>
                                    <input
                                        type="date"
                                        value={filterDateFrom}
                                        onChange={(e) => {
                                            setFilterDateFrom(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="filter-input"
                                    />
                                </div>
                                <div className="filter-group-support">
                                    <label>Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        value={filterDateTo}
                                        onChange={(e) => {
                                            setFilterDateTo(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="filter-input"
                                    />
                                </div>
                                <div className="filter-group-support">
                                    <label>Göster</label>
                                    <div className="checkbox-group-support">
                                        <label className="checkbox-label-support">
                                            <input 
                                                type="checkbox" 
                                                checked={showResolved} 
                                                onChange={(e) => {
                                                    setShowResolved(e.target.checked);
                                                    setCurrentPage(1);
                                                }} 
                                            />
                                            Çözülenler
                                        </label>
                                        <label className="checkbox-label-support">
                                            <input 
                                                type="checkbox" 
                                                checked={showClosed} 
                                                onChange={(e) => {
                                                    setShowClosed(e.target.checked);
                                                    setCurrentPage(1);
                                                }} 
                                            />
                                            Kapatılanlar
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Ticket Listesi - DataTables Benzeri */}
                <div className="table-responsive-support">
                    <div className="table-controls-support">
                        <div className="table-length-support">
                            <label>
                                Sayfada{' '}
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                                    className="form-control-sm"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={5000}>Tümü</option>
                                </select>
                                {' '}kayıt göster
                            </label>
                        </div>
                        <div className="table-info-support">
                            {filteredTickets.length > 0 ? (
                                <span>
                                    {filteredTickets.length} kayıttan {startIndex + 1} - {Math.min(endIndex, filteredTickets.length)} arasındaki kayıtlar gösteriliyor
                                </span>
                            ) : (
                                <span>Kayıt bulunamadı</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="tickets-table-wrapper">
                        <table className="tickets-table-compact">
                            <thead>
                                <tr>
                                    <th 
                                        className="sortable"
                                        onClick={() => {
                                            if (sortBy === 'ticket_number') {
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortBy('ticket_number');
                                                setSortOrder('asc');
                                            }
                                        }}
                                    >
                                        Ticket No
                                        {sortBy === 'ticket_number' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                                    </th>
                                    <th 
                                        className="sortable"
                                        onClick={() => {
                                            if (sortBy === 'subject') {
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortBy('subject');
                                                setSortOrder('asc');
                                            }
                                        }}
                                    >
                                        Konu
                                        {sortBy === 'subject' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                                    </th>
                                    <th>Gönderen</th>
                                    <th>Departman</th>
                                    <th>Durum</th>
                                    <th>Öncelik</th>
                                    <th 
                                        className="sortable"
                                        onClick={() => {
                                            if (sortBy === 'updated_at') {
                                                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                            } else {
                                                setSortBy('updated_at');
                                                setSortOrder('desc');
                                            }
                                        }}
                                    >
                                        Güncelleme Tarihi
                                        {sortBy === 'updated_at' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                                    </th>
                                    <th className="text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="empty-state-compact">
                                            <FiMessageSquare className="empty-icon" />
                                            <span>Ticket bulunamadı</span>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedTickets.map(ticket => (
                                        <tr 
                                            key={ticket.id}
                                            className={selectedTicket?.id === ticket.id ? 'active-row' : ''}
                                            onClick={() => loadTicketDetail(ticket.id)}
                                        >
                                            <td className="ticket-number-cell">
                                                <strong>{ticket.ticket_number}</strong>
                                            </td>
                                            <td className="ticket-subject-cell">
                                                <span className="subject-text">{ticket.subject}</span>
                                            </td>
                                            <td className="ticket-user-cell">
                                                <FiUser /> {ticket.creator_username || 'Kullanıcı'}
                                            </td>
                                            <td className="ticket-department-cell">
                                                {ticket.department_name || '-'}
                                            </td>
                                            <td className="ticket-status-cell">
                                                {getStatusBadge(ticket.status)}
                                            </td>
                                            <td className="ticket-priority-cell">
                                                {getPriorityBadge(ticket.priority)}
                                            </td>
                                            <td className="ticket-date-cell">
                                                {new Date(ticket.updated_at || ticket.created_at).toLocaleDateString('tr-TR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="ticket-action-cell text-center">
                                                <button
                                                    className="btn-view-compact"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        loadTicketDetail(ticket.id);
                                                    }}
                                                    title="Görüntüle"
                                                >
                                                    <FiEye />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Sayfalama */}
                    {totalPages > 1 && (
                        <div className="table-pagination-support">
                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Önceki
                            </button>
                            <div className="pagination-numbers">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        // İlk sayfa, son sayfa, mevcut sayfa ve etrafındaki sayfalar
                                        return page === 1 || 
                                               page === totalPages || 
                                               (page >= currentPage - 1 && page <= currentPage + 1);
                                    })
                                    .map((page, index, array) => {
                                        // Eksik sayfalar için "..." ekle
                                        const prevPage = array[index - 1];
                                        const showEllipsis = prevPage && page - prevPage > 1;
                                        
                                        return (
                                            <React.Fragment key={page}>
                                                {showEllipsis && <span className="pagination-ellipsis">...</span>}
                                                <button
                                                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                            </div>
                            <button
                                className="pagination-btn"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Sonraki
                            </button>
                        </div>
                    )}
                </div>

                {/* Ticket Detay - Modal */}
                {selectedTicket && (
                    <div className="ticket-detail-modal" onClick={() => setSelectedTicket(null)} data-theme={theme}>
                        <div className="ticket-detail-content" onClick={(e) => e.stopPropagation()} data-theme={theme}>
                            <div className="ticket-detail-header">
                                <div>
                                    <h2>{selectedTicket.subject}</h2>
                                    <p className="ticket-number-detail">{selectedTicket.ticket_number}</p>
                                </div>
                                <button 
                                    className="btn-close-detail"
                                    onClick={() => setSelectedTicket(null)}
                                >
                                    <FiX />
                                </button>
                            </div>

                            <div className="ticket-detail-actions">
                                <div className="action-group">
                                    <label>Durum:</label>
                                    <select 
                                        value={selectedTicket.status} 
                                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                                        className="action-select"
                                    >
                                        <option value="open">Açık</option>
                                        <option value="in_progress">İşlemde</option>
                                        <option value="resolved">Çözüldü</option>
                                        <option value="closed">Kapatıldı</option>
                                    </select>
                                </div>
                                <div className="action-group">
                                    <label>Öncelik:</label>
                                    <select 
                                        value={selectedTicket.priority} 
                                        onChange={(e) => handlePriorityChange(selectedTicket.id, e.target.value)}
                                        className="action-select"
                                    >
                                        <option value="low">Düşük</option>
                                        <option value="medium">Orta</option>
                                        <option value="high">Yüksek</option>
                                        <option value="urgent">Acil</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ticket-info-support">
                                <table className="ticket-info-table">
                                    <tbody>
                                        <tr>
                                            <td className="info-label-cell"><strong>Başlık</strong></td>
                                            <td className="info-value-cell">: {selectedTicket.subject || '-'}</td>
                                        </tr>
                                        {selectedTicket.department_name && (
                                            <tr>
                                                <td className="info-label-cell"><strong>Departman</strong></td>
                                                <td className="info-value-cell">: {selectedTicket.department_name}</td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="info-label-cell"><strong>Öncelik</strong></td>
                                            <td className="info-value-cell">: {getPriorityBadge(selectedTicket.priority)}</td>
                                        </tr>
                                        <tr>
                                            <td className="info-label-cell"><strong>Müşteri Adı Soyadı</strong></td>
                                            <td className="info-value-cell">: {selectedTicket.creator_username || 'Kullanıcı'}</td>
                                        </tr>
                                        <tr>
                                            <td className="info-label-cell"><strong>Eklenme Tarihi</strong></td>
                                            <td className="info-value-cell">: {formatDate(selectedTicket.created_at)}</td>
                                        </tr>
                                        <tr>
                                            <td className="info-label-cell"><strong>Son Güncellenme Tarihi</strong></td>
                                            <td className="info-value-cell">: {formatDate(selectedTicket.updated_at || selectedTicket.created_at)}</td>
                                        </tr>
                                        <tr>
                                            <td className="info-label-cell"><strong>Durumu</strong></td>
                                            <td className="info-value-cell">: {getStatusBadge(selectedTicket.status)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="ticket-messages-support">
                                <h3>Mesajlar</h3>
                                <div className="messages-list">
                                    {(() => {
                                        // Replies array'ini kontrol et
                                        const replies = selectedTicket.replies || [];
                                        
                                        if (!Array.isArray(replies) || replies.length === 0) {
                                            return <div className="no-messages">Henüz mesaj yok</div>;
                                        }
                                        
                                        // Tüm mesajları göster (zaten sıralı geliyor)
                                        return replies.map((reply, index) => {
                                            if (!reply || !reply.message) {
                                                return null;
                                            }
                                            
                                            const isAdmin = reply.is_admin === 1 || reply.is_admin === true;
                                            const userRole = reply.user_role || 'user'; // Backend'den gelen rol bilgisi
                                            const authorName = reply.username || selectedTicket.creator_username || 'Kullanıcı';
                                            const initials = authorName.substring(0, 1).toUpperCase();
                                            const shortDate = new Date(reply.created_at).toLocaleString('tr-TR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                            
                                            // Rol badge metni
                                            const getRoleBadge = (role) => {
                                                const roleMap = {
                                                    'admin': 'Admin',
                                                    'seller': 'Satıcı',
                                                    'user': 'Kullanıcı',
                                                    'moderator': 'Moderatör'
                                                };
                                                return roleMap[role] || 'Kullanıcı';
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

                            <div className="ticket-reply-support">
                                <h3>Yanıt Ver</h3>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Yanıtınızı buraya yazın..."
                                    rows="5"
                                    className="reply-textarea"
                                />
                                <button 
                                    onClick={handleReply}
                                    className="btn-reply"
                                    disabled={!replyMessage.trim()}
                                >
                                    <FiSend /> Yanıt Gönder
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminSupport;

