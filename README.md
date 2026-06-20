# Personal Utility Site / 个人实用工具站

一个集成日历待办、链接收藏、数据同步的个人工具网站。

> 本项目是一个完整的全栈 Web 应用，前端基于 React 18 + TypeScript + Vite 构建，后端基于 Fastify + SQLite，支持多设备数据同步。

---

## 功能

**日历待办** — 带农历和节气的任务管理，支持日/周/月三种视图，可按优先级和标签筛选。

**链接板** — 链接收藏管理工具，支持标签分类、颜色标记和全文搜索。

**多端同步** — 基于自定义协议的增量数据同步，Last-Write-Wins 冲突策略，支持多设备间无缝同步。

**账户系统** — JWT 认证，支持注册、登录和登录历史审计。

---

## 技术栈

**前端：** React 18 / TypeScript / Vite 5 / Tailwind CSS / Material UI / React Router v6 / dayjs + lunar-javascript

**后端：** Fastify / SQLite (better-sqlite3) / JWT (jsonwebtoken) / 限流保护 (@fastify/rate-limit)

---

## 快速开始

### 前置要求

Node.js >= 18, npm >= 9

### 安装与启动

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 启动后端 (默认端口 3001)
npm run dev:server

# 另起终端，启动前端 (默认端口 5173)
npm run dev
```

打开 http://localhost:5173 即可访问。

### 构建

```bash
npm run build           # 构建前端
cd server && pm2 start ecosystem.config.js  # 部署后端
```

---

## 项目结构

```
src/                    前端源码
  components/           通用组件
  pages/                页面
    CalendarTodo        日历待办
    LinkBoard           链接板
    Settings            设置
    Login               登录
    About / Privacy     关于 / 隐私
  services/             API 与同步
  store/                状态管理
  utils/                工具函数

server/                 后端源码
  src/routes/           API 路由
  src/middleware/       中间件
  src/db.ts             数据库层
  src/index.ts          入口

docs/                   架构设计文档
public/                 静态资源