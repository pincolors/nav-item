// db.js
const dbAdapter = require('./database/adapter');
const config = require('./config');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    const DB_TYPE = process.env.DB_TYPE || 'sqlite';
    const isPostgres = DB_TYPE === 'postgres';

    console.log(`🔄 启动数据库初始化流程 [模式: ${DB_TYPE}]...`);

    // ========================================
    // 1. 建立基础连接
    // ========================================
    await dbAdapter.init();

    // ========================================
    // 2. PostgreSQL 字段结构对齐
    // ========================================
    if (isPostgres) {
      console.log('⚠️ 正在同步 PostgreSQL 字段结构...');
      try {
        // 确保所有表的字段都存在
        await dbAdapter.run('ALTER TABLE menus ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0');
        await dbAdapter.run('ALTER TABLE menus ADD COLUMN IF NOT EXISTS is_public INTEGER DEFAULT 1');
        await dbAdapter.run('ALTER TABLE sub_menus ADD COLUMN IF NOT EXISTS order_num INTEGER DEFAULT 0');
        
        // 🔥 关键：cards 表使用的是 "order"（带引号），不是 order_num
        await dbAdapter.run('ALTER TABLE cards ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0');
        
        // 确保所有菜单可见
        await dbAdapter.run('UPDATE menus SET is_public = 1 WHERE is_public IS NULL OR is_public = 0');
        
        console.log('✅ 字段结构同步与可见性修复完成');
      } catch (alterErr) {
        console.warn('💡 字段对齐提示:', alterErr.message);
      }
    }
    
    // ========================================
    // 3. 插入默认配置
    // ========================================
    if (config.defaultConfigs) {
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        try {
          const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
          if (!existing) {
            await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
            console.log(`✅ 配置已添加: ${key}`);
          }
        } catch (configErr) {
          // 静默忽略配置表错误
        }
      }
    }

    // ========================================
    // 4. 管理员账号初始化
    // ========================================
    try {
      const adminUsername = process.env.ADMIN_USERNAME 
        || (config.admin && config.admin.username) 
        || 'admin';
        
      const adminPassword = process.env.ADMIN_PASSWORD 
        || (config.admin && config.admin.password) 
        || 'admin123';
      
      const adminExists = await dbAdapter.get(
        'SELECT * FROM users WHERE username = ?', 
        [adminUsername]
      );
      
      if (!adminExists) {
        console.log(`👤 正在创建管理员账户: ${adminUsername}`);
        const hashedPw = await bcrypt.hash(adminPassword, 10);
        await dbAdapter.run(
          'INSERT INTO users (username, password) VALUES (?, ?)', 
          [adminUsername, hashedPw]
        );
        console.log(`✅ 管理员已创建: ${adminUsername} / ${adminPassword}`);
      } else {
        console.log(`✅ 管理员已存在: ${adminUsername}`);
      }
    } catch (userErr) {
      console.error('❌ 管理员初始化失败:', userErr.message);
    }

    // ========================================
    // 5. 初始数据注入（如果表为空）
    // ========================================
    try {
      const menuCheck = await dbAdapter.get('SELECT COUNT(*) as count FROM menus');
      
      // 兼容不同数据库的返回格式
      const menuCount = parseInt(
        menuCheck?.count || 
        (menuCheck?.rows ? menuCheck.rows[0]?.count : 0) || 
        0
      );

      if (menuCount === 0) {
        console.log('📜 注入初始菜单与卡片...');
        
        // 插入初始菜单
        await dbAdapter.run(
          'INSERT INTO menus (name, order_num, is_public) VALUES (?, ?, ?)', 
          ['常用推荐', 1, 1]
        );
        
        // 获取刚插入的菜单 ID
        const firstMenu = await dbAdapter.get('SELECT id FROM menus WHERE name = ?', ['常用推荐']);
        
        if (firstMenu && firstMenu.id) {
          // 🔥 注意：cards 表使用 "order"（带引号）
          await dbAdapter.run(
            'INSERT INTO cards (menu_id, title, url, "desc", "order") VALUES (?, ?, ?, ?, ?)',
            [firstMenu.id, 'Google', 'https://www.google.com', '全球搜索引擎', 1]
          );
          
          await dbAdapter.run(
            'INSERT INTO cards (menu_id, title, url, "desc", "order") VALUES (?, ?, ?, ?, ?)',
            [firstMenu.id, 'GitHub', 'https://github.com', '代码托管平台', 2]
          );
          
          console.log('✅ 初始数据注入成功！');
        }
      } else {
        console.log(`✅ 菜单表已有数据，跳过初始化（共 ${menuCount} 条）`);
      }
    } catch (dataErr) {
      console.warn('⚠️ 初始数据注入失败:', dataErr.message);
    }
    
    console.log('🚀 数据库层加载完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化致命错误:', error.message);
    console.error('完整错误:', error);
    // 不要 throw，让应用继续启动
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};
