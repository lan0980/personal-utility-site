# 增量 PRD：多设备数据同步

## 项目信息

| 字段 | 值 |
|------|-----|
| 文档类型 | 增量 PRD（简单格式） |
| Language | 中文 |
| 技术栈（前端） | Vite + React + TypeScript + MUI + Tailwind CSS |
| 技术栈（后端·新增） | Node.js + Fastify + SQLite + JWT |
| Project Name | personal-utility-site |
| 项目路径 | D:\WorkBiddy\2026-06-17-22-38-17 |
| 服务器环境 | 阿里云轻量 2C2G40GB + 宝塔面板 + 已有域名 |

### 原始需求复述

用户拥有一个个人实用网站（日历待办 + 链接板 + 关于页面 + 标签管理），当前数据全部存储在浏览器 localStorage 中。换设备或换浏览器后数据不互通。用户希望实现多设备数据同步，在任意设备上编辑后其他设备能获取最新数据。

---

## 1. 产品目标

| # | 目标 | 说明 |
|---|------|------|
| G1 | **数据跨设备一致** | 用户在任意设备/浏览器上创建、编辑、删除的数据，能在其他设备上自动获取最新版本，无需手动导出导入 |
| G2 | **离线可用 + 自动恢复** | 断网时本地照常使用，网络恢复后自动将本地变更同步到服务器，不丢失数据 |
| G3 | **轻量可部署** | 后端方案适配 2C2G 服务器资源限制，通过宝塔面板即可完成部署运维，不引入重型依赖 |

---

## 2. 用户故事

### P0 — 必须实现

> **US-01**：作为网站使用者，我希望注册账号并登录，这样我的数据可以关联到我本人，在多设备间同步。

> **US-02**：作为已登录用户，我在设备 A 上添加了一条待办/链接后，希望在设备 B 上打开网站时能自动看到这条新数据，而不需要手动操作。

> **US-03**：作为已登录用户，我在断网情况下仍然可以正常查看和编辑待办/链接/关于页面，网络恢复后我的修改自动同步到服务器，不丢失。

> **US-04**：作为已登录用户，我希望看到同步状态指示（同步中 / 已同步 / 离线 / 同步失败），这样我能知道数据是否已安全保存。

### P1 — 应该实现

> **US-05**：作为已登录用户，我在设备 A 上删除了一条待办，希望在设备 B 上打开时这条待办也自动消失，而不是重新出现。

> **US-06**：作为已登录用户，我在两台设备上同时编辑了同一条待办的不同字段，希望系统能合理处理冲突而不是报错崩溃。

> **US-07**：作为已登录用户，我希望在首次登录新设备时，服务器上的数据能完整拉取到本地，这样我可以无缝切换设备。

### P2 — 可以实现

> **US-08**：作为已登录用户，我希望在设置页面手动触发「立即同步」和「从服务器全量恢复」，作为异常情况的兜底操作。

> **US-09**：作为已登录用户，我希望看到最近一次同步时间，方便确认数据时效性。

---

## 3. 需求池

