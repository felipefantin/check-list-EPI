import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Navegação baseada no papel do usuário
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
      allowedRoles: ['employee', 'supervisor', 'safety_technician', 'admin']
    },
    {
      name: 'Usuários',
      href: '/users',
      icon: 'Users',
      allowedRoles: ['admin', 'safety_technician']
    },
    {
      name: 'Tipos de EPI',
      href: '/epi-types',
      icon: 'Shield',
      allowedRoles: ['admin', 'safety_technician']
    },
    {
      name: 'Checklists',
      href: '/checklists',
      icon: 'ClipboardList',
      allowedRoles: ['admin', 'safety_technician']
    },
    {
      name: 'Execuções',
      href: '/executions',
      icon: 'CheckSquare',
      allowedRoles: ['supervisor', 'safety_technician', 'admin']
    },
    {
      name: 'Anomalias',
      href: '/anomalies',
      icon: 'AlertTriangle',
      allowedRoles: ['supervisor', 'safety_technician', 'admin']
    },
    {
      name: 'Relatórios',
      href: '/reports',
      icon: 'BarChart3',
      allowedRoles: ['supervisor', 'safety_technician', 'admin']
    }
  ];

  // Filtrar navegação baseada no papel do usuário
  const filteredNavigation = navigation.filter(item => 
    item.allowedRoles.includes(user?.role || 'employee')
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        navigation={filteredNavigation}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 