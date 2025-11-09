# Smart Smoke Bin Analytics API 명세서

## 개요
스마트 연기통 관리 시스템의 데이터 분석 및 대시보드 API입니다.

## Base URL
```
로컬 환경: http://localhost:3000
AWS Lambda 환경: https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod
```

---

## 1. 대시보드 개요 데이터 조회

### GET /dashboard/overview
개요 페이지용 통합 대시보드 데이터를 조회합니다.

**요청 예시:**
```
로컬: GET http://localhost:3000/dashboard/overview
AWS:  GET https://u0r3k4is4k.execute-api.ap-northeast-2.amazonaws.com/Prod/dashboard/overview
```

**응답 예시:**
```json
{
  "success": true,
  "message": "대시보드 개요 데이터를 성공적으로 조회했습니다.",
  "data": {
    "time_pattern": [
      {
        "time_slot": 0,
        "count": 0,
        "label": "00"
      },
      {
        "time_slot": 3,
        "count": 2,
        "label": "03"
      }
      // ... 3시간 텀별 데이터 (00, 03, 06, 09, 12, 15, 18, 21)
    ],
    "regional_collection": [
      {
        "district_name": "강남구",
        "total_drops": 2,
        "device_count": 5,
        "avg_drops_per_device": 0.4,
        "devices": [
          {
            "device_id": "SB001",
            "location": "강남역 1번 출구",
            "drops": 0,
            "status": "active"
          }
        ]
      }
    ],
    "summary": {
      "total_drops": 2,
      "active_devices": 3,
      "total_devices": 5,
      "device_utilization_rate": 60.0
    },
    "metrics": {
      "complaint_reduction_rate": {
        "current": 42.3,
        "previous_month": 29.8,
        "change": 12.5,
        "trend": "increasing"
      },
      "device_utilization_rate": {
        "current": 87.2,
        "average": 81.9,
        "change": 5.3,
        "trend": "increasing"
      },
      "total_collection_volume": 2,
      "device_status": {
        "active": 3,
        "full": 1,
        "offline": 1,
        "total": 5
      }
    }
  }
}
```

---

## 2. 시간대별 사용 패턴 분석

### GET /analytics/usage-logs
특정 장치의 시간대별 사용 패턴을 3시간 텀으로 분석합니다.

**경로 매개변수:**
- `device_id` (string): 장치 ID (예: SB-001)

**쿼리 매개변수:**
- `period` (string, 선택): 분석 기간 (기본값: 7d)

**응답 예시:**
```json
{
  "success": true,
  "message": "시간대별 사용 패턴을 성공적으로 조회했습니다.",
  "data": {
    "device_id": "SB-001",
    "period": "7d",
    "time_pattern": [
      {
        "time_slot": 0,
        "drop_count": 0,
        "full_events": 0,
        "label": "00"
      },
      {
        "time_slot": 3,
        "drop_count": 5,
        "full_events": 1,
        "label": "03"
      }
      // ... 3시간 텀별 데이터
    ],
    "peak_time_slot": 12,
    "total_drops": 25
  }
}
```

---

## 3. 전체 장치 시간대별 사용 패턴 분석

### GET /analytics/all-devices-time-pattern
전체 장치들의 시간대별 사용 패턴을 3시간 텀으로 분석합니다.

**쿼리 매개변수:**
- `period` (string, 선택): 분석 기간 (today, 24h, 7d, 30d, 기본값: 7d)

