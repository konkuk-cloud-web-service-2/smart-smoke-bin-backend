# 🚀 AWS Lambda + API Gateway 마이그레이션 작업 목록

## 📋 전체 진행 상황
- [ ] 1단계: SAM 로컬 테스트
- [ ] 2단계: AWS 실제 배포 및 수동 테스트
- [ ] 3단계: GitHub CI 수정
- [ ] 4단계: Elastic Beanstalk 관련 코드 제거
- [ ] 5단계: 전체 통합 테스트

---

## 1단계: SAM 로컬 테스트

### 목표
로컬 환경에서 API Gateway + Lambda 시뮬레이션 테스트

### 작업 항목

#### 1.1 필수 패키지 설치
- [ ] `npm install @vendia/serverless-express` 실행
- [ ] 설치 확인: `package.json`에 `@vendia/serverless-express` 추가됨

#### 1.2 Lambda 핸들러 파일 생성
- [ ] 프로젝트 루트에 `lambda.js` 파일 생성
- [ ] 다음 코드 작성:
```javascript
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./server');

exports.handler = serverlessExpress({ app });
```

#### 1.3 SAM 템플릿 파일 생성
- [ ] 프로젝트 루트에 `template.yaml` 파일 생성
- [ ] 다음 코드 작성:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  SmokeBinApi:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs18.x
      Handler: lambda.handler
      MemorySize: 512
      Timeout: 30
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY

Outputs:
  ApiUrl:
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/"
```

#### 1.4 SAM CLI 설치 확인
- [ ] `sam --version` 실행
- [ ] 버전 출력 확인 (예: `SAM CLI, version 1.x.x`)
- [ ] 설치 안되어있으면: `pip install aws-sam-cli`

#### 1.5 로컬 API 서버 시작
- [ ] 터미널에서 `sam local start-api --port 3000` 실행
- [ ] 다음 메시지 확인:
```
Mounting SmokeBinApi at http://127.0.0.1:3000/{proxy+} [DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT]
```

#### 1.6 로컬 API 테스트
새 터미널을 열고 다음 명령어들 테스트:

- [ ] Health Check 테스트
```bash
curl http://localhost:3000/api/health
# 예상 결과: {"status":"healthy","uptime":...}
```

- [ ] Ping 테스트
```bash
curl http://localhost:3000/api/ping
# 예상 결과: {"message":"pong","timestamp":...}
```

- [ ] 장치 목록 조회
```bash
curl http://localhost:3000/devices
# 예상 결과: {"success":true,"message":"장치 목록을...","data":[...]}
```

- [ ] 대시보드 데이터 조회
```bash
curl http://localhost:3000/dashboard/overview
# 예상 결과: {"success":true,"message":"대시보드...","data":{...}}
```

#### 1.7 문제 해결 체크리스트
문제 발생 시 확인:
- [ ] `node_modules` 폴더가 존재하는가?
- [ ] `npm install` 실행했는가?
- [ ] Docker가 실행 중인가? (SAM Local은 Docker 필요)
- [ ] 포트 3000이 이미 사용 중인가? (`netstat -ano | findstr :3000`)

### 1단계 완료 조건
✅ 로컬에서 모든 API 엔드포인트가 정상 응답
✅ 데이터베이스(인메모리)에 샘플 데이터 5개 로드 확인
✅ 에러 없이 Lambda 핸들러 실행

---

## 2단계: AWS 실제 배포 및 수동 테스트

### 목표
실제 AWS Lambda + API Gateway에 배포하고 테스트

### 작업 항목

#### 2.1 AWS 자격증명 확인
- [ ] `aws sts get-caller-identity` 실행
- [ ] 계정 정보 출력 확인 (UserId, Account, Arn)
- [ ] 리전 확인: `aws configure get region` → `ap-northeast-2`

#### 2.2 SAM 빌드
- [ ] `sam build` 실행
- [ ] 다음 메시지 확인:
```
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml
```
- [ ] `.aws-sam/build/` 폴더 생성 확인

#### 2.3 SAM 배포 (최초 1회)
- [ ] `sam deploy --guided` 실행
- [ ] 다음 질문에 답변:
```
Stack Name: smart-smoke-bin
AWS Region: ap-northeast-2
Confirm changes before deploy: N
Allow SAM CLI IAM role creation: Y
Disable rollback: N
Save arguments to configuration file: Y
SAM configuration file: samconfig.toml
SAM configuration environment: default
```

#### 2.4 배포 완료 확인
- [ ] 배포 성공 메시지 확인:
```
Successfully created/updated stack - smart-smoke-bin in ap-northeast-2
```
- [ ] Outputs 섹션에서 `ApiUrl` 값 복사
```
Key                 ApiUrl
Value               https://xxxxxxxxxx.execute-api.ap-northeast-2.amazonaws.com/Prod/
```
- [ ] **⭐ 이 URL을 메모장에 저장 (테스트 및 CI 설정에 필요)**

#### 2.5 AWS 콘솔 확인 (선택사항)
- [ ] AWS 콘솔 로그인
- [ ] CloudFormation → 스택 → `smart-smoke-bin` 확인
- [ ] Lambda → 함수 → `smart-smoke-bin-SmokeBinApi-xxxxx` 확인
- [ ] API Gateway → API → `smart-smoke-bin` 확인

#### 2.6 실제 API 테스트
복사한 API Gateway URL로 테스트 (URL 예시: `https://abc123.execute-api.ap-northeast-2.amazonaws.com/Prod`)

