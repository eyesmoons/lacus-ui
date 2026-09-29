<template>
    <div class="app-container">
        <el-form :inline="true" v-show="showSearch" label-width="90px">
            <el-form-item label="时间区间">
                <el-radio-group v-model="queryParams.range" @change="loadAll">
                    <el-radio-button label="1h">近1小时</el-radio-button>
                    <el-radio-button label="24h">近24小时</el-radio-button>
                    <el-radio-button label="7d">近7天</el-radio-button>
                    <el-radio-button label="custom">自定义</el-radio-button>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="自定义区间" v-if="queryParams.range === 'custom'">
                <el-date-picker v-model="customRange" type="datetimerange" range-separator="至"
                                start-placeholder="开始时间" end-placeholder="结束时间" value-format="YYYY-MM-DD HH:mm:ss"/>
            </el-form-item>
            <el-form-item label="数据源">
                <el-select v-model="queryParams.datasourceId" placeholder="请选择数据源" clearable>
                    <el-option v-for="item in datasourceOptions" :key="item.datasourceId"
                               :label="item.datasourceName" :value="item.datasourceId"/>
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" icon="Search" @click="loadAll">查询</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="16" class="stat-cards">
            <el-col :span="6">
                <el-card><div class="stat-num">{{ summary.totalCount || 0 }}</div><div class="stat-label">调用总量</div></el-card>
            </el-col>
            <el-col :span="6">
                <el-card><div class="stat-num">{{ ((summary.successCount / (summary.totalCount || 1)) * 100).toFixed(2) }}%</div><div class="stat-label">成功率</div></el-card>
            </el-col>
            <el-col :span="6">
                <el-card><div class="stat-num">{{ summary.avgCost || 0 }} ms</div><div class="stat-label">平均耗时</div></el-card>
            </el-col>
            <el-col :span="6">
                <el-card><div class="stat-num">{{ summary.failCount || 0 }}</div><div class="stat-label">失败次数</div></el-card>
            </el-col>
        </el-row>

        <el-card class="trend-card">
            <template #header>调用趋势</template>
            <div ref="trendChartRef" class="chart-box"></div>
        </el-card>

        <el-card class="top-card">
            <template #header>Top 调用接口（前 10）</template>
            <el-table :data="summary.topApis || []" stripe border>
                <el-table-column label="排名" type="index" width="80" align="center"/>
                <el-table-column label="接口名称" prop="apiName" align="left"/>
                <el-table-column label="调用次数" prop="callCount" align="center" sortable/>
                <el-table-column label="错误率" align="center">
                    <template #default="scope">{{ (scope.row.errorRate * 100).toFixed(2) }}%</template>
                </el-table-column>
            </el-table>
        </el-card>
    </div>
</template>

<script setup>
import {onMounted, onBeforeUnmount, reactive, ref, nextTick} from 'vue';
import {ElMessage} from 'element-plus';
import * as echarts from 'echarts';
import {getStatsSummary, getStatsTrend} from '@/api/oneapi/statsApi';
import {getDatasourceList} from '@/api/metadata/datasourceApi';

const showSearch = ref(true);
const summary = ref({});
const datasourceOptions = ref([]);
const trendChartRef = ref(null);
let trendChart = null;
const customRange = ref([]);

const queryParams = reactive({
    range: '24h',
    datasourceId: undefined,
    startTime: undefined,
    endTime: undefined,
});

function buildParams() {
    if (queryParams.range === 'custom') {
        if (!customRange.value || customRange.value.length !== 2) {
            ElMessage.warning('请选择有效的起止时间');
            return null;
        }
        if (new Date(customRange.value[1]) < new Date(customRange.value[0])) {
            ElMessage.warning('结束时间不能早于开始时间');
            return null;
        }
        queryParams.startTime = customRange.value[0];
        queryParams.endTime = customRange.value[1];
    } else {
        queryParams.startTime = undefined;
        queryParams.endTime = undefined;
    }
    return {...queryParams};
}

function loadSummary(params) {
    return getStatsSummary(params).then((res) => {
        summary.value = res.data || res || {};
    });
}

function loadTrend(params) {
    return getStatsTrend(params).then((res) => {
        const data = res.data || res || {};
        const buckets = data.buckets || [];
        nextTick(() => {
            if (!trendChartRef.value) return;
            if (!trendChart) trendChart = echarts.init(trendChartRef.value, 'macarons');
            trendChart.setOption({
                tooltip: {trigger: 'axis'},
                legend: {data: ['调用次数', '平均耗时', '错误数']},
                xAxis: {type: 'category', data: buckets.map((b) => b.time)},
                yAxis: [
                    {type: 'value', name: '次数'},
                    {type: 'value', name: '耗时(ms)'},
                ],
                series: [
                    {name: '调用次数', type: 'line', data: buckets.map((b) => b.callCount), smooth: true},
                    {name: '平均耗时', type: 'line', yAxisIndex: 1, data: buckets.map((b) => b.avgCost), smooth: true},
                    {name: '错误数', type: 'line', data: buckets.map((b) => b.failCount), smooth: true},
                ],
            });
        });
    });
}

function loadAll() {
    const params = buildParams();
    if (!params) return;
    Promise.all([loadSummary(params), loadTrend(params)])
        .catch(() => ElMessage.error('查询统计数据失败'));
}

function onResize() {
    trendChart && trendChart.resize();
}

onMounted(() => {
    getDatasourceList('', null).then((r) => (datasourceOptions.value = r || [])).catch(() => {});
    loadAll();
    window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize);
    if (trendChart) {
        trendChart.dispose();
        trendChart = null;
    }
});
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
.top-card {
    margin-top: 16px;
}
</style>
