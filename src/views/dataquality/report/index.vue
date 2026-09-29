<template>
    <div class="app-container" v-loading="loading">
        <!-- 时间选择器 -->
        <el-form :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="时间区间">
                <el-radio-group v-model="queryParams.range" @change="loadAll">
                    <el-radio-button label="7d">近7天</el-radio-button>
                    <el-radio-button label="30d">近30天</el-radio-button>
                    <el-radio-button label="custom">自定义</el-radio-button>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="自定义区间" v-if="queryParams.range === 'custom'">
                <el-date-picker v-model="customRange" type="datetimerange" range-separator="至"
                                start-placeholder="开始时间" end-placeholder="结束时间"
                                value-format="YYYY-MM-DD HH:mm:ss"/>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="loadAll">查询</el-button>
            </el-form-item>
        </el-form>

        <!-- 概览卡片 -->
        <el-row :gutter="16" class="stat-cards">
            <el-col :span="4">
                <el-card><div class="stat-num">{{ overview.total || 0 }}</div><div class="stat-label">检测总量</div></el-card>
            </el-col>
            <el-col :span="4">
                <el-card><div class="stat-num">{{ overview.passed || 0 }}</div><div class="stat-label">通过</div></el-card>
            </el-col>
            <el-col :span="4">
                <el-card><div class="stat-num">{{ overview.failed || 0 }}</div><div class="stat-label">失败</div></el-card>
            </el-col>
            <el-col :span="4">
                <el-card><div class="stat-num">{{ overview.passRate == null ? '—' : overview.passRate + '%' }}</div><div class="stat-label">通过率</div></el-card>
            </el-col>
            <el-col :span="4">
                <el-card><div class="stat-num">{{ overview.execSuccess || 0 }}</div><div class="stat-label">执行成功</div></el-card>
            </el-col>
            <el-col :span="4">
                <el-card><div class="stat-num">{{ overview.execFailed || 0 }}</div><div class="stat-label">执行失败</div></el-card>
            </el-col>
        </el-row>

        <!-- 趋势图 -->
        <el-card class="trend-card">
            <template #header>检测趋势</template>
            <div v-if="overview.total === 0" class="empty-tip">暂无数据</div>
            <div v-else ref="trendChartRef" class="chart-box"></div>
        </el-card>

        <!-- 分布图 -->
        <el-card class="dist-card">
            <template #header>
                <div class="dist-header">
                    <span>失败分布</span>
                    <el-radio-group v-model="distType" size="small" @change="loadDistChart">
                        <el-radio-button label="rule">按规则</el-radio-button>
                        <el-radio-button label="dimension">按维度</el-radio-button>
                    </el-radio-group>
                </div>
            </template>
            <div v-if="overview.total === 0" class="empty-tip">暂无数据</div>
            <div v-else ref="distChartRef" class="chart-box"></div>
        </el-card>
    </div>
</template>

<script setup>
import {onMounted, onBeforeUnmount, reactive, ref, nextTick, watch} from 'vue';
import {ElMessage} from 'element-plus';
import * as echarts from 'echarts';
import {getReportAggregate} from '@/api/dataquality/reportApi';

const showSearch = ref(true);
const loading = ref(false);
const overview = ref({});
const trendBuckets = ref([]);
const distribution = ref({});
const distType = ref('rule');
const trendChartRef = ref(null);
const distChartRef = ref(null);
let trendChart = null;
let distChart = null;
const customRange = ref([]);

const queryParams = reactive({
    range: '7d',
    startTime: undefined,
    endTime: undefined,
});

// 格式化 Date 为 YYYY-MM-DD HH:mm:ss
function formatTime(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function buildParams() {
    if (queryParams.range === 'custom') {
        if (!customRange.value || customRange.value.length !== 2) {
            ElMessage.warning('请选择有效的起止时间');
            return null;
        }
        if (new Date(customRange.value[1]) < new Date(customRange.value[0])) {
            ElMessage.warning('起始时间不能晚于结束时间');
            return null;
        }
        queryParams.startTime = customRange.value[0];
        queryParams.endTime = customRange.value[1];
    } else {
        const now = new Date();
        const days = queryParams.range === '30d' ? 30 : 7;
        const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        queryParams.startTime = formatTime(start);
        queryParams.endTime = formatTime(now);
    }
    return {...queryParams};
}

function loadTrendChart() {
    nextTick(() => {
        if (!trendChartRef.value) return;
        if (!trendChart) trendChart = echarts.init(trendChartRef.value);
        const buckets = trendBuckets.value;
        trendChart.setOption({
            tooltip: {trigger: 'axis'},
            legend: {data: ['检测量', '通过率(%)']},
            xAxis: {type: 'category', data: buckets.map((b) => b.time)},
            yAxis: [
                {type: 'value', name: '检测量'},
                {type: 'value', name: '通过率(%)'},
            ],
            series: [
                {name: '检测量', type: 'bar', data: buckets.map((b) => b.count)},
                {name: '通过率(%)', type: 'line', yAxisIndex: 1, data: buckets.map((b) => b.passRate), smooth: true},
            ],
        });
    });
}

function loadDistChart() {
    nextTick(() => {
        if (!distChartRef.value) return;
        if (!distChart) distChart = echarts.init(distChartRef.value);
        const dist = distribution.value || {};
        let data = [];
        if (distType.value === 'rule') {
            data = (dist.byRule || []).slice(0, 5);
        } else {
            data = dist.byDimension || [];
        }
        distChart.setOption({
            tooltip: {trigger: 'axis'},
            xAxis: {type: 'category', data: data.map((d) => distType.value === 'rule' ? d.ruleName : d.dimension)},
            yAxis: {type: 'value', name: '失败数'},
            series: [{name: '失败数', type: 'bar', data: data.map((d) => d.fails)}],
        });
    });
}

function loadAll() {
    const params = buildParams();
    if (!params) return;
    loading.value = true;
    getReportAggregate(params)
        .then((res) => {
            const data = res.data || res || {};
            overview.value = data.overview || {};
            trendBuckets.value = data.trend?.buckets || [];
            distribution.value = data.distribution || {};
            loadTrendChart();
            loadDistChart();
        })
        .catch(() => ElMessage.error('查询报告数据失败'))
        .finally(() => {
            loading.value = false;
        });
}

function onResize() {
    trendChart && trendChart.resize();
    distChart && distChart.resize();
}

onMounted(() => {
    loadAll();
    window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    if (trendChart) {
        trendChart.dispose();
        trendChart = null;
    }
    if (distChart) {
        distChart.dispose();
        distChart = null;
    }
});

// When total drops to 0 the chart divs are removed from DOM (v-if), but the
// echarts instances would otherwise linger bound to the detached nodes. Dispose
// + null them so the next data-bearing load re-inits on the fresh divs; otherwise
// setOption renders to a detached node and both charts stay blank.
watch(
    () => overview.value.total,
    (t) => {
        if (t === 0) {
            if (trendChart) { trendChart.dispose(); trendChart = null; }
            if (distChart) { distChart.dispose(); distChart = null; }
        }
    },
);
</script>

<style scoped>
.app-container {
    padding: 20px;
}

.stat-cards {
    margin-bottom: 16px;
}

.stat-num {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
}

.stat-label {
    color: #909399;
    text-align: center;
    margin-top: 4px;
}

.chart-box {
    height: 320px;
}

.trend-card,
.dist-card {
    margin-top: 16px;
}

.dist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.empty-tip {
    text-align: center;
    color: #909399;
    padding: 40px 0;
}
</style>
