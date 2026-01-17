# Docker 快速开始指南

## 概述

本项目使用 Docker 容器化部署，提供开发、测试和生产环境的完整解决方案。

## 快速开始

### 1. 本地开发

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f cicd-staging

# 访问应用
# http://localhost:3001
```

### 2. 使用 Make 命令

```bash
# 查看所有可用命令
make help

# 构建镜像
make build

# 启动服务
make up

# 查看日志
make logs

# 停止服务
make down

# 清理所有资源
make clean
```

### 3. 生产部署

```bash
# 构建并推送镜像
make prod-deploy

# 或使用 docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 应用预览 | http://localhost:3001 | React 应用 |
| Jenkins | http://localhost:8099 | CI/CD 服务器 |
| Nginx | http://localhost | 反向代理 |
| MySQL | localhost:3307 | 数据库 |

## Dockerfile 说明

### 构建阶段

```dockerfile
# 阶段 1: 构建应用
FROM node:16-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# 阶段 2: 运行应用
FROM node:16-alpine
RUN apk add --no-cache dumb-init
WORKDIR /app
COPY --from=builder /app/build ./build
USER nodejs
EXPOSE 3000
CMD ["sh", "-c", "npx serve -s build -l 3000"]
```

### 特点

- ✅ 使用 `serve` 运行 React 应用
- ✅ 非 root 用户运行，提高安全性
- ✅ 使用 `dumb-init` 处理信号
- ✅ 包含健康检查
- ✅ 多阶段构建优化镜像大小

## 环境配置

### 复制环境变量文件

```bash
cp .env.example .env
```

### 修改配置

编辑 `.env` 文件：

```env
NODE_ENV=production
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password
```

## 常用命令

### 镜像操作

```bash
# 构建镜像
docker build -t cicd:latest .

# 查看镜像
docker images

# 删除镜像
docker rmi cicd:latest

# 推送到 Docker Hub
docker push your-username/cicd:latest
```

### 容器操作

```bash
# 运行容器
docker run -d -p 3000:3000 --name cicd-app cicd:latest

# 查看容器
docker ps -a

# 查看日志
docker logs -f cicd-app

# 进入容器
docker exec -it cicd-app sh

# 停止容器
docker stop cicd-app

# 删除容器
docker rm cicd-app
```

### Docker Compose 操作

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service-name]

# 重新构建并启动
docker-compose up -d --build

# 停止并删除数据卷
docker-compose down -v
```

## 故障排查

### 容器无法启动

```bash
# 查看日志
docker logs cicd-staging

# 检查端口占用
netstat -tulpn | grep 3001

# 查看容器详细信息
docker inspect cicd-staging
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

### 限制资源使用

在 docker-compose.yml 中添加：

```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 256M
```

### 查看资源使用

```bash
# 实时监控
docker stats

# 查看特定容器
docker stats cicd-staging
```

## 安全建议

1. **使用非 root 用户**: 已在 Dockerfile 中配置
2. **扫描镜像漏洞**:
   ```bash
   docker scan cicd:latest
   ```
3. **定期更新基础镜像**
4. **使用 secrets 管理敏感信息**
5. **限制容器权限**

## 相关文档

- [完整部署文档](./docs/DOCKER_DEPLOYMENT.md)
- [GitHub Actions CI/CD](./docs/GITHUB_ACTIONS.md)
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)

## 支持

如有问题，请查看：
1. [故障排查](./docs/DOCKER_DEPLOYMENT.md#故障排查)
2. [Docker 日志](./docs/DOCKER_DEPLOYMENT.md#监控和日志)
3. GitHub Issues
