import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { 
    FiMenu, FiPlus, FiEdit, FiTrash2, FiArrowUp, FiArrowDown,
    FiRefreshCw, FiSave, FiX, FiLink, FiHome, FiMove,
    FiChevronRight, FiChevronDown, FiFileText, FiEye, FiEyeOff,
    FiSearch, FiLock
} from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import './AdminMenus.css';

const AdminMenus = () => {
    const { type } = useParams();
    const menuType = type || 'header';
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [pages, setPages] = useState([]);
    const [corporatePreviewItems, setCorporatePreviewItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPagesModal, setShowPagesModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    const [expandedItems, setExpandedItems] = useState(new Set());
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        icon: '',
        order: 0,
        parent_id: null,
        target: '_self',
        status: 'active'
    });
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [iconSearch, setIconSearch] = useState('');

    // Sabit navbar sırası (ayar)
    const FIXED_DEFAULT = ['home', 'projects', 'blog', 'contact', 'corporate'];
    const [fixedOrder, setFixedOrder] = useState(FIXED_DEFAULT);
    const [dragFixedKey, setDragFixedKey] = useState(null);

    const FIXED_ITEMS_MAP = {
        home: { title: 'Ana Sayfa', url: '/', icon: <FiHome /> },
        projects: { title: 'Projeler', url: '/projects', icon: <FiLink /> },
        blog: { title: 'Blog', url: '/blog', icon: <FiLink /> },
        contact: { title: 'İletişim', url: '/contact', icon: <FiLink /> },
        corporate: { title: 'Kurumsal', url: '#', icon: <FiMenu /> },
    };

    const ICONS = [
        'FiHome','FiGrid','FiBook','FiMail','FiPhone','FiInfo','FiFileText','FiLink',
        'FiShield','FiLock','FiAward','FiUsers','FiBriefcase','FiGlobe','FiMapPin',
        'FiHelpCircle','FiMessageCircle','FiCreditCard','FiShoppingCart','FiPackage',
        'FiSettings','FiStar','FiHeart','FiBell','FiZap','FiTrendingUp','FiLayers',
        'FiCamera','FiImage','FiPlay','FiTarget','FiCheckCircle'
    ];

    const getIconPreview = (name) => {
        if (!name) return <FiLink />;
        // emoji ise
        if (/[\u{1F300}-\u{1F9FF}]/u.test(name)) return <span className="icon-emoji-preview">{name}</span>;
        const Cmp = FiIcons[name] || FiIcons.FiLink;
        return <Cmp />;
    };

    useEffect(() => {
        loadMenuItems();
        loadPages();
        loadCorporatePreview();
        loadFixedOrder();
    }, [menuType]);

    const loadFixedOrder = async () => {
        try {
            const res = await api.get('/admin/settings/navigation');
            const raw = res.data?.header_fixed_nav_order;
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) setFixedOrder(parsed);
            }
        } catch (e) {
            // yoksa varsayılan kalsın
        }
    };

    const saveFixedOrder = async (nextOrder) => {
        try {
            await api.put('/admin/settings/navigation', {
                header_fixed_nav_order: JSON.stringify(nextOrder)
            });
        } catch (e) {
            console.error('Fixed order save error:', e);
            alert('Sabit menü sırası kaydedilemedi');
        }
    };

    const loadMenuItems = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/admin/menus/${menuType}`);
            const items = response.data.items || [];
            setMenuItems(items);
            console.log('[AdminMenus] menuType:', menuType, 'items:', items.length);
            // Tüm öğeleri genişlet
            setExpandedItems(new Set(items.map(item => item.id)));
        } catch (error) {
            console.error('Menu items load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPages = async () => {
        try {
            const response = await api.get('/admin/pages');
            const loadedPages = response.data.pages || [];
            setPages(loadedPages.filter(p => p.status === 'active'));
        } catch (error) {
            console.error('Pages load error:', error);
        }
    };

    // Kurumsal menü (public) önizlemesi - sitede görünen menü
    const loadCorporatePreview = async () => {
        try {
            const response = await api.get('/menus/corporate');
            const items = response.data.items || [];
            setCorporatePreviewItems(items);
            console.log('[AdminMenus] corporate preview items:', items.length);
        } catch (error) {
            console.error('Corporate preview load error:', error);
            setCorporatePreviewItems([]);
        }
    };

    const handleAddPageToMenu = async (page) => {
        try {
            const newMenuItem = {
                title: page.title,
                url: `/${page.slug}`,
                icon: '',
                order: menuItems.length,
                parent_id: null,
                target: '_self',
                status: 'active'
            };
            await api.post(`/admin/menus/${menuType}`, newMenuItem);
            setShowPagesModal(false);
            loadMenuItems();
        } catch (error) {
            console.error('Add page to menu error:', error);
            alert('Sayfa menüye eklenirken hata oluştu');
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const item = menuItems.find(m => m.id === id);
            if (!item) return;
            
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            await api.put(`/admin/menus/${menuType}/${id}`, {
                ...item,
                status: newStatus
            });
            setMenuItems(menuItems.map(m => 
                m.id === id ? { ...m, status: newStatus } : m
            ));
        } catch (error) {
            console.error('Toggle status error:', error);
            alert('Durum güncellenirken hata oluştu');
        }
    };

    // Hiyerarşik yapı oluştur
    const buildTree = (items) => {
        const itemMap = new Map();
        const rootItems = [];

        // Önce tüm öğeleri map'e ekle
        items.forEach(item => {
            itemMap.set(item.id, { ...item, children: [] });
        });

        // Sonra parent-child ilişkilerini kur
        items.forEach(item => {
            const node = itemMap.get(item.id);
            if (item.parent_id && itemMap.has(item.parent_id)) {
                itemMap.get(item.parent_id).children.push(node);
            } else {
                rootItems.push(node);
            }
        });

        // Sıralama
        const sortItems = (items) => {
            items.sort((a, b) => (a.order || 0) - (b.order || 0));
            items.forEach(item => {
                if (item.children.length > 0) {
                    sortItems(item.children);
                }
            });
        };

        sortItems(rootItems);
        return rootItems;
    };

    // Arama filtresi uygula
    const filteredMenuItems = searchTerm 
        ? menuItems.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.url.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : menuItems;
    
    const treeItems = buildTree(filteredMenuItems);

    const corporateTreePreview = buildTree(corporatePreviewItems);

    const FIXED_HEADER_ITEMS = fixedOrder
        .map(key => ({ key, ...FIXED_ITEMS_MAP[key] }))
        .filter(Boolean);

    const handleSave = async () => {
        try {
            if (editingItem) {
                await api.put(`/admin/menus/${menuType}/${editingItem.id}`, formData);
            } else {
                await api.post(`/admin/menus/${menuType}`, formData);
            }
            setShowAddModal(false);
            loadMenuItems();
        } catch (error) {
            console.error('Save menu item error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Menü öğesi kaydedilemedi'));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu menü öğesini ve tüm alt öğelerini silmek istediğinize emin misiniz?')) return;
        
        try {
            await api.delete(`/admin/menus/${menuType}/${id}`);
            loadMenuItems();
        } catch (error) {
            console.error('Delete menu item error:', error);
            alert('Hata: ' + (error.response?.data?.error || 'Menü öğesi silinemedi'));
        }
    };

    const handleDragStart = (e, item) => {
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', item.id);
    };

    const handleDragOver = (e, item) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedItem && draggedItem.id !== item.id) {
            setDragOverItem(item.id);
        }
    };

    const handleDragLeave = () => {
        setDragOverItem(null);
    };

    const handleDrop = async (e, targetItem) => {
        e.preventDefault();
        setDragOverItem(null);

        if (!draggedItem || draggedItem.id === targetItem.id) {
            setDraggedItem(null);
            return;
        }

        try {
            // Sürükle-bırak: hedefin bulunduğu seviyeye taşı ve sibling sırasını güncelle
            const newParentId = targetItem.parent_id || null;

            const siblings = menuItems
                .filter(i => (i.parent_id || null) === newParentId && i.id !== draggedItem.id)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

            const targetIndex = siblings.findIndex(i => i.id === targetItem.id);

            const dragged = { ...draggedItem, parent_id: newParentId };
            const newSiblings = [...siblings];
            // targettan sonra ekle
            newSiblings.splice(targetIndex + 1, 0, dragged);

            const payloadItems = newSiblings.map((it, idx) => ({
                id: it.id,
                order: idx,
                parent_id: newParentId
            }));

            await api.put(`/admin/menus/${menuType}/reorder`, { items: payloadItems });
            await loadMenuItems();
        } catch (error) {
            console.error('Drop menu item error:', error);
            alert('Menü öğesi taşınamadı');
        }

        setDraggedItem(null);
    };

    const toggleExpand = (itemId) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const renderMenuItem = (item, level = 0) => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems.has(item.id);
        const isDragged = draggedItem && draggedItem.id === item.id;
        const isDragOver = dragOverItem === item.id;

        return (
            <div
                key={item.id}
                className={`menu-item-tree ${isDragged ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                style={{ paddingLeft: `${level * 2}rem` }}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item)}
            >
                <div className="menu-item-tree-content">
                    <div className="menu-item-tree-handle">
                        <FiMove className="drag-handle" />
                        {hasChildren && (
                            <button
                                className="expand-btn"
                                onClick={() => toggleExpand(item.id)}
                            >
                                {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                            </button>
                        )}
                        {!hasChildren && <span className="expand-spacer"></span>}
                    </div>
                    <div className="menu-item-tree-info">
                        {item.icon && <span className="menu-icon">{item.icon}</span>}
                        <div>
                            <h3>{item.title}</h3>
                            <p className="menu-url">{item.url || '/'}</p>
                        </div>
                    </div>
                    <div className="menu-item-tree-actions">
                        <button
                            onClick={() => handleToggleStatus(item.id, item.status)}
                            className={`btn-status ${item.status === 'active' ? 'active' : 'inactive'}`}
                            title={item.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                            {item.status === 'active' ? <FiEye /> : <FiEyeOff />}
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => {
                                setEditingItem(item);
                                setFormData({
                                    title: item.title,
                                    url: item.url,
                                    icon: item.icon || '',
                                    order: item.order || 0,
                                    parent_id: item.parent_id || null,
                                    target: item.target || '_self',
                                    status: item.status
                                });
                                setShowAddModal(true);
                            }}
                            title="Düzenle"
                        >
                            <FiEdit />
                        </button>
                        <button
                            className="btn-icon"
                            onClick={() => {
                                setEditingItem(null);
                                setFormData({
                                    title: '',
                                    url: '',
                                    icon: '',
                                    order: (item.order || 0) + 1,
                                    parent_id: item.id,
                                    target: '_self',
                                    status: 'active'
                                });
                                setShowAddModal(true);
                            }}
                            title="Alt Menü Ekle"
                        >
                            <FiPlus />
                        </button>
                        <button
                            className="btn-icon btn-danger"
                            onClick={() => handleDelete(item.id)}
                            title="Sil"
                        >
                            <FiTrash2 />
                        </button>
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="menu-item-tree-children">
                        {item.children.map(child => renderMenuItem(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-menus-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-menus-page">
                <div className="admin-header-minimal">
                    <div>
                        <h1 className="page-title-advanced">
                            {menuType === 'header' ? 'Header Menü' : menuType === 'footer' ? 'Footer Menü' : 'Kurumsal Menü'} Yönetimi
                        </h1>
                        <p className="page-subtitle-advanced">Menü öğelerini sürükleyip bırakarak düzenleyin</p>
                        {menuType === 'header' && (
                            <div className="menus-info-banner">
                                Not: Sitedeki ana menü (Ana Sayfa/Projeler/Blog/İletişim) sabit. Dinamik sayfalar için <b>Kurumsal Menü</b> bölümünü kullanın.
                            </div>
                        )}
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={loadMenuItems}>
                            <FiRefreshCw /> Yenile
                        </button>
                        {menuType === 'header' ? (
                            <button
                                className="btn-primary"
                                onClick={() => navigate('/admin/menus/corporate')}
                                title="Kurumsal menüyü yönet"
                            >
                                <FiMenu /> Kurumsal Menüyü Yönet
                            </button>
                        ) : (
                            <>
                                <button 
                                    className="btn-secondary" 
                                    onClick={() => setShowPagesModal(true)}
                                    title="Dinamik sayfaları menüye ekle"
                                >
                                    <FiFileText /> Sayfaları Ekle
                                </button>
                                <button className="btn-primary" onClick={() => {
                                    setEditingItem(null);
                                    setFormData({
                                        title: '',
                                        url: '',
                                        icon: '',
                                        order: menuItems.length,
                                        parent_id: null,
                                        target: '_self',
                                        status: 'active'
                                    });
                                    setShowAddModal(true);
                                }}>
                                    <FiPlus /> Yeni Öğe
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Arama */}
                {menuType !== 'header' && (
                    <div className="search-box-minimal">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Menü öğesi ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                {/* Header: sabit menü + kurumsal önizleme */}
                {menuType === 'header' && (
                    <div className="menus-header-preview-grid">
                        <div className="menus-preview-card">
                            <div className="menus-preview-title">
                                <FiLock /> Sabit Navbar Menüsü (Değişmez)
                            </div>
                            <div className="menus-preview-list">
                                {FIXED_HEADER_ITEMS.map((it, idx) => (
                                    <div
                                        className={`menus-preview-row draggable ${dragFixedKey === it.key ? 'dragging' : ''}`}
                                        key={it.key}
                                        draggable
                                        onDragStart={() => setDragFixedKey(it.key)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={() => {
                                            if (!dragFixedKey || dragFixedKey === it.key) return;
                                            const next = [...fixedOrder];
                                            const from = next.indexOf(dragFixedKey);
                                            const to = next.indexOf(it.key);
                                            if (from === -1 || to === -1) return;
                                            next.splice(from, 1);
                                            next.splice(to, 0, dragFixedKey);
                                            setFixedOrder(next);
                                            setDragFixedKey(null);
                                            saveFixedOrder(next);
                                        }}
                                        onDragEnd={() => setDragFixedKey(null)}
                                    >
                                        <div className="menus-preview-left">
                                            <span className="menus-preview-icon">{it.icon}</span>
                                            <span className="menus-preview-name">{it.title}</span>
                                        </div>
                                        <span className="menus-preview-url">{it.url}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="menus-preview-card">
                            <div className="menus-preview-title">
                                <FiMenu /> Kurumsal (Sitede Görünen)
                                <button className="btn-ghost" onClick={loadCorporatePreview} title="Yenile">
                                    <FiRefreshCw />
                                </button>
                            </div>

                            {corporateTreePreview.length === 0 ? (
                                <div className="menus-preview-empty">
                                    <div>Boş görünüyor.</div>
                                    <div className="muted">`/api/menus/corporate` → {JSON.stringify({ items: [] })}</div>
                                    <button className="btn-primary btn-sm" onClick={() => navigate('/admin/menus/corporate')}>
                                        <FiPlus /> Kurumsal Menüye Öğe Ekle
                                    </button>
                                </div>
                            ) : (
                                <div className="menu-tree-container compact">
                                    {corporateTreePreview.map(item => renderMenuItem(item))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="menu-tree-container">
                    {treeItems.length > 0 ? (
                        treeItems.map(item => renderMenuItem(item))
                    ) : (
                        <div className="empty-state-minimal">
                            <FiMenu />
                            <p>Menü öğesi bulunamadı</p>
                            <div className="empty-state-actions">
                                <button className="btn-primary" onClick={() => setShowPagesModal(true)}>
                                    <FiFileText /> Sayfaları Ekle
                                </button>
                                <button className="btn-secondary" onClick={() => {
                                    setEditingItem(null);
                                    setFormData({
                                        title: '',
                                        url: '',
                                        icon: '',
                                        order: 0,
                                        parent_id: null,
                                        target: '_self',
                                        status: 'active'
                                    });
                                    setShowAddModal(true);
                                }}>
                                    <FiPlus /> İlk Menü Öğesini Ekle
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dinamik Sayfalar Modal */}
                {showPagesModal && (
                    <div className="modal-overlay" onClick={() => setShowPagesModal(false)}>
                        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Dinamik Sayfalar</h2>
                                <button className="btn-icon" onClick={() => setShowPagesModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="pages-list-modal">
                                    {pages.length === 0 ? (
                                        <div className="empty-state-minimal">
                                            <FiFileText />
                                            <p>Henüz aktif sayfa yok</p>
                                        </div>
                                    ) : (
                                        pages.map(page => {
                                            const isInMenu = menuItems.some(m => m.url === `/${page.slug}`);
                                            return (
                                                <div key={page.id} className={`page-item-card ${isInMenu ? 'in-menu' : ''}`}>
                                                    <div className="page-item-info">
                                                        <h3>{page.title}</h3>
                                                        <p className="page-slug">/{page.slug}</p>
                                                    </div>
                                                    <div className="page-item-actions">
                                                        {isInMenu ? (
                                                            <span className="badge badge-success">Menüde</span>
                                                        ) : (
                                                            <button
                                                                className="btn-primary btn-sm"
                                                                onClick={() => handleAddPageToMenu(page)}
                                                            >
                                                                <FiPlus /> Menüye Ekle
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowPagesModal(false)}>
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingItem ? 'Menü Öğesi Düzenle' : 'Yeni Menü Öğesi'}</h2>
                                <button className="btn-icon" onClick={() => setShowAddModal(false)}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Başlık *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ana Sayfa"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>URL *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        placeholder="/"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>İkon Seç</label>

                                    <div className="icon-picker-row">
                                        <button
                                            type="button"
                                            className="icon-picker-toggle"
                                            onClick={() => setShowIconPicker(v => !v)}
                                        >
                                            <span className="icon-preview">
                                                {getIconPreview(formData.icon)}
                                            </span>
                                            <span className="icon-picker-text">
                                                {formData.icon ? `Seçili: ${formData.icon}` : 'İkon seçmek için tıkla'}
                                            </span>
                                            <FiChevronDown className={`icon-picker-arrow ${showIconPicker ? 'open' : ''}`} />
                                        </button>
                                        <button
                                            type="button"
                                            className="icon-picker-clear"
                                            onClick={() => setFormData({ ...formData, icon: '' })}
                                            title="İkonu temizle"
                                        >
                                            <FiX />
                                        </button>
                                    </div>

                                    {showIconPicker && (
                                        <div className="icon-picker-panel">
                                            <div className="icon-picker-search">
                                                <FiSearch />
                                                <input
                                                    type="text"
                                                    placeholder="İkon ara (örn: Home, Mail...)"
                                                    value={iconSearch}
                                                    onChange={(e) => setIconSearch(e.target.value)}
                                                />
                                            </div>

                                            <div className="icon-grid">
                                                {ICONS
                                                    .filter(n => !iconSearch || n.toLowerCase().includes(iconSearch.toLowerCase()))
                                                    .map((name) => {
                                                        const Cmp = FiIcons[name] || FiIcons.FiLink;
                                                        const selected = formData.icon === name;
                                                        return (
                                                            <button
                                                                key={name}
                                                                type="button"
                                                                className={`icon-item ${selected ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, icon: name });
                                                                    setShowIconPicker(false);
                                                                    setIconSearch('');
                                                                }}
                                                                title={name}
                                                            >
                                                                <Cmp />
                                                                <span className="icon-name">{name.replace('Fi', '')}</span>
                                                            </button>
                                                        );
                                                    })}
                                            </div>

                                            <div className="icon-picker-hint">
                                                İstersen emoji de yazabilirsin:
                                                <input
                                                    type="text"
                                                    className="emoji-input"
                                                    value={/[\u{1F300}-\u{1F9FF}]/u.test(formData.icon) ? formData.icon : ''}
                                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                                    placeholder="örn: 🏢"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Üst Menü</label>
                                        <select
                                            value={formData.parent_id || ''}
                                            onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                                        >
                                            <option value="">Ana Menü (Üst Menü Yok)</option>
                                            {menuItems
                                                .filter(item => !item.parent_id || item.id !== editingItem?.id)
                                                .map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.title}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Hedef</label>
                                        <select
                                            value={formData.target}
                                            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                        >
                                            <option value="_self">Aynı Sekme</option>
                                            <option value="_blank">Yeni Sekme</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Durum</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Pasif</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
                                    İptal
                                </button>
                                <button className="btn-primary" onClick={handleSave}>
                                    <FiSave /> Kaydet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminMenus;
