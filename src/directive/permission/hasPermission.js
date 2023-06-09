/**
 * v-hasPermission 操作权限处理
 * Copyright (c) 2019 lacus
 */

import store from '@/store';

export default {
    mounted(el, binding, vnode) {
        const {value} = binding;
        const allPermissions = '*:*:*';
        const currentPermissions = store.getters && store.getters.permissions;

        if (value && value instanceof Array && value.length > 0) {
            const permissionFlag = value;

            const hasPermissions = currentPermissions.some(
                (permission) => allPermissions === permission || permissionFlag.includes(permission),
            );

            if (!hasPermissions) {
                el.parentNode && el.parentNode.removeChild(el);
            }
        } else {
            throw new Error('请设置操作权限标签值');
        }
    },
};
