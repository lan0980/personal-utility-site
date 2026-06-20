import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SyncIcon from '@mui/icons-material/Sync';
import RestoreIcon from '@mui/icons-material/Restore';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { authManager } from '../services/auth';
import { syncEngine } from '../services/sync';
import { fetchLoginLogs } from '../services/api';
import type { SyncStatus, LoginLog } from '../types';

const INTERVAL_OPTIONS: { value: string; label: string }[] = [
  { value: '5', label: '每 5 分钟' },
  { value: '15', label: '每 15 分钟' },
  { value: '30', label: '每 30 分钟' },
  { value: '60', label: '每 1 小时' },
];

const INTERVAL_MAP: Record<string, number> = {
  '5': 5 * 60 * 1000,
  '15': 15 * 60 * 1000,
  '30': 30 * 60 * 1000,
  '60': 60 * 60 * 1000,
};

const ACTION_LABELS: Record<string, string> = {
  login: '登录成功',
  login_failed: '登录失败',
  register: '注册',
};

const STATUS_CONFIG: Record<SyncStatus, { label: string; color: 'success' | 'error' | 'warning' | 'default' | 'info' }> = {
  syncing: { label: '同步中...', color: 'info' },
  synced: { label: '已同步', color: 'success' },
  offline: { label: '离线', color: 'warning' },
  error: { label: '同步失败', color: 'error' },
  idle: { label: '空闲', color: 'default' },
};

