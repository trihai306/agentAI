import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';
import { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, isAdmin } from '../Utils/permissions';

/**
 * Custom hook for permission and role checking
 * @returns {Object} Permission checking functions
 */
export function usePermission() {
    const { auth } = usePage().props;
    const user = auth?.user;

    return useMemo(() => ({
        /**
         * Check if current user has a specific permission
         */
        can: (permissionSlug) => hasPermission(user, permissionSlug),

        /**
         * Check if current user has any of the given permissions
         */
        canAny: (permissionSlugs) => hasAnyPermission(user, permissionSlugs),

        /**
         * Check if current user has all of the given permissions
         */
        canAll: (permissionSlugs) => hasAllPermissions(user, permissionSlugs),

        /**
         * Check if current user has a specific role
         */
        hasRole: (roleSlug) => hasRole(user, roleSlug),

        /**
         * Check if current user has any of the given roles
         */
        hasAnyRole: (roleSlugs) => hasAnyRole(user, roleSlugs),

        /**
         * Check if current user is admin
         */
        isAdmin: () => isAdmin(user),

        /**
         * Get current user
         */
        user,
    }), [user]);
}

