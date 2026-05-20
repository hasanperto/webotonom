import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Public: Aktif banka hesaplarını getir (checkout için)
router.get('/', async (req, res) => {
    try {
        const [accounts] = await pool.execute(
            'SELECT id, bank_name, iban, account_holder, account_number, branch_name, swift_code, currency FROM bank_accounts WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        res.json({ accounts });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ accounts: [] });
        }
        console.error('Get public bank accounts error:', error);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export default router;
