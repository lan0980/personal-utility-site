import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import { useSyncedStorage } from '../store/useSyncedStorage';
import { AboutData } from '../types';
import MarkdownRenderer from '../components/MarkdownRenderer';

const DEFAULT_MARKDOWN = `# 👋 你好，欢迎！

这是你的个人介绍页面，使用 **Markdown** 语法编写。

## 关于我

在这里介绍一下你自己吧！可以包括：

- 🏠 所在地
- 💼 职业
- 🎓 教育背景
- 🎯 兴趣爱好

## 技能

| 技能 | 熟练度 |
|------|--------|
| JavaScript | ⭐⭐⭐⭐⭐ |
| TypeScript | ⭐⭐⭐⭐ |
| React | ⭐⭐⭐⭐ |
| Python | ⭐⭐⭐ |

## 联系方式

- 📧 邮箱：hello@example.com
- 🐙 GitHub：[github.com](https://github.com)

## 代码示例

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}! Welcome to my site.\`;
}

console.log(greet('World'));
\`\`\`

---

> 生活不是等待暴风雨过去，而是学会在雨中起舞。

*点击右上角的编辑按钮来修改此页面内容。*
`;

const DEFAULT_ABOUT: AboutData = {
  content: DEFAULT_MARKDOWN,
  updatedAt: new Date().toISOString(),
};

const About: React.FC = () => {
  const [aboutData, setAboutData] = useSyncedStorage<AboutData>('about-content', DEFAULT_ABOUT);
  const [editContent, setEditContent] = useState(aboutData.content);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSave = () => {
    setAboutData({
      content: editContent,
      updatedAt: new Date().toISOString(),
    });
    setMode('preview');
  };

  const handleCancel = () => {
    setEditContent(aboutData.content);
    setMode('preview');
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <PersonIcon color="primary" />
          关于
        </Typography>
      </Box>

      {/* Mode Toggle — always visible so user can switch between edit and preview */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          size="small"
          aria-label="编辑模式"
          onChange={(_, newMode) => {
            if (newMode !== null) {
              if (newMode === 'edit') {
                setEditContent(aboutData.content);
              }
              setMode(newMode);
            }
          }}
        >
          <ToggleButton value="edit" sx={{ px: 2 }}>
            <EditIcon sx={{ mr: 0.5, fontSize: 18 }} />
            编辑
          </ToggleButton>
          <ToggleButton value="preview" sx={{ px: 2 }}>
            <VisibilityIcon sx={{ mr: 0.5, fontSize: 18 }} />
            预览
          </ToggleButton>
        </ToggleButtonGroup>
        {mode === 'edit' && (
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
            <Button variant="outlined" size="small" onClick={handleCancel}>
              取消
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              color="primary"
            >
              保存
            </Button>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Paper sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, minHeight: 400 }}>
        {mode === 'preview' ? (
          <MarkdownRenderer content={aboutData.content} />
        ) : (
          <TextField
            fullWidth
            multiline
            minRows={isMobile ? 12 : 20}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
            placeholder="使用 Markdown 语法编写内容..."
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.7,
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
};

export default About;
