import Stripe from 'stripe';
import crypto from 'crypto';
import pool from '../config/database.js';

class PaymentService {
    constructor() {
        this.stripe = null;
        this.iyzico = {
            apiKey: null,
            secretKey: null,
            baseUrl: 'https://sandbox-api.iyzipay.com'
        };
        this.paypal = {
            clientId: null,
            secret: null,
            mode: 'sandbox'
        };
        this.settings = null;
    }

    // Settings'ten ödeme ayarlarını yükle
    async loadPaymentSettings() {
        try {
            const [settings] = await pool.execute(
                'SELECT `key`, `value`, `type` FROM settings WHERE `group` = ?',
                ['payment']
            );

            const paymentSettings = {};
            settings.forEach(setting => {
                if (setting.type === 'boolean') {
                    paymentSettings[setting.key] = setting.value === '1' || setting.value === 'true';
                } else {
                    paymentSettings[setting.key] = setting.value;
                }
            });

            this.settings = paymentSettings;

            // Stripe initialize
            if (paymentSettings.stripe_enabled && paymentSettings.stripe_secret_key) {
                this.stripe = new Stripe(paymentSettings.stripe_secret_key);
            }

            // Iyzico config
            if (paymentSettings.iyzico_enabled) {
                this.iyzico = {
                    apiKey: paymentSettings.iyzico_api_key || null,
                    secretKey: paymentSettings.iyzico_secret_key || null,
                    baseUrl: 'https://sandbox-api.iyzipay.com' // Test için sandbox
                };
            }

            // PayPal config
            if (paymentSettings.paypal_enabled) {
                this.paypal = {
                    clientId: paymentSettings.paypal_client_id || null,
                    secret: paymentSettings.paypal_secret || null,
                    mode: 'sandbox' // Test modu
                };
            }

            return paymentSettings;
        } catch (error) {
            console.error('Load payment settings error:', error);
            return null;
        }
    }

    // Test card validation
    isTestCard(cardNumber) {
        const testCards = {
            // Stripe test cards
            '4242424242424242': { gateway: 'stripe', type: 'success' },
            '4000002760003184': { gateway: 'stripe', type: '3d_secure' },
            '4000000000000002': { gateway: 'stripe', type: 'decline' },
            // Iyzico test cards
            '5528790000000001': { gateway: 'iyzico', type: 'success' },
            '5406670000000009': { gateway: 'iyzico', type: '3d_secure' }
        };

        const cleanCard = cardNumber.replace(/\s/g, '');
        return testCards[cleanCard] || null;
    }

    // Generate reference number for transactions
    generateReferenceNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `PAY-${timestamp}-${random}`;
    }

    // Stripe payment processing
    async processStripePayment(amount, currency = 'try', metadata = {}) {
        if (!this.stripe) {
            // Simulate payment for demo
            return this.simulatePayment(amount, 'stripe');
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                metadata
            });

            return {
                success: true,
                gateway: 'stripe',
                transactionId: paymentIntent.id,
                status: paymentIntent.status,
                clientSecret: paymentIntent.client_secret
            };
        } catch (error) {
            console.error('Stripe payment error:', error);
            return {
                success: false,
                gateway: 'stripe',
                error: error.message
            };
        }
    }

    // Iyzico payment processing
    async processIyzicoPayment(amount, cardData, userData) {
        // Önce settings'i yükle
        if (!this.settings) {
            await this.loadPaymentSettings();
        }

        // Test kart kontrolü
        if (cardData?.cardNumber) {
            const testCard = this.isTestCard(cardData.cardNumber);
            if (testCard && testCard.gateway === 'iyzico') {
                if (testCard.type === 'success') {
                    return {
                        success: true,
                        gateway: 'iyzico',
                        transactionId: `iyzico_test_${Date.now()}`,
                        status: 'success',
                        testMode: true,
                        message: 'Iyzico test kartı ile ödeme başarılı'
                    };
                }
            }
        }

        if (!this.iyzico.apiKey || !this.settings?.iyzico_enabled) {
            // Simulate payment for demo
            return this.simulatePayment(amount, 'iyzico');
        }

        // Iyzico implementation would go here
        // For now, simulate
        return this.simulatePayment(amount, 'iyzico');
    }

    // PayPal payment processing
    async processPayPalPayment(amount, currency = 'TRY', paymentData = {}) {
        // Önce settings'i yükle
        if (!this.settings) {
            await this.loadPaymentSettings();
        }

        if (!this.paypal.clientId || !this.settings?.paypal_enabled) {
            // Simulate payment for demo
            return this.simulatePayment(amount, 'paypal');
        }

        // PayPal implementation would go here
        // For now, simulate
        return {
            success: true,
            gateway: 'paypal',
            transactionId: `paypal_${Date.now()}`,
            status: 'completed',
            testMode: true,
            message: 'PayPal test ödemesi başarılı'
        };
    }

    // Simulate payment for demo/test mode
    async simulatePayment(amount, gateway) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const referenceNumber = this.generateReferenceNumber();

        // Simulate 90% success rate
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
            return {
                success: true,
                gateway,
                transactionId: referenceNumber,
                status: 'completed',
                simulationMode: true,
                message: 'Payment simulated successfully (demo mode)'
            };
        } else {
            return {
                success: false,
                gateway,
                status: 'failed',
                simulationMode: true,
                error: 'Simulated payment failure for testing'
            };
        }
    }

    // Bank transfer - generate reference for user
    generateBankTransferReference(userId, amount) {
        const userPart = userId.toString().padStart(6, '0');
        const amountPart = Math.round(amount).toString().padStart(6, '0');
        const random = crypto.randomBytes(2).toString('hex').toUpperCase();
        return `BANK-${userPart}-${amountPart}-${random}`;
    }

    // Mobile payment (Google Pay / Apple Pay)
    async processMobilePayment(amount, paymentMethod, token) {
        // In real implementation, this would verify the payment token
        // For now, simulate the payment

        if (!token) {
            return {
                success: false,
                error: 'Invalid payment token'
            };
        }

        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        const referenceNumber = this.generateReferenceNumber();

        return {
            success: true,
            gateway: paymentMethod, // 'google_pay' or 'apple_pay'
            transactionId: referenceNumber,
            status: 'completed',
            simulationMode: true,
            message: `${paymentMethod} payment simulated successfully`
        };
    }

    // Verify webhook signature (Stripe)
    verifyStripeWebhook(payload, signature) {
        if (!this.stripe) return false;

        try {
            const event = this.stripe.webhooks.constructEvent(
                payload,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
            return event;
        } catch (error) {
            console.error('Webhook verification failed:', error);
            return false;
        }
    }

    // Calculate bonus amount
    calculateBonus(amount) {
        if (amount >= 1000) {
            return amount * 0.05; // 5% bonus for 1000+ TL
        } else if (amount >= 500) {
            return amount * 0.03; // 3% bonus for 500+ TL
        }
        return 0;
    }
}

export default new PaymentService();
