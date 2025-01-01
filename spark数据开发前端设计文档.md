

# 一、后端接口

## 1.任务分页列表

GET /spark/job

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|orderByColumn|query|string| 否 |none|
|isAsc|query|string| 否 |none|
|beginTime|query|string| 否 |none|
|endTime|query|string| 否 |none|
|filedOverride.key|query|any| 否 |none|
|pageNum|query|integer| 否 |none|
|pageSize|query|integer| 否 |none|
|jobName|query|string| 否 |none|
|jobType|query|string| 否 |none|
|jobStatus|query|integer| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 2.新建spark sql任务

POST /spark/job/sql/batch

> Body 请求参数

```json
{
  "driverCores": 0,
  "driverMemory": 0,
  "numExecutors": 0,
  "executorCores": 0,
  "executorMemory": 0,
  "queue": "string",
  "namespace": "string",
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "sqlContent": "string",
  "otherSparkConf": "string",
  "envId": 0,
  "remark": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[AddSparkSqlJobCommand](#schemaaddsparksqljobcommand)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 3.编辑spark sql任务

PUT /spark/job/sql/batch

> Body 请求参数

```json
{
  "driverCores": 0,
  "driverMemory": 0,
  "numExecutors": 0,
  "executorCores": 0,
  "executorMemory": 0,
  "queue": "string",
  "namespace": "string",
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "sqlContent": "string",
  "otherSparkConf": "string",
  "envId": 0,
  "remark": "string",
  "jobId": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[UpdateSparkSqlJobCommand](#schemaupdatesparksqljobcommand)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 4.新建spark jar任务

POST /spark/job/jar

> Body 请求参数

```json
{
  "driverCores": 0,
  "driverMemory": 0,
  "numExecutors": 0,
  "executorCores": 0,
  "executorMemory": 0,
  "queue": "string",
  "namespace": "string",
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "mainJarPath": "string",
  "mainClassName": "string",
  "mainArgs": "string",
  "otherSparkConf": "string",
  "envId": 0,
  "remark": "string"
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[AddSparkJarJobCommand](#schemaaddsparkjarjobcommand)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 5.编辑spark jar任务

PUT /spark/job/jar

> Body 请求参数

```json
{
  "driverCores": 0,
  "driverMemory": 0,
  "numExecutors": 0,
  "executorCores": 0,
  "executorMemory": 0,
  "queue": "string",
  "namespace": "string",
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "mainJarPath": "string",
  "mainClassName": "string",
  "mainArgs": "string",
  "otherSparkConf": "string",
  "envId": 0,
  "remark": "string",
  "jobId": 0
}
```

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|body|body|[UpdateSparkJarJobCommand](#schemaupdatesparkjarjobcommand)| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 6.查看spark任务详情

GET /spark/job/{jobId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|jobId|path|integer| 是 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "creatorId": 0,
    "createTime": "",
    "updaterId": 0,
    "updateTime": "",
    "deleted": false,
    "jobId": 0,
    "jobName": "",
    "appId": "",
    "jobType": "",
    "deployMode": "",
    "driverCores": 0,
    "driverMemory": 0,
    "numExecutors": 0,
    "executorCores": 0,
    "executorMemory": 0,
    "otherSparkConf": "",
    "mainJarPath": 0,
    "mainClassName": "",
    "mainArgs": "",
    "sqlContent": "",
    "queue": "",
    "namespace": "",
    "envId": 0,
    "jobStatus": "",
    "remark": "",
    "scheduleStatus": false,
    "cronExpression": ""
  }
}
```



## 7.删除spark任务

DELETE /spark/job/{jobId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|jobId|path|integer| 是 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 8. 启动任务

GET /spark/job/start/{jobId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|jobId|path|integer| 是 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 9.停止任务

GET /spark/job/stop/{jobId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|jobId|path|integer| 是 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 10.上线定时任务

GET /spark/job/online/{jobId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|jobId|path|integer| 是 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 11.下线定时任务

GET /spark/job/offline/{jobId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|jobId|path|integer| 是 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 12.任务分页列表

GET /spark/job/instance/list/paging

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|orderByColumn|query|string| 否 |none|
|isAsc|query|string| 否 |none|
|beginTime|query|string| 否 |none|
|endTime|query|string| 否 |none|
|filedOverride.key|query|any| 否 |none|
|pageNum|query|integer| 否 |none|
|pageSize|query|integer| 否 |none|
|jobName|query|string| 否 |none|
|jobType|query|string| 否 |none|
|jobStatus|query|integer| 否 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 13.查看spark任务实例详情

GET /spark/job/instance/{instanceId}

### 请求参数

|名称|位置|类型|必选|说明|
|---|---|---|---|---|
|instanceId|path|integer| 是 |none|

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": {
    "creatorId": 0,
    "createTime": "",
    "updaterId": 0,
    "updateTime": "",
    "deleted": false,
    "instanceId": 0,
    "jobId": 0,
    "deployMode": "",
    "instanceName": "",
    "applicationId": "",
    "sparkJobId": "",
    "jobScript": "",
    "submitTime": "",
    "finishedTime": "",
    "status": "",
    "jobName": "",
    "jobType": ""
  }
}
```



# 二、前端

### 1. 前置条件

① 前端为vue项目

② js、css和vue文件分开



### 2. 页面说明

#### 2.1 任务列表页：index.vue

##### 2.1.1 顶部搜索栏

```
jobName: 任务名称输入框
jobType：任务类型下拉框，可选值有：BATCH_SQL, JAR
jobStatus：任务状态下拉框，可选值有：1 提交成功 ，2 运行中，3 成功，4 失败
```

##### 2.1.2 顶部操作栏

```
新建任务：点击新建任务按钮，显示为任务类型下拉框，可选值为：BATCH_SQL，JAR。
点击不同的任务类型进入不同的新建页面
```

##### 2.1.3 列表表头

```
jobName：任务名称
jobType：任务类型
deployMode：部署模式
jobStatus：任务状态
remark：任务说明
appId：应用ID
create_time：创建时间
```

##### 2.1.4 列表页操作按钮

```
编辑：进入编辑页面
删除：删除任务
详情：进入详情页面
启动：启动任务
恢复：恢复任务
停止：停止任务
暂停：暂停任务
```



#### 2.2 新增、编辑、详情页：detail.vue

##### 2.2.1 新增BATCH_SQL任务

```
① header
使用默认header，不用管
② body
jobName: 任务名称输入框
deployMode：部署模式选择框，可选值：LOCAL, STANDALONE_CLIENT, STANDALONE_CLUSTER, YARN_CLIENT, YARN_CLUSTER, K8S_CLIENT, K8S_CLUSTER
driverCores: driver核心数，整数输入框
driverMemory：driver内存，输入框
numExecutors：executor个数，整数输入框
executorCores：每个executor的核心数，整数输入框
executorMemory：每个executor的内存，输入框
otherSparkConf：其他spark配置
sqlContent：spark sql脚本，请使用monaco-editor
queue：yarn队列
namespace：命名空间
envId：环境，下拉框选择
remark：任务说明

③ footer
提交：点击提交按钮，保存任务配置
取消：点击取消按钮，返回列表页
```



##### 2.2.3 新增JAR任务

```
① header
使用默认header，不用管
② body
jobName: 任务名称输入框
deployMode：部署模式选择框，可选值：LOCAL, STANDALONE_CLIENT, STANDALONE_CLUSTER, YARN_CLIENT, YARN_CLUSTER, K8S_CLIENT, K8S_CLUSTER
driverCores: driver核心数，整数输入框
driverMemory：driver内存，输入框
numExecutors：executor个数，整数输入框
executorCores：每个executor的核心数，整数输入框
executorMemory：每个executor的内存，输入框
otherSparkConf：其他spark配置
sqlContent：spark sql脚本，请使用monaco-editor
queue：yarn队列
namespace：命名空间
envId：环境，下拉框选择
remark：任务说明
mainJarPath：主类路径，下拉框
mainClassName：主类名，输入框
mainArgs：主类参数

③ footer
提交：点击提交按钮，保存任务配置
取消：点击取消按钮，返回列表页
```



#### 2.3 js文件：index.js

index.js定义了后端请求的接口



### 3. 其他问题

一、技术栈确认：
Vue 3.2.31
1. 是否使用 TypeScript？否
2. 状态管理方案：Vuex

二、业务逻辑确认：
1. 任务状态的具体枚举值和展示方式
任务状态：SUBMITTED（已提交）, RUNNING（运行中）, FINISHED（结束）, FAILED（失败）, KILLED（主动杀掉）, CREATED（未运行）
2. 各种操作按钮的权限控制要求
暂不考虑
2. 是否需要支持批量操作
支持
3. 定时任务相关的配置界面要求
最好使用开源的crontab表达式组件

三、组件复用相关：
1. 是否可以复用 Flink 模块中的一些通用组件
可以，如果使用了，请将其抽象出来
2. 是否需要抽象出通用的表单组件
可以
3. monaco-editor 的配置是否可以复用现有的
是的

四、项目规范：
1. 代码风格规范
参考flink任务开发

2. 目录结构规范
参考flink任务开发
