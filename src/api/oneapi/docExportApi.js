import request from '@/utils/request';

// 导出接口文档（Markdown），apiIds 逗号分隔字符串；返回 Blob
export function exportApiDoc(apiIds) {
  return request({
    url: '/one/api/export',
    method: 'get',
    params: { apiIds },
    responseType: 'blob',
  });
}
