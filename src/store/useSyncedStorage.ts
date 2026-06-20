/**
 * 统一存储 Hook
 * - 封装 useLocalStorage + SyncEngine 集成
 * - 对外 API 与 useLocalStorage 一致
 * - 内部自动 enqueueChange 到同步引擎
 * - 监听 sync-storage-updated 事件，在同步引擎更新 localStorage 后刷新状态
 */

import { useState, useCallback, useEffect } from 'react';
import { syncEngine } from '../services/sync';
import type { PendingChange } from '../types';

/** localStorage key → entity name 映射 */
function getEntityFromKey(key: string): string | null {
  switch (key) {
    case 'calendar-todos':
      return 'todos';
    case 'link-board-items':
      return 'links';
    case 'calendar-tags':
    case 'link-board-tags':
      return 'tags';
    case 'about-content':
      return 'about';
    default:
      return null;
  }
}

/**
 * 自定义 Hook：将状态同步到 localStorage 并集成多设备同步
 * @param key - localStorage 的键名
 * @param initialValue - 初始值
 */
export function useSyncedStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`读取 localStorage key "${key}" 失败:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));

          // 将变更加入同步引擎队列
          const entity = getEntityFromKey(key);
          if (entity) {
            const change: PendingChange = {
              type: 'upsert',
              entity,
              id: key,
              data: valueToStore,
              updatedAt: new Date().toISOString(),
            };
            syncEngine.enqueueChange(change);
          }

          return valueToStore;
        });
      } catch (error) {
        console.warn(`写入 localStorage key "${key}" 失败:`, error);
      }
    },
    [key],
  );

  // 监听同步引擎更新 localStorage 的事件，刷新组件状态
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.key === key) {
        try {
          const item = window.localStorage.getItem(key);
          if (item) {
            setStoredValue(JSON.parse(item));
          }
        } catch (error) {
          console.warn(`同步更新 localStorage key "${key}" 失败:`, error);
        }
      }
    };
    window.addEventListener('sync-storage-updated', handler as EventListener);
    return () => window.removeEventListener('sync-storage-updated', handler as EventListener);
  }, [key]);

  return [storedValue, setValue];
}