**응답 예시:**
```json
{
  "success": true,
  "message": "전체 장치의 시간대별 사용 패턴을 성공적으로 조회했습니다.",
  "data": {
    "period": "7d",
    "total_devices": 5,
    "time_pattern": [
      {
        "time_slot": 0,
        "total_drops": 0,
        "total_full_events": 0,
        "device_count": 0,
        "label": "00:00-03:00",
        "avg_drops_per_device": 0,
        "avg_full_events_per_device": 0
      },
      {
        "time_slot": 3,
        "total_drops": 1,
        "total_full_events": 0,
        "device_count": 2,
        "label": "03:00-06:00",
        "avg_drops_per_device": 0.5,
        "avg_full_events_per_device": 0
      }
      // ... 3시간 텀별 데이터 (00, 03, 06, 09, 12, 15, 18, 21)
    ],
    "peak_time_slot": {
      "time_slot": 3,
      "label": "03:00-06:00",
      "total_drops": 1,
      "device_count": 2,
      "avg_drops_per_device": 0.5
    },
    "total_drops": 2,
    "summary": {
      "most_active_time": {
        "time_slot": 3,
        "label": "03:00-06:00",
        "total_drops": 1,
        "device_count": 2,
        "avg_drops_per_device": 0.5
      },
      "least_active_time": {
        "time_slot": 0,
        "label": "00:00-03:00",
        "total_drops": 0,
        "device_count": 0,
        "avg_drops_per_device": 0
      },
      "peak_drops": 1,
      "total_periods": 8
    }
  }
}
```

---

## 4. 지역별 수거량 분석

### GET /analytics/regional
구 단위로 그룹화된 지역별 수거량을 분석합니다.

**쿼리 매개변수:**
- `period` (string, 선택): 분석 기간 (기본값: 7d)

**응답 예시:**
```json
{
  "success": true,
  "message": "지역별 수거량 분석을 성공적으로 조회했습니다.",
  "data": {
    "period": "7d",
    "regional_stats": [
      {
        "district_name": "강남구",
        "total_drops": 150,
        "device_count": 5,
        "avg_drops_per_device": 30.0,
        "devices": [
          {
            "device_id": "SB001",
            "location": "강남역 1번 출구",
            "drops": 45,
            "status": "active"
          }
        ]
      },
      {
        "district_name": "서초구",
        "total_drops": 120,
        "device_count": 3,
        "avg_drops_per_device": 40.0,
        "devices": []
      }
    ],
    "total_devices": 2,
    "most_active_location": {
      "district_name": "강남구",
      "total_drops": 150,
      "device_count": 5,
      "avg_drops_per_device": 30.0
    }
  }
}
```

---

## 5. 30분 사용현황 로그 조회

### GET /devices/:device_id/usage-logs
특정 장치의 30분 단위 사용현황 로그를 조회합니다.

**경로 매개변수:**
- `device_id` (string): 장치 ID

**쿼리 매개변수:**
- `period` (string, 선택): 조회 기간 (today, 24h, 7d, 30d, 기본값: today)

**응답 예시:**
```json
{
  "success": true,
  "message": "사용현황 로그를 성공적으로 조회했습니다.",
  "data": {
    "device_id": "SB-001",
    "period": "today",
    "start_time": "2024-01-15T00:00:00.000Z",
    "end_time": "2024-01-15T12:00:00.000Z",
    "total_periods": 24,
    "logs": [
      {
        "period_start": "2024-01-15T00:00:00.000Z",
        "period_end": "2024-01-15T00:30:00.000Z",
        "drop_count": 2,
        "full_events": 0
      }
    ]
  }
}
```

---

## 6. 주간 사용률 분석

### GET /devices/:device_id/weekly-usage
특정 장치의 주간 사용률을 분석합니다.

**경로 매개변수:**
- `device_id` (string): 장치 ID

**응답 예시:**
```json
{
  "success": true,
  "message": "주간 사용률을 성공적으로 조회했습니다.",
  "data": {
    "device_id": "SB-001",
    "current_week_drops": 150,
    "previous_week_drops": 120,
    "growth_rate": 25.0,
    "trend": "increasing"
  }
}
```

---

## 7. 일 평균 수거량 조회

### GET /devices/:device_id/daily-average
특정 장치의 일 평균 수거량을 계산합니다.

**경로 매개변수:**
- `device_id` (string): 장치 ID

**쿼리 매개변수:**
- `period` (string, 선택): 분석 기간 (기본값: 7d)

**응답 예시:**
```json
{
  "success": true,
  "message": "일 평균 수거량을 성공적으로 조회했습니다.",
  "data": {
    "device_id": "SB-001",
    "period": "7d",
    "daily_average": 21.4
  }
}
```