- [ ] Health Check
```bash
curl https://[YOUR_API_URL]/api/health
```

- [ ] Ping
```bash
curl https://[YOUR_API_URL]/api/ping
```

- [ ] 장치 목록
```bash
curl https://[YOUR_API_URL]/devices
```

- [ ] 특정 장치 조회
```bash
curl https://[YOUR_API_URL]/devices/SB001
```

- [ ] 이벤트 생성 (POST)
```bash
curl -X POST https://[YOUR_API_URL]/devices/SB001/events \
  -H "Content-Type: application/json" \
  -d '{"event_type":"drop","data":{"test":true}}'
```

- [ ] 대시보드 데이터
```bash
curl https://[YOUR_API_URL]/dashboard/overview
```

#### 2.7 CloudWatch Logs 확인
- [ ] AWS 콘솔 → CloudWatch → Log groups
- [ ] `/aws/lambda/smart-smoke-bin-SmokeBinApi-xxxxx` 로그 그룹 확인
- [ ] 최신 로그 스트림에서 요청 로그 확인

#### 2.8 성능 측정
- [ ] 첫 요청 (콜드 스타트): 응답 시간 측정
- [ ] 두 번째 요청 (워밍업): 응답 시간 측정
- [ ] 예상: 첫 요청 1-3초, 이후 100-300ms

### 2단계 완료 조건
✅ 모든 API 엔드포인트가 AWS에서 정상 작동
✅ API Gateway URL로 접근 가능
✅ Lambda 함수가 CloudWatch에 로그 기록
✅ 데이터 초기화 확인 (샘플 데이터 5개)

---

## 3단계: GitHub CI 수정

### 목표
GitHub Actions를 SAM 기반 배포로 변경

### 작업 항목

#### 3.1 기존 워크플로우 백업
- [ ] `.github/workflows/deploy.yml` 파일 복사
- [ ] `.github/workflows/deploy.yml.bak` 이름으로 저장 (롤백용)

#### 3.2 워크플로우 파일 수정
- [ ] `.github/workflows/deploy.yml` 전체 내용 교체
- [ ] 다음 코드로 변경:

