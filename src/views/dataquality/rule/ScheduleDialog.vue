<template>
  <el-dialog
    v-model="visible"
    :title="`定时调度 - ${rule?.ruleName || ''}`"
    width="640px"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
  >
    <!-- 已绑定：详情态 -->
    <div v-if="activeSchedule() && mode === 'detail'" class="schedule-detail">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="调度名称">{{ activeSchedule().jobName }}</el-descriptions-item>
        <el-descriptions-item label="Cron 表达式">{{ activeSchedule().cronExpression }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="activeSchedule().status === 'NORMAL' ? 'success' : 'warning'" size="small">
            {{ activeSchedule().status === 'NORMAL' ? '正常' : '暂停' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="detail-actions">
        <el-button
          :type="activeSchedule().status === 'NORMAL' ? 'warning' : 'success'"
          :icon="activeSchedule().status === 'NORMAL' ? 'VideoPause' : 'VideoPlay'"
          @click="handleToggleStatus"
        >
          {{ activeSchedule().status === 'NORMAL' ? '暂停' : '恢复' }}
        </el-button>
        <el-button type="primary" plain icon="Edit" @click="mode = 'edit'">编辑</el-button>
        <el-button type="danger" plain icon="Delete" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <!-- 未绑定 或 编辑：表单态 -->
    <el-form
      v-else
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="调度名称" prop="jobName">
        <el-input v-model="form.jobName" placeholder="请输入调度名称" maxlength="128" show-word-limit clearable />
      </el-form-item>
      <el-form-item label="Cron 表达式" prop="cronExpression">
        <CronInput v-model="form.cronExpression" />
      </el-form-item>
      <el-form-item label="错误策略" prop="misfirePolicy">
        <el-radio-group v-model="form.misfirePolicy">
          <el-radio label="1">立即执行</el-radio>
          <el-radio label="2">执行一次</el-radio>
          <el-radio label="3">放弃执行</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="是否并发" prop="concurrent">
        <el-radio-group v-model="form.concurrent">
          <el-radio label="1">禁止</el-radio>
          <el-radio label="0">允许</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注（选填）" maxlength="500" show-word-limit />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">{{ mode === 'edit' ? '取消' : '关闭' }}</el-button>
      <el-button v-if="!activeSchedule() || mode === 'edit'" type="primary" :loading="submitLoading" @click="handleSubmit">
        {{ mode === 'edit' ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup name="ScheduleDialog">
import { ref, reactive, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import CronInput from '@/components/CronInput/index.vue';
import {
  addSchedule,
  updateSchedule,
  pauseSchedule,
  resumeSchedule,
  deleteSchedule,
  getScheduleList,
} from '@/api/dataquality/scheduleApi';

const props = defineProps({
  visible: { type: Boolean, default: false },
  rule: { type: Object, default: () => null },
});
const emit = defineEmits(['update:visible', 'success']);

const formRef = ref(null);
const submitLoading = ref(false);
const mode = ref('detail'); // 'detail' | 'edit'
const localSchedule = ref(null); // 后端未返回 rule.schedule 时，按 ruleId 主动拉取的调度

// 统一调度来源：优先 rule.schedule（后端已扩展），否则用本地拉取的 localSchedule
const activeSchedule = () => props.rule?.schedule || localSchedule.value;

const form = reactive({
  jobName: '',
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
  cronExpression: [{ required: true, message: '请输入 Cron 表达式', trigger: 'blur' }],
};

// 打开弹框时：有调度→详情态，无调度→创建态。
// 后端未返回 rule.schedule 时，按 ruleId 主动拉取一次，有则进入详情态（含操作按钮）。
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      localSchedule.value = null;
      if (props.rule?.schedule) {
        mode.value = 'detail';
      } else if (props.rule?.id) {
        try {
          const res = await getScheduleList({ ruleId: props.rule.id });
          const list = res.rows || res || [];
          // 必须精确匹配当前规则，禁止 list[0] 兜底——否则后端不过滤 ruleId 时
          // 所有规则会共享 list[0] 那条调度（误绑到其他规则）
          const matched = list.find((s) => s.ruleId === props.rule.id) || null;
          if (matched) {
            localSchedule.value = {
              id: matched.jobId,
              jobName: matched.jobName,
              cronExpression: matched.cronExpression,
              status: matched.status,
            };
            mode.value = 'detail';
            return;
          }
        } catch {
          // 拉取失败退化为创建态，不阻塞
        }
        mode.value = 'edit';
        resetForm();
      } else {
        mode.value = 'edit';
        resetForm();
      }
    }
  },
);

const resetForm = () => {
  form.jobName = '';
  form.cronExpression = '0 0 2 * * ?';
  form.misfirePolicy = '3';
  form.concurrent = '1';
  form.remark = '';
};

const close = () => emit('update:visible', false);

const handleCancel = () => {
  if (mode.value === 'edit' && activeSchedule()) {
    mode.value = 'detail';
  } else {
    close();
  }
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    const payload = {
      jobName: form.jobName,
      ruleId: props.rule.id,
      cronExpression: form.cronExpression,
      misfirePolicy: form.misfirePolicy,
      concurrent: form.concurrent,
      remark: form.remark,
    };
    if (mode.value === 'edit' && activeSchedule()) {
      payload.jobId = activeSchedule().id;
      await updateSchedule(payload);
      ElMessage.success('调度更新成功');
    } else {
      await addSchedule(payload);
      ElMessage.success('调度创建成功');
    }
    localSchedule.value = null; // 关闭前清空，下次打开重新拉取最新状态
    close();
    emit('success');
  } catch (e) {
    ElMessage.error(mode.value === 'edit' ? '调度更新失败' : '调度创建失败');
  } finally {
    submitLoading.value = false;
  }
};

const handleToggleStatus = async () => {
  try {
    const s = activeSchedule();
    if (s.status === 'NORMAL') {
      await pauseSchedule(s.id);
      ElMessage.success('已暂停');
    } else {
      await resumeSchedule(s.id);
      ElMessage.success('已恢复');
    }
    close();
    emit('success');
  } catch (e) {
    ElMessage.error('操作失败');
  }
};

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该调度吗？删除后不可恢复！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await deleteSchedule(activeSchedule().id);
    ElMessage.success('删除成功');
    close();
    emit('success');
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败');
  }
};
</script>

<style scoped lang="scss">
.schedule-detail {
  .detail-actions {
    margin-top: 20px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}
</style>
