# 数据集成连接器管理接口文档

## 接口概述

`StConnectorController` 提供数据集成连接器的管理功能，包括查询各类组件和获取动态表单配置。

**基础路径**: `/st/connector`

## 数据模型

### 1. 响应数据结构 (ResponseDTO)

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {} // 具体数据
}
```

**字段说明**:
- `code`: 响应状态码 (Integer)
- `msg`: 响应消息 (String)
- `data`: 响应数据 (泛型)

### 2. 连接器信息 (StConnectorInfo)

```json
{
  "name": "mysql",
  "displayName": "MySQL",
  "description": "MySQL数据库连接器",
  "version": "1.0.0",
  "author": "lacus",
  "type": "source",
  "status": "DOWNLOADED"
}
```

**字段说明**:
- `name`: 组件名称（唯一标识） (String)
- `displayName`: 组件显示名称 (String)
- `description`: 组件描述 (String)
- `version`: 组件版本 (String)
- `author`: 组件作者 (String)
- `type`: 组件类型 (String)
- `status`: 组件状态 (String)

### 3. 连接器状态枚举 (StConnectorStatus)

- `DOWNLOADED`: 已下载
- `ALL`: 全部

## 接口列表

### 1. 查询Source组件

**接口地址**: `GET /st/connector/sources`

**接口描述**: 查询所有可用的数据源连接器组件

**请求参数**:

| 参数名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| status | String | 否 | ALL | 组件状态筛选：DOWNLOADED(已下载)、ALL(全部) |

**请求示例**:
```
GET /st/connector/sources?status=DOWNLOADED
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "name": "mysql",
      "displayName": "MySQL",
      "description": "MySQL数据库连接器",
      "version": "1.0.0",
      "author": "lacus",
      "type": "source",
      "status": "DOWNLOADED"
    },
    {
      "name": "kafka",
      "displayName": "Apache Kafka",
      "description": "Kafka消息队列连接器",
      "version": "1.2.0",
      "author": "lacus",
      "type": "source",
      "status": "DOWNLOADED"
    }
  ]
}
```

### 2. 查询Transform组件

**接口地址**: `GET /st/connector/transforms`

**接口描述**: 查询所有可用的数据转换连接器组件

**请求参数**: 无

**请求示例**:
```
GET /st/connector/transforms
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "name": "sql",
      "displayName": "SQL转换",
      "description": "SQL数据转换组件",
      "version": "1.0.0",
      "author": "lacus",
      "type": "transform",
      "status": "DOWNLOADED"
    },
    {
      "name": "fieldmapper",
      "displayName": "字段映射",
      "description": "字段映射转换组件",
      "version": "1.1.0",
      "author": "lacus",
      "type": "transform",
      "status": "DOWNLOADED"
    }
  ]
}
```

### 3. 查询Sink组件

**接口地址**: `GET /st/connector/sinks`

**接口描述**: 查询所有可用的数据目标连接器组件

**请求参数**:

| 参数名 | 类型 | 是否必填 | 默认值 | 说明 |
|--------|------|----------|--------|------|
| status | String | 否 | ALL | 组件状态筛选：DOWNLOADED(已下载)、ALL(全部) |

**请求示例**:
```
GET /st/connector/sinks?status=ALL
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "name": "mysql",
      "displayName": "MySQL",
      "description": "MySQL数据库连接器",
      "version": "1.0.0",
      "author": "lacus",
      "type": "sink",
      "status": "DOWNLOADED"
    },
    {
      "name": "elasticsearch",
      "displayName": "Elasticsearch",
      "description": "Elasticsearch搜索引擎连接器",
      "version": "1.3.0",
      "author": "lacus",
      "type": "sink",
      "status": "DOWNLOADED"
    }
  ]
}
```

### 4. 获取连接器动态表单配置

**接口地址**: `GET /st/connector/form`

**接口描述**: 根据组件类型和名称获取对应的动态表单配置，用于前端渲染配置表单

**请求参数**:

| 参数名 | 类型 | 是否必填 | 说明 |
|--------|------|----------|------|
| connectorType | String | 是 | 连接器类型：source、transform、sink |
| connectorName | String | 是 | 连接器名称，如：mysql、kafka等 |

**请求示例**:
```
GET /st/connector/form?connectorType=source&connectorName=mysql
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": "{\"formItems\":[{\"field\":\"url\",\"label\":\"数据库连接地址\",\"type\":\"input\",\"required\":true,\"placeholder\":\"jdbc:mysql://localhost:3306/test\"},{\"field\":\"driver\",\"label\":\"驱动类名\",\"type\":\"input\",\"required\":true,\"defaultValue\":\"com.mysql.cj.jdbc.Driver\"},{\"field\":\"user\",\"label\":\"用户名\",\"type\":\"input\",\"required\":true},{\"field\":\"password\",\"label\":\"密码\",\"type\":\"password\",\"required\":true},{\"field\":\"query\",\"label\":\"查询SQL\",\"type\":\"textarea\",\"required\":true,\"placeholder\":\"SELECT * FROM table_name\"}]}"
}
```

**返回的JSON字符串解析后的结构**:
```json
{
  "formItems": [
    {
      "field": "url",
      "label": "数据库连接地址",
      "type": "input",
      "required": true,
      "placeholder": "jdbc:mysql://localhost:3306/test"
    },
    {
      "field": "driver",
      "label": "驱动类名",
      "type": "input",
      "required": true,
      "defaultValue": "com.mysql.cj.jdbc.Driver"
    },
    {
      "field": "user",
      "label": "用户名",
      "type": "input",
      "required": true
    },
    {
      "field": "password",
      "label": "密码",
      "type": "password",
      "required": true
    },
    {
      "field": "query",
      "label": "查询SQL",
      "type": "textarea",
      "required": true,
      "placeholder": "SELECT * FROM table_name"
    }
  ]
}
```

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

## 前端调用示例

### JavaScript/Axios 调用示例

```javascript
// 1. 获取所有source组件
async function getSourceConnectors() {
  try {
    const response = await axios.get('/st/connector/sources', {
      params: { status: 'DOWNLOADED' }
    });
    return response.data.data;
  } catch (error) {
    console.error('获取source组件失败:', error);
  }
}