```yaml
name: Deploy to AWS Lambda (SAM)

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  check:
    name: Build Check
    runs-on: ubuntu-latest
    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4
      
      - name: Node.js 18 설정
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: npm install 검사
        run: npm ci
      
      - name: npm start 검사 (5초)
        run: |
          timeout 5s npm start || exit_code=$?
          if [ $exit_code -ne 124 ] && [ $exit_code -ne 0 ]; then
            echo "❌ 서버 시작 실패"
            exit 1
          fi
          echo "✅ 서버 시작 성공"

  deploy:
    name: Deploy to Lambda
    needs: check
    runs-on: ubuntu-latest
    
    steps:
      - name: 코드 체크아웃
        uses: actions/checkout@v4
      
      - name: Python 설정 (SAM CLI용)
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: SAM CLI 설치
        run: |
          pip install aws-sam-cli
          sam --version
      
      - name: AWS 자격증명 설정
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2
      
      - name: SAM 빌드
        run: sam build
      
      - name: SAM 배포
        run: |
          sam deploy \
            --no-confirm-changeset \
            --no-fail-on-empty-changeset \
            --stack-name smart-smoke-bin \
            --capabilities CAPABILITY_IAM \
            --region ap-northeast-2
      
      - name: API Gateway URL 출력
        run: |
          API_URL=$(aws cloudformation describe-stacks \
            --stack-name smart-smoke-bin \
            --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
            --output text \
            --region ap-northeast-2)
          echo "✅ 배포 완료! $API_URL"
```

#### 3.3 GitHub Secrets 확인
- [ ] GitHub 저장소 → Settings → Secrets and variables → Actions
- [ ] `AWS_ACCESS_KEY_ID` 존재 확인
- [ ] `AWS_SECRET_ACCESS_KEY` 존재 확인
- [ ] 값이 올바른지 확인 (필요시 재설정)

#### 3.4 samconfig.toml 커밋
- [ ] `samconfig.toml` 파일이 생성되었는지 확인 (2단계에서 생성됨)
- [ ] Git 추적 대상에 포함 확인:
```bash
git add samconfig.toml
git status  # samconfig.toml이 staged 상태여야 함
```

#### 3.5 변경사항 커밋 및 푸시
- [ ] Git 커밋:
```bash
git add .github/workflows/deploy.yml samconfig.toml lambda.js template.yaml package.json package-lock.json
git commit -m "chore: Migrate to AWS Lambda + API Gateway with SAM"
```

- [ ] 푸시 **전** 확인:
  - [ ] 2단계에서 수동 배포가 성공했는가?
  - [ ] `samconfig.toml`이 커밋에 포함되었는가?
  - [ ] GitHub Secrets가 설정되어 있는가?

- [ ] 푸시:
```bash
git push origin main
```

#### 3.6 GitHub Actions 실행 확인
- [ ] GitHub 저장소 → Actions 탭 이동
- [ ] 최신 워크플로우 실행 확인 (주황색 → 초록색으로 변경)
- [ ] "Build Check" Job 성공 확인
- [ ] "Deploy to Lambda" Job 성공 확인
- [ ] Job 로그에서 "✅ 배포 완료!" 메시지 및 API URL 확인

#### 3.7 배포된 API 테스트
- [ ] Actions 로그에서 출력된 API URL로 테스트
```bash
curl https://[CI에서_출력된_URL]/api/health
```

#### 3.8 롤백 계획 준비
문제 발생 시:
- [ ] `.github/workflows/deploy.yml.bak` → `deploy.yml`로 복원
- [ ] Elastic Beanstalk는 아직 삭제하지 않았으므로 이전 배포 방식 사용 가능

### 3단계 완료 조건
✅ GitHub Actions가 자동으로 SAM 배포 실행
✅ CI/CD 파이프라인 성공 (초록색 체크)
✅ Actions 로그에 API Gateway URL 출력
✅ 자동 배포된 API가 정상 작동

---

## 4단계: Elastic Beanstalk 관련 코드 제거

### 목표
레거시 Elastic Beanstalk 설정 파일 정리

### 작업 항목

