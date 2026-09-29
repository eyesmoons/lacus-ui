<template>
    <div class="app-container">
        <!-- SQL任务编辑表单 -->
        <div v-if="jobInfo.jobType !== 'JAR'">
            <sql-form ref="sqlFormRef" :is-edit="true" :job-info="jobInfo" />
        </div>
        <!-- JAR任务编辑表单 -->
        <div v-else>
            <jar-form ref="jarFormRef" :is-edit="true" :job-info="jobInfo" />
        </div>
    </div>
</template>

<script setup name="FlinkJobEdit">
import * as jobApi from '@/api/flink/jobApi';
import {onMounted, ref} from 'vue';
import {useRoute} from 'vue-router';
import SqlForm from './components/SqlForm.vue';
import JarForm from './components/JarForm.vue';

const route = useRoute();
const jobInfo = ref({});

// 获取任务详情
const getJobInfo = async () => {
    try {
        jobInfo.value = await jobApi.getJobDetail(route.params.jobId);
    } catch (error) {
        console.error('获取任务详情失败:', error);
    }
};

onMounted(() => {
    getJobInfo();
});
</script>
