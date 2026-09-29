<template>
  <div class="biz-meta-panel" v-loading="loading">
    <el-form ref="formRef" :model="form" label-width="90px">
      <el-form-item label="业务名称" prop="businessName">
        <el-input
          v-model="form.businessName"
          placeholder="请输入业务名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="业务描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入业务描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="责任人" prop="owner">
        <el-input v-model="form.owner" placeholder="请输入责任人" maxlength="64" />
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <el-input v-model="form.tags" placeholder="多个标签用英文逗号分隔,如:核心,日更" maxlength="200" />
      </el-form-item>
    </el-form>
    <div class="biz-meta-footer" v-if="editable">
      <el-button type="primary" :disabled="!hasChanged" @click="handleSave">保 存</el-button>
      <el-button @click="handleReset">重 置</el-button>
    </div>
  </div>
</template>

<script setup name="BusinessMetaPanel">
import * as businessMetaApi from '@/api/metadata/businessMetaApi';

const props = defineProps({
  // DATASOURCE / DB / TABLE / COLUMN
  bizType: { type: String, required: true },
  // 对象ID;DB 级传 `${datasourceId}:${dbName}`
  bizId: { type: [String, Number], required: true },
  // 无编辑权限时只读展示
  editable: { type: Boolean, default: true },
});

const { proxy } = getCurrentInstance();
const loading = ref(false);
const formRef = ref(null);
const form = reactive({
  businessName: '',
  description: '',
  owner: '',
  tags: '',
});
// 服务端已保存的值,用于判断是否有改动与重置
const savedSnapshot = ref({ ...form });
const hasChanged = computed(() => JSON.stringify(form) !== JSON.stringify(savedSnapshot.value));

function load() {
  if (!props.bizId && props.bizId !== 0) return;
  loading.value = true;
  businessMetaApi
    .getBizMeta(props.bizType, props.bizId)
    .then((response) => {
      applyList(response || []);
    })
    .catch(() => {})
    .finally(() => {
      loading.value = false;
    });
}

function applyList(list) {
  const next = { businessName: '', description: '', owner: '', tags: '' };
  list.forEach(({ objKey, objValue }) => {
    if (objKey in next && objValue != null) {
      next[objKey] = objValue;
    }
  });
  Object.assign(form, next);
  savedSnapshot.value = { ...next };
}

function handleSave() {
  const items = ['businessName', 'description', 'owner', 'tags'].map((key) => ({
    objKey: key,
    objValue: (form[key] || '').trim(),
  }));
  businessMetaApi
    .saveBizMetaBatch({ bizType: props.bizType, bizId: props.bizId, items })
    .then(() => {
      proxy.$modal.msgSuccess('保存成功');
      savedSnapshot.value = { ...form };
    })
    .catch(() => {});
}

function handleReset() {
  Object.assign(form, savedSnapshot.value);
  proxy.resetForm('formRef');
}

watch(
  () => props.bizId,
  () => load()
);
load();
</script>

<style scoped>
.biz-meta-panel {
  padding: 4px 0;
}
.biz-meta-footer {
  text-align: right;
}
</style>
