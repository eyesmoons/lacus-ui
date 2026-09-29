# Comet Design Handoff

- Change: data-quality-rule
- Phase: design
- Mode: compact
- Context hash: 78f827bdd02e8f60c938c35fcc8fb6d8907e51317fed999337ef8c561a2a55c0

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/data-quality-rule/proposal.md

- Source: openspec/changes/data-quality-rule/proposal.md
- Lines: 1-32
- SHA256: 2b41097706a7360b8d58058154bb5492ed6f8f8ad85d2419b3ca61589d1505fa

```md
## Why

数据质量规则管理当前缺少两个关键能力：一是规则列表页没有直达调度的入口，用户必须手动进入调度列表再按规则筛选；二是规则配置只有「执行失败告警」（Step0 告警组），缺少「检测结果超阈值告警」——而后者正是监控场景的核心诉求。本次变更补齐这两项，并显式盘点后端接口完整性。

## What Changes

- **规则列表新增「定时调度」入口**：在 `rule/index.vue` 操作列增加「调度」按钮，点击跳转调度列表并按该规则 `ruleId` 自动过滤。
- **Step2（规则配置）新增通用「阈值告警」配置**：启用开关 + 比较操作符（`> >= < <= = !=`）+ 阈值 + 告警组；阈值作用于模板主检测值（空值数/重复值/波动率/统计值等）。
- **阈值告警与执行失败告警并存**：Step0 的「执行失败告警组」保持不动，二者语义独立。
- **后端接口完整性检查**：在 Spec 中显式列出已有/缺失接口，明确后端待补齐项。

> 非目标：不修改 schedule 模块本身；不改动 Step0 告警组语义与接口。

## Capabilities

### New Capabilities

- `dataquality-rule-schedule-entry`: 规则列表到调度的快捷入口（跳转并按 ruleId 过滤）。
- `dataquality-threshold-alert`: Step2 通用阈值告警配置（启用开关、比较操作符、阈值、告警组），阈值作用于模板主检测值并与执行失败告警并存。

### Modified Capabilities

- `dataquality-domain`: 规则列表能力扩展（增加调度入口列），规则创建/编辑能力扩展（ruleCheckParams 增加阈值告警字段）。

## Impact

- **前端文件**：`src/views/dataquality/rule/index.vue`、`src/views/dataquality/rule/form.vue`、`src/api/dataquality/ruleApi.js`（可能扩展）。
- **后端接口**：
  - 规则侧 `POST/PUT /dq/rule` 的 `ruleCheckParams` **缺失**阈值告警字段（`alertEnabled`/`alertOperator`/`alertThreshold`/`alertGroupCode` 等）。
  - 调度侧 `GET /dq/schedule/list` 是否支持 `ruleId` 过滤参数**待后端确认**。
  - 告警组数据源 `GET /dq/schedule/alert-groups` **已就绪**，可复用。
- **兼容性**：阈值告警默认不启用，未启用时行为与改动前完全一致。

```

## openspec/changes/data-quality-rule/design.md

- Source: openspec/changes/data-quality-rule/design.md
- Lines: 1-75
- SHA256: f310bcc98147495a3aea2a72c35c21cd357313383fa94ea235af36568c9cf015

