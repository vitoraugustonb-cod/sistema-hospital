import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-hospital-slate">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hospital-navy"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.cargo)) {
    // Redireciona para o dashboard padrão do cargo dele se tentar acessar algo não autorizado
    const roleRoutes: Record<string, string> = {
      'TI': '/admin',
      'Medico': '/medico',
      'Enfermeiro': '/enfermeiro',
      'Tecnico': '/tecnico',
      'Recepcao': '/recepcao'
    };
    return <Navigate to={roleRoutes[user.cargo] || '/login'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
