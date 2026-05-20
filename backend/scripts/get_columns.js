import pool from '../config/database.js';

const getColumns = async () => {
    try {
        const [res] = await pool.execute('DESCRIBE transactions');
        console.log(res.map(c => c.Field));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
getColumns();
