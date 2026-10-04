import request from '@/utils/request';

// 模型列表（分页）
export function listModels(query) {
  return request({
    url: '/api/lake-intelligence/models',
    method: 'get',
    params: query,
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
