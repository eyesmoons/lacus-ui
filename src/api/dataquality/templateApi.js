import request from '@/utils/request';

/**
 * 获取所有启用的规则模板（供规则表单选择器使用）
 */
export function getTemplateList() {
  return request({
    url: '/dq/template/list',
    method: 'get',
  });
}
