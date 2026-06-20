/**
 * Tests for src/types.ts
 * Verify all type definitions and constants are complete and correct
 */

import { describe, it, expect } from 'vitest';
import {
  TodoItem,
  LinkItem,
  Tag,
  AboutData,
  SyncPayload,
  SyncPushResult,
  PendingChange,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  SyncStatus,
  Priority,
  PRIORITY_CONFIG,
  TAG_COLORS,
} from '../types';

describe('types.ts — Type completeness check', () => {
  // T-01: TodoItem has all required fields
  it('TodoItem interface should include updatedAt and deleted fields', () => {
    const todo: TodoItem = {
      id: 'test-id',
      date: '2025-01-01',
      title: 'Test Todo',
      description: '',
      priority: 'medium',
      completed: false,
      tags: [],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      deleted: false,
    };
    expect(todo.updatedAt).toBeDefined();
    expect(todo.deleted).toBeDefined();
    expect(typeof todo.updatedAt).toBe('string');
    expect(typeof todo.deleted).toBe('boolean');
  });

  // T-02: LinkItem has updatedAt and deleted
  it('LinkItem interface should include updatedAt and deleted fields', () => {
    const link: LinkItem = {
      id: 'test-id',
      title: 'Test Link',
      url: 'https://example.com',
      description: '',
      tags: [],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      deleted: false,
    };
    expect(link.updatedAt).toBeDefined();
    expect(link.deleted).toBeDefined();
  });

  // T-03: Tag has scope, updatedAt and deleted
  it('Tag interface should include scope, updatedAt and deleted fields', () => {
    const tag: Tag = {
      id: 'test-id',
      name: 'Test Tag',
      color: '#ff0000',
      scope: 'calendar',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      deleted: false,
    };
    expect(tag.scope).toBeDefined();
    expect(tag.updatedAt).toBeDefined();
    expect(tag.deleted).toBeDefined();
    expect(['calendar', 'links']).toContain(tag.scope);
  });

  // T-04: AboutData type
  it('AboutData interface should have content and updatedAt', () => {
    const about: AboutData = {
      content: 'Hello world',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    expect(about.content).toBeDefined();
    expect(about.updatedAt).toBeDefined();
  });

  // T-05: SyncPayload type
  it('SyncPayload should include all entity arrays and serverTime', () => {
    const payload: SyncPayload = {
      todos: [],
      links: [],
      tags: [],
      about: null,
      serverTime: '2025-01-01T00:00:00.000Z',
    };
    expect(payload.todos).toBeDefined();
    expect(payload.links).toBeDefined();
    expect(payload.tags).toBeDefined();
    expect(payload.about).toBeDefined();
    expect(payload.serverTime).toBeDefined();
  });

  // T-06: SyncPushResult type
  it('SyncPushResult should have serverTime and conflicts', () => {
    const result: SyncPushResult = {
      serverTime: '2025-01-01T00:00:00.000Z',
      conflicts: 0,
    };
    expect(result.serverTime).toBeDefined();
    expect(result.conflicts).toBeDefined();
  });

  // T-07: PendingChange type
  it('PendingChange should include entity, id, data, updatedAt', () => {
    const change: PendingChange = {
      type: 'upsert',
      entity: 'todos',
      id: 'calendar-todos',
      data: [],
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    expect(change.entity).toBeDefined();
    expect(change.id).toBeDefined();
    expect(change.updatedAt).toBeDefined();
    expect(['todos', 'links', 'tags', 'about']).toContain(change.entity);
  });

  // T-08: Auth types
  it('Auth types should be complete (AuthUser, LoginRequest, RegisterRequest, AuthResponse)', () => {
    const user: AuthUser = { id: 'test-id', username: 'testuser' };
    const loginReq: LoginRequest = { username: 'testuser', password: '123456' };
    const registerReq: RegisterRequest = { username: 'testuser', password: '123456' };
    const authRes: AuthResponse = { token: 'jwt-token', user };

    expect(user.id).toBeDefined();
    expect(user.username).toBeDefined();
    expect(loginReq.username).toBeDefined();
    expect(loginReq.password).toBeDefined();
    expect(authRes.token).toBeDefined();
    expect(authRes.user).toBeDefined();
  });

  // T-09: SyncStatus covers all states
  it('SyncStatus should include idle, syncing, synced, offline, error', () => {
    const statuses: SyncStatus[] = ['idle', 'syncing', 'synced', 'offline', 'error'];
    expect(statuses.length).toBe(5);
    for (const s of statuses) {
      expect(typeof s).toBe('string');
    }
  });

  // T-10: PRIORITY_CONFIG completeness
  it('PRIORITY_CONFIG should define high, medium, low', () => {
    expect(PRIORITY_CONFIG.high).toBeDefined();
    expect(PRIORITY_CONFIG.medium).toBeDefined();
    expect(PRIORITY_CONFIG.low).toBeDefined();
    expect(PRIORITY_CONFIG.high.label).toBe('高');
    expect(PRIORITY_CONFIG.medium.label).toBe('中');
    expect(PRIORITY_CONFIG.low.label).toBe('低');
    expect(PRIORITY_CONFIG.high.color).toBeDefined();
    expect(PRIORITY_CONFIG.medium.color).toBeDefined();
    expect(PRIORITY_CONFIG.low.color).toBeDefined();
  });

  // T-11: TAG_COLORS is a non-empty array
  it('TAG_COLORS should be a non-empty array of hex colors', () => {
    expect(Array.isArray(TAG_COLORS)).toBe(true);
    expect(TAG_COLORS.length).toBeGreaterThan(0);
    for (const color of TAG_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
