import request from '@/utils/request';

// 调用历史分页
export function listCallHistory(query) {
  return request({
    url: '/one/api/history/paging',
    method: 'get',
    params: query,
  });
}

// 单次调用详情
export function getCallDetail(callId) {
  return request({
    url: `/one/api/history/${callId}`,
    method: 'get',
  });
}
