import React from 'react';
import { Card, Table, Button, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const PermissionManagement: React.FC = () => {
  const columns = [
    { title: '权限名称', dataIndex: 'permissionName', key: 'permissionName', align: 'center' as const },
    { title: '权限代码', dataIndex: 'permissionCode', key: 'permissionCode', align: 'center' as const },
    { title: '类型', dataIndex: 'type', key: 'type', align: 'center' as const, render: (type: string) => <Tag color="blue">{type}</Tag> },
    {
      title: '操作',
      key: 'action',
      align: 'center' as const,
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  const data = [
    { key: '1', permissionName: '用户管理', permissionCode: 'user:view', type: 'menu' },
    { key: '2', permissionName: '用户新增', permissionCode: 'user:add', type: 'button' },
  ];

  const moduleCardStyle = {
    background: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,21,41,.08)',
    border: '1px solid #f0f0f0',
    marginBottom: '16px',
  };

  return (
    <div style={{ background: 'transparent' }}>
      <Card style={moduleCardStyle} className="mb-4">
        <Button type="primary" icon={<PlusOutlined />}>新增权限</Button>
      </Card>
      <Card style={moduleCardStyle}>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default PermissionManagement;
