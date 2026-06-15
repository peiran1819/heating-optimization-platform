import React, { useState } from 'react';
import { Card, Table, Button, Input, Row, Col, Space, Tag, Modal, Form, Select, message, Popconfirm } from 'antd';
import { UserOutlined, SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface User {
  id: string;
  userId: string;
  userName: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createTime: string;
  lastLogin: string;
}

const mockUsers: User[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `${i + 1}`,
  userId: `U00${i + 1}`,
  userName: `用户${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 2 === 0 ? '管理员' : '普通用户',
  status: i % 3 === 0 ? 'inactive' : 'active',
  createTime: '2024-01-15 10:30:00',
  lastLogin: '2024-07-30 09:15:00',
}));

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  const columns: ColumnsType<User> = [
    {
      title: '用户',
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
      align: 'center',
      render: (text: string, record: User) => (
        <Space size={4} style={{ whiteSpace: 'nowrap' }}>
          <UserOutlined style={{ color: '#1890ff', fontSize: '14px' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
          <Tag style={{ margin: 0, fontSize: '11px', padding: '0 4px' }}>
            {record.userId}
          </Tag>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      align: 'center',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          'active': { color: 'success', text: '启用' },
          'inactive': { color: 'error', text: '禁用' }
        };
        const config = statusMap[status] || { color: 'default', text: '未知' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      align: 'center',
      sorter: (a, b) => a.createTime.localeCompare(b.createTime),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      align: 'center',
      render: (_: any, record: User) => (
        <Space size={8}>
          <Button type="link" icon={<EyeOutlined />} size="small">
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} size="small">
            编辑
          </Button>
          <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleEdit = (record: User) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setData(data.filter(item => item.id !== id));
    message.success('删除成功');
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      setLoading(true);
      setTimeout(() => {
        if (editingUser) {
          setData(data.map(item => item.id === editingUser.id ? { ...item, ...values } : item));
          message.success('更新成功');
        } else {
          const newUser: User = {
            id: String(data.length + 1),
            userId: `U00${data.length + 1}`,
            createTime: new Date().toLocaleString(),
            lastLogin: '-',
            status: 'active',
            ...values,
          };
          setData([newUser, ...data]);
          message.success('创建成功');
        }
        setIsModalOpen(false);
        setLoading(false);
      }, 1000);
    });
  };

  const filteredData = data.filter(item => 
    item.userName.includes(searchText) || item.email.includes(searchText)
  );

  const moduleCardStyle = {
    background: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,21,41,.08)',
    border: '1px solid #f0f0f0',
    marginBottom: '16px',
  };

  return (
    <div style={{ background: 'transparent' }}>
      {/* 筛选操作区 */}
      <Card style={moduleCardStyle} className="mb-4">
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space>
               <Input 
                 placeholder="搜索用户或邮箱..." 
                 prefix={<SearchOutlined />} 
                 onChange={e => setSearchText(e.target.value)}
                 style={{ width: 200 }}
               />
               <Button type="primary" onClick={() => {}}>搜索</Button>
            </Space>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增用户</Button>
          </Col>
        </Row>
      </Card>
      
      {/* 数据列表区 */}
      <Card style={moduleCardStyle} bodyStyle={{ padding: 0 }}>
        <Table 
          dataSource={filteredData} 
          columns={columns} 
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingUser ? "编辑用户" : "新增用户"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="userName" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="管理员">管理员</Select.Option>
              <Select.Option value="普通用户">普通用户</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
