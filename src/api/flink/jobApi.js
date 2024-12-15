import request from '@/utils/request';

// 任务分页列表
export function pageList(query) {
  return request({
    url: '/flink/job',
    method: 'get',
    params: query,
  });
}

// 新建flink sql流任务
export function addStreamingSqlJob(data) {
  return request({
    url: '/flink/job/sql/streaming',
    method: 'post',
    data,
  });
}

// 编辑flink sql流任务
export function editStreamingSqlJob(data) {
  return request({
    url: '/flink/job/sql/streaming',
    method: 'put',
    data,
  });
}

// 新建flink sql批任务
export function addBatchSqlJob(data) {
  return request({
    url: '/flink/job/sql/batch',
    method: 'post',
    data,
  });
}

// 新建flink jar任务
export function addJarJob(data) {
  return request({
    url: '/flink/job/jar',
    method: 'post',
    data,
  });
}

// 编辑flink jar任务
export function editJarJob(data) {
  return request({
    url: '/flink/job/jar',
    method: 'put',
    data,
  });
}

// 查看任务详情
export function getJobDetail(jobId) {
  return request({
    url: `/flink/job/${jobId}`,
    method: 'get',
  });
}

// 删除���务
export function removeJob(jobId) {
  return request({
    url: `/flink/job/${jobId}`,
    method: 'delete',
  });
}

// 启动任务
export function startJob(jobId) {
  return request({
    url: `/flink/job/start/${jobId}`,
    method: 'get',
  });
}

// 恢复任务
export function resumeJob(jobId) {
  return request({
    url: `/flink/job/resume/${jobId}`,
    method: 'get',
  });
}

// 停止任务
export function stopJob(jobId) {
  return request({
    url: `/flink/job/stop/${jobId}`,
    method: 'get',
  });
}

// 暂停任务
export function pauseJob(jobId) {
  return request({
    url: `/flink/job/pause/${jobId}`,
    method: 'get',
  });
}

export function listJars() {
  return request({
    url: '/flink/jar',
    method: 'get',
  });
}

// 获取作业详情
export function getJob(id) {
  return request({
    url: `/flink/job/${id}`,
    method: 'get',
  });
}

// 添加作业
export function addJob(data) {
  return request({
    url: '/flink/job',
    method: 'post',
    data,
  });
}

// 更新作业
export function updateJob(data) {
  return request({
    url: `/flink/job/${data.id}`,
    method: 'put',
    data,
  });
}
