import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, isAbsolute, resolve } from 'path';

/* ===== Database connection ===== */

const rawPath = process.env.DB_PATH || './data/app.db';
const dbPath = isAbsolute(rawPath) ? rawPath : resolve(process.cwd(), rawPath);
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/* ===== DB row types ===== */

interface UserRow {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

interface TodoRow {
  id: string;
  user_id: string;
  date: string;
  title: string;
  description: string;
  priority: string;
  completed: number;
  tags: string;
  created_at: string;
  updated_at: string;
  deleted: number;
}

interface LinkRow {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string;
  tags: string;
  created_at: string;
  updated_at: string;
  deleted: number;
}

interface TagRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  scope: string;
  created_at: string;
  updated_at: string;
  deleted: number;
}

interface AboutRow {
  user_id: string;
  content: string;
  updated_at: string;
}

interface LoginLogRow {
  id: string;
  user_id: string | null;
  username: string;
  ip: string | null;
  user_agent: string | null;
  action: string;
  success: number;
  created_at: string;
}

interface OperationLogRow {
  id: string;
  user_id: string;
  action: string;
  ip: string | null;
  detail: string | null;
  created_at: string;
}

interface ReportRow {
  id: string;
  user_id: string | null;
  reporter_name: string | null;
  contact: string | null;
  category: string;
  content: string;
  url: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
}

/* ===== Conversion helpers (DB ↔ API) ===== */

/** Convert a todo DB row to API response format (snake_case keys, proper types). */
function todoRowToApi(row: TodoRow): Record<string, unknown> {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    description: row.description,
    priority: row.priority,
    completed: row.completed === 1,
    tags: JSON.parse(row.tags || '[]'),
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted: row.deleted === 1,
  };
}

/** Convert an API todo object to DB row format. */
function apiToTodoRow(userId: string, item: Record<string, unknown>): TodoRow {
  return {
    id: item.id as string,
    user_id: userId,
    date: item.date as string,
    title: item.title as string,
    description: (item.description as string) || '',
    priority: (item.priority as string) || 'medium',
    completed: item.completed ? 1 : 0,
    tags: JSON.stringify(item.tags || []),
    created_at: (item.created_at as string) || new Date().toISOString(),
    updated_at: (item.updated_at as string) || new Date().toISOString(),
    deleted: item.deleted ? 1 : 0,
  };
}

/** Convert a link DB row to API response format. */
function linkRowToApi(row: LinkRow): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    tags: JSON.parse(row.tags || '[]'),
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted: row.deleted === 1,
  };
}

/** Convert an API link object to DB row format. */
function apiToLinkRow(userId: string, item: Record<string, unknown>): LinkRow {
  return {
    id: item.id as string,
    user_id: userId,
    title: item.title as string,
    url: item.url as string,
    description: (item.description as string) || '',
    tags: JSON.stringify(item.tags || []),
    created_at: (item.created_at as string) || new Date().toISOString(),
    updated_at: (item.updated_at as string) || new Date().toISOString(),
    deleted: item.deleted ? 1 : 0,
  };
}

/** Convert a tag DB row to API response format. */
function tagRowToApi(row: TagRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    scope: row.scope,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted: row.deleted === 1,
  };
}

/** Convert an API tag object to DB row format. */
function apiToTagRow(userId: string, item: Record<string, unknown>): TagRow {
  return {
    id: item.id as string,
    user_id: userId,
    name: item.name as string,
    color: item.color as string,
    scope: (item.scope as string) || 'calendar',
    created_at: (item.created_at as string) || new Date().toISOString(),
    updated_at: (item.updated_at as string) || new Date().toISOString(),
    deleted: item.deleted ? 1 : 0,
  };
}

/* ===== Initialization ===== */

