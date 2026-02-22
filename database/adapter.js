// database/adapter.js
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

class DatabaseAdapter {
  constructor() {
    this.dbType = process.env.DB_TYPE || 'sqlite';
    this.db = null;
    this.pool = null;
  }

  async init() {
    if (this.dbType === 'postgres') {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      console.log('✅ 使用 PostgreSQL 数据库');
      await this.initPostgresTables();
    } else {
      const dbPath = process.env.DB_PATH || './database/nav.db';
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('SQLite 连接失败:', err);
        } else {
          console.log('✅ 使用 SQLite 数据库:', dbPath);
        }
      });
      await this.initSqliteTables();
    }
  }

  async initSqliteTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 用户表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 菜单表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS menus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            order_num INTEGER DEFAULT 0,
            is_public INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 子菜单表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS sub_menus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            menu_id INTEGER,
            name TEXT NOT NULL,
            order_num INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(menu_id) REFERENCES menus(id) ON DELETE CASCADE
          )
        `);

        // 卡片表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            menu_id INTEGER,
            sub_menu_id INTEGER,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            logo_url TEXT,
            custom_logo_path TEXT,
            desc TEXT,
            "order" INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(menu_id) REFERENCES menus(id) ON DELETE CASCADE,
            FOREIGN KEY(sub_menu_id) REFERENCES sub_menus(id) ON DELETE CASCADE
          )
        `);

        // 配置表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS configs (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 广告表（如果存在）
        this.db.run(`
          CREATE TABLE IF NOT EXISTS ads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            image_url TEXT,
            link_url TEXT,
            position TEXT,
            order_num INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 友链表（如果存在）
        this.db.run(`
          CREATE TABLE IF NOT EXISTS friend_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            logo_url TEXT,
            description TEXT,
            order_num INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async initPostgresTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS menus (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          order_num INTEGER DEFAULT 0,
          is_public INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS sub_menus (
          id SERIAL PRIMARY KEY,
          menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          order_num INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS cards (
          id SERIAL PRIMARY KEY,
          menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
          sub_menu_id INTEGER REFERENCES sub_menus(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          url TEXT NOT NULL,
          logo_url TEXT,
          custom_logo_path TEXT,
          "desc" TEXT,
          "order" INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS configs (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS ads (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255),
          image_url TEXT,
          link_url TEXT,
          position VARCHAR(100),
          order_num INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS friend_links (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          url TEXT NOT NULL,
          logo_url TEXT,
          description TEXT,
          order_num INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query('COMMIT');
      console.log('✅ PostgreSQL 表结构初始化完成');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ PostgreSQL 表初始化失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async query(sql, params = []) {
    if (this.dbType === 'postgres') {
      const pgSql = this.convertToPostgresSQL(sql);
      const result = await this.pool.query(pgSql, params);
      return result.rows;
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    }
  }

  async run(sql, params = []) {
    if (this.dbType === 'postgres') {
      const pgSql = this.convertToPostgresSQL(sql);
      
      if (pgSql.toUpperCase().includes('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
        const modifiedSql = pgSql.replace(/;?\s*$/, ' RETURNING id');
        const result = await this.pool.query(modifiedSql, params);
        return {
          lastID: result.rows[0]?.id || null,
          changes: result.rowCount
        };
      }
      
      const result = await this.pool.query(pgSql, params);
      return {
        lastID: null,
        changes: result.rowCount
      };
    } else {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
  }

  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  convertToPostgresSQL(sql) {
    let pgSql = sql;
    let index = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${index++}`);
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
    return pgSql;
  }

  async transaction(callback) {
    if (this.dbType === 'postgres') {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      return new Promise((resolve, reject) => {
        this.db.serialize(async () => {
          this.db.run('BEGIN TRANSACTION');
          try {
            const result = await callback(this.db);
            this.db.run('COMMIT', (err) => {
              if (err) reject(err);
              else resolve(result);
            });
          } catch (error) {
            this.db.run('ROLLBACK');
            reject(error);
          }
        });
      });
    }
  }

  async close() {
    if (this.dbType === 'postgres') {
      await this.pool.end();
      console.log('✅ PostgreSQL 连接已关闭');
    } else {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else {
            console.log('✅ SQLite 连接已关闭');
            resolve();
          }
        });
      });
    }
  }
}

const dbAdapter = new DatabaseAdapter();
module.exports = dbAdapter;
