<template>
    <div class="app-container">
        <el-row :gutter="20">
            <el-col :span="24">
                <el-row class="mb8">
                    <el-button type="primary" plain @click="openDialog">
                        <i class="el-icon-plus"></i> 构建向量库
                    </el-button>
                    <el-button text @click="$router.push('/lake-intelligence/similarity/dataset/list')">
                        <i class="el-icon-back"></i> 返回
                    </el-button>
                </el-row>

                <el-card class="box-card">
                    <template #header>
                        <span><i class="el-icon-collection"></i> 已构建向量库</span>
                    </template>
                    <el-table :data="libraryList" v-loading="libraryLoading" stripe border>
                        <el-table-column label="ID" prop="indexId" width="70" align="center" />
                        <el-table-column label="名称" prop="indexName" align="left" />
                        <el-table-column label="集合名" prop="collectionName" align="left" width="160" />
                        <el-table-column label="数据集" prop="datasetName" align="left" width="140">
                            <template #default="scope">{{ scope.row.datasetName || scope.row.datasetId || '-' }}</template>
                        </el-table-column>
                        <el-table-column label="模型" prop="modelName" align="left" width="140">
                            <template #default="scope">{{ scope.row.modelName || scope.row.modelId || '-' }}</template>
                        </el-table-column>
                        <el-table-column label="向量数" prop="totalVectors" width="90" align="center" />
                        <el-table-column label="状态" width="110" align="center">
                            <template #default="scope">
                                <el-tag :type="statusTagType(scope.row.buildStatus)">{{ scope.row.buildStatus }}</el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="创建时间" width="160" align="center">
                            <template #default="scope">{{ parseTime(scope.row.createTime) }}</template>
                        </el-table-column>
                        <el-table-column label="操作" width="120" align="center" fixed="right">
                            <template #default="scope">
                                <el-button type="primary" link @click="useForSearch(scope.row)">去检索</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-card>
            </el-col>
        </el-row>

        <!-- 构建向量库 弹框 -->
        <el-dialog v-model="dialogVisible" title="构建向量库" width="560px" :close-on-click-modal="false">
            <template v-if="!building">
                <p class="text-muted mb-4">将图片库中的图像编码为向量索引，用于相似度检索</p>
                <el-form ref="buildFormRef" :model="form" :rules="rules" label-width="120px">
                    <el-form-item label="向量库名称" prop="indexName">
                        <el-input v-model="form.indexName" placeholder="例如：product_vectors" />
                    </el-form-item>
                    <el-form-item label="选择图片库" prop="datasetId">
                        <el-select v-model="form.datasetId" placeholder="请选择数据集" style="width: 100%">
                            <el-option
                                v-for="ds in datasetOptions"
                                :key="ds.datasetId"
                                :label="`${ds.datasetName} (${ds.imageCount || 0} 张)`"
                                :value="ds.datasetId"
                            />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="选择模型" prop="taskId">
                        <el-cascader
                            v-model="form.taskId"
                            :options="modelTreeOptions"
                            :props="{ emitPath: false, expandTrigger: 'hover' }"
                            placeholder="模型 / 训练任务"
                            style="width: 100%"
                            clearable
                        />
                    </el-form-item>
                    <el-form-item label="距离度量">
                        <el-select v-model="form.distanceMetric" style="width: 100%">
                            <el-option label="余弦相似度 (Cosine)" value="cosine" />
                            <el-option label="欧氏距离 (Euclidean)" value="euclidean" />
                        </el-select>
                    </el-form-item>
                    <el-form-item label="批次大小">
                        <el-input-number v-model="form.batchSize" :min="1" :max="256" />
                    </el-form-item>
                </el-form>
            </template>

            <!-- 构建进度 -->
            <template v-else>
                <div class="progress-header">
                    <span>{{ buildStatusText }}</span>
                    <span class="text-muted">{{ indexedCount }} / {{ totalCount }}</span>
                </div>
                <el-progress
                    :percentage="progressPct"
                    :stroke-width="24"
                    :status="progressStatus"
                    striped
                    striped-flow
                />
                <div class="text-muted small mt-2">{{ buildMessage }}</div>
                <el-alert
                    v-if="buildCompleted"
                    title="向量库构建完成"
                    type="success"
                    :description="`共索引 ${totalCount} 张图片`"
                    show-icon
                    :closable="false"
                    class="mt-3"
                />
            </template>

            <template #footer>
                <template v-if="!building">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="startBuild" :loading="loading">开始构建</el-button>
                </template>
                <el-button v-else @click="closeDialog">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, getCurrentInstance } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { buildVectors, getBuildProgress, listCollections } from '@/api/lakeintelligence/search';
import { listDatasets } from '@/api/lakeintelligence/dataset';
import { getModelTree } from '@/api/lakeintelligence/model';
import { parseTime } from '@/utils/dateUtil';

const route = useRoute();
const { proxy } = getCurrentInstance();

const buildFormRef = ref(null);
const loading = ref(false);
const dialogVisible = ref(false);
const building = ref(false);
const buildTimer = ref(null);
const currentBuildId = ref(null);
const buildStatus = ref('PENDING');
const indexedCount = ref(0);
const totalCount = ref(0);
const buildMessage = ref('');
const datasetOptions = ref([]);
const modelTreeOptions = ref([]);
const libraryList = ref([]);
const libraryLoading = ref(false);

