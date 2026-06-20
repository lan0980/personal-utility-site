# 个人实用工具站

一个功能丰富的个人工具网站，集成日历待办、链接收藏、数据同步等功能。

## 功能

| 功能 | 描述 |
|------|------|
| 📅 日历待办 | 带农历和节气的任务管理，支持按日/周/月视图查看 |
| 🔗 链接板 | 收藏夹管理，支持标签分类和搜索 |
| ⚙️ 设置 | 应用偏好配置（主题、语言等） |
| 🔐 账户系统 | JWT 认证，支持注册登录 |
| ☁️ 数据同步 | 多设备数据云端同步（基于自定义同步协议） |

## 技术栈

**前端**
- React 18 + TypeScript
- Vite 5 构建工具
- Tailwind CSS + Material UI 组件库
- React Router v6 路由
- dayjs + lunar-javascript（农历支持）

**后端**
- Fastify (Node.js 高性能框架)
- SQLite (better-sqlite3)
- JWT 认证 (jsonwebtoken)
- 限流保护 (@fastify/rate-limit)

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装

`ash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..
`

### 启动开发服务器

`ash
# 启动后端（默认端口 3001）
npm run dev:server

# 另开终端，启动前端（默认端口 5173）
npm run dev
`

前端访问 http://localhost:5173

### 构建部署

`ash
# 构建前端
npm run build

# 后端已预编译至 server/dist/
# 使用 pm2 启动后端
cd server && pm2 start ecosystem.config.js
`

## 项目结构

`
personal-utility-site/
├── src/                    # 前端源码
│   ├── components/         # 通用组件
│   ├── pages/              # 页面组件
│   │   ├── CalendarTodo.tsx  # 日历待办
│   │   ├── LinkBoard.tsx     # 链接板
│   │   ├── Settings.tsx      # 设置
│   │   ├── Login.tsx         # 登录
│   │   ├── About.tsx         # 关于
│   │   └── Privacy.tsx       # 隐私政策
│   ├── services/           # API 与同步服务
│   ├── store/              # 状态管理
│   └── utils/              # 工具函数
├── server/                 # 后端源码
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── middleware/     # 中间件（认证等）
│   │   ├── db.ts           # 数据库
│   │   └── index.ts        # 入口
│   └── data/               # SQLite 数据库文件
├── docs/                   # 架构文档
├── public/                 # 静态资源
└── package.json
`

## 许可证

MIT