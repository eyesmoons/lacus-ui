# 多阶段构建：Node 构建产物 -> nginx 托管静态资源
# 用法：
#   docker build -t lacus-frontend .
#   docker run -p 8080:80 lacus-frontend
#
# 注意：镜像内 nginx 通过上游名 lacus-admin:8090 转发接口，
# 运行时需保证该主机名可解析（docker compose 的 service 名，或自行覆盖 nginx.conf）。

# ---------- 构建阶段 ----------
FROM node:22-alpine AS builder

WORKDIR /app

# 先复制依赖清单，最大化利用镜像层缓存
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:prod

# ---------- 运行阶段 ----------
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
