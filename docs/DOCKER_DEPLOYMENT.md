# Docker 部署指南

## 概述

本项目提供完整的 Docker 部署方案，包括：
- 应用容器化（使用多阶段构建优化镜像大小）
- Docker Compose 编排（一键启动所有服务）
- Nginx 反向代理（统一入口和负载均衡）
- 健康检查（自动监控服务状态）

## 文件结构

```
.
├── Dockerfile                    # 应用镜像构建文件
├── .dockerignore                 # Docker 构建忽略文件
├── docker-compose.yml            # 服务编排文件
├── nginx/
│   ├── nginx.conf              # Nginx 主配置
│   └── conf.d/
│       └── default.conf        # Nginx 站点配置
└── scripts/
    └── deploy-local.sh         # 本地部署脚本
```

## 快速开始

### 1. 使用 Docker Compose 启动所有服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

### 2. 单独启动应用服务

```bash
# 构建并启动应用
docker-compose up -d cicd-staging

# 访问应用
# http://localhost:3001
```

### 3. 使用部署脚本

```bash
# 赋予执行权限
chmod +x scripts/deploy-local.sh

# 部署应用
./scripts/deploy-local.sh cicd latest
```

## Dockerfile 说明

### 多阶段构建

Dockerfile 使用多阶段构建来优化镜像大小：

```dockerfile
# 阶段 1: 构建阶段
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段 2: 运行阶段
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 优势

- **镜像体积小**: 最终镜像只包含 Nginx 和构建产物
- **构建速度快**: 利用 Docker 缓存层
- **安全性高**: 不包含构建工具和源代码

### 构建镜像

```bash
# 构建镜像
docker build -t cicd:latest .

# 构建并指定标签
docker build -t cicd:v1.0.0 .

# 使用 BuildKit 加速构建
DOCKER_BUILDKIT=1 docker build -t cicd:latest .
```

### 运行容器

```bash
# 运行容器
docker run -d -p 3001:80 --name cicd-app cicd:latest

# 查看容器日志
docker logs -f cicd-app

# 进入容器
docker exec -it cicd-app sh

# 停止容器
docker stop cicd-app

# 删除容器
docker rm cicd-app
```

## Docker Compose 服务说明

### 服务列表

| 服务名 | 容器名 | 端口 | 说明 |
|--------|--------|------|------|
| jenkins | jenkins | 8099, 50001 | CI/CD 服务器 |
| mysql | mysql | 3307 | 数据库服务 |
| nginx | nginx | 80, 443 | 反向代理服务器 |
| cicd-staging | cicd-staging | 3001 | 应用预览环境 |

### 网络配置

所有服务都在 `cicd` 网络中，可以通过服务名互相访问：

```bash
# 从 nginx 访问应用
http://cicd-staging:80

# 从 nginx 访问 Jenkins
http://jenkins:8080
```

### 数据卷

| 卷名 | 用途 |
|------|------|
| jenkins_home | Jenkins 数据持久化 |
| mysql_data | MySQL 数据持久化 |
| nginx_logs | Nginx 日志持久化 |

## Nginx 配置

### 路由规则

```nginx
# 应用预览环境
location /app/ {
    proxy_pass http://cicd-staging:80/;
}

# Jenkins
location /jenkins/ {
    proxy_pass http://jenkins:8080/;
}

# Docker Registry
location /registry/ {
    proxy_pass http://registry-ui:80/;
}
```

### 访问地址

- **应用预览**: http://localhost/app/
- **Jenkins**: http://localhost/jenkins/
- **Docker Registry**: http://localhost/registry/

## 健康检查

### 应用健康检查

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 查看健康状态

```bash
# 查看容器健康状态
docker ps

# 查看健康检查日志
docker inspect cicd-staging | grep -A 10 Health
```

## 环境变量

### 应用环境变量

在 docker-compose.yml 中添加：

```yaml
environment:
  - NODE_ENV=production
  - API_URL=https://api.example.com
  - TZ=Asia/Shanghai
```

### 使用 .env 文件

创建 `.env` 文件：

```env
NODE_ENV=production
API_URL=https://api.example.com
```

在 docker-compose.yml 中引用：

```yaml
env_file:
  - .env
```

## 部署到生产环境

### 1. 推送镜像到 Docker Hub

```bash
# 登录 Docker Hub
docker login

# 标记镜像
docker tag cicd:latest your-username/cicd:latest
docker tag cicd:latest your-username/cicd:v1.0.0

# 推送镜像
docker push your-username/cicd:latest
docker push your-username/cicd:v1.0.0
```

### 2. 在生产服务器拉取镜像

```bash
# 拉取镜像
docker pull your-username/cicd:latest

# 运行容器
docker run -d \
  --name cicd-prod \
  -p 80:80 \
  --restart unless-stopped \
  your-username/cicd:latest
```

### 3. 使用 Docker Swarm 部署

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker stack deploy -c docker-compose.yml cicd

# 查看服务
docker service ls

# 扩展服务
docker service scale cicd_cicd-staging=3
```

### 4. 使用 Kubernetes 部署

创建 `k8s-deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cicd-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: cicd
  template:
    metadata:
      labels:
        app: cicd
    spec:
      containers:
      - name: cicd
        image: your-username/cicd:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: cicd-service
spec:
  selector:
    app: cicd
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

部署到 Kubernetes：

```bash
kubectl apply -f k8s-deployment.yaml

# 查看部署状态
kubectl get pods
kubectl get services
```

## 监控和日志

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs -f cicd-staging

# 查看最近 100 行日志
docker-compose logs --tail=100 cicd-staging
```

### 监控容器资源

```bash
# 查看容器资源使用情况
docker stats

# 查看特定容器
docker stats cicd-staging
```

## 故障排查

### 容器无法启动

```bash
# 查看容器日志
docker logs cicd-staging

# 查看容器详细信息
docker inspect cicd-staging

# 检查端口占用
netstat -tulpn | grep 3001
```

### 构建失败

```bash
# 清理 Docker 缓存
docker system prune -a

# 使用 BuildKit 调试
DOCKER_BUILDKIT=1 docker build --progress=plain -t cicd:latest .
```

### 网络问题

```bash
# 检查网络
docker network inspect cicd

# 测试容器间连接
docker exec cicd-staging ping nginx

# 重建网络
docker-compose down
docker network prune
docker-compose up -d
```

## 性能优化

### 镜像优化

1. **使用多阶段构建**: 已在 Dockerfile 中实现
2. **使用 .dockerignore**: 排除不必要的文件
3. **选择合适的基础镜像**: 使用 alpine 版本
4. **合并 RUN 命令**: 减少镜像层数

### 运行时优化

```yaml
# 限制资源使用
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### Nginx 优化

已在 nginx.conf 中配置：
- Gzip 压缩
- Keep-alive 连接
- 缓存策略

## 安全建议

1. **使用非 root 用户运行容器**
2. **定期更新基础镜像**
3. **扫描镜像漏洞**
   ```bash
   docker scan cicd:latest
   ```
4. **使用 secrets 管理敏感信息**
5. **限制容器权限**
   ```yaml
   security_opt:
     - no-new-privileges:true
   read_only: true
   ```

## 最佳实践

1. **版本控制**: 使用 Git 标签管理镜像版本
2. **自动化测试**: 在 CI/CD 流程中测试镜像
3. **蓝绿部署**: 使用两个环境进行零停机部署
4. **监控告警**: 设置容器健康检查和告警
5. **日志收集**: 使用 ELK 或 Loki 收集日志

## 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 配置指南](http://nginx.org/en/docs/)
- [GitHub Actions CI/CD](./GITHUB_ACTIONS.md)
