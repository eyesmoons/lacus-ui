<template>
    <div class="output-model-section">
        <div class="replace-model-container">
            <div v-if="!inputFieldList.length">
                <div class="empty-tip">
                    {{
                        hasUpstreamConnection ? '上游节点暂无输出模型，请先配置上游节点' : '暂无上游节点连接，请连接上游节点'
                    }}
                </div>
                <div class="section-title" style="margin-top: 8px">手动添加输出字段</div>
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px">
                    <el-input
                        :model-value="mapperAddName"
                        @update:model-value="$emit('update:mapperAddName', $event)"
                        placeholder="请输入字段名"
                        style="max-width: 240px"
                    />
                    <el-button type="primary" @click="$emit('add-custom-field')">添加到输出</el-button>
                </div>
                <div class="section-title">输出字段（按顺序）</div>
                <div style="overflow: auto">
                    <el-table
                        :data="mapperOrder.map((n) => ({ name: n }))"
                        size="small"
                        max-height="480"
                        class="field-table"
                        table-layout="auto"
                        style="min-width: 900px"
                    >
                        <el-table-column type="index" label="#" width="60" align="center" />
                        <el-table-column prop="name" label="字段名" min-width="180" show-overflow-tooltip />
                        <el-table-column label="输出名" min-width="220" show-overflow-tooltip>
                            <template #default="scope">
                                <span>{{ renameMappings[scope.row.name] || scope.row.name }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="操作" width="200" align="center" fixed="right">
                            <template #default="scope">
                                <div style="display: flex; gap: 6px; justify-content: center">
                                    <el-tooltip content="重命名" placement="top">
                                        <el-button
                                            circle
                                            size="small"
                                            @click="$emit('open-rename', { columnName: scope.row.name })"
                                            icon="Edit"
                                        />
                                    </el-tooltip>
                                    <el-tooltip content="上移" placement="top">
                                        <el-button circle size="small" @click="$emit('move-up', scope.row.name)" icon="Top" />
                                    </el-tooltip>
                                    <el-tooltip content="下移" placement="top">
                                        <el-button circle size="small" @click="$emit('move-down', scope.row.name)" icon="Bottom" />
                                    </el-tooltip>
                                    <el-tooltip content="删除" placement="top">
                                        <el-button
                                            circle
                                            size="small"
                                            type="danger"
                                            @click="$emit('remove', scope.row.name)"
                                            icon="Delete"
                                        />
                                    </el-tooltip>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </div>
            <div v-else>
                <div class="table-info" v-if="upstreamOutputTableNames.length > 0">
                    <div class="section-title">表名：{{ upstreamOutputTableNames.join(', ') }}</div>
                </div>
                <div style="display: flex; gap: 6px; align-items: stretch; margin-top: 12px">
                    <!-- 左侧：可用字段列表 -->
                    <div style="flex: 1">
                        <div class="section-title">输入模型</div>
                        <el-table :data="inputFieldList" size="small" max-height="480" class="field-table">
                            <el-table-column type="index" label="#" width="40" align="center" />
                            <el-table-column prop="columnName" label="字段名" show-overflow-tooltip>
                                <template #default="scope">
                                    {{ getRowColumnName(scope.row) || '-' }}
                                </template>
                            </el-table-column>
                            <el-table-column prop="columnType" label="类型" show-overflow-tooltip />
                            <el-table-column label="操作" width="100" align="center" fixed="right">
                                <template #default="scope">
                                    <el-tooltip content="添加" placement="top">
                                        <el-button
                                            circle
                                            size="small"
                                            type="primary"
                                            :disabled="mapperOrder.includes(getRowColumnName(scope.row))"
                                            @click="$emit('add-field', getRowColumnName(scope.row))"
                                            icon="Right"
                                        />
                                    </el-tooltip>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                    <!-- 右侧：输出字段（按顺序） -->
                    <div style="flex: 1.2; overflow: auto">
                        <div class="section-title">输出模型</div>
                        <el-table
                            :data="mapperOrder.map((n) => ({ name: n }))"
                            size="small"
                            max-height="480"
                            class="field-table"
                            table-layout="auto"
                            style="min-width: 400px"
                        >
                            <el-table-column type="index" label="#" width="60" align="center" />
                            <el-table-column prop="name" label="字段名" show-overflow-tooltip />
                            <el-table-column label="输出名" show-overflow-tooltip>
                                <template #default="scope">
                                    <span>{{ renameMappings[scope.row.name] || scope.row.name }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" width="200" align="center" fixed="right">
                                <template #default="scope">
                                    <div style="display: flex; gap: 6px; justify-content: center">
                                        <el-tooltip content="重命名" placement="top">
                                            <el-button
                                                circle
                                                size="small"
                                                @click="$emit('open-rename', { columnName: scope.row.name })"
                                                icon="Edit"
                                            />
                                        </el-tooltip>
                                        <el-tooltip content="上移" placement="top">
                                            <el-button circle size="small" @click="$emit('move-up', scope.row.name)" icon="Top" />
                                        </el-tooltip>
                                        <el-tooltip content="下移" placement="top">
                                            <el-button circle size="small" @click="$emit('move-down', scope.row.name)" icon="Bottom" />
                                        </el-tooltip>
                                        <el-tooltip content="删除" placement="top">
                                            <el-button
                                                circle
                                                size="small"
                                                type="danger"
                                                @click="$emit('remove', scope.row.name)"
                                                icon="Delete"
                                            />
                                        </el-tooltip>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    inputFieldList: {
        type: Array,
        default: () => [],
    },
    hasUpstreamConnection: {
        type: [Boolean, String],
        default: false,
    },
    upstreamOutputTableNames: {
        type: Array,
        default: () => [],
    },
    mapperOrder: {
        type: Array,
        default: () => [],
    },
    renameMappings: {
        type: Object,
        default: () => ({}),
    },
    mapperAddName: {
        type: String,
        default: '',
    },
    getRowColumnName: {
        type: Function,
        required: true,
    },
});

defineEmits([
    'open-rename',
    'move-up',
    'move-down',
    'remove',
    'add-field',
    'add-custom-field',
    'update:mapperAddName',
]);
</script>
