<template>
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
        :close-on-click-modal="false"
        append-to-body
    >
        <el-form ref="configFormRef" :model="form" :rules="rules" label-width="120px">
            <!-- 任务基本信息 -->
            <el-divider content-position="left">任务信息</el-divider>
            <el-form-item label="任务名称" prop="taskName">
                <el-input v-model="form.taskName" placeholder="例如：产品图片相似度训练" />
            </el-form-item>
            <el-form-item label="选择数据集" prop="datasetId">
                <el-select v-model="form.datasetId" placeholder="请选择数据集" style="width: 100%">
                    <el-option
                        v-for="ds in datasetOptions"
                        :key="ds.datasetId"
                        :label="`${ds.datasetName} (${ds.imageCount || 0} 张)`"
                        :value="ds.datasetId"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="任务类型">
                <el-input v-model="taskTypeDisplay" readonly />
            </el-form-item>

            <!-- 模型架构 -->
            <el-divider content-position="left">模型架构</el-divider>
            <el-form-item label="模型架构" prop="modelArch">
                <el-select v-model="form.modelArch" placeholder="请选择模型架构" style="width: 100%">
                    <el-option
                        v-for="arch in architectureOptions"
                        :key="arch.value"
                        :label="arch.label"
                        :value="arch.value"
                    />
                </el-select>
            </el-form-item>

            <!-- 训练超参（动态渲染） -->
            <el-divider content-position="left">训练超参</el-divider>
            <el-form-item
                v-for="param in hyperparamFields"
                :key="param.key"
                :label="param.label"
                :param="param.key"
            >
                <el-slider
                    v-if="param.type === 'slider'"
                    v-model="form[param.key]"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step"
                    show-input
                />
                <el-input-number
                    v-else-if="param.type === 'number'"
                    v-model="form[param.key]"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step"
                    :precision="param.precision || 0"
                    style="width: 100%"
                />
                <el-radio-group v-else-if="param.type === 'radio'" v-model="form[param.key]">
                    <el-radio-button
                        v-for="opt in param.options"
                        :key="opt.value"
                        :label="opt.value"
                    >
                        {{ opt.label }}
                    </el-radio-button>
                </el-radio-group>
                <el-input
                    v-else-if="param.type === 'text'"
                    v-model="form[param.key]"
                    :placeholder="param.placeholder"
                />
                <div v-if="param.tip" class="form-tip">{{ param.tip }}</div>
            </el-form-item>

            <!-- 参数预览 -->
            <el-descriptions title="参数预览" :column="2" border class="mt-3" size="small">
                <el-descriptions-item v-for="param in hyperparamFields" :key="'preview-' + param.key" :label="param.label">
                    {{ form[param.key] }}
                </el-descriptions-item>
            </el-descriptions>
        </el-form>

        <template #footer>
            <div class="dialog-footer">
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleConfirm" :loading="submitLoading">
                    <i class="el-icon-video-play"></i> 启动训练
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, getCurrentInstance } from 'vue';
import { ElMessage } from 'element-plus';
import { startTraining } from '@/api/lakeintelligence/train';
import { listDatasets } from '@/api/lakeintelligence/dataset';

const { proxy } = getCurrentInstance();

const props = defineProps({
    taskType: {
        type: String,
        default: 'SIMILARITY',
        validator: (v) => ['SIMILARITY', 'CLASSIFICATION'].includes(v),
    },
});

const emit = defineEmits(['submit-success']);

const dialogVisible = ref(false);
const configFormRef = ref(null);
const submitLoading = ref(false);
const datasetOptions = ref([]);

const form = reactive({
    taskName: '',
    datasetId: null,
    modelArch: '',
    trainerType: 'similarity',
    epochs: 30,
    learningRate: 0.001,
    batchSize: 32,
    device: 'cpu',
});

const rules = {
    taskName: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
    datasetId: [{ required: true, message: '请选择训练数据集', trigger: 'change' }],
    modelArch: [{ required: true, message: '请选择模型架构', trigger: 'change' }],
};

// 任务类型显示名称
const taskTypeDisplay = computed(() => {
    return props.taskType === 'SIMILARITY' ? '图像相似度 (SIMILARITY)' : '图像分类 (CLASSIFICATION)';
});

