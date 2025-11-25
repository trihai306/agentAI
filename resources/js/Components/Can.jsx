import { usePermission } from '../Hooks/usePermission';

/**
 * Component to conditionally render content based on permissions/roles
 * 
 * @example
 * <Can permission="users.create">
 *   <button>Create User</button>
 * </Can>
 * 
 * @example
 * <Can any={['users.edit', 'users.delete']}>
 *   <button>Edit or Delete</button>
 * </Can>
 * 
 * @example
 * <Can role="admin">
 *   <AdminPanel />
 * </Can>
 */
export default function Can({ 
    children, 
    permission, 
    permissions = [], 
    any = [], 
    all = [],
    role,
    roles = [],
    anyRole = [],
    fallback = null,
    showAdmin = false 
}) {
    const { can, canAny, canAll, hasRole, hasAnyRole, isAdmin: userIsAdmin } = usePermission();

    // Show to admin if showAdmin is true
    if (showAdmin && userIsAdmin()) {
        return <>{children}</>;
    }

    // Check single permission
    if (permission && can(permission)) {
        return <>{children}</>;
    }

    // Check multiple permissions (any)
    if (any.length > 0 && canAny(any)) {
        return <>{children}</>;
    }

    // Check multiple permissions (all)
    if (all.length > 0 && canAll(all)) {
        return <>{children}</>;
    }

    // Check permissions array (any)
    if (permissions.length > 0 && canAny(permissions)) {
        return <>{children}</>;
    }

    // Check single role
    if (role && hasRole(role)) {
        return <>{children}</>;
    }

    // Check multiple roles (any)
    if (anyRole.length > 0 && hasAnyRole(anyRole)) {
        return <>{children}</>;
    }

    // Check roles array (any)
    if (roles.length > 0 && hasAnyRole(roles)) {
        return <>{children}</>;
    }

    // No permission/role matched, show fallback or nothing
    return fallback;
}