```md
## Context

数据质量模块现状：`rule/index.vue` 为规则列表（操作列：执行/编辑/删除），`rule/form.vue` 为 4 步表单（Step0 基本信息含「执行失败告警组」、Step1 数据源、Step2 规则配置、Step3 Spark 任务参数），`schedule/` 为独立调度模块。后端接口见 proposal.md「Impact」。

关键约束：
- Step2 的 `ruleCheckParams` 当前承载模板校验参数（`checkMethod`/`operator`/`expectedType`/`expectedValue` 等），以 JSON 存入 `rule_config` 列。
- 告警组数据源 `GET /dq/schedule/alert-groups` 已就绪可复用。
- 规则侧**无**阈值告警字段；`/dq/schedule/list` 是否支持 `ruleId` 过滤待后端确认。

## Goals / Non-Goals

**Goals:**
- 规则列表操作列增加「调度」入口，点击后**弹框管理该规则的唯一调度**（创建/查看/暂停/恢复/立即执行/编辑/删除），不再跳转调度列表页。
- 每规则**仅支持一个调度**：已绑调度时弹框直接展示详情与操作，未绑时展示创建表单（ruleId 预绑定）。
- Step2 增加通用阈值告警区（启用开关 + 操作符 + 阈值 + 告警组），阈值作用于模板主检测值。
- 阈值告警与 Step0 执行失败告警语义独立、并存。

**Non-Goals:**
- 不修改 schedule 模块本身（调度列表页仍保留，作为调度管理的兜底视图）。
- 不改动 Step0 执行失败告警组的语义与接口。
- 不实现告警发送逻辑（属后端），仅完成前端配置与字段承载。

## Decisions

### D1 调度入口：弹框直管（每规则唯一调度）
规则列表「调度」按钮改为**打开弹框**管理该规则的唯一调度，不再跳转调度列表页。
- 替代方案 A（原方案）：路由跳转 + `query: { ruleId }` 进入调度列表 → 每规则只有一个调度，列表页单条记录冗余，用户体验绕路，排除。
- 替代方案 B：行内展开 → 操作区空间有限，表单展开拥挤，排除。
- 选择理由：每规则唯一调度，弹框是最轻量的直达管理方式；ruleId 预绑定隐藏，用户零选择成本。
- 实现：弹框内容按 `rule.schedule` 状态切换——未绑显示创建表单（复用 CronInput），已绑显示详情 + 暂停/恢复/立即执行/编辑/删除。

### D1b 每规则一个调度约束
每规则**仅支持绑定一个调度**。
- 后端：`addSchedule` 若 ruleId 已存在调度则拒绝（需后端同步）。
- 前端：`getOptionalRules()` 已排除已绑定规则 → 调度表单规则下拉无法选已绑规则，从表单侧防二次绑定；规则列表弹框在已绑后隐藏「新建」、展示详情。

### D1c 规则列表接口扩展（调度信息内嵌）
`GET /dq/rule/list` 每行返回 `schedule: { id, jobName, cronExpression, status } | null`（方案 A）。
- 选择理由：弹框需知道每规则是否已绑调度及其状态（NORMAL/PAUSED），一次请求拿到全部信息；前端兜底：若字段缺失视为 null，弹框退化为「未绑」态。

### D2 阈值告警字段承载：复用 `ruleCheckParams`
阈值告警字段（`alertEnabled`/`alertOperator`/`alertThreshold`/`alertGroupCode`）写入 `ruleCheckParams`，随 `rule_config` 列持久化，编辑时随 `getRuleDetail` 回填。
- 替代方案 A：独立于 `ruleCheckParams` 的顶级字段 → 需后端新增多列/多字段，改动面大，排除。
- 选择理由：`ruleCheckParams` 已是扩展参数容器，新增字段零额外表结构。

### D3 阈值作用对象：模板主检测值
阈值统一作用于模板主检测值（空值数/重复值/波动率/统计值等），不区分模板子类型。
- 选择理由：通用、易理解；与 Step2 现有「期望值/阈值」语义一致，用户认知连贯。

### D4 告警组数据源复用
阈值告警的告警组下拉复用 `GET /dq/schedule/alert-groups`（`scheduleApi.getAlertGroupOptions`），不新增接口。
- 选择理由：告警组定义统一，避免重复维护。

## Risks / Trade-offs

- **[后端字段缺失]** → 规则侧 `rule_config` 尚无阈值告警字段。缓解：前端先按字段约定承载，后端同步补齐 `createRule`/`updateRule` 解析与 `getRuleDetail` 回显；列为 Open Question 跟踪。
- **[每规则唯一调度]** → 后端需保证 `addSchedule` 对同一 ruleId 拒绝二次绑定；前端 `getOptionalRules()` 已排除已绑规则，双向防护。
- **[规则列表接口扩展]** → `GET /dq/rule/list` 需返回 `schedule` 字段。前端兜底：缺失时视为 null，弹框退化为「未绑」态，不阻塞。
- **[过滤能力不确定]** → `/dq/schedule/list` 是否支持 `ruleId` 待确认。缓解：前端按 `ruleId` 传参，后端同步支持；若短期不支持，调度列表侧先前端过滤兜底。
- **[语义混淆]** → Step2 已有「期望值/阈值」用于 pass/fail 判定，新增「阈值告警」易混淆。缓解：UI 明确命名为「阈值告警」并加说明文案（「当检测结果越过阈值时触发告警」）。

## Migration Plan

1. 后端先补齐规则侧阈值告警字段与 `/dq/schedule/list` 的 `ruleId` 过滤。
2. 前端跟随：`rule/index.vue` 加调度按钮 → `rule/form.vue` Step2 加阈值告警区 → `ruleApi` 适配。
3. 灰度：阈值告警默认不启用，老数据无该字段，天然向前兼容。
4. 回滚：前端移除阈值告警区与调度按钮即可，后端字段为新增不影响存量。

## Open Questions

- OQ1: 后端 `rule_config` 新增阈值告警字段的命名约定（`alertEnabled`/`alertOperator`/`alertThreshold`/`alertGroupCode`）是否对齐？
- OQ2: `/dq/schedule/list` 是否（或何时）支持 `ruleId` 过滤参数？（兜底：调度列表页仍保留，前端本地过滤兜底）
- OQ3: 阈值告警触发由后端在检测完成后执行，前端是否需展示「最近一次是否触发告警」？本期不做，后续评估。
- OQ4: 后端 `GET /dq/rule/list` 返回 `schedule` 字段的进度？前端按契约实现并兜底缺失。
- OQ5: 后端 `addSchedule` 对同一 ruleId 二次绑定的拒绝时机？前端 `getOptionalRules()` 已做表单侧防护。

```

