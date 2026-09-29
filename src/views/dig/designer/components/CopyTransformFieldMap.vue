<template>
  <div class="copy-transform-field-map">
    <div class="map-header">
<!--      <span class="panel-label">输入模型（来自上游 Source 输出）</span>-->
<!--      <span class="panel-label">输出模型（默认同左，复制为新增）</span>-->
    </div>
    <div class="map-body">
      <!-- 左侧：上游字段列表，每行带复制按钮 -->
      <div class="panel left-panel">
        <div class="section-title">输入模型</div>
        <div v-if="!inputFieldList.length" class="empty-tip">请先在属性配置中选择输入表</div>
        <el-table v-else :data="inputFieldList" size="small" max-height="400" class="field-table">
          <el-table-column type="index" label="#" width="40" align="center" />
          <el-table-column prop="columnName" label="字段名" min-width="100" show-overflow-tooltip>
            <template #default="scope">
              {{ getRowColumnName(scope.row) || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="columnType" label="类型" width="90" show-overflow-tooltip />
          <el-table-column label="操作" width="70" align="center" fixed="right">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="onCopyFromLeft(scope.row)">
                复制
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <!-- 中间：连接线示意 -->
      <div class="panel center-panel">
        <div class="connection-lines">
          <div
            v-for="(item, index) in rightList"
            :key="index"
            class="connection-item"
            :title="`${item.sourceColumn} → ${item.targetColumn}`"
          >
            <span class="connector-dot left-dot" />
            <span class="connector-line" />
            <span class="connector-dot right-dot" />
          </div>
          <div v-if="!rightList.length" class="no-connections">左侧即默认输出，点击「复制」可新增一行</div>
        </div>
      </div>
      <!-- 右侧：输出模型列表，目标字段名可编辑 -->
      <div class="panel right-panel">
        <div class="section-title">输出模型</div>
        <div v-if="!rightList.length" class="empty-tip">暂无输出模型</div>
        <el-table v-else :data="rightList" size="small" max-height="400" class="field-table">
          <el-table-column type="index" label="#" width="40" align="center" />
          <el-table-column label="来源字段" min-width="100">
            <template #default="scope">
              <span class="source-name">{{ scope.row.sourceColumn }}</span>
            </template>
          </el-table-column>
          <el-table-column label="目标字段名" min-width="140">
            <template #default="scope">
              <el-input
                v-model="scope.row.targetColumn"
                size="small"
                placeholder="自定义字段名"
                @change="emitUpdate"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60" align="center" fixed="right">
            <template #default="scope">
              <el-button type="danger" link size="small" @click="onRemoveRight(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  /** 左侧输入模型列表（来自上游 Source 输出模型） */
  inputFieldList: {
    type: Array,
    default: () => [],
  },
  /** 右侧输出列表，每项 { sourceColumn, targetColumn } */
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const rightList = ref([]);

function getRowColumnName(row) {
  if (!row) return '';
  return (row.columnName ?? row.column_name ?? row.name ?? row.field ?? row.fieldName ?? '').toString().trim();
}

/** 从左侧复制一行到右侧（新增一行，可编辑目标名） */
function onCopyFromLeft(row) {
  const name = getRowColumnName(row);
  if (!name) return;
  rightList.value = [...rightList.value, { sourceColumn: name, targetColumn: `${name}_copy` }];
  emitUpdate();
}

/** 删除右侧一行 */
function onRemoveRight(index) {
  rightList.value = rightList.value.filter((_, i) => i !== index);
  emitUpdate();
}

function emitUpdate() {
  emit('update:modelValue', [...rightList.value]);
}

/** 同步外部 modelValue 到内部 rightList（回显）；有保存数据时用保存的 */
watch(
  () => props.modelValue,
  (val) => {
    const list = Array.isArray(val) ? val : [];
    if (list.length === 0) return;
    const normalized = list.map((item) => {
      if (typeof item === 'string') return { sourceColumn: item, targetColumn: item };
      return {
        sourceColumn: item.sourceColumn ?? item.source ?? '',
        targetColumn: item.targetColumn ?? item.target ?? item.sourceColumn ?? item.source ?? '',
      };
    });
    rightList.value = normalized;
  },
  { immediate: true, deep: true },
);

/** 左侧/上游 Source 输出：无保存数据时，右侧默认与左侧一致（都来自 Source 输出模型）；复制的字段为新增 */
watch(
  () => [props.inputFieldList, props.modelValue],
  ([list, modelVal]) => {
    if (!list?.length) return;
    const hasSaved = Array.isArray(modelVal) && modelVal.length > 0;
    if (hasSaved) return;
    const defaultRight = list.map((row) => {
      const name = getRowColumnName(row);
      return { sourceColumn: name, targetColumn: name };
    });
    rightList.value = defaultRight;
    emit('update:modelValue', [...defaultRight]);
  },
  { immediate: true, deep: true },
);
</script>

<style scoped lang="scss">
.copy-transform-field-map {
  padding: 0;
  /* 与 el-table size="small" 行高一致，便于中间连接线与左右表格行对齐 */
  --copy-map-row-height: 32px;
  --copy-map-header-offset: 72px;
}
.map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  .panel-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    flex: 1;
    &.center-label {
      text-align: center;
      flex: 0 0 120px;
    }
  }
}
.map-body {
  display: flex;
  gap: 12px;
  align-items: stretch;
  min-height: 320px;
}
.panel {
  flex: 1;
  min-width: 0;
  .section-title {
    font-size: 12px;
    font-weight: 600;
    color: #3a71a8;
    margin-bottom: 8px;
    margin-top: 8px;
  }
  .empty-tip {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    padding: 16px;
    text-align: center;
  }
  .field-table {
    width: 100%;
  }
}
.center-panel {
  flex: 0 0 100px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  /* 与左右表格对齐：预留与 section-title + 表头 等高的空间，使第一条线对齐第一行数据 */
  padding-top: var(--copy-map-header-offset);
  .connection-lines {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }
  .connection-item {
    height: var(--copy-map-row-height);
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
  .connector-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-color-primary);
    flex-shrink: 0;
    &.right-dot {
      background: var(--el-color-success);
    }
  }
  .connector-line {
    width: 24px;
    height: 2px;
    background: linear-gradient(to right, var(--el-color-primary), var(--el-color-success));
    flex-shrink: 0;
  }
  .no-connections {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    text-align: center;
    padding: 8px;
  }
}
.source-name {
  color: var(--el-text-color-regular);
  font-size: 12px;
}
</style>
