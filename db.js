// db.js

const dbAdapter = require('./database/adapter');
const config = require('./config');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    const DB_TYPE = process.env.DB_TYPE || 'sqlite';
    const isPostgres = DB_TYPE === 'postgres';

    console.log(`🔄 启动数据库初始化流程 [模式: ${DB_TYPE}]...`);

    // 1. 建立基础连接并执行 adapter 里的基础建表
    await dbAdapter.init();

    // 2. 🔥 【核心修复】字段对齐与结构加固
    if (isPostgres) {
        console.log('⚠️ 正在同步 PostgreSQL 字段结构 (order_num / is_public)...');
        try {
            // 补齐 menus 表缺少的列
            await dbAdapter.run('ALTER TABLE menus ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0');
            await dbAdapter.run('ALTER TABLE menus ADD COLUMN IF NOT EXISTS is_public INTEGER DEFAULT 1');
            
            // 补齐 cards 表缺少的列
            await dbAdapter.run('ALTER TABLE cards ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0');
            
            // 处理旧字段迁移（如果原本有 "order" 列，将其数据同步到 order_num）
            // 注意：Postgres 里的 order 必须加双引号
            await dbAdapter.run('UPDATE menus SET order_num = "order" WHERE order_num = 0');
            console.log('✅ 字段结构同步完成');
        } catch (alterErr) {
            console.warn('💡 字段对齐提示 (可能已存在):', alterErr.message);
        }
    }
    
    // 3. 插入默认配置
    if (config.defaultConfigs) {
      console.log('📝 检查默认配置项...');
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        try {
          const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
          if (!existing) {
            await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
            console.log(`✅ 已补全配置: ${key}`);
          }
        } catch (configErr) {
          console.warn(`⚠️ 配置项 ${key} 处理跳过:`, configErr.message);
        }
      }
    }

    // 4. 管理员创建逻辑
    try {
      console.log('👤 检查管理员账户...');
      const adminUsername = process.env.ADMIN_USERNAME || (config.admin && config.admin.username) || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || (config.admin && config.admin.password) || 'admin123';
      
      const adminExists = await dbAdapter.get('SELECT * FROM users WHERE username = ?', [adminUsername]);
      
      if (!adminExists) {
        console.log(`👤 正在创建默认管理员账户: ${adminUsername}`);
        const hashedPw = await bcrypt.hash(adminPassword, 10);
        await dbAdapter.run('INSERT INTO users (username, password) VALUES (?, ?)', [adminUsername, hashedPw]);
        console.log(`✅ 管理员已就绪: ${adminUsername}`);
      } else {
        console.log(`✅ 管理员已存在: ${adminUsername}`);
      }
    } catch (userErr) {
      console.error('❌ 初始化管理员失败:', userErr.message);
    }

    // 5. 补全初始数据 (适配新字段名 order_num)
    try {
      const menuCheck = await dbAdapter.get('SELECT COUNT(*) as count FROM menus');
      const menuCount = parseInt(menuCheck?.count || (menuCheck?.rows ? menuCheck.rows[0].count : 0));

      if (menuCount === 0) {
        console.log('📜 正在注入初始菜单与卡片...');
        // 插入时明确使用新字段名 order_num
        await dbAdapter.run('INSERT INTO menus (name, order_num, is_public) VALUES (?, ?, ?)', ['常用推荐', 1, 1]);
        const firstMenu = await dbAdapter.get('SELECT id FROM menus WHERE name = ?', ['常用推荐']);
        
        if (firstMenu && (firstMenu.id || firstMenu.rows)) {
          const mId = firstMenu.id || firstMenu.rows[0].id;
          await dbAdapter.run(
            'INSERT INTO cards (menu_id, title, url, "desc", order_num) VALUES (?, ?, ?, ?, ?)',
            [mId, 'Google', 'https://www.google.com', '全球搜索引擎', 1]
          );
          console.log('✅ 初始数据注入成功！');
        }
      }
    } catch (dataErr) {
      console.warn('⚠️ 初始数据注入跳足:', dataErr.message);
    }
    
    console.log('🚀 数据库层加载完成，准备启动服务！');
  } catch (error) {
    console.error('❌ 数据库致命错误:', error.message);
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};
