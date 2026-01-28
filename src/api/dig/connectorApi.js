import request from '@/utils/request';

/**
 * 查询source组件
 */
export function getSourceConnectors() {
  return request({
    url: '/st/connector/sources',
    method: 'get',
  });
}

/**
 * 查询transform组件
 */
export function getTransformConnectors() {
  return request({
    url: '/st/connector/transforms',
    method: 'get',
  });
}

/**
 * 查询sink组件
 */
export function getSinkConnectors() {
  return request({
    url: '/st/connector/sinks',
    method: 'get',
  });
}

/**
 * 根据组件名称查询动态表单配置
 * @param {string} connectorType - 连接器类型
 * @param {string} connectorName - 连接器名称
 */
export function getConnectorForm(connectorType, connectorName) {
  return request({
    url: '/st/connector/form',
    method: 'get',
    params: {
      connectorType,
      connectorName,
    },
  }).then((response) => {
    // 后端返回JSON字符串，需要解析
    const dataString = response.data || response;
    try {
      const formConfig = JSON.parse(dataString);
      console.log('解析后的动态表单配置:', formConfig);

      // 处理新的数据格式：{fields: {...}, tags: {...}}
      if (formConfig.fields && formConfig.tags) {
        console.log('检测到新格式的动态表单配置');
        return processNewFormatConfig(formConfig);
      }

      // 兼容旧格式：后端返回的是对象格式 {fieldName: fieldConfig, ...}
      if (typeof formConfig === 'object' && !Array.isArray(formConfig)) {
        const formArray = Object.keys(formConfig).map((fieldName) => ({
          ...formConfig[fieldName],
          fieldName: fieldName,
          // 确保enName字段存在
          enName: formConfig[fieldName].enName || fieldName,
        }));
        console.log('转换后的表单数组(旧格式):', formArray);
        return formArray;
      }

      // 如果已经是数组格式，直接返回
      if (Array.isArray(formConfig)) {
        return formConfig;
      }

      // 兼容其他可能的格式
      return formConfig.formItems || formConfig.fields || [];
    } catch (error) {
      console.warn('解析动态表单配置失败:', error, 'Raw data:', dataString);
      return [];
    }
  });
}

/**
 * 处理新格式的动态表单配置
 * @param {Object} config - 包含fields和tags的配置对象
 * @returns {Array} 处理后的字段数组
 */
function processNewFormatConfig(config) {
  const { fields, tags } = config;

  // 将字段对象转换为数组格式
  const fieldArray = Object.keys(fields).map((fieldKey) => {
    const field = fields[fieldKey];

    // 根据项目规范设置字段属性
    const processedField = {
      ...field,
      // 字段标识和名称(按规范使用enName作为字段标识)
      fieldName: fieldKey,
      enName: field.enName || fieldKey,
      // 显示标签(按规范使用cnName作为显示标签)
      cnName: field.cnName || field.displayName || fieldKey,
      // 组件类型(按规范使用formType决定组件类型)
      formType: field.formType || field.type || 'text',
      // 分组标签
      tag: field.tag || '基本配置',
      // 排序值(按规范支持多种字段名)
      order:
        field.order !== undefined
          ? field.order
          : field.fieldOrder !== undefined
          ? field.fieldOrder
          : field.sort !== undefined
          ? field.sort
          : 999,
      // 下拉选项(按规范使用dictEnum用于下拉选项数据源)
      options: getFieldOptions(field),
      // 字段验证规则
      required: field.required || false,
      // 占位符
      placeHolder: field.placeHolder || field.placeholder || `请输入${field.cnName || fieldKey}`,
    };

    // 处理标签信息
    if (tags && tags[field.tag]) {
      const tagInfo = tags[field.tag];
      processedField.tagOrder =
        tagInfo.order !== undefined
          ? tagInfo.order
          : tagInfo.tag_order !== undefined
          ? tagInfo.tag_order
          : tagInfo.tagOrderValue !== undefined
          ? tagInfo.tagOrderValue
          : 999;
      processedField.tagDisplayName = tagInfo.displayName || tagInfo.name || field.tag;
      processedField.tagDescription = tagInfo.description || '';
    }

    return processedField;
  });

  // 按order排序
  fieldArray.sort((a, b) => {
    if (a.order === b.order) {
      return a.enName.localeCompare(b.enName);
    }
    return a.order - b.order;
  });

  console.log('处理后的新格式字段数组:', fieldArray);
  return fieldArray;
}

/**
 * 获取字段选项数据
 * @param {Object} field - 字段配置
 * @returns {Array} 选项数组
 */
function getFieldOptions(field) {
  // 按规范：当formType为SINGLE_SELECT时处理选项
  if (field.formType === 'single_select' || field.formType === 'SINGLE_SELECT') {
    // 按规范：若dictType为ENUM，则从dictEnum获取
    if (field.dictType === 'enum' && field.dictEnum && Array.isArray(field.dictEnum)) {
      return field.dictEnum.map((item) => ({
        label: item,
        value: item,
      }));
    }

    // 按规范：若dictType为URL，则标记需要从dictUrl获取
    if (field.dictType === 'url' && field.dictUrl) {
      return []; // 动态选项将在组件中处理
    }
  }

  // 兼容旧版本的options
  if (field.options && Array.isArray(field.options)) {
    return field.options;
  }

  return [];
}

/**
 * 根据组件名称查询数据源列表
 * @param {string} connectorName - 连接器名称
 */
export function getDatasourceList(connectorName) {
  return request({
    url: '/st/connector/datasources',
    method: 'get',
    params: { connectorName },
  });
}

/**
 * 根据数据源查询数据库列表
 * @param {number} datasourceId - 数据源ID
 */
export function getDatabaseList(datasourceId) {
  return request({
    url: '/st/connector/databases',
    method: 'get',
    params: { datasourceId },
  });
}

/**
 * 根据数据库查询表列表
 * @param {number} datasourceId - 数据源ID
 * @param {string} database - 数据库名称
 */
export function getTableList(datasourceId, database) {
  return request({
    url: '/st/connector/tables',
    method: 'get',
    params: { datasourceId, database },
  });
}

/**
 * 根据表查询字段列表
 * @param {number} datasourceId - 数据源ID
 * @param {string} database - 数据库名称
 * @param {string} tableName - 表名称
 */
export function getTableFields(datasourceId, database, tableName) {
  return request({
    url: '/st/connector/fields',
    method: 'get',
    params: { datasourceId, database, tableName },
  });
}
