import request from '@/utils/request';
import axios from 'axios';
import { getToken } from '@/utils/token';

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
export function uploadFile(data, onProgress) {
  return axios({
    url: import.meta.env.VITE_APP_BASE_API + '/system/resource/file/upload',
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: 'Bearer ' + getToken(),
    },
    data,
    timeout: 5 * 60 * 1000, // 5分钟超时
    onUploadProgress: onProgress
      ? (progressEvent) => {
          if (progressEvent.total > 0) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ percent });
          }
        }
      : undefined,
  })
    .then((response) => {
      console.log('Upload API response:', response);
      return response.data;
    })
    .catch((error) => {
      console.error('Upload API error:', error);
      if (error.response && error.response.data) {
        throw new Error(error.response.data.msg || '上传失败');
      }
      throw error;
    });
}

// 预览文件
export function previewFile(id) {
  return request({
    url: `/system/resource/view/${id}`,
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

// 获取文件列表(不分页)
export function queryResourceList(params) {
  return request({
    url: '/system/resource/file/list',
    method: 'get',
    params: {
      pid: params.pid,
      fileName: params.fileName,
    },
  });
}

export function syncResources() {
  return request({
    url: '/system/resource/sync',
    method: 'get',
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
  queryResourceList,
  syncResources,
};
