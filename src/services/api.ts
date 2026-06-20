/**
 * API 客户端封装
 * - 基于 fetch 的 HTTP 客户端
 * - 自动附加 JWT 认证头
 * - 统一 camelCase ↔ snake_case 转换
 * - 统一错误处理
 */

import type {
  LoginLog,
  OperationLog,
  LogListResponse,
  ReportRequest,
  ReportSubmitResponse,
  ReportListResponse,
} from '../types';

const API_BASE_URL = '/api';

/* ===== Conversion utilities ===== */

/** 递归将对象 key 从 snake_case 转为 camelCase */
function toCamelCase(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    result[camelKey] = toCamelCase(value);
  }
  return result;
}

/** 递归将对象 key 从 camelCase 转为 snake_case */
function toSnakeCase(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(value);
  }
  return result;
}

/* ===== API Error ===== */

export class ApiError extends Error {
  code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

/* ===== API Response type ===== */

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

/* ===== API Client ===== */

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** 从 localStorage 获取 JWT 令牌 */
  private getToken(): string | null {
    return localStorage.getItem('auth-token');
  }

  /** 构建请求头，自动附加 JWT */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /** 发送 HTTP 请求并处理响应 */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers: this.getHeaders(),
      body: body !== undefined ? JSON.stringify(toSnakeCase(body)) : undefined,
    });

    let result: ApiResponse<T>;
    try {
      result = await response.json();
    } catch {
      throw new ApiError(3, '服务器响应格式错误');
    }

    // Handle non-zero code (error)
    if (result.code !== 0) {
      // Auth errors — clear token and notify
      if (result.code === 1 || result.code === 4) {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
        window.dispatchEvent(new CustomEvent('auth-error', { detail: { code: result.code } }));
      }
      throw new ApiError(result.code, result.message || '未知错误');
    }

    return toCamelCase(result.data) as T;
  }

  /** GET 请求 */
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  /** POST 请求 */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  /** PUT 请求 */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }
}

/** API 客户端单例 */
export const apiClient = new ApiClient();

/* ===== Report & Log API functions ===== */

/** 提交举报 */
export async function submitReport(data: ReportRequest): Promise<ReportSubmitResponse> {
  return apiClient.post<ReportSubmitResponse>('/report', data);
}

/** 获取当前用户的举报记录 */
export async function getMyReports(): Promise<ReportListResponse> {
  return apiClient.get<ReportListResponse>('/report');
}

/** 获取登录日志（分页） */
export async function fetchLoginLogs(
  page: number = 1,
  limit: number = 20,
): Promise<LogListResponse<LoginLog>> {
  return apiClient.get<LogListResponse<LoginLog>>('/logs/login', {
    page: String(page),
    limit: String(limit),
  });
}

/** 获取操作日志（分页） */
export async function fetchOperationLogs(
  page: number = 1,
  limit: number = 20,
): Promise<LogListResponse<OperationLog>> {
  return apiClient.get<LogListResponse<OperationLog>>('/logs/operation', {
    page: String(page),
    limit: String(limit),
  });
}
