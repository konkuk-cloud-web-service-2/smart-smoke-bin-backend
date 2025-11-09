# 🚀 AWS Lambda + API Gateway 배포 가이드 (SAM)

## 📋 목차
1. [사전 준비](#사전-준비)
2. [로컬 테스트](#로컬-테스트)
3. [AWS 배포](#aws-배포)
4. [배포 후 확인](#배포-후-확인)
5. [업데이트 배포](#업데이트-배포)
6. [트러블슈팅](#트러블슈팅)

---

## 사전 준비

### 1. 필수 도구 설치

**Python 3.7+**
```bash
python --version
```

**AWS SAM CLI**
```bash
pip install aws-sam-cli
sam --version
```

**Docker** (로컬 테스트용)
```bash
docker --version
```

### 2. AWS 자격증명 설정

```bash
aws configure
# AWS Access Key ID: [YOUR_ACCESS_KEY]
# AWS Secret Access Key: [YOUR_SECRET_KEY]
# Default region name: ap-northeast-2
# Default output format: json
```

확인:
```bash
aws sts get-caller-identity
```

---

## 로컬 테스트

### 1. SAM Local API 서버 시작

```bash
sam local start-api --port 3000
```

### 2. API 테스트

```bash
# Health Check
curl http://localhost:3000/api/health

# 장치 목록
curl http://localhost:3000/devices

# 대시보드
curl http://localhost:3000/dashboard/overview
```

---

## AWS 배포

### 1. SAM 빌드

```bash
sam build
```

**출력 예시:**
```
Build Succeeded

Built Artifacts  : .aws-sam/build
Built Template   : .aws-sam/build/template.yaml
```

### 2. SAM 배포 (최초 1회)

```bash
sam deploy --guided
```

**설정값 입력:**
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

### 3. 배포 완료

**성공 메시지:**
```
Successfully created/updated stack - smart-smoke-bin in ap-northeast-2
```

**Outputs 확인:**
```
Key                 ApiUrl
Description         -
Value               https://xxxxxxxxxx.execute-api.ap-northeast-2.amazonaws.com/Prod/
```

⭐ **이 URL을 복사해서 저장하세요!**

---

## 배포 후 확인

### 1. API 테스트

복사한 API Gateway URL로 테스트:

```bash
# 변수 설정 (URL은 본인 것으로 변경)
export API_URL=https://xxxxxxxxxx.execute-api.ap-northeast-2.amazonaws.com/Prod

# Health Check
curl $API_URL/api/health

# 장치 목록
curl $API_URL/devices

# 대시보드
curl $API_URL/dashboard/overview
```

### 2. CloudWatch Logs 확인

```bash
# 로그 실시간 확인
sam logs -n SmokeBinApi --stack-name smart-smoke-bin --tail
```

또는 AWS 콘솔:
- CloudWatch → Log groups
- `/aws/lambda/smart-smoke-bin-SmokeBinApi-xxxxx`

### 3. Lambda 함수 확인

AWS 콘솔:
- Lambda → Functions
- `smart-smoke-bin-SmokeBinApi-xxxxx`

---

## 업데이트 배포

### 코드 수정 후 배포

```bash
# 1. 빌드
sam build

# 2. 배포 (설정 저장되어 있어 간단)
sam deploy
```

**한 줄 명령어:**
```bash
sam build && sam deploy
```

### 빠른 확인

```bash
# 배포 후 바로 테스트
sam deploy && curl $API_URL/api/health
```

---

## 트러블슈팅

### 문제: SAM CLI가 설치되지 않음

**해결:**
```bash
pip install aws-sam-cli --upgrade
```

### 문제: Docker가 실행되지 않음

**해결:**
- Docker Desktop 실행
- `docker ps` 명령어로 확인

### 문제: 배포 후 500 에러

**원인:** 코드 오류 또는 의존성 누락

**해결:**
```bash
# CloudWatch 로그 확인
aws logs tail /aws/lambda/smart-smoke-bin-SmokeBinApi-xxxxx --follow

# 또는
sam logs -n SmokeBinApi --stack-name smart-smoke-bin --tail
```

### 문제: API Gateway 404 에러

**원인:** URL 경로 오류

**해결:**
- `/Prod` 경로 포함 확인
- 올바른 경로 사용: `/api/health`, `/devices` 등

### 문제: IAM 권한 오류

**원인:** AWS 계정에 권한 부족

**필요한 권한:**
- CloudFormation (스택 생성/업데이트)
- Lambda (함수 생성/업데이트)
- API Gateway (API 생성/업데이트)
- IAM (역할 생성)
- S3 (배포 패키지 업로드)

---

## 유용한 명령어

### 스택 정보 확인

```bash
# CloudFormation 스택 상태
aws cloudformation describe-stacks --stack-name smart-smoke-bin

# API Gateway URL 확인
aws cloudformation describe-stacks \
  --stack-name smart-smoke-bin \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

### Lambda 함수 정보

```bash
# 함수 목록
aws lambda list-functions --query 'Functions[?contains(FunctionName, `smart-smoke-bin`)].FunctionName'

# 함수 상세 정보
aws lambda get-function --function-name smart-smoke-bin-SmokeBinApi-xxxxx
```

### 로그 관리

```bash
# 로그 그룹 목록
aws logs describe-log-groups --query 'logGroups[?contains(logGroupName, `smart-smoke-bin`)].logGroupName'

# 최근 로그 확인
aws logs tail /aws/lambda/smart-smoke-bin-SmokeBinApi-xxxxx --since 10m
```

---

## 스택 삭제 (주의!)

**⚠️ 주의: 모든 리소스가 삭제됩니다!**

```bash
aws cloudformation delete-stack --stack-name smart-smoke-bin
```

또는

```bash
sam delete --stack-name smart-smoke-bin
```

---

## 프로젝트 구조

```
smart-smoke-bin-backend/
├── lambda.js                 # Lambda 핸들러
├── template.yaml             # SAM 템플릿
├── samconfig.toml            # SAM 설정 (자동 생성)
├── server.js                 # Express 앱
├── package.json              # 의존성
├── routes/                   # API 라우터
├── services/                 # 비즈니스 로직
└── .aws-sam/                 # 빌드 결과 (자동 생성)
    └── build/
```

---

## 현재 배포 정보

**배포 환경:** AWS Lambda + API Gateway (서버리스)

**스택 이름:** `smart-smoke-bin`

**리전:** `ap-northeast-2` (서울)

**API Gateway URL:** 
```
https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/
```

**Lambda 함수:**
- 이름: `smart-smoke-bin-SmokeBinApi-xxxxx`
- 런타임: Node.js 18.x
- 메모리: 512 MB
- 타임아웃: 30초

**비용:**
- Lambda: 프리티어 월 100만 요청 무료
- API Gateway: 프리티어 월 100만 요청 무료
- **예상 월 비용: $0** (프리티어 범위 내)

---

## 참고 자료

- [AWS SAM 공식 문서](https://docs.aws.amazon.com/serverless-application-model/)
- [API Gateway + Lambda](https://docs.aws.amazon.com/lambda/latest/dg/services-apigateway.html)
- [Serverless Express](https://github.com/vendia/serverless-express)
- [CloudFormation 템플릿 참조](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-reference.html)

---

## 🎉 배포 완료!

이제 서버리스 아키텍처로 운영됩니다:
- ✅ 자동 스케일링
- ✅ 사용한 만큼만 과금
- ✅ 고가용성 (99.95%)
- ✅ 관리 부담 최소화

