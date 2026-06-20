/**
 * 认证管理器（单例）
 * - 管理登录/登出/令牌存取
 * - 监听 API 层的 auth-error 事件，自动登出
 * - 提供登录状态变更的订阅机制
 */

import { apiClient } from './api';
import type { AuthUser, LoginRequest, RegisterRequest, AuthResponse } from '../types';

const TOKEN_KEY = 'auth-token';
const USER_KEY = 'auth-user';

class AuthManager {
  private user: AuthUser | null = null;
  private listeners: Set<(user: AuthUser | null) => void> = new Set();

  constructor() {
    this.loadUser();
    // Listen for auth errors from ApiClient (401 / token expired)
    window.addEventListener('auth-error', () => {
      this.handleAuthError();
    });
  }

  /** 从 localStorage 加载已保存的用户信息 */
  private loadUser(): void {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        this.user = JSON.parse(userStr) as AuthUser;
      } catch {
        this.user = null;
      }
    }
  }

  /** 登录 */
  async login(req: LoginRequest): Promise<AuthUser> {
    const res = await apiClient.post<AuthResponse>('/auth/login', req);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.user = res.user;
    this.notifyListeners();
    return res.user;
  }

  /** 注册 */
  async register(req: RegisterRequest): Promise<AuthUser> {
    const res = await apiClient.post<AuthResponse>('/auth/register', req);
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.user = res.user;
    this.notifyListeners();
    return res.user;
  }

  /** 登出 */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user = null;
    this.notifyListeners();
  }

  /** 获取当前 JWT 令牌 */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** 获取当前登录用户 */
  getUser(): AuthUser | null {
    return this.user;
  }

  /** 是否已登录 */
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.user;
  }

  /** 订阅登录状态变更 */
  onAuthChange(listener: (user: AuthUser | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 通知所有监听器 */
  private notifyListeners(): void {
    this.listeners.forEach((l) => l(this.user));
  }

  /** 处理 API 层的认证错误 — 自动登出 */
  private handleAuthError(): void {
    this.user = null;
    this.notifyListeners();
  }
}

/** 认证管理器单例 */
export const authManager = new AuthManager();
