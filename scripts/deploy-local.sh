#!/bin/bash

set -e

IMAGE_NAME="${1:-cicd}"
IMAGE_TAG="${2:-latest}"
CONTAINER_NAME="${IMAGE_NAME}-container"

echo "停止并删除旧容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "删除旧镜像..."
docker rmi ${IMAGE_NAME}:${IMAGE_TAG} 2>/dev/null || true

echo "构建新镜像..."
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

echo "运行新容器..."
docker run -d \
  --name $CONTAINER_NAME \
  -p 80:80 \
  --restart unless-stopped \
  ${IMAGE_NAME}:${IMAGE_TAG}

echo "部署完成！"
echo "应用地址: http://localhost"
