import request from '@/utils/request';

// ==================== 以图搜图检索 ====================

// 相似检索（支持图片上传）
export function searchSimilar(data) {
  return request({
    url: '/api/lake-intelligence/search',
    method: 'post',
    data: data,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// 通过 image_id 检索
export function searchByImageId(imageId, topK, collectionName) {
  return request({
    url: '/api/lake-intelligence/search',
    method: 'post',
    params: {
      image_id: imageId,
      top_k: topK || 5,
      collection_name: collectionName || 'image_collection',
    },
  });
}

// 获取向量库列表
export function listCollections() {
  return request({
    url: '/api/lake-intelligence/vectors/collections',
    method: 'get',
  });
}

// 构建向量库
export function buildVectors(data) {
  return request({
    url: '/api/lake-intelligence/vectors/build',
    method: 'post',
    data: data,
  });
}

// 查询构建进度
export function getBuildProgress(id) {
  return request({
    url: `/lake-intelligence/vectors/${id}/progress`,
    method: 'get',
  });
}
