/**
 * Kurumsal sayfalar + menü öğeleri
 * Kullanım: node scripts/seed-corporate-pages-menu.js
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const YEDEK = path.join(__dirname, '../services/yedekdb');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teknopro',
    multipleStatements: true,
});

const CORPORATE_MENU = [
    { title: 'Hakkımızda', title_en: 'About Us', title_de: 'Über uns', url: '/hakkimizda', icon: 'FiGlobe', order: 1 },
    { title: 'Gizlilik Politikası', title_en: 'Privacy Policy', title_de: 'Datenschutz', url: '/gizlilik-politikasi', icon: 'FiTarget', order: 2 },
    { title: 'Kullanım Koşulları', title_en: 'Terms of Use', title_de: 'Nutzungsbedingungen', url: '/kullanim-kosullari', icon: 'FiHelpCircle', order: 3 },
    { title: 'Misyon & Vizyon', title_en: 'Mission & Vision', title_de: 'Mission & Vision', url: '/misyon-vizyon', icon: 'FiGrid', order: 4 },
    { title: 'Gizlilik Politikamız', title_en: 'Our Privacy Policy', title_de: 'Datenschutzerklärung', url: '/gizlilik-politikamiz', icon: 'FiShield', order: 5 },
    { title: 'Kalite Politikamız', title_en: 'Quality Policy', title_de: 'Qualitätspolitik', url: '/kalite-politikamiz', icon: 'FiTrendingUp', order: 6 },
    { title: 'Teslimat ve İade Şartları', title_en: 'Delivery & Refund', title_de: 'Lieferung & Rückerstattung', url: '/teslimat-ve-iade-sartlari', icon: 'FiShoppingCart', order: 7 },
    { title: 'Lisans Politikası', title_en: 'License Policy', title_de: 'Lizenzrichtlinie', url: '/lisans-politikasi', icon: 'FiLink', order: 8 },
];

async function runSqlFile(connection, filename) {
    const filePath = path.join(YEDEK, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`  (atlandı) ${filename} yok`);
        return;
    }
    const sql = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    if (!sql.trim()) return;
    await connection.query(sql);
    console.log(`  OK: ${filename}`);
}

async function upsertPage(connection, { slug, title, content, meta_title, meta_description, translations }) {
    await connection.execute(
        `INSERT INTO pages (title, slug, content, meta_title, meta_description, status)
         VALUES (?, ?, ?, ?, ?, 'active')
         ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content),
         meta_title = VALUES(meta_title), meta_description = VALUES(meta_description), status = 'active'`,
        [title, slug, content, meta_title, meta_description]
    );
    const [rows] = await connection.execute('SELECT id FROM pages WHERE slug = ? LIMIT 1', [slug]);
    const pageId = rows[0]?.id;
    if (!pageId) return null;

    for (const [lang, t] of Object.entries(translations)) {
        await connection.execute(
            `INSERT INTO content_translations (content_id, content_type, language_code, title, description)
             VALUES (?, 'page', ?, ?, ?)
             ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description)`,
            [pageId, lang, t.title, t.content]
        );
    }
    return pageId;
}

async function seedMenu(connection) {
    await connection.execute("DELETE FROM menu_items WHERE menu_type = 'corporate'");

    const [cols] = await connection.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'title_tr'`
    );
    const hasLangCols = cols.length > 0;

    for (const item of CORPORATE_MENU) {
        if (hasLangCols) {
            await connection.execute(
                `INSERT INTO menu_items (menu_type, title, title_tr, title_en, title_de, url, icon, \`order\`, status, target)
                 VALUES ('corporate', ?, ?, ?, ?, ?, ?, ?, 'active', '_self')`,
                [item.title, item.title, item.title_en, item.title_de, item.url, item.icon, item.order]
            );
        } else {
            await connection.execute(
                `INSERT INTO menu_items (menu_type, title, url, icon, \`order\`, status, target)
                 VALUES ('corporate', ?, ?, ?, ?, 'active', '_self')`,
                [item.title, item.url, item.icon, item.order]
            );
        }
        console.log(`  Menü: ${item.title} -> ${item.url}`);
    }
}

async function main() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        console.log('Varsayılan sayfalar yükleniyor...');
        await runSqlFile(connection, 'database_default_pages.sql');

        console.log('Ek sayfalar...');
        await upsertPage(connection, {
            slug: 'kullanim-kosullari',
            title: 'Kullanım Koşulları',
            content: '<div class="page-content"><h2>Kullanım Koşulları</h2><p>TeknoProje platform kullanım şartları.</p></div>',
            meta_title: 'Kullanım Koşulları - TeknoProje',
            meta_description: 'Platform kullanım koşulları.',
            translations: {
                tr: { title: 'Kullanım Koşulları', content: '<div class="page-content"><h2>Kullanım Koşulları</h2></div>' },
                en: { title: 'Terms of Use', content: '<div class="page-content"><h2>Terms of Use</h2></div>' },
                de: { title: 'Nutzungsbedingungen', content: '<div class="page-content"><h2>Nutzungsbedingungen</h2></div>' },
            },
        });

        await upsertPage(connection, {
            slug: 'gizlilik-politikasi',
            title: 'Gizlilik Politikası',
            content: '<div class="page-content"><h2>Gizlilik Politikası</h2><p>KVKK kapsamında veri işleme.</p></div>',
            meta_title: 'Gizlilik Politikası - TeknoProje',
            meta_description: 'Gizlilik politikası.',
            translations: {
                tr: { title: 'Gizlilik Politikası', content: '<div class="page-content"><h2>Gizlilik Politikası</h2></div>' },
                en: { title: 'Privacy Policy', content: '<div class="page-content"><h2>Privacy Policy</h2></div>' },
                de: { title: 'Datenschutz', content: '<div class="page-content"><h2>Datenschutz</h2></div>' },
            },
        });

        console.log('Kurumsal menü...');
        await seedMenu(connection);

        await connection.commit();
        console.log('\nKurumsal sayfalar ve menü hazır.');
    } catch (e) {
        await connection.rollback();
        console.error(e);
        process.exitCode = 1;
    } finally {
        connection.release();
        await pool.end();
    }
}

main();
