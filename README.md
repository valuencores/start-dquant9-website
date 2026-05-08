# D.Quant 9.0 V.I.E — Virtual Investment Experience

> **"변동성이 수익이 되는 24시간을 경험하라."**
> Exclusive Invite-Only Platform

---

## 프로젝트 개요

D.Quant 9.0 V.I.E는 디퀀트나인의 알고리즘 운용 철학을 가상 투자 경험 기반으로 제공하는 풀스택 웹앱 프로토타입입니다. 실제 투자 권유 플랫폼이 아닌, **신뢰 형성형 전환 UX**를 목표로 설계된 초대형 시뮬레이션 플랫폼입니다.

### 핵심 목표
1. 초대 코드 기반 **Exclusive 진입 경험** 제공
2. 알고리즘 배지 및 실시간 카운터로 **시스템 신뢰 형성**
3. 3일 주기 리포트, 월간 정산으로 **지속적 접점 유지**
4. 모든 화면에서 **"전문 파트너와 실제 투자 상담하기"** CTA로 전환 유도

---

## 완성된 기능

### 화면 구성
| 파일 | 화면명 | 설명 |
|------|--------|------|
| `index.html` | Invite Landing | 초대 코드 입력, 서비스 소개, 포트폴리오 미리보기 |
| `onboarding.html` | 온보딩 / 회원가입 | 4단계 스텝 가입 (코드확인→정보입력→포트폴리오선택→완료) |
| `dashboard.html` | 메인 대시보드 | KPI 카드, 알고리즘 배지, 실시간 카운터, 수익 곡선, CTA |
| `reports.html` | 리포트 히스토리 | 탭 필터, 카드형 목록, 리포트 상세 모달 |
| `consult.html` | 파트너 상담 전환 | 상담 방식 선택, 신청 폼, 파트너 정보, FAQ |
| `mypage.html` | My / 설정 | 프로필, 포트폴리오 현황, 알림 토글, 로그아웃 |
| `login.html` | 로그인 | 저장 계정 카드, 비밀번호 토글, 비밀번호 재설정 모달 |
| `admin-notify.html` | 알림 관리자 | Make.com 웹훅 설정, 카카오 알림톡 일괄 발송, 발송 이력 |
| `setup-guide.html` | 설정 가이드 | Make.com + 카카오 알림톡 단계별 연동 가이드, 비용표, 체크리스트 |

### 공통 파일
- `css/vie.css` — 전체 글로벌 스타일시트 (CSS 변수, 레이아웃, 컴포넌트)
- `js/vie-app.js` — 핵심 앱 로직 (API, Auth, Simulator, Counter, Toast, Chart 헬퍼)

---

## 진입 URI 및 파라미터

| URL | 접근 조건 | 설명 |
|-----|-----------|------|
| `/index.html` | 누구나 | 초대 랜딩 (초대 코드 없으면 가입 불가) |
| `/onboarding.html` | 코드 검증 후 | 회원가입 + 포트폴리오 선택 |
| `/dashboard.html` | 로그인 필요 | 메인 대시보드 (미로그인 시 index.html 리다이렉트) |
| `/reports.html` | 로그인 필요 | 리포트 히스토리 |
| `/consult.html` | 로그인 필요 | 파트너 상담 신청 |
| `/mypage.html` | 로그인 필요 | My/설정 |
| `/login.html` | 누구나 | 로그인 |
| `/admin-notify.html` | 관리자 전용 | 카카오 알림 관리자 |
| `/setup-guide.html` | 누구나 | Make.com 연동 가이드 |

---

## 데이터 모델 (RESTful Table API)

### `vie_invite_codes` — 초대 코드
| 필드 | 타입 | 설명 |
|------|------|------|
| id | text | UUID |
| code | text | 초대 코드값 (예: DQ9-ALPHA-2026) |
| partner_id | text | 코드 발급 파트너 ID |
| partner_name | text | 파트너명 |
| is_used | bool | 사용 여부 |
| used_by | text | 사용한 사용자 ID |
| expires_at | datetime | 만료일시 |

**기본 초대 코드:**
- `DQ9-ALPHA-2026` (밸류앤코어스)
- `DQ9-BETA-2026` (이서연 파트너)
- `VIE-PREMIUM-01` (박지훈 파트너)
- `DQUANT-DEMO` (밸류앤코어스)

### `vie_users` — 사용자 계정
| 필드 | 타입 | 설명 |
|------|------|------|
| id | text | UUID |
| name | text | 이름 |
| email | text | 이메일 |
| phone | text | 휴대전화 |
| invite_code | text | 사용한 초대 코드 |
| partner_id | text | 연결 파트너 ID |
| selected_portfolios | array | 선택 포트폴리오 (최대 2개) |
| signup_date | datetime | 가입일시 |
| status | text | active / pending / suspended |
| email_notify | bool | 이메일 알림 동의 |
| kakao_notify | bool | 카카오 알림 동의 |

### `vie_portfolios` — 포트폴리오 정보
| 등급 | 투자금 | 알고리즘 | 월 수익률 |
|------|--------|----------|-----------|
| Core | 1,000만원 | D-Grouping | 2.5% |
| Growth | 3,000만원 | D-Grid | 3.0% |
| Premium | 5,000만원 | D-Grid | 4.0% |
| Strategy A | 1억원 | D-Hybrid | 4.0% |
| Strategy B | 2억원 | D-Hybrid | 4.0% |

### `vie_reports` — 성과 리포트
- report_type: `onboarding` / `performance_3d` / `monthly_settlement`
- 3일 주기 자동 생성 (VieSimulator.generateReports)

