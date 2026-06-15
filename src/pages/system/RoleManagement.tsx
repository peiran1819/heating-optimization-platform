import React from 'react';
import { Card, Table, Button, Tag, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const RoleManagement: React.FC = () => {
  const columns = [
    { title: '角色名称', dataIndex: 'roleName', key: 'roleName', align: 'center' as const },
    { title: '角色代码', dataIndex: 'roleCode', key: 'roleCode', align: 'center' as const },
    { title: '描述', dataIndex: 'description', key: 'description', align: 'center' as const },
    { title: '状态', dataIndex: 'status', key: 'status', align: 'center' as const, render: (status: string) => <Tag color={status === 'active' ? 'success' : 'error'}>{status === 'active' ? '启用' : '禁用'}</Tag> },
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
    { key: '1', roleName: '管理员', roleCode: 'admin', description: '系统管理员', status: 'active' },
    { key: '2', roleName: '普通用户', roleCode: 'user', description: '普通用户', status: 'active' },
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
        <Button type="primary" icon={<PlusOutlined />}>新增角色</Button>
      </Card>
      <Card style={moduleCardStyle}>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default RoleManagement;
