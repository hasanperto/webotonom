import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testQuery() {
    try {
        console.log('Testing bank transfer notifications query...');
        
        const query = `
            SELECT 
                btn.id,
                btn.order_id,
                btn.user_id,
                btn.receipt_number,
                btn.reference_number,
                btn.receipt_file,
                btn.notes,
                btn.status,
                btn.admin_notes,
                btn.created_at,
                btn.updated_at,
                o.order_number,
                o.final_amount as total_amount,
                o.currency,
                o.payment_method,
                u.username,
                u.email,
                CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as full_name,
                'bank_transfer_order' as source_type
            FROM bank_transfer_notifications btn
            INNER JOIN orders o ON btn.order_id = o.id
            INNER JOIN users u ON btn.user_id = u.id
            WHERE btn.payment_request_id IS NULL
            ORDER BY btn.created_at DESC
        `;
        
        const [rows] = await pool.execute(query);
        console.log('Query result count:', rows.length);
        if (rows.length > 0) {
            console.log('First result:', JSON.stringify(rows[0], null, 2));
        } else {
            console.log('No results found');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error('SQL Message:', error.sqlMessage);
        console.error('Code:', error.code);
    } finally {
        await pool.end();
    }
}

testQuery();
