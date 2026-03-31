/**
 * D.Quant 9.0 V.I.E — Kakao Alimtalk + Make.com Notification Module
 * Version: 1.0.0
 *
 * 구조:
 *  1) VieNotify.config  — Make.com 웹훅 URL 및 설정값
 *  2) VieNotify.send()  — 단건 알림 발송 (Make.com Webhook → 카카오 알림톡)
 *  3) VieNotify.sendReport()  — 3일 성과 리포트 알림
 *  4) VieNotify.sendMonthly() — 월간 정산 안내 알림
 *  5) VieNotify.sendWelcome() — 가입 환영 알림
 *  6) VieNotify.log()   — 발송 기록을 vie_notifications 테이블에 저장
 *  7) VieNotifyAdmin    — 관리자 전체 발송 유틸
 */

'use strict';

/* ================================================================
   NOTIFY CONFIG (관리자가 Make.com 웹훅 URL만 교체하면 됨)
   ================================================================ */
const VieNotify = {

  /* ── 설정값 ─────────────────────────────────────────────────── */
  config: {
    // Make.com Webhook URL - 관리자가 설정 페이지에서 저장한 값 사용
    webhookUrl: localStorage.getItem('vie_make_webhook') || '',
    // 앱 이름 (알림톡 메시지에 포함)
    appName: 'D.Quant 9.0 V.I.E',
    // 발신 서비스명
    senderName: '디퀀트나인',
    // 테이블 이름
    table: 'vie_notifications',
    // 알림 유형
    types: {
      WELCOME:  'welcome',
      REPORT:   'report',
      MONTHLY:  'monthly',
      CONSULT:  'consult',
      CUSTOM:   'custom'
    }
  },

  /* ── 웹훅 URL 설정/저장 ──────────────────────────────────────── */
  setWebhookUrl(url) {
    this.config.webhookUrl = url;
    localStorage.setItem('vie_make_webhook', url);
  },

  getWebhookUrl() {
    return localStorage.getItem('vie_make_webhook') || this.config.webhookUrl || '';
  },

  /* ── 핵심 발송 함수 ──────────────────────────────────────────── */
  /**
   * Make.com 웹훅으로 알림 발송
   * @param {Object} payload - { to_name, to_phone, type, message, variables }
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  async send(payload) {
    const webhookUrl = this.getWebhookUrl();
    if (!webhookUrl) {
      console.warn('[VieNotify] Make.com 웹훅 URL이 설정되지 않았습니다.');
      return { ok: false, message: '웹훅 URL 미설정' };
    }
    if (!payload.to_phone) {
      return { ok: false, message: '수신 전화번호 없음' };
    }

    const body = {
      app_name:    this.config.appName,
      sender_name: this.config.senderName,
      to_name:     payload.to_name  || '회원',
      to_phone:    this._cleanPhone(payload.to_phone),
      type:        payload.type     || 'custom',
      message:     payload.message  || '',
      variables:   payload.variables || {},
      sent_at:     new Date().toISOString(),
      source:      'dquant9-vie-webapp'
    };

    try {
      const res = await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body)
      });
      const ok = res.ok || res.status === 200;
      await this.log({ ...payload, status: ok ? 'sent' : 'failed', webhook_response: res.status });
      return { ok, message: ok ? '발송 완료' : `오류: HTTP ${res.status}` };
    } catch (err) {
      console.error('[VieNotify] 발송 실패:', err);
      await this.log({ ...payload, status: 'error', error: err.message });
      return { ok: false, message: '네트워크 오류: ' + err.message };
    }
  },

  /* ── 템플릿별 발송 함수 ───────────────────────────────────────── */

  /**
   * 🎉 환영 알림 (온보딩 완료 시 자동 발송)
   */
  async sendWelcome(user) {
    const message = `[${this.config.appName}]\n안녕하세요, ${user.name}님! 🎉\n\n가상 투자 경험 플랫폼에 오신 것을 환영합니다.\n\n선택하신 포트폴리오:\n${(user.selected_portfolios || []).join(', ')}\n\n대시보드에서 실시간 성과를 확인하세요.\n👉 start.dquant9.com/dashboard.html`;
    return this.send({
      to_name:  user.name,
      to_phone: user.phone,
      type:     this.config.types.WELCOME,
      message,
      variables: { name: user.name, portfolios: (user.selected_portfolios || []).join(', ') }
    });
  },

  /**
   * 📊 3일 성과 리포트 알림
   */
  async sendReport(user, reportData) {
    const profitRate = (reportData.profit_rate || 0).toFixed(2);
    const profitWon  = (reportData.profit_won  || 0).toLocaleString();
    const profitUsdt = (reportData.profit_usdt || 0).toFixed(2);

    const message = `[${this.config.appName}] 3일 성과 리포트\n\n${user.name}님의 포트폴리오 현황\n\n수익률: +${profitRate}%\n누적 수익(KRW): +${profitWon}원\n누적 수익(USDT): +${profitUsdt} USDT\n\n📈 리포트 전체 보기\n👉 start.dquant9.com/reports.html`;
    return this.send({
      to_name:  user.name,
      to_phone: user.phone,
      type:     this.config.types.REPORT,
      message,
      variables: {
        name:        user.name,
        profit_rate: profitRate,
        profit_won:  profitWon,
        profit_usdt: profitUsdt
      }
    });
  },

  /**
   * 💰 월간 정산 안내 알림
   */
  async sendMonthly(user, settlementData) {
    const totalKrw  = (settlementData.total_krw  || 0).toLocaleString();
    const totalUsdt = (settlementData.total_usdt || 0).toFixed(2);
    const period    = settlementData.period || '이번 달';

    const message = `[${this.config.appName}] 월간 정산 안내\n\n${user.name}님, ${period} 정산 내역입니다.\n\n정산 금액(KRW): ${totalKrw}원\n정산 금액(USDT): ${totalUsdt} USDT\n\n상세 내역은 앱에서 확인하세요.\n👉 start.dquant9.com/reports.html`;
    return this.send({
      to_name:  user.name,
      to_phone: user.phone,
      type:     this.config.types.MONTHLY,
      message,
      variables: {
        name:       user.name,
        period,
        total_krw:  totalKrw,
        total_usdt: totalUsdt
      }
    });
  },

  /**
   * 🤝 상담 신청 확인 알림
   */
  async sendConsultConfirm(user, consultData) {
    const message = `[${this.config.appName}] 상담 신청 접수\n\n${user.name}님의 상담 신청이 접수되었습니다. ✅\n\n파트너: ${consultData.partner_name || '밸류앤코어스'}\n예상 연락일: 영업일 기준 1~2일 이내\n\n빠른 시간 내 연락드리겠습니다.`;
    return this.send({
      to_name:  user.name,
      to_phone: user.phone,
      type:     this.config.types.CONSULT,
      message,
      variables: { name: user.name, partner: consultData.partner_name || '' }
    });
  },

  /**
   * 📢 커스텀 메시지 (관리자 직접 발송)
   */
  async sendCustom(user, customMessage) {
    return this.send({
      to_name:  user.name,
      to_phone: user.phone,
      type:     this.config.types.CUSTOM,
      message:  `[${this.config.appName}]\n\n${customMessage}`,
      variables: { name: user.name, message: customMessage }
    });
  },

  /* ── 알림 로그 저장 ──────────────────────────────────────────── */
  async log(data) {
    try {
      await fetch(`tables/${this.config.table}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:   data.user_id   || 'unknown',
          type:      data.type      || 'custom',
          channel:   'kakao',
          recipient: data.to_phone  || '',
          message:   (data.message  || '').substring(0, 500),
          status:    data.status    || 'sent',
          error_msg: data.error     || '',
          sent_at:   new Date().toISOString(),
          is_read:   false
        })
      });
    } catch (e) {
      console.warn('[VieNotify] 로그 저장 실패:', e);
    }
  },

  /* ── 유틸 ───────────────────────────────────────────────────── */
  _cleanPhone(phone) {
    // 010-1234-5678 → 01012345678
    return (phone || '').replace(/[^0-9]/g, '');
  },

  /** 카카오 알림 동의 여부 확인 */
  isKakaoEnabled(user) {
    return !!(user?.kakao_notify && user?.phone);
  }
};

/* ================================================================
   ADMIN BATCH SENDER — 전체 / 선택 회원 일괄 발송
   ================================================================ */
const VieNotifyAdmin = {

  /**
   * 전체 회원 일괄 발송
   * @param {string} type - 'report' | 'monthly' | 'custom'
   * @param {Object} data - 추가 데이터 (reportData / settlementData / customMessage)
   * @param {Function} onProgress - 진행상황 콜백 (current, total, result)
   */
  async sendAll(type, data = {}, onProgress = null) {
    const results = { success: 0, failed: 0, skipped: 0, errors: [] };

    try {
      // vie_users 테이블에서 전체 사용자 로드
      const res   = await fetch('tables/vie_users?limit=100');
      const json  = await res.json();
      const users = (json.data || []).filter(u => u.phone && u.kakao_notify);

      const total = users.length;
      if (total === 0) return { ...results, message: '카카오 알림 동의 회원 없음' };

      for (let i = 0; i < total; i++) {
        const user = users[i];
        let result;

        // 300ms 간격 (API Rate limit 방지)
        if (i > 0) await this._delay(300);

        try {
          if (type === 'report')  result = await VieNotify.sendReport(user, data);
          else if (type === 'monthly') result = await VieNotify.sendMonthly(user, data);
          else result = await VieNotify.sendCustom(user, data.message || '');

          if (result.ok) results.success++;
          else { results.failed++; results.errors.push({ user: user.name, error: result.message }); }
        } catch (e) {
          results.failed++;
          results.errors.push({ user: user.name, error: e.message });
        }

        if (onProgress) onProgress(i + 1, total, result);
      }
    } catch (e) {
      results.errors.push({ user: 'system', error: e.message });
    }

    return results;
  },

  /**
   * 선택 회원 발송
   * @param {Array} userIds - 발송할 user ID 배열
   * @param {string} type
   * @param {Object} data
   */
  async sendSelected(userIds, type, data = {}, onProgress = null) {
    const results = { success: 0, failed: 0, skipped: 0, errors: [] };
    const total   = userIds.length;

    for (let i = 0; i < total; i++) {
      if (i > 0) await this._delay(300);
      try {
        const res  = await fetch(`tables/vie_users/${userIds[i]}`);
        const user = await res.json();

        if (!VieNotify.isKakaoEnabled(user)) {
          results.skipped++;
          if (onProgress) onProgress(i + 1, total, { ok: false, message: '알림 비동의' });
          continue;
        }

        let result;
        if (type === 'report')       result = await VieNotify.sendReport(user, data);
        else if (type === 'monthly') result = await VieNotify.sendMonthly(user, data);
        else                         result = await VieNotify.sendCustom(user, data.message || '');

        if (result.ok) results.success++;
        else { results.failed++; results.errors.push({ user: user.name, error: result.message }); }

        if (onProgress) onProgress(i + 1, total, result);
      } catch (e) {
        results.failed++;
        results.errors.push({ user: userIds[i], error: e.message });
      }
    }
    return results;
  },

  _delay: ms => new Promise(r => setTimeout(r, ms)),

  /** 알림 발송 이력 조회 */
  async getLogs(limit = 50) {
    try {
      const res  = await fetch(`tables/vie_notifications?limit=${limit}&sort=created_at`);
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      return [];
    }
  },

  /** 현재 등록된 Make.com 웹훅 URL 반환 */
  getWebhookStatus() {
    const url = VieNotify.getWebhookUrl();
    return {
      configured: !!url,
      url:        url ? url.substring(0, 50) + '...' : '미설정',
      full:       url
    };
  }
};

/* ================================================================
   AUTO TRIGGER — 특정 이벤트 발생 시 자동 발송
   ================================================================ */
const VieNotifyTrigger = {

  /** 온보딩 완료 → 환영 알림 */
  async onOnboardingComplete(user) {
    if (!VieNotify.isKakaoEnabled(user)) return;
    setTimeout(() => VieNotify.sendWelcome(user), 2000); // 2초 후 발송
  },

  /** 상담 신청 → 접수 확인 알림 */
  async onConsultSubmit(user, consultData) {
    if (!VieNotify.isKakaoEnabled(user)) return;
    await VieNotify.sendConsultConfirm(user, consultData);
  },

  /** 3일 주기 체크 (대시보드 로드 시 호출) */
  async checkReportTrigger(user) {
    if (!VieNotify.isKakaoEnabled(user)) return;
    const lastNotified = localStorage.getItem('vie_last_report_notify');
    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    if (!lastNotified || (now - parseInt(lastNotified)) >= THREE_DAYS) {
      // 실제 수익 데이터 계산
      const daysSince = Math.floor((now - new Date('2025-11-01').getTime()) / 86400000);
      const portfolios = user.selected_portfolios || ['Growth'];
      let totalKrw = 0, totalPrincipal = 0;
      const pfConfig = {
        'Core': { rate: 0.025, principal: 1000 },
        'Growth': { rate: 0.030, principal: 3000 },
        'Premium': { rate: 0.040, principal: 5000 },
        'Strategy A': { rate: 0.040, principal: 10000 },
        'Strategy B': { rate: 0.040, principal: 20000 }
      };
      portfolios.forEach(t => {
        const pf = pfConfig[t];
        if (pf) {
          const profit = pf.principal * pf.rate * (daysSince / 30);
          totalKrw += profit * 10000;
          totalPrincipal += pf.principal * 10000;
        }
      });
      const profitRate = totalPrincipal > 0 ? (totalKrw / totalPrincipal) * 100 : 0;
      // USDT 환산 (실시간은 대시보드 fetch 결과 사용, 여기선 고정값 fallback)
      const usdtRate = parseFloat(localStorage.getItem('vie_usdt_rate') || '1350');
      const profitUsdt = totalKrw / usdtRate;

      await VieNotify.sendReport(user, {
        profit_rate: profitRate,
        profit_won:  Math.round(totalKrw),
        profit_usdt: profitUsdt
      });
      localStorage.setItem('vie_last_report_notify', now.toString());
    }
  }
};