| 优先级 | 需求 | 说明 |
|--------|------|------|
| **P0** | 用户注册/登录 | 用户名 + 密码注册登录，JWT 令牌认证，密码 bcrypt 哈希存储 |
| **P0** | 后端数据存储层 | SQLite 数据库，存储 todos、links、tags、about、users 表 |
| **P0** | 增量拉取同步 | 应用启动及定时轮询从服务器拉取 `lastSyncTime` 之后变更的数据，合并到本地 localStorage |
| **P0** | 本地变更推送 | 本地数据变更后（防抖），将变更推送到服务器 |
| **P0** | 离线缓存与队列 | 断网时继续使用 localStorage 读写，变更进入待同步队列，网络恢复后自动 flush |
| **P0** | 同步状态指示器 | 全局可见的同步状态 UI（图标 + Tooltip），显示同步中/已同步/离线/失败 |
| **P0** | 数据模型扩展 | 为所有数据实体添加 `updatedAt` 字段；ID 改用 `crypto.randomUUID()` 避免多设备碰撞；引入软删除 `deleted` 标记 |
| **P0** | 本地数据迁移 | 首次升级时将旧格式 localStorage 数据迁移为新格式（补 `updatedAt`、保持现有 ID），确保平滑过渡 |
| **P1** | 软删除同步 | 删除操作标记 `deleted=true` 并同步，而非物理删除，确保其他设备感知到删除 |
| **P1** | 冲突解决（LWW） | 同一条记录多设备同时修改时，按 `updatedAt` 时间戳 Last-Write-Wins，后者覆盖前者 |
| **P1** | 首次全量拉取 | 新设备首次登录后，从服务器全量拉取所有数据覆盖本地空状态 |
| **P1** | 登出与令牌管理 | 登出清除 JWT；令牌过期自动跳转登录页 |
| **P2** | 手动同步操作 | 设置页提供「立即同步」按钮和「从服务器全量恢复」按钮 |
| **P2** | 最近同步时间展示 | 同步指示器 Tooltip 中显示 `最后同步于 YYYY-MM-DD HH:mm` |
| **P2** | 令牌自动刷新 | JWT 即将过期时自动刷新，避免用户中途被登出 |

---

## 4. 功能要点

### 4.1 用户认证

**方案：用户名 + 密码 + JWT**

| 项目 | 设计 |
|------|------|
| 注册 | `POST /api/auth/register`，接收 username + password，密码经 bcrypt 哈希后存入 SQLite `users` 表 |
| 登录 | `POST /api/auth/login`，校验密码后签发 JWT（payload 含 userId） |
| 令牌存储 | JWT 存入 localStorage `auth-token`，每次请求通过 `Authorization: Bearer <token>` 头携带 |
| 令牌有效期 | Access Token 7 天（个人工具，不需要频繁重新登录） |
| 密码策略 | 最少 6 位，不限复杂度（个人工具场景，平衡安全与便利） |
| 不做 | 不做 OAuth/第三方登录、不做邮箱验证、不做找回密码（P2 可选） |

**理由**：2C2G 服务器资源有限，JWT 无状态认证不需要 Redis 存 session，开销最小。个人工具单用户场景，用户名密码足够。

### 4.2 数据同步机制

**方案：定时增量同步 + 变更即时推送（非 WebSocket 实时）**

```
┌──────────────────────────────────────────────────────┐
│                  同步时序                              │
│                                                      │
│  [App 启动] ──> 全量/增量拉取 ──> 合并到 localStorage  │
│      │                                              │
│      v                                              │
│  [用户操作] ──> 写 localStorage ──> 防抖 2s ──> 推送   │
│                                                      │
│  [定时器 60s] ──> 增量拉取 ──> 合并                   │
│                                                      │
│  [网络恢复] ──> flush 待同步队列 ──> 增量拉取          │
└──────────────────────────────────────────────────────┘
```

| 项目 | 设计 |
|------|------|
| 同步方向 | 双向：拉取（Pull）+ 推送（Push） |
| 同步粒度 | **增量**：基于 `lastSyncTime` 时间戳，只同步变更的记录 |
| 触发时机 | ① 应用启动时拉取 ② 本地变更后防抖 2s 推送 ③ 定时 60s 轮询拉取 ④ 网络恢复时 flush 队列 + 拉取 |
| 不做实时 | 不引入 WebSocket / SSE — 2C2G 服务器不适合维持长连接，60s 轮询对个人工具延迟可接受 |
| 同步接口 | `GET /api/sync?since={ISO8601}` 返回该时间后所有变更的记录；`POST /api/sync` 批量提交本地变更 |
| 批量提交 | 推送时将多个变更打包为一次 POST 请求，减少网络往返 |

**拉取合并逻辑（Pull Merge）**：
1. 从 localStorage 读取 `lastSyncTime`
2. 请求 `GET /api/sync?since={lastSyncTime}`
3. 服务器返回各实体变更列表 `{ todos: [...], links: [...], tags: [...], about: {...}, serverTime: "..." }`
4. 逐条与本地数据合并：按 `updatedAt` 比较，服务器版本更新则覆盖本地
5. 更新 `lastSyncTime` 为 `serverTime`

