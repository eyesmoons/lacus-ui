<template>
    <div class="modern-home">
        <!-- Hero Section with Three.js Background -->
        <div class="hero-section" ref="threeContainer">
            <div class="hero-content" data-aos="fade-up">
                <h1 class="gradient-text">Lacus开源大数据平台</h1>
                <p class="subtitle" data-aos="fade-up" data-aos-delay="200">简单好用的大数据平台</p>
                <div class="hero-buttons" data-aos="fade-up" data-aos-delay="400">
                    <el-button type="primary" size="large" @click="goTarget('https://github.com/eyesmoons/lacus')">
                        <el-icon>
                            <Platform/>
                        </el-icon>
                        后端项目
                    </el-button>
                    <el-button type="info" size="large" @click="goTarget('https://github.com/eyesmoons/lacus-ui')">
                        <el-icon>
                            <Document/>
                        </el-icon>
                        前端项目
                    </el-button>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="features-section">
            <h2 class="section-title" data-aos="fade-up">核心特性</h2>
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
import * as THREE from 'three';
import AOS from 'aos';
import 'aos/dist/aos.css';

const version = ref('1.0.0');
const threeContainer = ref(null);
let scene, camera, renderer, particles;

// 三维背景动画
const initThree = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    threeContainer.value.appendChild(renderer.domElement);

    // 创建粒子系统
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 5000; i++) {
        vertices.push(
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000),
            THREE.MathUtils.randFloatSpread(2000),
        );
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({color: 0x888888, size: 2});
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = 1000;

    const animate = () => {
        requestAnimationFrame(animate);
        particles.rotation.x += 0.0001;
        particles.rotation.y += 0.0001;
        renderer.render(scene, camera);
    };
    animate();
};

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
        description: '全面的资源管理功能，优化资源配置',
    },
]);

const backendTech = ref(['SpringBoot', 'Spring Security', 'JWT', 'MyBatis Plus', 'Druid', 'Jackson']);

const frontendTech = ref(['Vue 3', 'Element Plus', 'Three.js', 'Axios', 'Sass', 'AOS']);

const activities = ref([
    {
        timestamp: '2023-12-01',
        content: '发布2.0版本，全新UI界面重构',
        type: 'success',
    },
    {
        timestamp: '2022-11-30',
        content: '发布1.6.0版本，完成前后端重构',
        type: 'info',
    },
]);

const goTarget = (url) => {
    window.open(url, '__blank');
};

onMounted(() => {
    AOS.init({
        duration: 1000,
        easing: 'ease-in-out',
        once: true,
    });
    initThree();
});

onUnmounted(() => {
    if (renderer) {
        renderer.dispose();
    }
});
</script>

<style scoped lang="scss">
.modern-home {
    .hero-section {
        height: 100vh;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        canvas {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 1;
        }
    }

    .hero-content {
        text-align: center;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -60%);
        z-index: 2;
        padding: 2rem;

        .gradient-text {
            font-size: 3rem;
            font-weight: bold;
            background: linear-gradient(45deg, var(--el-color-primary), var(--el-color-success));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 1rem;
        }

        .subtitle {
            font-size: 1.5rem;
            color: var(--el-text-color-primary);
            margin-bottom: 2rem;
        }

        .hero-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
    }

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
