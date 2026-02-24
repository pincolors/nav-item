// db.js

const dbAdapter = require('./database/adapter');
const config = require('./config');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    const DB_TYPE = process.env.DB_TYPE || 'sqlite';
    const isPostgres = DB_TYPE === 'postgres';

    console.log(`🔄 启动数据库初始化流程 [模式: ${DB_TYPE}]...`);

    // 1. 建立基础连接
    await dbAdapter.init();

    // 2. 字段结构强制对齐 (确保 order_num 和 is_public 存在)
    if (isPostgres) {
        console.log('⚠️ 正在同步 PostgreSQL 字段结构...');
        try {
            await dbAdapter.run('ALTER TABLE menus ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0');
            await dbAdapter.run('ALTER TABLE menus ADD COLUMN IF NOT EXISTS is_public INTEGER DEFAULT 1');
            await dbAdapter.run('ALTER TABLE cards ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0');
            
            // 关键：如果之前有遗留的 is_public 为 0 的数据，全部设为 1 确保前端可见
            await dbAdapter.run('UPDATE menus SET is_public = 1 WHERE is_public IS NULL OR is_public = 0');
            console.log('✅ 字段结构同步与可见性修复完成');
        } catch (alterErr) {
            console.warn('💡 字段对齐提示:', alterErr.message);
        }
    }
    
    // 3. 插入默认配置
    if (config.defaultConfigs) {
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        try {
          const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
          if (!existing) {
            await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
          }
        } catch (e) {}
      }
    }

    // 4. 管理员创建逻辑
    try {
      const adminUsername = process.env.ADMIN_USERNAME || (config.admin && config.admin.username) || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || (config.admin && config.admin.password) || 'admin123';
      const adminExists = await dbAdapter.get('SELECT * FROM users WHERE username = ?', [adminUsername]);
      
      if (!adminExists) {
        const hashedPw = await bcrypt.hash(adminPassword, 10);
        await dbAdapter.run('INSERT INTO users (username, password) VALUES (?, ?)', [adminUsername, hashedPw]);
        console.log(`✅ 管理员已就绪: ${adminUsername}`);
      }
    } catch (userErr) {}

    // 5. 初始数据注入 (增加 is_public = 1)
    try {
      const menuCheck = await dbAdapter.get('SELECT COUNT(*) as count FROM menus');
      const menuCount = parseInt(menuCheck?.count || (menuCheck?.rows ? menuCheck.rows[0].count : 0));

      if (menuCount === 0) {
        console.log('📜 注入初始菜单...');
        await dbAdapter.run('INSERT INTO menus (name, order_num, is_public) VALUES (?, ?, ?)', ['常用推荐', 1, 1]);
        const firstMenu = await dbAdapter.get('SELECT id FROM menus WHERE name = ?', ['常用推荐']);
        
        if (firstMenu) {
          const mId = firstMenu.id || (firstMenu.rows ? firstMenu.rows[0].id : null);
          if (mId) {
            await dbAdapter.run(
              'INSERT INTO cards (menu_id, title, url, "desc", order_num) VALUES (?, ?, ?, ?, ?)',
              [mId, 'Google', 'https://www.google.com', '全球搜索引擎', 1]
            );
            console.log('✅ 初始数据可见性注入成功！');
          }
        }
      }
    } catch (dataErr) {}
    
    console.log('🚀 数据库层加载完成！');
  } catch (error) {
    console.error('❌ 数据库致命错误:', error.message);
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};
