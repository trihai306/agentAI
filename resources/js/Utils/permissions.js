/**
 * Utility functions for permission and role checking
 */

/**
 * Check if user has a specific permission
 * @param {Object} user - User object with roles and permissions
 * @param {string} permissionSlug - Permission slug to check
 * @returns {boolean}
 */
export function hasPermission(user, permissionSlug) {
    if (!user || !user.roles) return false;

    return user.roles.some(role =>
        role.permissions && role.permissions.some(perm => perm.slug === permissionSlug)
    );
}

/**
 * Check if user has any of the given permissions
 * @param {Object} user - User object with roles and permissions
 * @param {string[]} permissionSlugs - Array of permission slugs to check
 * @returns {boolean}
 */
export function hasAnyPermission(user, permissionSlugs) {
    if (!user || !user.roles || !permissionSlugs || permissionSlugs.length === 0) return false;

    return permissionSlugs.some(slug => hasPermission(user, slug));
}

/**
 * Check if user has all of the given permissions
 * @param {Object} user - User object with roles and permissions
 * @param {string[]} permissionSlugs - Array of permission slugs to check
 * @returns {boolean}
 */
export function hasAllPermissions(user, permissionSlugs) {
    if (!user || !user.roles || !permissionSlugs || permissionSlugs.length === 0) return false;

    return permissionSlugs.every(slug => hasPermission(user, slug));
}

/**
 * Check if user has a specific role
 * @param {Object} user - User object with roles
 * @param {string} roleSlug - Role slug to check
 * @returns {boolean}
 */
export function hasRole(user, roleSlug) {
    if (!user || !user.roles) return false;

    return user.roles.some(role => role.slug === roleSlug);
}

/**
 * Check if user has any of the given roles
 * @param {Object} user - User object with roles
 * @param {string[]} roleSlugs - Array of role slugs to check
 * @returns {boolean}
 */
export function hasAnyRole(user, roleSlugs) {
    if (!user || !user.roles || !roleSlugs || roleSlugs.length === 0) return false;

    return roleSlugs.some(slug => hasRole(user, slug));
}

/**
 * Check if user is admin
 * @param {Object} user - User object with roles
 * @returns {boolean}
 */
export function isAdmin(user) {
    return hasRole(user, 'admin');
}

