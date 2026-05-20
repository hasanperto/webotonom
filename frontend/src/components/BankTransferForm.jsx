import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { walletPaymentAPI } from '../api/walletPayment';
import {
    FiX, FiCreditCard, FiPhone, FiHome,
    FiCheck, FiCheckCircle, FiAlertCircle, FiUpload
} from 'react-icons/fi';
import './BankTransferForm.css';

const BankTransferForm = ({ paymentRequestId, amount, bonusAmount, totalAmount, referenceNumber, bankAccounts, onSuccess, onCancel }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        senderName: '',
        bankName: '',
        receiptImage: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const [copiedRef, setCopiedRef] = useState(false);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleReceiptUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert(t('bank_transfer.file_too_large') || 'File size must be less than 5MB');
            return;
        }

        setUploadingReceipt(true);
        try {
            // In a real scenario, upload to server
            // For now, create a data URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, receiptImage: reader.result }));
                setUploadingReceipt(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Receipt upload error:', error);
            setUploadingReceipt(false);
            alert(t('bank_transfer.upload_failed') || 'Failed to upload receipt');
        }
    };

    const handleSubmit = async () => {
        if (!formData.senderName || !formData.bankName) {
            alert(t('bank_transfer.fill_required') || 'Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await walletPaymentAPI.notifyBankTransfer({
                paymentRequestId,
                senderName: formData.senderName,
                bankName: formData.bankName,
                receiptImage: formData.receiptImage,
                notes: formData.notes
            });

            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Bank transfer notification error:', error);
            alert(t('bank_transfer.submit_failed') || 'Failed to submit notification');
        } finally {
            setSubmitting(false);
        }
    };

    const copyReferenceNumber = () => {
        navigator.clipboard.writeText(referenceNumber);
        setCopiedRef(true);
        setTimeout(() => setCopiedRef(false), 2000);
    };

    return (
        <div className="bank-transfer-form">
            {/* Reference Number */}
            <div className="reference-section">
                <div className="reference-badge">
                    <FiCheckCircle />
                    <span>{t('bank_transfer.reference_created') || 'Reference Number Created'}</span>
                </div>
                <div className="reference-number-display" onClick={copyReferenceNumber}>
                    <span className="reference-label">{t('bank_transfer.reference_number') || 'Reference Number'}:</span>
                    <span className="reference-value">{referenceNumber}</span>
                    <button className="copy-ref-btn">
                        {copiedRef ? <FiCheck /> : '📋'}
                    </button>
                </div>
                <p className="reference-hint">
                    <FiAlertCircle />
                    {t('bank_transfer.reference_hint') || 'Please include this reference number in your transfer description'}
                </p>
            </div>

            {/* Bank Accounts */}
            <div className="bank-accounts-section">
                <h4>{t('bank_transfer.our_accounts') || 'Our Bank Accounts'}</h4>
                <div className="bank-accounts-list">
                    {bankAccounts.map((account, index) => (
                        <div key={index} className="bank-account-card">
                            <div className="bank-name">
                                <FiHome />
                                <span>{account.bankName}</span>
                            </div>
                            <div className="account-details">
                                <div className="account-row">
                                    <span className="account-label">{t('bank_transfer.account_name') || 'Account Name'}:</span>
                                    <span className="account-value">{account.accountName}</span>
                                </div>
                                <div className="account-row">
                                    <span className="account-label">IBAN:</span>
                                    <span className="account-value iban">{account.iban}</span>
                                </div>
                                {account.accountNumber && (
                                    <div className="account-row">
                                        <span className="account-label">{t('bank_transfer.account_number') || 'Account Number'}:</span>
                                        <span className="account-value">{account.accountNumber}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Amount Summary */}
            <div className="transfer-amount-summary">
                <div className="summary-row">
                    <span>{t('payment.amount') || 'Amount'}:</span>
                    <span>{amount} TL</span>
                </div>
                {bonusAmount > 0 && (
                    <div className="summary-row bonus">
                        <span>{t('payment.bonus') || 'Bonus'}:</span>
                        <span>+{bonusAmount} TL</span>
                    </div>
                )}
                <div className="summary-row total">
                    <span>{t('payment.total') || 'Total'}:</span>
                    <span>{totalAmount} TL</span>
                </div>
            </div>

            {/* Notification Form */}
            <div className="notification-form">
                <h4>{t('bank_transfer.notify_title') || 'Notify Us After Transfer'}</h4>
                <p className="notify-desc">{t('bank_transfer.notify_desc') || 'Please fill in this form after completing the bank transfer'}</p>

                <div className="form-group">
                    <label>{t('bank_transfer.sender_name') || 'Sender Name'} *</label>
                    <input
                        type="text"
                        value={formData.senderName}
                        onChange={(e) => handleInputChange('senderName', e.target.value)}
                        placeholder={t('bank_transfer.sender_name_placeholder') || 'Full name as shown in bank'}
                    />
                </div>

                <div className="form-group">
                    <label>{t('bank_transfer.bank_name') || 'Bank Name'} *</label>
                    <select
                        value={formData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                    >
                        <option value="">{t('bank_transfer.select_bank') || 'Select your bank'}</option>
                        {bankAccounts.map((account, index) => (
                            <option key={index} value={account.bankName}>{account.bankName}</option>
                        ))}
                        <option value="other">{t('bank_transfer.other_bank') || 'Other Bank'}</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>{t('bank_transfer.receipt') || 'Transfer Receipt'} ({t('bank_transfer.optional') || 'Optional'})</label>
                    <div className="receipt-upload">
                        <input
                            type="file"
                            id="receipt-upload"
                            accept="image/*,application/pdf"
                            onChange={handleReceiptUpload}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="receipt-upload" className="upload-btn">
                            {uploadingReceipt ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    <span>{t('bank_transfer.uploading') || 'Uploading...'}</span>
                                </>
                            ) : formData.receiptImage ? (
                                <>
                                    <FiCheckCircle />
                                    <span>{t('bank_transfer.file_uploaded') || 'File uploaded'}</span>
                                </>
                            ) : (
                                <>
                                    <FiUpload />
                                    <span>{t('bank_transfer.upload_receipt') || 'Upload receipt'}</span>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className="form-group">
                    <label>{t('bank_transfer.notes') || 'Additional Notes'} ({t('bank_transfer.optional') || 'Optional'})</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows="3"
                        placeholder={t('bank_transfer.notes_placeholder') || 'Any additional information...'}
                    />
                </div>

                <div className="form-actions">
                    <button className="btn-cancel" onClick={onCancel}>
                        {t('payment.back') || 'Cancel'}
                    </button>
                    <button
                        className="btn-submit"
                        onClick={handleSubmit}
                        disabled={submitting || !formData.senderName || !formData.bankName}
                    >
                        {submitting ? (
                            <>
                                <div className="btn-spinner"></div>
                                <span>{t('bank_transfer.submitting') || 'Submitting...'}</span>
                            </>
                        ) : (
                            <>
                                <FiCheckCircle />
                                <span>{t('bank_transfer.submit_notification') || 'Submit Notification'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Info Alert */}
            <div className="info-alert">
                <FiAlertCircle />
                <p>{t('bank_transfer.review_info') || 'Your transfer will be reviewed by our team and your balance will be updated within 24 hours after approval.'}</p>
            </div>
        </div>
    );
};

export default BankTransferForm;