const Settings: React.FC = () => {
  const user = authManager.getUser();
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(syncEngine.getLastSyncTime());
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus());
  const [recoverDialogOpen, setRecoverDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Auto-backup settings
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(
    () => localStorage.getItem('auto-backup-enabled') === 'true',
  );
  const [autoBackupInterval, setAutoBackupInterval] = useState<string>(
    () => localStorage.getItem('auto-backup-interval') || '15',
  );
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(
    () => localStorage.getItem('auto-backup-last-time'),
  );

  useEffect(() => {
    const unsubscribe = syncEngine.onStatusChange((newStatus, newTime) => {
      setStatus(newStatus);
      setLastSyncTime(newTime);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadLogs = async (): Promise<void> => {
      setLogsLoading(true);
      try {
        const res = await fetchLoginLogs(1, 10);
        setLoginLogs(res.items);
      } catch {
        // Silently fail
      } finally {
        setLogsLoading(false);
      }
    };
    loadLogs();
  }, []);

  // Auto-backup timer
  useEffect(() => {
    if (!autoBackupEnabled) return;

    const intervalMs = INTERVAL_MAP[autoBackupInterval] || INTERVAL_MAP['15'];
    const timer = setInterval(() => {
      syncEngine.forceSync().then(() => {
        const now = new Date().toISOString();
        localStorage.setItem('auto-backup-last-time', now);
        setLastBackupTime(now);
      }).catch(() => {});
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoBackupEnabled, autoBackupInterval]);

  const handleLogout = useCallback(() => {
    syncEngine.stop();
    authManager.logout();
    window.location.href = '/login';
  }, []);

  const handleSyncNow = async (): Promise<void> => {
    setMessage('');
    try {
      await syncEngine.forceSync();
      setMessage('同步成功');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '未知错误';
      setMessage('同步失败: ' + msg);
    }
  };

  const handleFullRecover = async (): Promise<void> => {
    setRecoverDialogOpen(false);
    setMessage('');
    try {
      await syncEngine.fullRecover();
      setMessage('全量恢复成功');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '未知错误';
      setMessage('全量恢复失败: ' + msg);
    }
  };

  const handleAutoBackupToggle = (enabled: boolean): void => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('auto-backup-enabled', String(enabled));
  };

  const handleIntervalChange = (value: string): void => {
    setAutoBackupInterval(value);
    localStorage.setItem('auto-backup-interval', value);
  };

  const nextBackupTime = useMemo((): string | null => {
    if (!autoBackupEnabled || !lastBackupTime) return null;
    const intervalMs = INTERVAL_MAP[autoBackupInterval] || INTERVAL_MAP['15'];
    try {
      const next = new Date(new Date(lastBackupTime).getTime() + intervalMs);
      return next.toLocaleString('zh-CN');
    } catch {
      return null;
    }
  }, [autoBackupEnabled, autoBackupInterval, lastBackupTime]);

  const formatTime = (time: string | null): string => {
    if (!time) return '从未同步';
    try {
      return new Date(time).toLocaleString('zh-CN');
    } catch {
      return time;
    }
  };

  const formatAction = (action: string): string => {
    return ACTION_LABELS[action] || action;
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: { xs: 2, sm: 3 } }}>
        <PersonIcon color="primary" />
        设置
      </Typography>

      {message && (
        <Alert severity={message.includes('失败') ? 'error' : 'success'} sx={{ mb: 2 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {/* User info */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>账户信息</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="body1">用户名：</Typography>
          <Chip label={user?.username || '未知'} color="primary" />
        </Box>
        <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout} sx={{ mt: 2 }}>
          退出登录
        </Button>
      </Paper>

      {/* Sync */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>云端同步</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="body2" color="text.secondary">状态：</Typography>
          <Chip label={STATUS_CONFIG[status].label} size="small" color={STATUS_CONFIG[status].color} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          最近云端同步：{formatTime(lastSyncTime)}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" startIcon={<SyncIcon />} onClick={handleSyncNow} disabled={status === 'syncing'}>立即同步</Button>
          <Button variant="outlined" color="warning" startIcon={<RestoreIcon />} onClick={() => setRecoverDialogOpen(true)}>从服务器全量恢复</Button>
        </Box>

        {/* Auto-backup settings */}
        <Divider sx={{ my: 2 }} />
        <FormControlLabel control={<Switch checked={autoBackupEnabled} onChange={(e) => handleAutoBackupToggle(e.target.checked)} color="primary" />} label="自动备份" />
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
          日常数据已通过实时同步自动保存，自动备份为额外的定时保障
        </Typography>
        {autoBackupEnabled && (
          <Box sx={{ mt: 1, ml: 1 }}>
            <FormControl size="small" sx={{ minWidth: 160, mb: 1 }}>
              <InputLabel>备份间隔</InputLabel>
              <Select value={autoBackupInterval} label="备份间隔" onChange={(e) => handleIntervalChange(e.target.value)}>
                {INTERVAL_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>开启后，系统将定期执行额外同步备份，作为双重保障</Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              上次备份：{lastBackupTime ? formatTime(lastBackupTime) : lastSyncTime ? '尚未执行自动备份（数据已通过实时同步保存）' : '从未同步'}
            </Typography>
            {nextBackupTime && (
              <Typography variant="caption" color="text.secondary" display="block">下次备份：{nextBackupTime}</Typography>
            )}
          </Box>
        )}
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">全量恢复会用服务器数据覆盖本地数据，请谨慎操作。</Typography>
      </Paper>

      {/* Login logs */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          登录日志
        </Typography>
        {logsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
        ) : loginLogs.length > 0 ? (
          <List dense>
            {loginLogs.map((log) => (
              <ListItem key={log.id} divider>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {log.success ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" component="span">{`${formatAction(log.action)} · ${log.ip || '未知IP'}`}</Typography>
                      {log.device && <Chip label={log.device} size="small" variant="outlined" />}
                    </Box>
                  }
                  secondary={formatTime(log.createdAt)}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">暂无登录记录</Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>登录日志保留6个月，过期自动清理。</Typography>
      </Paper>

      {/* Full recover confirmation */}
      <Dialog open={recoverDialogOpen} onClose={() => setRecoverDialogOpen(false)}>
        <DialogTitle>确认全量恢复</DialogTitle>
        <DialogContent>
          <Typography>这将清空本地所有数据并从服务器重新下载。本地未同步的更改将丢失。确定继续吗？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecoverDialogOpen(false)}>取消</Button>
          <Button color="warning" variant="contained" onClick={handleFullRecover}>确认恢复</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;