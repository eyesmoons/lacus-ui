# 设计：legacy-baseline-snapshot（存量基线逆向梳理）

## Context

lacus-ui 为 Vue 3.2.31 + Vite 2.9 + Element Plus 2.2 + Vuex 4 + Vue Router 4 的数据平台管理前端（130 个 .vue / 77 个 .js，约 230 个接口调用点），源自 RuoYi-Vue3 脚手架深度改造（保留 system/monitor 骨干与 request/permission 基建），叠加自研的元数据、数据同步、Flink/Spark、数据集成（SeaTunnel）、数据质量、OneAPI 六大业务域。前期开发未使用 OpenSpec，`openspec/specs/` 为空。本变更不写代码，仅产出与代码现状严格一致的基线文档。

## Goals / Non-Goals

**Goals:**
- 产出 12 个能力域基线 spec，覆盖业务流程、全部接口定义、异常分支、鉴权点、浏览器存储、定时轮询、运营配置。
- 汇总存量架构、模块依赖、技术债与风险清单（本文档）。
- 单列"文档与代码差异清单"——历史需求/设计文档描述与代码实际行为不一致处，不混入 spec 正文。
- 为归档后的标准正向 OpenSpec 流程建立"现状真值"。

**Non-Goals:**
- 不优化、不重构、不修改任何 `src/` 业务代码。
- 不补测试、不升级依赖、不修复本文档列出的任何缺陷。
- 不覆盖后端行为契约（spec 仅描述前端视角可观察行为与请求形态）。

## Decisions

### D1 能力域划分粒度：12 域

按「基建三域（app-foundation/auth-and-routing/http-gateway）+ 业务八域 + 组件工具域」切分。备选方案是按菜单一级目录粗分四域，但会把认证与 HTTP 契约埋进单文件不利引用；按域拆分后每个 spec 可独立被后续变更 MODIFIED。

### D2 差异清单独立成章

代码与历史需求不一致处统一收录本文档 §差异清单，spec 正文只写代码实际做什么。理由：基线的价值在"真值"，若把设计意图混入正文会破坏其作为对照基准的可信度；而差异本身是后续迭代的输入，需集中可见。

### D3 以代码为唯一权威源

所有 spec 断言以当前工作区代码为准逐条核对（含 method/path 字符串级核对）；`docs/design/*.md` 与根目录 CRON 文档仅作差异比对的参照系，不作为事实来源。

### D4 归档后同源策略

评审通过归档时，将 `openspec/specs/<capability>/spec.md` 复制至项目 `topics/` 目录同名路径，保持双份同源（topics 为团队习惯查阅入口，openspec/specs 为 OpenSpec 权威源）。

## 存量架构与模块依赖

```
入口 main.js
 ├─ router/index.js(常量路由) ── interceptor.js 守卫
 │    ├─ GetInfo → store/user (roleKey 单角色 + permissions + dictTypes)
 │    └─ GenerateRoutes → store/permission ← GET /getRouters
 ├─ store(app/settings/tagsView/user/permission)
 ├─ plugins($tab/$permissionChecker/$cache/$modal/$download)
 ├─ directive(v-hasPermission/v-hasRole/v-copyText)
 └─ utils/request.js(axios 单实例) ← 全部 src/api/** 共用
      （例外通道：resourceApi.uploadFile 与 $download 用裸 axios）

业务域对基建的依赖均为单向：
 system-admin / ops-monitor ─┐
 metadata-domain ────────────┤→ http-gateway → 后端 :8090(/lacus-api)
 datasync-domain ────────────┤→ shared-ui-toolkit(Pagination/useDict/CronTab…)
 compute-jobs ───────────────┤→ auth-and-routing(v-hasPermission)
 dig-integration ────────────┘→ app-foundation(Layout/TagsView)
跨域复用：metadata 的 BusinessMetaPanel 被 datasource 页复用；
 dig/designer/components/EngineConfigModal 被 dig/expert 复用；
 首页 index.vue 直接消费 monitor/dashboardApi。
```

分层特征：无状态管理分层（组件直调 API）、无路由级代码分割外的按域分包、API 文件按域一目录一文件的扁平结构。

## 技术债清单

| # | 条目 | 位置 | 说明 |
|---|---|---|---|
| TD1 | RSA 私钥打包进前端产物 | utils/rsaUtil.js:8 | 私钥应只在服务端存在；现前端可解密"记住密码"Cookie 密文，属安全债 |
| TD2 | 登录表单默认预填 admin/admin123 | views/login.vue:99-100 | 生产环境泄露默认凭据组合 |
| TD3 | permissionChecker.authRole 逻辑失效 | plugins/permissionChecker.js:21-24 | 条件 `role && !currentRole` 写反致 hasRole 系列恒 false |
| TD4 | qiankun 声明未使用 | package.json | 空引依赖增加安装体积与审计面 |
| TD5 | TaskConfigForm_bak.vue 死代码 | dig/designer/components/（3044 行） | 无引用备份文件入库 |
| TD6 | DAG 自动保存被注释禁用 | dig/designer/index.vue:270 | 注释声称每 10s 自动保存，实际不存在，易误导 |
| TD7 | dig 实例详情路由被注释 | router/index.js:407-413 | instanceApi.getInstanceDetail 成孤儿函数 |
| TD8 | Spark 路由重复定义 | router/index.js spark children 两次 path:'job' name:'SparkJob' | 后注册覆盖前者 |
| TD9 | Spark online/offline 接口未接线 | api/spark/jobApi.js vs views/spark/job/index.vue:123 | 已封装未使用 |
| TD10 | Flink jobApi 冗余函数 | api/flink/jobApi.js getJob/getJobDetail 并存、addJob/updateJob 与 sql/jar 专用函数并存 | 同语义多入口易漂移 |
| TD11 | datasync 删除/停止用 GET 承载写操作 | api/datasync/jobApi.js remove/stopJob | 违背 HTTP 语义，且 remove/{jobId} 为 GET |
| TD12 | oneapi updateStatus 用 GET 改状态 | api/oneapi/apiInfoApi.js:82-85 | 同 TD11 |
| TD13 | useDict 未命中不回写缓存 | utils/dict.js | 每次进入页面重复请求同一字典 |
| TD14 | validUsername 硬编码 admin/editor | utils/validate.js:23-25 | RuoYi 残留死校验 |
| TD15 | TagsView 无持久化 | store/tagsView.js | 刷新丢失页签（行为已如实入 baseline，是否算债待评审） |
| TD16 | 大量巨型组件 | dig/designer/index.vue 1813 行、TaskConfigForm 2499 行、datasync/job/job.vue 976 行、oneapi/create.vue 779 行、metadata/datasource/index.vue 814 行 | 可维护性风险 |

