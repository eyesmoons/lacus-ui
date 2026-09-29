# 提案：legacy-baseline-snapshot（存量系统快照 · 基线 Spec 逆向补全）

> 变更名：`legacy-baseline-snapshot`（中文标题：legacy-baseline-存量系统快照）
> 性质：**纯文档变更**——逆向梳理存量代码，产出描述当前线上真实实现的基准 Spec。不新增功能、不改动任何业务代码。

## Why

本工程（lacus-ui，Vue 3 + Element Plus 数据平台前端）为存量系统，前期开发未使用 OpenSpec，主规格目录 `openspec/specs/` 为空。团队已决定：自本变更起启用标准 OpenSpec 正向工作流（先文档后代码）。在此之前，必须先对现有代码做一次完整的逆向梳理，固化一份与代码行为严格一致的基线 Spec，作为后续所有需求的对照基准；否则正向流程将没有可依据的"现状真值"。

## What Changes

- 新增基线规格文档：按能力域划分，覆盖业务流程、全部前端 API 接口定义（method/path/参数）、页面结构与状态管理、异常分支、鉴权控制点、浏览器端存储（Cookie/SessionStorage/LocalStorage）使用、定时/轮询类逻辑、运营配置项。
- 新增存量架构文档（design）：模块依赖关系、技术分层、技术债清单、风险清单。
- 产出**差异清单**：代码实际行为与历史需求/设计文档（如 `docs/design/datasource-module-hld.md`、根目录 CRON 文档、历史提交记录中的需求描述）不一致之处，单独列出，不混入基准 Spec 正文。
- **不修改任何业务代码**：本变更的全部产出仅位于 `openspec/changes/legacy-baseline-snapshot/` 目录。
- 流程约束：文档产出后**暂停等待人工评审**；评审通过后归档锁定基线，并将定稿 Spec 同步复制至项目 `topics/` 目录保持同源。

## Capabilities

### New Capabilities

以下能力域均为首次建档（存量逆向描述，非新功能）：

- `app-foundation`: 应用骨架与启动流程——入口装配（main.js 全局组件/指令/插件挂载）、Layout 布局体系、主题/尺寸设置、构建配置与环境变量、qiankun 微前端依赖的实际使用现状。
- `auth-and-routing`: 认证与访问控制——登录/注册流程、Token 管理（Cookie）、RSA 加密、全局路由守卫、后端下发动态路由的生成与注册、hasPermission/hasRole 权限指令、401/404 处理、会话过期（20101）处理链路。
- `http-gateway`: HTTP 请求层——axios 封装约定、请求/响应拦截器（Token 注入、GET 参数序列化、防重复提交）、统一错误码处理（200/500/20101/其他）、二进制响应与通用文件下载。
- `system-admin`: 系统管理域——用户、角色、菜单、部门、岗位、字典、参数配置、通知公告、环境管理、资源管理等页面的业务流程与接口。
- `ops-monitor`: 监控运营域——首页 Dashboard、在线用户、缓存监控、Druid 监控、登录日志、操作日志、服务器监控、告警管理的业务流程与接口。
- `metadata-domain`: 元数据管理域——数据源、数据源类型与插件（含 KAFKA/HDFS 虚拟源插件化表单）、库/表/列元数据、表详情、业务元数据、数据血缘、元数据同步任务的业务流程与接口。
- `datasync-domain`: 数据同步域——数据目录（catalog）、同步任务定义/编辑器、任务实例的业务流程与接口。
- `compute-jobs`: 批流计算任务域——Flink 任务（SQL/JAR 定义、编辑、详情、实例）与 Spark 任务（SQL/JAR 定义、编辑、详情、实例）的业务流程与接口。
- `dataquality-domain`: 数据质量域——质量规则（模板选择、规则表单、编辑）、执行记录的业务流程与接口。
- `dig-integration`: 数据集成域（dig）——连接器、任务定义、普通设计器与专家设计器（X6 画布）、任务实例的业务流程与接口。
- `oneapi-domain`: 统一 API 域——API 定义列表、创建/编辑向导、详情、调试发布的业务流程与接口。
- `shared-ui-toolkit`: 通用组件与工具集——Pagination/DictTag/Upload 系列/TreeSelect/MonacoEditor/CronTab/CronInput 等 21 个公共组件的契约、全局指令（copyText/权限指令）、plugins（modal/download/cache/permissionChecker）、utils 工具函数的行为约定。

### Modified Capabilities

（无——`openspec/specs/` 当前为空，不存在被修改的既有主规格。）

## Impact

- **代码影响：无。** 本变更为纯文档产出，禁止触碰 `src/` 下任何业务代码。
- **受影响路径**：新增 `openspec/changes/legacy-baseline-snapshot/{proposal,design,tasks}.md` 与 `openspec/changes/legacy-baseline-snapshot/specs/<capability>/spec.md`；评审通过归档后，定稿文档复制至 `topics/`（新建目录）。
- **对照材料**：`docs/design/datasource-module-hld.md`、`docs/design/home-commercial-redesign-*.md`、根目录 `CRON_GENERATOR_UPGRADE.md`、`CRONTAB_USAGE.md`、git 历史提交中记录的需求描述。
- **后续流程**：本变更完成后，所有新需求必须基于该基线走标准 OpenSpec 正向流程。
