require('dotenv').config();

module.exports = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123'
  },
  server: {
    port: process.env.PORT || 8080,
    jwtSecret: process.env.JWT_SECRET || 'nav-item-jwt-secret-2024-secure-key'
  }

}; 
// config.js
// ... 你原有的配置 ...

// 默认配置
const defaultConfigs = {
  'site.title': '导航站',
  'site.name': '导航站',
  'site.customCss': '',
  'site.backgroundImage': '',
  'site.backgroundOpacity': '0.15',
  'site.iconApi': 'https://www.google.com/s2/favicons?domain={domain}&sz=256',
  'site.searchBoxEnabled': 'true',
  'site.searchBoxGuestEnabled': 'true',
};

module.exports = {
  // ... 你原有的导出 ...
  defaultConfigs  // 添加这一行
 
};