// 2. 获取所有transform组件
async function getTransformConnectors() {
  try {
    const response = await axios.get('/st/connector/transforms');
    return response.data.data;
  } catch (error) {
    console.error('获取transform组件失败:', error);
  }
}

// 3. 获取所有sink组件
async function getSinkConnectors() {
  try {
    const response = await axios.get('/st/connector/sinks', {
      params: { status: 'ALL' }
    });
    return response.data.data;
  } catch (error) {
    console.error('获取sink组件失败:', error);
  }
}

// 4. 获取连接器表单配置
async function getConnectorForm(connectorType, connectorName) {
  try {
    const response = await axios.get('/st/connector/form', {
      params: {
        connectorType: connectorType,
        connectorName: connectorName
      }
    });
    // 需要解析返回的JSON字符串
    return JSON.parse(response.data.data);
  } catch (error) {
    console.error('获取连接器表单配置失败:', error);
  }
}
```

### Vue.js 组件使用示例

```vue
<template>
  <div>
    <!-- 连接器选择 -->
    <el-select v-model="selectedConnector" placeholder="请选择连接器">
      <el-option
        v-for="connector in connectors"
        :key="connector.name"
        :label="connector.displayName"
        :value="connector.name">
      </el-option>
    </el-select>
    
    <!-- 动态表单 -->
    <el-form v-if="formConfig" :model="formData" ref="form">
      <el-form-item
        v-for="item in formConfig.formItems"
        :key="item.field"
        :label="item.label"
        :required="item.required">
        <el-input
          v-if="item.type === 'input'"
          v-model="formData[item.field]"
          :placeholder="item.placeholder">
        </el-input>
        <el-input
          v-else-if="item.type === 'password'"
          type="password"
          v-model="formData[item.field]">
        </el-input>
        <el-input
          v-else-if="item.type === 'textarea'"
          type="textarea"
          v-model="formData[item.field]"
          :placeholder="item.placeholder">
        </el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      connectors: [],
      selectedConnector: '',
      formConfig: null,
      formData: {}
    }
  },
  async mounted() {
    // 加载连接器列表
    await this.loadConnectors();
  },
  watch: {
    selectedConnector(newVal) {
      if (newVal) {
        this.loadFormConfig(newVal);
      }
    }
  },
  methods: {
    async loadConnectors() {
      try {
        const response = await this.$http.get('/st/connector/sources');
        this.connectors = response.data.data;
      } catch (error) {
        this.$message.error('加载连接器列表失败');
      }
    },
    async loadFormConfig(connectorName) {
      try {
        const response = await this.$http.get('/st/connector/form', {
          params: {
            connectorType: 'source',
            connectorName: connectorName
          }
        });
        this.formConfig = JSON.parse(response.data.data);
        // 初始化表单数据
        this.initFormData();
      } catch (error) {
        this.$message.error('加载表单配置失败');
      }
    },
    initFormData() {
      this.formData = {};
      this.formConfig.formItems.forEach(item => {
        if (item.defaultValue) {
          this.formData[item.field] = item.defaultValue;
        }
      });
    }
  }
}
</script>
```

## 注意事项

1. **状态参数**: `status` 参数在 `/sources` 和 `/sinks` 接口中为可选参数，默认值为 `ALL`
2. **表单配置**: `/form` 接口返回的是JSON字符串，前端需要使用 `JSON.parse()` 进行解析
3. **错误处理**: 建议前端对所有接口调用都进行错误处理，提供友好的用户提示
4. **连接器类型**: `connectorType` 参数只能是 `source`、`transform` 或 `sink` 中的一个
5. **动态表单**: 不同连接器的表单配置结构可能不同，前端需要根据返回的配置动态渲染表单