## 风险清单

| # | 风险 | 影响 | 缓解方向（不在本变更实施） |
|---|---|---|---|
| R1 | TD1+TD2 叠加：密钥与默认凭据同时泄露面扩大 | 安全 | 下线私钥、移除预填、改服务端记住密码 |
| R2 | Vite 2/Vue 3.2/Element Plus 2.2 全线停更版本 | 无法获得安全补丁 | 规划升级窗口 |
| R3 | 无任何自动化测试（package.json 无 test script） | 回归全靠手工 | 基线 spec 场景可直接转 E2E 用例 |
| R4 | 巨型表单向导无草稿暂存（job.vue/create.vue 刷新即丢） | 用户录入损失 | 引入本地草稿或步骤持久化 |
| R5 | 血缘图 depth=5 截断后大图性能未验证 | 千节点卡顿 | 虚拟化/懒展开（X6 interacting 已关只读，压力有限） |
| R6 | GET 承载写操作可能被浏览器预取/代理缓存误触发（TD11/TD12） | 数据意外变更 | 后端配合改 POST/DELETE |
| R7 | node_${Date.now()} 生成 DAG 节点 ID，同毫秒批量生成有碰撞理论风险 | 设计器拓扑错乱 | 换 uuid/createUniqueString |

## 文档与代码差异清单（历史需求/文档 vs 代码实况）

| # | 来源声称 | 代码实况 | 出处 |
|---|---|---|---|
| Δ1 | HLD §4.1 插件列表接口为 `GET /metadata/datasourcePlugin/list` | 实际为 `GET /metadata/datasource/plugin/list`（datasource 一级段） | docs/design/datasource-module-hld.md:118 vs src/api/metadata/datasourcePluginApi.js:13 |
| Δ2 | CRON_GENERATOR_UPGRADE.md 宣称 CronTab 含「秒~年」7 个 Tab | CronTab 实际 6 个 Tab（秒/分/时/日/月/周），无「年」；年字段能力仅在 CronInput 快捷项层面体现 | CRON_GENERATOR_UPGRADE.md 表格 vs src/components/CronTab/index.vue:11-123（共 12 个 el-tab-pane 计两处声明） |
| Δ3 | CRON 文档称左右分栏布局（左配置区+右结果区） | CronTab 当前实现为上下结构（表达式输入框+Tabs），分栏布局未落地 | CRON_GENERATOR_UPGRADE.md §界面 vs 组件模板 |
| Δ4 | HLD §3.1.1 称 handleTypeChange "已实现该逻辑"、虚拟源"零代码出现于下拉" | 类型下拉数据源为 pluginApi.list() 属实，但虚拟源的规则收敛/回填兜底为本次新写的 isVirtualRow/formRules/parsePluginFields 分支（01eef131），并非纯零代码 | HLD vs src/views/metadata/datasource/index.vue:409-426,527-574 |
| Δ5 | git bbb4b90c 提交声称"血缘前端实现"完整 | 图页/面板/接口均已实现，但 HLD §3.4.2 的 AUTO 自动解析登记入口在前端无对应 UI（仅来源标签区分），自动登记依赖后端同步流程尾部写入 | 提交信息 vs lineage 相关视图（无 AUTO 登记 UI，属契约内行为） |
| Δ6 | HLD §3.3.2 称 DB 级业务元数据"本期仅接口可达" | 属实：前端无 DB 级页面入口，bizId `${datasourceId}:${dbName}` 仅在组件 props 注释中出现 | HLD vs BusinessMetaPanel.vue:42-43 |

除上表外，bbb4b90c/01eef131 两提交声称的能力（虚拟源动态表单、编辑回填、业务元数据三入口、血缘登记/图页）均已在代码落实，未发现其他实质差异。

## Risks / Trade-offs（本变更自身）

- [逆向遗漏] 230 个调用点人工比对可能漏项 → tasks 以 API 文件为单位穷举勾验；归档前跑 openspec validate --strict。
- [基线过期] 评审期间若有人合入新功能 → 差异清单随归档动作一次性冻结，之后的新需求走正向流程自然演进基线。
- [文档体量] 12 份 spec 维护成本上升 → 每次正向变更只 MODIFIED 所触达的域，避免整包重写。

## Migration Plan

不适用（无部署物）。归档动作：openspec archive → specs 落入 openspec/specs/ → 复制至 topics/。

## Open Questions

- TD15（TagsView 不持久化）在团队预期中算缺陷还是既定行为？不影响基线成立，归档后如需变更走正向 change。
