import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const EMAIL = 'zeynep@example.com';
const PASSWORD = '123456';

async function test() {
    try {
        console.log('1. Login olunuyor...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const token = loginRes.data.token;
        console.log('Login başarılı. Token alındı.');

        console.log('2. Ödeme talepleri alınıyor...');
        const listRes = await axios.get(`${BASE_URL}/users/payment-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const requests = listRes.data.payment_requests;
        if (requests.length === 0) {
            console.log('Hiç ödeme talebi yok.');
            return;
        }

        const firstId = requests[0].id;
        console.log(`İlk ödeme talebi ID: ${firstId}`);

        console.log(`3. Not güncelleniyor (ID: ${firstId})...`);
        const noteRes = await axios.put(`${BASE_URL}/users/payment-requests/${firstId}/note`,
            { note: 'API Test Notu ' + Date.now() },
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        console.log('Update sonucu:', noteRes.status, noteRes.data);
    } catch (error) {
        if (error.response) {
            console.error('API Hatası:', error.response.status, error.response.data);
        } else {
            console.error('Hata:', error.message);
        }
    }
}

test();
