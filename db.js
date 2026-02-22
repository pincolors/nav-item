const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const config = require('./config');

const DB_TYPE = process.env.DB_TYPE || 'sqlite';
let db;

// --- 数据库初始化连接 ---
if (DB_TYPE === 'postgres') {
  console.log('检测到 DB_TYPE=postgres，正在连接远程数据库...');
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Koyeb 强制要求 SSL
  });

  // 抹平 pg 和 sqlite3 的 API 差异
  db.run = function(sql, params, callback) {
    const p = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    // 将 SQL 中的 ? 替换为 $1, $2...
    let i = 0;
    const transformedSql = sql.replace(/\?/g, () => `$${++i}`);
    this.query(transformedSql, p, (err, res) => {
      if (cb) cb.call({ lastID: res?.rows[0]?.id }, err, res);
    });
  };

  db.get = function(sql, params, callback) {
    const p = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    let i = 0;
    const transformedSql = sql.replace(/\?/g, () => `$${++i}`);
    this.query(transformedSql, p, (err, res) => {
      if (cb) cb(err, res?.rows[0]);
    });
  };

  db.all = function(sql, params, callback) {
    const p = Array.isArray(params) ? params : [];
    const cb = typeof params === 'function' ? params : callback;
    let i = 0;
    const transformedSql = sql.replace(/\?/g, () => `$${++i}`);
    this.query(transformedSql, p, (err, res) => {
      if (cb) cb(err, res?.rows);
    });
  };

  db.prepare = function(sql) {
    return {
      run: (p1, p2, p3, p4, cb) => {
        const params = [p1, p2, p3, p4].filter(v => v !== undefined && typeof v !== 'function');
        const callback = [p1, p2, p3, p4].find(v => typeof v === 'function');
        db.run(sql, params, callback);
      },
      finalize: (cb) => { if (cb) cb(); }
    };
  };
} else {
  console.log('未检测到 Postgres 配置，使用本地 SQLite...');
  const dbDir = path.join(__dirname, 'database');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  db = new sqlite3.Database(path.join(dbDir, 'nav.db'));
}

// --- 表结构初始化 (兼容两种语法) ---
const PK = DB_TYPE === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';

db.serialize = (cb) => cb(); // Postgres 默认就是序列化的

  db.run(`CREATE TABLE IF NOT EXISTS menus (
    id ${PK},
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS sub_menus (
    id ${PK},
    parent_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    "order" INTEGER DEFAULT 0
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id ${PK},
    menu_id INTEGER,
    sub_menu_id INTEGER,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    logo_url TEXT,
    custom_logo_path TEXT,
    desc TEXT,
    "order" INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id ${PK},
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    last_login_time TEXT,
    last_login_ip TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id ${PK},
    position TEXT NOT NULL,
    img TEXT NOT NULL,
    url TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS friends (
    id ${PK},
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    logo TEXT
  )`);

// --- 默认数据初始化逻辑 ---
setTimeout(() => {
  db.get('SELECT COUNT(*) as count FROM menus', (err, row) => {
    const count = row ? (row.count || row.count === 0 ? parseInt(row.count) : 0) : 0;
    if (count === 0) {
      console.log('数据库为空，开始写入默认数据...');
      const defaultMenus = [['Home', 1], ['Ai Stuff', 2], ['Cloud', 3], ['Software', 4], ['Tools', 5], ['Other', 6]];
      defaultMenus.forEach(([name, order]) => {
        db.run('INSERT INTO menus (name, "order") VALUES (?, ?)', [name, order]);
      });

      // 初始化管理员
      const passwordHash = bcrypt.hashSync(config.admin.password, 10);
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [config.admin.username, passwordHash]);
    }
  });
}, 2000);

module.exports = db;
