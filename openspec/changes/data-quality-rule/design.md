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
