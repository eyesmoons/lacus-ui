import request from '@/utils/request';

/**
 * 查询执行记录列表（分页）
 * @param {Object} params - 查询参数：ruleName/status/startTimeBegin/startTimeEnd/pageNum/pageSize
 */
export function getResultList(params) {
  return request({
    url: '/dq/result/list',
    method: 'get',
    params,
  });
}

/**
 * 查询检测结果明细（按执行记录ID）
 * @param {number} logId - 执行记录ID
 */
export function getCheckResultList(logId) {
  return request({
    url: `/dq/check-result/list/${logId}`,
    method: 'get',
  });
}
