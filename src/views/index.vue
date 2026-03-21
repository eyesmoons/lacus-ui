<template>
  <div class="modern-home">
    <div class="features-section">
      <h2 class="section-title gradient-text" data-aos="fade-up">Lacus开源大数据平台</h2>
      <el-row :gutter="20">
        <el-col :span="8" v-for="(feature, index) in features" :key="index">
          <div class="feature-card" data-aos="zoom-in" :data-aos-delay="index * 100" @click="handleCardClick(feature)">
            <el-card :body-style="{ padding: '20px' }">
              <el-icon :size="40" class="feature-icon">
                <component :is="feature.icon" />
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AOS from 'aos';
import 'aos/dist/aos.css';

const router = useRouter();

// 页面数据
const features = ref([
  {
    icon: 'DataLine',
    title: '元数据管理',
    description: '高效的元数据管理，支持多种数据源',
    path: '/metadata/datasource',
  },
  {
    icon: 'Connection',
    title: '实时数据采集',
    description: '支持多种数据源实时数据采集',
    path: '/datasync/job',
  },
  {
    icon: 'Menu',
    title: '统一 API',
    description: '只需配好 SQL，即可快速发布 API 供外部调用',
    path: '/oneapi/oneapi',
  },
  {
    icon: 'Odometer',
    title: '数据质量',
    description: '基于 Spark 的多维度数据质量检测',
    path: '/dataquality/rule',
  },
  {
    icon: 'Monitor',
    title: 'Flink开发',
    description: '支持 Flink sql 和自定义 jar 包的实时开发',
    path: '/flink/flink',
  },
  {
    icon: 'Tools',
    title: 'Spark开发',
    description: '支持Spark离线数据开发',
    path: '/spark/spark',
  },
  {
    icon: 'Folder',
    title: '资源管理',
    description: '全面的Hdfs资源管理功能，优化资源配置',
    path: '/config/resource',
  },
  {
    icon: 'Share',
    title: '数据集成',
    description: '基于Seatunnel的拖拽式的可视化任务配置',
    path: '/dig/dig/job',
  },
]);

const handleCardClick = (feature) => {
  if (feature.path) {
    router.push(feature.path);
  }
};

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
    cursor: pointer;

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
