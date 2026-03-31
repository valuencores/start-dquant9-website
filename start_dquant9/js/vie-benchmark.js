/**
 * D.Quant 9.0 V.I.E — Benchmark Engine
 * 투자자 4명 실시간 시나리오 계산 엔진
 * 시작일: 2025-11-01 / 계속 진행
 */
'use strict';

/* ================================================================
   투자자 기본 설정
   ================================================================ */
const BM_CONFIG = {
  START_DATE: new Date('2025-11-01T00:00:00'),

  /*
   * 디퀀트나인 공식 포트폴리오별 월 고정 수익률
   * A — Core       1,000만원  → 월 2.5%  (D-Grouping)
   * B — Growth     3,600만원  → 월 3.0%  (D-Grid)
   * C — Premium    5,000만원  → 월 4.0%  (D-Grid)
   * D — Strategy A 1억원      → 월 4.0%  (D-Hybrid)
   */
  INVESTORS: {
    A: {
      id: 'A', name: '투자자 A', color: '#4a90e2', colorRgb: '74,144,226',
      principal: 10000000,          // 1,000만원
      startDate: '2025-11-01',
      portfolio: 'Core',
      strategy: 'D-Grouping',
      icon: 'fa-shield-halved',
      baseMonthlyRate: 0.025,       // 월 고정 2.5%
      rateRange: [0.025, 0.030],
      badge: '안정 보수형',
      desc: '1,000만원 Core 등급. D-Grouping 전략으로 리스크 방어 최우선. 월 2.5% 고정 수익률 기준 안정 복리 운용 중.',
      // ── 페르소나 정보 ──
      persona: {
        age: 38,
        ageGroup: '30대',
        initial: '김',
        job: '직장인 · 중견기업 과장',
        jobIcon: 'fa-briefcase',
        jobColor: '#4a90e2',
        purpose: '월급 외 안정적인 부수입 확보',
        purposeDetail: '결혼 3년차, 내 집 마련 자금을 목표로 리스크 없이 꾸준하게 불리고 싶다',
        keyword: ['안정', '저위험', '첫 투자'],
        emoji: '🏠'
      }
    },
    B: {
      id: 'B', name: '투자자 B', color: '#36b37e', colorRgb: '54,179,126',
      principal: 36000000,          // 3,600만원
      startDate: '2025-11-01',
      portfolio: 'Growth',
      strategy: 'D-Grid',
      icon: 'fa-table-cells',
      baseMonthlyRate: 0.030,       // 월 고정 3.0%
      rateRange: [0.030, 0.035],
      badge: '안정 성장형',
      desc: '3,600만원 Growth 등급. D-Grid 전략으로 변동성 구간 반복 포착. 월 3.0% 고정 수익률 기준 복리 누적 운용 중.',
      // ── 페르소나 정보 ──
      persona: {
        age: 47,
        ageGroup: '40대',
        initial: '이',
        job: '자영업자 · 외식업 대표',
        jobIcon: 'fa-store',
        jobColor: '#36b37e',
        purpose: '사업 이익의 분산 투자 및 노후 준비',
        purposeDetail: '매출 변동이 크다 보니 일정한 수익이 나오는 채널이 필요했다. 복리 성장이 핵심',
        keyword: ['성장', '복리', '분산'],
        emoji: '📈'
      }
    },
    C: {
      id: 'C', name: '투자자 C', color: '#7c6fa6', colorRgb: '124,111,166',
      principal: 50000000,          // 5,000만원
      startDate: '2025-11-01',
      portfolio: 'Premium',
      strategy: 'D-Grid',
      icon: 'fa-circle-nodes',
      baseMonthlyRate: 0.040,       // 월 고정 4.0%
      rateRange: [0.038, 0.042],
      badge: '프리미엄 포착형',
      desc: '5,000만원 Premium 등급. D-Grid 다층 구조로 대형 변동성 이벤트 집중 포착. 월 4.0% 고정 수익률 기준 운용 중.',
      // ── 페르소나 정보 ──
      persona: {
        age: 54,
        ageGroup: '50대',
        initial: '박',
        job: '전문직 · 개원 치과의사',
        jobIcon: 'fa-user-doctor',
        jobColor: '#9d8ec7',
        purpose: '전문직 고소득 여유 자금의 수익 극대화',
        purposeDetail: '은행 이자가 아깝다. 높은 수익률로 자산 규모를 빠르게 키워 은퇴 전 자산을 두 배로',
        keyword: ['수익극대화', '고수익', '은퇴준비'],
        emoji: '💎'
      }
    },
    D: {
      id: 'D', name: '투자자 D', color: '#c99456', colorRgb: '201,148,86',
      principal: 100000000,         // 1억원
      startDate: '2025-11-01',
      portfolio: 'Strategy A',
      strategy: 'D-Hybrid',
      icon: 'fa-bolt',
      baseMonthlyRate: 0.040,       // 월 고정 4.0%
      rateRange: [0.038, 0.042],
      badge: '하이브리드 전략형',
      desc: '1억원 Strategy A 등급. D-Hybrid로 방어·확장 동시 수행. 월 4.0% 고정 수익률 기준 시장 국면별 자동 전환 중.',
      // ── 페르소나 정보 ──
      persona: {
        age: 61,
        ageGroup: '60대',
        initial: '최',
        job: '기업인 · 제조업 CEO',
        jobIcon: 'fa-building',
        jobColor: '#e0b060',
        purpose: '은퇴 후 자산 보전 + 월 현금흐름 창출',
        purposeDetail: '은퇴했지만 자산이 쉬면 안 된다. 대형 자본으로 안정적인 월 현금흐름을 만드는 것이 목표',
        keyword: ['현금흐름', '자산보전', '대형자본'],
        emoji: '🏦'
      }
    }
  },

  // 월별 시나리오 — 고정 수익률 기준 (시장 이슈·코멘트 포함)
  MONTHLY_SCENARIOS: [
    {
      month: '2025-11', label: '2025년 11월',
      issue: '비트코인 사상최고가 경신 (BTC $97,000 돌파), 알트코인 급등락',
      highlight: '급등 구간 포착 집중, 리스크 관리 강화',
      // 고정 수익률 그대로 적용 (시장 호조 — 기준 달성)
      rates: { A: 0.030, B: 0.025, C: 0.040, D: 0.040 },
      note: '시장 변동성 극대화 구간 — 고정 수익률 기준 정상 달성'
    },
    {
      month: '2025-12', label: '2025년 12월',
      issue: '연말 포지션 정리 매물 + BTC $100,000 돌파 후 횡보',
      highlight: '월말 정산, 안전자산 비중 조정, 복리 재투자 실행',
      rates: { A: 0.030, B: 0.025, C: 0.040, D: 0.040 },
      note: '연말 결산 — 고정 수익률 기준 복리 재배치 완료'
    },
    {
      month: '2026-01', label: '2026년 1월',
      issue: '신년 강세장 기대 + 미국 금리 동결 발표, 기관 매수 증가',
      highlight: '신규 포지션 확대, 그리드 구간 재설정',
      rates: { A: 0.030, B: 0.025, C: 0.040, D: 0.040 },
      note: '신년 랠리 수혜 — 고정 수익률 기준 달성, 복리 누적 가속'
    },
    {
      month: '2026-02', label: '2026년 2월',
      issue: '글로벌 매크로 불확실성 (관세 전쟁 재개), 단기 급락 구간',
      highlight: '급락 구간 역추세 포착, D-Grouping 방어 가동',
      rates: { A: 0.030, B: 0.025, C: 0.040, D: 0.040 },
      note: '급락 방어 성공 — 고정 수익률 유지, 하락 구간 역추세 수익화'
    },
    {
      month: '2026-03', label: '2026년 3월',
      issue: '분기말 기관 리밸런싱 + 이더리움 ETF 승인 기대감',
      highlight: '알트 시즌 진입 대비, 포트폴리오 구성 최적화',
      rates: { A: 0.030, B: 0.025, C: 0.040, D: 0.040 },
      note: '분기말 정산 — ETF 호재로 포지션 확장, 고정 수익률 기준 유지'
    },
    // 이후 예측 (향후 시나리오)
    {
      month: '2026-04', label: '2026년 4월 (예측)',
      issue: '이더리움 ETF 승인 후 시장 반응, 반감기 후행 효과 지속',
      highlight: '알트코인 분산 포착, 수익 실현 구간 조절',
      rates: { A: 0.030, B: 0.025, C: 0.040, D: 0.040 },
      note: '예측값 — 알트 시즌 수혜, 고정 수익률 기준 지속 예상',
      predicted: true
    },
    {
      month: '2026-05', label: '2026년 5월 (예측)',
      issue: '미국 친크립토 정책 구체화, 기관 자금 유입 가속',
      highlight: '대형 변동성 이벤트 대비 포지션 확대',
      rates: { A: 0.030, B: 0.025, C: 0.040, D: 0.040 },
      note: '예측값 — 기관 수요 증가로 상승 랠리, 고정 수익률 기준 예상',
      predicted: true
    },
    {
      month: '2026-06', label: '2026년 6월 (예측)',
      issue: '반기말 포지션 정리, 여름 횡보 구간 진입 가능성',
      highlight: '그리드 구간 축소, 안전자산 비중 확대',
      rates: { A: 0.030, B: 0.025, C: 0.040, D: 0.040 },
      note: '예측값 — 횡보 구간 보수 운용, 고정 수익률 기준 유지',
      predicted: true
    }
  ],

  // 투자자별 전략 변화 기록
  STRATEGY_CHANGES: {
    A: [
      { month: '2025-11', change: '초기 D-Grid 기본 설정, 3개 구간 그리드 배치' },
      { month: '2025-12', change: '연말 수익 복리 재투자, 구간 밀도 20% 증가' },
      { month: '2026-01', change: '신년 랠리 대비 상단 포지션 2개 추가' },
      { month: '2026-02', change: '하락 방어 구간 하단 추가, 역추세 대응 활성화' },
      { month: '2026-03', change: '분기말 포트폴리오 리밸런싱, 수익 구간 재배치' }
    ],
    B: [
      { month: '2025-11', change: 'D-Grouping 안정 모드, 1개 핵심 구간 집중' },
      { month: '2025-12', change: '연말 정산 완료, 원금 기준 재설정' },
      { month: '2026-01', change: '구간 소폭 확대, 리스크 한도 내 수익성 개선' },
      { month: '2026-02', change: '급락 구간 방어 성공, 포지션 유지' },
      { month: '2026-03', change: '안정적 수익 지속, 전략 변경 없음 (최적 상태)' }
    ],
    C: [
      { month: '2025-11', change: 'D-Grid 다층 구조 시작, 5개 구간 배치' },
      { month: '2025-12', change: '수익 극대화 위해 레이어 7개로 확장' },
      { month: '2026-01', change: '신년 랠리 수혜, 상단 레이어 2개 추가' },
      { month: '2026-02', change: '급락 구간 중간 레이어 포착 성공, 수익 방어' },
      { month: '2026-03', change: 'ETF 기대감 반영, 상단 포지션 사전 배치' }
    ],
    D: [
      { month: '2025-11', change: 'D-Hybrid 풀 스펙 가동, 방어+포착 동시 운용' },
      { month: '2025-12', change: '연말 헤징 포지션 추가, 수익 보전 구조 강화' },
      { month: '2026-01', change: '방어 모드 해제, 공격적 포착 모드 전환' },
      { month: '2026-02', change: '자동 전환 시스템 가동, 하락 구간 방어 모드' },
      { month: '2026-03', change: '하이브리드 최적화 완료, 시장 국면 자동 감지 중' }
    ]
  }
};

