import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Container,
  Link,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import LoginIcon from '@mui/icons-material/Login';
import { authManager } from '../services/auth';
import { syncEngine } from '../services/sync';
import ReportDialog from '../components/ReportDialog';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (authManager.isLoggedIn()) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        await authManager.login({ username: trimmedUsername, password });
      } else {
        await authManager.register({ username: trimmedUsername, password });
      }
      syncEngine.start();
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '操作失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: { xs: 4, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper sx={{ p: { xs: 2.5, sm: 4 }, width: '100%', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PersonIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {mode === 'login' ? '登录' : '注册'}
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setMode(newMode);
                setError('');
              }
            }}
            sx={{ mb: 3 }}
            fullWidth
          >
            <ToggleButton value="login">
              <LoginIcon sx={{ mr: 0.5, fontSize: 18 }} />
              登录
            </ToggleButton>
            <ToggleButton value="register">
              <HowToRegIcon sx={{ mr: 0.5, fontSize: 18 }} />
              注册
            </ToggleButton>
          </ToggleButtonGroup>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
              autoComplete="username"
              helperText="3-30 个字符"
            />
            <TextField
              fullWidth
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              helperText="至少 6 个字符"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
            </Button>
          </Box>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            {mode === 'login' ? '还没有账号？点击上方注册' : '已有账号？点击上方登录'}
          </Typography>
        </Paper>

        {/* Footer — ICP + privacy + report */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            © 2026 个人实用工具站 · 浙ICP备2026012560号
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            公安备案：待审核通过后添加
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', mt: 1, alignItems: 'center' }}>
            <Link
              component="button"
              variant="caption"
              onClick={() => navigate('/privacy')}
              sx={{ textDecoration: 'none' }}
            >
              隐私政策
            </Link>
            <Typography variant="caption" color="text.secondary">|</Typography>
            <Link
              component="button"
              variant="caption"
              onClick={() => setReportOpen(true)}
              sx={{ textDecoration: 'none' }}
            >
              投诉举报
            </Link>
          </Box>
        </Box>
      </Box>

      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </Container>
  );
};

export default Login;
