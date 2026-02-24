const dbAdapter = require('./database/adapter');
const config = require('./config');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    // 1. 核心变量初始化，确保作用域正确
    const DB_TYPE = process.env.DB_TYPE || 'sqlite';
    const isPostgres = DB_TYPE === 'postgres';

    console.log(`🔄 启动数据库初始化流程 [模式: ${DB_TYPE}]...`);

    // 2. 建立基础连接
    await dbAdapter.init();

    if (isPostgres) {
        console.log('⚠️ 检测到 PostgreSQL 环境，正在验证表结构...');
        
        // --- 强制清理开关：如果还是打不开，取消下面这行的注释并推送一次 ---
        // await dbAdapter.run('DROP TABLE IF EXISTS cards, sub_menus, menus, users, ads, friends, configs CASCADE');

        // 重新调用 adapter.init 以确保执行建表语句
        await dbAdapter.init();
    }
    
    // 3. 检查并插入默认配置 (configs 表)
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
          console.warn(`⚠️ 配置项 ${key} 处理跳过 (可能表未就绪):`, configErr.message);
        }
      }
    }

    // 4. 强制管理员初始化 (解决 401)
try {
  const adminUsername = config.admin.username || 'admin';
  const adminExists = await dbAdapter.get('SELECT * FROM users WHERE username = ?', [adminUsername]);
  
  if (!adminExists) {
      console.log('👤 正在创建默认管理员账户...');
      const hashedPw = await bcrypt.hash(config.admin.password || 'admin123', 10);
      await dbAdapter.run('INSERT INTO users (username, password) VALUES (?, ?)', [adminUsername, hashedPw]);
      console.log('✅ 管理员已就绪:', adminUsername);
  }
} catch (userErr) {
  console.error('❌ 初始化管理员失败:', userErr.message);
}


    // 5. 补全初始分组和卡片 (解决空白页)
    try {
      const menuCheck = await dbAdapter.get('SELECT COUNT(*) as count FROM menus');
      // 兼容 Postgres 和 SQLite 的计数返回格式
      const menuCount = parseInt(menuCheck?.rows ? menuCheck.rows[0].count : (menuCheck?.count || 0));

      if (isNaN(menuCount) || menuCount === 0) {
          console.log('📜 正在注入初始菜单与卡片...');
          
          // 使用参数化查询防止报错
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
    // 即使初始化部分失败，我们也尽量让程序继续运行，而不是直接 crash
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};

