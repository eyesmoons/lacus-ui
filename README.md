## 平台简介

Lacus 大数据开发治理平台前端，覆盖 **采集 · 计算 · 质量 · 服务化** 六大能力域：元数据中心、数据集成、计算开发（Flink / Spark）、数据同步、数据质量、统一 API 服务化。

- 技术栈：[Vue 3](https://v3.cn.vuejs.org) + [Element Plus](https://element-plus.org/zh-CN) + [Vite](https://cn.vitejs.dev)
- 配套后端仓库地址：[lacus](https://github.com/eyesmoons/lacus)

## 本地开发

```bash
npm install
npm run dev          # http://localhost:8080
```

开发服务器把 `/lacus-api/*` 代理到 `http://127.0.0.1:8090`（见 `vite.config.js` 的 `server.proxy`）。
启动前端前请确认后端 admin 服务已在 8090 端口运行。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run build:prod` | 构建生产环境产物到 `dist/` |
| `npm run build:stage` | 构建 staging 环境产物 |
| `npm run preview` | 本地预览已构建产物 |
| `npm run lint` | ESLint 检查（配置见 `.eslintrc.js`） |
| `npm run fix` | ESLint 自动修复 |
| `npm run test` | 运行单元测试（vitest） |

> **注意**：`npm run test` 目前因依赖冲突无法启动 —— `vitest@4` 要求 `vite ^6+`，
> 而本项目仍在 `vite@2`。需要先完成 Vite 升级才能恢复测试执行。
> 参见 `.eslintrc.js` 同目录下的评估结论与升级计划。

## 环境变量

配置文件为 `.env.development` / `.env.production`：

| 变量 | 说明 |
| --- | --- |
| `VITE_APP_ENV` | 环境标识 |
| `VITE_APP_BASE_API` | 接口前缀，默认 `/lacus-api` |
| `VITE_APP_TITLE` | 浏览器标签页标题 |
| `VITE_APP_PUBLIC_PATH` | 部署根路径，默认 `/`；部署到子路径时改为如 `/admin/` |
| `VITE_BUILD_COMPRESS` | 构建压缩方式，逗号分隔，支持 `gzip` / `brotli` |

## 生产部署

### 1. 构建

```bash
npm run build:prod
```

产物输出到 `dist/`，其中包含预压缩的 `.gz` 文件（由 `VITE_BUILD_COMPRESS=gzip` 控制）。

### 2. nginx 配置

**关键点**：接口前缀是 **`/lacus-api`**，不是 `/prod-api`（旧版 README 遗留的错误写法，
照抄会导致所有接口 404）。

```nginx
server {
    listen       8080;
    server_name  localhost;

    # 开启静态资源压缩，配合构建产物中的 .gz 文件
    gzip on;
    gzip_static on;
    gzip_min_length 1k;
    gzip_comp_level 5;
    gzip_types text/plain text/css application/json application/javascript
               application/x-javascript text/xml application/xml image/svg+xml;
    gzip_vary on;

    # 静态资源：带 hash 的产物可长缓存
    location /assets/ {
        root      /opt/software/lacus/dist;
        expires   1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        root   /opt/software/lacus/dist;
        index  index.html index.htm;
        try_files $uri $uri/ @router;
    }

    location @router {
        rewrite ^.*$ /index.html last;
    }

    # 接口转发：注意是 /lacus-api
    location ~ ^/lacus-api/ {
        proxy_set_header        Host $host;
        proxy_set_header        X-Real-IP $remote_addr;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header        REMOTE-HOST $remote_addr;

        rewrite ^/lacus-api/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:8090;
    }
}
```

`index.html` 不应长缓存，请在 `location /` 中追加：

```nginx
        add_header Cache-Control "no-cache, must-revalidate";
```

### 3. 上传产物

```bash
mkdir -p /opt/software/lacus/
# 将 dist/ 内容上传到 /opt/software/lacus/dist/
```

### 4. 重新加载 nginx

```bash
nginx -t && nginx -s reload
```

### 部署前置检查清单

- [ ] 后端 `lacus-admin` 已在 **8090** 端口运行
- [ ] 后端 `lacus-one-api-app` 已在 **8089** 端口运行（OneAPI 的测试连接 / 上线 / 缓存刷新依赖它，
      该进程目前**不在** `lacus-dist` 发布包内，需单独部署）
- [ ] nginx 中接口前缀为 `/lacus-api`，且已开启 `gzip_static`
- [ ] 若部署在子路径，`.env.*` 中的 `VITE_APP_PUBLIC_PATH` 与实际路径一致
