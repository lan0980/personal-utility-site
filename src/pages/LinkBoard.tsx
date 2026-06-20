import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Fab,
  Tooltip,
  Stack,
  InputAdornment,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningIcon from '@mui/icons-material/Warning';
import { LinkItem, Tag } from '../types';
import { useSyncedStorage } from '../store/useSyncedStorage';
import TagFilter from '../components/TagFilter';
import TagManager from '../components/TagManager';

/** Favicon with fallback to LinkIcon on error */
const Favicon: React.FC<{ url: string }> = ({ url }) => {
  const [imgError, setImgError] = useState(false);

  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = '';
  }

  if (imgError || !domain) {
    return <LinkIcon sx={{ width: 16, height: 16, mr: 1, flexShrink: 0, color: 'text.disabled' }} />;
  }

  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
      alt=""
      onError={() => setImgError(true)}
      style={{
        width: 16,
        height: 16,
        borderRadius: 2,
        marginRight: 8,
        flexShrink: 0,
        verticalAlign: 'middle',
      }}
    />
  );
};

const LinkBoard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [links, setLinks] = useSyncedStorage<LinkItem[]>('link-board-items', []);
  const [tags, setTags] = useSyncedStorage<Tag[]>('link-board-tags', []);
  const visibleTags = useMemo(() => tags.filter((t) => !t.deleted), [tags]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Warning dialog (shown before adding new links)
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);

  // Copy link feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /** 筛选链接（过滤已删除） */
  const filteredLinks = useMemo(() => {
    let result = links.filter((l) => !l.deleted);

    // 按标签筛选
    if (selectedTagIds.length > 0) {
      result = result.filter((link) =>
        selectedTagIds.some((tagId) => link.tags.includes(tagId)),
      );
    }

    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (link) =>
          link.title.toLowerCase().includes(query) ||
          link.description.toLowerCase().includes(query) ||
          link.url.toLowerCase().includes(query),
      );
    }

    // 按创建时间倒序
    return [...result].sort(
      (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
    );
  }, [links, selectedTagIds, searchQuery]);

  /** 点击"添加链接"按钮 — 先弹出警告确认 */
  const handleAddLink = () => {
    setWarningDialogOpen(true);
  };

  /** 用户同意警告后，打开添加链接表单 */
  const handleAgreeWarning = () => {
    setWarningDialogOpen(false);
    setEditingLink(null);
    setFormTitle('');
    setFormUrl('');
    setFormDesc('');
    setFormTags([]);
    setDialogOpen(true);
  };

  /** 复制链接到剪贴板 */
  const handleCopyLink = (link: LinkItem) => {
    navigator.clipboard
      .writeText(link.url)
      .then(() => {
        setCopiedId(link.id);
        setTimeout(() => setCopiedId(null), 3000);
      })
      .catch(() => {
        // Silently ignore clipboard errors
      });
  };

  /** 打开编辑链接对话框 */
  const handleEditLink = (link: LinkItem) => {
    setEditingLink(link);
    setFormTitle(link.title);
    setFormUrl(link.url);
    setFormDesc(link.description);
    setFormTags(link.tags);
    setDialogOpen(true);
  };

  /** 保存链接 */
  const handleSaveLink = () => {
    const trimmedTitle = formTitle.trim();
    const trimmedUrl = formUrl.trim();
    if (!trimmedTitle || !trimmedUrl) return;

    const now = dayjs().toISOString();

    if (editingLink) {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === editingLink.id
            ? {
                ...l,
                title: trimmedTitle,
                url: trimmedUrl,
                description: formDesc.trim(),
                tags: formTags,
                updatedAt: now,
              }
            : l,
        ),
      );
    } else {
      const newLink: LinkItem = {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        url: trimmedUrl,
        description: formDesc.trim(),
        tags: formTags,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };
      setLinks((prev) => [...prev, newLink]);
    }
    setDialogOpen(false);
  };

  /** 删除链接（软删除） */
  const handleDeleteLink = (linkId: string) => {
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId ? { ...l, deleted: true, updatedAt: dayjs().toISOString() } : l,
      ),
    );
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
  };

  /** 切换标签选择 */
  const handleToggleFormTag = (tagId: string) => {
    setFormTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: { xs: 1.5, sm: 3 },
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon color="secondary" />
          链接板
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TagManager tags={tags} onTagsChange={setTags} scope="links" />
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleAddLink}
            size={isMobile ? 'small' : 'medium'}
          >
            添加链接
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="搜索链接..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: { xs: 1, sm: 2 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {/* Tag Filter */}
      <TagFilter
        tags={visibleTags}
        selectedTagIds={selectedTagIds}
        onSelectionChange={setSelectedTagIds}
      />

      {/* Link Cards */}
      {filteredLinks.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 4, sm: 8 },
            color: 'text.secondary',
          }}
        >
          <LinkIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary">
            暂无链接
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            点击右下角的按钮添加你的第一个链接
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredLinks.map((link) => (
            <Grid item xs={12} sm={6} md={4} key={link.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                  borderLeft: '4px solid',
                  borderLeftColor: 'secondary.main',
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Favicon url={link.url} />
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {link.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="secondary.main"
                    sx={{
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                    onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                  >
                    {link.url}
                  </Typography>
                  {link.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {link.description}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                    {link.tags.map((tagId) => {
                      const tag = visibleTags.find((t) => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <Chip
                          key={tagId}
                          label={tag.name}
                          size="small"
                          sx={{
                            bgcolor: tag.color + '22',
                            color: tag.color,
                            height: 22,
                            fontSize: '0.7rem',
                          }}
                        />
                      );
                    })}
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 1.5, pt: 0, flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: { xs: '100%', sm: 'auto' } }}>
                    {dayjs(link.createdAt).format('YYYY-MM-DD')}
                  </Typography>
                  <Tooltip title={copiedId === link.id ? '已复制！' : '复制链接'} arrow>
                    <IconButton
                      size="small"
                      color={copiedId === link.id ? 'success' : 'default'}
                      onClick={() => handleCopyLink(link)}
                      sx={{ padding: { xs: '12px', md: '3px' } }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="打开链接" arrow>
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() =>
                        window.open(link.url, '_blank', 'noopener,noreferrer')
                      }
                      sx={{ padding: { xs: '12px', md: '3px' } }}
                    >
                      <OpenInNewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="编辑" arrow>
                    <IconButton size="small" onClick={() => handleEditLink(link)} sx={{ padding: { xs: '12px', md: '3px' } }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="删除" arrow>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setDeleteTargetId(link.id);
                        setDeleteConfirmOpen(true);
                      }}
                      sx={{ padding: { xs: '12px', md: '3px' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* FAB */}
      <Fab
        color="secondary"
        sx={{
          position: 'fixed',
          bottom: { xs: 72, md: 24 },
          right: 24,
        }}
        onClick={handleAddLink}
      >
        <AddIcon />
      </Fab>

      {/* Add/Edit Link Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLink ? '编辑链接' : '添加链接'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="标题"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            required
            placeholder="例如：项目文档"
          />
          <TextField
            fullWidth
            label="URL"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            sx={{ mb: 2 }}
            required
            placeholder="https://..."
          />
          <TextField
            fullWidth
            label="描述"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
            placeholder="链接的简要描述..."
          />

          {/* Tags selection */}
          {visibleTags.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                标签
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {visibleTags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    size="small"
                    variant={formTags.includes(tag.id) ? 'filled' : 'outlined'}
                    onClick={() => handleToggleFormTag(tag.id)}
                    sx={{
                      borderColor: tag.color,
                      bgcolor: formTags.includes(tag.id) ? tag.color : 'transparent',
                      color: formTags.includes(tag.id) ? '#fff' : tag.color,
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSaveLink}
            disabled={!formTitle.trim() || !formUrl.trim()}
          >
            {editingLink ? '更新' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除这个链接吗？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteTargetId) handleDeleteLink(deleteTargetId);
            }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning Dialog — shown before adding new links */}
      <Dialog open={warningDialogOpen} onClose={() => setWarningDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: 'warning.light', color: 'warning.dark', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon sx={{ color: 'warning.main' }} />
          温馨提示
        </DialogTitle>
        <DialogContent sx={{ bgcolor: 'background.paper', pt: '16px !important' }}>
          <Typography sx={{ color: 'text.primary', lineHeight: 1.8, fontSize: '0.875rem' }}>
            为了维护良好的网络环境，请勿上传违法违规内容，包括但不限于：<br />
            色情低俗、政治敏感、VPN、暴力、恶意软件、诈骗等。<br />
            违规内容将被删除，严重者可能承担法律责任。<br />
            感谢您的理解与配合~
          </Typography>
        </DialogContent>
        <DialogActions sx={{ bgcolor: 'background.paper', px: 3, pb: 2 }}>
          <Button onClick={() => setWarningDialogOpen(false)}>
            取消
          </Button>
          <Button variant="contained" color="primary" onClick={handleAgreeWarning}>
            同意
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LinkBoard;
