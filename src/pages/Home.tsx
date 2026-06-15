import React from 'react';
import { Card, Row, Col, Statistic, List, Avatar, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  ArrowUpOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const Home: React.FC = () => {

  const moduleCardStyle = {
    background: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,21,41,.08)',
    border: '1px solid #f0f0f0',
    marginBottom: '16px',
  };

  const activities = [
    {
      user: 'Admin',
      action: '登录系统',
      type: 'login',
      time: '10分钟前',
    },
    {
      user: '张三',
      action: '编辑用户资料',
      type: 'edit',
      time: '30分钟前',
    },
    {
      user: '李四',
      action: '新增角色',
      type: 'add',
      time: '1小时前',
    },
    {
      user: 'Admin',
      action: '删除权限',
      type: 'delete',
      time: '2小时前',
    },
  ];

  const getActionTag = (type: string) => {
    switch (type) {
      case 'login': return <Tag color="blue">登录</Tag>;
      case 'edit': return <Tag color="orange">编辑</Tag>;
      case 'add': return <Tag color="green">新增</Tag>;
      case 'delete': return <Tag color="red">删除</Tag>;
      default: return <Tag>其他</Tag>;
    }
  };

  return (
    <div style={{ background: 'transparent' }}>
      {/* 欢迎信息 */}
      <Card style={moduleCardStyle}>
        <div className="flex items-center gap-4">
          <Avatar size={64} icon={<UserOutlined />} />
          <div>
            <h2 className="text-xl font-bold">早安，Admin，祝你开心每一天！</h2>
            <p className="text-gray-500">今日天气晴朗，20℃ - 26℃</p>
          </div>
        </div>
      </Card>

      {/* 数据统计 */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={moduleCardStyle}>
            <Statistic
              title="总用户数"
              value={112893}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={moduleCardStyle}>
            <Statistic
              title="在线用户"
              value={123}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={moduleCardStyle}>
            <Statistic
              title="系统角色"
              value={12}
              prefix={<SolutionOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={moduleCardStyle}>
            <Statistic
              title="权限数量"
              value={64}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 功能区域 */}
      <Row gutter={[16, 16]} style={{ display: 'flex', alignItems: 'stretch' }}>
        <Col xs={24} lg={16} style={{ display: 'flex' }}>
          <Card 
            title="快捷操作" 
            style={{ ...moduleCardStyle, width: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1 }}
          >
            <Row gutter={[16, 16]}>
              {[
                { title: '用户管理', icon: <TeamOutlined />, color: '#1890ff' },
                { title: '角色管理', icon: <SolutionOutlined />, color: '#722ed1' },
                { title: '权限设置', icon: <SafetyCertificateOutlined />, color: '#fa8c16' },
                { title: '系统设置', icon: <SettingOutlined />, color: '#52c41a' },
                { title: '日志查询', icon: <SolutionOutlined />, color: '#13c2c2' },
                { title: '个人中心', icon: <UserOutlined />, color: '#eb2f96' },
              ].map((item, index) => (
                <Col span={8} key={index}>
                  <Card hoverable className="text-center cursor-pointer">
                    <div style={{ fontSize: '24px', color: item.color, marginBottom: '8px' }}>
                      {item.icon}
                    </div>
                    <div>{item.title}</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8} style={{ display: 'flex' }}>
          <Card 
            title="最近活动" 
            style={{ ...moduleCardStyle, width: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, padding: '0 24px' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={activities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div className="flex justify-between">
                        <span>{item.user}</span>
                        <span className="text-gray-400 text-xs">{item.time}</span>
                      </div>
                    }
                    description={
                      <div className="flex items-center gap-2">
                        {getActionTag(item.type)}
                        <span>{item.action}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
