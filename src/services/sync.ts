/**
 * 同步引擎（单例）
 * - Pull: 从服务器拉取变更并合并到本地 localStorage
 * - Push: 本地变更入队，防抖 2s 后批量推送到服务器
 * - 定时轮询 60s
 * - 网络恢复自动 flush + 增量拉取
 * - 离线时变更入队，不发送
 */

import { apiClient } from './api';
import { authManager } from './auth';
import type {
  SyncPayload,
  SyncPushResult,
  PendingChange,
  SyncStatus,
  AboutData,
  TodoItem,
  LinkItem,
  Tag,
  STORAGE_ENTITY_MAP,
  SYNCED_STORAGE_KEYS,
} from '../types';

const LAST_SYNC_KEY = 'last-sync-time';
const PENDING_QUEUE_KEY = 'pending-changes';
const POLL_INTERVAL = 60000; // 60 seconds
const PUSH_DEBOUNCE = 2000; // 2 seconds

/** localStorage key → entity name 映射 */
const KEY_ENTITY_MAP: Record<string, PendingChange['entity']> = {
  'calendar-todos': 'todos',
  'link-board-items': 'links',
  'calendar-tags': 'tags',
  'link-board-tags': 'tags',
  'about-content': 'about',
};

/** 所有需要同步的 localStorage key */
const SYNCED_KEYS: readonly string[] = [
  'calendar-todos',
  'link-board-items',
  'calendar-tags',
  'link-board-tags',
  'about-content',
];

/* ===== Types ===== */

type StatusListener = (status: SyncStatus, lastSyncTime: string | null) => void;

/* ===== Sync Engine ===== */

class SyncEngine {
  private status: SyncStatus = 'idle';
  private lastSyncTime: string | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingQueue: PendingChange[] = [];
  private listeners: Set<StatusListener> = new Set();
  private isRunning = false;

  private static instance: SyncEngine | null = null;

  static getInstance(): SyncEngine {
    if (!SyncEngine.instance) {
      SyncEngine.instance = new SyncEngine();
    }
    return SyncEngine.instance;
  }

  private constructor() {
    this.lastSyncTime = localStorage.getItem(LAST_SYNC_KEY);
    this.pendingQueue = this.loadPendingQueue();
  }

  /* ===== Lifecycle ===== */

  /** 启动同步引擎（仅在已登录时有效） */
  start(): void {
    if (this.isRunning) return;
    if (!authManager.isLoggedIn()) return;

    this.isRunning = true;
    this.setupPolling();
    this.setupOnlineListener();

    this.pull().catch((err) => console.error('初始同步失败:', err));
  }

  /** 停止同步引擎 */
  stop(): void {
    this.isRunning = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    this.setStatus('idle');
  }

  /* ===== Public API ===== */

  /** 获取当前同步状态 */
  getStatus(): SyncStatus {
    return this.status;
  }

  /** 获取最近同步时间 */
  getLastSyncTime(): string | null {
    return this.lastSyncTime;
  }

  /** 订阅状态变更 */
  onStatusChange(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.lastSyncTime);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 将本地变更加入待推送队列 */
  enqueueChange(change: PendingChange): void {
    // 同一 entity 只保留最新的变更
    this.pendingQueue = this.pendingQueue.filter((c) => c.entity !== change.entity);
    this.pendingQueue.push(change);
    this.persistQueue();
    this.debouncedPush();
  }

  /** 手动触发同步（拉取 + 推送） */
  async forceSync(): Promise<void> {
    await Promise.all([this.pull(), this.flushQueue()]);
  }

  /** 从服务器全量恢复（清空本地数据后全量拉取） */
  async fullRecover(): Promise<void> {
    // 清除同步时间，强制全量拉取
    localStorage.removeItem(LAST_SYNC_KEY);
    this.lastSyncTime = null;

    // 清空所有本地数据
    for (const key of SYNCED_KEYS) {
      localStorage.removeItem(key);
      this.dispatchStorageUpdate(key);
    }

    // 清空待推送队列
    this.pendingQueue = [];
    localStorage.removeItem(PENDING_QUEUE_KEY);

    // 全量拉取
    await this.pull();
  }

  /* ===== Pull (拉取合并) ===== */

  /** 从服务器拉取变更并合并到本地 */
  async pull(): Promise<void> {
    if (!authManager.isLoggedIn()) return;
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');

    try {
      const params = this.lastSyncTime ? { since: this.lastSyncTime } : undefined;
      const serverData = await apiClient.get<SyncPayload>('/sync', params);

      this.mergeLocal(serverData);

      this.lastSyncTime = serverData.serverTime;
      localStorage.setItem(LAST_SYNC_KEY, serverData.serverTime);

      this.setStatus(navigator.onLine ? 'synced' : 'offline');
    } catch (err) {
      console.error('拉取同步数据失败:', err);
      this.setStatus(navigator.onLine ? 'error' : 'offline');
    }
  }

