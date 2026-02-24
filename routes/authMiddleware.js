// routes/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

module.exports = function(req, res, next) {
  // 从请求头获取 token
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  console.log('🔐 认证中间件 - Token:', token ? '存在' : '缺失');
  console.log('🔐 Authorization Header:', req.headers.authorization);
  
  if (!token) {
    console.error('❌ 未提供 token');
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log('✅ Token 验证成功，用户:', decoded.username);
    next();
  } catch (error) {
    console.error('❌ Token 验证失败:', error.message);
    return res.status(401).json({ error: 'Token 无效或已过期' });
  }
};
