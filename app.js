// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const { db, initDatabase } = require('./db');

// 导入路由
const menuRoutes = require('./routes/menu');
const cardRoutes = require('./routes/card');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const adRoutes = require('./routes/ad');
const friendRoutes = require('./routes/friend');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'web/dist')));

// 前端路由处理中间件（放在 API 路由之前）
app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    !fs.existsSync(path.join(__dirname, 'web/dist', req.path))
  ) {
    res.sendFile(path.join(__dirname, 'web/dist', 'index.html'));
  } else {
    next();
  }
});

// API 路由
app.use('/api/menus', menuRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);

// 健康检查接口（可选，用于 Koyeb 等平台）
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: process.env.DB_TYPE || 'sqlite'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message
  });
});

// 404 处理（放在最后）
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API 路由不存在' });
  } else {
    res.sendFile(path.join(__dirname, 'web/dist', 'index.html'));
  }
});

// 启动服务器
async function startServer() {
  try {
    console.log('');
    console.log('========================================');
    console.log('🚀 正在启动服务器...');
    console.log('========================================');
    
    // 初始化数据库
    console.log('🔄 正在初始化数据库...');
    await initDatabase();
    
    // 启动 HTTP 服务
    app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('========================================');
      console.log('✅ 服务器启动成功！');
      console.log('----------------------------------------');
      console.log(`🌐 本地地址: http://localhost:${PORT}`);
      console.log(`🌐 网络地址: http://0.0.0.0:${PORT}`);
      console.log(`📊 数据库类型: ${process.env.DB_TYPE || 'sqlite'}`);
      console.log(`🗄️  数据库路径: ${process.env.DB_TYPE === 'postgres' ? 'PostgreSQL (远程)' : (process.env.DB_PATH || './database/nav.db')}`);
      console.log(`🌍 运行环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📦 压缩: 已启用`);
      console.log(`🔐 CORS: 已启用`);
      console.log('========================================');
      console.log('');
      console.log('💡 提示:');
      console.log('  - API 接口: http://localhost:' + PORT + '/api');
      console.log('  - 健康检查: http://localhost:' + PORT + '/health');
      console.log('  - 前端页面: http://localhost:' + PORT);
      console.log('');
      console.log('按 Ctrl+C 停止服务器');
      console.log('========================================');
      console.log('');
    });
    
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ 服务器启动失败！');
    console.error('========================================');
    console.error('错误详情:', error);
    console.error('');
    
    if (error.code === 'EADDRINUSE') {
      console.error(`端口 ${PORT} 已被占用，请尝试:`);
      console.error(`  1. 更改端口: PORT=3001 npm start`);
      console.error(`  2. 或关闭占用该端口的程序`);
    } else if (error.code === 'EACCES') {
      console.error(`没有权限监听端口 ${PORT}`);
      console.error(`  请尝试使用更高的端口号 (>1024)`);
    } else {
      console.error('请检查以上错误信息');
    }
    
    console.error('========================================');
    console.error('');
    process.exit(1);
  }
}

// 优雅关闭
async function gracefulShutdown(signal) {
  console.log('');
  console.log('========================================');
  console.log(`🛑 收到 ${signal} 信号，正在优雅关闭...`);
  console.log('========================================');
  
  try {
    // 关闭数据库连接
    console.log('🔄 正在关闭数据库连接...');
    await db.close();
    
    console.log('');
    console.log('========================================');
    console.log('✅ 服务器已安全关闭');
    console.log('========================================');
    console.log('');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ 关闭时发生错误:', error);
    console.error('========================================');
    console.error('');
    process.exit(1);
  }
}

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获的异常处理
process.on('uncaughtException', (error) => {
  console.error('');
  console.error('========================================');
  console.error('❌ 未捕获的异常:');
  console.error('========================================');
  console.error(error);
  console.error('');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('');
  console.error('========================================');
  console.error('❌ 未处理的 Promise 拒绝:');
  console.error('========================================');
  console.error('原因:', reason);
  console.error('Promise:', promise);
  console.error('');
  gracefulShutdown('unhandledRejection');
});

// 启动应用
if (require.main === module) {
  startServer();
}

// 导出 app（用于测试）
module.exports = app;
