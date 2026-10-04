<template>
    <div class="app-container">
        <el-row :gutter="20">
            <el-col :span="24">
                <el-card class="box-card">
                    <template #header>
                        <div class="card-header">
                            <span><i class="el-icon-s-data"></i> 训练进度</span>
                            <div>
                                <el-button text @click="$router.push('/lake-intelligence/training/new')">
                                    <i class="el-icon-back"></i> 返回配置
                                </el-button>
                                <el-button
                                    type="danger"
                                    plain
                                    @click="handleCancel"
                                    v-if="!isFinished"
                                >
                                    <i class="el-icon-video-pause"></i> 取消训练
                                </el-button>
                            </div>
                        </div>
                    </template>
                    <p class="text-muted mb-4">实时监控模型训练状态与损失曲线</p>

                    <!-- 状态卡片 -->
                    <el-row :gutter="20" class="status-row">
                        <el-col :span="6">
                            <el-card shadow="hover" class="status-card">
                                <div class="status-label">状态</div>
                                <div class="status-value">
                                    <el-tag :type="statusTagType" size="large">{{ statusText }}</el-tag>
                                </div>
                            </el-card>
                        </el-col>
                        <el-col :span="6">
                            <el-card shadow="hover" class="status-card">
                                <div class="status-label">当前轮次</div>
                                <div class="status-value text-primary">{{ currentEpoch }} / {{ totalEpochs }}</div>
                            </el-card>
                        </el-col>
                        <el-col :span="6">
                            <el-card shadow="hover" class="status-card">
                                <div class="status-label">训练损失</div>
                                <div class="status-value text-info">{{ trainLossDisplay }}</div>
                            </el-card>
                        </el-col>
                        <el-col :span="6">
                            <el-card shadow="hover" class="status-card">
                                <div class="status-label">验证损失</div>
                                <div class="status-value text-warning">{{ valLossDisplay }}</div>
                            </el-card>
                        </el-col>
                    </el-row>

                    <!-- 进度条 -->
                    <el-card shadow="never" class="mt-3">
                        <div class="progress-header">
                            <span>训练进度</span>
                            <span class="text-muted">{{ progressPct }}%</span>
                        </div>
                        <el-progress
                            :percentage="progressPct"
                            :stroke-width="24"
                            :status="progressStatus"
                            striped
                            striped-flow
                        />
                        <div class="text-muted small mt-2">{{ progressMessage }}</div>
                    </el-card>

                    <!-- 损失曲线 -->
                    <el-card shadow="never" class="mt-3">
                        <template #header>
                            <span><i class="el-icon-data-line"></i> 损失曲线</span>
                        </template>
                        <div ref="chartRef" style="height: 300px; width: 100%;"></div>
                    </el-card>

                    <!-- 训练完成操作 -->
                    <el-alert
                        v-if="isCompleted"
                        title="训练完成"
                        type="success"
                        description="模型已保存，可以开始构建向量库"
                        show-icon
                        :closable="false"
                        class="mt-3"
                    >
                        <template #default>
                            <el-button type="success" @click="$router.push('/lake-intelligence/vector/build')">
                                <i class="el-icon-data-analysis"></i> 构建向量库
                            </el-button>
                        </template>
                    </el-alert>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';
import { getProgress, cancelTraining } from '@/api/lakeintelligence/train';

const route = useRoute();
const router = useRouter();

const taskId = ref(null);
const pollTimer = ref(null);
const chartRef = ref(null);
const chartInstance = ref(null);
const taskStatus = ref('PENDING');
const currentEpoch = ref(0);
const totalEpochs = ref(0);
const trainLoss = ref(null);
const valLoss = ref(null);
const progressMessage = ref('');
const lossHistory = ref([]);

const statusMap = {
    training: { text: '训练中', type: 'primary' },
    PENDING: { text: '等待中', type: 'info' },
    completed: { text: '已完成', type: 'success' },
    COMPLETED: { text: '已完成', type: 'success' },
    failed: { text: '失败', type: 'danger' },
    FAILED: { text: '失败', type: 'danger' },
    cancelled: { text: '已取消', type: 'warning' },
    CANCELLED: { text: '已取消', type: 'warning' },
};

const statusText = computed(() => statusMap[taskStatus.value]?.text || taskStatus.value);
const statusTagType = computed(() => statusMap[taskStatus.value]?.type || 'info');
const trainLossDisplay = computed(() => (trainLoss.value != null ? trainLoss.value.toFixed(4) : '-'));
const valLossDisplay = computed(() => (valLoss.value != null ? valLoss.value.toFixed(4) : '-'));