#### 4.1 Elastic Beanstalk 환경 종료 (AWS 비용 절감)
- [ ] AWS 콘솔 → Elastic Beanstalk → 환경 선택
- [ ] `smart-smoke-env` 환경 선택
- [ ] Actions → Terminate environment
- [ ] 환경 이름 입력 후 확인
- [ ] 종료 완료 확인 (약 5-10분 소요)

또는 CLI로:
```bash
aws elasticbeanstalk terminate-environment \
  --environment-name smart-smoke-env \
  --region ap-northeast-2
```

#### 4.2 Elastic Beanstalk 애플리케이션 삭제 (선택사항)
- [ ] AWS 콘솔 → Elastic Beanstalk → Applications
- [ ] `smart-smoke-bin` 애플리케이션 삭제
- [ ] 관련 S3 버킷 삭제 여부 선택

#### 4.3 로컬 파일 삭제
- [ ] `.elasticbeanstalk/` 폴더 삭제
```bash
rm -rf .elasticbeanstalk
```

- [ ] `.ebextensions/` 폴더 삭제 (있는 경우)
```bash
rm -rf .ebextensions
```

- [ ] GitHub Actions 백업 파일 삭제
```bash
rm .github/workflows/deploy.yml.bak
```

#### 4.4 문서 업데이트
- [ ] `README.md` 파일 수정
  - [ ] Elastic Beanstalk URL 제거
  - [ ] API Gateway URL로 교체
  - [ ] 배포 방식 섹션 업데이트 (EB → SAM)

#### 4.5 .gitignore 업데이트
- [ ] `.gitignore` 파일에 다음 추가:
```
# AWS SAM
.aws-sam/

# Elastic Beanstalk (레거시)
.elasticbeanstalk/
.ebextensions/
```

#### 4.6 package.json 정리 (선택사항)
EB 전용 스크립트 제거 (있는 경우):
- [ ] `package.json`에서 EB 관련 스크립트 확인
- [ ] 불필요한 스크립트 제거

#### 4.7 변경사항 커밋
```bash
git add .
git commit -m "chore: Remove Elastic Beanstalk legacy code"
git push origin main
```

#### 4.8 GitHub Actions 재실행 확인
- [ ] 푸시 후 Actions 탭에서 자동 배포 확인
- [ ] 정상 배포 확인

### 4단계 완료 조건
✅ Elastic Beanstalk 환경 종료 완료
✅ 모든 EB 관련 파일 삭제
✅ 문서가 SAM 기반으로 업데이트됨
✅ Git 히스토리 깔끔하게 정리

---

## 5단계: 전체 통합 테스트

### 목표
전체 CI/CD 파이프라인 및 API 통합 테스트

### 작업 항목

#### 5.1 간단한 코드 변경으로 CI/CD 테스트
- [ ] `routes/health.js` 파일 열기
- [ ] 간단한 변경 (예: 응답 메시지 수정)
```javascript
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '2.0.0-lambda'  // 추가
  });
});
```

- [ ] 커밋 및 푸시
```bash
git add routes/health.js
git commit -m "test: Add version to health check"
git push origin main
```

- [ ] GitHub Actions 실행 확인
- [ ] 배포 완료 후 변경사항 확인
```bash
curl https://[YOUR_API_URL]/api/health
# "version": "2.0.0-lambda" 포함 확인
```

#### 5.2 test-api.js 스크립트 수정
- [ ] `test-api.js` 파일 열기
- [ ] BASE_URL 변경:
```javascript
// 기존
const BASE_URL = 'http://localhost:3000';

// 변경
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
```

#### 5.3 통합 테스트 실행
- [ ] API Gateway URL 환경 변수로 설정:
```bash
export API_URL=https://[YOUR_API_URL]/Prod
# Windows: set API_URL=https://[YOUR_API_URL]/Prod
```

- [ ] 테스트 실행:
```bash
node test-api.js
```

- [ ] 모든 테스트 통과 확인

