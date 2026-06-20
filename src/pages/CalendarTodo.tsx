import React, { useState, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import { Solar } from 'lunar-javascript';
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
import { TodoItem, Tag, Priority, PRIORITY_CONFIG } from '../types';
import { useSyncedStorage } from '../store/useSyncedStorage';
import TagFilter from '../components/TagFilter';
import TagManager from '../components/TagManager';
import MarkdownRenderer from '../components/MarkdownRenderer';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/** 获取农历日期显示文本 */
function getLunarDate(dateStr: string): string {
  try {
    const d = dayjs(dateStr);
    const solar = Solar.fromYmd(d.year(), d.month() + 1, d.date());
    const lunar = solar.getLunar();
    const dayName = lunar.getDayInChinese();
    // 如果是初一，显示月份（如"五月"），否则显示日
    if (lunar.getDay() === 1) {
      return lunar.getMonthInChinese() + '月';
    }
    return dayName;
  } catch {
    return '';
  }
}

const CalendarTodo: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'));
  const [todos, setTodos] = useSyncedStorage<TodoItem[]>('calendar-todos', []);
  const [tags, setTags] = useSyncedStorage<Tag[]>('calendar-tags', []);
  const visibleTags = useMemo(() => tags.filter((t) => !t.deleted), [tags]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<Priority>('medium');
  const [formTags, setFormTags] = useState<string[]>([]);

  // Delete confirm
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTodo, setDetailTodo] = useState<TodoItem | null>(null);

  /** 获取当前月份的日历数据 */
  const calendarDays = useMemo(() => {
    const monthDayjs = dayjs(currentMonth + '-01');
    const startOfMonth = monthDayjs.startOf('month');
    const startDay = startOfMonth.day(); // 0=Sunday
    const daysInMonth = monthDayjs.daysInMonth();

    const days: (string | null)[] = [];

    // 填充月前空白
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // 填充日期
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = monthDayjs.date(d).format('YYYY-MM-DD');
      days.push(dateStr);
    }

    return days;
  }, [currentMonth]);

  /** 获取某日期的待办事项（过滤已删除） */
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
  const handleAddTodo = (date: string) => {
    setSelectedDate(date);
    setEditingTodo(null);
    setFormTitle('');
    setFormDesc('');
    setFormPriority('medium');
    setFormTags([]);
    setDialogOpen(true);
  };

  /** 打开编辑待办对话框 */
  const handleEditTodo = (todo: TodoItem) => {
    setEditingTodo(todo);
    setSelectedDate(todo.date);
    setFormTitle(todo.title);
    setFormDesc(todo.description);
    setFormPriority(todo.priority);
    setFormTags(todo.tags);
    setDialogOpen(true);
    setDetailOpen(false);
  };

  /** 保存待办 */
  const handleSaveTodo = () => {
    const trimmed = formTitle.trim();
    if (!trimmed) return;

    const now = dayjs().toISOString();

    if (editingTodo) {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === editingTodo.id
            ? {
                ...t,
                title: trimmed,
                description: formDesc.trim(),
                priority: formPriority,
                tags: formTags,
                updatedAt: now,
              }
            : t,
        ),
      );
    } else {
      const newTodo: TodoItem = {
        id: crypto.randomUUID(),
        date: selectedDate,
        title: trimmed,
        description: formDesc.trim(),
        priority: formPriority,
        completed: false,
        tags: formTags,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      };
      setTodos((prev) => [...prev, newTodo]);
    }
    setDialogOpen(false);
  };

  /** 切换完成状态 */
  const handleToggleComplete = (todoId: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId
          ? { ...t, completed: !t.completed, updatedAt: dayjs().toISOString() }
          : t,
      ),
    );
  };

  /** 删除待办（软删除） */
  const handleDeleteTodo = (todoId: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === todoId ? { ...t, deleted: true, updatedAt: dayjs().toISOString() } : t,
      ),
    );
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    setDetailOpen(false);
  };

  /** 切换标签选择 */
  const handleToggleFormTag = (tagId: string) => {
    setFormTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  /** 查看待办详情 */
  const handleViewTodo = (todo: TodoItem) => {
    setDetailTodo(todo);
    setDetailOpen(true);
  };

  const monthLabel = dayjs(currentMonth + '-01').format('YYYY年 M月');
  const today = dayjs().format('YYYY-MM-DD');

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={() =>
              setCurrentMonth(
                dayjs(currentMonth + '-01').subtract(1, 'month').format('YYYY-MM'),
              )
            }
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600, minWidth: { xs: 100, md: 140 }, textAlign: 'center', fontSize: { xs: '1rem', sm: '1.15rem', md: '1.5rem' } }}>
            {monthLabel}
          </Typography>
          <IconButton
            onClick={() =>
              setCurrentMonth(
                dayjs(currentMonth + '-01').add(1, 'month').format('YYYY-MM'),
              )
            }
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<TodayIcon />}
            onClick={() => {
              setCurrentMonth(dayjs().format('YYYY-MM'));
            }}
          >
            今天
          </Button>
          <TagManager tags={tags} onTagsChange={setTags} scope="calendar" />
        </Box>
      </Box>

      {/* Tag Filter */}
      <TagFilter
        tags={visibleTags}
        selectedTagIds={selectedTagIds}
        onSelectionChange={setSelectedTagIds}
      />

      {/* Calendar Grid */}
      <Paper sx={{ p: { xs: 0.5, md: 2 }, borderRadius: 3 }}>
        {/* Weekday Headers */}
        <Grid container spacing={0}>
          {WEEKDAYS.map((day) => (
            <Grid item xs={12 / 7} key={day}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  py: 1,
                  fontWeight: 600,
                }}
              >
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
            const isToday = date === today;
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
                    borderColor: isSelected
                      ? 'primary.main'
                      : isToday
                        ? 'primary.light'
                        : 'divider',
                    bgcolor: isToday ? 'primary.50' : 'transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: 28, sm: 32, md: 36 },
                      height: { xs: 28, sm: 32, md: 36 },
                      borderRadius: '50%',
                      bgcolor: isToday ? 'primary.main' : 'transparent',
                      color: isToday ? '#fff' : 'text.primary',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      fontWeight: isToday ? 700 : 400,
                      fontSize: '0.875rem',
                      mb: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {dayjs(date).date()}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: { xs: '0.5rem', sm: '0.55rem' },
                      color: isToday ? 'primary.light' : 'text.disabled',
                      textAlign: 'center',
                      lineHeight: 1,
                      mb: 0.3,
                    }}
                  >
                    {getLunarDate(date)}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3, overflow: 'hidden' }}>
                    {dayTodos.slice(0, 3).map((todo) => (
                      <Tooltip key={todo.id} title={todo.title} arrow>
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTodo(todo);
                          }}
                          sx={{
                            fontSize: '0.65rem',
                            px: 0.5,
                            py: 0.15,
                            borderRadius: 0.5,
                            bgcolor: todo.completed
                              ? 'grey.200'
                              : PRIORITY_CONFIG[todo.priority].color + '22',
                            color: todo.completed
                              ? 'text.disabled'
                              : PRIORITY_CONFIG[todo.priority].color,
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
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.6rem', textAlign: 'center' }}
                      >
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {dayjs(selectedDate).format('M月D日')} 的待办
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => handleAddTodo(selectedDate)}
          >
            添加
          </Button>
        </Box>
        <Divider sx={{ mb: 1 }} />
        {getTodosForDate(selectedDate).length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', py: 3 }}
          >
            这一天暂无待办事项
          </Typography>
        ) : (
          <List disablePadding>
            {getTodosForDate(selectedDate).map((todo) => (
              <ListItem
                key={todo.id}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: 'background.default',
                  px: 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: { xs: 44, md: 36 } }}>
                  <IconButton size="small" onClick={() => handleToggleComplete(todo.id)} sx={{ padding: { xs: '12px', md: '3px' } }}>
                    {todo.completed ? (
                      <CheckCircleIcon color="primary" fontSize="small" />
                    ) : (
                      <RadioButtonUncheckedIcon fontSize="small" />
                    )}
                  </IconButton>
                </ListItemIcon>
                <ListItemText
                  primary={todo.title}
                  secondary={
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={PRIORITY_CONFIG[todo.priority].label}
                        size="small"
                        sx={{
                          bgcolor: PRIORITY_CONFIG[todo.priority].color + '22',
                          color: PRIORITY_CONFIG[todo.priority].color,
                          height: 20,
                          fontSize: '0.7rem',
                        }}
                      />
                      {todo.tags.map((tagId) => {
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
                              height: 20,
                              fontSize: '0.7rem',
                            }}
                          />
                        );
                      })}
                    </Stack>
                  }
                  primaryTypographyProps={{
                    fontWeight: 500,
                    sx: {
                      textDecoration: todo.completed ? 'line-through' : 'none',
                      color: todo.completed ? 'text.disabled' : 'text.primary',
                    },
                  }}
                />
                <Box>
                  <IconButton size="small" onClick={() => handleEditTodo(todo)} sx={{ padding: { xs: '12px', md: '3px' } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleteTargetId(todo.id);
                      setDeleteConfirmOpen(true);
                    }}
                    sx={{ padding: { xs: '12px', md: '3px' } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* FAB for quick add */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: { xs: 72, md: 24 },
          right: 24,
        }}
        onClick={() => handleAddTodo(selectedDate)}
      >
        <AddIcon />
      </Fab>

      {/* Todo Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {detailTodo && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleToggleComplete(detailTodo.id)}
              >
                {detailTodo.completed ? (
                  <CheckCircleIcon color="primary" />
                ) : (
                  <RadioButtonUncheckedIcon />
                )}
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  flex: 1,
                  textDecoration: detailTodo.completed ? 'line-through' : 'none',
                }}
              >
                {detailTodo.title}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                <Chip
                  label={`${PRIORITY_CONFIG[detailTodo.priority].label}优先级`}
                  size="small"
                  sx={{
                    bgcolor: PRIORITY_CONFIG[detailTodo.priority].color + '22',
                    color: PRIORITY_CONFIG[detailTodo.priority].color,
                  }}
                />
                {detailTodo.tags.map((tagId) => {
                  const tag = visibleTags.find((t) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Chip
                      key={tagId}
                      label={tag.name}
                      size="small"
                      sx={{ bgcolor: tag.color + '22', color: tag.color }}
                    />
                  );
                })}
              </Stack>
              {detailTodo.description ? (
                <MarkdownRenderer content={detailTodo.description} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  暂无描述
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                startIcon={<EditIcon />}
                onClick={() => handleEditTodo(detailTodo)}
              >
                编辑
              </Button>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => {
                  setDeleteTargetId(detailTodo.id);
                  setDeleteConfirmOpen(true);
                }}
              >
                删除
              </Button>
              <Button onClick={() => setDetailOpen(false)}>关闭</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Todo Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTodo ? '编辑待办' : '添加待办'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="标题"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="描述（支持 Markdown）"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            multiline
            rows={4}
            sx={{ mb: 2 }}
            placeholder="使用 Markdown 语法编写描述..."
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>优先级</InputLabel>
            <Select
              value={formPriority}
              label="优先级"
              onChange={(e) => setFormPriority(e.target.value as Priority)}
            >
              <MenuItem value="high">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: PRIORITY_CONFIG.high.color,
                    }}
                  />
                  高
                </Box>
              </MenuItem>
              <MenuItem value="medium">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: PRIORITY_CONFIG.medium.color,
                    }}
                  />
                  中
                </Box>
              </MenuItem>
              <MenuItem value="low">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: PRIORITY_CONFIG.low.color,
                    }}
                  />
                  低
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

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
            onClick={handleSaveTodo}
            disabled={!formTitle.trim()}
          >
            {editingTodo ? '更新' : '添加'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除这条待办事项吗？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteTargetId) handleDeleteTodo(deleteTargetId);
            }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarTodo;
