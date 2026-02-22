const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const config = require('./config');

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let db;

// --- 1. 数据库连接初始化 ---
if (DB_TYPE === 'postgres') {
    console.log('🚀 检测到 DB_TYPE=postgres，正在连接远程数据库...');
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Koyeb 必须开启
    });

    // 抹平 pg 和 sqlite3 的 API 差异 (关键兼容层)
    db.run = function(sql, params, callback) {
        const p = Array.isArray(params) ? params : [];
        const cb = typeof params === 'function' ? params : callback;
        const transformedSql = sql.replace(/\?/g, (_, i) => `$${++i}`);
        this.query(transformedSql, p, (err, res) => {
            if (cb) cb.call({ lastID: res?.rows[0]?.id }, err, res);
        });
    };

    db.get = function(sql, params, callback) {
        const p = Array.isArray(params) ? params : [];
        const cb = typeof params === 'function' ? params : callback;
        const transformedSql = sql.replace(/\?/g, (_, i) => `$${++i}`);
        this.query(transformedSql, p, (err, res) => {
            if (cb) cb(err, res?.rows[0]);
        });
    };

    db.all = function(sql, params, callback) {
        const p = Array.isArray(params) ? params : [];
        const cb = typeof params === 'function' ? params : callback;
        const transformedSql = sql.replace(/\?/g, (_, i) => `$${++i}`);
        this.query(transformedSql, p, (err, res) => {
            if (cb) cb(err, res?.rows);
        });
    };
} else {
    console.log('📁 使用本地 SQLite 数据库...');
    const dbDir = path.join(__dirname, 'database');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
    db = new sqlite3.Database(path.join(dbDir, 'nav.db'));
}

// --- 2. 异步初始化函数 (解决 401 和表缺失问题) ---
async function initializeDatabase() {
    const PK = DB_TYPE === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    
    try {
        console.log('🛠️ 正在检查表结构...');
        
        // 创建用户表 (增加 last_login 等字段)
        await db.query(`CREATE TABLE IF NOT EXISTS users (
            id ${DB_TYPE === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            last_login_time TEXT,
            last_login_ip TEXT
        )`);

        // 创建菜单表 (注意 "order" 在 Postgres 是保留字，必须加双引号)
        await db.query(`CREATE TABLE IF NOT EXISTS menus (
            id ${PK},
            name TEXT NOT NULL,
            "order" INTEGER DEFAULT 0
        )`);

        // 创建子菜单表
        await db.query(`CREATE TABLE IF NOT EXISTS sub_menus (
            id ${PK},
            parent_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            "order" INTEGER DEFAULT 0
        )`);

        // 创建卡片表
        await db.query(`CREATE TABLE IF NOT EXISTS cards (
            id ${PK},
            menu_id INTEGER,
            sub_menu_id INTEGER,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            logo_url TEXT,
            desc TEXT,
            "order" INTEGER DEFAULT 0
        )`);

        // --- 3. 写入默认数据 (防止 401) ---
        const userRes = await db.query('SELECT COUNT(*) as count FROM users');
        if (parseInt(userRes.rows ? userRes.rows[0].count : userRes.count || 0) === 0) {
            console.log('👤 正在创建管理员账户...');
            const hashedPw = await bcrypt.hash(config.admin.password, 10);
            await db.query('INSERT INTO users (username, password) VALUES ($1, $2)', 
                [config.admin.username, hashedPw]);
            console.log('✅ 管理员创建成功:', config.admin.username);
        }

        const menuRes = await db.query('SELECT COUNT(*) as count FROM menus');
        if (parseInt(menuRes.rows ? menuRes.rows[0].count : menuRes.count || 0) === 0) {
            console.log('📜 正在写入默认菜单...');
            await db.query(`INSERT INTO menus (name, "order") VALUES 
                ('Home', 1), ('Ai Stuff', 2), ('Cloud', 3), ('Software', 4), ('Tools', 5), ('Other', 6)`);
        }

    } catch (err) {
        console.error('❌ 数据库初始化失败:', err.message);
    }
}

// 延迟启动初始化，确保连接已建立
if (DB_TYPE === 'postgres') {
    // 注入 query 方法给 Pool 使用
    db.query = db.query.bind(db); 
    initializeDatabase();
} else {
    // SQLite 兼容处理
    db.query = (sql, params) => new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve({ rows }));
    });
    db.serialize(() => initializeDatabase());
}

module.exports = db;
