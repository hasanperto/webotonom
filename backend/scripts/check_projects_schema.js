
require('dotenv').config();
const pool = require('../config/database');

async function checkProjectsTable() {
    try {
        const [columns] = await pool.execute(`
             SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
             FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' AND TABLE_NAME = 'projects'
        `);
        console.log('Projects table columns:');
        columns.forEach(col => console.log(`${col.COLUMN_NAME} (${col.COLUMN_TYPE})`));
        process.exit();
    } catch (error) {
        console.error('Error checking table:', error);
        process.exit(1);
    }
}

checkProjectsTable();
