# 能力基线：system-admin（系统管理域）

## Purpose

本能力域固化系统管理模块的现状契约：用户、角色、菜单、部门、岗位、参数配置（含字典）、通知公告、环境管理、资源管理九个子模块的页面业务流程、全部接口定义、权限控制点与异常分支。所有条目均为存量代码的实际行为描述。

## ADDED Requirements

### Requirement: 用户管理

用户管理页必须提供：左侧部门树联动查询（GET /system/dept/dropdownList 提供树数据，点击节点按 deptId 过滤）；用户分页列表 GET /system/user/list（查询条件含 nickName、phonenumber、status 等）；新增/编辑 POST /system/user、PUT /system/user（表单校验用户名唯一由后端提示，编辑时部门默认选中排除自身及子树——复用 GET /system/dept/list/exclude/{deptId}）；删除 DELETE /system/user/{userId}（确认文案「是否确认删除…」）；密码重置 PUT /system/user/{userId}/password/reset；状态切换 PUT /system/user/{userId}/status（el-switch，取消时回滚状态值）。详情 GET /system/user/{userId} 同时返回角色/岗位下拉数据供表单使用。权限前缀规律为 system:user:add/edit/remove/resetPwd/editRole 等。

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /system/user/list | 分页查询用户 |
| GET | /system/user/{userId} | 用户详情（空 userId 查全部基础数据） |
| POST | /system/user | 新增用户 |
| PUT | /system/user | 修改用户 |
| DELETE | /system/user/{userId} | 删除用户 |
| PUT | /system/user/{userId}/password/reset | 重置密码 |
| PUT | /system/user/{userId}/status | 启停用户 |

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 部门树联动

- **WHEN** 点击部门树中某节点
- **THEN** 右侧列表仅显示该部门下的用户且页码回到第 1 页

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 状态切换取消

- **WHEN** 切换用户状态弹出的确认框被取消
- **THEN** el-switch 状态值立即回滚为切换前的值

### Requirement: 个人中心

个人中心（/user/profile）必须提供资料展示与修改（GET/PUT /system/user/profile）、密码修改 PUT /system/user/profile/password（oldPassword/newPassword 由后端校验旧密码正确性）、头像上传 POST /system/user/profile/avatar（FormData，成功后更新 Vuex 头像地址）。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 修改头像

- **WHEN** 用户选择新头像图片上传成功
- **THEN** 顶部导航栏头像即时替换为新图

### Requirement: 角色管理

角色管理必须提供：分页查询 GET /system/role/list；CRUD（POST/PUT /system/role、DELETE /system/role/{roleId}）；菜单权限分配（新增/编辑时经 GET /system/menu/dropdownList 取菜单树）；数据权限 PUT /system/role/{roleId}/dataScope（全部/自定义/本部门等 scope 配套 GET /system/dept/dropdownList/role/{roleId} 已勾选部门树）；状态切换 PUT /system/role/{roleId}/status。授权用户页提供已分配/未分配两列表（GET /system/role/{roleId}/allocated/list、/unallocated/list），支持三种授权操作：DELETE /system/role/users/{userIds}/grant（批量取消用户角色）、DELETE /system/role/users/{userIds}/grant/bulk（批量取消授权变体）、POST /system/role/{roleId}/users/{userIds}/grant/bulk（批量授权用户）。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 配置数据权限

- **WHEN** 角色列表点击「更多-数据权限」并选择自定义数据权限保存
- **THEN** PUT dataScope 提交所选部门集合，成功提示后关闭对话框刷新列表

### Requirement: 菜单管理

菜单管理必须是树形表格展示 GET /system/menu/list；新增/编辑表单区分目录/菜单/按钮三种类型（类型决定路由地址、组件路径、权限标识字段的显隐与校验），上级菜单下拉来自 GET /system/menu/dropdownList；编辑时校验防止选择自身子树；删除 DELETE /system/menu/{menuId}。角色编辑页经 GET /system/menu/roleMenuTreeSelect/{roleId} 获取带勾选状态的菜单树。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 新增按钮级权限

