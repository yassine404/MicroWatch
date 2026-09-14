import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { user } = useAuth();
  console.log('🔒 ProtectedRoute - user:', user);

  if (!user) {
    console.log('🔴 Aucun utilisateur, redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    console.log('🔴 Rôle non autorisé, redirection vers /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};