#### 5.4 성능 테스트
- [ ] 콜드 스타트 테스트 (5분 대기 후 첫 요청)
```bash
# 5분 대기
sleep 300
# 첫 요청 응답 시간 측정
time curl https://[YOUR_API_URL]/api/health
```
- [ ] 예상: 1-3초

- [ ] 워밍업 상태 테스트 (연속 요청)
```bash
for i in {1..10}; do
  time curl -s https://[YOUR_API_URL]/api/health > /dev/null
done
```
- [ ] 예상: 100-500ms

#### 5.5 부하 테스트 (선택사항)
간단한 부하 테스트:
```bash
# 100개 동시 요청
for i in {1..100}; do
  curl -s https://[YOUR_API_URL]/api/health &
done
wait
```

#### 5.6 모니터링 확인
- [ ] AWS 콘솔 → CloudWatch → Dashboards
- [ ] Lambda 함수 메트릭 확인:
  - [ ] Invocations (호출 수)
  - [ ] Duration (실행 시간)
  - [ ] Errors (에러 수)
  - [ ] Throttles (제한 횟수)

- [ ] API Gateway 메트릭 확인:
  - [ ] Count (요청 수)
  - [ ] 4XXError
  - [ ] 5XXError
  - [ ] Latency

#### 5.7 비용 확인
- [ ] AWS 콘솔 → Billing → Bills
- [ ] Lambda 사용량 확인 (프리티어: 월 100만 요청)
- [ ] API Gateway 사용량 확인 (프리티어: 월 100만 요청)
- [ ] 예상 비용 확인

#### 5.8 주요 API 엔드포인트 통합 테스트
각 API가 정상 작동하는지 확인:

- [ ] **Health & Ping**
```bash
curl https://[YOUR_API_URL]/api/health
curl https://[YOUR_API_URL]/api/ping
```

- [ ] **Device 관리**
```bash
# 장치 목록
curl https://[YOUR_API_URL]/devices

# 특정 장치
curl https://[YOUR_API_URL]/devices/SB001

# 장치 상태 변경
curl -X PUT https://[YOUR_API_URL]/devices/SB001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"maintenance"}'
```

- [ ] **이벤트 처리**
```bash
# 이벤트 생성
curl -X POST https://[YOUR_API_URL]/devices/SB001/events \
  -H "Content-Type: application/json" \
  -d '{"event_type":"drop","data":{"test":true}}'
```

- [ ] **Analytics & Dashboard**
```bash
# 대시보드
curl https://[YOUR_API_URL]/dashboard/overview

# 시간대별 패턴
curl https://[YOUR_API_URL]/analytics/all-devices-time-pattern

# 지역별 분석
curl https://[YOUR_API_URL]/analytics/regional
```

- [ ] **시뮬레이션**
```bash
# 꽁초 투입
curl -X POST https://[YOUR_API_URL]/devices/SB001/simulate/drop

# 장치 초기화
curl -X POST https://[YOUR_API_URL]/devices/SB001/simulate/reset

# 포화 상태
curl -X POST https://[YOUR_API_URL]/devices/SB001/simulate/full
```

#### 5.9 에러 핸들링 테스트
- [ ] 존재하지 않는 엔드포인트
```bash
curl https://[YOUR_API_URL]/non-existent-endpoint
# 예상: 404 Not Found
```

- [ ] 잘못된 device_id
```bash
curl https://[YOUR_API_URL]/devices/INVALID_ID
# 예상: 404 Device Not Found
```

- [ ] 잘못된 요청 Body
```bash
curl -X POST https://[YOUR_API_URL]/devices/SB001/events \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}'
# 예상: 400 Bad Request
```

#### 5.10 최종 체크리스트
- [ ] 모든 API 엔드포인트가 정상 작동
- [ ] GitHub Actions CI/CD가 자동으로 배포
- [ ] CloudWatch에 로그가 정상 기록됨
- [ ] 에러 핸들링이 올바르게 작동
- [ ] 성능이 허용 범위 내 (콜드 스타트 < 3초, 워밍업 < 500ms)
- [ ] Elastic Beanstalk 환경이 종료됨
- [ ] 문서가 업데이트됨
- [ ] 팀원들에게 새로운 API URL 공유