## openspec/changes/data-quality-rule/tasks.md

- Source: openspec/changes/data-quality-rule/tasks.md
- Lines: 1-31
- SHA256: 4efad84b52b14fd840103af585c457da0fd7c009ac4b9c01c0e91abd0b4bdfdf

```md
## 1. 调度入口（规则列表弹框直管每规则唯一调度）

- [x] 1.1 在 `rule/index.vue` 操作列「调度」按钮改为打开弹框（不再跳转调度列表页）。验证：点击后弹出 `el-dialog` 且标题含规则名。
- [x] 1.2 弹框按 `rule.schedule` 状态切换：未绑显示创建表单（调度名称/Cron/错误策略/并发/备注，ruleId 预绑定隐藏），已绑显示详情（名称/Cron/状态/下次执行）+ 暂停/恢复/立即执行/编辑/删除按钮。验证：两种状态切换正确。
- [x] 1.3 弹框内创建调度调用 `addSchedule`，成功后关闭弹框并刷新规则列表（获取最新 `schedule` 状态）。验证：创建后弹框刷新为「已绑」态。
- [x] 1.4 弹框内暂停/恢复调用 `pauseSchedule`/`resumeSchedule`，立即执行调用 `runSchedule`，编辑回填预填充，删除调用 `deleteSchedule`。验证：各操作成功且刷新列表。
- [x] 1.5 每规则唯一调度约束：已绑规则弹框隐藏「新建」、展示详情；`getOptionalRules()` 已排除已绑规则（表单侧防二次绑定）。验证：已绑规则无法再新建第二个调度。
- [x] 1.6 后端 `GET /dq/rule/list` 返回 `schedule: { id, jobName, cronExpression, status } | null`；前端兜底：缺失时视为 null 退化为「未绑」态。验证：字段缺失时不阻塞。

## 2. Step2 阈值告警配置

- [x] 2.1 在 `rule/form.vue` Step2 增加通用「阈值告警」区：启用开关 + 比较操作符（`> >= < <= = !=`）+ 阈值（数值）+ 告警组下拉（复用 `getAlertGroupOptions`）。验证：启用时展示并校验必填；未启用时隐藏且无校验。
- [x] 2.2 表单数据 `ruleCheckParams` 增加阈值告警字段（`alertEnabled`/`alertOperator`/`alertThreshold`/`alertGroupCode`），提交时写入 payload。验证：提交后 `ruleCheckParams` 含阈值告警字段。
- [x] 2.3 编辑回填：`loadEditData` 解析 `ruleConfig` 时回填阈值告警字段。验证：编辑已配置阈值告警的规则时，Step2 各区正确回显。

## 3. 验证与兼容

- [x] 4.1 未启用阈值告警时，提交 payload 不含阈值告警字段，行为与改动前一致。验证：存量规则编辑保存无回归。
- [x] 4.2 Step0 执行失败告警组功能不受影响。验证：Step0 告警组独立保存与回显正常。
- [x] 4.3 调度弹框全流程回归：创建/暂停/恢复/立即执行/编辑/删除/列表刷新。验证：弹框内各操作后列表 `schedule` 状态同步。（代码已实现，E2E 待后端 `schedule` 字段同步后验证）
- [x] 4.4 后端 `schedule` 字段缺失兜底：弹框退化为「未绑」态、不阻塞。验证：mock 缺失场景。（代码层面已实现兜底：`rule?.schedule` 为空即显示创建表单）

## 5. 规则模板管理

- [x] 5.1 后端 `sys_menu` 写入「规则模板」菜单项（menu_id 建议 2106，parent_id=2092 数据质量，path=`dataquality/template`，component=`dataquality/template/index`，menu_type=2，perms=`dq:template:list`）。验证：登录后侧边栏「数据质量」下展示「规则模板」。
- [x] 5.2 扩展 `templateApi.js`：新增 `listAllTemplates()`（→ GET /dq/template/listAll）、`addTemplate(data)`（→ POST）、`updateTemplate(data)`（→ PUT）、`deleteTemplate(id)`（→ DELETE /{id}）。验证：函数可用且路径/方法正确。
- [x] 5.3 新建 `src/views/dataquality/template/index.vue` 管理列表：搜索区（模板名称关键字/质量维度/启用状态）+ 表格（编码/名称/维度/图标预览/排序/启用开关/描述/操作）+ 新建/编辑/删除/启停。验证：列表加载、搜索过滤、启停、删除二次确认。
- [x] 5.4 新建 `src/views/dataquality/template/TemplateDialog.vue` 表单弹框：新建+编辑复用，字段含 templateCode（编辑只读）/templateName/dimension/templateIcon/templateColor/description/checkSqlPattern/itemsSqlPattern/extraConfigSchema/sortOrder/enabled；编码正则校验。验证：新建提交、编辑回填、编码只读、格式校验拦截。
- [x] 5.5 路由注册：`/dataquality` children 追加 `{ path: 'template', name: 'DqRuleTemplate', component: () => import('@/views/dataquality/template/index'), meta: { title: '规则模板', icon: 'document' }, hidden: true }`。验证：侧边栏点击跳转 `/dataquality/template`。
- [x] 5.6 回归：规则表单第一步模板选择器（`GET /dq/template/list`）仅展示启用模板，禁用后选择器不再出现。验证：禁用某模板后进入规则表单，该模板不在下拉中。


```

