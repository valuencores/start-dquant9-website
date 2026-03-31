/**
 * D.Quant 9.0 V.I.E — Crypto Market Module
 * 실시간 코인 가격 + 변동성 지표
 * Source: CoinGecko Public API (no key, CORS OK)
 */
'use strict';

/* ── 코인 메타 정보 (로고 포함) ──────────────── */
const MARKET_META = {
  bitcoin:             { symbol:'BTC',  name:'비트코인',     logo:'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png' },
  'staked-ether':      { symbol:'STETH', name:'스테이크이더', logo:'https://assets.coingecko.com/coins/images/13442/thumb/steth_logo.png' },
  'wrapped-bitcoin':   { symbol:'WBTC',  name:'래핑비트코인', logo:'https://assets.coingecko.com/coins/images/7598/thumb/wrapped_bitcoin_wbtc.png' },
  'sei-network':       { symbol:'SEI',   name:'세이',         logo:'https://assets.coingecko.com/coins/images/28205/thumb/Sei_Logo_-_Transparent.png' },
  'worldcoin-wld':     { symbol:'WLD',   name:'월드코인',     logo:'https://assets.coingecko.com/coins/images/31069/thumb/worldcoin.jpeg' },
  'fetch-ai':          { symbol:'FET',   name:'페치AI',       logo:'https://assets.coingecko.com/coins/images/5681/thumb/Fetch.jpg' },
  'render-token':      { symbol:'RNDR',  name:'렌더',         logo:'https://assets.coingecko.com/coins/images/11636/thumb/rndr.png' },
  ethereum:         { symbol:'ETH',  name:'이더리움',    logo:'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png' },
  tether:           { symbol:'USDT', name:'테더',        logo:'https://assets.coingecko.com/coins/images/325/thumb/Tether.png' },
  binancecoin:      { symbol:'BNB',  name:'바이낸스',    logo:'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png' },
  solana:           { symbol:'SOL',  name:'솔라나',      logo:'https://assets.coingecko.com/coins/images/4128/thumb/solana.png' },
  'usd-coin':       { symbol:'USDC', name:'USD코인',     logo:'https://assets.coingecko.com/coins/images/6319/thumb/usdc.png' },
  'ripple':         { symbol:'XRP',  name:'리플',        logo:'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png' },
  dogecoin:         { symbol:'DOGE', name:'도지코인',    logo:'https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png' },
  cardano:          { symbol:'ADA',  name:'카르다노',    logo:'https://assets.coingecko.com/coins/images/975/thumb/cardano.png' },
  'shiba-inu':      { symbol:'SHIB', name:'시바이누',    logo:'https://assets.coingecko.com/coins/images/11939/thumb/shiba.png' },
  avalanche:        { symbol:'AVAX', name:'아발란체',    logo:'https://assets.coingecko.com/coins/images/12559/thumb/Avalanche_Circle_RedWhite_Trans.png' },
  polkadot:         { symbol:'DOT',  name:'폴카닷',      logo:'https://assets.coingecko.com/coins/images/12171/thumb/polkadot.png' },
  chainlink:        { symbol:'LINK', name:'체인링크',    logo:'https://assets.coingecko.com/coins/images/877/thumb/chainlink-new-logo.png' },
  'the-open-network':{ symbol:'TON', name:'톤코인',      logo:'https://assets.coingecko.com/coins/images/17980/thumb/ton_symbol.png' },
  sui:              { symbol:'SUI',  name:'수이',        logo:'https://assets.coingecko.com/coins/images/26375/thumb/sui_asset.jpeg' },
  pepe:             { symbol:'PEPE', name:'페페',        logo:'https://assets.coingecko.com/coins/images/29850/thumb/pepe-token.jpeg' },
  'injective-protocol':{ symbol:'INJ', name:'인젝티브',  logo:'https://assets.coingecko.com/coins/images/12882/thumb/Secondary_Symbol.png' },
  'near':           { symbol:'NEAR', name:'니어',        logo:'https://assets.coingecko.com/coins/images/10365/thumb/near.jpg' },
  aptos:            { symbol:'APT',  name:'압토스',      logo:'https://assets.coingecko.com/coins/images/26455/thumb/aptos_round.png' },
  arbitrum:         { symbol:'ARB',  name:'아비트럼',    logo:'https://assets.coingecko.com/coins/images/16547/thumb/photo_2023-03-29_21.47.00.jpeg' },
};

/* ── 거래량 상위 12개 코인 ID ─────────────────── */
const TOP_VOLUME_IDS = [
  'bitcoin','ethereum','tether','binancecoin','solana',
  'usd-coin','ripple','dogecoin','cardano','shiba-inu',
  'staked-ether','wrapped-bitcoin'
];

/* ── 변동성 모니터링 코인 ID (확장 목록, 12개 확보용 풀) ─────── */
const VOLATILITY_IDS = [
  'bitcoin','ethereum','solana','avalanche','polkadot',
  'chainlink','the-open-network','sui','pepe','injective-protocol',
  'near','aptos','arbitrum','dogecoin','shiba-inu',
  'ripple','cardano','binancecoin',
  'sei-network','worldcoin-wld','fetch-ai','render-token'
];

/* ── CoinGecko API ─────────────────────────── */
const VieMarket = {
  _cache: {},
  _lastFetch: 0,
  CACHE_TTL: 60000, // 1분 캐시

  /* 시장 데이터 fetch (단일 호출로 전체) */
  async fetchMarkets(ids) {
    const key = ids.join(',');
    const now = Date.now();
    if (this._cache[key] && now - this._lastFetch < this.CACHE_TTL) {
      return this._cache[key];
    }
    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets`
        + `?vs_currency=krw&ids=${ids.join(',')}`
        + `&order=market_cap_desc&per_page=50&page=1`
        + `&price_change_percentage=24h,7d,30d,1y`;
      const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      this._cache[key] = data;
      this._lastFetch  = now;
      return data;
    } catch(e) {
      console.warn('[VieMarket] fetch failed:', e.message);
      return this._cache[key] || [];
    }
  },

  /* 전체 코인 한번에 fetch */
  async fetchAll() {
    const allIds = [...new Set([...TOP_VOLUME_IDS, ...VOLATILITY_IDS])];
    return this.fetchMarkets(allIds);
  },

  /* 변동성 점수 계산 (절댓값 평균) */
  volatilityScore(coin, period) {
    const map = {
      '1y':  coin.price_change_percentage_1y_in_currency,
      '3m':  coin.price_change_percentage_30d_in_currency * 3, // 3개월 근사
      '1m':  coin.price_change_percentage_30d_in_currency,
      '1w':  coin.price_change_percentage_7d_in_currency,
    };
    return Math.abs(map[period] || 0);
  },

  /* 가격 포맷 */
  fmtPrice(p) {
    if (!p && p !== 0) return '—';
    if (p >= 1000000)  return (p/1000000).toFixed(2) + 'M원';
    if (p >= 10000)    return Math.round(p).toLocaleString('ko-KR') + '원';
    if (p >= 1)        return p.toFixed(2) + '원';
    if (p >= 0.01)     return p.toFixed(4) + '원';
    return p.toFixed(8) + '원';
  },

  fmtChange(v) {
    if (v == null) return '—';
    const sign = v >= 0 ? '+' : '';
    return sign + v.toFixed(2) + '%';
  },

  fmtVolume(v) {
    if (!v) return '—';
    if (v >= 1e12) return (v/1e12).toFixed(2) + 'T';
    if (v >= 1e8)  return (v/1e8).toFixed(1) + '억';
    return Math.round(v/1e6) + 'M';
  }
};
