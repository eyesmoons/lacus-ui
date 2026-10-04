import request from '@/utils/request';

// ==================== 图片分类推理 ====================

// 单张图片分类推理
export function classifyImage(data) {
  return request({
    url: '/api/lake-intelligence/classify',
    method: 'post',
    data: data,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// 批量图片分类推理
export function batchClassify(data) {
  return request({
    url: '/api/lake-intelligence/classify/batch',
    method: 'post',
    data: data,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// 获取分类类别列表
export function listClasses(modelId) {
  return request({
    url: '/api/lake-intelligence/classify/classes',
    method: 'get',
    params: { modelId: modelId },
  });
}