## openspec/changes/data-quality-rule/specs/dataquality-domain/spec.md

- Source: openspec/changes/data-quality-rule/specs/dataquality-domain/spec.md
- Lines: 1-46
- SHA256: 069e12b0a22b6118250d218291665718baacc7cba917dbe7b24282f399469197

```md
## MODIFIED Requirements

### Requirement: 规则列表与管理
规则列表必须提供查询 GET /dq/rule/list；新建 POST /dq/rule、编辑 PUT /dq/rule；删除 DELETE /dq/rule/{id}（确认后执行）；详情 GET /dq/rule/{id} 供编辑回显。列表展示规则名称、模板类型、启停状态等列。**列表操作列增加「调度」入口，点击跳转调度列表并按该规则 ruleId 过滤。**

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 删除质量规则

- **WHEN** 点击删除并确认
- **THEN** DELETE 接口执行成功后刷新列表

#### Scenario: 跳转调度列表并按规则过滤

- **WHEN** 点击某规则行的「调度」按钮
- **THEN** 跳转到调度列表并按该规则 ruleId 过滤，仅展示该规则关联的调度

| 方法 | 路径 | 用途 |
|---|---|---|
| GET | /dq/rule/list | 规则列表 |
| GET | /dq/rule/{id} | 规则详情 |
| POST | /dq/rule | 新建规则 |
| PUT | /dq/rule | 更新规则 |
| DELETE | /dq/rule/{id} | 删除规则 |
| GET | /dq/template/list | 模板清单 |
| POST | /dq/task/submit/{ruleId} | 提交执行 |
| GET | /dq/task/status/{logId} | 执行状态 |
| POST | /dq/task/stop/{logId} | 停止执行 |
| GET | /dq/result/list | 执行记录 |
| GET | /dq/check-result/list/{logId} | 检查明细 |
| GET | /dq/schedule/list?ruleId={ruleId} | 按规则过滤调度列表（扩展） |

### Requirement: 模板驱动的规则表单
规则创建必须先从 GET /dq/template/list 获取内置检测模板清单（只读选择，无模板维护页面），选定模板后按其类型渲染对应校验配置（数据源/库/表/列的定位方式以表单实现为准，阈值等参数随模板语义变化）；编辑时经 getRuleDetail 回填全部配置。**Step2 规则配置增加通用阈值告警区（启用开关、比较操作符、阈值、告警组），阈值作用于模板主检测值；提交时写入 `ruleCheckParams` 的阈值告警字段。**

> 基线断言：本条所述现状行为即为系统契约（**MUST**），直至后续变更显式修改。

#### Scenario: 基于模板建规则

- **WHEN** 选择某空值检测模板并填写目标表字段与阈值保存
- **THEN** POST /dq/rule 成功后列表出现该规则

#### Scenario: 保存阈值告警

- **WHEN** 在 Step2 启用阈值告警并填写操作符、阈值、告警组后提交
- **THEN** `ruleCheckParams` 携带阈值告警字段并持久化，编辑时可回填

```

