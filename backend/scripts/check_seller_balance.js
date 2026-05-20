import pool from '../config/database.js';

/**
 * Satıcı bakiyesini SQL'den kontrol eder ve hesaplar
 */
const checkSellerBalance = async () => {
    try {
        const sellerId = 8; // saticihasan
        console.log(`\n🔍 Satıcı ID ${sellerId} (saticihasan) Bakiye Kontrolü\n`);
        console.log('='.repeat(60));

        // 1. Users tablosundan mevcut bakiyeler
        const [userData] = await pool.execute('SELECT balance, blocked_balance FROM users WHERE id = ?', [sellerId]);
        const currentBalance = parseFloat(userData[0]?.balance || 0);
        const blockedBalance = parseFloat(userData[0]?.blocked_balance || 0);
        
        console.log(`\n📊 Users Tablosu:`);
        console.log(`   Çekilebilir Bakiye: ${currentBalance.toFixed(2)} TL`);
        console.log(`   Bloke Bakiye: ${blockedBalance.toFixed(2)} TL`);
        console.log(`   Toplam: ${(currentBalance + blockedBalance).toFixed(2)} TL`);

        // 2. Transactions tablosundan sale transaction'ları
        const [sales] = await pool.execute(
            `SELECT 
                t.id,
                t.order_id,
                t.amount,
                t.status,
                t.unblock_date,
                t.created_at,
                t.description,
                o.created_at as order_date,
                o.order_number,
                o.final_amount,
                o.payment_status,
                o.order_status
             FROM transactions t
             LEFT JOIN orders o ON t.order_id = o.id
             WHERE t.user_id = ? AND t.type = 'sale' AND t.status = 'completed'
             ORDER BY t.created_at DESC`,
            [sellerId]
        );

        console.log(`\n💰 Sale Transaction'ları (${sales.length} adet):`);
        let totalSales = 0;
        let totalBlocked = 0;
        let totalAvailable = 0;

        for (const sale of sales) {
            const amount = parseFloat(sale.amount);
            totalSales += amount;
            
            const orderDate = sale.order_date ? new Date(sale.order_date) : new Date(sale.created_at);
            const unblockDate = sale.unblock_date ? new Date(sale.unblock_date) : null;
            const now = new Date();
            
            // Sipariş tarihinden 7 gün sonrasını hesapla
            const calculatedUnblockDate = new Date(orderDate);
            calculatedUnblockDate.setDate(calculatedUnblockDate.getDate() + 7);
            
            let status = '';
            // Sipariş tarihinden 7 gün geçmişse çekilebilir
            if (calculatedUnblockDate > now) {
                totalBlocked += amount;
                status = '🔒 BLOKE';
            } else {
                totalAvailable += amount;
                status = '✅ ÇEKİLEBİLİR';
            }

            console.log(`\n   Transaction ID: ${sale.id}`);
            console.log(`   Sipariş: ${sale.order_number || sale.order_id}`);
            console.log(`   Tutar: ${amount.toFixed(2)} TL`);
            console.log(`   Sipariş Tarihi: ${orderDate.toLocaleString('tr-TR')}`);
            if (unblockDate) {
                console.log(`   Bloke Bitiş: ${unblockDate.toLocaleString('tr-TR')}`);
                const daysLeft = Math.ceil((unblockDate - now) / (1000 * 60 * 60 * 24));
                console.log(`   Kalan Gün: ${daysLeft} gün`);
            }
            console.log(`   Durum: ${status}`);
            console.log(`   Açıklama: ${sale.description || '-'}`);
        }

        console.log(`\n📈 Toplam İstatistikler:`);
        console.log(`   Toplam Satış Geliri: ${totalSales.toFixed(2)} TL`);
        console.log(`   Bloke Bakiye (7 gün): ${totalBlocked.toFixed(2)} TL`);
        console.log(`   Çekilebilir Bakiye: ${totalAvailable.toFixed(2)} TL`);

        // 3. Orders tablosundan satıcının projelerine ait siparişler
        const [orders] = await pool.execute(
            `SELECT 
                o.id,
                o.order_number,
                o.final_amount,
                o.total_amount,
                o.discount_amount,
                o.commission_rate,
                o.payment_status,
                o.order_status,
                o.created_at,
                oi.project_id,
                oi.subtotal,
                p.title as project_title
             FROM orders o
             INNER JOIN order_items oi ON o.id = oi.order_id
             INNER JOIN projects p ON oi.project_id = p.id
             WHERE p.user_id = ?
             ORDER BY o.created_at DESC`,
            [sellerId]
        );

        console.log(`\n📦 Siparişler (${orders.length} adet):`);
        let totalOrderAmount = 0;
        let totalSellerShare = 0;
        const vatRate = 18;
        const defaultCommissionRate = 20;

        for (const order of orders) {
            const itemTotal = parseFloat(order.subtotal || 0);
            let effectiveItemTotal = itemTotal;
            
            // Kupon indirimi varsa düş
            if (order.total_amount > 0 && order.discount_amount > 0) {
                effectiveItemTotal = itemTotal - ((itemTotal / order.total_amount) * order.discount_amount);
            }
            
            // KDV hariç tutar
            const netAmount = Math.round((effectiveItemTotal / (1 + (vatRate / 100))) * 100) / 100;
            const commissionRate = parseFloat(order.commission_rate || defaultCommissionRate);
            const commissionAmount = Math.round((netAmount * commissionRate / 100) * 100) / 100;
            const sellerShare = Math.round((netAmount - commissionAmount) * 100) / 100;

            const finalAmount = parseFloat(order.final_amount || 0);
            totalOrderAmount += finalAmount;
            totalSellerShare += sellerShare;

            console.log(`\n   Sipariş: ${order.order_number}`);
            console.log(`   Proje: ${order.project_title}`);
            console.log(`   Sipariş Tutarı: ${finalAmount.toFixed(2)} TL`);
            console.log(`   Satıcı Payı: ${sellerShare.toFixed(2)} TL`);
            console.log(`   Durum: ${order.order_status} / ${order.payment_status}`);
        }

        console.log(`\n📊 Sipariş Özeti:`);
        console.log(`   Toplam Sipariş Tutarı: ${totalOrderAmount.toFixed(2)} TL`);
        console.log(`   Toplam Satıcı Payı: ${totalSellerShare.toFixed(2)} TL`);

        // 4. Withdrawals (Çekilen bakiyeler)
        const [withdrawals] = await pool.execute(
            `SELECT 
                id,
                amount,
                status,
                created_at
             FROM withdrawals 
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [sellerId]
        );

        console.log(`\n💸 Çekimler (${withdrawals.length} adet):`);
        let totalWithdrawn = 0;
        let pendingWithdrawals = 0;

        for (const withdrawal of withdrawals) {
            const amount = parseFloat(withdrawal.amount);
            if (withdrawal.status === 'completed') {
                totalWithdrawn += amount;
            } else if (withdrawal.status === 'pending') {
                pendingWithdrawals += amount;
            }
            console.log(`   ${withdrawal.id}: ${amount.toFixed(2)} TL - ${withdrawal.status} (${new Date(withdrawal.created_at).toLocaleString('tr-TR')})`);
        }

        console.log(`\n📊 Çekim Özeti:`);
        console.log(`   Tamamlanan Çekimler: ${totalWithdrawn.toFixed(2)} TL`);
        console.log(`   Bekleyen Çekimler: ${pendingWithdrawals.toFixed(2)} TL`);

        // 5. Karşılaştırma
        console.log(`\n${'='.repeat(60)}`);
        console.log(`\n🔍 KARŞILAŞTIRMA:\n`);
        console.log(`   SQL'den Hesaplanan:`);
        console.log(`      Toplam Satış Geliri: ${totalSales.toFixed(2)} TL`);
        console.log(`      Bloke Bakiye: ${totalBlocked.toFixed(2)} TL`);
        console.log(`      Çekilebilir: ${totalAvailable.toFixed(2)} TL`);
        console.log(`      Çekilen: ${totalWithdrawn.toFixed(2)} TL`);
        console.log(`      Bekleyen Çekim: ${pendingWithdrawals.toFixed(2)} TL`);
        console.log(`\n   Users Tablosu:`);
        console.log(`      Çekilebilir Bakiye: ${currentBalance.toFixed(2)} TL`);
        console.log(`      Bloke Bakiye: ${blockedBalance.toFixed(2)} TL`);
        console.log(`\n   Beklenen Çekilebilir: ${(totalAvailable - totalWithdrawn - pendingWithdrawals).toFixed(2)} TL`);
        console.log(`   Gerçek Çekilebilir: ${currentBalance.toFixed(2)} TL`);
        console.log(`   Fark: ${(currentBalance - (totalAvailable - totalWithdrawn - pendingWithdrawals)).toFixed(2)} TL`);

        console.log(`\n${'='.repeat(60)}\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Hata:', error);
        process.exit(1);
    }
};

checkSellerBalance();
