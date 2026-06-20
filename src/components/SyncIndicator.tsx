import React, { useState, useEffect } from 'react';
import { IconButton, Tooltip, Box, Typography } from '@mui/material';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { syncEngine } from '../services/sync';
import type { SyncStatus } from '../types';

interface StatusConfig {
  icon: React.ReactNode;
  color: string;
  label: string;
}

const STATUS_CONFIG: Record<SyncStatus, StatusConfig> = {
  syncing: { icon: <CloudSyncIcon />, color: 'info.main', label: '同步中...' },
  synced: { icon: <CloudDoneIcon />, color: 'success.main', label: '已同步' },
  offline: { icon: <CloudOffIcon />, color: 'warning.main', label: '离线模式' },
  error: { icon: <ErrorOutlineIcon />, color: 'error.main', label: '同步失败' },
  idle: { icon: <CloudQueueIcon />, color: 'text.secondary', label: '待同步' },
};

const SyncIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(syncEngine.getLastSyncTime());

  useEffect(() => {
    const unsubscribe = syncEngine.onStatusChange((newStatus, newTime) => {
      setStatus(newStatus);
      setLastSyncTime(newTime);
    });
    return unsubscribe;
  }, []);

  const handleClick = () => {
    syncEngine.forceSync();
  };

  const formatTime = (time: string | null): string => {
    if (!time) return '从未同步';
    try {
      return new Date(time).toLocaleString('zh-CN');
    } catch {
      return time;
    }
  };

  const current = STATUS_CONFIG[status];

  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="caption" display="block">{current.label}</Typography>
          <Typography variant="caption" display="block">最近同步：{formatTime(lastSyncTime)}</Typography>
          <Typography variant="caption" display="block">点击立即同步</Typography>
        </Box>
      }
      arrow
    >
      <IconButton size="small" onClick={handleClick} disabled={status === 'syncing'}>
        <Box sx={{ color: current.color, display: 'flex', alignItems: 'center' }}>
          {current.icon}
        </Box>
      </IconButton>
    </Tooltip>
  );
};

export default SyncIndicator;