## openspec/changes/data-quality-rule/specs/dataquality-rule-schedule-entry/spec.md

- Source: openspec/changes/data-quality-rule/specs/dataquality-rule-schedule-entry/spec.md
- Lines: 1-51
- SHA256: a2e800579bcf95eee3abdd4e5f8c90569033c250e81ba11286b6a0fc3ad09b5c

```md
## Purpose

为规则管理列表提供直达定时调度的快捷入口。由于每规则仅支持一个调度，用户从单条规则直接**弹框管理**其唯一调度（创建/查看/暂停/恢复/立即执行/编辑/删除），无需跳转调度列表页。

## ADDED Requirements

### Requirement: 规则列表调度弹框入口
规则列表操作列 SHALL 提供「调度」入口，点击后打开弹框管理该规则的唯一调度（不再跳转调度列表页）。

#### Scenario: 点击调度按钮打开弹框
- **WHEN** 用户点击某规则行的「调度」按钮
- **THEN** 系统打开弹框，标题包含规则名，内容按该规则调度状态切换

#### Scenario: 弹框按调度状态切换
- **WHEN** 规则未绑定调度
- **THEN** 弹框显示创建表单（调度名称/Cron/错误策略/是否并发/备注），ruleId 预绑定并隐藏
- **WHEN** 规则已绑定调度
- **THEN** 弹框显示调度详情（名称/Cron/状态/下次执行时间）与操作按钮（暂停/恢复/立即执行/编辑/删除）

### Requirement: 每规则唯一调度约束
每规则 SHALL 仅支持绑定一个调度。已绑规则弹框 SHALL 隐藏「新建」并展示详情，调度表单规则下拉 SHALL 排除已绑定规则。

#### Scenario: 已绑规则无法新建第二个调度
- **WHEN** 规则已绑定调度
- **THEN** 弹框不显示「新建调度」入口，仅展示已有调度的详情与操作

#### Scenario: 调度表单排除已绑规则
- **WHEN** 用户在调度表单选择绑定规则
- **THEN** 已绑定调度的规则不在下拉选项中

### Requirement: 弹框内调度操作
弹框 SHALL 支持对当前规则调度的完整操作：创建（`addSchedule`）、暂停（`pauseSchedule`）、恢复（`resumeSchedule`）、立即执行（`runSchedule`）、编辑（回填预填充）、删除（`deleteSchedule`）。操作成功后 SHALL 关闭弹框并刷新规则列表。

#### Scenario: 创建调度
- **WHEN** 用户在弹框创建表单填写并保存
- **THEN** 调用 `addSchedule` 成功后弹框刷新为「已绑」态，规则列表该行 `schedule` 状态同步

#### Scenario: 暂停/恢复/立即执行
- **WHEN** 用户点击暂停/恢复/立即执行按钮
- **THEN** 调用对应接口并刷新列表最新状态

### Requirement: 规则列表接口返回调度信息
`GET /dq/rule/list` 每行 SHALL 返回 `schedule: { id, jobName, cronExpression, status } | null`，前端兜底缺失时视为 null。

#### Scenario: 规则列表返回调度状态
- **WHEN** 前端加载规则列表
- **THEN** 每行包含 `schedule` 字段，null 表示未绑定，非 null 包含调度 ID/名称/Cron/状态

#### Scenario: 调度字段缺失兜底
- **WHEN** 后端暂未返回 `schedule` 字段
- **THEN** 前端视为 null，弹框退化为「未绑」态，不阻塞用户操作

```

