<template>
  <div class="app-container rule-form-page">
    <div class="form-header">
      <div class="form-header-title">{{ isEdit ? '编辑调度' : '新增调度' }}</div>
    </div>

    <div class="layout">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px" class="schedule-form">
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="调度名称" prop="jobName">
              <el-input v-model="form.jobName" placeholder="请输入调度名称" maxlength="128" show-word-limit clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="绑定规则" prop="ruleId">
              <el-select
                v-model="form.ruleId"
                placeholder="请选择绑定的检测规则"
                style="width: 100%"
                filterable
                clearable
              >
                <el-option
                  v-for="rule in ruleOptions"
                  :key="rule.id"
                  :label="rule.ruleName"
                  :value="rule.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="Cron 表达式" prop="cronExpression">
              <CronInput v-model="form.cronExpression" />
              <div v-if="nextFireTimes.length" class="next-fire-times">
                <el-text type="info" size="small">下次执行：</el-text>
                <el-tag
                  v-for="(t, idx) in nextFireTimes"
                  :key="idx"
                  size="small"
                  type="info"
                  class="fire-time-tag"
                >{{ t }}</el-tag>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="错误策略" prop="misfirePolicy">
              <el-radio-group v-model="form.misfirePolicy">
                <el-radio label="1">立即执行</el-radio>
                <el-radio label="2">执行一次</el-radio>
                <el-radio label="3">放弃执行</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="是否并发" prop="concurrent">
              <el-radio-group v-model="form.concurrent">
                <el-radio label="1">禁止</el-radio>
                <el-radio label="0">允许</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="16">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注（选填）" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 底部操作栏 -->
    <div class="task-bottom">
      <el-button @click="goBack">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
    </div>
  </div>
</template>

<script setup name="DqScheduleForm">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import parser from 'cron-parser';
import CronInput from '@/components/CronInput/index.vue';
import { getSchedule, addSchedule, updateSchedule, getOptionalRules } from '@/api/dataquality/scheduleApi';

const router = useRouter();
const route = useRoute();

const isEdit = computed(() => !!route.params.id);
const submitLoading = ref(false);
const formRef = ref(null);
const ruleOptions = ref([]);

const form = reactive({
  jobId: null,
  jobName: '',
  ruleId: null,
  cronExpression: '0 0 2 * * ?',
  misfirePolicy: '3',
  concurrent: '1',
  remark: '',
});

const formRules = {
  jobName: [
    { required: true, message: '请输入调度名称', trigger: 'blur' },
    { min: 2, max: 128, message: '调度名称长度在 2 到 128 个字符', trigger: 'blur' },
  ],
  ruleId: [{ required: true, message: '请选择绑定的检测规则', trigger: 'change' }],
  cronExpression: [{ required: true, message: '请输入 Cron 表达式', trigger: 'blur' }],
};

// 计算下次 5 次执行时间（cron-parser，解析失败时静默返回空数组）
const nextFireTimes = computed(() => {
  const expr = form.cronExpression;
  if (!expr) return [];
  try {
    const parts = expr.trim().split(/\s+/);
    const cronWithSecond = parts.length === 5 ? `0 ${expr}` : expr;
    const interval = parser.parseExpression(cronWithSecond);
    const times = [];
    for (let i = 0; i < 5; i++) {
      const d = interval.next().toDate();
      const pad = (n) => String(n).padStart(2, '0');
      times.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    }
    return times;
  } catch (e) {
    return [];
  }
});

const loadOptions = async () => {
  try {
    const res = await getOptionalRules();
    const list = Array.isArray(res) ? res : [];
    ruleOptions.value = list;
  } catch (e) {
    ElMessage.error('获取可选规则列表失败');
  }
};

const loadEditData = async () => {
  const id = route.params.id;
  if (!id) return;
  try {
    const res = await getSchedule(id);
    form.jobId = res.jobId;
    form.jobName = res.jobName || '';
    form.ruleId = res.ruleId != null ? res.ruleId : null;
    form.cronExpression = res.cronExpression || '0 0 2 * * ?';
    form.misfirePolicy = res.misfirePolicy != null ? String(res.misfirePolicy) : '3';
    form.concurrent = res.concurrent != null ? String(res.concurrent) : '1';
    form.remark = res.remark || '';

    // getOptionalRules() 排除已绑定规则，编辑时需手动补回当前规则，保证下拉可显示
    if (form.ruleId != null) {
      const exists = ruleOptions.value.some((r) => r.id === form.ruleId);
      if (!exists) {
        ruleOptions.value = ruleOptions.value.concat([
          { id: form.ruleId, ruleName: res.ruleName || '当前规则' },
        ]);
      }
    }
  } catch (e) {
    ElMessage.error('获取调度详情失败');
  }
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitLoading.value = true;
  try {
    const payload = {
      jobName: form.jobName,
      ruleId: form.ruleId,
      cronExpression: form.cronExpression,
      misfirePolicy: form.misfirePolicy,
      concurrent: form.concurrent,
      remark: form.remark,
    };
    if (isEdit.value) {
      payload.jobId = form.jobId;
      await updateSchedule(payload);
      ElMessage.success('调度更新成功');
    } else {
      await addSchedule(payload);
      ElMessage.success('调度创建成功');
    }
    router.push('/dataquality/schedule');
  } catch (e) {
    ElMessage.error(isEdit.value ? '调度更新失败' : '调度创建失败');
  } finally {
    submitLoading.value = false;
  }
};

const goBack = () => { router.push('/dataquality/schedule'); };

onMounted(async () => {
  await loadOptions();
  await loadEditData();
});
</script>

<style scoped lang="scss">
.rule-form-page {
  padding: 0;
}

.form-header {
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.1);
  z-index: 10;
  text-align: center;
  padding: 15px 10px;
  background: #ffffff;

  .form-header-title {
    font-size: 16px;
    font-weight: bold;
    color: #303133;
  }
}

.layout {
  height: calc(100vh - 220px);
  overflow-y: auto;
  padding: 20px;
}

.schedule-form {
  margin-top: 12px;
}

.next-fire-times {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;

  .fire-time-tag {
    font-family: "Courier New", monospace;
  }
}

.task-bottom {
  padding: 16px;
  margin-top: 5px;
  position: fixed;
  bottom: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  gap: 8px;
  z-index: 99;
}
</style>
