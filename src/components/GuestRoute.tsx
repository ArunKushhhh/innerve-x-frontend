import { Navigate } from "react-router-dom";
import { useUser } from "@/context/UserProvider";

interface GuestRouteProps {
    children: React.ReactNode;
}

/**
 * GuestRoute protects routes that should only be accessible to non-logged-in users.
 * If a user is logged in, they are redirected to their role-specific dashboard.
 */
const GuestRoute = ({ children }: GuestRouteProps) => {
    const { user, isLoading } = useUser();

    // Show nothing while loading to prevent flash of wrong content
    if (isLoading) {
        return null;
    }

    // If user is logged in, redirect to their dashboard
    if (user) {
        return <Navigate to={`/${user.role}/dashboard`} replace />;
    }

    // User is not logged in, allow access to guest route
    return <>{children}</>;
};

export default GuestRoute;
