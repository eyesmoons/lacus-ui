import request from '@/utils/request';

// 虚拟数据源下新增虚拟数据库
export function createDb(data) {
    return request({
        url: '/metadata/virtual/db',
        method: 'post',
        data,
    });
}

// 虚拟数据库下新增虚拟表
export function createTable(data) {
    return request({
        url: '/metadata/virtual/table',
        method: 'post',
        data,
    });
}

// 虚拟表下新增虚拟字段
export function createColumn(data) {
    return request({
        url: '/metadata/virtual/column',
        method: 'post',
        data,
    });
}

// 虚拟表下批量新增虚拟字段(字段名/类型/备注/是否为空/字符串长度)
export function createColumnsBatch(data) {
    return request({
        url: '/metadata/virtual/column/batch',
        method: 'post',
        data,
    });
}

// 编辑虚拟数据库
export function updateDb(dbId, data) {
    return request({
        url: `/metadata/virtual/db/${dbId}`,
        method: 'put',
        data,
    });
}

// 编辑虚拟表
export function updateTable(tableId, data) {
    return request({
        url: `/metadata/virtual/table/${tableId}`,
        method: 'put',
        data,
    });
}

// 编辑虚拟字段
export function updateColumn(columnId, data) {
    return request({
        url: `/metadata/virtual/column/${columnId}`,
        method: 'put',
        data,
    });
}

// 删除虚拟数据库(级联删除其下虚拟表/字段)
export function deleteDb(dbId) {
    return request({
        url: `/metadata/virtual/db/${dbId}`,
        method: 'delete',
    });
}

// 删除虚拟表(级联删除其下虚拟字段)
export function deleteTable(tableId) {
    return request({
        url: `/metadata/virtual/table/${tableId}`,
        method: 'delete',
    });
}

// 删除虚拟字段
export function deleteColumn(columnId) {
    return request({
        url: `/metadata/virtual/column/${columnId}`,
        method: 'delete',
    });
}