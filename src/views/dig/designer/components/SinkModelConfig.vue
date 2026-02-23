<template>
    <div class="output-model-section">
        <div class="copy-transform-header">
            <div class="table-select-panel">
                <div class="section-title">目标表名</div>
                <div class="table-options">
                    <ul class="table-list">
                        <li
                            v-for="tableName in availableTables"
                            :key="tableName"
                            :class="{ active: isSelectedOutputTable(tableName) }"
                            @click="$emit('output-table-change', tableName)"
                        >
                            {{ tableName }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="field-mapping-container">
            <div class="mapping-header">
                <!--              <div class="panel-label">输入模型</div>-->
                <!--              <div class="panel-label">输出模型</div>-->
            </div>
            <div class="mapping-body">
                <!-- 左侧面板：上游输出字段列表 -->
                <div class="panel left-panel">
                    <div class="section-title">输入模型</div>
                    <div v-if="!inputFieldList.length" class="empty-tip">请先建立与上游节点的连接以获取输出字段</div>
                    <el-table v-else :data="inputFieldList" size="small" max-height="400" class="field-table">
                        <el-table-column type="index" label="#" width="40" align="center" />
                        <el-table-column prop="columnName" label="字段名" min-width="100" show-overflow-tooltip>
                            <template #default="scope">
                                {{ getRowColumnName(scope.row) || '-' }}
                            </template>
                        </el-table-column>
                        <el-table-column prop="columnType" label="类型" width="90" show-overflow-tooltip />
                    </el-table>
                </div>
                <!-- 中间：连接线示意 -->
                <div class="panel center-panel">
                    <div class="connection-lines">
                        <div v-if="!fieldList.length" class="no-connections">等待选择目标表</div>
                    </div>
                </div>
                <!-- 右侧面板：目标表字段列表，用于映射 -->
                <div class="panel right-panel">
                    <div class="section-title">输出模型</div>
                    <div v-if="!fieldList.length" class="empty-tip">请先选择目标表</div>
                    <el-table v-else :data="fieldList" size="small" max-height="400" class="field-table">
                        <el-table-column type="index" label="#" width="40" align="center" />
                        <el-table-column label="目标字段" min-width="100">
                            <template #default="scope">
                                <span class="target-name">{{ getRowColumnName(scope.row) }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="映射来源" min-width="140">
                            <template #default="scope">
                                <el-select
                                    :model-value="mappingFields[getRowColumnName(scope.row)]"
                                    size="small"
                                    placeholder="选择映射字段"
                                    clearable
                                    @update:model-value="
                                        $emit('update-mapping-field', getRowColumnName(scope.row), $event);
                                        $emit('field-mapping-change');
                                    "
                                >
                                    <el-option
                                        v-for="inputField in inputFieldList"
                                        :key="getRowColumnName(inputField)"
                                        :label="getRowColumnName(inputField)"
                                        :value="getRowColumnName(inputField)"
                                    />
                                </el-select>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    availableTables: {
        type: Array,
        default: () => [],
    },
    inputFieldList: {
        type: Array,
        default: () => [],
    },
    fieldList: {
        type: Array,
        default: () => [],
    },
    mappingFields: {
        type: Object,
        default: () => ({}),
    },
    isSelectedOutputTable: {
        type: Function,
        required: true,
    },
    getRowColumnName: {
        type: Function,
        required: true,
    },
});

defineEmits(['output-table-change', 'field-mapping-change', 'update-mapping-field']);
</script>