/* ================================================================
   수익 계산 엔진
   ================================================================ */
const BmCalc = {

  /** 시작일로부터 현재까지 경과 일수 */
  daysSinceStart() {
    return Math.floor((Date.now() - BM_CONFIG.START_DATE.getTime()) / 86400000);
  },

  /** 경과 주 수 */
  weeksSinceStart() {
    return Math.floor(this.daysSinceStart() / 7);
  },

  /** 경과 월 수 (소수점 포함) */
  monthsSinceStart() {
    const now = new Date();
    const start = BM_CONFIG.START_DATE;
    return (now.getFullYear() - start.getFullYear()) * 12
         + (now.getMonth() - start.getMonth())
         + (now.getDate() - start.getDate()) / 30;
  },

  /** 완료된 달 개수 (정수) */
  completedMonths() {
    const now = new Date();
    const start = BM_CONFIG.START_DATE;
    let m = (now.getFullYear() - start.getFullYear()) * 12
           + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) m--;
    return Math.max(0, m);
  },

  /** 월별 수익 계산 (복리) */
  calcMonthlyData(investor) {
    const inv = BM_CONFIG.INVESTORS[investor];
    const scenarios = BM_CONFIG.MONTHLY_SCENARIOS;
    const completedM = this.completedMonths();

    let cumulative = inv.principal;
    const rows = [];

    scenarios.forEach((sc, idx) => {
      const rate = sc.rates[investor];
      const profit = cumulative * rate;
      cumulative += profit;

      const totalProfit = cumulative - inv.principal;
      const totalRate = (totalProfit / inv.principal) * 100;
      const isPast = !sc.predicted && idx < completedM;
      const isCurrent = !sc.predicted && idx === completedM;

      rows.push({
        month:       sc.month,
        label:       sc.label,
        rate:        rate * 100,
        profit:      profit,
        cumulative:  cumulative,
        totalProfit: totalProfit,
        totalRate:   totalRate,
        isPast:      isPast,
        isCurrent:   isCurrent,
        predicted:   sc.predicted || false,
        issue:       sc.issue,
        highlight:   sc.highlight,
        note:        sc.note
      });
    });
    return rows;
  },

  /** 주별 수익 계산 */
  calcWeeklyData(investor) {
    const inv = BM_CONFIG.INVESTORS[investor];
    const monthlyData = this.calcMonthlyData(investor);
    const weeks = [];

    let runningTotal = inv.principal;
    monthlyData.forEach(m => {
      const weeklyRate = m.rate / 4;  // 월 수익률 / 4주
      for (let w = 1; w <= 4; w++) {
        const wProfit = runningTotal * (weeklyRate / 100);
        runningTotal += wProfit;
        weeks.push({
          label:      `${m.label.replace('년 ','').replace('월','')} ${w}주`,
          rate:       weeklyRate,
          profit:     wProfit,
          cumulative: runningTotal,
          predicted:  m.predicted || false
        });
      }
    });
    return weeks;
  },

  /** 현재 누적 수익 (실시간) */
  getCurrentStats(investor) {
    const inv = BM_CONFIG.INVESTORS[investor];
    const rows = this.calcMonthlyData(investor);
    const daysTotal = this.daysSinceStart();

    // 완료된 달 수익 합산
    const completedM = this.completedMonths();
    let baseVal = inv.principal;
    for (let i = 0; i < Math.min(completedM, rows.length); i++) {
      baseVal = rows[i].cumulative;
    }

    // 현재 월 진행분 일할 계산
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const monthProgress = dayOfMonth / daysInMonth;

    const currentMonthIdx = Math.min(completedM, rows.length - 1);
    const currentMonthRate = rows[currentMonthIdx]?.rate || inv.baseMonthlyRate * 100;
    const partialProfit = baseVal * (currentMonthRate / 100) * monthProgress;

    const currentVal = baseVal + partialProfit;
    const totalProfit = currentVal - inv.principal;
    const totalRate = (totalProfit / inv.principal) * 100;

    return {
      principal:   inv.principal,
      currentVal,
      totalProfit,
      totalRate,
      monthlyRate: currentMonthRate,
      daysTotal,
      completedM
    };
  },

  /** USDT 환산 */
  toUsdt(krw, rate) {
    return krw / (rate || 1350);
  },

  /** 숫자 포맷 */
  fmt(n, digits = 0) {
    return Math.round(n).toLocaleString('ko-KR');
  },
  fmtRate(r) {
    return (r >= 0 ? '+' : '') + r.toFixed(2) + '%';
  },
  fmtM(n) {
    if (Math.abs(n) >= 100000000) return (n/100000000).toFixed(2) + '억';
    if (Math.abs(n) >= 10000)     return (n/10000).toFixed(0) + '만';
    return n.toLocaleString();
  }
};

/* ================================================================
   USDT 실시간 환율 fetch (Binance public API)
   ================================================================ */
const BmUsdt = {
  rate: 1380,
  async fetch() {
    // 업비트 공개 API (CORS 허용)
    try {
      const r = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT',
        { signal: AbortSignal.timeout(5000) });
      const j = await r.json();
      if (j?.[0]?.trade_price) { this.rate = j[0].trade_price; return this.rate; }
    } catch(_) {}
    // CoinGecko 공개 API (CORS 허용, 무료)
    try {
      const r2 = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=krw',
        { signal: AbortSignal.timeout(5000) });
      const j2 = await r2.json();
      if (j2?.tether?.krw) { this.rate = j2.tether.krw; return this.rate; }
    } catch(_) {}
    // 고정 폴백
    return this.rate;
  }
};
