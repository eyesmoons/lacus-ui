<template>
  <div class="home-console" v-loading="loading">
    <header class="brand-hero">
      <div class="brand-hero__deco" aria-hidden="true"></div>
      <div class="brand-hero__left">
        <p class="brand-hero__greeting">{{ greeting }}，{{ displayName }}</p>
        <h1 class="brand-hero__title">Lacus 数据平台工作台</h1>
        <p class="brand-hero__desc">采集 · 计算 · 质量 · 服务化，一站式数据开发治理平台</p>
      </div>
      <div class="brand-hero__meta">
        <span class="brand-hero__date">{{ todayText }}</span>
        <span class="brand-hero__updated" v-if="updatedAt">更新于 {{ updatedAt }}</span>
        <el-button class="brand-hero__refresh" round :icon="Refresh" @click="loadDashboard">刷新</el-button>
      </div>
    </header>

    <el-alert
      v-if="loadError"
      class="load-alert"
      type="error"
      show-icon
      :closable="false"
      title="工作台数据加载失败"
      description="无法获取仪表盘聚合数据，请确认后端服务可用后点击右上角刷新重试。"
    />

    <section class="kpi-grid">
      <article v-for="card in kpiCards" :key="card.label" class="kpi-card" @click="go(card.path)">
        <div class="kpi-card__icon" :style="{ background: card.tint, color: card.color }">
          <el-icon :size="20"><component :is="card.icon" /></el-icon>
        </div>
        <span class="kpi-card__label">{{ card.label }}</span>
        <strong class="kpi-card__value">{{ formatCount(card.value) }}</strong>
        <span class="kpi-card__sub" v-if="card.sub">
          <i v-if="card.alert" class="kpi-card__dot"></i>{{ card.sub }}
        </span>
      </article>
    </section>

    <el-row :gutter="14" class="chart-row">
      <el-col :lg="16" :sm="24">
        <section class="panel">
          <div class="panel__head">
            <h3 class="panel__title">任务运行趋势</h3>
            <span class="panel__hint">近 7 天</span>
          </div>
          <div ref="trendChartEl" class="panel__chart" v-show="!loadError"></div>
          <el-empty v-if="loadError" description="暂无趋势数据" :image-size="72" />
        </section>
      </el-col>
      <el-col :lg="8" :sm="24">
        <section class="panel">
          <div class="panel__head">
            <h3 class="panel__title">实例状态分布</h3>
            <span class="panel__hint">近 7 天</span>
          </div>
          <div ref="donutChartEl" class="panel__chart" v-show="!loadError"></div>
          <el-empty v-if="loadError" description="暂无状态数据" :image-size="72" />
        </section>
      </el-col>
    </el-row>

    <section class="health-strip" v-if="health">
      <div class="health-pill" @click="go('/monitor/server')">
        <span class="health-pill__label">CPU 使用率</span>
        <strong class="health-pill__value">{{ formatPercent(health.cpuUsage) }}</strong>
        <el-progress
          :percentage="toPercent(health.cpuUsage)"
          :stroke-width="4"
          :show-text="false"
          :status="healthStatus(health.cpuUsage)"
        />
      </div>
      <div class="health-pill" @click="go('/monitor/server')">
        <span class="health-pill__label">服务器内存</span>
        <strong class="health-pill__value">
          {{ health.memoryUsed ?? '--' }} / {{ health.memoryTotal ?? '--' }}G
        </strong>
        <el-progress
          :percentage="memoryPercent"
          :stroke-width="4"
          :show-text="false"
          :status="healthStatus(memoryPercent)"
        />
      </div>
      <div class="health-pill" @click="go('/monitor/server')">
        <span class="health-pill__label">JVM 已用</span>
        <strong class="health-pill__value">{{ health.jvmUsed ?? '--' }}M / {{ health.jvmMax ?? '--' }}M</strong>
        <el-progress
          :percentage="jvmPercent"
          :stroke-width="4"
          :show-text="false"
          :status="healthStatus(jvmPercent)"
        />
      </div>
    </section>

    <el-row :gutter="14" class="list-row">
      <el-col :lg="15" :sm="24">
        <section class="panel">
          <div class="panel__head">
            <h3 class="panel__title">近期任务实例</h3>
            <span class="panel__hint">四引擎最新 8 条</span>
          </div>
          <el-table :data="recentInstances" size="small" class="instance-table" empty-text="暂无实例记录">
            <el-table-column label="来源" width="90">
              <template #default="{ row }">
                <el-tag size="small" effect="plain" :type="sourceType(row.source)">{{ row.source }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="实例名称" min-width="180" show-overflow-tooltip>
              <template #default="{ row }">{{ row.name }}</template>
            </el-table-column>
            <el-table-column label="状态" width="96">
              <template #default="{ row }">
                <el-tag size="small" :type="statusMeta(row.statusGroup, row.rawStatus).type">
                  {{ statusMeta(row.statusGroup, row.rawStatus).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ parseTime(row.time, '{y}-{m}-{d} {h}:{i}') }}</template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openInstance(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </el-col>
      <el-col :lg="9" :sm="24">
        <section class="panel panel--alerts">
          <div class="panel__head">
            <h3 class="panel__title">最近告警</h3>
            <el-button link type="primary" size="small" @click="go('/monitor/alert/record')">全部</el-button>
          </div>
          <ul class="alert-list" v-if="recentAlerts.length">
            <li v-for="item in recentAlerts" :key="item.id" class="alert-item">
              <el-tag size="small" :type="alertLevelType(item.alertLevel)" effect="dark" class="alert-item__level">
                {{ item.alertLevel }}
              </el-tag>
              <div class="alert-item__body">
                <p class="alert-item__title" :title="item.title">{{ item.title }}</p>
                <p class="alert-item__meta">
                  {{ item.groupName }} · {{ parseTime(item.requestedTime, '{m}-{d} {h}:{i}') }}
                </p>
              </div>
            </li>
          </ul>
          <el-empty v-else description="暂无告警" :image-size="72" />
        </section>
      </el-col>
    </el-row>

    <section class="quick-actions">
      <button v-for="action in quickActions" :key="action.label" class="quick-action" @click="go(action.path)">
        <el-icon :size="16"><component :is="action.icon" /></el-icon>
        <span>{{ action.label }}</span>
      </button>
    </section>
  </div>
</template>

<script setup name="Index">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { Refresh } from '@element-plus/icons-vue';
import { parseTime } from '@/utils/dateUtil';
import * as echarts from 'echarts';
import { getDashboard } from '@/api/monitor/dashboardApi';

const router = useRouter();
const store = useStore();
const loading = ref(false);
const loadError = ref(false);
const updatedAt = ref('');
const dashboard = ref(null);
const recentInstances = ref([]);
const recentAlerts = ref([]);

const trendChartEl = ref(null);
const donutChartEl = ref(null);
let trendChart = null;
let donutChart = null;

const BRAND_COLOR = '#2563eb';
const STATUS_COLORS = {
  SUCCESS: '#16a34a',
  FAILED: '#dc2626',
  RUNNING: '#2563eb',
  WAITING: '#d97706',
  STOPPED: '#86909c',
};
const STATUS_LABELS = {
  SUCCESS: '成功',
  FAILED: '失败',
  RUNNING: '运行中',
  WAITING: '等待中',
  STOPPED: '已停止',
};

const displayName = computed(() => store.getters.name || '用户');
const health = computed(() => dashboard.value?.health || null);

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const todayText = computed(() => {
  return new Intl.DateTimeFormat('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
});

const kpiCards = computed(() => {
  const r = dashboard.value?.resources;
  const hasRunning = (running) => running !== null && running !== undefined && running > 0;
  return [
    { label: '数据源', icon: 'Coin', path: '/metadata/datasource', value: r?.datasourceTotal, sub: r ? `启用 ${r.datasourceEnabled ?? '--'}` : '', tint: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' },
    { label: '实时采集', icon: 'Connection', path: '/datasync/job', value: r?.datasyncJobTotal, sub: runningSub(r?.datasyncRunning), alert: hasRunning(r?.datasyncRunning), tint: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' },
    { label: 'Flink 任务', icon: 'Monitor', path: '/flink/job', value: r?.flinkJobTotal, sub: runningSub(r?.flinkRunning), alert: hasRunning(r?.flinkRunning), tint: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' },
    { label: 'Spark 任务', icon: 'Odometer', path: '/spark/job', value: r?.sparkJobTotal, sub: runningSub(r?.sparkRunning), alert: hasRunning(r?.sparkRunning), tint: 'rgba(217, 119, 6, 0.1)', color: '#d97706' },
    { label: '数据集成', icon: 'Share', path: '/dig/job', value: r?.digJobTotal, sub: runningSub(r?.digRunning), alert: hasRunning(r?.digRunning), tint: 'rgba(134, 144, 156, 0.12)', color: '#606266' },
    { label: '统一 API', icon: 'Link', path: '/oneapi/oneapi', value: r?.apiTotal, sub: r ? `已发布 ${r.apiPublished ?? '--'}` : '', tint: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' },
    { label: '质量规则', icon: 'Finished', path: '/dataquality/rule', value: r?.qualityRuleTotal, sub: '', tint: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' },
    { label: '调度管理', icon: 'Clock', path: '/dataquality/schedule', value: null, sub: '', tint: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
  ];
});

const quickActions = [
  { label: '新建采集任务', icon: 'Plus', path: '/datasync/job-manager/addJob' },
  { label: '新建 Flink SQL', icon: 'Monitor', path: '/flink/job/add/STREAMING_SQL' },
  { label: '新建 Spark SQL', icon: 'Odometer', path: '/spark/job/add/sql' },
  { label: '数据集成任务', icon: 'Share', path: '/dig/job' },
  { label: '数据源管理', icon: 'Coin', path: '/metadata/datasource' },
  { label: '发布 API', icon: 'Link', path: '/oneapi/oneapi' },
];

function runningSub(running) {
  if (running === null || running === undefined) return '';
  return `运行中 ${running}`;
}

function formatCount(value) {
  if (value === null || value === undefined) return '--';
  return value;
}

function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '--';
  return `${value}%`;
}

function toPercent(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.min(100, Math.max(0, Math.round(num)));
}

const memoryPercent = computed(() => {
  const used = Number(health.value?.memoryUsed);
  const total = Number(health.value?.memoryTotal);
  if (!used || !total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
});

const jvmPercent = computed(() => {
  const used = Number(health.value?.jvmUsed);
  const max = Number(health.value?.jvmMax);
  if (!used || !max) return 0;
  return Math.min(100, Math.round((used / max) * 100));
});

function healthStatus(value) {
  const num = Number(value);
  if (num >= 90) return 'exception';
  if (num >= 75) return 'warning';
  return undefined;
}

function statusMeta(statusGroup, rawStatus) {
  if (statusGroup && STATUS_LABELS[statusGroup]) {
    return { label: STATUS_LABELS[statusGroup], type: statusType(statusGroup) };
  }
  return { label: rawStatus || '--', type: 'info' };
}

function statusType(statusGroup) {
  switch (statusGroup) {
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'RUNNING':
      return '';
    case 'WAITING':
      return 'warning';
    default:
      return 'info';
  }
}

function sourceType(source) {
  switch (source) {
    case 'Flink':
      return '';
    case 'Spark':
      return 'success';
    case '采集':
      return 'warning';
    case '集成':
      return 'info';
    default:
      return '';
  }
}

function alertLevelType(level) {
  if (level === 'CRITICAL' || level === 'ERROR') return 'danger';
  if (level === 'WARN') return 'warning';
  if (level === 'INFO') return 'info';
  return '';
}

function go(path) {
  if (path) router.push(path);
}

function openInstance(row) {
  if (row.trackingUrl) {
    window.open(row.trackingUrl);
    return;
  }
  if (row.path) router.push(row.path);
}

async function loadDashboard() {
  loading.value = true;
  loadError.value = false;
  try {
    const payload = await getDashboard({ days: 7 });
    dashboard.value = payload || {};
    recentInstances.value = payload?.recentInstances || [];
    recentAlerts.value = payload?.recentAlerts || [];
    updatedAt.value = payload?.generatedAt ? parseTime(new Date(payload.generatedAt)) : parseTime(new Date());
    await nextTick();
    renderCharts();
  } catch (e) {
    loadError.value = true;
    dashboard.value = null;
    recentInstances.value = [];
    recentAlerts.value = [];
  } finally {
    loading.value = false;
  }
}

function renderCharts() {
  const trend = dashboard.value?.trend || [];
  const distribution = dashboard.value?.statusDistribution?.recent || [];
  renderTrendChart(trend);
  renderDonutChart(distribution);
}

function renderTrendChart(trend) {
  if (!trendChartEl.value) return;
  if (!trendChart) {
    trendChart = echarts.init(trendChartEl.value);
  }
  const dates = trend.map((item) => (item.date || '').slice(5));
  trendChart.setOption(
    {
      color: [STATUS_COLORS.SUCCESS, STATUS_COLORS.FAILED, '#c0d1ff', BRAND_COLOR],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value) => (value === null || value === undefined ? '--' : value),
      },
      legend: {
        bottom: 0,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      grid: { left: 8, right: 8, top: 36, bottom: 32, containLabel: true },
      xAxis: {
        type: 'category',
        data: dates,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b' },
      },
      yAxis: [
        {
          type: 'value',
          minInterval: 1,
          axisLabel: { color: '#64748b' },
          splitLine: { lineStyle: { color: '#f1f5f9' } },
        },
        {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: { color: '#64748b', formatter: '{value}%' },
          splitLine: { show: false },
        },
      ],
      series: [
        { name: '成功', type: 'bar', stack: 'total', barMaxWidth: 28, data: trend.map((i) => i.success) },
        { name: '失败', type: 'bar', stack: 'total', data: trend.map((i) => i.failed) },
        { name: '其他', type: 'bar', stack: 'total', itemStyle: { borderRadius: [3, 3, 0, 0] }, data: trend.map((i) => i.others) },
        {
          name: '成功率',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 6,
          data: trend.map((i) => i.successRate),
          tooltip: { valueFormatter: (value) => (value === null || value === undefined ? '--' : `${value}%`) },
        },
      ],
    },
    true
  );
}

function renderDonutChart(distribution) {
  if (!donutChartEl.value) return;
  if (!donutChart) {
    donutChart = echarts.init(donutChartEl.value);
  }
  const data = distribution.map((item) => ({
    name: STATUS_LABELS[item.category] || item.category,
    value: item.count,
    itemStyle: { color: STATUS_COLORS[item.category] || '#86909c' },
  }));
  const total = distribution.reduce((sum, item) => sum + (item.count || 0), 0);
  donutChart.setOption(
    {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      title: {
        text: `${total}`,
        subtext: '实例总数',
        left: 'center',
        top: '36%',
        textStyle: { fontSize: 24, fontWeight: 600, color: '#1e293b' },
        subtextStyle: { fontSize: 12, color: '#64748b' },
      },
      series: [
        {
          name: '状态分布',
          type: 'pie',
          radius: ['58%', '78%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: false },
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.15)' },
          },
          data,
        },
      ],
    },
    true
  );
}

function handleResize() {
  if (trendChart) trendChart.resize();
  if (donutChart) donutChart.resize();
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
  loadDashboard();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (trendChart) {
    trendChart.dispose();
    trendChart = null;
  }
  if (donutChart) {
    donutChart.dispose();
    donutChart = null;
  }
});
</script>

<style scoped lang="scss">
.home-console {
  padding: 20px 24px 28px;
  min-height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  overflow-y: auto;
  background: var(--el-bg-color-page, #f5f7fb);
  box-sizing: border-box;
}

.brand-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding: 26px 30px;
  margin-bottom: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #123c8c 0%, #3b6fe0 100%);
  color: #fff;
}

.brand-hero__deco {
  position: absolute;
  top: -70px;
  right: 12%;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102, 217, 255, 0.35) 0%, rgba(102, 217, 255, 0) 68%);
  pointer-events: none;
}

.brand-hero__greeting {
  margin: 0 0 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.78);
}

.brand-hero__title {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.brand-hero__desc {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.brand-hero__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.brand-hero__date {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.brand-hero__updated {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.brand-hero__refresh {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.45);
  color: #fff;

  &:hover,
  &:focus {
    background: rgba(255, 255, 255, 0.26);
    border-color: rgba(255, 255, 255, 0.65);
    color: #fff;
  }
}

.load-alert {
  margin-bottom: 16px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--el-bg-color, #fff);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.1);
  }
}

.kpi-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 9px;
  margin-bottom: 10px;
}

.kpi-card__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.kpi-card__value {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.kpi-card__sub {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kpi-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-warning);
}

.chart-row,
.list-row {
  margin-bottom: 16px;
}

.panel {
  height: 100%;
  padding: 16px 18px;
  background: var(--el-bg-color, #fff);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  box-sizing: border-box;
}

.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.panel__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.panel__chart {
  width: 100%;
  height: 320px;
}

.health-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.health-pill {
  padding: 12px 16px;
  background: var(--el-bg-color, #fff);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  cursor: pointer;

  &:hover {
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.09);
  }
}

.health-pill__label {
  display: block;
  margin-bottom: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.health-pill__value {
  display: block;
  margin-bottom: 8px;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.instance-table {
  width: 100%;
}

.alert-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  gap: 10px;
  padding: 10px 2px;

  & + & {
    border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  }
}

.alert-item__level {
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-item__body {
  min-width: 0;
}

.alert-item__title {
  margin: 0 0 2px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.alert-item__meta {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.quick-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 999px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.12);
  }
}

@media (max-width: 992px) {
  .home-console {
    max-height: none;
    height: auto;
  }

  .brand-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .brand-hero__meta {
    flex-direction: row;
    align-items: center;
  }
}
</style>
