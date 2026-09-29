import request from '@/utils/request';

// 任务分页列表
export function pageList(query) {
  return request({
    url: '/spark/job',
    method: 'get',
    params: query,
  });
}

// 新建spark sql批任务
export function addBatchSqlJob(data) {
  return request({
    url: '/spark/job/sql/batch',
    method: 'post',
    data,
  });
}

// 编辑spark sql批任务
export function editBatchSqlJob(data) {
  return request({
    url: '/spark/job/sql/batch',
    method: 'put',
    data,
  });
}

// 新建spark jar任务
export function addJarJob(data) {
  return request({
    url: '/spark/job/jar',
    method: 'post',
    data,
  });
}

// 编辑spark jar任务
export function editJarJob(data) {
  return request({
    url: '/spark/job/jar',
    method: 'put',
    data,
  });
}

// 查看任务详情
export function getJobDetail(jobId) {
  return request({
    url: `/spark/job/${jobId}`,
    method: 'get',
  });
}

// 删除任务
export function removeJob(jobId) {
  return request({
    url: `/spark/job/${jobId}`,
    method: 'delete',
  });
}

// 启动任务
export function startJob(jobId) {
  return request({
    url: `/spark/job/start/${jobId}`,
    method: 'get',
  });
}

// 停止任务
export function stopJob(jobId) {
  return request({
    url: `/spark/job/stop/${jobId}`,
    method: 'get',
  });
}

// 上线定时任务
export function onlineJob(jobId) {
  return request({
    url: `/spark/job/online/${jobId}`,
    method: 'get',
  });
}

// 下线定时任务
export function offlineJob(jobId) {
  return request({
    url: `/spark/job/offline/${jobId}`,
    method: 'get',
  });
}