const progressPct = computed(() => {
    if (!totalEpochs.value) return 0;
    return Math.round((currentEpoch.value / totalEpochs.value) * 100);
});

const progressStatus = computed(() => {
    if (taskStatus.value === 'completed' || taskStatus.value === 'COMPLETED') return 'success';
    if (taskStatus.value === 'failed' || taskStatus.value === 'FAILED') return 'exception';
    return '';
});

const isFinished = computed(() => {
    const s = taskStatus.value;
    return ['completed', 'COMPLETED', 'failed', 'FAILED', 'cancelled', 'CANCELLED'].includes(s);
});

const isCompleted = computed(() => {
    return taskStatus.value === 'completed' || taskStatus.value === 'COMPLETED';
});

function initChart() {
    if (!chartRef.value) return;
    chartInstance.value = echarts.init(chartRef.value);
    updateChart();
}

function updateChart() {
    if (!chartInstance.value) return;
    chartInstance.value.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['训练损失', '验证损失'] },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            name: '轮次',
            data: lossHistory.value.map((_, i) => i + 1),
        },
        yAxis: { type: 'value', name: '损失值' },
        series: [
            {
                name: '训练损失',
                type: 'line',
                data: lossHistory.value.map((item) => item.trainLoss),
                smooth: true,
                itemStyle: { color: '#409EFF' },
                areaStyle: { color: 'rgba(64, 158, 255, 0.1)' },
            },
            {
                name: '验证损失',
                type: 'line',
                data: lossHistory.value.map((item) => item.valLoss),
                smooth: true,
                itemStyle: { color: '#E6A23C' },
                areaStyle: { color: 'rgba(230, 162, 60, 0.1)' },
            },
        ],
    });
}

async function pollProgress() {
    if (!taskId.value) return;
    try {
        const data = await getProgress(taskId.value);
        taskStatus.value = data.status;
        currentEpoch.value = data.progress || data.currentEpoch || 0;
        totalEpochs.value = data.total || data.totalEpochs || 0;
        if (data.trainLoss != null) trainLoss.value = data.trainLoss;
        if (data.valLoss != null) valLoss.value = data.valLoss;
        if (data.message) progressMessage.value = data.message;

        if (data.lossHistory) {
            let history = data.lossHistory;
            if (typeof history === 'string') {
                try { history = JSON.parse(history); } catch (e) { history = []; }
            }
            if (Array.isArray(history)) {
                lossHistory.value = history;
                updateChart();
            }
        }

        if (['training', 'PENDING'].includes(data.status)) {
            pollTimer.value = setTimeout(pollProgress, 2000);
        }
    } catch (err) {
        progressMessage.value = '获取进度失败：' + err.message;
        pollTimer.value = setTimeout(pollProgress, 5000);
    }
}

function handleCancel() {
    if (!taskId.value) return;
    ElMessageBox.confirm('确认取消当前训练任务？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    })
        .then(() => cancelTraining(taskId.value))
        .then(() => {
            ElMessage.success('训练任务已取消');
            if (pollTimer.value) clearTimeout(pollTimer.value);
        })
        .catch(() => {});
}

onMounted(() => {
    taskId.value = route.params.id;
    if (taskId.value) {
        nextTick(() => {
            initChart();
        });
        pollProgress();
    }
    window.addEventListener('resize', handleResize);
});

function handleResize() {
    if (chartInstance.value) {
        chartInstance.value.resize();
    }
}

onUnmounted(() => {
    if (pollTimer.value) clearTimeout(pollTimer.value);
    if (chartInstance.value) {
        chartInstance.value.dispose();
        chartInstance.value = null;
    }
    window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.app-container {
    padding: 20px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.text-muted {
    color: #909399;
}

.mb-4 {
    margin-bottom: 16px;
}

.mt-3 {
    margin-top: 12px;
}

.status-row {
    margin-bottom: 16px;
}

.status-card {
    text-align: center;
}

.status-label {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
}

.status-value {
    font-size: 20px;
    font-weight: bold;
}

.text-primary {
    color: #409EFF;
}

.text-info {
    color: #909399;
}

.text-warning {
    color: #E6A23C;
}

.progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
}

.small {
    font-size: 12px;
}
</style>
