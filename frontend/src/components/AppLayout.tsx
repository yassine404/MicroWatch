import { useState } from 'react';
import { Layout, Menu, Button, Space, Switch, Typography } from 'antd';
import {
    DashboardOutlined,
    CloudServerOutlined,
    UserOutlined,
    TeamOutlined,
    SettingOutlined,
    LogoutOutlined,
    SunOutlined,
    MoonOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    FileTextOutlined,
    PieChartOutlined,
    BellOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import NotificationBell from './NotificationBell';
const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { darkMode, toggleTheme } = useTheme();

    const menuItems = [
    {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
    },
    {
        key: '/microservices',
        icon: <CloudServerOutlined />,
        label: 'Microservices',
    },
    {
        key: '/profile',
        icon: <UserOutlined />,
        label: 'Mon Profil',
    },
    { 
        key: '/sla', 
        icon: <PieChartOutlined />, 
        label: 'SLA' 
    },
    { 
        key: '/admin/sla-config', 
        icon: <SettingOutlined />, 
        label: 'Config SLA' }
    ,
    { 
        key: '/logs', 
        icon: <FileTextOutlined />, 
        label: 'Logs' },
    { 
        key: '/notifications', 
        icon: <BellOutlined />, 
        label: 'Notifications' 
    },
    ...(user?.role === 'ADMIN_SUP'
        ? [
            {
            key: 'admin',
            icon: <SettingOutlined />,
            label: 'Administration',
            children: [
                { key: '/admin/users', icon: <TeamOutlined />, label: 'Utilisateurs' },
                { key: '/admin/requests', icon: <SettingOutlined />, label: 'Demandes de rôle' },
            ],
            },
        ]
        : []),
    ];

    return (
    <Layout style={{ minHeight: '100vh', width: '100%' }}>
        <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={darkMode ? 'dark' : 'light'}
        style={{
            backgroundColor: darkMode ? '#121212' : '#FFFFFF',
            borderRight: `1px solid ${darkMode ? '#333' : '#f0f0f0'}`,
        }}
        >
        <div style={{
            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: `1px solid ${darkMode ? '#333' : '#f0f0f0'}`,
        }}>
            <Text strong style={{ color: darkMode ? '#FFFFFF' : '#228B22', fontSize: collapsed ? 16 : 18 }}>
            {collapsed ? 'MW' : 'MicroWatch'}
            </Text>
        </div>
        <Menu
            theme={darkMode ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[location.pathname]}
            defaultOpenKeys={user?.role === 'ADMIN_SUP' ? ['admin'] : []}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ backgroundColor: 'transparent', borderRight: 'none' }}
        />
        </Sider>
        <Layout>
        <Header style={{
            backgroundColor: darkMode ? '#1E1E1E' : '#FFFFFF',
            padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${darkMode ? '#333' : '#f0f0f0'}`,
        }}>
            <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16, color: darkMode ? '#FFF' : '#000' }}
            />
            <Space size="middle">
            <NotificationBell />
            <Space>
                <SunOutlined style={{ color: darkMode ? '#888' : '#228B22' }} />
                <Switch
                checked={darkMode}
                onChange={toggleTheme}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                />
                <MoonOutlined style={{ color: darkMode ? '#FFF' : '#888' }} />
            </Space>
            <Text style={{ color: darkMode ? '#FFF' : '#000' }}>
                {user?.username} ({user?.role})
            </Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={() => { logout(); navigate('/login'); }}
                style={{ color: darkMode ? '#FFF' : '#000' }}>
                Déconnexion
            </Button>
            </Space>
        </Header>
        <Content style={{
            padding: 0,
            backgroundColor: darkMode ? '#1E1E1E' : '#F5F5F5', 
            minHeight: 280,
            color: darkMode ? '#FFF' : '#000',
            overflow: 'auto',
        }}>
            {children}
        </Content>
        </Layout>
    </Layout>
    );
};

export default AppLayout;