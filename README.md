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

NODE_ENV=production
PORT=8080
ADMIN_USERNAME=YOUR_USERNAME
ADMIN_PASSWORD=7YOUR_PASSWORD
JWT_SECRET=32位
DB_TYPE=postgres
DATABASE_URL=postgres:/…
sslmode=require

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


nav-item
│  .dockerignore
│  .env
│  .gitignore
│  app.js
│  config.js
│  db.js
│  docker-compose.yml
│  Dockerfile
│  LICENSE
│  package-lock.json
│  package.json
│  README.md
├─.github
│  └─workflows
│          build-image.yml
│          buildpushdocker.yml
│
├─assets
│      1.jpg
│      7.jpg
│
├─database
│      adapter.js
│      nav.db
│
├─routes
│      ad.js
│      auth.js
│      authMiddleware.js
│      card.js
│      config.js
│      friend.js
│      menu.js
│      upload.js
│      user.js
│
├─uploads
│      default-favicon.png
│
└─web
    │  index.html
    │  package-lock.json
    │  package.json
    │  vite.config.mjs
    │
    ├─public
    │      apple-touch-icon.png
    │      background.webp
    │      favicon-96x96.png
    │      favicon.ico
    │      logo-cropped.svg
    │      logo-dark.svg
    │      logo-light.svg
    │      masked-icon.svg
    │      pwa-192x192.png
    │      pwa-512x512.png
    │      robots.txt
    │
    └─src
        │  api.js
        │  App.vue
        │  main.js
        │  router.js
        │
        ├─components
        │      CardGrid.vue
        │      Icon.vue
        │      MenuBar.vue
        │      QuickImportModal.vue
        │      SiteModal.vue
        │      SubMenuManager.vue
        │      SystemSettings.vue
        │      UserManage.vue
        │
        └─views
            │  Admin.vue
            │  Home.vue
            │
            └─admin
                    AdManage.vue
                    CardManage.vue
                    FriendLinkManage.vue
                    MenuManage.vue
                    UserManage.vue




## 📸 截图
![image](https://github.com/user-attachments/assets/fc8d6e3e-92ce-4d14-aefc-5f86790b2ced)

![image](https://github.com/user-attachments/assets/1215da02-47cb-44af-9b1d-3ee3d68d8730)

![image](https://github.com/user-attachments/assets/2753d2e8-9b10-47ea-bd33-3b850712a652)



## 📄 License

MIT






