import request from '@/utils/request';

// 工作台聚合数据（KPI 总览、趋势、状态分布、近期实例、最近告警、服务器健康）
export function getDashboard(params) {
    return request({
        url: '/monitor/dashboard',
        method: 'get',
        params,
    });
}