**推送逻辑（Push）**：
1. 本地数据变更后，记录到待推送队列 `pendingChanges`
2. 防抖 2s 后，将 `pendingChanges` 打包 POST 到服务器
3. 服务器逐条 upsert（按 id + userId），返回处理结果
4. 成功后清空队列，更新 `lastSyncTime`

### 4.3 冲突解决策略

**方案：Last-Write-Wins（基于 updatedAt 时间戳）**

| 场景 | 处理 |
|------|------|
| 两设备同时修改同一条待办 | 服务器按 `updatedAt` 比较，时间晚的覆盖时间早的。简单可靠，适合个人工具 |
| 一方编辑、一方删除 | 删除视为一种「修改」，`deleted=true` 记录也带 `updatedAt`，按时间戳 LWW |
| 关于页面（单一 Markdown 文档） | 同样按 `updatedAt` LWW，后保存的覆盖先保存的。不做字段级合并 |

**设计理由**：个人工具以单用户为主，同时编辑概率低。LWW 实现简单、可预测，不引入 CRDT/OT 等复杂算法。若用户确实遇到冲突丢失，可通过 P2 的「从服务器全量恢复」手动处理。

### 4.4 离线支持

**方案：localStorage 作为本地缓存 + 离线变更队列**

| 项目 | 设计 |
|------|------|
| 本地缓存 | 保持现有 localStorage 机制不变，作为离线读写层 |
| 离线检测 | 监听 `navigator.onLine` + `online`/`offline` 事件 |
| 离线行为 | 断网时所有读写照常走 localStorage，变更同时写入 `pendingChanges` 队列 |
| 恢复同步 | `online` 事件触发后：① flush `pendingChanges` 队列推送服务器 ② 增量拉取合并 ③ 更新同步状态 |
| UI 反馈 | 同步指示器显示「离线」状态；离线期间的编辑标记为「待同步」 |
| 数据安全 | 离线时数据始终在 localStorage 中，不会丢失；队列持久化在 localStorage `pending-changes` 中，即使刷新页面也不丢失 |

### 4.5 数据模型

#### 4.5.1 现有 localStorage 键与数据结构

| localStorage Key | 类型 | 当前字段 | 用途 |
|------------------|------|----------|------|
| `calendar-todos` | `TodoItem[]` | id, date, title, description, priority, completed, tags, createdAt | 日历待办 |
| `calendar-tags` | `Tag[]` | id, name, color | 待办标签 |
| `link-board-items` | `LinkItem[]` | id, title, url, description, tags, createdAt | 链接板 |
| `link-board-tags` | `Tag[]` | id, name, color | 链接标签 |
| `about-markdown` | `string` | — | 关于页面 Markdown |

#### 4.5.2 新增/变更字段

**所有实体统一新增**：
| 字段 | 类型 | 说明 |
|------|------|------|
| `updatedAt` | `string` (ISO 8601) | 最后修改时间，同步合并的核心依据 |
| `deleted` | `boolean` | 软删除标记，默认 `false`；删除操作设为 `true` 而非物理删除 |

**ID 生成方式变更**：
- 当前：`Date.now().toString()` — 多设备同时操作会碰撞
- 变更为：`crypto.randomUUID()` — 浏览器原生 API，无需依赖，保证全局唯一

**关于页面数据结构变更**：
- 当前：`about-markdown` 直接存储 `string`
- 变更为：`about-content` 存储 `{ content: string, updatedAt: string }` 对象，以支持同步

**新增 localStorage 键**：
| Key | 类型 | 说明 |
|----|------|------|
| `auth-token` | `string` | JWT 令牌 |
| `auth-user` | `{ id, username }` | 当前登录用户信息 |
| `last-sync-time` | `string` (ISO 8601) | 最后一次成功同步的服务器时间 |
| `pending-changes` | `PendingChange[]` | 离线待推送的变更队列 |

#### 4.5.3 服务器端数据模型（SQLite）

