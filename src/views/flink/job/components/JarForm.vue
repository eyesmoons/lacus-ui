<template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <!-- 基本信息卡片 -->
        <el-card class="box-card">
            <template #header>
                <div class="card-header">
                    <span>基本信息</span>
                </div>
            </template>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="任务名称" prop="jobName">
                        <el-input v-model="form.jobName" placeholder="请输入任务名称"/>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="任务类型" prop="jobType">
                        <el-select v-model="form.jobType" placeholder="请选择任务类型" disabled>
                            <el-option label="JAR包" value="JAR"/>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="部署模式" prop="deployMode">
                        <el-select v-model="form.deployMode" placeholder="请选择部署模式">
                            <el-option label="Local" value="Local"/>
                            <el-option label="Standalone" value="Standalone"/>
                            <el-option label="Yarn-per-job" value="Yarn-per-job"/>
                            <el-option label="Yarn-application" value="Yarn-application"/>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="24">
                    <el-form-item label="任务说明" prop="remark">
                        <el-input v-model="form.remark" type="textarea" placeholder="请输入任务说明"/>
                    </el-form-item>
                </el-col>
            </el-row>
        </el-card>

        <!-- 运行配置卡片 -->
        <el-card class="box-card" style="margin-top: 20px">
            <template #header>
                <div class="card-header">
                    <span>运行配置</span>
                </div>
            </template>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="JobManager内存">
                        <el-input v-model="form.jobmanager" style="width: 100%">
                            <template #append>GB</template>
                        </el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="TaskManager内存">
                        <el-input v-model="form.taskmanager" style="width: 100%">
                            <template #append>GB</template>
                        </el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="Slot个数">
                        <el-input
                            v-model="form.slot"
                            type="number"
                            :min="1"
                            :max="20"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="并行度">
                        <el-input
                            v-model="form.parallelism"
                            type="number"
                            :min="1"
                            :max="20"
                            style="width: 100%"
                        />
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="队列">
                        <el-input v-model="form.queue" placeholder="请输入队列名称"/>
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="部署模式" prop="deployMode">
                        <el-select v-model="form.deployMode" placeholder="请选择部署模式">
                            <el-option label="Local" value="LOCAL"/>
                            <el-option label="Standalone" value="STANDALONE"/>
                            <el-option label="Yarn-per-job" value="YARN_PER"/>
                            <el-option label="Yarn-application" value="YARN_APPLICATION"/>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
        </el-card>

        <!-- JAR配置卡片 -->
        <el-card class="box-card" style="margin-top: 20px">
            <template #header>
                <div class="card-header">
                    <span>JAR配置</span>
                </div>
            </template>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="主JAR包" prop="mainJarPath">
                        <el-select
                            v-model="form.mainJarPath"
                            placeholder="请选择主JAR包"
                            style="width: 100%"
                            filterable
                        >
                            <el-option
                                v-for="jar in jarList"
                                :key="jar.jarId"
                                :label="jar.jarName"
                                :value="jar.jarPath"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="扩展JAR包" prop="extJarPath">
                        <el-select
                            v-model="form.extJarPath"
                            placeholder="请选择扩展JAR包"
                            style="width: 100%"
                            multiple
                            filterable
                            collapse-tags
                            collapse-tags-tooltip
                        >
                            <el-option
                                v-for="jar in jarList"
                                :key="jar.jarId"
                                :label="jar.jarName"
                                :value="jar.jarPath"
                            />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20">
                <el-col :span="12">
                    <el-form-item label="主类名" prop="mainClass">
                        <el-input v-model="form.mainClass" placeholder="请输入主类名"/>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="程序参数" prop="customArgs">
                        <el-input v-model="form.customArgs" placeholder="请输入程序参数"/>
                    </el-form-item>
                </el-col>
            </el-row>
        </el-card>

        <!-- 按钮操作 -->
        <div class="bottom-button">
            <el-button type="primary" @click="submitForm">提交</el-button>
            <el-button @click="cancel">取消</el-button>
        </div>
    </el-form>
</template>

<script setup>
import {ref, defineProps, defineExpose, watch, onMounted} from 'vue';
import {useRouter} from 'vue-router';
import * as jobApi from '@/api/flink/jobApi';

const props = defineProps({
    isEdit: {
        type: Boolean,
        default: false
    },
    jobInfo: {
        type: Object,
        default: () => ({})
    }
});

const router = useRouter();
const jarList = ref([]);

const form = ref({
    jobName: '',
    jobType: 'JAR',
    deployMode: 'Local',
    mainJarPath: '',
    extJarPath: [],
    mainClass: '',
    customArgs: '',
    jobmanager: 1,
    taskmanager: 1,
    slot: 1,
    parallelism: 1,
    queue: 'default',
    remark: ''
});

const rules = {
    jobName: [{required: true, message: '请输入任务名称', trigger: 'blur'}],
    deployMode: [{required: true, message: '请选择部署模式', trigger: 'change'}],
    mainJarPath: [{required: true, message: '请选择主JAR包', trigger: 'change'}],
    mainClass: [{required: true, message: '请输入主类名', trigger: 'blur'}]
};

// 获取JAR包列表
const getJarList = async () => {
    try {
        const res = await jobApi.listJars();
        jarList.value = res.data;
    } catch (error) {
        console.error('获取JAR包列表失败:', error);
    }
};

// 监听jobInfo变化，更新表单数据
watch(() => props.jobInfo, (val) => {
    if (val && Object.keys(val).length > 0) {
        form.value = {...val};
    }
}, {deep: true, immediate: true});

// 提交表单
const submitForm = async () => {
    try {
        if (props.isEdit) {
            await jobApi.editJarJob(form.value);
        } else {
            await jobApi.addJarJob(form.value);
        }
        router.push('/flink/job');
    } catch (error) {
        console.error('提交失败:', error);
    }
};

// 取消
const cancel = () => {
    router.push('/flink/job');
};

onMounted(() => {
    getJarList();
});

defineExpose({
    form
});
</script>

<style scoped>
.box-card {
    margin-bottom: 20px;
}

.card-header {
    font-weight: bold;
}

.bottom-button {
    margin-top: 20px;
    text-align: center;
}
</style>
