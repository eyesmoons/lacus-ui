import request from '@/utils/request';

// ==================== 模型管理 ====================

// 模型列表（分页）
export function listModels(query) {
  return request({
    url: '/lake-intelligence/models',
    method: 'get',
    params: query,
  });
}

// 获取模型详情
export function getModel(id) {
  return request({
    url: `/lake-intelligence/models/${id}`,
    method: 'get',
  });
}

// 创建模型
export function createModel(data) {
  return request({
    url: '/lake-intelligence/models',
    method: 'post',
    data,
  });
}

// 更新模型
export function updateModel(data) {
  return request({
    url: `/lake-intelligence/models/${data.modelId}`,
    method: 'put',
    data,
  });
}

// 下载模型
export function downloadModel(id) {
  return request({
    url: `/lake-intelligence/models/${id}/download`,
    method: 'get',
    responseType: 'blob',
  });
}

// 删除模型
export function deleteModel(id) {
  return request({
    url: `/lake-intelligence/models/${id}`,
    method: 'delete',
  });
}

// 获取模型架构列表（用于配置表单）
export function listModelArchitectures(taskType) {
  return request({
    url: '/lake-intelligence/models/architectures',
    method: 'get',
    params: { taskType: taskType },
  });
}

// 启动模型训练
export function trainModel(id, data) {
  return request({
    url: `/lake-intelligence/models/${id}/train`,
    method: 'post',
    data,
  });
}
