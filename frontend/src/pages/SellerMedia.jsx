import { useState, useEffect } from 'react';
import SellerLayout from '../components/SellerLayout';
import { sellerAPI } from '../api/seller';
import {
    FiUpload, FiTrash2, FiDownload, FiFile, FiSearch, FiFilter,
    FiX, FiFileText, FiBook, FiCode, FiFolder, FiImage
} from 'react-icons/fi';
import './SellerMedia.css';

const SellerMedia = () => {
    const [media, setMedia] = useState([]);
    const [projects, setProjects] = useState([]);
    const [categories] = useState([
        { value: 'manual', label: 'Kullanım Kılavuzu', icon: FiBook },
        { value: 'documentation', label: 'Dokümantasyon', icon: FiFileText },
        { value: 'source', label: 'Kaynak Kod', icon: FiCode },
        { value: 'other', label: 'Diğer', icon: FiFolder }
    ]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadData, setUploadData] = useState({
        project_id: '',
        category: 'other',
        description: '',
        url: ''
    });

    useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        try {
            setLoading(true);
            const response = await sellerAPI.getMedia();
            console.log('Media API response:', response.data);
            setMedia(response.data.media || []);
            const projectsData = response.data.projects || [];
            console.log('Projects loaded:', projectsData);
            setProjects(projectsData);
        } catch (error) {
            console.error('Media load error:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file);
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                alert('Dosya boyutu 50MB\'dan büyük olamaz!');
                e.target.value = ''; // Input'u temizle
                return;
            }
            setUploadFile(file);
            console.log('Upload file set:', file.name);
        } else {
            setUploadFile(null);
        }
    };

    const handleUpload = async () => {
        if (!uploadFile) {
            alert('Lütfen bir dosya seçin');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', uploadFile);
            if (uploadData.project_id) formData.append('project_id', uploadData.project_id);
            formData.append('category', uploadData.category);
            if (uploadData.description) formData.append('description', uploadData.description);
            if (uploadData.url) formData.append('url', uploadData.url);

            const response = await sellerAPI.uploadMedia(uploadFile, formData);
            setShowUploadModal(false);
            setUploadFile(null);
            setUploadData({ project_id: '', category: 'other', description: '', url: '' });
            loadMedia();
            const message = response.data?.message || 'Dosya başarıyla yüklendi';
            alert(message);
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Upload error details:', error.response?.data);
            const errorMessage = error.response?.data?.error || error.response?.data?.details || error.message || 'Dosya yükleme hatası';
            alert(`Hata: ${errorMessage}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id, fileName) => {
        if (!window.confirm(`"${fileName}" dosyasını silmek istediğinize emin misiniz?`)) {
            return;
        }

        try {
            await sellerAPI.deleteMedia(id);
            loadMedia();
            alert('Dosya başarıyla silindi');
        } catch (error) {
            console.error('Delete error:', error);
            alert(error.response?.data?.error || 'Dosya silme hatası');
        }
    };

    const handleDownload = async (id, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/seller/media/${id}/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                loadMedia();
            } else {
                alert('Dosya indirme hatası');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Dosya indirme hatası');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getFileIcon = (fileType) => {
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (imageTypes.includes(fileType)) return <FiImage className="file-icon" />;
        return <FiFile className="file-icon" />;
    };

    const getCategoryIcon = (category) => {
        const cat = categories.find(c => c.value === category);
        return cat ? <cat.icon className="category-icon" /> : <FiFolder className="category-icon" />;
    };

    const filteredMedia = media.filter(item => {
        if (selectedProject && item.project_id !== parseInt(selectedProject)) return false;
        if (selectedCategory && item.category !== selectedCategory) return false;
        if (searchTerm && !item.file_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !(item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))) {
            return false;
        }
        return true;
    });

    if (loading) {
        return (
            <SellerLayout>
                <div className="seller-media-page">
                    <div className="loading-container">
                        <div className="spinner-large"></div>
                        <p>Yükleniyor...</p>
                    </div>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="seller-media-page">
                <div className="media-header">
                    <div className="header-content">
                        <h1 className="page-title">Medya Kütüphanesi</h1>
                        <p className="page-subtitle">Projeleriniz için indirilebilir ekleri yönetin</p>
                    </div>
                    <button className="btn-upload" onClick={() => {
                        setUploadFile(null);
                        setUploadData({ project_id: '', category: 'other', description: '', url: '' });
                        setShowUploadModal(true);
                    }}>
                        <FiUpload /> Yeni Dosya Yükle
                    </button>
                </div>

                <div className="media-filters">
                    <div className="filter-group">
                        <FiSearch className="filter-icon" />
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="Dosya ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-group">
                        <FiFilter className="filter-icon" />
                        <select
                            className="filter-select"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            <option value="">Tüm Projeler</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <select
                            className="filter-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">Tüm Kategoriler</option>
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    {(selectedProject || selectedCategory || searchTerm) && (
                        <button
                            className="btn-clear-filters"
                            onClick={() => {
                                setSelectedProject('');
                                setSelectedCategory('');
                                setSearchTerm('');
                            }}
                        >
                            <FiX /> Temizle
                        </button>
                    )}
                </div>

                <div className="media-grid">
                    {filteredMedia.length > 0 ? (
                        filteredMedia.map(item => (
                            <div key={item.id} className="media-card">
                                <div className="media-card-header">
                                    {getFileIcon(item.file_type)}
                                    <div className="media-card-actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => handleDownload(item.id, item.file_name)}
                                            title="İndir"
                                        >
                                            <FiDownload />
                                        </button>
                                        <button
                                            className="btn-icon btn-danger"
                                            onClick={() => handleDelete(item.id, item.file_name)}
                                            title="Sil"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                                <div className="media-card-body">
                                    <h3 className="media-file-name" title={item.file_name}>
                                        {item.file_name}
                                    </h3>
                                    <div className="media-meta">
                                        <span className="media-category">
                                            {getCategoryIcon(item.category)}
                                            {categories.find(c => c.value === item.category)?.label || 'Diğer'}
                                        </span>
                                        <span className="media-size">{formatFileSize(item.file_size)}</span>
                                    </div>
                                    {item.project_title ? (
                                        <div className="media-project">
                                            <FiFolder className="project-icon" />
                                            {item.project_title}
                                        </div>
                                    ) : (
                                        <div className="media-project media-project-global">
                                            <FiFolder className="project-icon" />
                                            Tüm Projeler
                                        </div>
                                    )}
                                    {item.description && (
                                        <p className="media-description">{item.description}</p>
                                    )}
                                    {item.url && (
                                        <div className="media-url">
                                            <a 
                                                href={item.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="url-link"
                                            >
                                                🔗 {item.url.length > 40 ? item.url.substring(0, 40) + '...' : item.url}
                                            </a>
                                        </div>
                                    )}
                                    <div className="media-footer">
                                        <span className="media-date">
                                            {new Date(item.created_at).toLocaleDateString('tr-TR')}
                                        </span>
                                        <span className="media-downloads">
                                            <FiDownload className="download-icon" />
                                            {item.download_count || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <FiFile className="empty-icon" />
                            <h3>Dosya Bulunamadı</h3>
                            <p>Henüz dosya yüklenmemiş veya filtre kriterlerinize uygun dosya yok.</p>
                            <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
                                <FiUpload /> İlk Dosyayı Yükle
                            </button>
                        </div>
                    )}
                </div>

                {showUploadModal && (
                    <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Yeni Dosya Yükle</h2>
                                <button
                                    className="btn-close"
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Dosya Seç *</label>
                                    <input
                                        type="file"
                                        className="file-input"
                                        onChange={handleFileSelect}
                                        disabled={uploading}
                                        accept=".pdf,.doc,.docx,.zip,.rar,.txt,.md,.rtf,.odt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
                                    />
                                    {uploadFile ? (
                                        <div className="file-preview">
                                            <FiFile className="file-preview-icon" />
                                            <span>{uploadFile.name}</span>
                                            <span className="file-preview-size">
                                                ({formatFileSize(uploadFile.size)})
                                            </span>
                                            <button
                                                type="button"
                                                className="file-remove-btn"
                                                onClick={() => {
                                                    setUploadFile(null);
                                                    const fileInput = document.querySelector('.file-input');
                                                    if (fileInput) fileInput.value = '';
                                                }}
                                                disabled={uploading}
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                    ) : (
                                        <small className="form-hint" style={{ display: 'block', marginTop: '0.5rem', color: '#64748b' }}>
                                            PDF, DOC, DOCX, ZIP, RAR, TXT, MD, RTF, ODT, XLS, XLSX, PPT, PPTX veya resim dosyaları (Max: 50MB)
                                        </small>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label>Proje Seçimi</label>
                                    <select
                                        className="form-input"
                                        value={uploadData.project_id}
                                        onChange={(e) => setUploadData({ ...uploadData, project_id: e.target.value })}
                                        disabled={uploading}
                                    >
                                        <option value="">📚 Tüm Yayınlanmış Projelere Ekle (Genel Kütüphane)</option>
                                        {projects && projects.length > 0 ? (
                                            projects.map(project => (
                                                <option key={project.id} value={project.id}>📦 {project.title} (Sadece Bu Projeye)</option>
                                            ))
                                        ) : (
                                            <option value="" disabled>Proje bulunamadı</option>
                                        )}
                                    </select>
                                    {projects && projects.length === 0 && (
                                        <small className="form-hint" style={{ color: '#dc2626', marginTop: '0.5rem', display: 'block' }}>
                                            Henüz yayınlanmış projeniz bulunmuyor. Önce bir proje oluşturup yayınlamanız gerekiyor.
                                        </small>
                                    )}
                                    <div className="form-hint-box">
                                        {uploadData.project_id ? (
                                            <div className="hint-item hint-specific">
                                                <span className="hint-icon">✓</span>
                                                <span>Dosya sadece <strong>{projects.find(p => p.id === parseInt(uploadData.project_id))?.title}</strong> projesine eklenecek</span>
                                            </div>
                                        ) : (
                                            <div className="hint-item hint-global">
                                                <span className="hint-icon">📚</span>
                                                <span>Dosya <strong>tüm yayınlanmış projelerinize</strong> otomatik olarak eklenecek</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Kategori *</label>
                                    <select
                                        className="form-input"
                                        value={uploadData.category}
                                        onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                                        disabled={uploading}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Açıklama (Opsiyonel)</label>
                                    <textarea
                                        className="form-input"
                                        rows="3"
                                        value={uploadData.description}
                                        onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                        placeholder="Dosya hakkında kısa açıklama..."
                                        disabled={uploading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>URL (Opsiyonel)</label>
                                    <input
                                        type="url"
                                        className="form-input"
                                        value={uploadData.url}
                                        onChange={(e) => setUploadData({ ...uploadData, url: e.target.value })}
                                        placeholder="https://example.com/dokuman.pdf"
                                        disabled={uploading}
                                    />
                                    <small className="form-hint">
                                        Dosya harici bir URL'de ise buraya ekleyin (ör: Google Drive, Dropbox linki)
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn-secondary"
                                    onClick={() => setShowUploadModal(false)}
                                    disabled={uploading}
                                >
                                    İptal
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleUpload}
                                    disabled={uploading || !uploadFile}
                                >
                                    {uploading ? 'Yükleniyor...' : 'Yükle'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SellerLayout>
    );
};

export default SellerMedia;
