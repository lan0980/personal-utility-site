import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LabelIcon from '@mui/icons-material/Label';
import { Tag, TAG_COLORS, getVisibleTags } from '../types';
import { createTag } from '../utils/tag';

interface TagManagerProps {
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  scope: 'calendar' | 'links';
}

const TagManager: React.FC<TagManagerProps> = ({ tags, onTagsChange, scope }) => {
  const [open, setOpen] = useState(false);
  const [editTagId, setEditTagId] = useState<string | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const visibleTags = getVisibleTags(tags);

  const handleOpen = () => {
    setOpen(true);
    resetForm();
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditTagId(null);
    setTagName('');
    setTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
  };

  const handleEdit = (tag: Tag) => {
    setEditTagId(tag.id);
    setTagName(tag.name);
    setTagColor(tag.color);
  };

  const handleSave = () => {
    const trimmed = tagName.trim();
    if (!trimmed) return;

    if (editTagId) {
      onTagsChange(
        tags.map((t) =>
          t.id === editTagId
            ? { ...t, name: trimmed, color: tagColor, updatedAt: new Date().toISOString() }
            : t,
        ),
      );
    } else {
      const newTag = createTag(trimmed, scope, tagColor);
      onTagsChange([...tags, newTag]);
    }
    resetForm();
  };

  const handleDelete = (tagId: string) => {
    onTagsChange(
      tags.map((t) =>
        t.id === tagId ? { ...t, deleted: true, updatedAt: new Date().toISOString() } : t,
      ),
    );
  };

  return (
    <>
      <Button variant="outlined" size="small" startIcon={<LabelIcon />} onClick={handleOpen} sx={{ borderRadius: 2 }}>
        管理标签
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LabelIcon color="primary" />
          标签管理
        </DialogTitle>
        <DialogContent dividers>
          {/* Form */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, mb: 2, mt: 1 }}>
            <TextField
              size="small"
              label="标签名称"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              sx={{ flex: { xs: 'none', sm: 1 } }}
            />
            <Button variant="contained" onClick={handleSave} disabled={!tagName.trim()} startIcon={editTagId ? <EditIcon /> : <AddIcon />}>
              {editTagId ? '更新' : '添加'}
            </Button>
            {editTagId && (
              <Button variant="outlined" onClick={resetForm}>取消</Button>
            )}
          </Box>

          {/* Color Picker */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              选择颜色
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {TAG_COLORS.map((color) => (
                <Box
                  key={color}
                  onClick={() => setTagColor(color)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    border: tagColor === color ? '3px solid' : '2px solid',
                    borderColor: tagColor === color ? 'text.primary' : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Tag List */}
          {visibleTags.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              暂无标签，请添加
            </Typography>
          ) : (
            <List disablePadding>
              {visibleTags.map((tag) => (
                <ListItem key={tag.id} sx={{ borderRadius: 2, mb: 0.5, bgcolor: 'background.default' }}>
                  <Chip label={tag.name} size="small" sx={{ bgcolor: tag.color, color: '#fff', fontWeight: 600, mr: 1 }} />
                  <ListItemText primary={tag.name} primaryTypographyProps={{ variant: 'body2' }} />
                  <ListItemSecondaryAction>
                    <IconButton size="small" onClick={() => handleEdit(tag)} sx={{ padding: { xs: '12px', sm: '3px' } }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(tag.id)} color="error" sx={{ padding: { xs: '12px', sm: '3px' } }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>关闭</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TagManager;