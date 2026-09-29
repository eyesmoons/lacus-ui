## Context

数据质量模块已有规则管理、执行记录、规则模板三个页面。执行数据已完备：`dq_execution_log`（执行记录，含 `status`/`pass_flag`/`start_time`）与 `dq_check_result`（检测结果明细，含 `pass_flag`/`rule_id`/`template_code`），分别由 `/dq/result/list` 与 `/dq/check-result/list/{logId}` 暴露。当前缺少对这些数据的聚合视图。详见 proposal.md - Why。

关键数据模型约束（影响聚合设计）：
- `pass_flag`：两表均为 `1=通过 / 0=未通过`。
- `dimension`（完整性/唯一性/及时性/有效性/一致性/稳定性）仅存在于 `dq_rule_template`，`dq_check_result` 与 `dq_rule` 均无该字段。按维度分布需三表关联：`dq_check_result` → `dq_rule`（rule_id）→ `dq_rule_template`（template_id）→ `dimension`。
- 图表库：项目已依赖 `echarts@5.3.2`，可直接复用。

## Goals / Non-Goals

**Goals**
- 新增「数据质量报告」前端页，按时间范围展示统计概览、趋势、分布。
- 新增后端聚合接口，从现有表聚合概览/趋势/分布三类数据。
- 新增菜单入口（`sys_menu`，status=1），挂于「数据质量」下规则模板之后。

**Non-Goals**
- 不新建数据库表（用户已确认：统计概览+趋势+分布，复用现有表）。
- 不改现有规则管理/执行记录/模板页面的行为。
- 不做实时流式报告或预计算任务；按需聚合查询。

## Decisions

### D1. 聚合数据源：现有表实时聚合（不建新表）
从 `dq_execution_log` 与 `dq_check_result` 实时聚合。用户已确认该方向。
- 概览「检测总量/通过数/失败数/通过率」：聚合 `dq_check_result` 的 `pass_flag`（按执行记录的 `start_time` 过滤时间范围）。
- 概览「执行成功/失败数」：聚合 `dq_execution_log` 的 `status`（SUCCESS / FAILED 等）。
- 趋势：按天（或按周）聚合检测量与通过率。
- 分布：按规则（`rule_name` 快照，Top5 失败最多）；按维度（三表关联到 `dq_rule_template.dimension`）。

**备选**：新建报告表 + 定时预计算。可灵活扩展指标，但增加表与任务维护成本，且当前指标可由现有表覆盖。**不采用**：当前需求无需预计算，实时聚合足够。

### D2. 图表库：复用 ECharts 5.3.2
项目已引入 `echarts@5.3.2`，趋势（柱+折）、分布（柱/饼）均用 ECharts 实现，不引入新依赖。

### D3. 时间粒度自适应
时间范围 ≤ 30 天按天聚合；> 30 天按周聚合，避免 X 轴粒度过细。粒度由后端根据起止时间差决定，前端仅渲染。

### D4. 后端接口形态
单一聚合接口 `GET /dq/report/aggregate`，参数 `startTime`/`endTime`，返回 `{ overview, trend, distribution }` 三段。单一接口降低前端请求数，且三类数据时间范围一致，天然适合合并。

**备选**：拆分为三个接口（overview/trend/distribution 各一）。更细粒度但增加请求数；当前页面同时需要三类数据，合并更合理。**不采用**。

### D5. 非法时间参数校验
后端校验 `startTime <= endTime`，非法时返回错误码与「起始时间不能晚于结束时间」提示（与前端校验双重保障）。

## Risks / Trade-offs

- **[维度分布关联成本]** → 按维度分布需三表 JOIN。**缓解**：对 `dq_check_result.rule_id`、`dq_rule.template_id` 走索引关联；数据量可控时性能可接受，后续若慢可加冗余字段或缓存。
- **[时间范围过大导致聚合慢]** → 用户选超长时间范围时聚合压力大。**缓解**：前端限制最大范围（如不超过 1 年），后端按 D3 自动切换周粒度减少数据点。
- **[执行记录与报告口径一致性]** → 报告「检测总量」必须可由执行记录页复核。**缓解**：聚合口径在 spec 中明确定义（基于 `dq_check_result` + 执行记录时间过滤），验证阶段做交叉核对。

## Migration Plan

1. 后端：新增 `DqReportController` / `DqReportService` / Mapper SQL；新增 `sys_menu` 菜单数据（status=1，order 在规则模板之后）。
2. 前端：新增 `reportApi.js`、`src/views/dataquality/report/index.vue`、路由。
3. 无数据迁移（不建新表），无存量行为变更，回滚只需移除新接口/页面/菜单数据。

## Open Questions

- 按维度分布 JOIN 路径较长，是否需要为 `dq_check_result` 冗余 `dimension` 字段以简化查询（当前先走 JOIN，性能不足时再冗余）。可后续验证阶段确认。
