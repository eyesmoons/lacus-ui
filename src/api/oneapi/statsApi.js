import request from '@/utils/request';

// 统计概览：总量/成功率/Top接口
export function getStatsSummary(params) {
  return request({
    url: '/one/api/stats/summary',
    method: 'get',
    params,
  });
}

// 统计趋势：按时间分桶的次数/耗时/错误
export function getStatsTrend(params) {
  return request({
    url: '/one/api/stats/trend',
    method: 'get',
    params,
  });
}
