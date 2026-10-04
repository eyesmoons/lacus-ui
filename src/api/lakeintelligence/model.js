import request from '@/utils/request';

// ==================== 模型管理 ====================

// 模型列表（分页）
export function listModels(query) {
  return request({
    url: '/api/lake-intelligence/models',
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
    url: '/api/lake-intelligence/models/architectures',
    method: 'get',
    params: { taskType: taskType },
  });
}
