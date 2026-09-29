# 能力基线：auth-and-routing（认证与访问控制）

## Purpose

本能力域固化 lacus-ui 认证与访问控制的现状契约：登录/注册流程（验证码、RSA 加密、记住密码）、Token 的 Cookie 存取、全局路由守卫与动态路由生成、权限指令与函数式权限校验、会话过期处理、错误页。所有条目均为存量代码的实际行为描述。

## ADDED Requirements

### Requirement: 登录流程

登录页必须提供账号/密码/图形验证码输入；进入页面时调用 `GET /captchaImage` 获取 base64 图片与 uuid，响应中的 isCaptchaOn 开关决定是否展示验证码输入框（缺省视为开启）；点击登录后前端校验非空，随后将密码经 RSA 加密（jsencrypt，公钥硬编码于 src/utils/rsaUtil.js）提交 `POST /login`（body: username、password 密文、code、uuid，该请求跳过 Token 注入）。登录成功将返回 token 写入 Cookie 并跳转 redirect 参数或首页；失败时刷新验证码。「记住密码」勾选后将 username、RSA 加密后的 password、rememberMe 三个 Cookie 写入（有效期 30 天），下次进入登录页回填并解密回显；取消勾选则移除这三个 Cookie。现状缺陷：登录表单默认预填 admin/admin123。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 验证码开启的正常登录

- **WHEN** 用户输入账号、密码与验证码并点击登录，后端校验通过
- **THEN** Cookie 写入 Admin-Token，页面跳转到 /index（或 redirect 参数指定页）

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 登录失败

- **WHEN** 后端返回校验失败
- **THEN** loading 状态复位且验证码图片自动刷新，用户可重试

### Requirement: 注册流程

注册页必须提供 username/password/confirmPassword/code 四字段（username 2–20 位、password 5–20 位、两次密码一致性前端校验），提交 `POST /register`（isToken:false）成功后弹窗提示并跳转登录页；注册入口受登录页 register 开关控制，当前默认关闭（登录页不显示"立即注册"链接）。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 注册成功

- **WHEN** 用户完成表单并通过后端校验
- **THEN** 弹出红色文字成功提示，确认后跳转 /login

### Requirement: Token 管理

Token 必须存于 Cookie 键 `Admin-Token`（js-cookie，会话级，未设置过期时间）；getToken/setToken/removeToken 三个方法统一读写；登出或 Token 失效时移除该 Cookie。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 无 Token 访问受限页

- **WHEN** 未携带 Admin-Token 的浏览器访问除白名单外的任意路由
- **THEN** 重定向到 `/login?redirect={原路径}`

### Requirement: 全局路由守卫

router.beforeEach 必须实现：开启 NProgress 进度条；有 Token 时若目标是 /login 则重定向首页；若无角色信息（首次进入或刷新）则依次执行 GetInfo 拉取用户信息、GenerateRoutes 生成动态路由并逐条 router.addRoute（http 外链路径除外），再以 `{...to, replace: true}` 重新进入目标路由；GetInfo 失败则执行 LogOut 并提示错误后跳转首页。无 Token 时仅白名单 ['/login', '/auth-redirect', '/bind', '/register'] 可直接进入，其余一律重定向登录页。afterEach 中结束 NProgress。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 刷新页面恢复登录态

- **WHEN** 用户在任意业务页面按 F5 刷新（Cookie 中仍有 Token）
- **THEN** 守卫重新执行 GetInfo 与 GenerateRoutes，动态菜单与权限恢复后才渲染目标页

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 白名单外匿名访问

- **WHEN** 匿名用户直接输入 /system/user 地址
- **THEN** 跳转 /login 并携带 redirect=/system/user，登录成功后回到原页

### Requirement: 用户信息加载

GetInfo 必须调用 `GET /getLoginUserInfo`，从响应中取 user.username、user.avatar（空值用内置默认头像，非空拼接 VITE_APP_BASE_API 前缀）、roleKey、permissions、dictTypes。注意：roleKey 为单角色字符串而非数组，为空时置为 ROLE_DEFAULT；permissions 为权限字符串数组；dictTypes 字典集合整体存入 Vuex。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 无角色用户登录

