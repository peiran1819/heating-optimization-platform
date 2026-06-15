import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Spin } from 'antd';
import { useOptimizationStore } from '@/store/optimizationStore';
import Home from '@/pages/Home';
import UserManagement from '@/pages/system/UserManagement';
import RoleManagement from '@/pages/system/RoleManagement';
import PermissionManagement from '@/pages/system/PermissionManagement';
import OptimizationList from '@/pages/optimization/OptimizationList';
import OptimizationGantt from '@/pages/optimization/OptimizationGantt';

const App: React.FC = () => {
  const { load, loading } = useOptimizationStore();

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载数据中..." />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f5f5f5' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/optimization/list" element={<OptimizationList />} />
        <Route path="/optimization/gantt" element={<OptimizationGantt />} />
        <Route path="/system/users" element={<UserManagement />} />
        <Route path="/system/roles" element={<RoleManagement />} />
        <Route path="/system/permissions" element={<PermissionManagement />} />
      </Routes>
    </div>
  );
};

export default App;
