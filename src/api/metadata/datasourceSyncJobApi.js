import request from '@/utils/request';

/**
 * 创建数据源定时同步任务
 */
export function createSyncJob(datasourceId, data) {
    return request({
        url: `/metadata/datasource/${datasourceId}/syncJob`,
        method: 'post',
        data,
    });
}

/**
 * 查询数据源定时同步任务信息
 */
export function getSyncJobInfo(datasourceId) {
    return request({
        url: `/metadata/datasource/${datasourceId}/syncJob`,
        method: 'get',
    });
}

/**
 * 更新数据源定时同步任务
 */
export function updateSyncJob(datasourceId, data) {
    return request({
        url: `/metadata/datasource/${datasourceId}/syncJob`,
        method: 'put',
        data,
    });
}

/**
 * 删除数据源定时同步任务
 */
export function deleteSyncJob(datasourceId) {
    return request({
        url: `/metadata/datasource/${datasourceId}/syncJob`,
        method: 'delete',
    });
}

/**
 * 查询数据源同步日志
 */
export function getSyncJobLogs(datasourceId, query) {
    return request({
        url: `/metadata/datasource/${datasourceId}/syncLogs`,
        method: 'get',
        params: query,
    });
}
