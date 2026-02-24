const dbAdapter = require('./database/adapter');
const config = require('./config');

async function initDatabase() {
  try {
    // 1. 建立基础连接
    await dbAdapter.init();

    const isPostgres = process.env.DB_TYPE === 'postgres';
    
    if (isPostgres) {
        console.log('⚠️ 正在执行数据库强制修复程序...');
        
        // --- 核心修复：直接运行原生 SQL 重置所有表结构 ---
        // 这样可以跳过 adapter.js 里面可能存在的错误语法
        const dropSql = 'DROP TABLE IF EXISTS cards, sub_menus, menus, users, ads, friends, configs CASCADE';
        await dbAdapter.run(dropSql);
        console.log('✅ 旧表已清理');

        // 手动定义正确的建表语句，确保每个表都有 id SERIAL PRIMARY KEY
        const createTables = [
            `CREATE TABLE configs (id SERIAL PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT)`,
            `CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, last_login_time TEXT, last_login_ip TEXT)`,
            `CREATE TABLE menus (id SERIAL PRIMARY KEY, name TEXT NOT NULL, "order" INTEGER DEFAULT 0)`,
            `CREATE TABLE sub_menus (id SERIAL PRIMARY KEY, parent_id INTEGER NOT NULL, name TEXT NOT NULL, "order" INTEGER DEFAULT 0)`,
            `CREATE TABLE cards (id SERIAL PRIMARY KEY, menu_id INTEGER, sub_menu_id INTEGER, title TEXT NOT NULL, url TEXT NOT NULL, logo_url TEXT, "desc" TEXT, "order" INTEGER DEFAULT 0)`
        ];

        for (const sql of createTables) {
            await dbAdapter.run(sql);
        }
        console.log('✅ 结构强制重建完成');
    }
    
    // 2. 插入默认配置 (此时 id 列一定存在了)
    if (config.defaultConfigs) {
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
        if (!existing) {
          await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
          console.log(`✅ 插入默认配置: ${key}`);
        }
      }
    }

    // 3. 初始管理员
    if (config.admin) {
        const adminExists = await dbAdapter.get('SELECT * FROM users WHERE username = ?', [config.admin.username]);
        if (!adminExists) {
            const bcrypt = require('bcrypt');
            const hashedPw = await bcrypt.hash(config.admin.password, 10);
            await dbAdapter.run('INSERT INTO users (username, password) VALUES (?, ?)', [config.admin.username, hashedPw]);
            console.log('👤 管理员账户已初始化');
        }
    }
    
    console.log('🚀 数据库完美就绪，服务即将启动！');
  } catch (error) {
    console.error('❌ 致命错误:', error.message);
    // 打印堆栈信息协助排查
    console.error(error.stack);
    throw error;
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};
