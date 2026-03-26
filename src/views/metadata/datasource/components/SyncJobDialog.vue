<template>
  <el-dialog
    :title="title"
    v-model="visible"
    width="600px"
    append-to-body
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="Cron表达式" prop="cronExpression">
        <CronInput v-model="form.cronExpression" />
        <div class="form-tip">
          常用示例：<br/>
          0 0 2 * * ? (每天凌晨2点执行)<br/>
          0 0/30 * * * ? (每30分钟执行一次)<br/>
          0 0 0 * * ? (每天0点执行)
        </div>
      </el-form-item>

      <el-form-item label="并发控制" prop="concurrent">
        <el-radio-group v-model="form.concurrent">
          <el-radio label="0">允许并发</el-radio>
          <el-radio label="1">禁止并发</el-radio>
        </el-radio-group>
        <div class="form-tip">
          建议选择"禁止并发"，避免同一数据源同时执行多次同步
        </div>
      </el-form-item>

      <el-form-item label="Misfire策略" prop="misfirePolicy">
        <el-radio-group v-model="form.misfirePolicy">
          <el-radio label="1">立即执行</el-radio>
          <el-radio label="2">执行一次</el-radio>
          <el-radio label="3">放弃执行</el-radio>
        </el-radio-group>
        <div class="form-tip">
          当任务错过执行时间时的处理策略，建议选择"执行一次"
        </div>
      </el-form-item>

      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio label="0">启用</el-radio>
          <el-radio label="1">暂停</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { createSyncJob, updateSyncJob } from '@/api/metadata/datasourceSyncJobApi';
import CronInput from '@/components/CronInput/index.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  datasourceId: {
    type: Number,
    required: true,
  },
  jobData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'success']);

const formRef = ref(null);
const loading = ref(false);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const title = computed(() => {
  return props.jobData ? '编辑定时同步任务' : '创建定时同步任务';
});

const form = ref({
  jobId: null,
  cronExpression: '0 0 2 * * ?',
  concurrent: '1',
  misfirePolicy: '2',
  status: '0',
  remark: '',
});

const rules = {
  cronExpression: [
    { required: true, message: 'Cron表达式不能为空', trigger: 'blur' },
  ],
  concurrent: [
    { required: true, message: '请选择并发控制', trigger: 'change' },
  ],
  misfirePolicy: [
    { required: true, message: '请选择Misfire策略', trigger: 'change' },
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' },
  ],
};

watch(
  () => props.jobData,
  (newVal) => {
    if (newVal) {
      form.value = {
        jobId: newVal.jobId,
        cronExpression: newVal.cronExpression,
        concurrent: newVal.concurrent,
        misfirePolicy: newVal.misfirePolicy,
        status: newVal.status,
        remark: newVal.remark || '',
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  form.value = {
    jobId: null,
    cronExpression: '0 0 2 * * ?',
    concurrent: '1',
    misfirePolicy: '2',
    status: '0',
    remark: '',
  };
  if (formRef.value) {
    formRef.value.clearValidate();
  }
}

function handleClose() {
  visible.value = false;
  resetForm();
}

async function handleSubmit() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      if (form.value.jobId) {
        // 更新
        await updateSyncJob(props.datasourceId, form.value);
        ElMessage.success('更新成功');
      } else {
        // 创建
        await createSyncJob(props.datasourceId, form.value);
        ElMessage.success('创建成功');
      }
      emit('success');
      handleClose();
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