- **WHEN** getLoginUserInfo 返回的 roleKey 为空
- **THEN** 当前角色被设为 ROLE_DEFAULT，v-hasRole 控制的元素按不含任何角色处理

### Requirement: 动态路由生成

GenerateRoutes 必须调用 `GET /getRouters` 获取后端菜单树，对同一份数据做三份深拷贝分别处理：rewriteRoutes（SET_ROUTES，children 经 filterChildren 展平，用于 router.addRoute 动态注册）、sidebarRoutes（SET_SIDEBAR_ROUTERS，与 constantRoutes 拼接后驱动侧边栏）、topbarRouters（SET_TOPBAR_ROUTERS，顶部导航模式使用）。组件字符串映射规则：'Layout'→布局组件、'ParentView'→ParentView 包装组件、'InnerLink'→内嵌 iframe 组件、其余按 `views/<component>.vue` 目录 glob 精确匹配懒加载。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 后端下发新菜单

- **WHEN** 管理员给角色分配了新菜单并重新登录
- **THEN** 该角色的侧边栏出现新菜单项，对应路由已动态注册可直接访问

### Requirement: 权限指令

v-hasPermission 必须接收权限字符串数组，任一命中用户 permissions 或用户持有通配权限 '*:*:*' 即放行，否则从 DOM 移除该元素；传入空值抛错「请设置操作权限标签值」。v-hasRole 必须接收角色数组，当前 roleKey 命中任一项或等于超级管理员 'admin' 即放行，否则移除元素。两指令均为 mounted 时一次性判断。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 无权限按钮被隐藏

- **WHEN** 渲染带 v-hasPermission="['datasync:job:remove']" 的按钮而用户权限列表无此项
- **THEN** 该按钮节点直接从 DOM 移除，不可通过样式显示

### Requirement: 函数式权限校验

$permissionChecker 必须提供 hasPermission / hasAnyPermission / hasPermissions / hasRole / hasAnyRole / hasRoles 六个方法；权限判定逻辑与 v-hasPermission 一致（含 '*:*:*' 通配）。现状缺陷：authRole 内部条件写反（`if (role && !currentRole)` 才进入比较，且比较表达式自相矛盾），导致所有角色判定恒返回 false——hasRole 系列函数当前实际不可用，页面中凡依赖它的功能（如表详情业务元数据 Tab 的 editable 判断实际走 hasPermission）行为以 hasPermission 为准。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 角色校验失效示例

- **WHEN** 以 admin 角色调用 $permissionChecker.hasRole('admin')
- **THEN** 返回 false（实现缺陷），与指令 v-hasRole 行为不一致

### Requirement: 会话过期处理

后端业务码 20101 表示会话无效/过期：响应拦截器必须弹出确认框（文案「登录状态已过期，您可以继续留在该页面，或者重新登录」），确认后执行 LogOut 清理本地态并跳转 /index；弹窗期间以 isReLogin 标记去重，避免并发请求触发多个弹窗；无论确认与否该次请求均以 reject 终止。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: Token 过期后的操作

- **WHEN** 页面停留超过会话有效期后发起任一接口请求返回 20101
- **THEN** 出现单个过期确认弹窗，点「重新登录」清 Token 回登录入口，点「取消」留在当前页但该请求失败

### Requirement: 登出

主动登出必须调用 `POST /logout` 成功后清理 Vuex 中 token/role/permissions 并移除 Admin-Token Cookie（LogOut action）；FedLogOut 仅做前端清理不调后端接口。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 用户退出登录

- **WHEN** 点击头像下拉的退出登录并确认
- **THEN** 后端会话注销、本地状态清空，跳转登录页

### Requirement: 错误页面

路由表必须内置 catch-all 规则将未匹配地址渲染 404 页面，并提供独立 /401 路由渲染无权限页面。

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 访问不存在路由

- **WHEN** 输入未定义的路由地址
- **THEN** 渲染 404 页面
