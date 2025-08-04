import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';

const Sidebar = ({ navigation, userNavigation, currentPath, onNavigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onNavigate) onNavigate();
  };

  return (
    <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4 py-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">EPI</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Checklist EPI</h1>
            <p className="text-sm text-gray-500">Sistema de Gestão</p>
          </div>
        </div>
      </div>

      {/* Navegação principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 flex-shrink-0 h-5 w-5',
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Informações do usuário */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.replace('_', ' ') || 'Usuário'}
            </p>
          </div>
        </div>
      </div>

      {/* Navegação do usuário */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <nav className="space-y-1">
          {userNavigation.map((item) => {
            if (item.name === 'Sair') {
              return (
                <button
                  key={item.name}
                  onClick={handleLogout}
                  className="group flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  {item.name}
                </button>
              );
            }

            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className="group flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
              >
                <item.icon className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 