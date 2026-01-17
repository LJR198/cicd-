.PHONY: help build up down restart logs ps clean deploy

help:
	@echo "Docker 管理命令："
	@echo "  make build      - 构建应用镜像"
	@echo "  make up         - 启动所有服务"
	@echo "  make down       - 停止所有服务"
	@echo "  make restart    - 重启所有服务"
	@echo "  make logs       - 查看所有服务日志"
	@echo "  make ps         - 查看服务状态"
	@echo "  make clean      - 清理所有容器和镜像"
	@echo "  make deploy     - 部署到生产环境"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

ps:
	docker-compose ps

clean:
	docker-compose down -v
	docker system prune -f

deploy:
	docker-compose -f docker-compose.prod.yml up -d

prod-build:
	docker build -t cicd:latest .

prod-push:
	docker tag cicd:latest $(DOCKER_USERNAME)/cicd:latest
	docker push $(DOCKER_USERNAME)/cicd:latest

prod-deploy: prod-build prod-push
	docker-compose -f docker-compose.prod.yml pull
	docker-compose -f docker-compose.prod.yml up -d
