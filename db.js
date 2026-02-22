const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const config = require('./config');

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let db;

// --- 1. 数据库连接与兼容性处理 ---
if (DB_TYPE === 'postgres') {
    console.log('📡 正在建立 Postgres 连接...');
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    // 抹平 pg 与 sqlite3 的 API 差异
    db.run = (sql, params, cb) => {
        const p = Array.isArray(params) ? params : [];
        const callback = typeof params === 'function' ? params : cb;
        db.query(sql.replace(/\?/g, (_, i) => `$${++i}`), p, (err, res) => {
            if (callback) callback.call({ lastID: res?.rows[0]?.id }, err, res);
        });
    };

    db.get = (sql, params, cb) => {
        const p = Array.isArray(params) ? params : [];
        const callback = typeof params === 'function' ? params : cb;
        db.query(sql.replace(/\?/g, (_, i) => `$${++i}`), p, (err, res) => {
            if (callback) callback(err, res?.rows[0]);
        });
    };

    db.all = (sql, params, cb) => {
        const p = Array.isArray(params) ? params : [];
        const callback = typeof params === 'function' ? params : cb;
        db.query(sql.replace(/\?/g, (_, i) => `$${++i}`), p, (err, res) => {
            if (callback) callback(err, res?.rows);
        });
    };
} else {
    const dbDir = path.join(__dirname, 'database');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
    db = new sqlite3.Database(path.join(dbDir, 'nav.db'));
}

// --- 2. 核心初始化逻辑 (Async 模式) ---
async function setupDatabase() {
    const isPG = DB_TYPE === 'postgres';
    const PK = isPG ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    
    // 获取执行函数 (兼容两种库)
    const execute = (sql, params = []) => {
        if (isPG) return db.query(sql.replace(/\?/g, (_, i) => `$${++i}`), params);
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => err ? reject(err) : resolve({ rows }));
        });
    };

    try {
        console.log('🛠️ 开始检查表结构...');
        
        // 依次创建表
        await execute(`CREATE TABLE IF NOT EXISTS users (id ${PK}, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, last_login_time TEXT, last_login_ip TEXT)`);
        await execute(`CREATE TABLE IF NOT EXISTS menus (id ${PK}, name TEXT NOT NULL, "order" INTEGER DEFAULT 0)`);
        await execute(`CREATE TABLE IF NOT EXISTS sub_menus (id ${PK}, parent_id INTEGER NOT NULL, name TEXT NOT NULL, "order" INTEGER DEFAULT 0)`);
        await execute(`CREATE TABLE IF NOT EXISTS cards (id ${PK}, menu_id INTEGER, sub_menu_id INTEGER, title TEXT NOT NULL, url TEXT NOT NULL, logo_url TEXT, "desc" TEXT, "order" INTEGER DEFAULT 0)`);

        // 检查并插入默认管理员 (解决 401)
        const userCount = await execute('SELECT COUNT(*) as count FROM users');
        const count = parseInt(isPG ? userCount.rows[0].count : userCount.rows[0].count);
        
        if (count === 0) {
            console.log('👤 正在创建默认管理员...');
            const hashedPw = await bcrypt.hash(config.admin.password, 10);
            await execute('INSERT INTO users (username, password) VALUES (?, ?)', [config.admin.username, hashedPw]);
            console.log('✅ 管理员创建成功:', config.admin.username);
        }

        // 检查并插入默认菜单 (解决 500 空白页)
        const menuCount = await execute('SELECT COUNT(*) as count FROM menus');
        const mCount = parseInt(isPG ? menuCount.rows[0].count : menuCount.rows[0].count);
        
        if (mCount === 0) {
            console.log('📜 正在写入默认菜单数据...');
            const defaultMenus = [['Home', 1], ['Ai Stuff', 2], ['Cloud', 3], ['Software', 4], ['Tools', 5], ['Other', 6]];
            for (const [name, order] of defaultMenus) {
                await execute('INSERT INTO menus (name, "order") VALUES (?, ?)', [name, order]);
            }
            console.log('✅ 默认菜单写入成功！');
        }

    } catch (err) {
        console.error('❌ 数据库初始化发生严重错误:', err.message);
    }
}

// 启动
if (isPG) {
    setupDatabase();
} else {
    db.serialize(() => setupDatabase());
}

module.exports = db;
