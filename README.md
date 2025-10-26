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

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 📋 API 명세서

### 기본 엔드포인트
- **서버 상태 확인**: `GET /api/ping`
- **헬스 체크**: `GET /api/health`

### 1. 이벤트 호출 API (하드웨어→서버)
**POST** `/api/smoke-bin/events`

하드웨어에서 발생하는 이벤트를 서버로 전송합니다.

**Request Body:**
```json
{
  "device_id": "SB001",
  "event_type": "drop",
  "data": {
    "sensor_data": "motion_detected"
  }
}
```

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
**GET** `/api/smoke-bin/devices`

모든 스모크 빈 장치의 목록을 조회합니다.

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
**GET** `/api/smoke-bin/devices/:device_id`

특정 장치의 상세 정보를 조회합니다.

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
**GET** `/api/smoke-bin/devices/:device_id/usage-logs?period=24h`

특정 장치의 사용현황을 30분 단위로 조회합니다.

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
**PUT** `/api/smoke-bin/devices/:device_id/status`

장치의 상태를 업데이트합니다.

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
# 서버 실행 후
node test-api.js
```

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
- **AWS S3** (클라우드 데이터 저장소)
- **Moment.js** (날짜/시간 처리)
- **CORS** (크로스 오리진 지원)

## ⚙️ 환경 설정

### AWS S3 설정
1. AWS 계정에서 S3 버킷 생성
2. IAM 사용자 생성 및 S3 권한 부여
3. `.env` 파일 생성 (env.example 참고)

```bash
# .env 파일 예시
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=smart-smoke-bin-data
PORT=3000
```

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp env.example .env
# .env 파일을 편집하여 AWS 자격 증명 입력

# 서버 실행
npm start
```