import type { Tag } from '../types';
import { TAG_COLORS } from '../types';

/** 获取不包含 deleted 的标签 */
export function getVisibleTags(tags: Tag[]): Tag[] {
  return tags.filter((t) => !t.deleted);
}

/** 根据 scope 获取可见标签 */
export function getVisibleTagsByScope(tags: Tag[], scope: 'calendar' | 'links'): Tag[] {
  return tags.filter((t) => !t.deleted && t.scope === scope);
}

/** 根据 ID 数组获取标签 */
export function getTagsByIds(tags: Tag[], ids: string[]): Tag[] {
  const idSet = new Set(ids);
  return tags.filter((t) => idSet.has(t.id));
}

/** 获取随机标签颜色 */
export function getRandomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

/** 创建新标签 */
export function createTag(
  name: string,
  scope: 'calendar' | 'links',
  color?: string,
): Tag {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    color: color || getRandomTagColor(),
    scope,
    createdAt: now,
    updatedAt: now,
    deleted: false,
  };
}