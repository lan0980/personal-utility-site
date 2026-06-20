/**
 * localStorage 数据迁移（幂等）
 * - 为旧数据补填 updatedAt / deleted 字段
 * - 将 about-markdown (string) 迁移为 about-content (AboutData 对象)
 * - 为旧标签添加 scope 字段
 * - 保留原始 ID，不替换
 */

import type { AboutData, TodoItem, LinkItem, Tag } from '../types';

/** 读取 localStorage 中的 JSON 数组 */
function readArray<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const items = JSON.parse(raw) as T[];
    if (!Array.isArray(items)) return null;
    return items;
  } catch {
    return null;
  }
}

/** 写入 JSON 数组到 localStorage */
function writeArray<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.warn(`写入 localStorage key "${key}" 失败:`, e);
  }
}

/** 迁移数组中的每个元素（幂等） */
function migrateArray<T>(
  key: string,
  migrator: (item: T) => T,
): void {
  const items = readArray<T>(key);
  if (!items) return;
  const migrated = items.map(migrator);
  writeArray(key, migrated);
}

interface OldTodoItem {
  id: string;
  date: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
}

interface OldLinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
}

interface OldTag {
  id: string;
  name: string;
  color: string;
  scope?: string;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
}

/**
 * 执行 localStorage 数据迁移
 * 幂等：已迁移的数据不会重复迁移
 */
export function migrateLocalStorage(): void {
  const now = new Date().toISOString();

  // 1. 迁移 TodoItem[] — 补填 updatedAt, deleted
  migrateArray<OldTodoItem>('calendar-todos', (item) => ({
    ...item,
    updatedAt: item.updatedAt || item.createdAt || now,
    deleted: item.deleted ?? false,
  }));

  // 2. 迁移 LinkItem[] — 补填 updatedAt, deleted
  migrateArray<OldLinkItem>('link-board-items', (item) => ({
    ...item,
    updatedAt: item.updatedAt || item.createdAt || now,
    deleted: item.deleted ?? false,
  }));

  // 3. 迁移 calendar-tags — 补填 scope, createdAt, updatedAt, deleted
  migrateArray<OldTag>('calendar-tags', (item) => ({
    ...item,
    scope: item.scope || 'calendar',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || item.createdAt || now,
    deleted: item.deleted ?? false,
  }));

  // 4. 迁移 link-board-tags — 补填 scope, createdAt, updatedAt, deleted
  migrateArray<OldTag>('link-board-tags', (item) => ({
    ...item,
    scope: item.scope || 'links',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || item.createdAt || now,
    deleted: item.deleted ?? false,
  }));

  // 5. 迁移 about-markdown (string) → about-content (AboutData 对象)
  const oldAboutRaw = localStorage.getItem('about-markdown');
  const newAboutRaw = localStorage.getItem('about-content');

  if (oldAboutRaw && !newAboutRaw) {
    // 需要迁移
    try {
      const oldContent = JSON.parse(oldAboutRaw);
      const content = typeof oldContent === 'string' ? oldContent : '';
      const aboutData: AboutData = {
        content,
        updatedAt: now,
      };
      localStorage.setItem('about-content', JSON.stringify(aboutData));
    } catch (e) {
      console.warn('迁移 about-markdown 失败:', e);
    }
  } else if (oldAboutRaw && newAboutRaw) {
    // 已迁移，清理旧 key
    localStorage.removeItem('about-markdown');
  }
}