const dialogTitle = computed(() => {
    return props.taskType === 'SIMILARITY' ? '新建相似度训练任务' : '新建分类训练任务';
});

// 架构选项（按任务类型）
const architectureOptions = computed(() => {
    if (props.taskType === 'SIMILARITY') {
        return [
            { label: 'SimilarityAutoEncoder', value: 'SimilarityAutoEncoder' },
        ];
    }
    return [
        { label: 'ResNet18', value: 'ResNet18' },
        { label: 'ResNet50', value: 'ResNet50' },
        { label: 'MobileNetV2', value: 'MobileNetV2' },
    ];
});

// 动态超参字段定义
const hyperparamFields = computed(() => {
    const base = [
        {
            key: 'epochs',
            label: '训练轮数 (Epochs)',
            type: 'slider',
            min: 5,
            max: 200,
            step: 1,
            tip: '推荐值：30，训练轮数越多效果可能越好但耗时更长',
        },
        {
            key: 'batchSize',
            label: '批次大小 (Batch Size)',
            type: 'radio',
            options: [
                { label: '16', value: 16 },
                { label: '32', value: 32 },
                { label: '64', value: 64 },
            ],
            tip: '批次大小影响训练速度和显存占用，推荐值：32',
        },
        {
            key: 'device',
            label: '计算设备',
            type: 'radio',
            options: [
                { label: 'CPU', value: 'cpu' },
                { label: 'CUDA (GPU)', value: 'cuda' },
            ],
        },
    ];

    if (props.taskType === 'CLASSIFICATION') {
        base.splice(1, 0, {
            key: 'learningRate',
            label: '学习率 (Learning Rate)',
            type: 'number',
            min: 0.0001,
            max: 0.1,
            step: 0.0001,
            precision: 4,
            tip: '推荐值：0.001',
        });
    } else {
        base.splice(1, 0, {
            key: 'learningRate',
            label: '学习率 (Learning Rate)',
            type: 'number',
            min: 0.0001,
            max: 0.01,
            step: 0.0001,
            precision: 4,
            tip: '推荐值：0.001',
        });
    }

    return base;
});

function resetForm() {
    form.taskName = '';
    form.datasetId = null;
    form.epochs = 30;
    form.learningRate = 0.001;
    form.batchSize = 32;
    form.device = 'cpu';
    form.trainerType = props.taskType === 'SIMILARITY' ? 'similarity' : 'classifier';
    if (architectureOptions.value.length > 0) {
        form.modelArch = architectureOptions.value[0].value;
    }
}

function open(datasetId) {
    resetForm();
    if (datasetId) {
        form.datasetId = datasetId;
    }
    loadDatasets();
    dialogVisible.value = true;
}

function loadDatasets() {
    listDatasets({ pageNum: 1, pageSize: 100, taskType: props.taskType }).then((response) => {
        const list = response.rows || response.list || response || [];
        datasetOptions.value = list.filter((ds) => ds.status === 'READY');
    }).catch(() => {
        ElMessage.error('加载数据集列表失败');
    });
}

async function handleConfirm() {
    try {
        await proxy.$refs.configFormRef.validate();
    } catch (e) {
        return;
    }

    submitLoading.value = true;
    try {
        const payload = {
            taskName: form.taskName,
            taskType: props.taskType,
            datasetId: Number(form.datasetId),
            trainerType: form.trainerType,
            modelArch: form.modelArch,
            epochs: form.epochs,
            learningRate: form.learningRate,
            batchSize: form.batchSize,
            device: form.device,
            creatorId: 'current-user',
        };
        const result = await startTraining(payload);
        ElMessage.success('训练任务已启动！');
        dialogVisible.value = false;
        emit('submit-success', result);
    } catch (err) {
        ElMessage.error('启动失败：' + err.message);
    } finally {
        submitLoading.value = false;
    }
}

watch(
    () => props.taskType,
    () => {
        form.trainerType = props.taskType === 'SIMILARITY' ? 'similarity' : 'classifier';
    }
);

defineExpose({ open });
</script>

<style scoped>
.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.mt-3 {
    margin-top: 12px;
}

.form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}
</style>
