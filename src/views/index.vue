<template>
    <div class="modern-home">
        <div class="features-section">
            <h2 class="section-title gradient-text" data-aos="fade-up">Lacus开源大数据平台</h2>
            <el-row :gutter="20">
                <el-col :span="8" v-for="(feature, index) in features" :key="index">
                    <div class="feature-card" data-aos="zoom-in" :data-aos-delay="index * 100">
                        <el-card :body-style="{ padding: '20px' }">
                            <el-icon :size="40" class="feature-icon">
                                <component :is="feature.icon"/>
                            </el-icon>
                            <h3>{{ feature.title }}</h3>
                            <p>{{ feature.description }}</p>
                        </el-card>
                    </div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script setup name="Index">
import {ref, onMounted, onUnmounted} from 'vue';
import AOS from 'aos';
import 'aos/dist/aos.css';

// 页面数据
const features = ref([
    {
        icon: 'DataLine',
        title: '元数据管理',
        description: '高效的元数据管理，支持多种数据源',
    },
    {
        icon: 'Connection',
        title: '数据采集',
        description: '支持多种数据源实时数据采集',
    },
    {
        icon: 'Menu',
        title: '统一API',
        description: '只需配好SQL，即可快速发布API供外部调用',
    },
    {
        icon: 'Monitor',
        title: 'Flink开发',
        description: '支持Flink sql和自定义jar包的实时开发',
    },
    {
        icon: 'Tools',
        title: 'Spark开发',
        description: '支持Spark离线数据开发',
    },
    {
        icon: 'Folder',
        title: '资源管理',
        description: '全面的Hdfs资源管理功能，优化资源配置',
    },
]);

onMounted(() => {
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
    });
});

onUnmounted(() => {
    if (renderer) {
        renderer.dispose();
    }
});
</script>

<style scoped lang="scss">
.gradient-text {
    font-size: 3rem;
    font-weight: bold;
    background: linear-gradient(45deg, var(--el-color-primary), var(--el-color-success));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1rem;
}
.modern-home {
    .section-title {
        text-align: center;
        font-size: 2.5rem;
        margin-bottom: 3rem;
        color: var(--el-text-color-primary);
    }

    .features-section {
        padding: 4rem 2rem;
        background: var(--el-bg-color);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .feature-card {
        height: 100%;
        text-align: center;
        margin-bottom: 1rem;
        transition: transform 0.3s ease;

        &:hover {
            transform: translateY(-5px);
        }

        .feature-icon {
            color: var(--el-color-primary);
            margin-bottom: 1rem;
        }

        h3 {
            margin: 1rem 0;
            color: var(--el-text-color-primary);
        }

        p {
            color: var(--el-text-color-secondary);
        }
    }
}
</style>
