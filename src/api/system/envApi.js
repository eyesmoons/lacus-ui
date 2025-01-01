import request from '@/utils/request';

export function listEnv(query) {
  return request({
    url: '/system/env/list',
    method: 'get',
    params: query,
  });
}

export function getEnv(envId) {
  return request({
    url: `/system/env/${envId}`,
    method: 'get',
  });
}

export function addEnv(data) {
  return request({
    url: '/system/env',
    method: 'post',
    data,
  });
}

export function updateEnv(data) {
  return request({
    url: '/system/env',
    method: 'put',
    data,
  });
}

export function deleteEnv(envId) {
  return request({
    url: `/system/env/${envId}`,
    method: 'delete',
  });
}
