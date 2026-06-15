import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Breadcrumb as AntdBreadcrumb } from 'antd';
import { HomeOutlined, SettingOutlined, UserOutlined, SafetyOutlined, KeyOutlined, AimOutlined, BarChartOutlined } from '@ant-design/icons';

const routeConfig: Record<string, { title: string; icon?: React.ReactNode }> = {
  '/': { title: '首页', icon: <HomeOutlined /> },
  '/optimization': { title: '供热优化', icon: <AimOutlined /> },
  '/optimization/list': { title: '优化方向表', icon: <AimOutlined /> },
  '/optimization/gantt': { title: '项目甘特图', icon: <BarChartOutlined /> },
  '/system': { title: '系统管理', icon: <SettingOutlined /> },
  '/system/users': { title: '用户管理', icon: <UserOutlined /> },
  '/system/roles': { title: '角色管理', icon: <SafetyOutlined /> },
  '/system/permissions': { title: '权限管理', icon: <KeyOutlined /> },
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter((i) => i);

  if (location.pathname === '/login') return null;

  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    const config = routeConfig[url];
    
    if (!config) return null;

    const isLast = index === pathSnippets.length - 1;

    return {
      key: url,
      title: isLast ? (
        <span className="flex items-center gap-1">
          {config.icon}
          <span>{config.title}</span>
        </span>
      ) : (
        <Link to={url} className="flex items-center gap-1">
          {config.icon}
          <span>{config.title}</span>
        </Link>
      ),
    };
  }).filter(Boolean);

  const breadcrumbItems = [
    {
      key: '/',
      title: (
        <Link to="/" className="flex items-center gap-1">
          <HomeOutlined />
          <span>首页</span>
        </Link>
      ),
    },
    ...extraBreadcrumbItems,
  ];

  return (
    <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
      <AntdBreadcrumb items={breadcrumbItems as any} style={{ fontSize: '14px' }} />
    </div>
  );
};

export default Breadcrumb;