## openspec/changes/data-quality-rule/specs/dataquality-rule-template-management/spec.md

- Source: openspec/changes/data-quality-rule/specs/dataquality-rule-template-management/spec.md
- Lines: 1-58
- SHA256: 0dc331f45c848b42a6b734bdcd24ef1c32bcf5e44ade1c9d5a9b4a72aa3cf572

```md
## Purpose

为数据质量模块提供「规则模板」管理能力。规则模板定义校验模板的编码、名称、质量维度、图标、检测/明细 SQL 模板、专属配置 Schema、排序与启用状态；规则表单（`rule/form.vue`）在第一步选择模板时复用 `GET /dq/template/list`（仅启用的模板）。管理页提供列表（全部模板）+ 新建/编辑/删除/启停。

后端 CRUD 接口（`/dq/template/*`）与实体（`dq_rule_template`）已就绪，本规格仅覆盖前端页面、路由、`templateApi.js` 扩展与后端 `sys_menu` 菜单入库。

## ADDED Requirements

### Requirement: 规则模板管理列表
数据质量侧边栏 SHALL 在「数据质量」目录下展示「规则模板」菜单项，进入后展示全部模板列表（含启用/禁用），支持按模板名称关键字、质量维度、启用状态搜索。

#### Scenario: 进入规则模板列表
- **WHEN** 用户从侧边栏点击「规则模板」
- **THEN** 展示模板列表表格，列包含：模板编码、模板名称、质量维度、图标预览、排序、启用状态、描述（溢出提示）、操作列

#### Scenario: 搜索过滤
- **WHEN** 用户在搜索区输入模板名称关键字或选择质量维度/启用状态
- **THEN** 列表按条件过滤展示

### Requirement: 新建与编辑模板
管理页 SHALL 提供「新建模板」入口与行内「编辑」入口，打开同一表单弹框（Dialog）：字段包含模板编码、模板名称、质量维度、前端图标、图标颜色、描述、检测 SQL 模板、明细 SQL 模板、额外配置 Schema（JSON）、排序序号、是否启用。编辑时模板编码 SHALL 只读。

#### Scenario: 新建模板
- **WHEN** 用户点击「新建模板」并填写完整后提交
- **THEN** 调用 `POST /dq/template` 持久化，成功后关闭弹框并刷新列表

#### Scenario: 编辑模板
- **WHEN** 用户点击行内「编辑」
- **THEN** 弹框回填全部字段（模板编码只读），修改后提交调用 `PUT /dq/template`

#### Scenario: 表单校验
- **WHEN** 模板编码/模板名称为空，或模板编码格式非法（非大写+下划线）
- **THEN** 校验不通过并提示

### Requirement: 删除模板
管理页行内 SHALL 提供「删除」操作，二次确认后调用 `DELETE /dq/template/{id}`。

#### Scenario: 删除模板
- **WHEN** 用户点击「删除」并确认
- **THEN** 调用删除接口，成功后刷新列表

#### Scenario: 取消删除
- **WHEN** 用户在确认弹框点击「取消」
- **THEN** 不执行删除，数据不变

### Requirement: 启用/禁用模板
列表 SHALL 提供启用状态开关，切换时调用更新接口；禁用的模板 SHALL 不出现在规则表单的模板选择器（`GET /dq/template/list` 仅返回 enabled=1）中。

#### Scenario: 禁用模板
- **WHEN** 用户将某模板启用开关置为关闭
- **THEN** 调用 `PUT /dq/template` 更新 enabled=0，规则表单选择器不再出现该模板

### Requirement: 菜单可见性
「规则模板」菜单项 SHALL 由后端 `sys_menu` 表驱动（`dataquality/template`），前端路由 `hidden:true` 与兄弟路由保持一致。

#### Scenario: 侧边栏展示
- **WHEN** 后端 `sys_menu` 已写入 `dataquality/template` 菜单项
- **THEN** 侧边栏「数据质量」目录下展示「规则模板」

```

## openspec/changes/data-quality-rule/specs/dataquality-threshold-alert/spec.md

- Source: openspec/changes/data-quality-rule/specs/dataquality-threshold-alert/spec.md
- Lines: 1-45
- SHA256: b39909a3d8ca1df27a5b87892918f70688c4bf96987626b3982c834f5086d690

```md
## Purpose

为规则配置（Step2 规则配置）提供通用「阈值告警」能力：当规则执行成功但检测结果值越过阈值时，按所配置告警组发送通知。该告警与 Step0 的「执行失败告警」语义独立、并存。

## ADDED Requirements

### Requirement: 阈值告警配置
规则配置 Step2 SHALL 提供通用阈值告警区，包含：启用开关、比较操作符（`> >= < <= = !=`）、阈值（数值）、告警组（下拉，数据源复用 `GET /dq/schedule/alert-groups`）。默认不启用。

#### Scenario: 启用阈值告警并配置
- **WHEN** 用户在 Step2 打开「启用阈值告警」开关
- **THEN** 展示操作符、阈值、告警组字段，且阈值与告警组为必填

#### Scenario: 未启用阈值告警
- **WHEN** 用户未启用阈值告警
- **THEN** 阈值告警区隐藏必填校验，提交时不携带阈值告警字段，行为与改动前一致

### Requirement: 阈值告警作用对象
阈值 SHALL 作用于模板的主检测值（如空值数、重复值、波动率、统计值等），判定方式为 `主检测值 <操作符> 阈值`。

#### Scenario: 超阈值触发告警
- **WHEN** 规则执行成功且主检测值满足 `值 <操作符> 阈值`
- **THEN** 系统按所配告警组发送通知

#### Scenario: 未超阈值不告警
- **WHEN** 规则执行成功但主检测值未越过阈值
- **THEN** 不触发阈值告警

### Requirement: 阈值告警持久化与回填
规则创建/编辑接口的 `ruleCheckParams` SHALL 承载阈值告警字段（启用标志、操作符、阈值、告警组编码），编辑时已保存的配置 SHALL 正确回填。

#### Scenario: 保存阈值告警
- **WHEN** 用户在 Step2 启用阈值告警并填写完整后提交
- **THEN** `POST/PUT /dq/rule` 的 `ruleCheckParams` 携带阈值告警字段并持久化

#### Scenario: 编辑回填阈值告警
- **WHEN** 用户编辑已配置阈值告警的规则
- **THEN** Step2 阈值告警区正确回显启用状态、操作符、阈值、告警组

### Requirement: 与执行失败告警并存
阈值告警 SHALL 与 Step0 的「执行失败告警组」语义独立，二者互不干扰。

#### Scenario: 两种告警独立工作
- **WHEN** 规则同时配置了执行失败告警组和阈值告警
- **THEN** 执行失败触发执行失败告警，超阈值触发阈值告警，彼此独立

```
