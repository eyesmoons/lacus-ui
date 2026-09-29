import request from '@/utils/request';

/**
 * 查询数据质量报告聚合数据
 * @param {Object} params - { startTime: 'YYYY-MM-DD HH:mm:ss', endTime: 'YYYY-MM-DD HH:mm:ss' }
 */
export function getReportAggregate(params) {
  return request({
    url: '/dq/report/aggregate',
    method: 'get',
    params,
  });
}
