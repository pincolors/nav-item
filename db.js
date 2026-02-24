// db.js

const dbAdapter = require('./database/adapter');
const config = require('./config');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    const DB_TYPE = process.env.DB_TYPE || 'sqlite';
    const isPostgres = DB_TYPE === 'postgres';

    console.log(`🔄 启动数据库初始化流程 [模式: ${DB_TYPE}]...`);

    // 建立基础连接
    await dbAdapter.init();

    if (isPostgres) {
        console.log('⚠️ 检测到 PostgreSQL 环境，正在验证表结构...');
        await dbAdapter.init();
    }
    
    // 插入默认配置
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

    // 🔥 改进后的管理员创建逻辑
    try {
      console.log('👤 检查管理员账户...');
      
      // 使用环境变量或配置文件或默认值
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
        console.log(`👤 正在创建默认管理员账户: ${adminUsername}`);
        const hashedPw = await bcrypt.hash(adminPassword, 10);
        await dbAdapter.run(
          'INSERT INTO users (username, password) VALUES (?, ?)', 
          [adminUsername, hashedPw]
        );
        console.log(`✅ 管理员已就绪: ${adminUsername} / ${adminPassword}`);
      } else {
        console.log(`✅ 管理员已存在: ${adminUsername}`);
      }
    } catch (userErr) {
      console.error('❌ 初始化管理员失败:', userErr.message);
      console.error('完整错误:', userErr);
    }

    // 补全初始分组和卡片
    try {
      const menuCheck = await dbAdapter.get('SELECT COUNT(*) as count FROM menus');
      const menuCount = parseInt(menuCheck?.count || 0);

      if (menuCount === 0) {
        console.log('📜 正在注入初始菜单与卡片...');
        
        await dbAdapter.run('INSERT INTO menus (name, "order") VALUES (?, ?)', ['常用推荐', 1]);
        const firstMenu = await dbAdapter.get('SELECT id FROM menus WHERE name = ?', ['常用推荐']);
        
        if (firstMenu && firstMenu.id) {
          await dbAdapter.run(
            'INSERT INTO cards (menu_id, title, url, "desc", "order") VALUES (?, ?, ?, ?, ?)',
            [firstMenu.id, 'Google', 'https://www.google.com', '全球搜索引擎', 1]
          );
          console.log('✅ 初始数据注入成功！');
        }
      }
    } catch (dataErr) {
      console.warn('⚠️ 初始数据注入跳过:', dataErr.message);
    }
    
    console.log('🚀 数据库层加载完成，准备启动服务！');
  } catch (error) {
    console.error('❌ 数据库致命错误:', error.message);
    console.error('完整错误:', error);
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};