```sql
-- 用户表
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,          -- bcrypt hash
  created_at  TEXT NOT NULL
);

-- 待办表
CREATE TABLE todos (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  date        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority    TEXT DEFAULT 'medium',
  completed   INTEGER DEFAULT 0,
  tags        TEXT DEFAULT '[]',      -- JSON array of tag ids
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted     INTEGER DEFAULT 0
);

-- 链接表
CREATE TABLE links (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  description TEXT DEFAULT '',
  tags        TEXT DEFAULT '[]',
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted     INTEGER DEFAULT 0
);

-- 标签表（合并 calendar-tags 和 link-board-tags，加 scope 区分）
CREATE TABLE tags (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  scope       TEXT NOT NULL,          -- 'calendar' | 'links'
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted     INTEGER DEFAULT 0
);

-- 关于页面
CREATE TABLE about (
  user_id     TEXT PRIMARY KEY REFERENCES users(id),
  content     TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
```

#### 4.5.4 后端 API 设计

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录，返回 JWT |
| GET | `/api/sync?since={ISO8601}` | 增量拉取：返回 since 之后所有变更记录 |
| POST | `/api/sync` | 批量推送：提交本地变更，服务器 upsert 后返回最新状态 |
| GET | `/api/about` | 拉取关于页面（也可通过 sync 获取） |
| PUT | `/api/about` | 更新关于页面 |

> 同步接口 `/api/sync` 统一处理所有实体的增量同步，避免为每个实体单独建 CRUD 接口，减少请求次数。

---

## 5. UI 设计草案

### 5.1 同步状态指示器

放置在 Layout 侧边栏底部（当前版权信息位置旁边）或顶部导航栏：

```
┌─────────────────────────┐
│  [Avatar] 实用工具站     │
│  Personal Utilities     │
│─────────────────────────│
│  📅 日历待办              │
│  🔗 链接板                │
│  👤 关于                  │
│─────────────────────────│
│  ☁️ 已同步  © 2025       │  <-- 同步状态 + 版权
└─────────────────────────┘
```

| 状态 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| 已同步 | ☁️ (CloudDone) | success.green | 数据已与服务器一致 |
| 同步中 | 🔄 (Sync) | info.blue | 正在与服务器通信 |
| 离线 | 📴 (CloudOff) | warning.orange | 网络不可用，使用本地缓存 |
| 同步失败 | ⚠️ (CloudOff) | error.red | 同步出错，点击重试 |

### 5.2 登录/注册页面

新增路由 `/login`，未登录时所有页面重定向至此：

```
┌──────────────────────────┐
│      实用工具站           │
│                          │
│  [用户名输入框]            │
│  [密码输入框]              │
│                          │
│  [登录]  [注册]           │
│                          │
│  ☑ 记住我（7天免登录）     │
└──────────────────────────┘
```

### 5.3 设置/同步页面（P2）

新增路由 `/settings`，包含：
- 当前登录用户信息 + 登出按钮
- 「立即同步」按钮
- 「从服务器全量恢复」按钮（会覆盖本地数据，需二次确认）
- 最近同步时间显示
- 手动清除本地缓存按钮

---

## 6. 待确认问题

| # | 问题 | 影响 | 建议 |
|---|------|------|------|
| Q1 | 是否需要支持多用户？还是仅单用户（自己使用）？ | 若单用户可简化注册流程为「首次设置密码」 | 建议支持注册但默认单用户使用，保留扩展性 |
| Q2 | 关于页面（About Markdown）是否需要历史版本/撤销？ | LWW 冲突解决下，后保存覆盖先保存，可能丢失编辑 | P1 不做版本历史，P2 可考虑保留最近 5 个版本 |
| Q3 | 是否需要数据导出/导入功能作为同步的补充？ | 提供数据备份兜底 | 建议作为 P2 加入设置页 |
| Q4 | 服务器域名是否已配置 HTTPS？JWT 通过 HTTP 传输有安全风险 | 影响 JWT 安全性 | 宝塔面板可申请 Let's Encrypt 免费证书，建议配置 |
| Q5 | 标签目前 calendar-tags 和 link-board-tags 是分开存储的，同步后是否合并为统一标签池？ | 影响 Tag 数据模型和 UI | 建议保持分开（加 scope 字段区分），减少改动量 |
| Q6 | 是否需要「多端在线踢出」功能（同账号同时在两设备编辑时提醒）？ | 影响 UX | P2 可选，个人工具优先级低 |
| Q7 | 60s 轮询间隔是否可接受？还是需要更短/更长？ | 影响服务器负载和同步实时性 | 个人工具 60s 足够，可在设置中调整为 30s/60s/120s |

