# Smart Smoke Bin Backend

스마트 담배꽁초 수거함을 위한 백엔드 API 서버입니다.

## 🚀 시작하기

### 설치
```bash
npm install
```

### 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 🌐 배포 정보

### 프로덕션 환경 (서버리스)
- **배포 URL**: https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/
- **배포 방식**: GitHub Actions + AWS SAM (Lambda + API Gateway)
- **자동 배포**: main 브랜치 push 시 자동 배포
- **아키텍처**: AWS Lambda (서버리스)

### 로컬 개발 환경
서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 📋 API 명세서

### 기본 엔드포인트
- **서버 상태 확인**: `GET /api/ping`
  - 로컬: `http://localhost:3000/api/ping`
  - 프로덕션: `https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/api/ping`
- **헬스 체크**: `GET /api/health`
  - 로컬: `http://localhost:3000/api/health`
  - 프로덕션: `https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/api/health`

### 1. 이벤트 호출 API (하드웨어→서버)
**POST** `/devices/{device_id}/events`

하드웨어에서 발생하는 이벤트를 서버로 전송합니다.

- 로컬: `http://localhost:3000/devices/{device_id}/events`
- 프로덕션: `https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/devices/{device_id}/events`

**Request Body:**
```json
{
  "event_type": "drop",
  "data": {
    "sensor_data": "motion_detected"
  }
}
```

**Note:** `device_id`는 URL 파라미터로 전달됩니다.

**Event Types:**
- `drop`: 담배꽁초 투입
- `full`: 수거함 가득참
- `maintenance`: 유지보수 모드
- `online`: 온라인 상태
- `offline`: 오프라인 상태

**Response:**
```json
{
  "success": true,
  "message": "이벤트가 성공적으로 저장되었습니다.",
  "data": {
    "event_id": 1,
    "device_id": "SB001",
    "event_type": "drop",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### 2. 장치 리스트 조회 API
**GET** `/devices`

모든 스모크 빈 장치의 목록을 조회합니다.

- 로컬: `http://localhost:3000/devices`
- 프로덕션: `https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/devices`

**Response:**
```json
{
  "success": true,
  "message": "장치 목록을 성공적으로 조회했습니다.",
  "data": [
    {
      "device_id": "SB001",
      "location": "강남역 1번 출구",
      "latitude": 37.4979,
      "longitude": 127.0276,
      "status": "active",
      "capacity": 100,
      "current_level": 45,
      "fill_percentage": 45.0,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### 3. 장치 상세 현황 조회 API
**GET** `/devices/{device_id}`

특정 장치의 상세 정보를 조회합니다.

- 로컬: `http://localhost:3000/devices/{device_id}`
- 프로덕션: `https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/devices/{device_id}`

**Response:**
```json
{
  "success": true,
  "message": "장치 상세 정보를 성공적으로 조회했습니다.",
  "data": {
    "device_id": "SB001",
    "location": "강남역 1번 출구",
    "latitude": 37.4979,
    "longitude": 127.0276,
    "status": "active",
    "capacity": 100,
    "current_level": 45,
    "fill_percentage": 45.0,
    "today_drops": 12,
    "full_history": [
      {
        "event_type": "full",
        "timestamp": "2024-01-01T10:00:00.000Z",
        "data": "{\"capacity_reached\": true}"
      }
    ]
  }
}
```

### 4. 30분 사용현황 로그 조회 API
**GET** `/devices/{device_id}/series/usage?period=24h`

특정 장치의 사용현황을 30분 단위로 조회합니다.

- 로컬: `http://localhost:3000/devices/{device_id}/series/usage`
- 프로덕션: `https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/devices/{device_id}/series/usage`

**Query Parameters:**
- `period`: 조회 기간 (`24h`, `7d`, `30d`)

**Response:**
```json
{
  "success": true,
  "message": "사용현황 로그를 성공적으로 조회했습니다.",
  "data": {
    "device_id": "SB001",
    "period": "24h",
    "start_time": "2024-01-01T00:00:00.000Z",
    "end_time": "2024-01-01T12:00:00.000Z",
    "logs": [
      {
        "device_id": "SB001",
        "period_start": "2024-01-01 11:30",
        "drop_count": 3,
        "full_events": 0
      }
    ]
  }
}
```

### 5. 장치 상태 업데이트 API (관리용)
**PUT** `/devices/{device_id}/status`

장치의 상태를 업데이트합니다.

- 로컬: `http://localhost:3000/devices/{device_id}/status`
- 프로덕션: `https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/devices/{device_id}/status`

**Request Body:**
```json
{
  "status": "maintenance"
}
```

**Status Values:**
- `active`: 정상 운영
- `maintenance`: 유지보수
- `offline`: 오프라인

## 🧪 테스트

API 테스트를 실행하려면:

```bash
# 로컬 서버 테스트
npm run test:local

# 프로덕션 서버 테스트
npm run test:production

# 기본 테스트 (로컬)
npm test
```

### 테스트 환경 설정
- **로컬 테스트**: `TEST_ENV=local` (기본값)
- **프로덕션 테스트**: `TEST_ENV=production`

## 📊 데이터베이스 스키마

### devices 테이블
- `id`: 기본키
- `device_id`: 장치 고유 ID
- `location`: 설치 위치
- `latitude`, `longitude`: GPS 좌표
- `status`: 장치 상태
- `capacity`: 최대 수용량
- `current_level`: 현재 레벨
- `created_at`, `updated_at`: 생성/수정 시간

### events 테이블
- `id`: 기본키
- `device_id`: 장치 ID (외래키)
- `event_type`: 이벤트 타입
- `timestamp`: 발생 시간
- `data`: 추가 데이터 (JSON)

### usage_logs 테이블
- `id`: 기본키
- `device_id`: 장치 ID (외래키)
- `period_start`, `period_end`: 기간
- `drop_count`: 투입 횟수
- `full_events`: 가득참 이벤트 수

## 🎯 주요 기능

1. **실시간 이벤트 처리**: 하드웨어에서 발생하는 이벤트를 실시간으로 수집
2. **장치 상태 모니터링**: 모든 장치의 현재 상태와 채움률 추적
3. **사용 패턴 분석**: 30분 단위 사용현황 로그 제공
4. **데이터 시각화 지원**: 운영자 콘솔을 위한 데이터 API 제공

## 🔧 기술 스택

- **Node.js** + **Express.js**
- **메모리 데이터베이스** (HashMap/List 기반 인메모리 저장소)
- **Moment.js** (날짜/시간 처리)
- **CORS** (크로스 오리진 지원)

## ⚙️ 환경 설정

### 메모리 데이터베이스 설정
현재 프로젝트는 메모리 기반 데이터베이스를 사용합니다. 별도의 데이터베이스 설정이 필요하지 않습니다.

```bash
# .env 파일 예시
PORT=3000
NODE_ENV=development
DATABASE_TYPE=memory
```

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 환경 변수 설정 (선택사항)
cp env.example .env

# 서버 실행
npm start
```

## 🚀 배포 정보

### 자동 배포 (서버리스)
- **배포 방식**: GitHub Actions + AWS SAM
- **아키텍처**: AWS Lambda + API Gateway
- **트리거**: main 브랜치에 push 시 자동 배포
- **배포 URL**: https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/

### 배포 과정
1. 코드를 main 브랜치에 push
2. GitHub Actions가 자동으로 SAM 빌드 및 배포
3. AWS Lambda 함수 업데이트
4. API Gateway를 통해 즉시 접근 가능

### 상세 배포 가이드
자세한 배포 방법은 [`deploy.md`](deploy.md) 파일을 참조하세요.