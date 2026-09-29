import request from '@/utils/request';

/**
 * 查询任务实例列表
 * @param {Object} params
 * @param {number} params.pageNum
 * @param {number} params.pageSize
 * @param {number} [params.jobId]
 * @param {string} [params.instanceName]
 */
export function getInstanceList(params) {
  return request({
    url: '/st/job/instance/list',
    method: 'get',
    params,
  });
}

/**
 * 查询任务实例详情
 * @param {number} instanceId
 */
export function getInstanceDetail(instanceId) {
  return request({
    url: `/st/job/instance/${instanceId}`,
    method: 'get',
  });
}
