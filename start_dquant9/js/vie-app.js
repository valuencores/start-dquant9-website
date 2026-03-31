/**
 * D.Quant 9.0 V.I.E — Core Application Logic
 * Version: 1.0.0
 */

'use strict';

/* ================================================================
   CONSTANTS & CONFIG
   ================================================================ */
const VIE_CONFIG = {
  APP_NAME: 'D.Quant 9.0 V.I.E',
  VERSION:  '1.0.0',
  STORAGE_PREFIX: 'vie_',
  API_BASE: 'tables',
  TABLES: {
    USERS:        'vie_users',
    PORTFOLIOS:   'vie_portfolios',
    REPORTS:      'vie_reports',
    NOTIFICATIONS:'vie_notifications',
    CONSULTATIONS:'vie_consultations',
    INVITE_CODES: 'vie_invite_codes'
  },
  PORTFOLIOS: {
    'Core':       { rate: 0.025, color: '#4a90e2', algo: 'D-Grouping', principal: 1000 },
    'Growth':     { rate: 0.030, color: '#36b37e', algo: 'D-Grid',     principal: 3000 },
    'Premium':    { rate: 0.040, color: '#7c6fa6', algo: 'D-Grid',     principal: 5000 },
    'Strategy A': { rate: 0.040, color: '#c99456', algo: 'D-Hybrid',   principal: 10000 },
    'Strategy B': { rate: 0.040, color: '#e05c5c', algo: 'D-Hybrid',   principal: 20000 }
  },
  ALGORITHMS: {
    'D-Grouping': {
      icon: 'fa-shield-halved',
      desc: '리스크를 먼저 방어하는 안정 중심 엔진',
      class: 'grouping',
      color: '#00d4ff'
    },
    'D-Grid': {
      icon: 'fa-table-cells',
      desc: '반복 변동성을 수익 기회로 전환하는 포착 엔진',
      class: 'grid',
      color: '#00e5a0'
    },
    'D-Hybrid': {
      icon: 'fa-circle-nodes',
      desc: '방어와 확장을 동시에 수행하는 상위 전략 엔진',
      class: 'hybrid',
      color: '#8b5cf6'
    }
  },
  COUNTER: {
    BASE_MULTIPLIER: 1_200,  // Won per second (base)
    UPDATE_INTERVAL: 1200,   // ms
    STARTUP_DATE: new Date('2026-01-01T00:00:00')
  }
};

/* ================================================================
   LOCAL STORAGE HELPERS
   ================================================================ */
