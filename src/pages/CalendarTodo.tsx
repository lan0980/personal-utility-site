import React, { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Typography,
  IconButton,
  Grid,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  Stack,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TodayIcon from '@mui/icons-material/Today';
import { TodoItem, Tag, Priority, PRIORITY_CONFIG, getVisibleTags } from '../types';
import { useSyncedStorage } from '../store/useSyncedStorage';
import TagFilter from '../components/TagFilter';
import TagManager from '../components/TagManager';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { getLunarDate, getCalendarDays, generateId, getToday } from '../utils/date';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

interface TodoFormState {
  title: string;
  description: string;
  priority: Priority;
  tags: string[];
}

const createEmptyForm = (): TodoFormState => ({
  title: '',
  description: '',
  priority: 'medium',
  tags: [],
});

interface DialogsState {
  edit: boolean;
  delete: boolean;
  detail: boolean;
}

const CalendarTodo: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [todos, setTodos] = useSyncedStorage<TodoItem[]>('calendar-todos', []);
  const [tags, setTags] = useSyncedStorage<Tag[]>('calendar-tags', []);
  const visibleTags = useMemo(() => getVisibleTags(tags), [tags]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(getToday());

  // Form state
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [form, setForm] = useState<TodoFormState>(createEmptyForm());

  // Dialog state
  const [dialogs, setDialogs] = useState<DialogsState>({
    edit: false,
    delete: false,
    detail: false,
  });
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [detailTodo, setDetailTodo] = useState<TodoItem | null>(null);

  // Calendar data
  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const today = getToday();

  /** 获取某日期的待办事项 */
  const getTodosForDate = useCallback(
    (date: string) => {
      let filtered = todos.filter((t) => t.date === date && !t.deleted);
      if (selectedTagIds.length > 0) {
        filtered = filtered.filter((t) =>
          selectedTagIds.some((tagId) => t.tags.includes(tagId)),
        );
      }
      return filtered;
    },
    [todos, selectedTagIds],
  );

  /** 打开添加待办对话框 */
  const openAddDialog = (date: string) => {
    setSelectedDate(date);
    setEditingTodo(null);
    setForm(createEmptyForm());
    setDialogs((prev) => ({ ...prev, edit: true }));
  };

  /** 打开编辑待办对话框 */
  const openEditDialog = (todo: TodoItem) => {
    setEditingTodo(todo);
    setSelectedDate(todo.date);
    setForm({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      tags: todo.tags,
    });
    setDialogs((prev) => ({ ...prev, edit: true, detail: false }));
  };

  /** 保存待办 */
  const handleSaveTodo = () => {
    const trimmed = form.title.trim();
    if (!trimmed) return;

    const now = dayjs().toISOString();

    if (editingTodo) {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === editingTodo.id
            ? { ...t, title: trimmed, description: form.description.trim(), priority: form.priority, tags: form.tags, updatedAt: now }
            : t,
        ),
      );
    } else {
      const newTodo: TodoItem = {
        id: generateId(),
        date: selectedDate,
        title: trimmed,
        description: form.description.trim(),
        priority: form.priority,
        completed: false,
        tags: form.tags,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };
      setTodos((prev) => [...prev, newTodo]);
    }
    setDialogs((prev) => ({ ...prev, edit: false }));
  };

  /** 切换完成状态 */
  const handleToggleComplete = (todoId: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, completed: !t.completed, updatedAt: dayjs().toISOString() } : t,
      ),
    );
  };

  /** 删除待办 */
  const handleDeleteTodo = () => {
    if (!deleteTargetId) return;
    setTodos((prev) =>
      prev.map((t) =>
        t.id === deleteTargetId ? { ...t, deleted: true, updatedAt: dayjs().toISOString() } : t,
      ),
    );
    setDialogs((prev) => ({ ...prev, delete: false, detail: false }));
    setDeleteTargetId(null);
  };

  /** 打开删除确认 */
  const openDeleteConfirm = (todoId: string) => {
    setDeleteTargetId(todoId);
    setDialogs((prev) => ({ ...prev, delete: true }));
  };

  /** 查看待办详情 */
  const openDetail = (todo: TodoItem) => {
    setDetailTodo(todo);
    setDialogs((prev) => ({ ...prev, detail: true }));
  };

  /** 切换标签选择 */
  const handleToggleFormTag = (tagId: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId],
    }));
  };

  const monthLabel = dayjs(currentMonth + '-01').format('YYYY年 M月');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1.5, sm: 3 }, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setCurrentMonth(dayjs(currentMonth + '-01').subtract(1, 'month').format('YYYY-MM'))}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600, minWidth: { xs: 100, md: 140 }, textAlign: 'center', fontSize: { xs: '1rem', sm: '1.15rem', md: '1.5rem' } }}>
            {monthLabel}
          </Typography>
          <IconButton onClick={() => setCurrentMonth(dayjs(currentMonth + '-01').add(1, 'month').format('YYYY-MM'))}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<TodayIcon />} onClick={() => setCurrentMonth(dayjs().format('YYYY-MM'))}>
            今天
          </Button>
          <TagManager tags={tags} onTagsChange={setTags} scope="calendar" />
        </Box>
      </Box>

      {/* Tag Filter */}
      <TagFilter tags={visibleTags} selectedTagIds={selectedTagIds} onSelectionChange={setSelectedTagIds} />

      {/* Calendar Grid */}
      <Paper sx={{ p: { xs: 0.5, md: 2 }, borderRadius: 3 }}>
        {/* Weekday Headers */}
        <Grid container spacing={0}>
          {WEEKDAYS.map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'center', py: 1, fontWeight: 600 }}>
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Date Cells */}
        <Grid container spacing={0}>
          {calendarDays.map((date, index) => {
            if (!date) {
              return <Grid item xs={12 / 7} key={`empty-${index}`} />;
            }

            const dayTodos = getTodosForDate(date);
            const isTodayDate = date === today;
            const isSelected = date === selectedDate;

            return (
              <Grid item xs={12 / 7} key={date}>
                <Box
                  onClick={() => setSelectedDate(date)}
                  sx={{
                    aspectRatio: '1 / 1',
                    minWidth: { xs: 36, sm: 48, md: 56 },
                    p: 0.5,
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: isSelected ? '2px solid' : '1px solid',
                    borderColor: isSelected ? 'primary.main' : isTodayDate ? 'primary.light' : 'divider',
                    bgcolor: isTodayDate ? 'primary.50' : 'transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 28, sm: 32, md: 36 },
                      height: { xs: 28, sm: 32, md: 36 },
                      borderRadius: '50%',
                      bgcolor: isTodayDate ? 'primary.main' : 'transparent',
                      color: isTodayDate ? '#fff' : 'text.primary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      fontWeight: isTodayDate ? 700 : 400,
                      fontSize: '0.875rem',
                      mb: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {dayjs(date).date()}
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.5rem', sm: '0.55rem' }, color: isTodayDate ? 'primary.light' : 'text.disabled', textAlign: 'center', lineHeight: 1, mb: 0.3 }}>
                    {getLunarDate(date)}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, overflow: 'hidden' }}>
                    {dayTodos.slice(0, 3).map((todo) => (
                      <Tooltip key={todo.id} title={todo.title} arrow>
                        <Box
                          onClick={(e) => { e.stopPropagation(); openDetail(todo); }}
                          sx={{
                            fontSize: '0.65rem',
                            px: 0.5,
                            py: 0.15,
                            borderRadius: 0.5,
                            bgcolor: todo.completed ? 'grey.200' : PRIORITY_CONFIG[todo.priority].color + '22',
                            color: todo.completed ? 'text.disabled' : PRIORITY_CONFIG[todo.priority].color,
                            textDecoration: todo.completed ? 'line-through' : 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          {todo.title}
                        </Box>
                      </Tooltip>
                    ))}
                    {dayTodos.length > 3 && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>
                        +{dayTodos.length - 3} 更多
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Selected Date Todo List */}
      <Paper sx={{ mt: 2, p: { xs: 1, sm: 2 }, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {dayjs(selectedDate).format('M月D日')} 的待办
          </Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAddDialog(selectedDate)}>
            添加
          </Button>
        </Box>
        <Divider sx={{ mb: 1 }} />
        {getTodosForDate(selectedDate).length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            这一天暂无待办事项
          </Typography>
        ) : (
          <List disablePadding>
            {getTodosForDate(selectedDate).map((todo) => (
              <ListItem key={todo.id} sx={{ borderRadius: 2, mb: 0.5, bgcolor: 'background.default', px: 1 }}>
                <ListItemIcon sx={{ minWidth: { xs: 44, md: 36 } }}>
                  <IconButton size="small" onClick={() => handleToggleComplete(todo.id)} sx={{ padding: { xs: '12px', md: '3px' } }}>
                    {todo.completed ? <CheckCircleIcon color="primary" fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" />}
                  </IconButton>
                </ListItemIcon>
                <ListItemText
                  primary={todo.title}
                  secondary={
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={PRIORITY_CONFIG[todo.priority].label} size="small" sx={{ bgcolor: PRIORITY_CONFIG[todo.priority].color + '22', color: PRIORITY_CONFIG[todo.priority].color, height: 20, fontSize: '0.7rem' }} />
                      {todo.tags.map((tagId) => {
                        const tag = visibleTags.find((t) => t.id === tagId);
                        if (!tag) return null;
                        return <Chip key={tagId} label={tag.name} size="small" sx={{ bgcolor: tag.color + '22', color: tag.color, height: 20, fontSize: '0.7rem' }} />;
                      })}
                    </Stack>
                  }
                  primaryTypographyProps={{ fontWeight: 500, sx: { textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? 'text.disabled' : 'text.primary' } }}
                />
                <Box>
                  <IconButton size="small" onClick={() => openEditDialog(todo)} sx={{ padding: { xs: '12px', md: '3px' } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => openDeleteConfirm(todo.id)} sx={{ padding: { xs: '12px', md: '3px' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* FAB */}
      <Fab color="primary" sx={{ position: 'fixed', bottom: { xs: 72, md: 24 }, right: 24 }} onClick={() => openAddDialog(selectedDate)}>
        <AddIcon />
      </Fab>

      {/* Todo Detail Dialog */}
      <Dialog open={dialogs.detail} onClose={() => setDialogs((prev) => ({ ...prev, detail: false }))} maxWidth="sm" fullWidth>
        {detailTodo && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton size="small" onClick={() => handleToggleComplete(detailTodo.id)}>
                {detailTodo.completed ? <CheckCircleIcon color="primary" /> : <RadioButtonUncheckedIcon />}
              </IconButton>
              <Typography variant="h6" sx={{ flex: 1, textDecoration: detailTodo.completed ? 'line-through' : 'none' }}>
                {detailTodo.title}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Chip label={`${PRIORITY_CONFIG[detailTodo.priority].label}优先级`} size="small" sx={{ bgcolor: PRIORITY_CONFIG[detailTodo.priority].color + '22', color: PRIORITY_CONFIG[detailTodo.priority].color }} />
                {detailTodo.tags.map((tagId) => {
                  const tag = visibleTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return <Chip key={tagId} label={tag.name} size="small" sx={{ bgcolor: tag.color + '22', color: tag.color }} />;
                })}
              </Stack>
              {detailTodo.description ? <MarkdownRenderer content={detailTodo.description} /> : <Typography variant="body2" color="text.secondary">暂无描述</Typography>}
            </DialogContent>
            <DialogActions>
              <Button startIcon={<EditIcon />} onClick={() => openEditDialog(detailTodo)}>编辑</Button>
              <Button color="error" startIcon={<DeleteIcon />} onClick={() => openDeleteConfirm(detailTodo.id)}>删除</Button>
              <Button onClick={() => setDialogs((prev) => ({ ...prev, detail: false }))}>关闭</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Todo Dialog */}
      <Dialog open={dialogs.edit} onClose={() => setDialogs((prev) => ({ ...prev, edit: false }))} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTodo ? '编辑待办' : '添加待办'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="标题" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} sx={{ mt: 1, mb: 2 }} required />
          <TextField fullWidth label="描述（支持 Markdown）" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} multiline rows={4} sx={{ mb: 2 }} placeholder="使用 Markdown 语法编写描述..." />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>优先级</InputLabel>
            <Select value={form.priority} label="优先级" onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as Priority }))}>
              <MenuItem value="high">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PRIORITY_CONFIG.high.color }} />
                  高
                </Box>
              </MenuItem>
              <MenuItem value="medium">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PRIORITY_CONFIG.medium.color }} />
                  中
                </Box>
              </MenuItem>
              <MenuItem value="low">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: PRIORITY_CONFIG.low.color }} />
                  低
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          {visibleTags.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>标签</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {visibleTags.map((tag) => (
                  <Chip key={tag.id} label={tag.name} size="small" variant={form.tags.includes(tag.id) ? 'filled' : 'outlined'} onClick={() => handleToggleFormTag(tag.id)} sx={{ borderColor: tag.color, bgcolor: form.tags.includes(tag.id) ? tag.color : 'transparent', color: form.tags.includes(tag.id) ? '#fff' : tag.color }} />
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs((prev) => ({ ...prev, edit: false }))}>取消</Button>
          <Button variant="contained" onClick={handleSaveTodo} disabled={!form.title.trim()}>{editingTodo ? '更新' : '添加'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={dialogs.delete} onClose={() => setDialogs((prev) => ({ ...prev, delete: false }))}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除这条待办事项吗？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogs((prev) => ({ ...prev, delete: false }))}>取消</Button>
          <Button color="error" variant="contained" onClick={handleDeleteTodo}>删除</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarTodo;