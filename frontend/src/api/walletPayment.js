import api from './axios';

export const walletPaymentAPI = {
    // Card payment
    processCardPayment: (data) => api.post('/wallet/payments/card', data),

    // Bank transfer
    initiateBankTransfer: (amount) => api.post('/wallet/payments/bank-transfer/initiate', { amount }),
    notifyBankTransfer: (data) => api.post('/wallet/payments/bank-transfer/notify', data),

    // Mobile payment
    processMobilePayment: (data) => api.post('/wallet/payments/mobile', data),

    // Get payment status
    getPaymentStatus: (paymentId) => api.get(`/wallet/payments/${paymentId}/status`),

    // Get saved cards (Mock)
    getSavedCards: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    data: [
                        {
                            id: 1,
                            cardName: 'AHMET YILMAZ',
                            cardNumber: '4548 1234 5678 9012',
                            expiry: '12/26',
                            cvv: '123',
                            type: 'visa',
                            last4: '9012'
                        },
                        {
                            id: 2,
                            cardName: 'AHMET YILMAZ',
                            cardNumber: '5176 9876 5432 1098',
                            expiry: '10/25',
                            cvv: '456',
                            type: 'mastercard',
                            last4: '1098'
                        }
                    ]
                });
            }, 500);
        });
    }
};
