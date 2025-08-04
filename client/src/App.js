import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import EpiTypes from './pages/EpiTypes';
import Checklists from './pages/Checklists';
import Executions from './pages/Executions';
import Anomalies from './pages/Anomalies';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import LoadingSpinner from './components/LoadingSpinner';

// Componente para rotas protegidas
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Routes>
        {/* Rota pública */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        
        {/* Rotas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route 
            path="users" 
            element={
              <ProtectedRoute allowedRoles={['safety_technician', 'admin']}>
                <Users />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="epi-types" 
            element={
              <ProtectedRoute allowedRoles={['safety_technician', 'admin']}>
                <EpiTypes />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="checklists" 
            element={
              <ProtectedRoute allowedRoles={['safety_technician', 'admin']}>
                <Checklists />
              </ProtectedRoute>
            } 
          />
          
          <Route path="executions" element={<Executions />} />
          
          <Route 
            path="anomalies" 
            element={
              <ProtectedRoute allowedRoles={['supervisor', 'safety_technician', 'admin']}>
                <Anomalies />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="reports" 
            element={
              <ProtectedRoute allowedRoles={['supervisor', 'safety_technician', 'admin']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App; 