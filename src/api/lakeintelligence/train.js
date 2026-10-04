import request from '@/utils/request';

// ==================== 训练任务 ====================

// 启动训练
export function startTraining(data) {
  return request({
    url: '/lake-intelligence/tasks',
    method: 'post',
    data: data,
  });
}

// 查询训练进度
export function getProgress(id) {
  return request({
    url: `/lake-intelligence/tasks/${id}/progress`,
    method: 'get',
  });
}

// 取消训练
export function cancelTraining(id) {
  return request({
    url: `/lake-intelligence/tasks/${id}/cancel`,
    method: 'post',
  });
}

// 查询训练任务列表
export function listTasks(query) {
  return request({
    url: '/lake-intelligence/tasks',
    method: 'get',
    params: query,
  });
}

// 获取任务类型对应的默认超参配置
export function getHyperparamSchema(taskType) {
  return request({
    url: '/lake-intelligence/tasks/hyperparam-schema',
    method: 'get',
    params: { taskType: taskType },
  });
}
