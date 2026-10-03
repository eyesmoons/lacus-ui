import request from '@/utils/request';

// 构建向量库
export function buildVectors(data) {
  return request({
    url: '/lake-intelligence/vectors/build',
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
