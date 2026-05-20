import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import api from '../api/axios';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCreditCard, FiCheckCircle } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import './AdminBankAccounts.css';

const AdminBankAccounts = () => {
    const { t } = useLanguage();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        bank_name: '',
        iban: '',
        account_holder: '',
        account_number: '',
        branch_name: '',
        swift_code: '',
        currency: 'TRY',
        is_active: true,
        sort_order: 0
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/bank-accounts');
            setAccounts(response.data.accounts || []);
        } catch (error) {
            console.error('Load bank accounts error:', error);
            alert('Banka hesapları yüklenirken hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setFormData({
            bank_name: '',
            iban: '',
            account_holder: '',
            account_number: '',
            branch_name: '',
            swift_code: '',
            currency: 'TRY',
            is_active: true,
            sort_order: accounts.length
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleEdit = (account) => {
        // IBAN'ı formatla (boşluklu göster)
        const formattedIban = account.iban ? formatIBAN(account.iban.replace(/\s/g, '')) : '';
        
        setFormData({
            bank_name: account.bank_name || '',
            iban: formattedIban,
            account_holder: account.account_holder || '',
            account_number: account.account_number || '',
            branch_name: account.branch_name || '',
            swift_code: account.swift_code || '',
            currency: account.currency || 'TRY',
            is_active: account.is_active === 1 || account.is_active === true,
            sort_order: account.sort_order || 0
        });
        setEditingId(account.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu banka hesabını silmek istediğinize emin misiniz?')) {
            return;
        }

        try {
            await api.delete(`/admin/bank-accounts/${id}`);
            alert('Banka hesabı silindi');
            loadAccounts();
        } catch (error) {
            console.error('Delete bank account error:', error);
            alert(error.response?.data?.error || 'Banka hesabı silinirken hata oluştu');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.bank_name || !formData.iban || !formData.account_holder) {
            alert('Banka adı, IBAN ve hesap sahibi zorunludur');
            return;
        }

        try {
            // IBAN'dan boşlukları temizle (veritabanına kaydederken)
            const cleanedData = {
                ...formData,
                iban: formData.iban.replace(/\s/g, '').toUpperCase(),
                swift_code: formData.swift_code ? formData.swift_code.replace(/\s/g, '').toUpperCase() : null
            };

            if (editingId) {
                await api.put(`/admin/bank-accounts/${editingId}`, cleanedData);
                alert('Banka hesabı güncellendi');
            } else {
                await api.post('/admin/bank-accounts', cleanedData);
                alert('Banka hesabı eklendi');
            }
            setShowForm(false);
            setEditingId(null);
            loadAccounts();
        } catch (error) {
            console.error('Save bank account error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.details || 
                               error.response?.data?.error || 
                               error.message || 
                               'Banka hesabı kaydedilirken hata oluştu';
            alert(`Hata: ${errorMessage}`);
        }
    };

    // IBAN maskeleme fonksiyonu
    const formatIBAN = (value) => {
        // Sadece harf ve rakamları al
        let cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        
        // İlk 2 karakter harf olmalı (ülke kodu)
        if (cleaned.length > 0 && !/^[A-Z]{0,2}/.test(cleaned.slice(0, 2))) {
            cleaned = cleaned.slice(2);
        }
        
        // Maksimum 34 karakter (IBAN standardı)
        if (cleaned.length > 34) {
            cleaned = cleaned.slice(0, 34);
        }
        
        // Her 4 karakterden sonra boşluk ekle
        return cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    };

    // Hesap numarası maskeleme (sadece rakam)
    const formatAccountNumber = (value) => {
        return value.replace(/\D/g, '').slice(0, 20);
    };

    // SWIFT kodu maskeleme (8-11 karakter, harf ve rakam)
    const formatSWIFT = (value) => {
        return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 11);
    };

    const handleChange = (field, value) => {
        let processedValue = value;

        // Field'a göre maskeleme uygula
        if (field === 'iban') {
            processedValue = formatIBAN(value);
        } else if (field === 'account_number') {
            processedValue = formatAccountNumber(value);
        } else if (field === 'swift_code') {
            processedValue = formatSWIFT(value);
        }

        setFormData(prev => ({
            ...prev,
            [field]: processedValue
        }));
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-bank-accounts-page">
                    <div className="loading">Yükleniyor...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="admin-bank-accounts-page">
                <div className="page-header">
                    <h1>
                        <FiCreditCard /> Banka Hesapları Yönetimi
                    </h1>
                    <button className="btn-add" onClick={handleAdd}>
                        <FiPlus /> Yeni Hesap Ekle
                    </button>
                </div>

                {showForm && (
                    <div className="form-modal">
                        <div className="form-modal-content">
                            <div className="form-header">
                                <h2>{editingId ? 'Hesap Düzenle' : 'Yeni Hesap Ekle'}</h2>
                                <button className="btn-close" onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                }}>
                                    <FiX />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Banka Adı *</label>
                                        <input
                                            type="text"
                                            value={formData.bank_name}
                                            onChange={(e) => handleChange('bank_name', e.target.value)}
                                            required
                                            placeholder="Örn: Ziraat Bankası"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>IBAN *</label>
                                        <input
                                            type="text"
                                            value={formData.iban}
                                            onChange={(e) => handleChange('iban', e.target.value)}
                                            required
                                            placeholder="TR12 3456 7890 1234 5678 9012 34"
                                            maxLength={42}
                                            style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }}
                                        />
                                        <small className="form-hint">Format: TR12 3456 7890 1234 5678 9012 34</small>
                                    </div>

                                    <div className="form-group">
                                        <label>Hesap Sahibi *</label>
                                        <input
                                            type="text"
                                            value={formData.account_holder}
                                            onChange={(e) => handleChange('account_holder', e.target.value)}
                                            required
                                            placeholder="Örn: TeknoProje A.Ş."
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Hesap Numarası</label>
                                        <input
                                            type="text"
                                            value={formData.account_number}
                                            onChange={(e) => handleChange('account_number', e.target.value)}
                                            placeholder="12345678"
                                            maxLength={20}
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                        <small className="form-hint">Sadece rakam</small>
                                    </div>

                                    <div className="form-group">
                                        <label>Şube Adı</label>
                                        <input
                                            type="text"
                                            value={formData.branch_name}
                                            onChange={(e) => handleChange('branch_name', e.target.value)}
                                            placeholder="Opsiyonel"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>SWIFT Kodu</label>
                                        <input
                                            type="text"
                                            value={formData.swift_code}
                                            onChange={(e) => handleChange('swift_code', e.target.value)}
                                            placeholder="AKBKTRIS"
                                            maxLength={11}
                                            style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                                        />
                                        <small className="form-hint">8-11 karakter, harf ve rakam</small>
                                    </div>

                                    <div className="form-group">
                                        <label>Para Birimi</label>
                                        <select
                                            value={formData.currency}
                                            onChange={(e) => handleChange('currency', e.target.value)}
                                        >
                                            <option value="TRY">TRY - Türk Lirası</option>
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Sıralama</label>
                                        <input
                                            type="number"
                                            value={formData.sort_order}
                                            onChange={(e) => handleChange('sort_order', parseInt(e.target.value) || 0)}
                                            min="0"
                                        />
                                    </div>

                                    <div className="form-group checkbox-group">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => handleChange('is_active', e.target.checked)}
                                            />
                                            <span>Aktif</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn-save">
                                        <FiSave /> {editingId ? 'Güncelle' : 'Kaydet'}
                                    </button>
                                    <button type="button" className="btn-cancel" onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                    }}>
                                        <FiX /> İptal
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="accounts-table">
                    {accounts.length === 0 ? (
                        <div className="empty-state">
                            <FiCreditCard />
                            <p>Henüz banka hesabı eklenmemiş</p>
                            <button className="btn-add" onClick={handleAdd}>
                                <FiPlus /> İlk Hesabı Ekle
                            </button>
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Sıra</th>
                                    <th>Banka Adı</th>
                                    <th>IBAN</th>
                                    <th>Hesap Sahibi</th>
                                    <th>Para Birimi</th>
                                    <th>Durum</th>
                                    <th>İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map(account => (
                                    <tr key={account.id}>
                                        <td>{account.sort_order}</td>
                                        <td>{account.bank_name}</td>
                                        <td className="iban-cell">
                                            {account.iban ? formatIBAN(account.iban.replace(/\s/g, '')) : account.iban}
                                        </td>
                                        <td>{account.account_holder}</td>
                                        <td>{account.currency}</td>
                                        <td>
                                            <span className={`status-badge ${account.is_active ? 'active' : 'inactive'}`}>
                                                {account.is_active ? (
                                                    <>
                                                        <FiCheckCircle /> Aktif
                                                    </>
                                                ) : (
                                                    'Pasif'
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleEdit(account)}
                                                    title="Düzenle"
                                                >
                                                    <FiEdit2 />
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    onClick={() => handleDelete(account.id)}
                                                    title="Sil"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminBankAccounts;
