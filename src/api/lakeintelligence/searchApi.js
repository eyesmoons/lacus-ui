import request from '@/utils/request';

// 相似检索（支持图片上传）
export function searchSimilar(data) {
  return request({
    url: '/lake-intelligence/search',
    method: 'post',
    data: data,
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
