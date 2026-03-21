import request from '@/utils/request';

/**
 * 提交执行任务
 * @param {number} ruleId - 规则ID
 * @returns {Promise<number>} logId
 */
export function submitTask(ruleId) {
  return request({
    url: `/dq/task/submit/${ruleId}`,
    method: 'post',
  });
}

/**
 * 查询任务执行状态
 * @param {number} logId - 执行记录ID
 */
export function getTaskStatus(logId) {
  return request({
    url: `/dq/task/status/${logId}`,
    method: 'get',
  });
}

/**
 * 停止任务
 * @param {number} logId - 执行记录ID
 */
export function stopTask(logId) {
  return request({
    url: `/dq/task/stop/${logId}`,
    method: 'post',
  });
}
