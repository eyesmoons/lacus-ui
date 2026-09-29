# 能力基线：http-gateway（HTTP 请求层）

## Purpose

本能力域固化 lacus-ui 与后端通信的统一行为契约：axios 实例配置、请求拦截器（Token 注入、GET 参数序列化、防重复提交）、响应拦截器对业务码的五类分支处理、网络层错误文案转换、通用下载方法与错误码映射。所有业务模块的接口调用均复用本层约定，本 spec 是全部接口表格的前置语境。

## ADDED Requirements

### Requirement: axios 实例基础配置

全局请求必须经由统一的 axios 实例发出：baseURL 取环境变量 VITE_APP_BASE_API（当前两环境均为 /lacus-api），默认超时 30000ms，默认 Content-Type 为 application/json;charset=utf-8。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 常规请求

- **WHEN** 业务代码调用 request({url: '/system/user/list', method: 'get'})
- **THEN** 实际请求发往 /lacus-api/system/user/list，30 秒未响应按超时失败处理

### Requirement: Token 注入规则

请求拦截器必须为携带 Cookie Token 的请求自动附加 `Authorization: Bearer <token>` 头；请求 headers 中显式声明 `isToken: false` 的接口（登录 /login、注册 /register、验证码 /captchaImage）跳过注入。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 免鉴权接口

- **WHEN** 登录页调用 getCodeImg()
- **THEN** 请求头中不含 Authorization 字段

### Requirement: GET 参数序列化

GET 请求的 params 必须由 encodeURIParams 自行序列化拼接进 URL（支持一层嵌套对象展开为 `prop[key]=value` 形式，null/undefined 项跳过），随后清空 params 避免axios重复编码。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 带查询参数的分页请求

- **WHEN** 调用 pageList({pageNum:1, pageSize:10, tableName:'ods'})
- **THEN** 发出 GET /xxx/pageList?pageNum=1&pageSize=10&tableName=ods（URL 已编码）

### Requirement: 防重复提交

POST/PUT 请求（headers.repeatSubmit 未设 false 时）必须做防重：以 sessionStorage 键 `sessionObj` 记录最近一次请求的 url+body+时间戳，若 1000ms 内出现 url 与 body 完全相同的再次提交则直接拒绝（console 警告「数据正在处理，请勿重复提交」，Promise reject），否则刷新该记录。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 快速双击保存按钮

- **WHEN** 用户在 1 秒内连续两次点击同一表单的保存按钮
- **THEN** 第二次请求被前端拦截不发出，仅第一次生效

### Requirement: 响应业务码分支

统一响应包 `{code, msg, data}` 的处理契约：业务码 200 时返回体中的 data 字段（调用方拿到的即业务数据）；blob/arraybuffer 响应类型直通返回原始数据不解析 code；20101 触发会话过期确认弹窗并 reject（见 auth-and-routing）；500 以 ElMessage.error 展示 msg 并 reject Error(msg)；其余非 200 码以 ElNotification.error 展示标题 msg 并 reject 'error'；未设置 code 的响应视为成功。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 成功响应

- **WHEN** 接口返回 {code:200, msg:'操作成功', data:{rows:[], total:0}}
- **THEN** 调用方 then 中直接获得 {rows:[], total:0}

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 后端校验错误

- **WHEN** 接口返回 {code:500, msg:'用户名已存在'}
- **THEN** 页面弹出错误消息「用户名已存在」，调用方 catch 到同名 Error

### Requirement: 网络层错误提示

HTTP 传输层异常必须转换为固定中文文案并以 ElMessage.error 展示 5 秒：'Network Error'→「后端接口连接异常」；超时→「系统接口请求超时」；带状态码的错误→「系统接口XXX异常」（XXX 为三位状态码）。转换后 Promise reject 原始 error。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 后端服务不可达

- **WHEN** 后端停止且代理返回 Network Error
- **THEN** 页面弹出「后端接口连接异常」

### Requirement: 错误码文案映射

errorCode 映射表必须包含：401→「认证失败，无法访问系统资源」、403→「当前操作没有权限」、404→「访问资源不存在」、default→「系统未知错误，请反馈给管理员」。该表用于 download/printErrMsg 场景兜底取文案，命中顺序为 errorCode[code] → res.data.msg → default。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 下载接口返回 404

- **WHEN** 下载接口响应体为 {code:404}
- **THEN** 错误提示展示「访问资源不存在」

### Requirement: 表单式下载方法

全局 download(url, params, filename) 方法必须：开启全屏 loading 遮罩（文案「正在下载数据，请稍候」）；以 POST + Content-Type x-www-form-urlencoded + responseType blob 发起请求（params 经 encodeURIParams 编码）；响应若为真实二进制（isBlobData 判断 JSON.parse 失败）则以 file-saver 按指定文件名保存；若实为 JSON（如会话失效包装）则解析出错误码映射文案弹错；结束或异常时关闭遮罩。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 正常导出列表

- **WHEN** 列表页点击导出触发 download('/xxx/export', query, '数据.xlsx')
- **THEN** 出现下载遮罩，浏览器保存 数据.xlsx 文件，完成后遮罩关闭

### Requirement: 独立上传通道

资源文件上传（resourceApi.uploadFile）与部分大文件场景不走统一实例，而以原生 axios 直连 `VITE_APP_BASE_API + 接口路径`：手动携带 multipart/form-data 与 Bearer Token 头、5 分钟超时、onUploadProgress 回调上报百分比进度。该通道绕过统一响应拦截器，调用方自行处理 response.data。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 大文件上传进度

- **WHEN** 资源管理页上传 100MB 文件
- **THEN** 进度条随 onUploadProgress 更新百分比，上传不受 30 秒默认超时限制（5 分钟上限）