---

## 8. 주요 인사이트 조회

### GET /analytics/insights
분석 페이지용 주요 인사이트 데이터를 조회합니다.

**응답 예시:**
```json
{
  "success": true,
  "message": "주요 인사이트를 성공적으로 조회했습니다.",
  "data": {
    "insights": [
      {
        "id": 1,
        "type": "usage_pattern",
        "title": "점심시간 사용량 급증",
        "description": "12-14시 사이 평균 대비 2.3배 높은 사용률을 보입니다",
        "severity": "info",
        "impact": "high",
        "recommendation": "점심시간대 추가 수거 빈도 고려 필요",
        "data": {
          "peak_hours": "12-14시",
          "multiplier": 2.3,
          "average_usage": 156,
          "peak_usage": 312
        }
      },
      {
        "id": 2,
        "type": "capacity_management",
        "title": "강남구 추가 설치 필요",
        "description": "강남구의 포화율이 다른 지역 대비 1.8배 높습니다",
        "severity": "warning",
        "impact": "medium",
        "recommendation": "강남구 내 추가 스마트 빈 설치 검토",
        "data": {
          "district": "강남구",
          "saturation_rate": 1.8,
          "current_devices": 5,
          "recommended_devices": 8
        }
      }
    ],
    "total_count": 5,
    "high_impact_count": 2,
    "warning_count": 2
  }
}
```

---

## 9. 인터페이스 시뮬레이션 API

### POST /devices/:device_id/simulate/drop
꽁초 투입 시뮬레이션을 실행합니다.

**경로 매개변수:**
- `device_id` (string): 장치 ID

**응답 예시:**
```json
{
  "success": true,
  "message": "꽁초 투입 시뮬레이션이 성공적으로 실행되었습니다.",
  "data": {
    "device_id": "SB-001",
    "previous_level": 45,
    "current_level": 46,
    "fill_percentage": 46.0,
    "is_full": false,
    "status": "active",
    "simulated": true
  }
}
```

### POST /devices/:device_id/simulate/reset
장치 초기화 시뮬레이션을 실행합니다.

**경로 매개변수:**
- `device_id` (string): 장치 ID

**응답 예시:**
```json
{
  "success": true,
  "message": "장치 초기화 시뮬레이션이 성공적으로 실행되었습니다.",
  "data": {
    "device_id": "SB-001",
    "previous_level": 46,
    "current_level": 0,
    "fill_percentage": 0,
    "status": "active",
    "simulated": true
  }
}
```

### POST /devices/:device_id/simulate/full
포화 상태 설정 시뮬레이션을 실행합니다.

**경로 매개변수:**
- `device_id` (string): 장치 ID

**응답 예시:**
```json
{
  "success": true,
  "message": "포화 상태 설정 시뮬레이션이 성공적으로 실행되었습니다.",
  "data": {
    "device_id": "SB-001",
    "previous_level": 0,
    "current_level": 100,
    "fill_percentage": 100,
    "status": "full",
    "simulated": true
  }
}
```

---

## 데이터 구조 설명

### 시간대별 패턴 (3시간 텀)
- `00`: 00:00-02:59
- `03`: 03:00-05:59
- `06`: 06:00-08:59
- `09`: 09:00-11:59
- `12`: 12:00-14:59
- `15`: 15:00-17:59
- `18`: 18:00-20:59
- `21`: 21:00-23:59

### 장치 상태
- `active`: 정상 작동 중
- `full`: 포화 상태 (점검 필요)
- `offline`: 오프라인

### 더미 메트릭 데이터
- **민원 감소율**: 42.3% (+12.5% 전월 대비)
- **장비 사용률**: 87.2% (+5.3% 평균 사용률)

---

## 에러 응답

모든 API는 실패 시 다음과 같은 형식으로 응답합니다:

```json
{
  "success": false,
  "message": "오류 메시지",
  "error": "ERROR_CODE"
}
```

**HTTP 상태 코드:**
- `200`: 성공
- `400`: 잘못된 요청
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류
