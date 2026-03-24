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
```text
NODE_ENV=production
PORT=8080
ADMIN_USERNAME=YOUR_USERNAME
ADMIN_PASSWORD=7YOUR_PASSWORD
JWT_SECRET=32位
DB_TYPE=postgres
DATABASE_URL=postgres:/…
sslmode=require

Note:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

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

### 📊 项目架构总结

```text
Nav-item
├── .github/workflows/    # CI/CD 自动化部署配置
├── assets/               # 静态资源 (图片、素材)
├── database/             # 数据库相关文件
│   ├── adapter.js        # 数据库适配器
│   └── nav.db            # SQLite 数据库
├── routes/               # 后端接口路由 (Express API)
│   ├── auth.js           # 权限验证
│   ├── card.js           # 卡片管理
│   └── ...               # 其他业务逻辑
├── uploads/              # 用户上传的资源 (如 Favicon)
├── web/                  # 前端项目 (Vue 3 + Vite)
│   ├── src/              # 前端源码
│   │   ├── components/   # UI 组件 (卡片、弹窗等)
│   │   └── views/        # 页面组件 (首页、管理页)
│   ├── public/           # 前端公共资源 (PWA/图标)
│   └── vite.config.mjs   # 前端构建配置
├── app.js                # 后端入口程序
├── config.js             # 配置文件
├── db.js                 # 数据库初始化
├── Dockerfile            # Docker 镜像配置文件
└── docker-compose.yml    # Docker 容器编排```




## 📸 截图
![image](https://github.com/user-attachments/assets/fc8d6e3e-92ce-4d14-aefc-5f86790b2ced)

![image](https://github.com/user-attachments/assets/1215da02-47cb-44af-9b1d-3ee3d68d8730)

![image](https://github.com/user-attachments/assets/2753d2e8-9b10-47ea-bd33-3b850712a652)



## 📄 License

MIT






