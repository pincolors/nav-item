# 🌐 WebNavHub - 个人导航站

一个现代化、美观、功能完整的个人导航站系统。

## ✨ 特性

- 📂 **多级菜单**：支持主菜单和子菜单分类
- 🎴 **卡片管理**：智能分组、拖拽排序
- 🎨 **新拟态设计**：优雅的 UI 风格
- 🌓 **主题切换**：深色/浅色模式
- 📱 **移动优先**：完美适配各种设备
- 🔐 **用户认证**：JWT 安全认证
- 💾 **数据持久化**：PostgreSQL 数据库
- 🔍 **多引擎搜索**：Google、百度、Bing 等

## ENVIORMENT VARIABLES
- 
- PORT="8080"
-NJWT_SECRET="32位”
- DATABASE_URL="postgres:/…”
 -  DB_TYPE="postgres"
- NODE_ENV="production" ADMIN_USERNAME="admin"
- ADMIN_PASSWORD="7admin123" sslmode="require"
- PORT="8080"
- JWT_SECRET="32位”
- DATABASE_URL="postgres:/…”
- DB_TYPE="postgres"
- NODE_ENV="production" ADMIN_USERNAME="admin"
- ADMIN_PASSWORD="7admin123" sslmode="require"

### 本地开发

\`\`\`bash
# 安装依赖
npm install

# 启动后端
npm start

# 启动前端
cd web && npm run dev
\`\`\`

### Docker 部署

\`\`\`bash
docker build -t nav-hub .
docker run -p 8080:8080 nav-hub
\`\`\`

## 📦 技术栈

- **前端**: Vue 3, Vite
- **后端**: Node.js, Express
- **数据库**: PostgreSQL / SQLite
- **部署**: Docker容器等

📊 项目架构总结

nav-item/
├── backend/
│   ├── routes/
│   │   ├── menu.js        ✅ 菜单 + 子菜单管理
│   │   ├── card.js        ✅ 卡片管理（支持分组）
│   │   ├── auth.js        ✅ 认证
│   │   └── ...
│   ├── database/
│   │   └── adapter.js     ✅ 双数据库适配器
│   ├── db.js              ✅ 数据库初始化
│   └── app.js             ✅ Express 服务器
├── frontend/
│   ├── components/
│   │   ├── MenuBar.vue    ✅ 菜单栏（含子菜单编辑）
│   │   ├── SiteModal.vue  ✅ 卡片编辑（含分组选择）
│   │   └── CardGrid.vue   ✅ 卡片展示
│   ├── views/
│   │   └── Home.vue       ✅ 主页面
│   └── api.js             ✅ API 封装
└── Dockerfile             ✅ Docker 配置


## 📸 截图
![image](https://github.com/user-attachments/assets/fc8d6e3e-92ce-4d14-aefc-5f86790b2ced)

![image](https://github.com/user-attachments/assets/1215da02-47cb-44af-9b1d-3ee3d68d8730)

![image](https://github.com/user-attachments/assets/2753d2e8-9b10-47ea-bd33-3b850712a652)



## 📄 License

MIT





