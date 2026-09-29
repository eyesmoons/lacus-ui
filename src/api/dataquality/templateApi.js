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

/**
 * 获取全部规则模板（管理列表）
 */
export function listAllTemplates() {
  return request({ url: '/dq/template/listAll', method: 'get' });
}

/**
 * 新增规则模板
 */
export function addTemplate(data) {
  return request({ url: '/dq/template', method: 'post', data });
}

/**
 * 更新规则模板
 */
export function updateTemplate(data) {
  return request({ url: '/dq/template', method: 'put', data });
}

/**
 * 删除规则模板
 */
export function deleteTemplate(id) {
  return request({ url: `/dq/template/${id}`, method: 'delete' });
}
