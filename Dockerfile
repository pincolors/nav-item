# ====================================
# 阶段 1: 构建前端
# ====================================
FROM node:20-alpine3.20 AS frontend-builder

WORKDIR /app

# 复制前端依赖文件
COPY web/package*.json ./

# 安装前端依赖
RUN npm install

# 复制前端源码
COPY web/ ./

# 构建前端
RUN npm run build

# ====================================
# 阶段 2: 生产环境
# ====================================
FROM node:20-alpine3.20 AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    sqlite \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# 创建必要的目录
RUN mkdir -p uploads database web/dist

# 复制后端依赖文件
COPY package*.json ./

# 安装后端依赖
RUN npm install --production

# 👇👇👇 核心修复：复制 database 目录 👇👇👇
COPY database/ ./database/

# 复制后端核心文件
COPY app.js config.js db.js ./

# 复制路由文件
COPY routes/ ./routes/

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/dist ./web/dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 暴露端口（Koyeb 通常使用 8080）
EXPOSE 8080/tcp

# 健康检查（可选但推荐）
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["npm", "start"]
