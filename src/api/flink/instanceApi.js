import request from '@/utils/request';

// 获取任务实例分页列表
export function pageList(query) {
  return request({
    url: '/flink/job/instance/list/paging',
    method: 'get',
    params: query,
  });
}

// 获取任务实例详情
export function getInstanceDetail(instanceId) {
  return request({
    url: `/flink/job/instance/${instanceId}`,
    method: 'get',
  });
}
