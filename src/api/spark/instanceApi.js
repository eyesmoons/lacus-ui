import request from '@/utils/request';

// 实例分页列表
export function pageList(query) {
  return request({
    url: '/spark/job/instance/list/paging',
    method: 'get',
    params: query,
  });
}

// 查看实例详情
export function getInstanceDetail(instanceId) {
  return request({
    url: `/spark/job/instance/${instanceId}`,
    method: 'get',
  });
}
