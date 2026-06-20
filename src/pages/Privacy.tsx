import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import LockIcon from '@mui/icons-material/Lock';
import StorageIcon from '@mui/icons-material/Storage';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';
import UpdateIcon from '@mui/icons-material/Update';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import ReportIcon from '@mui/icons-material/Report';
import PeopleIcon from '@mui/icons-material/People';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';

interface PrivacySectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const PrivacySection: React.FC<PrivacySectionProps> = ({ icon, title, children }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      {icon}
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ pl: { xs: 0, sm: 5 } }}>{children}</Box>
  </Box>
);

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ShieldIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            隐私政策
          </Typography>
          <Typography variant="body2" color="text.secondary">
            最后更新日期：2026年1月1日
          </Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
          本隐私政策旨在说明本网站（"个人实用工具站"）如何收集、使用、存储和保护您的个人信息。
          请您仔细阅读本政策，了解我们对您个人信息的处理方式。使用本网站即表示您同意本隐私政策所述的信息处理实践。
        </Typography>

        {/* 1. 信息收集范围 */}
        <PrivacySection icon={<VisibilityIcon color="primary" />} title="一、信息收集范围">
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.8 }}>
            本网站收集以下信息：
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><LockIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="账户信息：用户名和密码（密码经 bcrypt 加盐哈希后存储，不以明文形式保存）" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><StorageIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="用户数据：待办事项、链接收藏、标签、个人介绍等内容" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><VisibilityIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="登录日志：登录时间、IP 地址、浏览器 User-Agent 信息" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><GavelIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="举报信息：您主动提交的举报内容、联系方式（可选）" />
            </ListItem>
          </List>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 2. 信息使用目的 */}
        <PrivacySection icon={<StorageIcon color="primary" />} title="二、信息使用目的">
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
            您的个人信息仅用于提供个人工具站的核心服务功能，包括：账户认证、数据同步与存储、
            安全审计与日志记录、以及配合监管部门依法进行的信息安全检查。
            我们绝不会将您的个人信息用于商业营销或其他非服务目的。
          </Typography>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 3. 信息存储方式 */}
        <PrivacySection icon={<LockIcon color="primary" />} title="三、信息存储方式">
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><StorageIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="用户数据存储于服务器端 SQLite 数据库中，启用 WAL 模式以保证数据一致性" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><LockIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="密码使用 bcrypt 算法加盐哈希存储，即使数据库泄露也无法还原原始密码" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><SecurityIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="所有数据传输均通过 HTTPS 加密通道，防止中间人攻击" />
            </ListItem>
          </List>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 4. 日志记录说明 */}
        <PrivacySection icon={<VisibilityIcon color="primary" />} title="四、日志记录说明">
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.8 }}>
            为满足公安联网备案的安全要求，本网站记录以下日志信息：
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><VisibilityIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="登录日志：记录登录时间、IP 地址、设备信息（User-Agent）、登录结果（成功/失败）" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><StorageIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="操作日志：记录数据同步、内容修改等关键操作" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><GavelIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="日志保留期限：登录日志自记录之日起保留 6 个月，到期后自动清理" />
            </ListItem>
          </List>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 5. 信息共享 */}
        <PrivacySection icon={<PeopleIcon color="primary" />} title="五、信息共享">
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
            本网站不会向任何第三方共享、出售或出租您的个人信息。但在以下情形下，
            我们可能依法向监管部门提供必要信息：根据公安机关、司法机关或其他有权机关的合法要求，
            依照法律法规的规定配合调取相关数据。此类信息共享将严格限制在法律要求的范围内。
          </Typography>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 6. 用户权利 */}
        <PrivacySection icon={<GavelIcon color="primary" />} title="六、用户权利">
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.8 }}>
            您对自己的个人信息享有以下权利：
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><VisibilityIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="查看权：您可在设置页面查看自己的登录日志和操作记录" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><DeleteIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="删除权：您可删除自己的待办事项、链接等数据，删除后不可恢复" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><ReportIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="投诉权：您可通过网站举报功能或联系站长进行投诉" />
            </ListItem>
          </List>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 7. 投诉举报方式 */}
        <PrivacySection icon={<ReportIcon color="primary" />} title="七、投诉举报方式">
          <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.8 }}>
            如您发现本网站存在违法信息或安全隐患，可通过以下方式举报：
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><ReportIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="网站举报功能：点击页面底部的「投诉举报」按钮在线提交举报" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><ContactMailIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="联系站长：通过网站提供的联系方式直接与站长沟通" />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.8 }}>
            我们将在收到举报后及时处理，并将处理结果反馈给您（如留有联系方式）。
          </Typography>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 8. 安全措施 */}
        <PrivacySection icon={<SecurityIcon color="primary" />} title="八、安全措施">
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><SecurityIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="JWT 认证：所有 API 请求均需携带有效的 JWT 令牌进行身份验证" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><LockIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="HTTPS 加密：全站启用 HTTPS，确保数据传输安全" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><LockIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="密码加盐哈希：使用 bcrypt 算法对密码进行加盐哈希存储" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><SecurityIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="速率限制：对 API 请求进行速率限制，防止暴力破解和恶意攻击" />
            </ListItem>
          </List>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 9. 政策更新 */}
        <PrivacySection icon={<UpdateIcon color="primary" />} title="九、政策更新">
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
            本隐私政策可能会不时更新。当政策发生重大变更时，我们将在网站上进行公告通知。
            建议您定期查阅本页面以了解最新的隐私政策。继续使用本网站即表示您同意更新后的隐私政策。
          </Typography>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* 10. 联系方式 */}
        <PrivacySection icon={<ContactMailIcon color="primary" />} title="十、联系方式">
          <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
            如您对本隐私政策有任何疑问、意见或建议，可通过以下方式联系我们：
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><ReportIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="通过网站「投诉举报」功能提交反馈" />
            </ListItem>
            <ListItem>
              <ListItemIcon sx={{ minWidth: 32 }}><ContactMailIcon fontSize="small" color="action" /></ListItemIcon>
              <ListItemText primary="通过网站公示的站长联系方式直接联系" />
            </ListItem>
          </List>
        </PrivacySection>

        <Divider sx={{ my: 3 }} />

        {/* Footer */}
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            浙ICP备2026012560号 | 公安备案：待审核通过后添加
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/login')}
            sx={{ mr: 1 }}
          >
            返回登录
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate(-1)}
          >
            返回上一页
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Privacy;
