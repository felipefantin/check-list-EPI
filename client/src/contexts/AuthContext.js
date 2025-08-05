import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

// Como deve ficar (CORRETO ✅)
export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Verificar token ao inicializar
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.user);
        } catch (error) {
          console.error('Erro ao verificar token:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Login
  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Login por matrícula
  const loginEmployee = async (credentials) => {
    try {
      const response = await authAPI.loginEmployee(credentials);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      toast.success('Logout realizado com sucesso!');
    }
  };

  // Renovar token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refresh();
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
      return { success: false };
    }
  };

  // Alterar senha
  const changePassword = async (passwords) => {
    try {
      await authAPI.changePassword(passwords);
      toast.success('Senha alterada com sucesso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Erro ao alterar senha';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Verificar permissões
  const hasPermission = (permission) => {
    if (!user) return false;
    
    const permissions = {
      employee: ['read_own_checklists', 'create_checklist_execution'],
      supervisor: ['read_own_checklists', 'read_team_checklists', 'approve_checklists', 'create_checklist_execution'],
      safety_technician: ['read_all_checklists', 'manage_epi_types', 'manage_checklists', 'generate_reports', 'create_checklist_execution'],
      admin: ['all']
    };
    
    return permissions[user.role]?.includes(permission) || permissions[user.role]?.includes('all') || false;
  };

  // Verificar se pode acessar dados de outro usuário
  const canAccessUserData = (targetUserId) => {
    if (!user || !targetUserId) return false;
    
    if (['admin', 'safety_technician'].includes(user.role)) return true;
    if (user._id === targetUserId) return true;
    
    // Para supervisores, verificar se o usuário está na equipe
    if (user.role === 'supervisor' && user.supervisedEmployees?.includes(targetUserId)) {
      return true;
    }
    
    return false;
  };

  // Verificar se pode acessar dados do departamento
  const canAccessDepartmentData = (targetDepartment) => {
    if (!user || !targetDepartment) return false;
    
    if (['admin', 'safety_technician'].includes(user.role)) return true;
    if (user.department === targetDepartment) return true;
    
    return false;
  };

  const value = {
    user,
    loading,
    token,
    login,
    loginEmployee,
    logout,
    refreshToken,
    changePassword,
    hasPermission,
    canAccessUserData,
    canAccessDepartmentData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 