import request from '@/utils/request';

// 获取目录列表
export function getDirectoryList() {
  return request({
    url: '/system/resource/directory/list',
    method: 'get',
  });
}

// 创建目录
export function createDirectory(data) {
  return request({
    url: '/system/resource/directory/create',
    method: 'post',
    data,
  });
}

// 获取文件列表
export function getFileList(params) {
  return request({
    url: '/system/resource/file/list/paging',
    method: 'get',
    params: {
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
      ...params,
    },
  });
}

// 上传文件
export function uploadFile(data) {
  return request({
    url: '/system/resource/file/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data,
  });
}

// 预览文件
export function previewFile(id) {
  return request({
    url: `/system/resource/file/preview/${id}`,
    method: 'get',
  });
}

// 下载文件
export function downloadFile(id) {
  return request({
    url: `/system/resource/file/download/${id}`,
    method: 'get',
    responseType: 'blob',
  });
}

// 删除资源（文件或目录）
export function deleteResource(id) {
  return request({
    url: `/system/resource/${id}`,
    method: 'delete',
  });
}

export const resourceApi = {
  getDirectoryList,
  createDirectory,
  getFileList,
  uploadFile,
  previewFile,
  downloadFile,
  deleteResource,
};
