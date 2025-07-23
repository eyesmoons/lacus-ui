import request from '@/utils/request';

/**
 * 获取作业列表
 * @param {Object} params - 查询参数
 */
export function getJobList(params) {
    return request({
        url: '/st/job/list',
        method: 'get',
        params
    });
}

/**
 * 创建作业
 * @param {Object} data - 作业数据
 */
export function createJob(data) {
    return request({
        url: '/st/job',
        method: 'post',
        data
    });
}

/**
 * 更新作业
 * @param {Object} data - 作业数据
 */
export function updateJob(data) {
    return request({
        url: '/st/job',
        method: 'put',
        data
    });
}

/**
 * 删除作业
 * @param {number} jobId - 作业ID
 */
export function deleteJob(jobId) {
    return request({
        url: `/st/job/${jobId}`,
        method: 'delete'
    });
}

/**
 * 获取作业详情
 * @param {number} jobId - 作业ID
 */
export function getJobDetail(jobId) {
    return request({
        url: `/st/job/${jobId}`,
        method: 'get'
    });
}

/**
 * 执行作业
 * @param {number} jobId - 作业ID
 */
export function executeJob(jobId) {
    return request({
        url: `/st/job/execute/${jobId}`,
        method: 'post'
    });
}

/**
 * 停止作业
 * @param {number} jobId - 作业ID
 */
export function stopJob(jobId) {
    return request({
        url: `/st/job/stop/${jobId}`,
        method: 'post'
    });
}

/**
 * 获取作业状态
 * @param {number} jobId - 作业ID
 */
export function getJobStatus(jobId) {
    return request({
        url: `/st/job/status/${jobId}`,
        method: 'get'
    });
}

/**
 * 验证作业配置
 * @param {Object} data - 作业配置数据
 */
export function validateJobConfig(data) {
    return request({
        url: '/st/job/validate',
        method: 'post',
        data
    });
}

/**
 * 获取作业执行日志
 * @param {number} jobId - 作业ID
 */
export function getJobLogs(jobId) {
    return request({
        url: `/st/job/logs/${jobId}`,
        method: 'get'
    });
}
