import request from '@/utils/request';

/**
 * 获取任务列表
 * @param {number} jobId - 作业ID
 */
export function getTaskList(jobId) {
  return request({
    url: `/st/job/task/list/${jobId}`,
    method: 'get',
  });
}

/**
 * 创建任务
 * @param {Object} data - 任务数据
 */
export function createTask(data) {
  return request({
    url: '/st/job/task',
    method: 'post',
    data,
  });
}

/**
 * 更新任务
 * @param {Object} data - 任务数据
 */
export function updateTask(data) {
  return request({
    url: '/st/job/task',
    method: 'put',
    data,
  });
}

/**
 * 删除任务
 * @param {number} taskId - 任务ID
 */
export function deleteTask(taskId) {
  return request({
    url: `/st/job/task/${taskId}`,
    method: 'delete',
  });
}

/**
 * 获取任务详情
 * @param {number} taskId - 任务ID
 */
export function getTaskDetail(taskId) {
  return request({
    url: `/st/job/task/${taskId}`,
    method: 'get',
  });
}

/**
 * 批量创建任务
 * @param {number} jobId - 作业ID
 * @param {Array} tasks - 任务列表
 */
export function batchCreateTasks(jobId, tasks) {
  return request({
    url: `/st/job/task/batch/${jobId}`,
    method: 'post',
    data: tasks,
  });
}

/**
 * 获取作业的所有任务
 * @param {number} jobId - 作业ID
 */
export function getJobTasks(jobId) {
  return request({
    url: `/st/job/task/job/${jobId}`,
    method: 'get',
  });
}

/**
 * 获取作业的DAG信息
 * @param {number} jobId - 作业ID
 */
export function getJobDag(jobId) {
  return request({
    url: `/st/job/task/dag/${jobId}`,
    method: 'get',
  });
}

/**
 * 保存作业任务配置
 * @param {Object} data - 作业任务配置
 */
export function saveJobTaskConfig(data) {
  return request({
    url: '/st/job/task/config',
    method: 'post',
    data,
  });
}

/**
 * 保存DAG（节点关系）
 * @param {Object} data - DAG数据，包含节点和边的关系
 */
export function saveDag(data) {
  return request({
    url: '/st/job/task/dag',
    method: 'post',
    data,
  });
}

/**
 * 验证任务配置
 * @param {Object} data - 任务配置
 */
export function validateTaskConfig(data) {
  return request({
    url: '/st/job/task/validate',
    method: 'post',
    data,
  });
}

/**
 * 获取任务执行状态
 * @param {number} taskId - 任务ID
 */
export function getTaskStatus(taskId) {
  return request({
    url: `/st/job/task/status/${taskId}`,
    method: 'get',
  });
}

/**
 * 获取任务执行日志
 * @param {number} taskId - 任务ID
 */
export function getTaskLogs(taskId) {
  return request({
    url: `/st/job/task/logs/${taskId}`,
    method: 'get',
  });
}

/**
 * 获取作业配置
 * @param {number} jobId - 作业ID
 */
export function getJobConfig(jobId) {
  return request({
    url: `/st/job/config/${jobId}`,
    method: 'get',
  });
}
