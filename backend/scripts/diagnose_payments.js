import pool from '../config/database.js';

const diagnose = async () => {
    try {
        console.log('--- DIAGNOSTIC START ---');

        // Check roles
        const [roles] = await pool.execute('SELECT * FROM user_roles');
        console.log('Roles:', roles);

        // Check admin user
        const [adminUsers] = await pool.execute('SELECT id, username, role_id FROM users WHERE role_id IN (SELECT id FROM user_roles WHERE slug = "admin")');
        console.log('Admin Users:', adminUsers);

        // Find one of the orders Hasan mentioned
        const orderNumber = 'ORD-1769362086879-EJIB4GW1B';
        const [orders] = await pool.execute('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);
        console.log('Order Info:', orders[0]);

        if (orders.length > 0) {
            const orderId = orders[0].id;

            // Check transactions for this order
            const [trans] = await pool.execute('SELECT * FROM transactions WHERE order_id = ?', [orderId]);
            console.log('Transactions for this order:', trans);

            // Check order items
            const [items] = await pool.execute('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
            console.log('Order items:', items);
        }

        console.log('--- DIAGNOSTIC END ---');
        process.exit(0);
    } catch (error) {
        console.error('Diagnostic error:', error);
        process.exit(1);
    }
};

diagnose();
