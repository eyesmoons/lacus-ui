## 平台简介
- 本仓库前端技术栈 [Vue3](https://v3.cn.vuejs.org) + [Element Plus](https://element-plus.org/zh-CN) + [Vite](https://cn.vitejs.dev) 
- 配套后端代码仓库地址[lacus](https://github.com/eyesmoons/lacus)

## 使用方法

```bash
# 克隆项目
git clone https://github.com/eyesmoons/lacus-ui

# 进入项目目录
cd lacus-ui

# 安装
npm install

# 启动项目
npm run dev

# 前端访问地址 http://localhost:8080
# 构建测试环境 npm run build:stage
# 构建生产环境 npm run build:prod
```

# 生产环境部署
## 1. nginx环境准备
① 使用root用户执行如下安装命令
```shell
yum install -y nginx
```
② 查看nginx版本
```shell
nginx -v
```
③ 启动nginx
```shell
nginx
```
④ 修改nginx配置
vim /etc/nginx/nginx.conf
```shell
user  root;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;
########全局配置###########
events {
        # 最大连接数
        worker_connections 1024;
}
###http配置
http{
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    server{
        listen       8080;
        server_name  localhost;

        location / {
            root   /opt/software/lacus/dist;
            index  index.html index.htm;
            try_files $uri $uri/ @router;
        }
        location @router {
            rewrite ^.*$ /index.html last;
        }
        #匹配正则表达式的方式,请求中中带有 test 就会转发到这个地址，主要是PCRE的功劳
        location ~ ^/prod-api/ {
            proxy_set_header        Host $host;
            proxy_set_header        X-Real-IP $remote_addr;
            proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header        REMOTE-HOST $remote_addr;

            rewrite ^/prod-api/(.*)$ /$1 break;
            proxy_pass http://127.0.0.1:8090;
        }
    }
}
```
⑤ 重新加载nginx配置
```shell
nginx -s reload
```
## 2. 新建网站文件夹
```shell
mkdir /opt/software/lacus/
```
## 3. 打包vue项目
```shell
npm run build:prod
```
## 4. 上传dist文件夹到如下目录
```shell
/opt/software/lacus/
```
## 访问前端地址
```shell
http://120.46.65.219:8080
```
