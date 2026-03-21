import request from '@/utils/request';

/**
 * 查询规则列表（分页）
 * @param {Object} params - 查询参数：ruleName/ruleType/enabled/pageNum/pageSize
 */
export function getRuleList(params) {
  return request({
    url: '/dq/rule/list',
    method: 'get',
    params,
  });
}

/**
 * 新建规则
 * @param {Object} data - 规则数据（含 ruleParams 结构化参数）
 */
export function createRule(data) {
  return request({
    url: '/dq/rule',
    method: 'post',
    data,
  });
}

/**
 * 修改规则
 * @param {Object} data - 规则数据（含 id）
 */
export function updateRule(data) {
  return request({
    url: '/dq/rule',
    method: 'put',
    data,
  });
}

/**
 * 删除规则
 * @param {number} id - 规则ID
 */
export function deleteRule(id) {
  return request({
    url: `/dq/rule/${id}`,
    method: 'delete',
  });
}

/**
 * 获取规则详情
 * @param {number} id - 规则ID
 */
export function getRuleDetail(id) {
  return request({
    url: `/dq/rule/${id}`,
    method: 'get',
  });
}
