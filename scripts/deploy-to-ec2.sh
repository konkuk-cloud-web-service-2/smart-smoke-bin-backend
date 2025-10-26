#!/bin/bash

# EC2 배포 스크립트
# 사용법: ./deploy-to-ec2.sh

echo "🚀 Smart Smoke Bin EC2 배포 시작..."

# 1. 시스템 업데이트
echo "📦 시스템 업데이트 중..."
sudo yum update -y

# 2. Node.js 설치
echo "📦 Node.js 설치 중..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
nvm use node

# 3. Git 설치
echo "📦 Git 설치 중..."
sudo yum install -y git

# 4. 프로젝트 클론 (실제 사용 시 GitHub URL로 변경)
echo "📥 프로젝트 클론 중..."
# git clone https://github.com/your-username/smart-smoke-bin-backend.git
# cd smart-smoke-bin-backend

# 5. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 6. 환경 변수 설정
echo "⚙️ 환경 변수 설정 중..."
cat > .env << EOF
PORT=3000
NODE_ENV=production
DATABASE_TYPE=memory
EOF

# 7. PM2 설치 (프로세스 관리)
echo "📦 PM2 설치 중..."
npm install -g pm2

# 8. 앱 시작
echo "🚀 애플리케이션 시작 중..."
pm2 start server.js --name "smart-smoke-bin"

# 9. 자동 재시작 설정
echo "⚙️ 자동 재시작 설정 중..."
pm2 startup
pm2 save

# 10. 상태 확인
echo "✅ 배포 완료! 상태 확인 중..."
pm2 status
pm2 logs smart-smoke-bin --lines 10

echo "🎉 EC2 배포가 완료되었습니다!"
echo "📡 접속 URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"
echo "📊 모니터링: pm2 monit"
echo "📝 로그 확인: pm2 logs smart-smoke-bin"

