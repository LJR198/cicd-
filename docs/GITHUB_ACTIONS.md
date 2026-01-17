# GitHub Actions CI/CD 部署指南

## 概述

本项目使用 GitHub Actions 实现 CI/CD 自动化流程，包括：
- 自动测试和代码质量检查
- 自动构建应用
- 自动部署到 GitHub Pages
- 自动构建并推送 Docker 镜像

## 工作流程

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

工作流程包含三个主要任务：

#### 任务 1: Build and Test
- 检出代码
- 设置 Node.js 16.x 环境
- 安装依赖
- 运行 ESLint 检查
- 运行单元测试
- 构建生产版本
- 上传构建产物和测试覆盖率报告

#### 任务 2: Deploy to GitHub Pages
- 仅在 master/main 分支触发
- 构建应用
- 部署到 GitHub Pages

#### 任务 3: Deploy Docker Image
- 仅在 master/main 分支触发
- 构建 Docker 镜像
- 推送到 Docker Hub

## 配置步骤

### 1. GitHub Pages 配置

1. 进入 GitHub 仓库设置
2. 找到 "Pages" 设置
3. Source 选择 "GitHub Actions"
4. 保存设置

### 2. Docker Hub 配置

1. 在 GitHub 仓库中添加 Secrets：
   - `DOCKER_USERNAME`: Docker Hub 用户名
   - `DOCKER_PASSWORD`: Docker Hub 密码或访问令牌

添加步骤：
- 进入仓库 Settings → Secrets and variables → Actions
- 点击 "New repository secret"
- 添加上述两个密钥

### 3. 修改 Docker Hub 镜像名称

编辑 `.github/workflows/ci.yml` 文件，修改第 95 行：

```yaml
images: your-dockerhub-username/cicd
```

将 `your-dockerhub-username` 替换为你的 Docker Hub 用户名。

## 使用方法

### 本地部署

#### 使用 Docker 部署

```bash
# 构建并运行
docker build -t cicd:latest .
docker run -d -p 80:80 --name cicd-container cicd:latest

# 或使用部署脚本
chmod +x scripts/deploy-local.sh
./scripts/deploy-local.sh cicd latest
```

#### 访问应用

- GitHub Pages: `https://your-username.github.io/cicd-`
- 本地 Docker: `http://localhost`

### 触发 CI/CD

以下操作会自动触发 CI/CD 流程：

1. **推送到 master/main 分支**
   - 运行完整的 CI/CD 流程
   - 部署到 GitHub Pages
   - 构建并推送 Docker 镜像

2. **创建 Pull Request**
   - 仅运行测试和构建
   - 不执行部署

3. **推送到其他分支**
   - 仅运行测试和构建
   - 不执行部署

## 查看构建状态

### GitHub Actions 界面

1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 查看所有工作流运行记录
4. 点击具体运行查看详细日志

### 构建产物

每次构建后，会生成以下产物：

1. **build-{sha}**: 构建产物（保留 7 天）
2. **coverage-{sha}**: 测试覆盖率报告（保留 7 天）

下载产物：
- 进入 Actions → 选择运行 → 底部 "Artifacts" 部分

## 环境变量

### CI 环境自动设置

GitHub Actions 自动设置以下环境变量：

- `CI=true`: 表示在 CI 环境中运行
- `GITHUB_SHA`: 当前提交的 SHA
- `GITHUB_REF`: 当前分支引用
- `GITHUB_TOKEN`: GitHub 访问令牌

### 自定义环境变量

如需添加自定义环境变量，在 `.github/workflows/ci.yml` 中添加：

```yaml
env:
  CUSTOM_VAR: value
```

## 故障排查

### 构建失败

1. 检查 Actions 日志中的错误信息
2. 确认所有依赖都已正确安装
3. 检查代码是否通过 ESLint 检查
4. 确认测试是否全部通过

### 部署失败

#### GitHub Pages 部署失败

- 确认仓库设置中 Pages 已启用
- 检查 `GITHUB_TOKEN` 权限是否正确
- 确认 `publish_dir` 路径正确（默认为 `./build`）

#### Docker 部署失败

- 确认 Docker Hub 凭据已正确配置
- 检查 Docker Hub 用户名和密码是否正确
- 确认镜像名称格式正确

### 测试失败

1. 本地运行测试：`npm test`
2. 检查测试覆盖率报告
3. 修复失败的测试用例

## 最佳实践

1. **分支策略**
   - 使用 `master` 或 `main` 作为主分支
   - 功能分支使用 `feature/` 前缀
   - 修复分支使用 `fix/` 前缀

2. **提交规范**
   - 提交信息清晰描述变更内容
   - 使用语义化版本号

3. **代码审查**
   - 所有代码通过 PR 合并
   - CI 检查通过后才合并

4. **安全**
   - 不要在代码中硬编码敏感信息
   - 使用 GitHub Secrets 管理密钥
   - 定期更新依赖

## 高级配置

### 自定义构建触发条件

修改 `.github/workflows/ci.yml` 中的触发条件：

```yaml
on:
  push:
    branches: [ master, main, develop ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ master, main ]
  schedule:
    - cron: '0 0 * * *'  # 每天午夜运行
```

### 添加通知

在 `.github/workflows/ci.yml` 中添加通知步骤：

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 并行测试

修改测试任务以并行运行：

```yaml
strategy:
  matrix:
    node-version: [16.x, 18.x, 20.x]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

## 相关文件

- `.github/workflows/ci.yml`: GitHub Actions 工作流配置
- `Dockerfile`: Docker 镜像构建配置
- `.dockerignore`: Docker 构建忽略文件
- `nginx/nginx.conf`: Nginx 配置文件
- `nginx/conf.d/default.conf`: Nginx 默认站点配置

## 参考资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker Hub 文档](https://docs.docker.com/docker-hub/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [React 构建优化](https://create-react-app.dev/docs/production-build/)
