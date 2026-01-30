import { Navigate } from "react-router-dom";
import { useUser } from "@/context/UserProvider";

interface PrivateRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

/**
 * PrivateRoute protects routes that require authentication.
 * It also ensures users can only access routes matching their role.
 */
const PrivateRoute = ({ allowedRoles, children }: PrivateRouteProps) => {
  const { user, isLoading } = useUser();

  // Show nothing while loading to prevent flash of wrong content
  if (isLoading) {
    return null;
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user's role is not in the allowed roles, redirect to their own dashboard
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // User is authenticated and has the correct role
  return <>{children}</>;
};

export default PrivateRoute;