const VieStorage = {
  set(key, value) {
    try {
      localStorage.setItem(VIE_CONFIG.STORAGE_PREFIX + key, JSON.stringify(value));
    } catch(e) { console.warn('VieStorage.set failed:', e); }
  },
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(VIE_CONFIG.STORAGE_PREFIX + key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch(e) { return fallback; }
  },
  remove(key) {
    localStorage.removeItem(VIE_CONFIG.STORAGE_PREFIX + key);
  },
  clear() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(VIE_CONFIG.STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};

/* ================================================================
   API HELPERS
   ================================================================ */
const VieAPI = {
  async get(table, params = {}) {
    const q = new URLSearchParams(params).toString();
    const r = await fetch(`${VIE_CONFIG.API_BASE}/${table}${q ? '?' + q : ''}`);
    if (!r.ok) throw new Error(`GET ${table} failed: ${r.status}`);
    return r.json();
  },
  async getOne(table, id) {
    const r = await fetch(`${VIE_CONFIG.API_BASE}/${table}/${id}`);
    if (!r.ok) throw new Error(`GET ${table}/${id} failed: ${r.status}`);
    return r.json();
  },
  async post(table, data) {
    const r = await fetch(`${VIE_CONFIG.API_BASE}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`POST ${table} failed: ${r.status}`);
    return r.json();
  },
  async patch(table, id, data) {
    const r = await fetch(`${VIE_CONFIG.API_BASE}/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`PATCH ${table}/${id} failed: ${r.status}`);
    return r.json();
  },
  async delete(table, id) {
    const r = await fetch(`${VIE_CONFIG.API_BASE}/${table}/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(`DELETE ${table}/${id} failed: ${r.status}`);
  }
};

/* ================================================================
   AUTH HELPERS
   ================================================================ */
const VieAuth = {
  /** Check if user is logged in */
  isLoggedIn() {
    return !!VieStorage.get('currentUser');
  },
  /** Get current user */
  getUser() {
    return VieStorage.get('currentUser');
  },
  /** Save session */
  setUser(user) {
    VieStorage.set('currentUser', user);
  },
  /** Clear session */
  logout() {
    VieStorage.remove('currentUser');
    VieStorage.remove('onboardingData');
    window.location.href = 'login.html';
  },
  /** Redirect to login if not authenticated */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
  /** Redirect to dashboard if already logged in */
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = 'dashboard.html';
    }
  },
  /**
   * 로그인: email + password 검증
   * 재로그인 시 초대 코드 불필요 — 이미 가입된 계정이면 이메일+비밀번호만으로 세션 복원
   * 우선순위: ① localStorage(demoUsers) → ② API 조회 → ③ currentUser 복원
   */
  async login(email, password) {
    const emailLow = email.toLowerCase();

    // 1) localStorage demoUsers에서 이메일 + 비밀번호 일치 확인 (최우선)
    const demoUsers = VieStorage.get('demoUsers') || [];
    const demoMatch = demoUsers.find(u => u.email?.toLowerCase() === emailLow);
    if (demoMatch) {
      // 비밀번호가 저장된 경우 검증, 없으면 이메일만으로 허용(레거시 호환)
      if (demoMatch.password && demoMatch.password !== password) {
        return { success: false, reason: 'wrong_password' };
      }
      this.setUser(demoMatch);
      return { success: true, user: demoMatch };
    }

    // 2) API에서 이메일로 검색 (초대 코드 불필요 — 이미 등록된 계정)
    try {
      const res = await VieAPI.get(VIE_CONFIG.TABLES.USERS, { search: email, limit: 50 });
      const match = res.data?.find(u => u.email?.toLowerCase() === emailLow);
      if (match) {
        // API에 password 필드가 있으면 검증, 없으면 이메일 일치로 세션 부여
        if (match.password && match.password !== password) {
          return { success: false, reason: 'wrong_password' };
        }
        this.setUser(match);
        // demoUsers에도 동기화 (다음 로그인 시 빠른 조회)
        this.registerDemo(match);
        return { success: true, user: match };
      }
    } catch(e) { /* API 실패 시 다음 단계로 */ }

    // 3) 현재 세션에 같은 이메일이 있으면 복원 (브라우저 탭 재접속 등)
    const stored = VieStorage.get('currentUser');
    if (stored && stored.email?.toLowerCase() === emailLow) {
      if (stored.password && stored.password !== password) {
        return { success: false, reason: 'wrong_password' };
      }
      this.setUser(stored);
      return { success: true, user: stored };
    }

    return { success: false, reason: 'not_found' };
  },

  /**
   * 가입한 계정 목록을 demoUsers에 저장 (재로그인 시 초대 코드 없이 참조)
   * 비밀번호도 함께 저장하여 재로그인 검증에 활용
   */
  registerDemo(user) {
    const list = VieStorage.get('demoUsers') || [];
    const exists = list.findIndex(u => u.email === user.email);
    if (exists >= 0) list[exists] = { ...list[exists], ...user };
    else list.push(user);
    VieStorage.set('demoUsers', list);
  }
};

/* ================================================================
   INVITE CODE VERIFICATION
   ================================================================ */
const VieInvite = {
  async verify(code) {
    try {
      const result = await VieAPI.get(
        VIE_CONFIG.TABLES.INVITE_CODES,
        { search: code, limit: 50 }
      );
      const match = result.data?.find(
        r => r.code?.toUpperCase() === code.toUpperCase() && !r.is_used
      );
      if (match) {
        VieStorage.set('onboardingData', {
          invite_code: code,
          partner_id:  match.partner_id,
          partner_name: match.partner_name,
          invite_record_id: match.id
        });
        return { valid: true, partner_name: match.partner_name, partner_id: match.partner_id };
      }
      return { valid: false, reason: 'not_found' };
    } catch(e) {
      console.error('Invite verify error:', e);
      // Demo fallback
      const DEMO_CODES = {
        'DQ9-ALPHA-2026':  { partner_name: '밸류앤코어스', partner_id: 'P001' },
        'DQ9-BETA-2026':   { partner_name: '밸류앤코어스', partner_id: 'P001' },
        'VIE-PREMIUM-01':  { partner_name: '밸류앤코어스', partner_id: 'P001' },
        'DQUANT-DEMO':     { partner_name: '밸류앤코어스', partner_id: 'P001' }
      };
      const demo = DEMO_CODES[code.toUpperCase()];
      if (demo) {
        VieStorage.set('onboardingData', { invite_code: code, ...demo });
        return { valid: true, ...demo };
      }
      return { valid: false, reason: 'error' };
    }
  }
};

/* ================================================================
   SIMULATION ENGINE
   ================================================================ */
const VieSimulator = {
  /**
   * Calculate daily cumulative profit series
   * @param {number} principal - in 만원
   * @param {number} monthlyRate - e.g. 0.04 for 4%
   * @param {number} days
   */
  dailySeries(principal, monthlyRate, days) {
    const dailyRate = monthlyRate / 30;
    const series = [];
    for (let d = 0; d <= days; d++) {
      const value = principal * (1 + dailyRate * d);
      series.push(Math.round(value * 10) / 10);
    }
    return series;
  },

  /**
   * Calculate cumulative profit after N days
   */
  profitAfterDays(principal, monthlyRate, days) {
    const dailyRate = monthlyRate / 30;
    return Math.round(principal * dailyRate * days * 10) / 10;
  },

  /**
   * Calculate cumulative return rate
   */
  returnRate(principal, monthlyRate, days) {
    const profit = this.profitAfterDays(principal, monthlyRate, days);
    return Math.round((profit / principal) * 1000) / 10;
  },

  /**
   * Days since a given date
   */
  daysSince(dateStr) {
    const start = new Date(dateStr);
    const now   = new Date();
    const raw   = (now - start) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.round(raw * 10) / 10); // 소수점 1자리, 음수 방지
  },

  /**
   * Generate mock report data for a user
   */
  generateReports(user) {
    const reports = [];
    const portfolios = user.selected_portfolios || ['Growth'];
    const signupDate = user.signup_date || new Date().toISOString();
    const daysSince  = this.daysSince(signupDate);

    // Onboarding report
    reports.push({
      id: 'r-onboard-' + user.id,
      user_id: user.id,
      report_type: 'onboarding',
      portfolio_tier: portfolios[0],
      cumulative_return_rate: 0,
      cumulative_profit: 0,
      algorithm_status: 'Active',
      message_body: `가입이 완료되었습니다. ${portfolios[0]} 포트폴리오가 성공적으로 활성화되었습니다.`,
      email_sent: true,
      kakao_sent: user.kakao_notify || false,
      is_read: true,
      sent_at: signupDate
    });

    // 3-day performance reports
    const numReports = Math.floor(daysSince / 3);
    for (let i = 1; i <= Math.min(numReports, 10); i++) {
      const reportDays = i * 3;
      const pf = VIE_CONFIG.PORTFOLIOS[portfolios[0]];
      if (!pf) continue;
      const rate   = this.returnRate(pf.principal, pf.rate, reportDays);
      const profit = this.profitAfterDays(pf.principal, pf.rate, reportDays);
      const d = new Date(signupDate);
      d.setDate(d.getDate() + reportDays);
      reports.push({
        id:   `r-perf-${user.id}-${i}`,
        user_id: user.id,
        report_type: 'performance_3d',
        portfolio_tier: portfolios[0],
        cumulative_return_rate: rate,
        cumulative_profit: profit,
        algorithm_status: 'Active',
        message_body: `지난 3일간 D.Quant 엔진이 포착한 변동성 수익 현황입니다. 누적 수익률 +${rate}%`,
        email_sent: true,
        kakao_sent: user.kakao_notify || false,
        is_read: i < numReports,
        sent_at: d.toISOString()
      });
    }

    return reports.reverse();
  }
};

/* ================================================================
   REALTIME COUNTER
   ================================================================ */
class VieCounter {
  constructor(el, portfolios) {
    this.el         = el;
    this.portfolios = portfolios || ['Growth'];
    this.interval   = null;
    this.baseValue  = this._calcBaseValue();
  }

  _calcBaseValue() {
    const elapsed = (Date.now() - VIE_CONFIG.COUNTER.STARTUP_DATE.getTime()) / 1000;
    let multiplier = 0;
    this.portfolios.forEach(tier => {
      const pf = VIE_CONFIG.PORTFOLIOS[tier];
      if (pf) multiplier += pf.principal * pf.rate / (30 * 24 * 3600);
    });
    return Math.floor(elapsed * multiplier * 10000);
  }

  _format(value) {
    if (value >= 100_000_000) {
      return (value / 100_000_000).toFixed(4) + '억원';
    }
    if (value >= 10_000) {
      return Math.floor(value / 10_000).toLocaleString('ko-KR') + '만 '
           + (value % 10_000).toString().padStart(4, '0') + '원';
    }
    return value.toLocaleString('ko-KR') + '원';
  }

  start() {
    if (!this.el) return;
    this.el.textContent = this._format(this.baseValue);
    this.interval = setInterval(() => {
      let multiplier = 0;
      this.portfolios.forEach(tier => {
        const pf = VIE_CONFIG.PORTFOLIOS[tier];
        if (pf) multiplier += pf.principal * pf.rate / (30 * 24 * 3600);
      });
      const increment = Math.floor(multiplier * 10000 * (VIE_CONFIG.COUNTER.UPDATE_INTERVAL / 1000));
      this.baseValue += increment;
      this.el.textContent = this._format(this.baseValue);
    }, VIE_CONFIG.COUNTER.UPDATE_INTERVAL);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

/* ================================================================
   TOAST NOTIFICATION
   ================================================================ */
const VieToast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.querySelector('.toast-container');
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.className = 'toast-container';
        document.body.appendChild(this._container);
      }
    }
    return this._container;
  },

  show(message, type = 'info', duration = 4000) {
    const c = this._getContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
    const colors = { success: '#00e5a0', error: '#f43f5e', info: '#00d4ff' };
    toast.innerHTML = `
      <i class="fa-solid ${icons[type] || icons.info}" style="color:${colors[type]||colors.info};font-size:1.1rem;flex-shrink:0;margin-top:2px"></i>
      <span style="font-size:0.88rem;color:var(--text-primary);flex:1">${message}</span>
      <button onclick="this.closest('.toast').remove()" style="color:var(--text-muted);font-size:0.9rem;cursor:pointer;padding:2px">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    c.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'none';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg)  { this.show(msg, 'success'); },
  error(msg)    { this.show(msg, 'error'); },
  info(msg)     { this.show(msg, 'info'); }
};

/* ================================================================
   NAVIGATION ACTIVE STATE
   ================================================================ */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(el => {
    const target = el.getAttribute('data-nav');
    el.classList.toggle('active', path.includes(target));
  });
}

/* ================================================================
   CHART HELPERS
   ================================================================ */
const VieChart = {
  /**
   * Create a daily profit line chart
   */
  createLineChart(canvasId, labels, datasets, options = {}) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;
    if (ctx._chartInstance) ctx._chartInstance.destroy();

    const chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: datasets.length > 1,
            labels: { color: '#8a9cc4', font: { size: 11 }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: 'rgba(13, 19, 41, 0.95)',
            borderColor: 'rgba(0,212,255,0.2)',
            borderWidth: 1,
            titleColor: '#f0f4ff',
            bodyColor: '#8a9cc4',
            padding: 12,
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('ko-KR')}만원`
            }
          }
        },
        scales: {
          x: {
            grid:  { color: 'rgba(255,255,255,0.04)', drawBorder: false },
            ticks: { color: '#4a5578', font: { size: 10 } }
          },
          y: {
            grid:  { color: 'rgba(255,255,255,0.04)', drawBorder: false },
            ticks: {
              color: '#4a5578',
              font: { size: 10 },
              callback: v => v.toLocaleString('ko-KR') + '만'
            }
          }
        },
        ...options
      }
    });
    ctx._chartInstance = chart;
    return chart;
  },

  /**
   * Default dataset style for VIE
   */
  datasetStyle(label, data, color) {
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: color + '18',
      fill: true,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      pointBackgroundColor: color,
      pointBorderColor: '#0a0e1a',
      pointBorderWidth: 2
    };
  }
};

/* ================================================================
   FORMAT HELPERS
   ================================================================ */
const VieFmt = {
  /**
   * Format 만원 unit values into Korean currency notation.
   * Input v is in 만원 (e.g. 1000 = 1,000만원, 10000 = 1억원)
   *
   * Rules:
   *   v < 1       → round to nearest 만원: "0만원" (혹은 소수점 없이 표시)
   *   1 ≤ v < 10000  → 만원 단위: "1,000만원"
   *   v ≥ 10000   → 억원 단위 (소수점 1자리): "1.0억원"
   *                 억+만 복합: "1억 500만원"
   */
  manwon(v) {
    if (typeof v !== 'number' || isNaN(v)) return '—';
    const rounded = Math.round(v); // 만원 단위로 반올림
    if (rounded === 0) return '0만원';
    if (rounded < 0) return '-' + VieFmt.manwon(-rounded);
    if (rounded < 10000) {
      // 만원 단위: 1,000만원
      return rounded.toLocaleString('ko-KR') + '만원';
    }
    // 억원 이상
    const eok = Math.floor(rounded / 10000);
    const man = rounded % 10000;
    if (man === 0) return eok.toLocaleString('ko-KR') + '억원';
    return eok.toLocaleString('ko-KR') + '억 ' + man.toLocaleString('ko-KR') + '만원';
  },

  /**
   * 만원 단위 값을 원화 최소 단위(원)로 입력받아 만원 표기로 변환
   * (breakdownEl에서 pf.principal이 만원 단위이므로 manwon()을 직접 사용)
   */
  won(v) {
    if (typeof v !== 'number' || isNaN(v)) return '—';
    // v는 원 단위 → 만원 변환
    return VieFmt.manwon(Math.round(v / 10000));
  },
  /** Format percentage */
  pct(v, digits = 2) {
    if (typeof v !== 'number') return '—';
    return (v >= 0 ? '+' : '') + v.toFixed(digits) + '%';
  },
  /** Format date */
  date(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  },
  /** Format date-time */
  datetime(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  /** Relative time */
  reltime(d) {
    if (!d) return '—';
    const dt   = new Date(d);
    const diff = Date.now() - dt.getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 60)    return '방금 전';
    if (secs < 3600)  return Math.floor(secs / 60) + '분 전';
    if (secs < 86400) return Math.floor(secs / 3600) + '시간 전';
    if (secs < 604800)return Math.floor(secs / 86400) + '일 전';
    return VieFmt.date(d);
  }
};

/* ================================================================
   BOTTOM NAV ACTIVE STATE (for mobile)
   ================================================================ */
function initBottomNav() {
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.bottom-nav-item').forEach(item => {
    const target = item.getAttribute('data-page');
    if (target && path.includes(target)) {
      item.classList.add('active');
    }
    item.addEventListener('click', () => {
      const href = item.getAttribute('data-href');
      if (href) window.location.href = href;
    });
  });
}

/* ================================================================
   PORTFOLIO HELPERS
   ================================================================ */
const ViePortfolioUI = {
  tierClass(tier) {
    return {
      'Core':       'core',
      'Growth':     'growth',
      'Premium':    'premium',
      'Strategy A': 'strategy-a',
      'Strategy B': 'strategy-b'
    }[tier] || 'core';
  },

  algoClass(algo) {
    return {
      'D-Grouping': 'grouping',
      'D-Grid':     'grid',
      'D-Hybrid':   'hybrid'
    }[algo] || 'grid';
  },

  buildAlgoBadge(algo) {
    const info = VIE_CONFIG.ALGORITHMS[algo];
    if (!info) return '';

    /* 알고리즘별 상세 설명 */
    const details = {
      'D-Grouping': {
        subtitle: '협소 타겟 보수 안정 운용',
        points: [
          '변동성이 낮은 구간에 집중 포지션 배치',
          '하락 방어를 최우선으로 설계된 보수적 엔진',
          '손실 폭 최소화 · 안정적 수익 누적',
          'Core · Growth 등급에 주로 적용'
        ],
        color: '#00d4ff'
      },
      'D-Grid': {
        subtitle: '반복 변동성 포착 격자 전략',
        points: [
          '일정 가격 구간을 격자(Grid)로 분할 설정',
          '반복 진입 · 청산으로 변동성 자체를 수익화',
          '상승 · 하락 양방향 모두에서 수익 가능',
          'Growth · Premium 등급에 주로 적용'
        ],
        color: '#00e5a0'
      },
      'D-Hybrid': {
        subtitle: 'D-Grouping + D-Grid 융합 전략',
        points: [
          '방어(D-Grouping)와 수익(D-Grid)을 동시 실행',
          '시장 국면 변화에 따라 자동 비중 전환',
          '1억원 이상 고액 자산가 전용 최적화 모델',
          'Strategy A · B 등급 전용 최상위 엔진'
        ],
        color: '#8b5cf6'
      }
    };
    const d = details[algo] || { subtitle: '', points: [], color: info.color };

    return `
      <div class="algo-badge-wrap" id="algo-wrap-${info.class}">
        <div class="algo-badge ${info.class}" style="cursor:pointer">
          <div class="algo-icon"><i class="fa-solid ${info.icon}"></i></div>
          <div class="algo-info">
            <div class="algo-name">${algo}</div>
            <div class="algo-desc">${info.desc}</div>
          </div>
          <div class="algo-status" style="font-size:0.72rem;display:inline-flex">ACTIVE</div>
        </div>
        <!-- 툴팁 -->
        <div class="algo-badge-tooltip">
          <div class="algo-tip-title">
            <i class="fa-solid ${info.icon}" style="color:${d.color}"></i>
            ${algo}
            <span style="font-size:0.68rem;padding:2px 7px;border-radius:10px;background:rgba(255,255,255,0.08);color:var(--text-muted);font-weight:500;margin-left:auto">● ACTIVE</span>
          </div>
          <div style="font-size:0.72rem;color:${d.color};font-weight:600;margin-bottom:6px">${d.subtitle}</div>
          <div class="algo-tip-rows">
            ${d.points.map(p => `
              <div class="algo-tip-row">
                <i class="fa-solid fa-check" style="color:${d.color}"></i>
                ${p}
              </div>`).join('')}
          </div>
        </div>
      </div>
    `;
  }
};

/* ================================================================
   DATA MIGRATION — partner_name 정규화
   저장된 사용자 데이터에 '김민준 파트너' 등 구 파트너명이
   남아 있을 경우 '밸류앤코어스'로 자동 교체합니다.
   ================================================================ */
(function migratePartnerName() {
  const OLD_NAMES = ['김민준 파트너', '김민준', '이서연 파트너', '박지훈 파트너', '담당 파트너'];
  const NEW_NAME  = '밸류앤코어스';

  // 1) vie_user (로그인 사용자)
  try {
    const userRaw = localStorage.getItem('vie_user');
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (user && OLD_NAMES.includes(user.partner_name)) {
        user.partner_name = NEW_NAME;
        localStorage.setItem('vie_user', JSON.stringify(user));
      }
    }
  } catch(e) {}

  // 2) vie_onboardingData (온보딩 진행 중 데이터)
  try {
    const obRaw = localStorage.getItem('vie_onboardingData');
    if (obRaw) {
      const ob = JSON.parse(obRaw);
      if (ob && OLD_NAMES.includes(ob.partner_name)) {
        ob.partner_name = NEW_NAME;
        localStorage.setItem('vie_onboardingData', JSON.stringify(ob));
      }
    }
  } catch(e) {}

  // 3) vie_ 접두사를 가진 모든 키 순회 (혹시 모를 다른 저장소)
  try {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('vie_')) return;
      try {
        const raw = localStorage.getItem(key);
        if (!raw || !raw.includes('partner_name')) return;
        const data = JSON.parse(raw);
        if (data && OLD_NAMES.includes(data.partner_name)) {
          data.partner_name = NEW_NAME;
          localStorage.setItem(key, JSON.stringify(data));
        }
      } catch(e) {}
    });
  } catch(e) {}
})();

/* ================================================================
   GLOBAL INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  initBottomNav();
  vieNavAuthUpdate();
});

/* ================================================================
   MOBILE NAV TOGGLE
   ================================================================ */
/**
 * vieNavToggle — 햄버거 버튼 클릭 시 모바일 드롭다운 메뉴 토글
 * @param {HTMLElement} btn - 클릭된 햄버거 버튼 요소
 */
function vieNavToggle(btn) {
  const mobileNav = document.getElementById('vie-nav-mobile');
  if (!mobileNav) return;
  const isOpen = mobileNav.classList.toggle('open');

  // 햄버거 → X 애니메이션
  const spans = btn.querySelectorAll('span');
  if (spans.length === 3) {
    if (isOpen) {
      spans[0].style.cssText = 'transform:translateY(7px) rotate(45deg)';
      spans[1].style.cssText = 'opacity:0;transform:scaleX(0)';
      spans[2].style.cssText = 'transform:translateY(-7px) rotate(-45deg)';
    } else {
      spans[0].style.cssText = '';
      spans[1].style.cssText = '';
      spans[2].style.cssText = '';
    }
  }

  // 메뉴 외부 클릭 시 닫기
  if (isOpen) {
    const handler = (e) => {
      if (!mobileNav.contains(e.target) && !btn.contains(e.target)) {
        mobileNav.classList.remove('open');
        spans[0].style.cssText = '';
        spans[1].style.cssText = '';
        spans[2].style.cssText = '';
        document.removeEventListener('click', handler);
      }
    };
    setTimeout(() => document.addEventListener('click', handler), 0);
  }
}

/* ================================================================
   NAV AUTH UPDATE — 로그인 상태에 따라 네비게이션 로그인/로그아웃 전환
   ================================================================ */
/**
 * vieNavAuthUpdate()
 * - 로그인 상태: 로그인 링크 → 유저 아바타 드롭다운 (이름 + 로그아웃 버튼)
 * - 비로그인 상태: 로그인 링크 표시 유지
 * - 데스크탑(#nav-login-btn) + 모바일(#nav-login-btn-m) 모두 처리
 */
function vieNavAuthUpdate() {
  const user = VieAuth.getUser();

  // 데스크탑 / 모바일 두 슬롯 모두 처리
  ['nav-login-btn', 'nav-login-btn-m'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    const isMobile = id.endsWith('-m');

    if (user) {
      /* ── 로그인 상태: 유저 드롭다운으로 교체 ── */
      const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
      const displayName = user.name || user.email || '회원';

      el.outerHTML = `
        <div class="vie-nav-user ${isMobile ? 'vie-nav-user--mobile' : ''}" id="${id}">
          <button class="vie-nav-avatar-btn" onclick="vieNavUserToggle(this)" aria-label="유저 메뉴">
            <span class="vie-nav-avatar">${initial}</span>
            <span class="vie-nav-user-name">${displayName}</span>
            <i class="fa-solid fa-chevron-down vie-nav-chevron"></i>
          </button>
          <div class="vie-nav-user-drop">
            <div class="vie-nav-user-drop-header">
              <div class="vie-nav-user-drop-avatar">${initial}</div>
              <div>
                <div class="vie-nav-user-drop-name">${displayName}</div>
                <div class="vie-nav-user-drop-email">${user.email || ''}</div>
              </div>
            </div>
            <div class="vie-nav-user-drop-divider"></div>
            <a href="mypage.html" class="vie-nav-user-drop-item">
              <i class="fa-solid fa-user"></i> 마이페이지
            </a>
            <a href="dashboard.html" class="vie-nav-user-drop-item">
              <i class="fa-solid fa-chart-line"></i> 대시보드
            </a>
            <div class="vie-nav-user-drop-divider"></div>
            <button class="vie-nav-user-drop-item vie-nav-logout-btn" onclick="vieNavLogout()">
              <i class="fa-solid fa-right-from-bracket"></i> 로그아웃
            </button>
          </div>
        </div>`;
    } else {
      /* ── 비로그인: 로그인 링크 복원 ── */
      // 이미 링크이면 건드리지 않음
      if (el.tagName === 'A') return;
      el.outerHTML = `<a href="login.html" class="vie-nav-link" id="${id}">
        <i class="fa-solid fa-right-to-bracket"></i> 로그인</a>`;
    }
  });

  /* 드롭다운 외부 클릭 시 닫기 전역 이벤트 (한 번만 등록) */
  if (!window._vieNavDropHandler) {
    window._vieNavDropHandler = (e) => {
      if (!e.target.closest('.vie-nav-user')) {
        document.querySelectorAll('.vie-nav-user-drop.open')
          .forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.vie-nav-avatar-btn.open')
          .forEach(b => {
            b.classList.remove('open');
            const ch = b.querySelector('.vie-nav-chevron');
            if (ch) ch.style.transform = '';
          });
      }
    };
    document.addEventListener('click', window._vieNavDropHandler);
  }
}

/** 유저 아바타 드롭다운 열기/닫기 */
function vieNavUserToggle(btn) {
  const drop = btn.nextElementSibling;
  const isOpen = drop.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  const ch = btn.querySelector('.vie-nav-chevron');
  if (ch) ch.style.transform = isOpen ? 'rotate(180deg)' : '';
}

/** 로그아웃 실행 */
function vieNavLogout() {
  VieAuth.logout(); // → login.html 리다이렉트
}

/* Expose globals */
window.VIE_CONFIG    = VIE_CONFIG;
window.VieStorage    = VieStorage;
window.VieAPI        = VieAPI;
window.VieAuth       = VieAuth;
window.VieInvite     = VieInvite;
window.VieSimulator  = VieSimulator;
window.VieCounter    = VieCounter;
window.VieToast      = VieToast;
window.VieChart      = VieChart;
window.VieFmt        = VieFmt;
window.ViePortfolioUI = ViePortfolioUI;
window.vieNavToggle  = vieNavToggle;
window.vieNavAuthUpdate = vieNavAuthUpdate;
window.vieNavUserToggle = vieNavUserToggle;
window.vieNavLogout     = vieNavLogout;
