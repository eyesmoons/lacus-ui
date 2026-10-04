import request from '@/utils/request';

// 启动训练
export function startTraining(data) {
  return request({
    url: '/api/lake-intelligence/tasks',
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
