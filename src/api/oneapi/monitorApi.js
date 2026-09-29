import request from '@/utils/request';

// 监控概览：按时间区间/数据源/状态聚合各接口健康度
export function getMonitorOverview(params) {
  return request({
    url: '/one/api/monitor/overview',
    method: 'get',
    params,
  });
}
