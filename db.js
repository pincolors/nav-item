const dbAdapter = require('./database/adapter');
const config = require('./config');
const bcrypt = require('bcrypt');

async function initDatabase() {
  try {
    // 1. 建立基础连接
    await dbAdapter.init();

    const isPostgres = process.env.DB_TYPE === 'postgres';
    
    if (isPostgres) {
        console.log('⚠️ 正在同步 PostgreSQL 数据库结构...');
        
        // --- 【关键】如果你想彻底重置一次，取消下面这一行的注释并推送，成功后记得再注释掉 ---
        // await dbAdapter.run('DROP TABLE IF EXISTS cards, sub_menus, menus, users, ads, friends, configs CASCADE');

        // 执行建表（adapter 里的 init 通常包含 CREATE TABLE）
        await dbAdapter.init();
    }
    
    // 2. 检查并插入默认配置
    if (config.defaultConfigs) {
      for (const [key, value] of Object.entries(config.defaultConfigs)) {
        const existing = await dbAdapter.get('SELECT * FROM configs WHERE key = ?', [key]);
        if (!existing) {
          await dbAdapter.run('INSERT INTO configs (key, value) VALUES (?, ?)', [key, value]);
          console.log(`✅ 插入默认配置: ${key}`);
        }
      }
    }

    // 3. 检查并初始化管理员 (解决 401)
    const adminUser = config.admin.username || 'admin';
    const adminExists = await dbAdapter.get('SELECT * FROM users WHERE username = ?', [adminUser]);
    if (!adminExists) {
        console.log('👤 正在创建管理员账户...');
        const hashedPw = await bcrypt.hash(config.admin.password || 'admin123', 10);
        await dbAdapter.run('INSERT INTO users (username, password) VALUES (?, ?)', [adminUser, hashedPw]);
        console.log('✅ 管理员已就绪:', adminUser);
    }

    // 4. 检查并补全初始数据 (解决空白页)
    const menuCheck = await dbAdapter.get('SELECT COUNT(*) as count FROM menus');
    // 兼容 Postgres 和 SQLite 的计数返回格式
    const menuCount = parseInt(menuCheck.rows ? menuCheck.rows[0].count : (menuCheck.count || 0));

    if (menuCount === 0) {
        console.log('📜 数据库为空，正在注入初始卡片和分组...');
        
        // 插入分组 (使用 Postgres 兼容的引号)
        await dbAdapter.run('INSERT INTO menus (name, "order") VALUES (?, ?)', ['常用推荐', 1]);
        await dbAdapter.run('INSERT INTO menus (name, "order") VALUES (?, ?)', ['技术社区', 2]);

        const firstMenu = await dbAdapter.get('SELECT id FROM menus WHERE name = ?', ['常用推荐']);
        if (firstMenu) {
            const mId = firstMenu.id;
            // 插入初始卡片
            await dbAdapter.run(
                'INSERT INTO cards (menu_id, title, url, "desc", "order") VALUES (?, ?, ?, ?, ?)',
                [mId, 'Google', 'https://www.google.com', '全球搜索引擎', 1]
            );
            await dbAdapter.run(
                'INSERT INTO cards (menu_id, title, url, "desc", "order") VALUES (?, ?, ?, ?, ?)',
                [mId, 'GitHub', 'https://github.com', '开源代码托管', 2]
            );
        }
        console.log('✅ 初始数据注入完成！');
    }
    
    console.log('🎉 数据库所有环节已就绪！');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

module.exports = {
  db: dbAdapter,
  initDatabase
};
