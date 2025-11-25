// Simple route helper function
// Maps route names to their paths
const routes = {
    'admin.users.index': '/admin/users',
    'admin.users.store': '/admin/users',
    'admin.users.update': (id) => `/admin/users/${id}`,
    'admin.users.destroy': (id) => `/admin/users/${id}`,
    'admin.transactions.index': '/admin/transactions',
    'admin.transactions.show': (id) => `/admin/transactions/${id}`,
    'admin.transactions.approve': (id) => `/admin/transactions/${id}/approve`,
    'admin.transactions.reject': (id) => `/admin/transactions/${id}/reject`,
    'admin.withdrawals.index': '/admin/withdrawals',
    'admin.withdrawals.settings': '/admin/withdrawals/settings',
    'admin.withdrawals.settings.update': '/admin/withdrawals/settings',
    'admin.withdrawals.approve': (id) => `/admin/withdrawals/${id}/approve`,
    'admin.withdrawals.reject': (id) => `/admin/withdrawals/${id}/reject`,
    'admin.packages.index': '/admin/packages',
    'admin.packages.store': '/admin/packages',
    'admin.packages.update': (id) => `/admin/packages/${id}`,
    'admin.packages.destroy': (id) => `/admin/packages/${id}`,
    'admin.sessions.index': '/admin/sessions',
    'admin.sessions.show': (id) => `/admin/sessions/${id}`,
    'admin.sessions.destroy': (id) => `/admin/sessions/${id}`,
    'admin.messages.index': '/admin/messages',
    'admin.messages.show': (id) => `/admin/messages/${id}`,
    'admin.messages.destroy': (id) => `/admin/messages/${id}`,
    'admin.roles.index': '/admin/roles',
    'admin.roles.create': '/admin/roles/create',
    'admin.roles.store': '/admin/roles',
    'admin.roles.edit': (id) => `/admin/roles/${id}/edit`,
    'admin.roles.update': (id) => `/admin/roles/${id}`,
    'admin.roles.destroy': (id) => `/admin/roles/${id}`,
    'admin.permissions.index': '/admin/permissions',
    'admin.permissions.store': '/admin/permissions',
    'admin.permissions.update': (id) => `/admin/permissions/${id}`,
    'admin.permissions.destroy': (id) => `/admin/permissions/${id}`,
    'admin.devices.index': '/admin/devices',
    'admin.devices.create': '/admin/devices/create',
    'admin.devices.store': '/admin/devices',
    'admin.devices.show': (id) => `/admin/devices/${id}`,
    'admin.devices.edit': (id) => `/admin/devices/${id}/edit`,
    'admin.devices.update': (id) => `/admin/devices/${id}`,
    'admin.devices.destroy': (id) => `/admin/devices/${id}`,
    'admin.devices.sync': '/admin/devices/sync',
    'admin.devices.toggle-active': (id) => `/admin/devices/${id}/toggle-active`,
    // User routes
    'dashboard': '/dashboard',
    'transactions.index': '/transactions',
    'transactions.show': (id) => `/transactions/${id}`,
    'transactions.export': '/transactions/export',
    'devices.index': '/devices',
    'devices.create': '/devices/create',
    'devices.store': '/devices',
    'devices.show': (id) => `/devices/${id}`,
    'devices.edit': (id) => `/devices/${id}/edit`,
    'devices.update': (id) => `/devices/${id}`,
    'devices.destroy': (id) => `/devices/${id}`,
    'devices.toggle-active': (id) => `/devices/${id}/toggle-active`,
    'wallet.show': '/wallet',
    'wallet.deposit': '/wallet/deposit',
    'wallet.deposit.process': '/wallet/deposit',
    'wallet.withdraw': '/wallet/withdraw',
    'wallet.withdraw.process': '/wallet/withdraw',
    'wallet.history': '/wallet/history',
    'packages.index': '/packages',
    'packages.purchase': (id) => `/packages/${id}/purchase`,
    'packages.my-packages': '/packages/my-packages',
    // Workflow routes
    'workflows.index': '/workflows',
    'workflows.store': '/api/workflows',
    'workflows.show': (id) => `/workflows/${id}`,
    'workflows.update': (id) => `/api/workflows/${id}`,
    'workflows.destroy': (id) => `/api/workflows/${id}`,
    'workflows.duplicate': (id) => `/workflows/${id}/duplicate`,
    'workflows.mark-used': (id) => `/workflows/${id}/mark-used`,
    'workflows.public': '/api/workflows/public',
    // Chat routes
    'chat.index': '/chat',
    // User Data routes
    'user.data.index': '/data',
    'user.data.create': '/data/create',
    'user.data.store': '/data',
    'user.data.show': (id) => `/data/${id}`,
    'user.data.edit': (id) => `/data/${id}/edit`,
    'user.data.update': (id) => `/data/${id}`,
    'user.data.destroy': (id) => `/data/${id}`,
    'user.data.duplicate': (id) => `/data/${id}/duplicate`,
    'user.data.statistics': '/data/statistics',
    'user.data.export.json': (id) => `/data/${id}/export/json`,
    'user.data.export.csv': (id) => `/data/${id}/export/csv`,
    'user.data.import.json': '/data/import/json',
    'user.data.import.csv': '/data/import/csv',
    'user.data.items.store': (collectionId) => `/data/${collectionId}/items`,
    'user.data.items.update': (itemId) => `/data/items/${itemId}`,
    'user.data.items.destroy': (itemId) => `/data/items/${itemId}`,
    'user.data.items.bulk-import': (collectionId) => `/data/${collectionId}/items/bulk-import`,
    'user.data.items.bulk-delete': (collectionId) => `/data/${collectionId}/items/bulk-delete`,
    'user.data.items.reorder': (collectionId) => `/data/${collectionId}/items/reorder`,
    'user.data.items.statistics': (collectionId) => `/data/${collectionId}/items/statistics`,
};

export default function route(name, ...params) {
    const routePath = routes[name];

    if (!routePath) {
        console.warn(`Route "${name}" not found`);
        return '#';
    }

    if (typeof routePath === 'function') {
        return routePath(...params);
    }

    return routePath;
}

