import request from '@/utils/request';

// ==================== 数据集管理 ====================

// 创建数据集
export function createDataset(data) {
  return request({
    url: '/api/lake-intelligence/datasets',
    method: 'post',
    data: data,
  });
}

// 数据源探测
export function probeSource(uri) {
  return request({
    url: '/api/lake-intelligence/datasets/probe-source',
    method: 'post',
    params: { uri: uri },
  });
}

// 查询数据集列表（分页）
export function listDatasets(query) {
  return request({
    url: '/api/lake-intelligence/datasets',
    method: 'get',
    params: query,
  });
}

// 查询数据集详情
export function getDataset(id) {
  return request({
    url: `/lake-intelligence/datasets/${id}`,
    method: 'get',
  });
}

// 预览数据集
export function previewDataset(id) {
  return request({
    url: `/lake-intelligence/datasets/${id}/preview`,
    method: 'get',
  });
}

// 删除数据集
export function deleteDataset(id) {
  return request({
    url: `/lake-intelligence/datasets/${id}`,
    method: 'delete',
  });
}

// 获取数据集类别分布统计（分类任务）
export function getDatasetClassStats(id) {
  return request({
    url: `/lake-intelligence/datasets/${id}/class-stats`,
    method: 'get',
  });
}
