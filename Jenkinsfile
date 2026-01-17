pipeline {
    agent any

    environment {
        APP_NAME = 'cicd'
        DOCKER_IMAGE = "${APP_NAME}:${BUILD_NUMBER}"
        DOCKER_IMAGE_LATEST = "${APP_NAME}:latest"
        DOCKER_REGISTRY = 'docker.io'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {
        stage('Checkout Code') {
            steps {
                script {
                    echo "========================================="
                    echo "开始拉取代码"
                    echo "========================================="
                    
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/master']],
                        extensions: [
                            [$class: 'CloneOption', noTags: false, shallow: false, depth: 0, honorRefspec: true],
                            [$class: 'UserIdentity', name: 'Jenkins', email: 'jenkins@localhost']
                        ],
                        userRemoteConfigs: [[
                            url: 'git@github.com:LJR198/cicd-.git',
                            credentialsId: 'github-ssh-key'
                        ]]
                    ])
                    
                    echo "代码拉取完成"
                    
                    echo "当前工作目录:"
                    sh 'pwd'
                    
                    echo "文件列表:"
                    sh 'ls -la'
                    
                    echo "Git 信息:"
                    sh 'git log -1 --oneline'
                    
                    echo "========================================="
                }
            }
        }

        stage('Preparation') {
            steps {
                script {
                    echo "========================================="
                    echo "构建信息"
                    echo "========================================="
                    echo "项目名称: ${env.JOB_NAME}"
                    echo "构建编号: ${env.BUILD_NUMBER}"
                    echo "Git 分支: ${env.GIT_BRANCH}"
                    echo "Git 提交: ${env.GIT_COMMIT}"
                    echo "构建时间: ${new Date()}"
                    echo "========================================="
                }
            }
        }

        // stage('Setup Node.js') {
        //     steps {
        //         script {
        //             sh '''
        //                 echo "========================================="
        //                 echo "安装 NVM 和 Node.js 16"
        //                 echo "========================================="
                        
        //                 if [ ! -d "$HOME/.nvm" ]; then
        //                     echo "安装 NVM..."
        //                     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
        //                 fi
                        
        //                 echo "加载 NVM..."
        //                 export NVM_DIR="$HOME/.nvm"
        //                 bash -c 'source "$NVM_DIR/nvm.sh" && nvm install 16 && nvm use 16'
                        
        //                 echo "Node.js 版本:"
        //                 bash -c 'source "$NVM_DIR/nvm.sh" && node --version'
        //                 echo "NPM 版本:"
        //                 bash -c 'source "$NVM_DIR/nvm.sh" && npm --version'
                        
        //                 echo "========================================="
        //             '''
        //         }
        //     }
        // }

        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        echo "========================================="
                        echo "开始安装依赖"
                        echo "========================================="
                        
                        export NVM_DIR="$HOME/.nvm"
                        bash -c 'source "$NVM_DIR/nvm.sh" && npm cache clean --force' || true
                        
                        echo "检查 package.json..."
                        [ -f "package.json" ] || (echo "错误: package.json 不存在" && exit 1)
                        
                        echo "安装依赖..."
                        bash -c 'source "$NVM_DIR/nvm.sh" && npm ci --prefer-offline --no-audit --no-fund || npm install'
                        
                        echo "依赖安装完成"
                        echo "已安装的包:"
                        bash -c 'source "$NVM_DIR/nvm.sh" && npm list --depth=0'
                        echo "========================================="
                    '''
                }
            }
        }

        stage('Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        script {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                echo "========================================="
                                echo "运行 ESLint 检查"
                                echo "========================================="
                                bash -c 'source "$NVM_DIR/nvm.sh" && npm run lint' || echo "警告: 未配置 lint 脚本或检查失败"
                                echo "========================================="
                            '''
                        }
                    }
                }
                stage('Type Check') {
                    steps {
                        script {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                echo "========================================="
                                echo "运行类型检查"
                                echo "========================================="
                                bash -c 'source "$NVM_DIR/nvm.sh" && npm run type-check' || echo "警告: 未配置 type-check 脚本或检查失败"
                                echo "========================================="
                            '''
                        }
                    }
                }
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    sh '''
                        export NVM_DIR="$HOME/.nvm"
                        echo "========================================="
                        echo "运行单元测试"
                        echo "========================================="
                        bash -c 'source "$NVM_DIR/nvm.sh" && npm test -- --watchAll=false --coverage --ci --maxWorkers=2' || echo "警告: 测试失败或未配置"
                        
                        echo "测试覆盖率报告:"
                        if [ -f "coverage/coverage-summary.json" ]; then
                            cat coverage/coverage-summary.json
                        else
                            echo "未生成覆盖率报告"
                        fi
                        echo "========================================="
                    '''
                }
            }
        }

        stage('Build Application') {
            steps {
                script {
                    sh '''
                        export NVM_DIR="$HOME/.nvm"
                        echo "========================================="
                        echo "开始构建生产版本"
                        echo "========================================="
                        
                        echo "检查构建脚本..."
                        bash -c 'source "$NVM_DIR/nvm.sh" && npm run build' || (echo "错误: 构建失败" && exit 1)
                        
                        echo "构建产物信息:"
                        du -sh build/
                        ls -lh build/
                        
                        echo "检查构建产物完整性..."
                        [ -f "build/index.html" ] || (echo "错误: index.html 不存在" && exit 1)
                        [ -d "build/static" ] || echo "警告: static 目录不存在"
                        
                        echo "构建完成!"
                        echo "构建产物已生成，可以手动部署"
                        echo "========================================="
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs(cleanWhenSuccess: true, cleanWhenFailure: true, deleteDirs: true)
        }
        success {
            echo "========================================="
            echo "构建成功!"
            echo "========================================="
        }
        failure {
            echo "========================================="
            echo "构建失败!"
            echo "========================================="
        }
    }
}