- **WHEN** 在某菜单下新增类型为「按钮」的节点并填写权限字符 system:user:export
- **THEN** 该权限串可分配给角色，前端对应 v-hasPermission 控制的导出按钮随之生效

### Requirement: 部门管理

部门管理必须是树形表格；新增/编辑时父部门下拉来自 GET /system/dept/dropdownList；编辑排除自身分支（GET /system/dept/list/exclude/{deptId}）；CRUD 对应 GET /system/dept/list、POST /system/dept、PUT /system/dept、DELETE /system/dept/{deptId}。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 删除有下级的部门

- **WHEN** 尝试删除仍存在子部门的节点
- **THEN** 后端拒绝并经统一拦截器弹出错误提示，列表不变

### Requirement: 岗位管理

岗位管理为标准 CRUD 分页页：GET /system/post/list、GET /system/post/{postId}、POST /system/post、PUT /system/post、DELETE /system/post/{postId}。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 新增岗位

- **WHEN** 填写岗位名称与编码提交
- **THEN** POST 成功后提示「新增成功」并刷新列表

### Requirement: 参数配置与字典获取

参数配置页为标准 CRUD（GET /system/config/list、GET /system/config/{configId}、POST/PUT /system/config），并提供缓存刷新 DELETE /system/config/refreshCache。字典数据获取途径固定为两条：GetInfo 时随 getLoginUserInfo 下发的 dictTypes 整体入 Vuex 优先命中；未命中时 useDict 调用 GET /system/config/dict/{dictType} 实时拉取且不回写 Vuex 缓存。现状无独立"字典管理"页面，字典维护只能通过参数配置或后端进行。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 字典标签渲染

- **WHEN** 页面调用 useDict('datasource_status') 且该字典已在登录时下发
- **THEN** 直接从 Vuex 命中渲染 DictTag 标签，不发额外请求

### Requirement: 通知公告

通知公告为标准 CRUD 分页页：GET /system/notice/list、GET /system/notice/{noticeId}、POST /system/notice、PUT /system/notice、DELETE /system/notice/{noticeId}；公告类型（通知/公告）与状态由字典驱动。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 发布公告

- **WHEN** 填写标题、类型与富文本内容保存
- **THEN** 列表出现新公告且状态默认正常

### Requirement: 环境管理

环境管理页维护计算/存储环境配置，标准 CRUD：GET /system/env/list、GET /system/env/{envId}、POST /system/env、PUT /system/env、DELETE /system/env/{envId}。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 新建环境

- **WHEN** 填写环境名称与连接信息保存
- **THEN** 列表新增该环境记录

### Requirement: 资源管理

资源管理页必须提供：目录树查询 GET /system/resource/directory/list 与创建目录 POST /system/resource/directory/create；文件分页 GET /system/resource/file/list/paging（pageNum/pageSize 默认 1/10）；文件上传走独立 axios 通道 POST /system/resource/file/upload（multipart/form-data + Bearer 头 + 5 分钟超时 + 上传进度回调）；文件预览 GET /system/resource/view/{id}；文件下载 GET /system/resource/file/download/{id}；文件清单 GET /system/resource/file/list；同步动作 POST /system/resource/sync；单文件删除 DELETE /system/resource/{id}。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 上传大文件

- **WHEN** 选择 200MB 文件上传
- **THEN** 显示上传进度百分比直至完成，超时上限为 5 分钟而非全局 30 秒

### Requirement: 权限字符串规律

系统管理各操作按钮统一以 v-hasPermission 控制，权限串格式为 `<模块>:<资源>:<动作>`，如 system:user:add、system:user:remove、system:role:edit、system:menu:add、system:config:remove 等；持有 '*:*:*' 的超管账号全量放行。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 无导出权限用户

- **WHEN** 用户权限集中不含对应按钮权限串
- **THEN** 相关操作按钮在页面渲染阶段即被移除
