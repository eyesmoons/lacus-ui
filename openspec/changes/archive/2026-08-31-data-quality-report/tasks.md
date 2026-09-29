## 1. 后端：报告聚合接口

- [x] 1.1 新增 `DqReportController`，提供 `GET /dq/report/aggregate` 接口，参数 `startTime`/`endTime`，校验起始不晚于结束，非法返回错误码与提示。验证：用合法/非法时间参数分别请求，合法返回聚合数据，非法返回明确错误。
- [x] 1.2 新增 `DqReportService` 与 Mapper SQL，从 `dq_execution_log` 与 `dq_check_result` 聚合概览（检测总量/通过数/失败数/通过率/执行成功数/执行失败数）、趋势（≤30 天按天、>30 天按周）、分布（按规则 Top5 失败最多、按维度关联 `dq_rule`→`dq_rule_template.dimension`）。验证：构造已知数据请求，核对返回与预期聚合结果一致。
- [x] 1.3 编写报告聚合单元/集成测试，覆盖：正常聚合、无数据（通过率显示—）、非法时间参数、按周聚合切换。验证：测试全部通过。

## 2. 后端：菜单数据

- [x] 2.1 在 `lacus.sql` 中新增「数据质量报告」`sys_menu` 数据，`status=1`（正常），order 在规则模板之后，权限标识 `dq:report:list`，并附 `UPDATE` 兜底语句。验证：SQL 执行后菜单行存在且 status=1。

## 3. 前端：报告页面

- [x] 3.1 新增 `src/api/dataquality/reportApi.js`，封装 `getReportAggregate({ startTime, endTime })` 调用 `/dq/report/aggregate`。验证：函数返回 Promise，URL 与参数正确。
- [x] 3.2 新增 `src/views/dataquality/report/index.vue`：时间范围选择器（近 7 天/近 30 天/自定义，默认近 7 天，校验起始≤结束）、概览卡片（检测总量/通过数/失败数/通过率/执行成功/失败，无数据通过率显示—）。验证：页面渲染，切换时间范围触发加载。
- [x] 3.3 在报告页集成 ECharts 趋势图（检测量柱+通过率折线）与分布图（按规则 Top5 / 按维度，可切换）。验证：图随时间范围正确渲染，>30 天自动按周聚合。
- [x] 3.4 新增路由，挂于数据质量模块下，`hidden:true`（后端驱动菜单）。验证：路由注册后可通过 URL 访问报告页。

## 4. 测试与一致性验证

- [x] 4.1 编写报告页前端测试（时间范围默认值、自定义校验、无数据通过率展示）。验证：测试通过。
- [x] 4.2 交叉核对：报告页「检测总量/通过数/失败数」与执行记录页按相同范围查询结果一致。验证：数据口径一致，无矛盾。