---

## 7. 技术选型建议（供架构师参考）

| 层 | 选型 | 理由 |
|----|------|------|
| 后端框架 | **Fastify** | 比 Express 更高性能、内置 JSON Schema 校验、插件生态轻量，适合 2C2G |
| 数据库 | **SQLite** (better-sqlite3) | 无独立进程、零配置、文件级存储，2C2G 下资源占用最低 |
| 认证 | **JWT** (jsonwebtoken + bcrypt) | 无状态、不需要 session 存储，服务器重启不丢失登录态 |
| 部署 | 宝塔 PM2 管理 Node 进程 + Nginx 反向代理 | 兼容现有宝塔面板环境 |
| 前端 HTTP | **fetch**（原生）或 axios | 项目当前无 HTTP 库依赖，fetch 足够且零依赖 |
| 前端同步层 | 新建 `src/store/useSyncedStorage.ts` | 封装 `useLocalStorage` + 同步逻辑，替换现有 hook 调用 |

---

## 8. 风险与约束

| 风险 | 缓解措施 |
|------|----------|
| 2C2G 服务器内存不足 | SQLite 无独立进程；Fastify 内存占用低；轮询间隔 60s 而非实时 |
| 数据迁移破坏现有数据 | 迁移脚本保留原始数据备份；迁移是幂等的（检测是否已有 updatedAt 字段） |
| JWT 被窃取 | 建议 Q4 配置 HTTPS；令牌存 localStorage 而非 cookie（避免 CSRF） |
| 离线队列无限增长 | 推送成功后立即清空队列；队列上限 100 条，超限触发即时推送 |
| ID 碰撞（迁移期） | 迁移时保留原 ID；新建数据使用 UUID；旧 `Date.now()` ID 不会与新 UUID 碰撞 |

---

## 附录：现有代码同步改造影响点

| 文件 | 改造内容 |
|------|----------|
| `src/types.ts` | TodoItem、LinkItem、Tag 添加 `updatedAt`、`deleted` 字段；新增 SyncPayload 等类型 |
| `src/store/useLocalStorage.ts` | 保持不变，作为底层存储 |
| `src/store/useSyncedStorage.ts` | **新建**：封装 localStorage + 同步逻辑，提供与 useLocalStorage 相同的 API |
| `src/services/api.ts` | **新建**：HTTP 请求封装（auth、sync 接口） |
| `src/services/sync.ts` | **新建**：同步引擎（拉取合并、推送队列、定时轮询、离线恢复） |
| `src/services/auth.ts` | **新建**：认证状态管理（登录/登出/令牌校验） |
| `src/pages/CalendarTodo.tsx` | `useLocalStorage` → `useSyncedStorage`；ID 生成改 UUID |
| `src/pages/LinkBoard.tsx` | `useLocalStorage` → `useSyncedStorage`；ID 生成改 UUID |
| `src/pages/About.tsx` | `useLocalStorage` → `useSyncedStorage`；数据结构从 string 改为对象 |
| `src/pages/Login.tsx` | **新建**：登录/注册页面 |
| `src/pages/Settings.tsx` | **新建**（P2）：同步设置页面 |
| `src/components/Layout.tsx` | 添加同步状态指示器；添加登录路由守卫 |
| `src/components/SyncIndicator.tsx` | **新建**：同步状态 UI 组件 |
| `src/App.tsx` | 添加 `/login`、`/settings` 路由；未登录重定向逻辑 |
| `src/utils/migration.ts` | **新建**：localStorage 数据格式迁移工具 |