#### 5.11 문서화
- [ ] `README.md`에 최종 API URL 업데이트
- [ ] 배포 방법 문서화 (SAM 기반)
- [ ] 트러블슈팅 가이드 작성 (선택사항)

### 5단계 완료 조건
✅ 전체 CI/CD 파이프라인 정상 작동
✅ 모든 API 테스트 통과
✅ 성능 요구사항 충족
✅ 비용이 프리티어 범위 내
✅ 문서 완전히 업데이트
✅ 팀원 공유 완료

---

## 📊 전체 마이그레이션 완료 기준

### 기능적 요구사항
- [x] 모든 API 엔드포인트가 Lambda에서 작동
- [x] 데이터베이스(인메모리) 정상 작동
- [x] 에러 핸들링 정상
- [x] CORS 설정 정상 (필요시)

### 비기능적 요구사항
- [x] 응답 시간 < 500ms (워밍업 상태)
- [x] 콜드 스타트 < 3초
- [x] 99% 가용성
- [x] 프리티어 범위 내 비용

### 운영 요구사항
- [x] 자동 배포 (GitHub Actions)
- [x] 로그 모니터링 (CloudWatch)
- [x] 에러 추적
- [x] 롤백 가능

### 문서화
- [x] README.md 업데이트
- [x] API 명세서 업데이트
- [x] 배포 가이드 작성

---

## 🚨 트러블슈팅 가이드

### 문제: SAM Local이 시작되지 않음
**원인:** Docker가 실행되지 않음
**해결:**
```bash
# Docker Desktop 실행 확인
docker ps
```

### 문제: Lambda 배포 후 500 에러
**원인:** 코드 오류 또는 의존성 누락
**해결:**
```bash
# CloudWatch Logs 확인
aws logs tail /aws/lambda/smart-smoke-bin-SmokeBinApi-xxxxx --follow
```

### 문제: API Gateway 404 에러
**원인:** URL 경로 불일치
**해결:**
- API URL에 `/Prod` 포함 확인
- 올바른 경로 사용 (`/api/health`, `/devices` 등)

### 문제: GitHub Actions 실패
**원인:** Secrets 미설정 또는 권한 부족
**해결:**
- GitHub Secrets 확인
- AWS IAM 권한 확인 (CloudFormation, Lambda, API Gateway 권한 필요)

### 문제: 콜드 스타트가 너무 느림
**원인:** 의존성 크기가 큼
**해결:**
- `node_modules` 최적화
- `npm prune --production` 실행
- 불필요한 패키지 제거

---

## 📞 지원

### 유용한 명령어
```bash
# SAM 로그 실시간 확인
sam logs -n SmokeBinApi --stack-name smart-smoke-bin --tail

# CloudFormation 스택 상태 확인
aws cloudformation describe-stacks --stack-name smart-smoke-bin

# Lambda 함수 정보 확인
aws lambda get-function --function-name smart-smoke-bin-SmokeBinApi-xxxxx

# API Gateway URL 확인
aws cloudformation describe-stacks \
  --stack-name smart-smoke-bin \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

### 참고 문서
- [AWS SAM 공식 문서](https://docs.aws.amazon.com/serverless-application-model/)
- [API Gateway + Lambda 통합](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html)
- [Serverless Express](https://github.com/vendia/serverless-express)

---

## 🎉 마이그레이션 성공!

모든 단계를 완료하셨다면 축하합니다! 
이제 완전한 서버리스 아키텍처로 운영됩니다.

**Before:**
```
EC2 (Elastic Beanstalk) → 월 $0~15
항상 실행 중 (고정 비용)
```

**After:**
```
Lambda + API Gateway → 월 $0~2
사용한 만큼만 과금 (종량제)
자동 스케일링
```