  /** 将服务器数据合并到本地 localStorage */
  private mergeLocal(serverData: SyncPayload): void {
    if (serverData.todos?.length) {
      this.mergeArrayEntity<TodoItem>('calendar-todos', serverData.todos);
    }
    if (serverData.links?.length) {
      this.mergeArrayEntity<LinkItem>('link-board-items', serverData.links);
    }
    if (serverData.tags?.length) {
      const calendarTags = serverData.tags.filter((t) => t.scope === 'calendar');
      const linkTags = serverData.tags.filter((t) => t.scope === 'links');
      if (calendarTags.length) {
        this.mergeArrayEntity<Tag>('calendar-tags', calendarTags);
      }
      if (linkTags.length) {
        this.mergeArrayEntity<Tag>('link-board-tags', linkTags);
      }
    }
    if (serverData.about) {
      this.mergeAbout(serverData.about);
    }
  }

  /** 合并数组实体（LWW: 服务器 updatedAt > 本地则覆盖） */
  private mergeArrayEntity<T extends { id: string; updatedAt: string }>(
    key: string,
    serverItems: T[],
  ): void {
    let localItems: T[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        localItems = JSON.parse(raw) as T[];
      }
    } catch {
      localItems = [];
    }

    const localMap = new Map<string, T>(localItems.map((item) => [item.id, item]));

    for (const serverItem of serverItems) {
      const localItem = localMap.get(serverItem.id);
      if (!localItem || new Date(serverItem.updatedAt) > new Date(localItem.updatedAt)) {
        localMap.set(serverItem.id, serverItem);
      }
    }

    localStorage.setItem(key, JSON.stringify([...localMap.values()]));
    this.dispatchStorageUpdate(key);
  }

  /** 合并 About 数据（LWW） */
  private mergeAbout(serverAbout: AboutData): void {
    let localAbout: AboutData | null = null;
    try {
      const raw = localStorage.getItem('about-content');
      if (raw) {
        localAbout = JSON.parse(raw) as AboutData;
      }
    } catch {
      localAbout = null;
    }

    if (!localAbout || new Date(serverAbout.updatedAt) > new Date(localAbout.updatedAt)) {
      localStorage.setItem('about-content', JSON.stringify(serverAbout));
      this.dispatchStorageUpdate('about-content');
    }
  }

  /* ===== Push (防抖推送) ===== */

  /** 启动防抖定时器 */
  private debouncedPush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.flushQueue().catch((err) => console.error('推送同步数据失败:', err));
    }, PUSH_DEBOUNCE);
  }

  /** 将待推送队列发送到服务器 */
  private async flushQueue(): Promise<void> {
    if (!authManager.isLoggedIn()) return;
    if (!this.pendingQueue.length) return;
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');

    try {
      // 收集所有需要推送的 entity
      const dirtyEntities = new Set(this.pendingQueue.map((c) => c.entity));

      const payload: Record<string, unknown> = {};

      if (dirtyEntities.has('todos')) {
        payload.todos = this.getLocalItems<TodoItem>('calendar-todos');
      }
      if (dirtyEntities.has('links')) {
        payload.links = this.getLocalItems<LinkItem>('link-board-items');
      }
      if (dirtyEntities.has('tags')) {
        const calendarTags = this.getLocalItems<Tag>('calendar-tags');
        const linkTags = this.getLocalItems<Tag>('link-board-tags');
        payload.tags = [...calendarTags, ...linkTags];
      }
      if (dirtyEntities.has('about')) {
        payload.about = this.getLocalItem<AboutData>('about-content');
      }

      const result = await apiClient.post<SyncPushResult>('/sync', payload);

      // 清空队列
      this.pendingQueue = [];
      localStorage.removeItem(PENDING_QUEUE_KEY);

      // 更新同步时间
      this.lastSyncTime = result.serverTime;
      localStorage.setItem(LAST_SYNC_KEY, result.serverTime);

      this.setStatus('synced');
    } catch (err) {
      console.error('推送同步数据失败:', err);
      this.setStatus('error');
    }
  }

  private getLocalItems<T>(key: string): T[] {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  private getLocalItem<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /* ===== Polling & Online/Offline ===== */

  /** 设置定时轮询 */
  private setupPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    this.pollTimer = setInterval(() => {
      this.pull().catch((err) => console.error('轮询拉取失败:', err));
    }, POLL_INTERVAL);
  }

  /** 设置网络状态监听 */
  private setupOnlineListener(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  /** 网络恢复 — flush 队列 + 增量拉取 */
  private handleOnline = (): void => {
    this.setStatus('syncing');
    Promise.all([this.flushQueue(), this.pull()]).catch((err) =>
      console.error('网络恢复同步失败:', err),
    );
  };

  /** 网络断开 */
  private handleOffline = (): void => {
    this.setStatus('offline');
  };

  /* ===== Utilities ===== */

  /** 设置同步状态并通知监听器 */
  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.notifyListeners();
  }

  /** 通知所有监听器 */
  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.status, this.lastSyncTime));
  }

  /** 派发 localStorage 更新事件（通知 useSyncedStorage hook 刷新状态） */
  private dispatchStorageUpdate(key: string): void {
    window.dispatchEvent(new CustomEvent('sync-storage-updated', { detail: { key } }));
  }

  /** 持久化待推送队列到 localStorage */
  private persistQueue(): void {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(this.pendingQueue));
  }

  /** 从 localStorage 加载待推送队列 */
  private loadPendingQueue(): PendingChange[] {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      if (raw) {
        return JSON.parse(raw) as PendingChange[];
      }
    } catch {
      // ignore
    }
    return [];
  }
}

/** 同步引擎单例 */
export const syncEngine = SyncEngine.getInstance();
