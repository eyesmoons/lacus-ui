import request from '@/utils/request';

// 查询API列表（分页）
export function listApiInfo(query) {
  return request({
    url: '/one/api/list/paging',
    method: 'get',
    params: query,
  });
}

// 查询API详细信息
export function getApiInfo(apiId) {
  return request({
    url: `/one/api/${apiId}`,
    method: 'get',
  });
}

// 新增API
export function addApiInfo(data) {
  return request({
    url: '/one/api',
    method: 'post',
    data: data,
  });
}

// 修改API
export function updateApiInfo(data) {
  return request({
    url: '/one/api',
    method: 'put',
    data: data,
  });
}

// 删除API
export function deleteApiInfo(apiIds) {
  return request({
    url: `/one/api/${apiIds}`,
    method: 'delete',
  });
}

// 解析SQL
export function parseSql(data) {
  return request({
    url: '/one/api/parse',
    method: 'post',
    data: data,
  });
}

// 获取所有字段类型
export function getColTypeList() {
  return request({
    url: '/one/api/colTypeList',
    method: 'get',
  });
}

// 测试API
export function testApiInfo(data) {
  return request({
    url: '/one/api/test',
    method: 'post',
    data: data,
  });
}

// 在线测试API
export function testApiInfoOnline(data) {
  return request({
    url: '/one/api/test/online',
    method: 'post',
    data: data,
  });
}

// 更新API状态
export function updateApiStatus(id, status) {
  return request({
    url: '/one/api/updateStatus',
    method: 'get',
    params: {
      id,
      status,
    },
  });
}