/** Create all tables if they don't exist. */
export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      scope TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS about (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id);
    CREATE INDEX IF NOT EXISTS idx_links_user ON links(user_id);
    CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);

    CREATE TABLE IF NOT EXISTS login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      action TEXT NOT NULL,
      success INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      ip TEXT,
      detail TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      reporter_name TEXT,
      contact TEXT,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      url TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      resolution TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_op_logs_user ON operation_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_op_logs_created ON operation_logs(created_at);
  `);

  // Clean old login logs (older than 6 months) for compliance
  cleanOldLogs();
}

/* ===== User operations ===== */

export function getUserByUsername(username: string): UserRow | null {
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
  return row || null;
}

export function getUserById(id: string): UserRow | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
  return row || null;
}

export function createUser(user: { id: string; username: string; password: string; created_at: string }): void {
  db.prepare(
    'INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)',
  ).run(user.id, user.username, user.password, user.created_at);
}

/* ===== Sync data retrieval ===== */

export interface SyncDataResult {
  todos: Record<string, unknown>[];
  links: Record<string, unknown>[];
  tags: Record<string, unknown>[];
  about: { content: string; updated_at: string } | null;
  server_time: string;
}

/** Fetch sync data for a user — full or incremental based on `since`. */
export function getSyncData(userId: string, since: string | null): SyncDataResult {
  let todoRows: TodoRow[];
  let linkRows: LinkRow[];
  let tagRows: TagRow[];
  let aboutRow: AboutRow | null;

  if (since) {
    // Incremental: return all records updated after `since` (including deleted)
    todoRows = db.prepare('SELECT * FROM todos WHERE user_id = ? AND updated_at > ?').all(userId, since) as TodoRow[];
    linkRows = db.prepare('SELECT * FROM links WHERE user_id = ? AND updated_at > ?').all(userId, since) as LinkRow[];
    tagRows = db.prepare('SELECT * FROM tags WHERE user_id = ? AND updated_at > ?').all(userId, since) as TagRow[];
    aboutRow = db.prepare('SELECT * FROM about WHERE user_id = ? AND updated_at > ?').get(userId, since) as AboutRow | undefined || null;
  } else {
    // Full sync: only non-deleted records
    todoRows = db.prepare('SELECT * FROM todos WHERE user_id = ? AND deleted = 0').all(userId) as TodoRow[];
    linkRows = db.prepare('SELECT * FROM links WHERE user_id = ? AND deleted = 0').all(userId) as LinkRow[];
    tagRows = db.prepare('SELECT * FROM tags WHERE user_id = ? AND deleted = 0').all(userId) as TagRow[];
    aboutRow = db.prepare('SELECT * FROM about WHERE user_id = ?').get(userId) as AboutRow | undefined || null;
  }

  return {
    todos: todoRows.map(todoRowToApi),
    links: linkRows.map(linkRowToApi),
    tags: tagRows.map(tagRowToApi),
    about: aboutRow ? { content: aboutRow.content, updated_at: aboutRow.updated_at } : null,
    server_time: new Date().toISOString(),
  };
}

/* ===== Upsert operations (LWW conflict resolution) ===== */

/** Upsert todos with Last-Write-Wins. Returns number of conflicts (skipped). */
export function upsertTodos(userId: string, items: Record<string, unknown>[]): number {
  const selectStmt = db.prepare('SELECT updated_at FROM todos WHERE id = ? AND user_id = ?');
  const insertStmt = db.prepare(
    `INSERT INTO todos (id, user_id, date, title, description, priority, completed, tags, created_at, updated_at, deleted)
     VALUES (@id, @user_id, @date, @title, @description, @priority, @completed, @tags, @created_at, @updated_at, @deleted)`,
  );
  const updateStmt = db.prepare(
    `UPDATE todos SET date = @date, title = @title, description = @description, priority = @priority,
     completed = @completed, tags = @tags, updated_at = @updated_at, deleted = @deleted
     WHERE id = @id AND user_id = @user_id AND updated_at < @updated_at`,
  );

  let conflicts = 0;

  const upsert = db.transaction((records: Record<string, unknown>[]) => {
    for (const item of records) {
      const row = apiToTodoRow(userId, item);
      const existing = selectStmt.get(row.id, userId) as { updated_at: string } | undefined;
      if (!existing) {
        insertStmt.run(row);
      } else if (existing.updated_at < row.updated_at) {
        updateStmt.run(row);
      } else {
        conflicts++;
      }
    }
  });

  upsert(items);
  return conflicts;
}

/** Upsert links with LWW. Returns number of conflicts. */
export function upsertLinks(userId: string, items: Record<string, unknown>[]): number {
  const selectStmt = db.prepare('SELECT updated_at FROM links WHERE id = ? AND user_id = ?');
  const insertStmt = db.prepare(
    `INSERT INTO links (id, user_id, title, url, description, tags, created_at, updated_at, deleted)
     VALUES (@id, @user_id, @title, @url, @description, @tags, @created_at, @updated_at, @deleted)`,
  );
  const updateStmt = db.prepare(
    `UPDATE links SET title = @title, url = @url, description = @description, tags = @tags,
     updated_at = @updated_at, deleted = @deleted
     WHERE id = @id AND user_id = @user_id AND updated_at < @updated_at`,
  );

  let conflicts = 0;

  const upsert = db.transaction((records: Record<string, unknown>[]) => {
    for (const item of records) {
      const row = apiToLinkRow(userId, item);
      const existing = selectStmt.get(row.id, userId) as { updated_at: string } | undefined;
      if (!existing) {
        insertStmt.run(row);
      } else if (existing.updated_at < row.updated_at) {
        updateStmt.run(row);
      } else {
        conflicts++;
      }
    }
  });

  upsert(items);
  return conflicts;
}

/** Upsert tags with LWW. Returns number of conflicts. */
export function upsertTags(userId: string, items: Record<string, unknown>[]): number {
  const selectStmt = db.prepare('SELECT updated_at FROM tags WHERE id = ? AND user_id = ?');
  const insertStmt = db.prepare(
    `INSERT INTO tags (id, user_id, name, color, scope, created_at, updated_at, deleted)
     VALUES (@id, @user_id, @name, @color, @scope, @created_at, @updated_at, @deleted)`,
  );
  const updateStmt = db.prepare(
    `UPDATE tags SET name = @name, color = @color, scope = @scope,
     updated_at = @updated_at, deleted = @deleted
     WHERE id = @id AND user_id = @user_id AND updated_at < @updated_at`,
  );

  let conflicts = 0;

  const upsert = db.transaction((records: Record<string, unknown>[]) => {
    for (const item of records) {
      const row = apiToTagRow(userId, item);
      const existing = selectStmt.get(row.id, userId) as { updated_at: string } | undefined;
      if (!existing) {
        insertStmt.run(row);
      } else if (existing.updated_at < row.updated_at) {
        updateStmt.run(row);
      } else {
        conflicts++;
      }
    }
  });

  upsert(items);
  return conflicts;
}

/* ===== About operations ===== */

export function getAbout(userId: string): AboutRow | null {
  const row = db.prepare('SELECT * FROM about WHERE user_id = ?').get(userId) as AboutRow | undefined;
  return row || null;
}

export function setAbout(userId: string, content: string, updatedAt: string): void {
  const existing = db.prepare('SELECT updated_at FROM about WHERE user_id = ?').get(userId) as { updated_at: string } | undefined;
  if (!existing) {
    db.prepare('INSERT INTO about (user_id, content, updated_at) VALUES (?, ?, ?)').run(userId, content, updatedAt);
  } else if (existing.updated_at < updatedAt) {
    db.prepare('UPDATE about SET content = ?, updated_at = ? WHERE user_id = ? AND updated_at < ?').run(content, updatedAt, userId, updatedAt);
  }
  // else: server version is newer, skip (LWW)
}

/** Upsert about record directly (for PUT /api/about). */
export function upsertAbout(userId: string, content: string, updatedAt: string): void {
  setAbout(userId, content, updatedAt);
}

/* ===== Login log operations ===== */

/** Insert a login log record. */
export function createLoginLog(data: {
  id: string;
  user_id: string | null;
  username: string;
  ip: string | null;
  user_agent: string | null;
  action: string;
  success: number;
  created_at: string;
}): void {
  db.prepare(
    `INSERT INTO login_logs (id, user_id, username, ip, user_agent, action, success, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    data.id,
    data.user_id,
    data.username,
    data.ip,
    data.user_agent,
    data.action,
    data.success,
    data.created_at,
  );
}

