/* ===== Core types ===== */

/** 优先级类型 */
export type Priority = 'high' | 'medium' | 'low';

/** 待办事项 */
export interface TodoItem {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

/** 链接项 */
export interface LinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

/** 标签 */
export interface Tag {
  id: string;
  name: string;
  color: string;
  scope: string; // 'calendar' | 'links'
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

/* ===== About ===== */

/** 关于页数据 */
export interface AboutData {
  content: string;
  updatedAt: string;
}

/* ===== Sync types ===== */

/** 同步状态 */
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

/** 同步数据载荷（从服务器拉取） */
export interface SyncPayload {
  todos: TodoItem[];
  links: LinkItem[];
  tags: Tag[];
  about: AboutData | null;
  serverTime: string;
}

/** 推送结果（推送到服务器后返回） */
export interface SyncPushResult {
  serverTime: string;
  conflicts: number;
}

/** 待推送的变更 */
export interface PendingChange {
  type: 'upsert' | 'delete';
  entity: string; // 'todos' | 'links' | 'tags' | 'about'
  id: string; // localStorage key
  data: unknown;
  updatedAt: string;
}

/* ===== Auth types ===== */

/** 认证用户信息 */
export interface AuthUser {
  id: string;
  username: string;
}

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 注册请求 */
export interface RegisterRequest {
  username: string;
  password: string;
}

/** 认证响应 */
export interface AuthResponse {
  token: string;
  user: AuthUser;
}

/* ===== Constants ===== */

/** 优先级配置映射 */
export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string }
> = {
  high: { label: '高', color: '#ef4444' },
  medium: { label: '中', color: '#f59e0b' },
  low: { label: '低', color: '#22c55e' },
};

/** 预置标签颜色 */
export const TAG_COLORS: string[] = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
];

/* ===== Log types ===== */

/** 登录日志 */
export interface LoginLog {
  id: string;
  userId: string | null;
  username: string;
  ip: string | null;
  userAgent: string | null;
  action: string;
  success: boolean;
  createdAt: string;
  device: string | null;
}

/** 操作日志 */
export interface OperationLog {
  id: string;
  userId: string;
  action: string;
  ip: string | null;
  detail: string | null;
  createdAt: string;
}

/** 日志列表响应（带分页） */
export interface LogListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/* ===== Report types ===== */

/** 举报类别 */
export type ReportCategory = '违法信息' | '用户投诉' | '安全漏洞' | '其他';

/** 举报提交请求 */
export interface ReportRequest {
  reporterName?: string;
  contact?: string;
  category: ReportCategory;
  content: string;
  url?: string;
}

/** 举报提交响应 */
export interface ReportSubmitResponse {
  id: string;
  status: string;
  createdAt: string;
}

/** 举报记录 */
export interface Report {
  id: string;
  userId: string | null;
  reporterName: string | null;
  contact: string | null;
  category: string;
  content: string;
  url: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

/** 举报列表响应 */
export interface ReportListResponse {
  items: Report[];
}