### `vie_notifications` — 알림 이력
- notif_type: `onboarding` / `report_3d` / `monthly` / `system` / `consult` / `custom`
- channel: `email` / `kakao` / `both` / `in_app`
- status: `sent` / `failed` / `error` / `pending`
- recipient: 수신자 전화번호 (마스킹 저장)
- message: 실제 발송 메시지 전문 (최대 500자)

### `vie_consultations` — 상담 신청
- consult_method: `phone` / `kakao` / `meeting` / `info_request`
- status: `submitted` / `in_progress` / `completed` / `cancelled`

---

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES2020+)
- **Charts**: Chart.js 4.4
- **Icons**: Font Awesome 6.5
- **Fonts**: Noto Sans KR + Inter (Google Fonts)
- **Data**: RESTful Table API (tables/{table_name})
- **Storage**: localStorage (세션 상태 관리)

---

## 주요 컴포넌트 (js/vie-app.js)

| 클래스/모듈 | 기능 |
|-------------|------|
| `VieAuth` | 로그인 상태 관리, 세션 저장/삭제, 인증 리다이렉트 |
| `VieAPI` | REST API CRUD 헬퍼 (GET, POST, PATCH, DELETE) |
| `VieStorage` | localStorage 래퍼 (prefix: `vie_`) |
| `VieInvite` | 초대 코드 검증 (API + Demo fallback) |
| `VieSimulator` | 수익 시뮬레이션 엔진 (일일 누적, 기간별 수익) |
| `VieCounter` | 실시간 변동성 수익 카운터 (초단위 증가) |
| `VieChart` | Chart.js 래퍼 (lineChart, datasetStyle) |
| `VieToast` | 토스트 알림 (success/error/info) |
| `VieFmt` | 포맷 헬퍼 (만원, %, 날짜, 상대시간) |
| `ViePortfolioUI` | 포트폴리오/알고리즘 UI 빌더 |
| `VieNotify` | 카카오 알림톡 발송 (js/vie-notify.js) |
| `VieNotifyAdmin` | 전체/선택 회원 일괄 발송, 이력 조회 |
| `VieNotifyTrigger` | 온보딩 완료/상담 신청/3일 주기 자동 트리거 |

---

## 세션 흐름

```
index.html (초대 코드 입력)
  ↓ VieInvite.verify(code) → localStorage 저장
onboarding.html (4단계)
  ↓ VieAPI.post(vie_users) → VieAuth.setUser(user)
dashboard.html (메인 허브)
  ↓ VieAuth.requireAuth() — 미로그인 시 index.html
reports.html / consult.html / mypage.html
  ↓ 모두 인증 필요
```

---

## 알림 시스템 (Make.com + 카카오 알림톡)

### 구성 파일
| 파일 | 역할 |
|------|------|
| `js/vie-notify.js` | 알림 코어 모듈 (VieNotify, VieNotifyAdmin, VieNotifyTrigger) |
| `admin-notify.html` | 관리자 발송 UI (웹훅 설정, 일괄 발송, 이력 조회) |
| `setup-guide.html` | Make.com + 카카오 연동 단계별 가이드 |

### 비용 구조
| 항목 | 비용 |
|------|------|
| Make.com 무료 플랜 | 무료 (월 1,000 오퍼레이션) |
| 카카오 채널 개설 | 무료 |
| 알림톡 발송 | 약 8~15원/건 |
| **9명 × 월 4회 기준** | **약 288~540원/월** |

### 설정 순서
1. `setup-guide.html` 접속 → 체크리스트 순서대로 진행
2. Make.com 계정 생성 → Webhook URL 발급
3. 카카오 비즈 채널 개설 → BizMessage 신청
4. `admin-notify.html` → 웹훅 URL 저장 → 테스트 발송

---

## 미구현 / 향후 개발 예정

- [ ] 파트너 어드민 패널 (초대 코드 발급, 사용자 현황)
- [ ] 이메일 알림 실제 연동 (Make.com + Gmail/SendGrid)
- [ ] 3일 주기 자동 리포트 생성 스케줄러
- [ ] 알고리즘 엠블럼 이미지 (SVG/PNG 에셋)
- [ ] 다국어 지원 (영어)
- [ ] 월간 정산 상세 페이지
- [ ] 실제 포트폴리오 변경 요청 플로우

---

## 다음 개발 단계 권장

1. **파트너 어드민 대시보드** — 초대 코드 관리, 사용자 리스트, 상담 신청 현황
2. **자동화 알림 백엔드** — 이메일 (SendGrid/SES), 카카오 알림톡 연동
3. **리얼 데이터 연동** — 실제 알고리즘 성과 데이터 API 연결
4. **월간 정산 상세 페이지** — 정산 내역 PDF 다운로드, 내역서 발급

---

## 개발 노트 (Genspark AI 모드 전환용)

이 프로젝트는 **Genspark AI Developer Mode**에서 풀스택으로 확장 가능하도록 설계되었습니다.

### 서버사이드 추가 구현 포인트:
- `POST /api/verify-invite` — 초대 코드 검증 엔드포인트
- `POST /api/send-report-email` — 리포트 이메일 발송
- `POST /api/kakao-notification` — 카카오 알림톡 발송
- `GET /api/simulate/:userId` — 사용자별 실시간 시뮬레이션 데이터
- `POST /api/schedule-reports` — 3일 주기 리포트 스케줄링

### 데이터베이스 마이그레이션:
현재 RESTful Table API(`tables/`) 기반으로 작동하며, PostgreSQL/MySQL로 마이그레이션 시 동일한 REST 인터페이스를 유지하면 됩니다.

---

*© 2026 D.Quant Nine. All rights reserved. 본 서비스는 가상 투자 경험 시뮬레이션을 제공하며 실제 투자를 권유하지 않습니다.*

