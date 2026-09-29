<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑模板' : '新建模板'"
    width="640px"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="模板编码" prop="templateCode">
        <el-input
          v-model="form.templateCode"
          placeholder="请输入模板编码，如 NULL_CHECK"
          :disabled="isEdit"
          maxlength="64"
          show-word-limit
          clearable
        />
      </el-form-item>
      <el-form-item label="模板名称" prop="templateName">
        <el-input v-model="form.templateName" placeholder="请输入模板名称" maxlength="128" show-word-limit clearable />
      </el-form-item>
      <el-form-item label="维度" prop="dimension">
        <el-select v-model="form.dimension" placeholder="请选择维度" clearable style="width: 100%">
          <el-option v-for="d in dimensionOptions" :key="d.value" :label="d.label" :value="d.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="模板图标" prop="templateIcon">
        <el-input v-model="form.templateIcon" placeholder="请输入图标名，如 document" maxlength="64" clearable />
      </el-form-item>
      <el-form-item label="模板颜色" prop="templateColor">
        <el-color-picker v-model="form.templateColor" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述（选填）" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="检测 SQL" prop="checkSqlPattern">
        <el-input
          v-model="form.checkSqlPattern"
          type="textarea"
          :rows="3"
          placeholder="检测 SQL 模板（支持 {templateCode} 占位符）"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="明细 SQL" prop="itemsSqlPattern">
        <el-input
          v-model="form.itemsSqlPattern"
          type="textarea"
          :rows="3"
          placeholder="明细行过滤 SQL 模板"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="扩展配置" prop="extraConfigSchema">
        <el-input
          v-model="form.extraConfigSchema"
          type="textarea"
          :rows="3"
          placeholder="JSON Schema 文本"
          maxlength="4000"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input-number v-model="form.sortOrder" :min="0" :max="9999" controls-position="right" />
      </el-form-item>
      <el-form-item label="启用状态" prop="enabled">
        <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
        {{ isEdit ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup name="TemplateDialog">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { listAllTemplates, addTemplate, updateTemplate } from '@/api/dataquality/templateApi';

const props = defineProps({
  visible: { type: Boolean, default: false },
  editId: { type: [Number, String], default: null },
});
const emit = defineEmits(['update:visible', 'success']);

const formRef = ref(null);
const submitLoading = ref(false);

// 维度中文映射（与列表页保持一致）
const dimensionMap = {
  completeness: '完整性',
  uniqueness: '唯一性',
  timeliness: '及时性',
  validity: '有效性',
  consistency: '一致性',
  stability: '稳定性',
};
const dimensionOptions = Object.entries(dimensionMap).map(([value, label]) => ({ value, label }));

const isEdit = computed(() => props.editId != null && props.editId !== '');

const defaultForm = () => ({
  templateCode: '',
  templateName: '',
  dimension: '',
  templateIcon: '',
  templateColor: '#E6A23C',
  description: '',
  checkSqlPattern: '',
  itemsSqlPattern: '',
  extraConfigSchema: '',
  sortOrder: 0,
  enabled: 1,
});

const form = reactive(defaultForm());

const formRules = {
  templateCode: [
    { required: true, message: '请输入模板编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]*$/, message: '模板编码需为大写字母、数字、下划线，且以大写字母开头', trigger: 'blur' },
  ],
  templateName: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
  ],
  dimension: [
    { required: true, message: '请选择维度', trigger: 'change' },
  ],
};

const resetForm = () => {
  Object.assign(form, defaultForm());
};

const close = () => emit('update:visible', false);

const handleCancel = () => { close(); };

// 编辑态：打开时通过 listAllTemplates 找到对应 id 行回填全部字段
watch(
  () => props.visible,
  async (val) => {
    if (val) {
      resetForm();
      if (isEdit.value) {
        try {
          const res = await listAllTemplates();
          const list = Array.isArray(res) ? res : (res.rows || []);
          const row = list.find((t) => String(t.id) === String(props.editId));
          if (row) {
            Object.assign(form, {
              templateCode: row.templateCode ?? '',
              templateName: row.templateName ?? '',
              dimension: row.dimension ?? '',
              templateIcon: row.templateIcon ?? '',
              templateColor: row.templateColor ?? '#E6A23C',
              description: row.description ?? '',
              checkSqlPattern: row.checkSqlPattern ?? '',
              itemsSqlPattern: row.itemsSqlPattern ?? '',
              extraConfigSchema: row.extraConfigSchema ?? '',
              sortOrder: row.sortOrder ?? 0,
              enabled: row.enabled ?? 1,
            });
          }
        } catch {
          ElMessage.error('获取模板详情失败');
        }
      }
    }
  },
);

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitLoading.value = true;
  try {
    const payload = {
      templateCode: form.templateCode,
      templateName: form.templateName,
      dimension: form.dimension,
      templateIcon: form.templateIcon,
      templateColor: form.templateColor,
      description: form.description,
      checkSqlPattern: form.checkSqlPattern,
      itemsSqlPattern: form.itemsSqlPattern,
      extraConfigSchema: form.extraConfigSchema,
      sortOrder: form.sortOrder,
      enabled: form.enabled,
    };
    if (isEdit.value) {
      payload.id = props.editId;
      await updateTemplate(payload);
      ElMessage.success('模板更新成功');
    } else {
      await addTemplate(payload);
      ElMessage.success('模板创建成功');
    }
    close();
    emit('success');
  } catch (e) {
    ElMessage.error(isEdit.value ? '模板更新失败' : '模板创建失败');
  } finally {
    submitLoading.value = false;
  }
};
</script>
