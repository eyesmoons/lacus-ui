import request from '@/utils/request';

/**
 * 查询source组件
 * @param {string} status - DOWNLOADED 或 ALL
 */
export function getSourceConnectors(status = 'DOWNLOADED') {
    return request({
        url: '/st/connector/sources',
        method: 'get',
        params: { status }
    });
}

/**
 * 查询transform组件
 */
export function getTransformConnectors() {
    return request({
        url: '/st/connector/transforms',
        method: 'get'
    });
}

/**
 * 查询sink组件
 * @param {string} status - DOWNLOADED 或 ALL
 */
export function getSinkConnectors(status = 'DOWNLOADED') {
    return request({
        url: '/st/connector/sinks',
        method: 'get',
        params: { status }
    });
}

/**
 * 根据组件名称查询动态表单配置
 * @param {string} connectorType - 连接器类型
 * @param {string} connectorName - 连接器名称
 */
export function getConnectorForm(connectorType, connectorName) {
    return request({
        url: '/st/connector/form',
        method: 'get',
        params: {
            connectorType,
            connectorName
        }
    });
}

/**
 * 根据组件名称查询数据源列表
 * @param {string} connectorName - 连接器名称
 */
export function getDatasourceList(connectorName) {
    return request({
        url: '/st/connector/datasources',
        method: 'get',
        params: { connectorName }
    });
}

/**
 * 根据数据源查询数据库列表
 * @param {number} datasourceId - 数据源ID
 */
export function getDatabaseList(datasourceId) {
    return request({
        url: '/st/connector/databases',
        method: 'get',
        params: { datasourceId }
    });
}

/**
 * 根据数据库查询表列表
 * @param {number} datasourceId - 数据源ID
 * @param {string} database - 数据库名称
 */
export function getTableList(datasourceId, database) {
    return request({
        url: '/st/connector/tables',
        method: 'get',
        params: { datasourceId, database }
    });
}

/**
 * 根据表查询字段列表
 * @param {number} datasourceId - 数据源ID
 * @param {string} database - 数据库名称
 * @param {string} tableName - 表名称
 */
export function getTableFields(datasourceId, database, tableName) {
    return request({
        url: '/st/connector/fields',
        method: 'get',
        params: { datasourceId, database, tableName }
    });
}
