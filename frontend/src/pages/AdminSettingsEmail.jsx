import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiSave, FiRefreshCw, FiMail, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import './AdminSettingsEmail.css';

const AdminSettingsEmail = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' veya 'templates'
    const [templates, setTemplates] = useState([]);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        subject: '',
        body: ''
    });
    const [formData, setFormData] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        smtpSecure: false,
        fromEmail: '',
        fromName: ''
    });

    // Email Şablonları İşlemleri - useEffect'ten ÖNCE tanımlanmalı
    const loadTemplates = useCallback(async () => {
        try {
            setTemplatesLoading(true);
            const response = await api.get('/admin/settings/email/templates');
            setTemplates(response.data.templates || []);
        } catch (error) {
            console.error('Templates load error:', error);
        } finally {
            setTemplatesLoading(false);
        }
    }, []);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/settings/email');
            if (response.data) {
                setFormData(prev => ({ ...prev, ...response.data }));
            }
        } catch (error) {
            console.error('Settings load error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
        if (activeTab === 'templates') {
            loadTemplates();
        }
    }, [activeTab, loadSettings, loadTemplates]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.put('/admin/settings/email', formData);
            alert('Ayarlar başarıyla kaydedildi!');
        } catch (error) {
            console.error('Settings save error:', error);
            alert('Ayarlar kaydedilirken hata oluştu!');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTemplateSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (editingTemplate) {
                await api.put(`/admin/settings/email/templates/${editingTemplate.id}`, templateForm);
            } else {
                await api.post('/admin/settings/email/templates', templateForm);
            }
            alert('Şablon başarıyla kaydedildi!');
            setShowTemplateModal(false);
            setEditingTemplate(null);
            setTemplateForm({ name: '', subject: '', body: '' });
            loadTemplates();
        } catch (error) {
            console.error('Template save error:', error);
            alert('Şablon kaydedilirken hata oluştu!');
        } finally {
            setSaving(false);
        }
    };

    const handleEditTemplate = (template) => {
        setEditingTemplate(template);
        setTemplateForm({
            name: template.name,
            subject: template.subject || '',
            body: template.body || ''
        });
        setShowTemplateModal(true);
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
            return;
        }
        try {
            await api.delete(`/admin/settings/email/templates/${id}`);
            alert('Şablon silindi!');
            loadTemplates();
        } catch (error) {
            console.error('Template delete error:', error);
            alert('Şablon silinirken hata oluştu!');
        }
    };

    const openNewTemplateModal = () => {
        setEditingTemplate(null);
        setTemplateForm({ name: '', subject: '', body: '' });
        setShowTemplateModal(true);
    };

    const closeTemplateModal = () => {
        setShowTemplateModal(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', subject: '', body: '' });
    };

    // Değişken listesi ve açıklamaları
    const templateVariables = [
        {
            category: 'Kullanıcı Bilgileri',
            variables: [
                { name: 'user_name', description: 'Kullanıcının adı' },
                { name: 'user_email', description: 'Kullanıcının e-posta adresi' },
                { name: 'user_phone', description: 'Kullanıcının telefon numarası' },
                { name: 'user_id', description: 'Kullanıcı ID numarası' }
            ]
        },
        {
            category: 'Sipariş Bilgileri',
            variables: [
                { name: 'order_number', description: 'Sipariş numarası' },
                { name: 'order_total', description: 'Sipariş toplam tutarı' },
                { name: 'order_date', description: 'Sipariş tarihi' },
                { name: 'order_status', description: 'Sipariş durumu' },
                { name: 'order_status_message', description: 'Sipariş durum mesajı' },
                { name: 'order_items', description: 'Sipariş kalemleri listesi' },
                { name: 'order_link', description: 'Sipariş detay sayfası linki' },
                { name: 'currency', description: 'Para birimi (TRY, USD vb.)' }
            ]
        },
        {
            category: 'Site Bilgileri',
            variables: [
                { name: 'site_name', description: 'Site adı' },
                { name: 'site_url', description: 'Site URL adresi' },
                { name: 'site_email', description: 'Site iletişim e-postası' },
                { name: 'site_phone', description: 'Site telefon numarası' }
            ]
        },
        {
            category: 'Linkler',
            variables: [
                { name: 'reset_link', description: 'Şifre sıfırlama linki' },
                { name: 'verification_link', description: 'E-posta doğrulama linki' },
                { name: 'login_link', description: 'Giriş sayfası linki' },
                { name: 'dashboard_link', description: 'Kullanıcı paneli linki' }
            ]
        },
        {
            category: 'Tarih ve Zaman',
            variables: [
                { name: 'registration_date', description: 'Kayıt tarihi' },
                { name: 'current_date', description: 'Mevcut tarih' },
                { name: 'current_time', description: 'Mevcut saat' }
            ]
        },
        {
            category: 'Abonelik Bilgileri',
            variables: [
                { name: 'subscription_plan', description: 'Abonelik planı adı' },
                { name: 'subscription_expires', description: 'Abonelik bitiş tarihi' },
                { name: 'subscription_status', description: 'Abonelik durumu' }
            ]
        }
    ];

    const insertVariable = (variableName) => {
        const variable = `{{${variableName}}}`;
        
        // Textarea referansını al
        setTimeout(() => {
            const textarea = document.querySelector('.template-form textarea[name="body"]') || 
                            document.querySelector('.template-form textarea');
            
            if (textarea) {
                const start = textarea.selectionStart || templateForm.body.length;
                const end = textarea.selectionEnd || templateForm.body.length;
                const text = templateForm.body;
                const before = text.substring(0, start);
                const after = text.substring(end);
                const newText = before + variable + after;
                
                setTemplateForm(prev => ({ ...prev, body: newText }));
                
                // Cursor pozisyonunu ayarla
                setTimeout(() => {
                    textarea.focus();
                    const newCursorPos = start + variable.length;
                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                }, 10);
            } else {
                // Fallback: textarea bulunamazsa sadece sona ekle
                setTemplateForm(prev => ({ 
                    ...prev, 
                    body: prev.body + (prev.body ? ' ' : '') + variable 
                }));
            }
        }, 0);
    };

    // Önceden tanımlı şablonlar
    const predefinedTemplates = [
        {
            name: 'Kayıt Olunduğunda',
            subject: 'Hoş Geldiniz!',
            body: `Merhaba {{user_name}},

Hesabınız başarıyla oluşturuldu. Hoş geldiniz!

E-posta: {{user_email}}
Kayıt Tarihi: {{registration_date}}

Sitemizi keşfetmek için: {{site_url}}

İyi günler,
{{site_name}}`
        },
        {
            name: 'Sipariş Alındığında',
            subject: 'Siparişiniz Alındı',
            body: `Merhaba {{user_name}},

Siparişiniz başarıyla alındı.

Sipariş No: {{order_number}}
Tarih: {{order_date}}
Toplam: {{order_total}} {{currency}}

Sipariş Detayları:
{{order_items}}

Siparişinizi takip etmek için: {{order_link}}

Teşekkürler,
{{site_name}}`
        },
        {
            name: 'Şifre Sıfırlama',
            subject: 'Şifre Sıfırlama',
            body: `Merhaba {{user_name}},

Şifre sıfırlama talebiniz alındı. Aşağıdaki linke tıklayarak yeni şifrenizi belirleyebilirsiniz:

{{reset_link}}

Bu link 1 saat geçerlidir.

Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin.

İyi günler,
{{site_name}}`
        },
        {
            name: 'Sipariş Durumu Güncellendi',
            subject: 'Sipariş Durumu Güncellendi',
            body: `Merhaba {{user_name}},

Siparişinizin durumu güncellendi.

Sipariş No: {{order_number}}
Yeni Durum: {{order_status}}

{{order_status_message}}

Siparişinizi görüntülemek için: {{order_link}}

Teşekkürler,
{{site_name}}`
        }
    ];

    const createPredefinedTemplate = async (template) => {
        try {
            setSaving(true);
            await api.post('/admin/settings/email/templates', template);
            alert('Şablon oluşturuldu!');
            loadTemplates();
        } catch (error) {
            console.error('Create predefined template error:', error);
            alert('Şablon oluşturulurken hata oluştu!');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-settings-email-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-settings-email-page">
                <div className="admin-header-advanced">
                    <div>
                        <h1 className="page-title-advanced">Mail Ayarları</h1>
                        <p className="page-subtitle-advanced">E-posta gönderim ayarlarını ve şablonlarını yönetin</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-refresh" onClick={activeTab === 'settings' ? loadSettings : loadTemplates}>
                            <FiRefreshCw /> Yenile
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="email-tabs">
                    <button 
                        className={`email-tab ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <FiMail /> SMTP Ayarları
                    </button>
                    <button 
                        className={`email-tab ${activeTab === 'templates' ? 'active' : ''}`}
                        onClick={() => setActiveTab('templates')}
                    >
                        <FiMail /> E-posta Şablonları
                    </button>
                </div>

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                <form onSubmit={handleSubmit} className="settings-form-minimal">
                    <div className="form-section-minimal">
                        <h3>SMTP Ayarları</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>SMTP Host *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.smtpHost}
                                    onChange={(e) => handleChange('smtpHost', e.target.value)}
                                    placeholder="smtp.gmail.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>SMTP Port *</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="65535"
                                    value={formData.smtpPort}
                                    onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                                    placeholder="587"
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>SMTP Kullanıcı Adı *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.smtpUser}
                                    onChange={(e) => handleChange('smtpUser', e.target.value)}
                                    placeholder="kullanici@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>SMTP Şifre *</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.smtpPassword}
                                    onChange={(e) => handleChange('smtpPassword', e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.smtpSecure}
                                    onChange={(e) => handleChange('smtpSecure', e.target.checked)}
                                />
                                <span>TLS/SSL kullan (Port 465 için)</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-section-minimal">
                        <h3>Gönderen Bilgileri</h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Gönderen E-posta *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.fromEmail}
                                    onChange={(e) => handleChange('fromEmail', e.target.value)}
                                    placeholder="noreply@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Gönderen İsim</label>
                                <input
                                    type="text"
                                    value={formData.fromName}
                                    onChange={(e) => handleChange('fromName', e.target.value)}
                                    placeholder="Site Adı"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions-minimal">
                        <button type="button" className="btn-test" onClick={() => alert('Test e-postası gönderilecek (henüz implement edilmedi)')}>
                            Test E-postası Gönder
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            <FiSave /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
                )}

                {/* Templates Tab */}
                {activeTab === 'templates' && (
                    <div className="templates-section">
                        <div className="templates-header">
                            <h3>E-posta Şablonları</h3>
                            <button className="btn-add-template" onClick={openNewTemplateModal}>
                                <FiPlus /> Yeni Şablon
                            </button>
                        </div>

                        {/* Önceden Tanımlı Şablonlar */}
                        {templates.length === 0 && !templatesLoading && (
                            <div className="predefined-templates">
                                <h4>Hızlı Başlangıç Şablonları</h4>
                                <p className="predefined-templates-desc">Aşağıdaki şablonları kullanarak hızlıca başlayabilirsiniz:</p>
                                <div className="predefined-templates-grid">
                                    {predefinedTemplates.map((template, index) => (
                                        <div key={index} className="predefined-template-card">
                                            <h5>{template.name}</h5>
                                            <p className="template-subject">{template.subject}</p>
                                            <button 
                                                className="btn-use-template"
                                                onClick={() => createPredefinedTemplate(template)}
                                                disabled={saving}
                                            >
                                                Kullan
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Şablonlar Listesi */}
                        {templatesLoading ? (
                            <div className="loading-container">
                                <div className="spinner-large"></div>
                            </div>
                        ) : (
                            <div className="templates-list">
                                {templates.map((template) => (
                                    <div key={template.id} className="template-card">
                                        <div className="template-card-header">
                                            <h4>{template.name}</h4>
                                            <div className="template-actions">
                                                <button 
                                                    className="btn-edit-template"
                                                    onClick={() => handleEditTemplate(template)}
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button 
                                                    className="btn-delete-template"
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="template-card-body">
                                            <p className="template-subject-label">Konu:</p>
                                            <p className="template-subject-value">{template.subject || 'Konu belirtilmemiş'}</p>
                                            <p className="template-body-preview">
                                                {template.body ? (template.body.length > 150 ? template.body.substring(0, 150) + '...' : template.body) : 'İçerik yok'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <div className="empty-templates">
                                        <p>Henüz şablon eklenmemiş. Yeni şablon ekleyin veya hızlı başlangıç şablonlarını kullanın.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Template Modal */}
                {showTemplateModal && (
                    <div className="modal-overlay" onClick={closeTemplateModal}>
                        <div className="modal-content-with-sidebar" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingTemplate ? 'Şablon Düzenle' : 'Yeni Şablon'}</h3>
                                <button className="modal-close" onClick={closeTemplateModal}>
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body-with-sidebar">
                                <div className="modal-main-content">
                                    <form onSubmit={handleTemplateSubmit} className="template-form">
                                        <div className="form-group">
                                            <label>Şablon Adı *</label>
                                            <input
                                                type="text"
                                                required
                                                value={templateForm.name}
                                                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="Örn: Kayıt Olunduğunda"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>E-posta Konusu *</label>
                                            <input
                                                type="text"
                                                required
                                                value={templateForm.subject}
                                                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject: e.target.value }))}
                                                placeholder="Örn: Hoş Geldiniz!"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>E-posta İçeriği *</label>
                                            <textarea
                                                name="body"
                                                required
                                                rows="12"
                                                value={templateForm.body}
                                                onChange={(e) => setTemplateForm(prev => ({ ...prev, body: e.target.value }))}
                                                placeholder="E-posta içeriğini buraya yazın. Değişkenler için sağdaki panelden seçebilirsiniz."
                                            />
                                        </div>
                                        <div className="modal-actions">
                                            <button type="button" className="btn-cancel" onClick={closeTemplateModal}>
                                                İptal
                                            </button>
                                            <button type="submit" className="btn-save" disabled={saving}>
                                                <FiSave /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="modal-variables-sidebar">
                                    <h4>Kullanılabilir Değişkenler</h4>
                                    <p className="variables-help-text">Değişkenleri eklemek için tıklayın</p>
                                    {templateVariables.map((category, catIndex) => (
                                        <div key={catIndex} className="variable-category">
                                            <h5>{category.category}</h5>
                                            <div className="variable-list">
                                                {category.variables.map((variable, varIndex) => (
                                                    <button
                                                        key={varIndex}
                                                        type="button"
                                                        className="variable-item"
                                                        onClick={() => insertVariable(variable.name)}
                                                        title={variable.description}
                                                    >
                                                        <code>{`{{${variable.name}}}`}</code>
                                                        <span className="variable-description">{variable.description}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminSettingsEmail;

