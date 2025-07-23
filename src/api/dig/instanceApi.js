import request from '@/utils/request';

/**
 * 获取实例列表
 * @param {Object} params - 查询参数
 */
export function getInstanceList(params) {
    return request({
        url: '/st/job/instance/list',
        method: 'get',
        params
    });
}

/**
 * 获取实例详情
 * @param {number} instanceId - 实例ID
 */
export function getInstanceDetail(instanceId) {
    return request({
        url: `/st/job/instance/${instanceId}`,
        method: 'get'
    });
}

/**
 * 停止实例
 * @param {number} instanceId - 实例ID
 */
export function stopInstance(instanceId) {
    return request({
        url: `/st/job/instance/stop/${instanceId}`,
        method: 'post'
    });
}

/**
 * 重启实例
 * @param {number} instanceId - 实例ID
 */
export function restartInstance(instanceId) {
    return request({
        url: `/st/job/instance/restart/${instanceId}`,
        method: 'post'
    });
}

/**
 * 删除实例
 * @param {number} instanceId - 实例ID
 */
export function deleteInstance(instanceId) {
    return request({
        url: `/st/job/instance/${instanceId}`,
        method: 'delete'
    });
}

/**
 * 获取实例状态
 * @param {number} instanceId - 实例ID
 */
export function getInstanceStatus(instanceId) {
    return request({
        url: `/st/job/instance/status/${instanceId}`,
        method: 'get'
    });
}

/**
 * 获取实例日志
 * @param {number} instanceId - 实例ID
 */
export function getInstanceLogs(instanceId) {
    return request({
        url: `/st/job/instance/logs/${instanceId}`,
        method: 'get'
    });
}

/**
 * 获取实例监控指标
 * @param {number} instanceId - 实例ID
 */
export function getInstanceMetrics(instanceId) {
    return request({
        url: `/st/job/instance/metrics/${instanceId}`,
        method: 'get'
    });
}

/**
 * 获取作业的所有实例
 * @param {number} jobId - 作业ID
 */
export function getJobInstances(jobId) {
    return request({
        url: `/st/job/instance/job/${jobId}`,
        method: 'get'
    });
}

/**
 * 批量停止实例
 * @param {Array} instanceIds - 实例ID列表
 */
export function batchStopInstances(instanceIds) {
    return request({
        url: '/st/job/instance/batch/stop',
        method: 'post',
        data: instanceIds
    });
}

/**
 * 批量删除实例
 * @param {Array} instanceIds - 实例ID列表
 */
export function batchDeleteInstances(instanceIds) {
    return request({
        url: '/st/job/instance/batch/delete',
        method: 'post',
        data: instanceIds
    });
}
