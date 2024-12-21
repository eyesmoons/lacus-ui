# 第一阶段：使用 Node.js 镜像来解压 dist.zip
FROM node:16 AS builder

# 设置工作目录
WORKDIR /frontend

# 复制打包好的 dist.zip 到镜像中
COPY dist.zip ./

# 解压 dist.zip
RUN apt-get update && apt-get install -y unzip && \
    unzip dist.zip -d . && \
    rm dist.zip

# 第二阶段：使用 Nginx 镜像提供服务
FROM nginx:stable-perl

# 复制解压后的文件到 Nginx 的 HTML 目录
COPY --from=builder /frontend /frontend

# 复制自定义的 nginx.conf 到镜像中
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露 Nginx 默认端口
EXPOSE 8080

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]