import Stripe from 'stripe';
import crypto from 'crypto';
import pool from '../config/database.js';

/** Admin demo modunda kullanilacak varsayilan test bilgileri */
export const DEMO_PAYMENT_DEFAULTS = {
    card_number: '4242424242424242',
    card_display: '4242 4242 4242 4242',
    card_holder: 'Demo Kullanici',
    expiry: '12/34',
    cvv: '123',
    paypal_email: 'demo@teknopro.com',
    paypal_password: 'demo1234',
};

class PaymentService {
    constructor() {
        this.stripe = null;
        this.iyzico = {
            apiKey: null,
            secretKey: null,
            baseUrl: 'https://sandbox-api.iyzipay.com',
        };
        this.paypal = {
            clientId: null,
            secret: null,
            mode: 'sandbox',
        };
        this.settings = null;
    }

    async loadPaymentSettings() {
        try {
            const [settings] = await pool.execute(
                'SELECT `key`, `value`, `type` FROM settings WHERE `group` = ?',
                ['payment']
            );

            const paymentSettings = {};
            settings.forEach((setting) => {
                if (setting.type === 'boolean') {
                    paymentSettings[setting.key] =
                        setting.value === '1' || setting.value === 'true';
                } else {
                    paymentSettings[setting.key] = setting.value;
                }
            });

            this.settings = paymentSettings;

            if (paymentSettings.stripe_enabled && paymentSettings.stripe_secret_key) {
                this.stripe = new Stripe(paymentSettings.stripe_secret_key);
            }

            if (paymentSettings.iyzico_enabled) {
                this.iyzico = {
                    apiKey: paymentSettings.iyzico_api_key || null,
                    secretKey: paymentSettings.iyzico_secret_key || null,
                    baseUrl: 'https://sandbox-api.iyzipay.com',
                };
            }

            if (paymentSettings.paypal_enabled) {
                this.paypal = {
                    clientId: paymentSettings.paypal_client_id || null,
                    secret: paymentSettings.paypal_secret || null,
                    mode: 'sandbox',
                };
            }

            return paymentSettings;
        } catch (error) {
            console.error('Load payment settings error:', error);
            return null;
        }
    }

    isDemoModeActive() {
        const s = this.settings || {};
        return (
            s.payment_demo_mode !== false &&
            s.payment_demo_mode !== '0' &&
            s.payment_demo_mode !== 'false' &&
            s.payment_demo_mode !== 0
        );
    }

    getDemoHints() {
        const s = this.settings || {};
        return {
            card_number: s.demo_card_number || DEMO_PAYMENT_DEFAULTS.card_display,
            card_holder: s.demo_card_holder || DEMO_PAYMENT_DEFAULTS.card_holder,
            expiry: s.demo_card_expiry || DEMO_PAYMENT_DEFAULTS.expiry,
            cvv: s.demo_card_cvv || DEMO_PAYMENT_DEFAULTS.cvv,
            paypal_email: s.demo_paypal_email || DEMO_PAYMENT_DEFAULTS.paypal_email,
            paypal_password: s.demo_paypal_password || DEMO_PAYMENT_DEFAULTS.paypal_password,
        };
    }

    normalizeCard(cardNumber) {
        return String(cardNumber || '').replace(/\s/g, '');
    }

    isTestCard(cardNumber) {
        const testCards = {
            '4242424242424242': { gateway: 'stripe', type: 'success' },
            '4000002760003184': { gateway: 'stripe', type: '3d_secure' },
            '4000000000000002': { gateway: 'stripe', type: 'decline' },
            '5528790000000001': { gateway: 'iyzico', type: 'success' },
            '5406670000000009': { gateway: 'iyzico', type: '3d_secure' },
        };
        const cleanCard = this.normalizeCard(cardNumber);
        return testCards[cleanCard] || null;
    }

    isAcceptedDemoCard(cardNumber) {
        const clean = this.normalizeCard(cardNumber);
        const demoClean = this.normalizeCard(
            this.settings?.demo_card_number || DEMO_PAYMENT_DEFAULTS.card_number
        );
        if (clean === demoClean) return true;
        const test = this.isTestCard(clean);
        return test && test.type === 'success';
    }

    validateDemoPayPal(paymentData = {}) {
        const email = String(
            paymentData.paypal_email || paymentData.email || ''
        ).trim().toLowerCase();
        const password = String(
            paymentData.paypal_password || paymentData.password || ''
        );
        const demoEmail = String(
            this.settings?.demo_paypal_email || DEMO_PAYMENT_DEFAULTS.paypal_email
        )
            .trim()
            .toLowerCase();
        const demoPassword = String(
            this.settings?.demo_paypal_password || DEMO_PAYMENT_DEFAULTS.paypal_password
        );
        return email === demoEmail && password === demoPassword;
    }

    generateReferenceNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(4).toString('hex').toUpperCase();
        return `PAY-${timestamp}-${random}`;
    }

    async processStripePayment(amount, currency = 'try', paymentData = {}) {
        if (!this.settings) {
            await this.loadPaymentSettings();
        }

        const cardNumber =
            paymentData?.card_info?.card_number ||
            paymentData?.cardNumber ||
            paymentData?.card_number;

        if (this.isDemoModeActive()) {
            if (paymentData?.card_id) {
                return this.simulatePayment(amount, 'credit_card', { forceSuccess: true });
            }
            if (!cardNumber || !this.isAcceptedDemoCard(cardNumber)) {
                const hints = this.getDemoHints();
                return {
                    success: false,
                    gateway: 'demo',
                    error: `Demo mod: test karti kullanin (${hints.card_number}, CVV: ${hints.cvv})`,
                    demo_mode: true,
                };
            }
            return this.simulatePayment(amount, 'credit_card', { forceSuccess: true });
        }

        if (!this.stripe) {
            return this.simulatePayment(amount, 'stripe');
        }

        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100),
                currency: currency.toLowerCase(),
                metadata: paymentData?.metadata || {},
            });

            return {
                success: true,
                gateway: 'stripe',
                transactionId: paymentIntent.id,
                status: paymentIntent.status,
                clientSecret: paymentIntent.client_secret,
            };
        } catch (error) {
            console.error('Stripe payment error:', error);
            return {
                success: false,
                gateway: 'stripe',
                error: error.message,
            };
        }
    }

    async processIyzicoPayment(amount, cardData, userData) {
        if (!this.settings) {
            await this.loadPaymentSettings();
        }

        if (cardData?.cardNumber) {
            const testCard = this.isTestCard(cardData.cardNumber);
            if (testCard && testCard.gateway === 'iyzico' && testCard.type === 'success') {
                return {
                    success: true,
                    gateway: 'iyzico',
                    transactionId: `iyzico_test_${Date.now()}`,
                    status: 'success',
                    testMode: true,
                    message: 'Iyzico test karti ile odeme basarili',
                };
            }
        }

        if (this.isDemoModeActive() || !this.iyzico.apiKey || !this.settings?.iyzico_enabled) {
            return this.simulatePayment(amount, 'iyzico', { forceSuccess: true });
        }

        return this.simulatePayment(amount, 'iyzico');
    }

    async processPayPalPayment(amount, currency = 'TRY', paymentData = {}) {
        if (!this.settings) {
            await this.loadPaymentSettings();
        }

        if (this.isDemoModeActive()) {
            if (!this.validateDemoPayPal(paymentData)) {
                const hints = this.getDemoHints();
                return {
                    success: false,
                    gateway: 'demo',
                    error: `Demo PayPal: ${hints.paypal_email} / ${hints.paypal_password}`,
                    demo_mode: true,
                };
            }
            return this.simulatePayment(amount, 'paypal', { forceSuccess: true });
        }

        if (!this.paypal.clientId || !this.settings?.paypal_enabled) {
            return this.simulatePayment(amount, 'paypal');
        }

        return {
            success: true,
            gateway: 'paypal',
            transactionId: `paypal_${Date.now()}`,
            status: 'completed',
            testMode: true,
            message: 'PayPal test odemesi basarili',
        };
    }

    async simulatePayment(amount, gateway, options = {}) {
        const forceSuccess = options.forceSuccess === true || this.isDemoModeActive();

        if (!forceSuccess) {
            await new Promise((resolve) => setTimeout(resolve, 800));
        }

        const referenceNumber = this.generateReferenceNumber();
        const isSuccess = forceSuccess || Math.random() > 0.1;

        if (isSuccess) {
            return {
                success: true,
                gateway,
                transactionId: referenceNumber,
                status: 'completed',
                simulationMode: true,
                demo_mode: forceSuccess,
                message: forceSuccess
                    ? 'Demo odeme basarili (dogrulama atlandi)'
                    : 'Payment simulated successfully (demo mode)',
            };
        }

        return {
            success: false,
            gateway,
            status: 'failed',
            simulationMode: true,
            error: 'Simulated payment failure for testing',
        };
    }

    generateBankTransferReference(userId, amount) {
        const userPart = userId.toString().padStart(6, '0');
        const amountPart = Math.round(amount).toString().padStart(6, '0');
        const random = crypto.randomBytes(2).toString('hex').toUpperCase();
        return `BANK-${userPart}-${amountPart}-${random}`;
    }

    async processMobilePayment(amount, paymentMethod, token) {
        if (!token) {
            return { success: false, error: 'Invalid payment token' };
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        const referenceNumber = this.generateReferenceNumber();

        return {
            success: true,
            gateway: paymentMethod,
            transactionId: referenceNumber,
            status: 'completed',
            simulationMode: true,
            message: `${paymentMethod} payment simulated successfully`,
        };
    }

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

    calculateBonus(amount) {
        if (amount >= 1000) return amount * 0.05;
        if (amount >= 500) return amount * 0.03;
        return 0;
    }
}

export default new PaymentService();
