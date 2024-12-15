## 一、后端接口

### 1. 任务分页列表

GET /flink/job

> 请求参数

| 名称      | 位置  | 类型    | 必选 | 说明 |
| --------- | ----- | ------- | ---- | ---- |
| pageNum   | query | integer | 否   | none |
| pageSize  | query | integer | 否   | none |
| jobName   | query | string  | 否   | none |
| jobType   | query | string  | 否   | none |
| jobStatus | query | integer | 否   | none |

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



### 2. 新建flink sql流任务

POST /flink/job/sql/streaming

> Body 请求参数

```json
{
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "flinkSql": "string",
  "extJarPath": "string",
  "flinkRunConfig": "string",
  "envId": 0,
  "remark": "string"
}
```



> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



### 3. 编辑flink sql任务

PUT /flink/job/sql/streaming

> Body 请求参数

```json
{
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "flinkSql": "string",
  "extJarPath": "string",
  "flinkRunConfig": "string",
  "envId": 0,
  "remark": "string",
  "jobId": 0
}
```



> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



### 4. 新建flink sql批任务

POST /flink/job/sql/batch

> Body 请求参数

```json
{
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "flinkSql": "string",
  "extJarPath": "string",
  "flinkRunConfig": "string",
  "envId": 0,
  "remark": "string"
}
```



> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```

### 5. 新建flink jar任务

POST /flink/job/jar

> Body 请求参数

```json
{
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "mainJarPath": "string",
  "extJarPath": "string",
  "mainClass": "string",
  "flinkRunConfig": "string",
  "customArgs": "string",
  "envId": 0,
  "remark": "string"
}
```



> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```

### 6. 编辑flink jar任务

PUT /flink/job/jar

> Body 请求参数

```json
{
  "jobName": "string",
  "jobType": "string",
  "deployMode": "string",
  "mainJarPath": "string",
  "extJarPath": "string",
  "mainClass": "string",
  "flinkRunConfig": "string",
  "customArgs": "string",
  "envId": 0,
  "remark": "string",
  "jobId": 0
}
```



> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



### 7. 查看flink任务详情

GET /flink/job/{jobId}

> 请求参数

| 名称  | 位置 | 类型   | 必选 | 说明 |
| ----- | ---- | ------ | ---- | ---- |
| jobId | path | string | 是   | none |

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
    "savepoint": "",
    "jobType": "",
    "deployMode": "",
    "flinkSql": "",
    "mainJarPath": "",
    "extJarPath": "",
    "mainClass": "",
    "flinkRunConfig": "",
    "customArgs": "",
    "envId": 0,
    "jobStatus": "",
    "remark": ""
  }
}
```



### 8. 删除flink任务

DELETE /flink/job/{jobId}

> 请求参数

| 名称  | 位置 | 类型   | 必选 | 说明 |
| ----- | ---- | ------ | ---- | ---- |
| jobId | path | string | 是   | none |

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



### 9. 启动任务

GET /flink/job/start/{jobId}

> 请求参数

| 名称  | 位置 | 类型   | 必选 | 说明 |
| ----- | ---- | ------ | ---- | ---- |
| jobId | path | string | 是   | none |

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



### 10. 恢复任务

GET /flink/job/resume/{jobId}

> 请求参数

| 名称  | 位置 | 类型   | 必选 | 说明 |
| ----- | ---- | ------ | ---- | ---- |
| jobId | path | string | 是   | none |

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



### 11. 停止任务

GET /flink/job/stop/{jobId}

> 请求参数

| 名称  | 位置 | 类型   | 必选 | 说明 |
| ----- | ---- | ------ | ---- | ---- |
| jobId | path | string | 是   | none |

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



### 12. 暂停任务

GET /flink/job/pause/{jobId}

> 请求参数

| 名称  | 位置 | 类型   | 必选 | 说明 |
| ----- | ---- | ------ | ---- | ---- |
| jobId | path | string | 是   | none |

> 返回示例

```json
{
  "code": 0,
  "msg": "",
  "data": null
}
```



## 二、前端

### 1. 前置条件

① 前端为vue项目

② js、css和vue文件分开



### 2. 页面说明

#### 2.1 任务列表页：index.vue

##### 2.1.1 顶部搜索栏

```
jobName: 任务名称输入框
jobType：任务类型下拉框，可选值有：STREAMING_SQL, BATCH_SQL, JAR
jobStatus：任务状态下拉框，可选值有：1 提交成功 ，2 运行中，3 成功，4 失败
```

##### 2.1.2 顶部操作栏

```
新建任务：点击新建任务按钮，显示为任务类型下拉框，可选值为：STREAMING_SQL，BATCH_SQL，JAR。
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

##### 2.2.1 新增STREAMING_SQL任务

```
① header
使用默认header，不用管
② body
jobName：任务名称输入框
remark：任务描述
deployMode：部署模式：下拉框，可选值：Local，Standalone，Yarn-per-job，Yarn-application
taskmanager：taskmanager内存输入框，默认为1G
jobmanager：jobmanager内存输入框，默认为1G
slot：slot个数，数字输入框，默认为1
queue：队列，默认为default
parallelism：并行度，数字输入框，默认为1
flinkSql：SQL脚本：SQL输入框组件，可以高亮显示sql语法和美化sql
③ footer
提交：点击提交按钮，保存任务配置
取消：点击取消按钮，返回列表页
```



##### 2.2.2 新增BATCH_SQL任务

```
和STREAMING_SQL任务保持一致，不同的是，新增了一个属性：
cron：定时表达式
```



##### 2.2.3 新增JAR任务

```
① header
使用默认header，不用管
② body
jobName：任务名称输入框
remark：任务描述
mainJarPath：jar包下拉框
mainClass：主类名
deployMode：部署模式：下拉框，可选值：Local，Standalone，Yarn-per-job，Yarn-application
taskmanager：taskmanager内存输入框，默认为1G
jobmanager：jobmanager内存输入框，默认为1G
slot：slot个数，数字输入框，默认为1
queue：队列，默认为default
parallelism：并行度，数字输入框，默认为1
customArgs：自定义参数：
③ footer
提交：点击提交按钮，保存任务配置
取消：点击取消按钮，返回列表页
```



#### 2.3 js文件：index.js

index.js定义了后端请求的接口
