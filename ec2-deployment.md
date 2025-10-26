# EC2 배포 가이드

## 🚀 EC2 인스턴스 설정

### 1. EC2 인스턴스 생성
- **AMI**: Amazon Linux 2
- **Instance Type**: t2.micro (무료 티어)
- **Security Group**: 
  - SSH (22) - SSH 접속용
  - HTTP (80) - 웹 서버용
  - Custom TCP (3000) - Node.js 앱용
- **Key Pair**: 새로 생성

### 2. EC2 접속
```bash
ssh -i "your-key.pem" ec2-user@your-ec2-public-ip
```

### 3. 개발 환경 설치
```bash
# Node.js 설치
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node
nvm use node

# Git 설치
sudo yum install -y git

# 프로젝트 클론
git clone https://github.com/your-username/smart-smoke-bin-backend.git
cd smart-smoke-bin-backend
npm install
```

### 4. 환경 변수 설정
```bash
# .env 파일 생성
nano .env

# 내용 입력
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=smart-smoke-bin-data
PORT=3000
NODE_ENV=production
```

### 5. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start

# 백그라운드 실행
nohup npm start > app.log 2>&1 &
```

### 6. 보안 그룹 설정
- **Inbound Rules**:
  - SSH (22) - 0.0.0.0/0
  - HTTP (80) - 0.0.0.0/0
  - Custom TCP (3000) - 0.0.0.0/0

### 7. 접속 확인
```bash
# EC2 Public IP로 접속
curl http://your-ec2-public-ip:3000/api/ping
```

## 🔧 PM2를 사용한 프로세스 관리 (선택사항)

### PM2 설치 및 설정
```bash
# PM2 설치
npm install -g pm2

# 앱 시작
pm2 start server.js --name "smart-smoke-bin"

# 상태 확인
pm2 status

# 로그 확인
pm2 logs smart-smoke-bin

# 자동 재시작 설정
pm2 startup
pm2 save
```

## 📊 성능 모니터링

### 시스템 리소스 확인
```bash
# CPU 사용률
top

# 메모리 사용률
free -h

# 디스크 사용률
df -h

# 네트워크 상태
netstat -tulpn
```

