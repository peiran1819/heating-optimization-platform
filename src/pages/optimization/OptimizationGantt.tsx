import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Card, Row, Col, Select, Space, Typography, Segmented, Drawer, Tag, Descriptions, Badge, Divider, Button } from 'antd';
import {
  CalendarOutlined,
  ExclamationCircleOutlined,
  AimOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { useOptimizationStore } from '@/store/optimizationStore';
import type { OptimizationItem } from '@/data/optimizationData';

const { Text } = Typography;

// 分类颜色（主色 + 半透明rgba）
const catColorMap: Record<string, { hex: string; rgba: string; dark: string }> = {
  '城区端':     { hex: '#1890ff', rgba: 'rgba(24,144,255,0.18)', dark: '#096dd9' },
  '曲线模型':   { hex: '#52c41a', rgba: 'rgba(82,196,26,0.18)', dark: '#389e0d' },
  '模型&调度单': { hex: '#fa8c16', rgba: 'rgba(250,140,22,0.18)', dark: '#d46b08' },
  '12345投诉':  { hex: '#f5222d', rgba: 'rgba(245,34,45,0.18)', dark: '#cf1322' },
  '供热保障':   { hex: '#722ed1', rgba: 'rgba(114,46,209,0.18)', dark: '#531dab' },
  'AI助手暖暖': { hex: '#13c2c2', rgba: 'rgba(19,194,194,0.18)', dark: '#08979c' },
  '外业':       { hex: '#fadb14', rgba: 'rgba(250,219,20,0.18)', dark: '#d4b106' },
};

// 状态特殊颜色
const statusStyle: Record<string, { fill: string; border: string; lineWidth: number }> = {
  '待建设':           { fill: 'rgba(250,173,20,0.35)', border: '#faad14', lineWidth: 2 },
  '待明确建设方案':   { fill: 'rgba(255,77,79,0.30)', border: '#ff4d4f', lineWidth: 2 },
  '进行中':           { fill: 'rgba(24,144,255,0.12)', border: '#1890ff', lineWidth: 1 },
  '已完成':           { fill: 'rgba(82,196,26,0.15)', border: '#52c41a', lineWidth: 1.5 },
};

const OptimizationGantt: React.FC = () => {
  const navigate = useNavigate();
  const { items: optimizationData, abbrMap, categories: catList } = useOptimizationStore();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const [viewMode, setViewMode] = useState<string>('deadline');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OptimizationItem | null>(null);

  const categories = useMemo(() => catList.map((c) => c.name), [catList]);

  const filteredData = useMemo(() => {
    if (selectedCategories.length === 0) return optimizationData;
    return optimizationData.filter((i) => selectedCategories.includes(i.category));
  }, [selectedCategories]);

  const stats = useMemo(() => {
    const now = new Date('2026-06-15');
    const total = filteredData.length;
    const overdue = filteredData.filter((i) => i.deadline && new Date(i.deadline) < now).length;
    const urgent = filteredData.filter((i) => {
      if (!i.deadline) return false;
      const d = new Date(i.deadline);
      return d >= now && d <= new Date('2026-07-15');
    }).length;
    return { total, overdue, urgent };
  }, [filteredData]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstanceRef.current) chartInstanceRef.current.dispose();

    const chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });
    chartInstanceRef.current = chart;

    const baseDate = new Date('2026-06-01');
    const maxDate = new Date('2026-11-01');
    const todayDate = new Date('2026-06-15');
    const baseTime = baseDate.getTime();
    const maxTime = maxDate.getTime();
    const todayTime = todayDate.getTime();

    const sorted = [...filteredData].sort((a, b) => {
      if (viewMode === 'category') {
        const catCmp = a.category.localeCompare(b.category);
        if (catCmp !== 0) return catCmp;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    // 动态构建分类映射：所有出现过的分类 + abbrMap 中的分类
    const allCats = [...new Set([...sorted.map((i) => i.category), ...Object.keys(abbrMap)])];
    const catMeta: Record<string, { key: string; abbr: string; color: string }> = {};
    const richStyles: Record<string, Record<string, unknown>> = {};
    allCats.forEach((cat, idx) => {
      const key = `cat${idx + 1}`;
      const color = catColorMap[cat]?.hex || '#1890ff';
      catMeta[cat] = { key, abbr: abbrMap[cat] || cat.slice(0, 1), color };
      richStyles[key] = { color, fontWeight: 'bold', fontSize: 12 };
    });

    const taskNames = sorted.map(
      (item) => {
        const title = item.title.length > 22 ? item.title.slice(0, 22) + '…' : item.title;
        const m = catMeta[item.category] || { key: 'cat1', abbr: '?', color: '#999' };
        const issued = item.isIssued ? '{issued|建}' : '';
        return `${issued} {${m.key}|${m.abbr}} ${title}`;
      }
    );

    const seriesData = sorted.map((item, index) => {
      const startTime = baseTime;
      const endTime = item.deadline ? new Date(item.deadline).getTime() : maxTime;
      return { name: item.title, value: [index, startTime, endTime, item] };
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'item',
        confine: true,
        backgroundColor: '#fff',
        borderColor: '#e8e8e8',
        borderWidth: 1,
        borderRadius: 8,
        padding: 0,
        extraCssText: 'max-width: 360px; white-space: normal; word-break: break-word; box-shadow: 0 4px 16px rgba(0,0,0,0.12);',
        textStyle: { color: '#333', fontSize: 13 },
        formatter: (params: unknown) => {
          const p = params as { data?: { value?: unknown[] } };
          if (!p.data?.value) return '';
          const item = p.data.value[3] as OptimizationItem;
          const cm = catColorMap[item.category] || catColorMap['城区端'];
          const statusTag = item.status
            ? `<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;white-space:nowrap;background:${
                item.status === '待建设' ? '#fff7e6' : '#fff2f0'
              };color:${
                item.status === '待建设' ? '#d48806' : '#cf1322'
              }">${item.status}</span>`
            : '';
          return `
            <div style="padding:12px 14px;word-wrap:break-word;overflow-wrap:break-word;word-break:break-word">
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:8px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${cm.hex};flex-shrink:0;margin-top:2px"></span>
                <b style="font-size:14px;color:${cm.dark};white-space:nowrap">${item.category}</b>
                ${statusTag}
                ${item.isIssued ? '<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;background:#fff7e6;color:#d48806;white-space:nowrap">建委下达</span>' : ''}
              </div>
              <div style="font-size:13px;margin-bottom:6px;line-height:1.55;color:#222;word-break:break-word">${item.title}</div>
              ${item.description ? `<div style="font-size:12px;color:#666;margin-bottom:8px;line-height:1.5;border-left:2px solid ${cm.hex};padding:4px 0 4px 8px;background:#fafafa;border-radius:0 4px 4px 0;word-break:break-word">${item.description.length > 150 ? item.description.slice(0, 150) + '…' : item.description}</div>` : ''}
              <div style="font-size:12px;color:#333;padding-top:6px;border-top:1px dashed #e8e8e8;display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                <span style="white-space:nowrap">⏰ 截止：</span>
                <b style="color:${item.deadline ? cm.dark : '#999'};white-space:nowrap">${item.deadline || '未设定'}</b>
              </div>
              ${item.todo ? `<div style="font-size:11px;color:#fa8c16;margin-top:6px;padding:4px 8px;background:#fffbe6;border-radius:4px;line-height:1.5;word-break:break-word">📌 ${item.todo.length > 150 ? item.todo.slice(0, 150) + '…' : item.todo}</div>` : ''}
            </div>
          `;
        },
      },
      grid: {
        left: 200,
        right: 100,
        top: 60,
        bottom: 40,
        containLabel: false,
      },
      xAxis: {
        type: 'time',
        position: 'top',
        min: baseTime,
        max: maxTime,
        axisLabel: {
          formatter: (value: number) => {
            const d = new Date(value);
            return `${d.getMonth() + 1}月${d.getDate()}日`;
          },
          fontSize: 11,
          color: '#666',
        },
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisTick: { show: false },
        splitLine: {
          show: true,
          lineStyle: { color: '#f0f0f0', type: 'dashed' },
        },
      },
      yAxis: {
        type: 'category',
        data: taskNames,
        axisLabel: {
          fontSize: 11,
          width: 185,
          overflow: 'truncate',
          rich: {
            issued: {
              color: '#fff',
              backgroundColor: '#d46b08',
              fontWeight: 'bold',
              padding: [1, 4],
              borderRadius: 2,
              fontSize: 10,
            },
            ...richStyles,
          },
        },
        axisLine: { lineStyle: { color: '#d9d9d9' } },
        axisTick: { show: false },
        inverse: true,
      },
      series: [
        {
          type: 'custom',
          renderItem: (_params: unknown, api: { value: (n: number) => unknown; coord: (p: [number, number]) => [number, number]; size: (p: [number, number]) => [number, number] }) => {
            const categoryIndex = api.value(0) as number;
            const startVal = api.value(1) as number;
            const endVal = api.value(2) as number;
            const item = api.value(3) as OptimizationItem;

            const start = api.coord([startVal, categoryIndex]);
            const end = api.coord([endVal, categoryIndex]);
            const rowHeight = (api.size([0, 1])[1] as number);
            const barHeight = rowHeight * 0.48;

            const cm = catColorMap[item.category] || catColorMap['城区端'];
            const st = item.status ? statusStyle[item.status] : null;

            // 条颜色：有状态用状态色，否则用分类色
            const fillColor = st ? st.fill : cm.rgba;
            const strokeColor = st ? st.border : cm.hex;
            const strokeWidth = st ? st.lineWidth : 1;
            const barWidth = Math.max(end[0] - start[0], 4);

            const children: Array<Record<string, unknown>> = [
              // 主甘特条
              {
                type: 'rect',
                shape: {
                  x: start[0],
                  y: end[1] - barHeight / 2,
                  width: barWidth,
                  height: barHeight,
                  r: 3,
                },
                style: {
                  fill: fillColor,
                  stroke: strokeColor,
                  lineWidth: strokeWidth,
                  shadowBlur: st ? 6 : 3,
                  shadowColor: st ? strokeColor : 'rgba(0,0,0,0.08)',
                  shadowOffsetY: 1,
                },
              },
            ];

            // 条右侧完成时间标注
            // (改用独立 scatter 系列渲染标签)
            if (item.deadline) {
              // 保留一个不可见的短竖线标记
              children.push({
                type: 'rect',
                silent: true,
                shape: { x: end[0] - 1, y: end[1] - barHeight / 2 - 1, width: 2, height: barHeight + 2 },
                style: { fill: strokeColor, opacity: 0.5 },
              } as Record<string, unknown>);
            } else {
              // 无截止日期：右端用虚线三角形表示无限延伸
              const cx = end[0];
              const cy = end[1];
              children.push({
                type: 'polygon',
                shape: {
                  points: [
                    [cx - 4, cy - 5],
                    [cx + 4, cy],
                    [cx - 4, cy + 5],
                  ],
                },
                style: {
                  fill: '#d9d9d9',
                  stroke: '#d9d9d9',
                  lineWidth: 0.5,
                },
              });
            }

            return { type: 'group', children };
          },
          data: seriesData,
          encode: { x: [1, 2], y: 0 },
          // "今天"参考线
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                xAxis: todayTime,
                lineStyle: { color: '#ff4d4f', type: 'dashed' as const, width: 1.5 },
                label: { show: true, formatter: '今天 6/15', fontSize: 11, color: '#ff4d4f', position: 'start' as const },
              },
            ],
          },
        },
        // 截止日期标签（隐藏散点 + 标签）
        {
          type: 'scatter',
          symbolSize: 0,
          silent: true,
          data: sorted
            .filter((item) => item.deadline !== '')
            .map((item) => {
              const idx = sorted.indexOf(item);
              return {
                value: [new Date(item.deadline).getTime(), idx, item.deadline.slice(5), catColorMap[item.category]?.hex || '#666'],
              };
            }),
          label: {
            show: true,
            formatter: (p: unknown) => (p as { value: unknown[] }).value?.[2] as string,
            position: 'right',
            distance: 6,
            fontSize: 10,
            fontWeight: 'bold',
            color: '#555',
          },
          z: 10,
        },
      ],
      dataZoom: [{
        type: 'slider',
        start: 0, end: 100,
        height: 20, bottom: 8,
        borderColor: '#d9d9d9',
        backgroundColor: '#fafafa',
        fillerColor: 'rgba(24,144,255,0.1)',
        handleStyle: { color: '#1890ff' },
        textStyle: { fontSize: 10 },
      }],
    };

    chart.setOption(option);

    // 点击甘特条打开详情抽屉
    chart.off('click');
    chart.on('click', (params: unknown) => {
      const p = params as { data?: { value?: unknown[] } };
      if (p.data?.value) {
        const item = p.data.value[3] as OptimizationItem;
        setSelectedItem(item);
        setDrawerOpen(true);
      }
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [filteredData, viewMode]);

  return (
    <div style={{ padding: '16px', minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>📊 项目甘特图</Typography.Title>
        <Button type="primary" icon={<UnorderedListOutlined />} onClick={() => navigate('/optimization/list')}>
          查看列表
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
            <div style={{ fontSize: 14, color: '#999' }}>总需求数</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
            <div style={{ fontSize: 14, color: '#999' }}>即将截止（30天内）</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fa8c16' }}>{stats.urgent}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ textAlign: 'center', background: '#fff2f0' }}>
            <div style={{ fontSize: 14, color: '#999' }}>已逾期</div>
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#ff4d4f' }}>{stats.overdue}</div>
          </Card>
        </Col>
      </Row>

      {/* 筛选区 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={14}>
            <Space wrap>
              <Text strong style={{ fontSize: 13 }}>大项筛选：</Text>
              <Select
                mode="multiple"
                placeholder="全部大项"
                value={selectedCategories}
                onChange={setSelectedCategories}
                allowClear
                style={{ minWidth: 280 }}
                maxTagCount={3}
                options={categories.map((c) => ({
                  label: (
                    <Space size={4}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: catColorMap[c]?.hex }} />
                      {c}
                    </Space>
                  ),
                  value: c,
                }))}
              />
            </Space>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: 'right' }}>
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as string)}
              options={[
                { label: '按大项分组', value: 'category' },
                { label: '按截止时间', value: 'deadline' },
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* 甘特图主体 + 内嵌图例 */}
      <Card
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <CalendarOutlined />
            <span>项目甘特图</span>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
              2026年6月 — 10月 ｜ 条右侧=完成时限 ｜ 红色虚线=今天
            </Text>
          </Space>
        }
      >
        {/* 图例：分类颜色 */}
        <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: '6px 16px', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
          {Object.entries(catColorMap).map(([cat, c]) => (
            <span key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#666' }}>
              <span style={{ display: 'inline-block', width: 28, height: 10, borderRadius: 2, background: c.hex }} />
              {cat}
            </span>
          ))}
          <span style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#666', borderLeft: '1px solid #e8e8e8', paddingLeft: 12 }}>
            <span style={{ display: 'inline-block', width: 28, height: 10, borderRadius: 2, background: '#faad14', border: '2px solid #faad14' }} />
            待建设
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#666' }}>
            <span style={{ display: 'inline-block', width: 28, height: 10, borderRadius: 2, background: '#ff4d4f', border: '2px solid #ff4d4f' }} />
            待明确方案
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#666' }}>
            <span style={{ display: 'inline-block', width: 28, height: 10, borderRadius: 2, background: '#1890ff', border: '1px solid #1890ff' }} />
            进行中
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#666' }}>
            <span style={{ display: 'inline-block', width: 28, height: 10, borderRadius: 2, background: '#52c41a', border: '1.5px solid #52c41a' }} />
            已完成
          </span>
        </div>
        <div ref={chartRef} style={{ width: '100%', height: 620 }} />
      </Card>

      {/* 底部说明 */}
      <Card size="small" style={{ background: '#fafafa' }}>
        <Row gutter={[24, 8]}>
          <Col xs={24} sm={8}>
            <Space size={4}>
              <Text style={{ fontSize: 12, color: '#1890ff', fontWeight: 'bold' }}>06-20</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>条右侧文字 = 完成时限（月-日）</Text>
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space size={4}>
              <span style={{ display: 'inline-block', width: 20, height: 1, borderTop: '2px dashed #ff4d4f' }} />
              <Text style={{ fontSize: 12, color: '#666' }}>红色虚线 = 今天（6月15日）</Text>
            </Space>
          </Col>
          <Col xs={24} sm={8}>
            <Space size={4}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', background: '#d46b08', color: '#fff', padding: '0 4px', borderRadius: 2 }}>建</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>橙标 = 建委下达</Text>
              <Text style={{ fontSize: 12, color: '#1890ff', fontWeight: 'bold', marginLeft: 8 }}>城</Text>
              <Text style={{ fontSize: 12, color: '#666' }}>分类缩写</Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title={
          selectedItem ? (
            <Space size={8}>
              <span style={{ display:'inline-block',width:10,height:10,borderRadius:2,background:catColorMap[selectedItem.category]?.hex }} />
              <span style={{ fontSize:15, color:catColorMap[selectedItem.category]?.dark }}>{selectedItem.category}</span>
            </Space>
          ) : '任务详情'
        }
        placement="right"
        width={520}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedItem(null); }}
        styles={{ header: { borderBottom:'1px solid #f0f0f0' }, body: { padding:'20px 24px' } }}
      >
        {selectedItem && (
          <div style={{ wordBreak:'break-word' }}>
            {/* 标题区 */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:17, fontWeight:600, color:'#1a1a1a', lineHeight:1.5, marginBottom:10 }}>
                {selectedItem.title}
              </div>
              <Space size={8} wrap>
                {selectedItem.status && (
                  <Tag
                    color={selectedItem.status === '待建设' ? 'warning' : 'error'}
                    icon={selectedItem.status === '待建设' ? <ClockCircleOutlined /> : <ExclamationCircleOutlined />}
                    style={{ fontSize:12, padding:'1px 8px' }}
                  >
                    {selectedItem.status}
                  </Tag>
                )}
                {selectedItem.isIssued && (
                  <Tag color="orange" style={{ fontSize:12 }}>建委下达</Tag>
                )}
                <Tag
                  icon={selectedItem.deadline ? <ClockCircleOutlined /> : <CloseCircleOutlined />}
                  color={selectedItem.deadline ? 'blue' : 'default'}
                  style={{ fontSize:12 }}
                >
                  {selectedItem.deadline ? `截止 ${selectedItem.deadline}` : '无截止日期'}
                </Tag>
              </Space>
            </div>

            <Divider style={{ margin:'0 0 16px 0' }} />

            {/* 基本信息 */}
            <Descriptions
              column={1}
              size="small"
              colon={false}
              labelStyle={{ color:'#999', fontSize:12, width:80 }}
              contentStyle={{ color:'#333', fontSize:13 }}
            >
              <Descriptions.Item label={<><AimOutlined /> 大项</>}>
                <Tag color="blue">{selectedItem.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<><ClockCircleOutlined /> 完成时限</>}>
                <span style={{ fontWeight:600, color: selectedItem.deadline ? catColorMap[selectedItem.category]?.dark : '#999' }}>
                  {selectedItem.deadline || '未设定'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label={<><CheckCircleOutlined /> 建设状态</>}>
                {selectedItem.status ? (
                  <Tag color={selectedItem.status === '待建设' ? 'warning' : 'error'}>{selectedItem.status}</Tag>
                ) : (
                  <Tag>未设定</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={<><ExclamationCircleOutlined /> 建委下达</>}>
                <Tag color={selectedItem.isIssued ? 'orange' : 'default'}>
                  {selectedItem.isIssued ? '是' : '否'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* 背景和目的说明 */}
            {selectedItem.description && (
              <>
                <Divider style={{ margin:'16px 0' }} />
                <div style={{ marginBottom:16 }}>
                  <Text type="secondary" style={{ fontSize:12, marginBottom:8, display:'block' }}>
                    <FileTextOutlined /> 背景和目的说明
                  </Text>
                  <div style={{
                    fontSize:13,
                    color:'#555',
                    lineHeight:1.7,
                    background: catColorMap[selectedItem.category]?.rgba || '#f5f5f5',
                    padding:'12px 14px',
                    borderRadius:6,
                    borderLeft: `3px solid ${catColorMap[selectedItem.category]?.hex || '#1890ff'}`,
                    whiteSpace:'pre-wrap',
                  }}>
                    {selectedItem.description}
                  </div>
                </div>
              </>
            )}

            {/* 待办事项 */}
            {selectedItem.todo && (
              <>
                <Divider style={{ margin:'16px 0' }} />
                <div>
                  <Text type="secondary" style={{ fontSize:12, marginBottom:8, display:'block' }}>
                    <SyncOutlined /> 待办事项
                  </Text>
                  <div style={{
                    fontSize:13,
                    color:'#d48806',
                    lineHeight:1.7,
                    background:'#fffbe6',
                    padding:'12px 14px',
                    borderRadius:6,
                    border:'1px solid #ffe58f',
                    whiteSpace:'pre-wrap',
                  }}>
                    {selectedItem.todo}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default OptimizationGantt;
