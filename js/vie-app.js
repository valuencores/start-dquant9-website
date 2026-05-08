     1	/**
     2	 * D.Quant 9.0 V.I.E — Core Application Logic
     3	 * Version: 1.0.0
     4	 */
     5	
     6	'use strict';
     7	
     8	/* ================================================================
     9	   CONSTANTS & CONFIG
    10	   ================================================================ */
    11	const VIE_CONFIG = {
    12	  APP_NAME: 'D.Quant 9.0 V.I.E',
    13	  VERSION:  '1.0.0',
    14	  STORAGE_PREFIX: 'vie_',
    15	  API_BASE: 'tables',
    16	  TABLES: {
    17	    USERS:        'vie_users',
    18	    PORTFOLIOS:   'vie_portfolios',
    19	    REPORTS:      'vie_reports',
    20	    NOTIFICATIONS:'vie_notifications',
    21	    CONSULTATIONS:'vie_consultations',
    22	    INVITE_CODES: 'vie_invite_codes'
    23	  },
    24	  PORTFOLIOS: {
    25	    'Core':       { rate: 0.025, color: '#4a90e2', algo: 'D-Grouping', principal: 1000 },
    26	    'Growth':     { rate: 0.030, color: '#36b37e', algo: 'D-Grid',     principal: 3000 },
    27	    'Premium':    { rate: 0.040, color: '#7c6fa6', algo: 'D-Grid',     principal: 5000 },
    28	    'Strategy A': { rate: 0.040, color: '#c99456', algo: 'D-Hybrid',   principal: 10000 },
    29	    'Strategy B': { rate: 0.040, color: '#e05c5c', algo: 'D-Hybrid',   principal: 20000 },
    30	    'Mixed4000':   { rate: 0.050, color: '#4a90e2', algo: 'D-Grouping', principal: 4000,
    31	                     algos: ['D-Grouping', 'D-Grid'],
    32	                     label: 'MIXED 4000 (Core + Growth 혼합)' }
    33	  },
    34	  ALGORITHMS: {
    35	    'D-Grouping': {
    36	      icon: 'fa-shield-halved',
    37	      desc: '리스크를 먼저 방어하는 안정 중심 엔진',
    38	      class: 'grouping',
    39	      color: '#00d4ff'
    40	    },
    41	    'D-Grid': {
    42	      icon: 'fa-table-cells',
    43	      desc: '반복 변동성을 수익 기회로 전환하는 포착 엔진',
    44	      class: 'grid',
    45	      color: '#00e5a0'
    46	    },
    47	    'D-Hybrid': {
    48	      icon: 'fa-circle-nodes',
    49	      desc: '방어와 확장을 동시에 수행하는 상위 전략 엔진',
    50	      class: 'hybrid',
