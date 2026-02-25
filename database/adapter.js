// database/adapter.js
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

class DatabaseAdapter {
  constructor() {
    this.dbType = process.env.DB_TYPE || 'sqlite';
    this.db = null;
    this.pool = null;
  }

  // ========================================
  // 初始化数据库连接
  // ========================================
  async init() {
    if (this.dbType === 'postgres') {
      // PostgreSQL 配置
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      console.log('✅ 使用 PostgreSQL 数据库');
      await this.initPostgresTables();
    } else {
      // SQLite 配置
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

  // ========================================
  // 初始化 SQLite 表结构
  // ========================================
  async initSqliteTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // 用户表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            last_login_time DATETIME,
            last_login_ip TEXT,
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

        // 广告表
        this.db.run(`
          CREATE TABLE IF NOT EXISTS ads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            position TEXT,
            img TEXT,
            url TEXT,
            title TEXT,
            order_num INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 友链表
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

  // ========================================
  // 初始化 PostgreSQL 表结构
  // ========================================
  async initPostgresTables() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 用户表
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          last_login_time TIMESTAMP,
          last_login_ip VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 菜单表
      await client.query(`
        CREATE TABLE IF NOT EXISTS menus (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          order_num INTEGER DEFAULT 0,
          is_public INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 子菜单表
      await client.query(`
        CREATE TABLE IF NOT EXISTS sub_menus (
          id SERIAL PRIMARY KEY,
          menu_id INTEGER REFERENCES menus(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          order_num INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 卡片表
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

      // 配置表
      await client.query(`
        CREATE TABLE IF NOT EXISTS configs (
          key VARCHAR(255) PRIMARY KEY,
          value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 广告表
      await client.query(`
        CREATE TABLE IF NOT EXISTS ads (
          id SERIAL PRIMARY KEY,
          position VARCHAR(50),
          img TEXT,
          url TEXT,
          title VARCHAR(255),
          order_num INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 友链表
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

  // ========================================
  // 统一的查询接口（SELECT）
  // ========================================
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

  // ========================================
  // 统一的执行接口（INSERT, UPDATE, DELETE）
  // 🔥 修复版本 - 解决 PostgreSQL RETURNING id 问题
  // ========================================

async run(sql, params = []) {
  if (this.dbType === 'postgres') {
    let pgSql = this.convertToPostgresSQL(sql);
    
    try {
      const result = await this.pool.query(pgSql, params);
      
      // 🔥 改进：如果有返回行且有 id，提取 id
      if (result.rows && result.rows.length > 0) {
        // 检查第一行是否有 id 字段
        if ('id' in result.rows[0]) {
          return {
            lastID: result.rows[0].id,
            changes: result.rowCount || 1
          };
        }
      }
      
      // 其他情况（UPDATE, DELETE, 或 INSERT 但没有 id）
      return {
        lastID: null,
        changes: result.rowCount || 0
      };
    } catch (error) {
      // 🔥 如果是 configs 表的 INSERT 报错，尝试不带 RETURNING
      if (error.message.includes('column "id" does not exist') && 
          sql.toUpperCase().includes('INSERT INTO CONFIGS')) {
        console.warn('⚠️ configs 表 INSERT 降级处理（不返回 id）');
        
        // 移除 RETURNING id 重试
        const simpleSql = pgSql.replace(/\s+RETURNING\s+id\s*$/i, '');
        const retryResult = await this.pool.query(simpleSql, params);
        
        return {
          lastID: null,
          changes: retryResult.rowCount || 0
        };
      }
      
      // 其他错误正常抛出
      console.error('❌ PostgreSQL 执行失败:', error.message);
      console.error('SQL:', pgSql);
      console.error('参数:', params);
      throw error;
    }
  } else {
    // SQLite
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
}

  // ========================================
  // 获取单条记录
  // ========================================
  async get(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  // ========================================
  // 转换 SQLite SQL 为 PostgreSQL SQL
  // 🔥 修复版本 - 自动添加 RETURNING id
  // ========================================
// database/adapter.js

convertToPostgresSQL(sql) {
  let pgSql = sql;
  
  // 1. 将 ? 占位符转换为 $1, $2, ...
  let index = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${index++}`);
  
  // 2. 替换 AUTOINCREMENT 为 SERIAL
  pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  
  // 3. 替换 DATETIME 为 TIMESTAMP
  pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
  
  // 4. 🔥 智能处理 RETURNING id
  if (pgSql.toUpperCase().includes('INSERT INTO')) {
    if (!pgSql.toUpperCase().includes('RETURNING')) {
      // 定义不使用 id 作为主键的表
      const tablesWithoutId = ['configs'];
      
      // 检查是否是这些表
      const isTableWithoutId = tablesWithoutId.some(table => 
        pgSql.toUpperCase().includes(`INSERT INTO ${table.toUpperCase()}`)
      );
      
      // 只为有 id 列的表添加 RETURNING id
      if (!isTableWithoutId) {
        pgSql = pgSql.replace(/;?\s*$/, ' RETURNING id');
      }
    }
  }
  
  return pgSql;
}


  // ========================================
  // 事务支持
  // ========================================
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

  // ========================================
  // 关闭数据库连接
  // ========================================
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

// 导出单例
const dbAdapter = new DatabaseAdapter();
module.exports = dbAdapter;
