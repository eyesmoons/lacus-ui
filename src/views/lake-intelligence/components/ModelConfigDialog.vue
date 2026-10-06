<template>
    <el-dialog
        v-model="dialogVisible"
        :title="editing ? '编辑模型' : '添加模型'"
        width="500px"
        :close-on-click-modal="false"
        append-to-body
    >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="模型名称" prop="modelName">
                <el-input v-model="form.modelName" placeholder="请输入模型名称" />
            </el-form-item>
            <el-form-item label="模型描述" prop="description">
                <el-input v-model="form.description" type="textarea" placeholder="请输入模型描述" />
            </el-form-item>
            <el-form-item label="选择数据集" prop="datasetId">
                <el-select v-model="form.datasetId" placeholder="请选择数据集" style="width: 100%" :key="datasetOptions.length">
                    <el-option
                        v-for="ds in datasetOptions"
                        :key="ds.datasetId"
                        :label="ds.datasetName"
                        :value="ds.datasetId"
                    />
                </el-select>
            </el-form-item>
            <el-form-item label="CSV 标签文件" prop="labelFilePath" v-if="props.taskType === 'CLASSIFICATION'">
                <el-input v-model="form.labelFilePath" placeholder="请输入 CSV 标签文件路径" />
                <div class="form-tip">CSV 格式：filename, label（第一行为表头）</div>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { listDatasets } from '@/api/lakeintelligence/dataset';
import { createModel, updateModel } from '@/api/lakeintelligence/model';

const props = defineProps({
    modelValue: Boolean,
    model: Object,
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
const editing = computed(() => !!props.model?.modelId);

const form = reactive({
    modelName: '',
    description: '',
    datasetId: null,
    labelFilePath: '',
});

const rules = {
    modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
    datasetId: [{ required: true, message: '请选择数据集', trigger: 'change' }],
};

watch(dialogVisible, (val) => {
    if (val) {
        resetForm();
        loadDatasets();
    }
});

function resetForm() {
    form.modelName = props.model?.modelName || '';
    form.description = props.model?.description || '';
    form.datasetId = props.model?.datasetId || null;
}

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
        if (editing.value) {
            await updateModel({ ...props.model, ...form });
        } else {
            await createModel({ ...form, taskType: props.taskType });
        }
        ElMessage.success('保存成功');
        dialogVisible.value = false;
        emit('success');
    } catch (err) {
        ElMessage.error('保存失败：' + (err.message || '未知错误'));
    } finally {
        submitting.value = false;
    }
}

defineExpose({ open: () => { dialogVisible.value = true; } });
</script>
