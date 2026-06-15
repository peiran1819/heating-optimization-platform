import React, { useMemo, useState } from 'react';
import { Card, Table, Tag, Input, Select, Button, Row, Col, Space, Tooltip, Typography, Modal, Form, DatePicker, Switch, Popconfirm, message, Divider } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  BarChartOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { OptimizationItem } from '@/data/optimizationData';
import { useOptimizationStore } from '@/store/optimizationStore';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

const moduleCardStyle: React.CSSProperties = { marginBottom: 16 };

const statusColorMap: Record<string, { color: string; icon: React.ReactNode }> = {
  '已完成': { color: 'success', icon: <CheckCircleOutlined /> },
  '待建设': { color: 'warning', icon: <ClockCircleOutlined /> },
  '待明确建设方案': { color: 'error', icon: <ExclamationCircleOutlined /> },
  '进行中': { color: 'processing', icon: <SyncOutlined spin /> },
};

const OptimizationList: React.FC = () => {
  const navigate = useNavigate();
  const { items, categories: catList, abbrMap, addItem, updateItem, deleteItem, renameCategory, addCategory } = useOptimizationStore();
  const [form] = Form.useForm();
  const [catForm] = Form.useForm();

  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // Modal状态
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<OptimizationItem | null>(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatAbbr, setNewCatAbbr] = useState('');
  const [detailDrawer, setDetailDrawer] = useState<OptimizationItem | null>(null);

  const categoryNames = useMemo(() => catList.map((c) => c.name), [catList]);
  const statuses = useMemo(() => [...new Set(items.map((i) => i.status).filter(Boolean))], [items]);

  const filteredData = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !searchText ||
        item.title.includes(searchText) ||
        item.description.includes(searchText) ||
        item.todo.includes(searchText) ||
        item.category.includes(searchText);
      const matchCategory = !categoryFilter || item.category === categoryFilter;
      const matchStatus = !statusFilter || item.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, searchText, categoryFilter, statusFilter]);

  const handleReset = () => {
    setSearchText('');
    setCategoryFilter(undefined);
    setStatusFilter(undefined);
  };

  const stats = useMemo(() => {
    const total = items.length;
    const issued = items.filter((i) => i.isIssued).length;
    const pending = items.filter((i) => i.status && i.status !== '已完成').length;
    return { total, issued, pending };
  }, [items]);

  // 打开新增
  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ isIssued: false, deadline: undefined, status: '进行中' });
    setAddModalOpen(true);
  };

  // 提交新增
  const handleAddOk = async () => {
    try {
      const values = await form.validateFields();
      addItem({
        category: values.category,
        title: values.title,
        description: values.description || '',
        todo: values.todo || '',
        isIssued: values.isIssued,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : '',
        status: values.status || '',
      });
      message.success('新增成功');
      setAddModalOpen(false);
    } catch { /* validation failed */ }
  };

  // 打开编辑
  const handleEdit = (record: OptimizationItem) => {
    setEditRecord(record);
    form.setFieldsValue({
      category: record.category,
      title: record.title,
      description: record.description,
      todo: record.todo,
      isIssued: record.isIssued,
      deadline: record.deadline ? dayjs(record.deadline) : undefined,
      status: record.status || '',
    });
    setEditModalOpen(true);
  };

  // 提交编辑
  const handleEditOk = async () => {
    if (!editRecord) return;
    try {
      const values = await form.validateFields();
      updateItem(editRecord.id, {
        category: values.category,
        title: values.title,
        description: values.description || '',
        todo: values.todo || '',
        isIssued: values.isIssued,
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : '',
        status: values.status || '',
      });
      message.success('修改成功');
      setEditModalOpen(false);
      setEditRecord(null);
    } catch { /* validation failed */ }
  };

  // 删除
  const handleDelete = (id: number) => {
    deleteItem(id);
    message.success('已删除');
  };

  // 大项重命名
  const handleCatRename = async () => {
    try {
      const values = await catForm.validateFields();
      if (values.oldName !== values.newName) {
        renameCategory(values.oldName, values.newName);
        message.success('大项已重命名');
      }
      catForm.resetFields();
    } catch { /* validation failed */ }
  };

  // 新增大项
  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) { message.warning('请输入大项名称'); return; }
    if (categoryNames.includes(name)) { message.warning('该大项已存在'); return; }
    const abbr = newCatAbbr.trim();
    if (!abbr) { message.warning('请输入大项简称（一个字）'); return; }
    if (abbr.length > 2) { message.warning('简称尽量控制在1-2个字'); }
    addCategory(name, abbr);
    message.success(`大项「${name}」（${abbr}）已添加`);
    setNewCatName('');
    setNewCatAbbr('');
  };

  const columns: ColumnsType<OptimizationItem> = [
    { title: '序号', dataIndex: 'id', key: 'id', width: 70, align: 'center', fixed: 'left' },
    {
      title: '大项', dataIndex: 'category', key: 'category', width: 120,
      render: (c: string) => <Tag color="blue" style={{ fontSize: 13 }}>{c}</Tag>,
    },
    {
      title: '需求内容', dataIndex: 'title', key: 'title', width: 280,
      render: (t: string) => <Text strong style={{ fontSize: 14 }}>{t}</Text>,
    },
    {
      title: '背景和目的说明', dataIndex: 'description', key: 'description', width: 300,
      render: (t: string) => t ? (
        <Tooltip title={t} placement="topLeft" overlayStyle={{ maxWidth: 500 }}>
          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontSize: 13, color: '#666' }}>{t}</Paragraph>
        </Tooltip>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: '建委下达', dataIndex: 'isIssued', key: 'isIssued', width: 90, align: 'center',
      render: (v: boolean) => v ? <Tag color="orange" icon={<ExclamationCircleOutlined />}>是</Tag> : <Tag color="default">否</Tag>,
    },
    {
      title: '完成时限', dataIndex: 'deadline', key: 'deadline', width: 120, align: 'center',
      sorter: (a, b) => (a.deadline || '').localeCompare(b.deadline || ''),
      render: (d: string) => d ? <Text style={{ fontSize: 13 }}>{d}</Text> : <Text type="secondary">-</Text>,
    },
    {
      title: '建设状态', dataIndex: 'status', key: 'status', width: 140, align: 'center',
      render: (s: string) => {
        const cfg = statusColorMap[s];
        if (!s) return <Text type="secondary">-</Text>;
        return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{s}</Tag> : <Tag>{s}</Tag>;
      },
    },
    {
      title: '待办事项', dataIndex: 'todo', key: 'todo', width: 280,
      render: (t: string) => t ? (
        <Tooltip title={t} placement="topLeft" overlayStyle={{ maxWidth: 500 }}>
          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, fontSize: 13, color: '#fa8c16' }}>{t}</Paragraph>
        </Tooltip>
      ) : <Text type="secondary">-</Text>,
    },
    {
      title: '操作', key: 'action', width: 140, align: 'center', fixed: 'right',
      render: (_: unknown, record: OptimizationItem) => (
        <Space size={4}>
          <Tooltip title="查看"><Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setDetailDrawer(record)} /></Tooltip>
          <Tooltip title="编辑"><Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} /></Tooltip>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Tooltip title="删除"><Button type="link" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const formLayout = { labelCol: { span: 5 }, wrapperCol: { span: 19 } };

  return (
    <div style={{ padding: '16px', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>📋 供热优化方向表</Typography.Title>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增</Button>
          <Button icon={<SettingOutlined />} onClick={() => setCatModalOpen(true)}>大项维护</Button>
          <Button icon={<BarChartOutlined />} onClick={() => navigate('/optimization/gantt')}>查看甘特图</Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
            <div style={{ fontSize: 14, color: '#999' }}>优化方向总数</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
            <div style={{ fontSize: 14, color: '#999' }}>建委下达</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fa8c16' }}>{stats.issued}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#fff2f0' }}>
            <div style={{ fontSize: 14, color: '#999' }}>待建设/待明确</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff4d4f' }}>{stats.pending}</div>
          </Card>
        </Col>
      </Row>

      {/* 筛选区域 */}
      <Card style={moduleCardStyle}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Input placeholder="搜索需求内容/背景/待办..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select placeholder="大项分类" value={categoryFilter} onChange={setCategoryFilter} allowClear style={{ width: '100%' }} options={categoryNames.map((c) => ({ label: c, value: c }))} />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select placeholder="建设状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: '100%' }} options={statuses.map((s) => ({ label: s, value: s }))} />
          </Col>
          <Col xs={24} sm={4} md={10}><Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button></Col>
        </Row>
      </Card>

      {/* 数据表格 */}
      <Card style={moduleCardStyle}>
        <Table<OptimizationItem>
          columns={columns} dataSource={filteredData} rowKey="id" scroll={{ x: 1500 }} size="middle" bordered
          pagination={{ defaultPageSize: 20, showSizeChanger: true, showQuickJumper: true, showTotal: (t, r) => `共 ${t} 条，第 ${r[0]}-${r[1]} 条`, pageSizeOptions: ['10', '20', '50'] }}
        />
      </Card>

      {/* 新增/编辑 Modal */}
      <Modal
        title={editRecord ? '编辑需求' : '新增需求'}
        open={addModalOpen || editModalOpen}
        onCancel={() => { setAddModalOpen(false); setEditModalOpen(false); setEditRecord(null); }}
        onOk={editRecord ? handleEditOk : handleAddOk}
        width={640}
        destroyOnClose
      >
        <Form form={form} {...formLayout} style={{ marginTop: 16 }}>
          <Form.Item name="category" label="大项" rules={[{ required: true, message: '请选择或输入大项' }]}>
            <Select placeholder="选择大项" allowClear showSearch
              options={categoryNames.map((c) => ({ label: c, value: c }))}
              onChange={(val) => { if (val && !categoryNames.includes(val)) { form.setFieldValue('category', val); }}}
              mode={undefined}
            />
          </Form.Item>
          <Form.Item name="title" label="需求内容" rules={[{ required: true, message: '请输入需求内容' }]}>
            <Input placeholder="请输入需求内容" />
          </Form.Item>
          <Form.Item name="description" label="背景说明">
            <Input.TextArea rows={3} placeholder="请输入背景和目的说明" />
          </Form.Item>
          <Form.Item name="todo" label="待办事项">
            <Input.TextArea rows={2} placeholder="请输入待办事项" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deadline" label="完成时限" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }} rules={[{ required: true, message: '请选择完成时限' }]}>
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="isIssued" label="建委下达" labelCol={{ span: 10 }} wrapperCol={{ span: 14 }} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="建设状态" rules={[{ required: true, message: '请选择建设状态' }]}>
            <Select placeholder="选择状态"
              options={[
                { label: '进行中', value: '进行中' },
                { label: '待建设', value: '待建设' },
                { label: '待明确建设方案', value: '待明确建设方案' },
                { label: '已完成', value: '已完成' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 大项维护 Modal */}
      <Modal
        title="大项维护"
        open={catModalOpen}
        onCancel={() => { setCatModalOpen(false); catForm.resetFields(); setNewCatName(''); setNewCatAbbr(''); }}
        footer={null}
        width={520}
        destroyOnClose
      >
        {/* 新增大项 */}
        <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f6ffed', borderRadius: 6, border: '1px solid #b7eb8f' }}>
          <Text strong style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>＋ 新增大项</Text>
          <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
            <Input
              placeholder="输入新大项名称"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onPressEnter={handleAddCategory}
              style={{ flex: 3 }}
            />
            <Input
              placeholder="一字简称"
              value={newCatAbbr}
              onChange={(e) => setNewCatAbbr(e.target.value)}
              onPressEnter={handleAddCategory}
              maxLength={2}
              style={{ flex: 1, maxWidth: 90 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory}>添加</Button>
          </Space.Compact>
          <Text type="secondary" style={{ fontSize: 11 }}>简称用于甘特图Y轴标签，建议一个字，如：城、模、调</Text>
        </div>

        {/* 当前大项列表 */}
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>当前大项列表（共 {categoryNames.length} 个）：</Text>
          <Space wrap size={[8, 8]}>
            {categoryNames.map((c) => (
              <Tag key={c} color="blue" style={{ fontSize: 13, padding: '4px 10px', borderRadius: 4 }}>
                {c} <Text type="secondary" style={{ fontSize: 11 }}>({abbrMap[c] || '?'})</Text>
              </Tag>
            ))}
          </Space>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 重命名大项 */}
        <div style={{ padding: '12px 16px', background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
          <Text strong style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>✏️ 重命名大项</Text>
          <Form form={catForm} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} style={{ marginTop: 8 }}>
            <Form.Item name="oldName" label="原名称" rules={[{ required: true, message: '请选择大项' }]}>
              <Select placeholder="选择要重命名的大项" options={categoryNames.map((c) => ({ label: c, value: c }))} />
            </Form.Item>
            <Form.Item name="newName" label="新名称" rules={[{ required: true, message: '请输入新名称' }]}>
              <Input placeholder="输入新的大项名称" />
            </Form.Item>
            <Form.Item wrapperCol={{ offset: 6, span: 18 }} style={{ marginBottom: 0 }}>
              <Button type="primary" onClick={handleCatRename}>确认重命名</Button>
            </Form.Item>
          </Form>
          <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>提示：该大项下的所有需求将一并更新</Text>
        </div>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={null}
        open={!!detailDrawer}
        onCancel={() => setDetailDrawer(null)}
        footer={null}
        width={560}
        styles={{ body: { padding: 0 } }}
      >
        {detailDrawer && (
          <div>
            {/* 标题区 */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Space size={6} style={{ marginBottom: 8 }}>
                <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>{detailDrawer.category}</Tag>
                {detailDrawer.isIssued && <Tag color="orange" style={{ fontSize: 12 }}>建委下达</Tag>}
                {detailDrawer.status && (
                  <Tag color={statusColorMap[detailDrawer.status]?.color} style={{ fontSize: 12 }}>
                    {detailDrawer.status}
                  </Tag>
                )}
              </Space>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.5, marginTop: 6 }}>
                {detailDrawer.title}
              </div>
              {detailDrawer.deadline && (
                <div style={{ fontSize: 13, color: '#999', marginTop: 6 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  完成时限：<b style={{ color: '#333' }}>{detailDrawer.deadline}</b>
                </div>
              )}
            </div>

            {/* 内容区 */}
            <div style={{ padding: '16px 24px 24px' }}>
              {detailDrawer.description && (
                <div style={{ marginBottom: 18 }}>
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block', fontWeight: 500 }}>
                    <FileTextOutlined style={{ marginRight: 4 }} />背景和目的说明
                  </Text>
                  <div style={{
                    fontSize: 13, color: '#555', lineHeight: 1.7, background: '#fafafa',
                    padding: '10px 14px', borderRadius: 6, whiteSpace: 'pre-wrap',
                    borderLeft: '3px solid #1890ff',
                  }}>
                    {detailDrawer.description}
                  </div>
                </div>
              )}

              {detailDrawer.todo && (
                <div style={{ marginBottom: 18 }}>
                  <Text type="secondary" style={{ fontSize: 12, marginBottom: 6, display: 'block', fontWeight: 500 }}>
                    <ExclamationCircleOutlined style={{ marginRight: 4 }} />待办事项
                  </Text>
                  <div style={{
                    fontSize: 13, color: '#d48806', lineHeight: 1.7, background: '#fffbe6',
                    padding: '10px 14px', borderRadius: 6, whiteSpace: 'pre-wrap',
                    border: '1px solid #ffe58f',
                  }}>
                    {detailDrawer.todo}
                  </div>
                </div>
              )}

              {!detailDrawer.description && !detailDrawer.todo && (
                <div style={{ textAlign: 'center', padding: 24, color: '#ccc', fontSize: 13 }}>暂无更多详情</div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OptimizationList;
