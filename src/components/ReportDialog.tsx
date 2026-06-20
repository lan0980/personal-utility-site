import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import ReportIcon from '@mui/icons-material/Report';
import { submitReport } from '../services/api';
import type { ReportCategory } from '../types';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: '违法信息', label: '违法信息' },
  { value: '用户投诉', label: '用户投诉' },
  { value: '安全漏洞', label: '安全漏洞' },
  { value: '其他', label: '其他' },
];

const ReportDialog: React.FC<ReportDialogProps> = ({ open, onClose }) => {
  const [category, setCategory] = useState<ReportCategory>('违法信息');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [contact, setContact] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (): Promise<void> => {
    if (!content.trim()) {
      setError('请填写举报内容');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await submitReport({
        category,
        content: content.trim(),
        url: url.trim() || undefined,
        contact: contact.trim() || undefined,
        reporterName: reporterName.trim() || undefined,
      });
      setSuccess(true);
      // Reset form after a delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '提交失败，请稍后重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    if (loading) return;
    setCategory('违法信息');
    setContent('');
    setUrl('');
    setContact('');
    setReporterName('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReportIcon color="error" />
        投诉举报
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            举报已提交成功，我们会尽快处理。感谢您的反馈！
          </Alert>
        ) : (
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>举报类别 *</InputLabel>
              <Select
                value={category}
                label="举报类别 *"
                onChange={(e) => setCategory(e.target.value as ReportCategory)}
              >
                {CATEGORIES.map((cat) => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="举报内容 *"
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请详细描述您要举报的内容..."
              helperText={`${content.length}/1000`}
              inputProps={{ maxLength: 1000 }}
            />

            <TextField
              fullWidth
              size="small"
              label="相关链接 URL（可选）"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />

            <TextField
              fullWidth
              size="small"
              label="举报人姓名（可选）"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />

            <TextField
              fullWidth
              size="small"
              label="联系方式（可选）"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="邮箱或电话，方便我们反馈处理结果"
            />

            <Typography variant="caption" color="text.secondary">
              您的举报信息将严格保密，仅用于处理违规内容。匿名举报也可提交。
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {success ? '关闭' : '取消'}
        </Button>
        {!success && (
          <Button
            variant="contained"
            color="error"
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {loading ? '提交中...' : '提交举报'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;
