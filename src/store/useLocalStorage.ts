import { useState, useCallback } from 'react';

/**
 * 自定义 Hook：将状态同步到 localStorage
 * @param key - localStorage 的键名
 * @param initialValue - 初始值
 */
export function useLocalStorage<T>(
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
          const valueToStore =
            value instanceof Function ? value(prev) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.warn(`写入 localStorage key "${key}" 失败:`, error);
      }
    },
    [key],
  );

  return [storedValue, setValue];
}
