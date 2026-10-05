<template>
    <el-dialog
        v-model="dialogVisible"
        :title="`训练: ${props.modelName || '模型'}`"
        width="600px"
        :close-on-click-modal="false"
        append-to-body
    >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="选择数据集" prop="datasetId">
                <el-select v-model="form.datasetId" placeholder="请选择数据集" style="width: 100%">
                    <el-option
                        v-for="ds in datasetOptions"
                        :key="ds.datasetId"
                        :label="ds.datasetName"
                        :value="ds.datasetId"
                    />
                </el-select>
            </el-form-item>

            <el-divider content-position="left">训练超参</el-divider>
            <el-form-item label="训练轮数" prop="epochs">
                <el-input-number v-model="form.epochs" :min="1" :max="200" />
            </el-form-item>
            <el-form-item label="学习率" prop="learningRate">
                <el-input-number v-model="form.learningRate" :min="0.0001" :max="0.01" :step="0.0001" :precision="4" />
            </el-form-item>
            <el-form-item label="批次大小" prop="batchSize">
                <el-radio-group v-model="form.batchSize">
                    <el-radio-button :label="16">16</el-radio-button>
                    <el-radio-button :label="32">32</el-radio-button>
                    <el-radio-button :label="64">64</el-radio-button>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="计算设备" prop="device">
                <el-radio-group v-model="form.device">
                    <el-radio-button label="cpu">CPU</el-radio-button>
                    <el-radio-button label="cuda">CUDA (GPU)</el-radio-button>
                </el-radio-group>
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">启动训练</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { listDatasets } from '@/api/lakeintelligence/dataset';
import { startTraining } from '@/api/lakeintelligence/train';

const props = defineProps({
    modelValue: Boolean,
    modelId: [Number, String],
    modelName: String,
    taskType: {
        type: String,
        default: 'SIMILARITY',
        validator: (v) => ['SIMILARITY', 'CLASSIFICATION'].includes(v),
    },
});

const emit = defineEmits(['update:modelValue', 'success']);

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
});

const formRef = ref(null);
const submitting = ref(false);
const datasetOptions = ref([]);

const form = reactive({
    datasetId: null,
    epochs: 30,
    learningRate: 0.001,
    batchSize: 32,
    device: 'cpu',
});

const rules = {
    datasetId: [{ required: true, message: '请选择数据集', trigger: 'change' }],
    epochs: [{ required: true, message: '请输入训练轮数', trigger: 'blur' }],
    learningRate: [{ required: true, message: '请输入学习率', trigger: 'blur' }],
    batchSize: [{ required: true, message: '请选择批次大小', trigger: 'change' }],
};

watch(dialogVisible, (val) => {
    if (val) loadDatasets();
});

function loadDatasets() {
    listDatasets({ pageNum: 1, pageSize: 100, taskType: props.taskType }).then((response) => {
        const list = response.rows || response.list || [];
        datasetOptions.value = list.filter((ds) => ds.status === 'READY' || ds.status === 'PROCESSING');
    });
}

async function handleSubmit() {
    await formRef.value.validate();
    submitting.value = true;
    try {
        await startTraining({
            modelId: props.modelId,
            taskType: props.taskType,
            datasetId: form.datasetId,
            epochs: form.epochs,
            learningRate: form.learningRate,
            batchSize: form.batchSize,
            device: form.device,
        });
        ElMessage.success('训练任务已启动');
        dialogVisible.value = false;
        emit('success');
    } catch (err) {
        ElMessage.error('启动失败：' + (err.message || '未知错误'));
    } finally {
        submitting.value = false;
    }
}

defineExpose({ open: () => { dialogVisible.value = true; } });
</script>