/** Fetch login logs for a user with pagination. */
export function getLoginLogs(
  userId: string,
  limit: number = 20,
  offset: number = 0,
): LoginLogRow[] {
  return db
    .prepare(
      'SELECT * FROM login_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    )
    .all(userId, limit, offset) as LoginLogRow[];
}

/** Count total login logs for a user. */
export function getLoginLogsCount(userId: string): number {
  const result = db
    .prepare('SELECT COUNT(*) as count FROM login_logs WHERE user_id = ?')
    .get(userId) as { count: number } | undefined;
  return result?.count ?? 0;
}

/** Delete login logs older than 6 months. */
export function cleanOldLogs(): void {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoff = sixMonthsAgo.toISOString();
  db.prepare('DELETE FROM login_logs WHERE created_at < ?').run(cutoff);
}

/* ===== Operation log operations ===== */

/** Insert an operation log record. */
export function createOperationLog(data: {
  id: string;
  user_id: string;
  action: string;
  ip: string | null;
  detail: string | null;
  created_at: string;
}): void {
  db.prepare(
    `INSERT INTO operation_logs (id, user_id, action, ip, detail, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(data.id, data.user_id, data.action, data.ip, data.detail, data.created_at);
}

/** Fetch operation logs for a user with pagination. */
export function getOperationLogs(
  userId: string,
  limit: number = 20,
  offset: number = 0,
): OperationLogRow[] {
  return db
    .prepare(
      'SELECT * FROM operation_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    )
    .all(userId, limit, offset) as OperationLogRow[];
}

/** Count total operation logs for a user. */
export function getOperationLogsCount(userId: string): number {
  const result = db
    .prepare('SELECT COUNT(*) as count FROM operation_logs WHERE user_id = ?')
    .get(userId) as { count: number } | undefined;
  return result?.count ?? 0;
}

/* ===== Report operations ===== */

/** Insert a new report. */
export function createReport(data: {
  id: string;
  user_id: string | null;
  reporter_name: string | null;
  contact: string | null;
  category: string;
  content: string;
  url: string | null;
  status: string;
  created_at: string;
}): void {
  db.prepare(
    `INSERT INTO reports (id, user_id, reporter_name, contact, category, content, url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    data.id,
    data.user_id,
    data.reporter_name,
    data.contact,
    data.category,
    data.content,
    data.url,
    data.status,
    data.created_at,
  );
}

/** Fetch all reports submitted by a specific user. */
export function getReportsByUserId(userId: string): ReportRow[] {
  return db
    .prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as ReportRow[];
}