const form = reactive({
    indexName: '',
    datasetId: null,
    taskId: null,
    distanceMetric: 'cosine',
    batchSize: 32,
});

const rules = {
    indexName: [{ required: true, message: '请输入向量库名称', trigger: 'blur' }],
    datasetId: [{ required: true, message: '请选择图片库', trigger: 'change' }],
    taskId: [{ required: true, message: '请选择模型 / 训练任务', trigger: 'change' }],
};

const buildStatusText = computed(() => {
    if (buildStatus.value === 'building' || buildStatus.value === 'BUILDING') return '构建中...';
    if (buildStatus.value === 'completed' || buildStatus.value === 'COMPLETED') return '构建完成';
    if (buildStatus.value === 'failed' || buildStatus.value === 'FAILED') return '构建失败';
    return '处理中';
});

const progressPct = computed(() => {
    if (!totalCount.value) return 0;
    return Math.round((indexedCount.value / totalCount.value) * 100);
});

const progressStatus = computed(() => {
    if (buildStatus.value === 'completed' || buildStatus.value === 'COMPLETED') return 'success';
    if (buildStatus.value === 'failed' || buildStatus.value === 'FAILED') return 'exception';
    return '';
});

const buildCompleted = computed(() => {
    return buildStatus.value === 'completed' || buildStatus.value === 'COMPLETED';
});

function loadDatasets() {
    listDatasets({ pageNum: 1, pageSize: 100, taskType: 'SIMILARITY' }).then((response) => {
        const list = response.rows || response.list || response || [];
        datasetOptions.value = list;
        const preselectId = route.query.datasetId;
        if (preselectId) {
            const found = list.find((ds) => String(ds.datasetId) === String(preselectId));
            if (found) form.datasetId = found.datasetId;
        }
    }).catch(() => {
        ElMessage.error('加载数据集列表失败');
    });
}

function loadModelTree() {
    getModelTree('SIMILARITY').then((res) => {
        const list = res || [];
        modelTreeOptions.value = list.map((m) => ({
            value: m.modelId,
            label: m.modelName,
            children: (m.tasks || []).map((t) => ({
                value: t.taskId,
                label: t.status ? `${t.taskName} (${t.status})` : t.taskName,
            })),
        }));
    }).catch(() => {
        ElMessage.error('加载模型列表失败');
    });
}

async function startBuild() {
    try {
        await proxy.$refs.buildFormRef.validate();
    } catch (e) {
        return;
    }

    loading.value = true;
    try {
        const payload = {
            indexName: form.indexName,
            datasetId: Number(form.datasetId),
            taskId: Number(form.taskId),
            batchSize: form.batchSize,
            distanceMetric: form.distanceMetric,
            creatorId: 'current-user',
        };
        const result = await buildVectors(payload);
        currentBuildId.value = result.indexId || result.taskId || result;
        ElMessage.success('向量构建任务已启动！');
        building.value = true;
        pollBuildProgress();
    } catch (err) {
        ElMessage.error('启动失败：' + err.message);
    } finally {
        loading.value = false;
    }
}

async function pollBuildProgress() {
    if (!currentBuildId.value) return;
    try {
        const data = await getBuildProgress(currentBuildId.value);
        buildStatus.value = data.status;
        indexedCount.value = data.progress || data.indexedCount || 0;
        totalCount.value = data.total || data.totalCount || 0;
        if (data.message) buildMessage.value = data.message;

        if (['building', 'BUILDING'].includes(data.status)) {
            buildTimer.value = setTimeout(pollBuildProgress, 2000);
        }
    } catch (err) {
        buildMessage.value = '获取进度失败：' + err.message;
        buildTimer.value = setTimeout(pollBuildProgress, 5000);
    }
}

function loadLibraries() {
    libraryLoading.value = true;
    listCollections().then((res) => {
        libraryList.value = res || [];
    }).catch(() => {
        ElMessage.error('加载向量库列表失败');
    }).finally(() => {
        libraryLoading.value = false;
    });
}

function statusTagType(status) {
    if (status === 'COMPLETED') return 'success';
    if (status === 'FAILED') return 'danger';
    if (status === 'BUILDING') return 'warning';
    return 'info';
}

function useForSearch(row) {
    proxy.$router.push({
        path: '/lake-intelligence/similarity/search',
        query: { collection: row.collectionName },
    });
}

function openDialog() {
    form.indexName = '';
    form.datasetId = null;
    form.taskId = null;
    form.distanceMetric = 'cosine';
    form.batchSize = 32;
    building.value = false;
    buildStatus.value = 'PENDING';
    indexedCount.value = 0;
    totalCount.value = 0;
    buildMessage.value = '';
    currentBuildId.value = null;
    loadDatasets();
    loadModelTree();
    dialogVisible.value = true;
}

function closeDialog() {
    if (buildTimer.value) clearTimeout(buildTimer.value);
    dialogVisible.value = false;
    building.value = false;
    loadLibraries();
}

onMounted(() => {
    loadLibraries();
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

.dialog-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
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
