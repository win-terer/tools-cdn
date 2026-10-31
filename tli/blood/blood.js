// 생성물 — 고칠 땐 update/src/js/00_gear.js · update/src/blood_page.js (build_html2.build_tool_pages)
// ── 장비 규칙 공용 조각 (2026-10-08) ──
// 빌더와 빌더 2(마법사)의 장비 단계가 함께 쓴다: 칸 목록·옵션 분류·등급 한도·무기 줄 배치·옵션 키.
// 기대하는 바깥 것: 없음 (PARTS 는 함수 인자로 받는다 — 빌더는 01_core 의 PARTS, 마법사는 gear_data.js)
// 영어판 검색 (2026-10-16) — 영어 화면(window.I18N, /tli/i18n/i18n.js)이면 조각마다 영어 번역에서도 찾는다. q 는 소문자
function qHit(q, ...parts) {
  if (!q) return true;
  if (parts.map(p => p == null ? '' : String(p)).join(' ').toLowerCase().includes(q)) return true;
  const T = typeof window !== 'undefined' && window.I18N;
  return !!T && parts.some(p => { const e = p && T.tr(String(p)); return !!e && e.toLowerCase().includes(q); });
}
const OPT_LIMITS = {basic: 2, main: 3, sub: 3};

const CAT_LABEL = {basic: '기본옵', main: '메인옵', sub: '서브옵'};

// 옵션 등급(기본/절대/진급/초급) — 절대·진급은 메인+서브 합산 각 최대 2개
const GRADE_LIMITS = {'절대': 2, '진급': 2};

const GRADE_CLASS = {'기본': 'g-basic', '절대': 'g-abs', '진급': 'g-adv', '초급': 'g-beg'};

function optGrade(t) {
  if (!t) return null;
  if (t.includes('절대자')) return '절대';
  if (t.includes('진급')) return '진급';
  if (t.includes('초급')) return '초급';
  if (t === '기본 옵션' || t === '기본 속성' || t === '침식 기본') return '기본';
  return null; // 시퀀스·고유·랜덤 옵션 등
}

function classifyOptType(t) {
  if (t === '기본 옵션' || t === '기본 속성' || t === '침식 기본') return 'basic';
  if (t.includes('메인 옵션')) return 'main';
  if (t.includes('서브 옵션')) return 'sub';
  return null; // 시퀀스·고유·랜덤 옵션 등 → 사용자가 칸을 선택
}

// 슬롯 교체 시 조향·시퀀스 유지 규칙: 조향(벨트)은 그대로, 시퀀스는 무기 부위가 같을 때만 (부위가 바뀌면 목록 자체가 달라짐)
function carryAddons(prev, nv) {
  if (!prev) return nv;
  if (prev.blend) nv.blend = prev.blend;
  if (prev.tower && prev.part === nv.part) nv.tower = prev.tower;
  if (prev.base && prev.part === nv.part) nv.base = prev.base; // 베이스는 옵션 편집으로 안 바뀐다
  return nv;
}

// ── 직접 제작 마법사: 부위 선택 → 기본(≤2) → 메인(≤3) → 서브(≤3) — 모달에서 단계 진행 ──
const CRAFT_STAGES = [
  {key: 'basic', label: '기본 옵션', max: 2},
  {key: 'main', label: '메인 옵션', max: 3},
  {key: 'sub', label: '서브 옵션', max: 3},
];

// 무기 부위 선택 줄 배치: 한손/양손 × 근거리/원거리 (데이터에 있는 부위만 표시, 미분류는 기타 줄)
// (방패 줄이 데이터의 PARTS 를 쓰므로 함수 — 빌더는 01_core 보다 먼저 이 조각을 읽는다)
const weaponRowsOf = P => [
  {label: '한손 · 근거리', parts: ['클로', '단검', '한손검', '한손 도끼', '한손 해머']},
  {label: '한손 · 원거리', parts: ['한손지팡이', '마법 지팡이', '마력 지팡이', '영혼 지팡이', '권총']},
  {label: '양손 · 근거리', parts: ['양손 검', '양손 도끼', '양손 해머', '주석 지팡이', '무사의 스틱']},
  {label: '양손 · 원거리', parts: ['활', '석궁', '머스킷', '화포']},
  {label: '방패', parts: P.SHIELDS},
];

// 옵션 목록 정렬 순서: 절대 > 진급 > 초급 > 기타(시퀀스·고유·랜덤 등)
function gradeOrder(type) {
  if ((type || '').includes('절대자')) return 0;
  if ((type || '').includes('진급')) return 1;
  if ((type || '').includes('초급')) return 2;
  return 3;
}

function rowKey(r) { return r.effect + '\u001f' + r.source + '\u001f' + r.type; }

// 장비 10칸 — 칸마다 들어갈 수 있는 부위 (P = 데이터의 PARTS)
const RING_PARTS = ['반지', '영혼 반지'];
const presetSlotsOf = P => [
  {id: 'helmet',  label: '투구',       parts: P.HELMETS},
  {id: 'chest',   label: '갑옷',       parts: P.CHESTS},
  {id: 'neck',    label: '목걸이',     parts: ['목걸이']},
  {id: 'glove',   label: '장갑',       parts: P.GLOVES},
  {id: 'belt',    label: '벨트',       parts: ['벨트']},
  {id: 'boots',   label: '신발',       parts: P.BOOTS},
  {id: 'ring1',   label: '반지 1',     parts: RING_PARTS},
  {id: 'ring2',   label: '반지 2',     parts: RING_PARTS},
  {id: 'weapon1', label: '무기',       parts: [...P.ONE_HAND, ...P.TWO_HAND]},
  {id: 'weapon2', label: '무기(방패)', parts: [...P.ONE_HAND, ...P.SHIELDS]},
];

const BASIC_KEYWORDS = ['기본', '진품', '절대자', '진급', '초급', '시퀀스', '랜덤', '고유'];

function isBasicType(type) { return BASIC_KEYWORDS.some(kw => type.includes(kw)); }

// ── 블러드 장비: 세트 부위 레전드의 옵션을 추출해 제작 (빌드당 하나, 무기 없음) ──
// 세트: 투구·목걸이 / 갑옷·장갑 / 신발·반지·벨트 — 칸마다 추출할 수 있는 레전드 부위 (P = PARTS)
const bloodSetPartsOf = P => {
  const helmNeck = [...P.HELMETS, '목걸이'];
  const chestGlove = [...P.CHESTS, ...P.GLOVES];
  const bootsRingBelt = [...P.BOOTS, ...RING_PARTS, '벨트'];
  return {helmet: helmNeck, neck: helmNeck, chest: chestGlove, glove: chestGlove,
          boots: bootsRingBelt, ring1: bootsRingBelt, ring2: bootsRingBelt, belt: bootsRingBelt};
};
const BLOOD_SET_NAME = {helmet: '투구·목걸이', neck: '투구·목걸이', chest: '갑옷·장갑', glove: '갑옷·장갑',
                        boots: '신발·반지·벨트', ring1: '신발·반지·벨트', ring2: '신발·반지·벨트', belt: '신발·반지·벨트'};
// 블러드 부위명 = 칸 이름에서 번호를 뗀 것 ('반지 1' → '반지')
const bloodPartOfLabel = label => label.replace(/ \d$/, '');
// 블러드 제작 마법사: 기본옵 → 레전드 추출 → 추가 옵션 (모달 안에서 단계 진행)
const BLOOD_STAGES = [
  {key: 'bases', label: '기본 옵션', max: 2},
  {key: 'picks', label: '레전드 추출', max: 2},
  {key: 'extras', label: '추가 옵션', max: 4}, // 레전드 1개면 5 — bloodExtraCap으로 계산
];
// 레전드 추출을 1개만 담으면 추가 옵션 5개까지 (2개면 4개 — 합계 6 고정)
function bloodExtraCap(nBlood) { return nBlood <= 1 ? 5 : 4; }

// ── 제작 옵션 티어(T0/T1/T2) 표기 · 침식 — 티어 표(TIERS)는 빌더 01_core·빌더 2 gear_data.js 가 싣는다
let TIER_MAP_ = null;
function tierMapGet() { return TIER_MAP_ || (TIER_MAP_ = new Map(TIERS.map(e => [e.source + '\u001f' + e.type + '\u001f' + e.effect, e]))); }
// 현재 빌드의 티어 설정(0/1/2)에 맞는 효과 텍스트 반환 — 변형 없으면 T1 그대로
function tierEffectAt(o, tr) { // tr: '0' | '0p' | '1' | '2' — 침식 강화된 제작 옵션은 티어가 T0+('0p')로 오름
  if (o.rolled && o.effect) return o.effect; // 로그가 준 실제 굴림값 — 티어 표(범위)로 덮지 않는다
  const eff = (KEY_MAP.get(o.k) || o).effect;
  if (tr === '1') return eff; // t1 = 기본 표기
  if (o.tiers) return o.tiers['t' + tr] || eff; // 블러드 풀 옵션은 자체 티어 보유
  const e = tierMapGet().get((o.source || '') + '\u001f' + (o.type || '') + '\u001f' + eff);
  return e ? (e['t' + tr] || eff) : eff;
}
function tierEffect(o) { return tierEffectAt(o, preset && preset.tier || '1'); }
// 침식 = 보고 있는 티어의 한 단계 위 (T2 보기→T1, T1 보기→T0, T0 보기→T0+)
const TIER_UP = {'2': '1', '1': '0', '0': '0p'};
function eroEffect(o) {
  if (o.rolled && o.effect) return o.effect; // 실제 굴림값이 있으면 그대로 (침식 여부는 이미 어픽스 ID에 반영돼 있다)
  const eff = (KEY_MAP.get(o.k) || o).effect;
  const want = TIER_UP[preset && preset.tier || '1'] || '0';
  const r = tierEffectAt(o, want);
  // 원하는 티어 수치가 없어 t1로 폴백되면(구버전 블러드 슬롯엔 t0p 미저장) 한 단계 아래 티어로 —
  // 침식 표기가 기본보다 낮은 수치로 보이는 것 방지
  if (want === '0p' && r === eff) return tierEffectAt(o, '0');
  return r;
}
// 블러드의 레전드 추출 옵션 침식 수치 — 출처 레전드(o.type=아이템명)의 corr에서 같은 옵션을 찾음
function bloodLegendCorr(o) {
  const it = ITEMS.find(x => x.name === o.type);
  if (!it || !it.corr) return null;
  const norm = s => stripHtml(s).replace(/\s+/g, ' ').trim(); // stripHtml: 빌더 05_ui · 단독 화면 page_common
  const eff = norm((KEY_MAP.get(o.k) || o).effect);
  const i = (it.opts || []).findIndex(op => norm(op) === eff);
  return i >= 0 && it.corr[i] ? it.corr[i][1] : null;
}
// 침식 강화 개수 — 레전드·제작 2개, 블러드 3개
function corrLimit(v) { return v.kind === 'blood' ? 3 : 2; }

// 로그에서 온 옵션의 티어 (어픽스 ID 끝자리) — 칩 표기 T0/T1/T2
function affixTier(o) {
  if (!o || !o.aid) return null;
  const id = String(o.aid);
  if (id.length < 9) return null; // 기본 옵션(7자리)은 티어 체계가 다르다 — 표기하지 않는다
  const d = id.slice(-1);
  return /[0-9]/.test(d) ? d : null;
}
function tierLabel(t) { return 'T' + t; }
// 효과 텍스트의 용어에 밑줄+호버 툴팁(tip2) 부여 — tips는 [[용어, 설명]] 자체 완결형
function tipWrapEffect(effect, tips) {
  let html = escapeHtml(effect);
  if (!tips || !tips.length) return html;
  // 용어를 먼저 자리표시자로 치환해 두 번째 용어가 첫 툴팁의 title 속성을 건드리는 것 방지
  tips.forEach((t, i) => { html = html.replace(escapeHtml(t[0]), `\u0001${i}\u0001`); });
  tips.forEach((t, i) => {
    html = html.replace(`\u0001${i}\u0001`,
      `<span class="tip2" title="${escapeHtml(t[1])}">${escapeHtml(t[0])}</span>`);
  });
  return html;
}
// 표시용: 태그 밖의 수치만 파란 굵은 글씨로 (tlidb 카드의 b.m 과 같은 모양) — 툴팁 title 속성은 태그 안이라 건드리지 않는다
function hlNums(html) {
  return String(html).split(/(<[^>]+>)/).map(p => p[0] === '<' ? p : p.replace(/[+-]?\(?[\d.]+(?:[–~-][\d.]+)?\)?%?/g, m => /\d/.test(m) ? '<b class="m">' + m + '</b>' : m)).join('');
}
// 지난 시즌 초반 시세 — 易火 ETor 시세 서버에서 시즌마다 한 번 받은 값 (update/etor_prices.py, 2026-10-14 사용자 요청)
// it.ep = [[시즌, {일차: [평균, 최저, 최고]}], …] · 단위 결정 · 거래소는 글로벌 통합이라 같은 시세 (사용자 확인 2026-10-14)
const ITEM_PRICE_DAYS = [[1, '1일'], [2, '2일'], [3, '3일'], [7, '1주'], [14, '2주']];
// 레전드 드롭처 — tlidb Drop_Source ('이계 구역 드롭' 제외, 사용자 요청 2026-10-20). 없으면 이계 어디서나 나오는 레전드
function itemDropHtml(it) {
  if (!it || !it.drop || !it.drop.length) return '';
  return '<div class="icard-drop"><div class="icard-drop-h">드롭처 <small>이계 구역 일반 드롭 외</small></div>' +
    it.drop.map(t => `<div class="icard-drop-r">${escapeHtml(t)}</div>`).join('') + '</div>';
}
function itemPriceHtml(it) {
  if (!it || !it.ep || !it.ep.length) return '';
  const f = v => v >= 100 ? Math.round(v) : v >= 10 ? (Math.round(v * 10) / 10) : (Math.round(v * 100) / 100);
  return '<div class="icard-price"><div class="icard-price-h">지난 시즌 초반 시세 <small>단위 결정 · ETor</small></div>' +
    '<table><thead><tr><th></th>' + ITEM_PRICE_DAYS.map(d => `<th>${d[1]}</th>`).join('') + '</tr></thead><tbody>' +
    it.ep.map(([lb, days]) => `<tr><th>${lb}</th>` + ITEM_PRICE_DAYS.map(([d]) => {
      const v = days && days[d];
      return v ? `<td title="${lb} ${d}일차 · 평균 ${v[0]} (최저 ${v[1]} ~ 최고 ${v[2]}) 결정">${f(v[0])}</td>` : '<td class="na">–</td>';
    }).join('') + '</tr>').join('') + '</tbody></table>' +
    // 출처·허가 안내 (사용자 요청 2026-10-14 — 문제가 되면 내린다)
    // 마우스를 올리면 툴팁, 누르면 펼침(터치 화면)
    `<details class="icard-price-i"><summary title="${ITEM_PRICE_NOTE}">ⓘ 시세 출처 안내</summary><div>${ITEM_PRICE_NOTE.replace(/&#10;/g, '<br>')}</div></details></div>`;
}
const ITEM_PRICE_NOTE = '이 시세는 중국 트래커 易火 ETor 의 시세 서버에서 수집했습니다.&#10;ETor 측의 허가를 받지 않고 가져온 자료라, 문제가 된다면 디스코드 win.terer 로 연락 주시면 바로 내리겠습니다.&#10;&#10;단위: 최초의 불꽃 결정.';
// 랜덤 옵션 후보 — "<랜덤 …>" 옵션이 있는 레전드(신들의 애도 등)의 나올 수 있는 후보·침식화 후보 (tlidb 상세 페이지, 2026-10-12)
// 접어 두고 눌러서 펼친다 (후보가 24개까지라 카드가 너무 길어짐)
function itemPoolsHtml(it) {
  if (!it || !it.pools || !it.pools.length) return '';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  return '<div class="icard-pools">' + it.pools.map(p =>
    `<details class="icard-pool${p.corr ? ' corr' : ''}"><summary>${esc(p.name)}${p.corr ? ' 침식화 시' : ' 후보'} <small>${p.rows.length}</small></summary>` +
    p.rows.map(r => `<div class="icard-opt">${r[1]}</div>`).join('') + '</details>').join('') + '</div>';
}

// ── /tli/blood 단독 화면 — 봉합(블러드 장비) 시뮬레이터 (2026-10-27, 사용자 요청) ──
// 규칙(사용자 설명): 메인 3 · 서브 3 · 기본 2(베이스에 붙어 있음, 고르기만).
//  · 일반 장기 — 초급용·진급용이 따로 있다(사용자 2026-10-27). 고른 쪽(메인/서브)의 그 등급 옵션 전체(티어 포함)에서 무작위 하나
//  · 특수 장기 — 고른 쪽의 절대자 옵션을 직접 고르고 티어만 무작위. 이미 붙은 옵션은 다시 못 고른다
//  · 자리: 빈자리 우선(위에서부터) → 없으면 그쪽 아무 자리나 덮어쓴다. 진급·절대자가 이미 2개면 그쪽의 같은 등급 자리만 교체
//  · 핵심 장기 — 6칸이 다 찼을 때, 고른 레전드의 옵션 중 무작위 2개(BL_CAND_N) 후보에서 하나 → 레전드가 아닌 무작위 자리를 대신한다.
//    레전드 옵션은 최대 2개·한 장비에서만 (옵션 2개짜리 레전드는 1개). 2개면 다른 장기로 덮어쓴 뒤에만 다시 넣을 수 있다
//  · 절단 도구 — 붙은 옵션의 수치만 다시 굴린다 (티어 그대로)
// 레전드 후보 풀은 빌더 블러드 제작(wgBLegendPool)과 같은 세트 부위 레전드 옵션. 저장은 없다 (사용자: 저장 기능 필요 없음)
const BL_PARTS = ['투구', '목걸이', '갑옷', '장갑', '신발', '반지', '벨트'];
const BL_SET = {'투구': 'hn', '목걸이': 'hn', '갑옷': 'cg', '장갑': 'cg', '신발': 'brb', '반지': 'brb', '벨트': 'brb'};
const BL_SET_NAME = {hn: '투구·목걸이', cg: '갑옷·장갑', brb: '신발·반지·벨트'};
const BL_GR_ROW = {'절대': 'gr-abs', '진급': 'gr-adv', '초급': 'gr-beg', '레전드': 'gr-leg'};
const BL_GR_CLASS = {'절대': 'g-abs', '진급': 'g-adv', '초급': 'g-beg', '레전드': 'g-leg'};
const BL_GR_NAME = {'절대': '절대자', '진급': '진급', '초급': '초급', '레전드': '레전드'};
const BL_CAND_N = 2; // 핵심 장기 후보 수 — 게임에서 2개를 준다 (2026-10-31 사용자 확인, 그 전엔 3개로 뒀었다)
const BL_RAND_N = 3; // 후보가 '<랜덤 …>' 줄이면 갈래를 몇 개까지 보여 줄지 — 후보 수와는 다른 이야기(보여 주기용)
const BL_SIDE = {main: '메인', sub: '서브'};

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
function escapeHtml(s) { return esc(s); } // 00_gear.js tipWrapEffect 가 부른다
const optHtml = (text, tips) => hlNums(tipWrapEffect(text, tips));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
function sample(a, n) { const c = a.slice(), r = []; while (c.length && r.length < n) r.push(c.splice(rnd(c.length), 1)[0]); return r; }
// "(a–b)" 범위를 하나씩 굴린다 — 소수 자리는 두 끝 중 긴 쪽에 맞춘다
function rollText(t) {
  return String(t).replace(/\((-?[\d.]+)–(-?[\d.]+)\)/g, (m, a, b) => {
    const dp = Math.max((a.split('.')[1] || '').length, (b.split('.')[1] || '').length), k = Math.pow(10, dp);
    const lo = Math.round(Math.min(+a, +b) * k), hi = Math.round(Math.max(+a, +b) * k);
    const v = (lo + rnd(hi - lo + 1)) / k;
    return dp ? v.toFixed(dp) : String(v);
  });
}

let S = null, undo = [], blMode = 'norm', blSide = 'main', blQ = '', blItem = '', blItemQ = '';
function blNew(part, ab) {
  return {part, ab: !!ab, base: ['', ''], main: [null, null, null], sub: [null, null, null], cand: null, lock: '', last: null,
          cnt: {beg: 0, adv: 0, spec: 0, core: 0, cut: 0}, log: []};
}
const blPool = () => BLOODP.find(b => b.part === S.part && !!b.aberrant === S.ab) || BLOODP.find(b => b.part === S.part);
const blHasAb = part => BLOODP.some(b => b.part === part && b.aberrant);
const blAll = () => [...S.main.map((e, i) => ({e, side: 'main', i})), ...S.sub.map((e, i) => ({e, side: 'sub', i}))];
const blCount = g => blAll().filter(x => x.e && x.e.g === g).length;
const blHas = txt => blAll().some(x => x.e && x.e.t === txt);
const blLegs = () => blAll().filter(x => x.e && x.e.g === '레전드');
const blItemOf = n => BLOOD_LEG.find(x => x.n === n);
// 레전드 한 장비에서 뽑을 수 있는 옵션 수 — 옵션 2개짜리 레전드는 1개 (랜덤 옵션 자리는 자리 수만큼 센다)
const blItemLines = it => it.o.length + (it.r ? it.rn || 1 : 0);
const blItemCap = it => (blItemLines(it) <= 2 ? 1 : 2);
function blSave() { undo.push(JSON.stringify(S)); if (undo.length > 50) undo.shift(); }
function blLog(html) { S.log.unshift(html); if (S.log.length > 40) S.log.pop(); }
function blTiers(o) { return [['0', o.t0], ['1', o.effect], ['2', o.t2]].filter(x => x[1]); }
function blEntry(o, tr) { const t = (blTiers(o).find(x => x[0] === tr) || [tr, o.effect])[1]; return {g: optGrade(o.type), t: o.effect, tpl: t, tr, v: rollText(t), tips: o.tips || null}; }

// 새 옵션이 들어갈 자리 — 진급·절대자가 2개 찼으면 그쪽의 같은 등급 자리, 아니면 빈자리 우선, 없으면 그쪽 아무 자리
function blTargets(side, g) {
  const list = S[side].map((e, i) => ({e, i}));
  if (GRADE_LIMITS[g] && blCount(g) >= GRADE_LIMITS[g]) return list.filter(x => x.e && x.e.g === g).map(x => x.i);
  const empty = list.filter(x => !x.e).map(x => x.i);
  return empty.length ? [empty[0]] : list.map(x => x.i); // 빈칸은 위에서부터 채운다 (2026-10-27 사용자)
}
function blPut(side, en, why) {
  const at = pick(blTargets(side, en.g)), old = S[side][at];
  S[side][at] = en; S.last = side + at;
  if (!blLegs().length) S.lock = ''; // 레전드가 다 덮이면 다른 장비에서 다시 뽑을 수 있다
  blLog(`${why} → <b>${BL_SIDE[side]} ${at + 1}</b> ${BL_GR_NAME[en.g]}${en.tr ? ' T' + en.tr : ''} ${optHtml(en.v)}` + (old ? ` <small>(덮어씀: ${esc(BL_GR_NAME[old.g])} ${optHtml(old.v)})</small>` : ''));
}

// 일반 장기 — 고른 쪽의 그 등급 (옵션 × 티어) 중 무작위. 진급이 2개 찼는데 그쪽에 진급이 없으면 진급 장기는 못 쓴다
function blNormWhy(side, g) {
  if (g === '진급' && blCount('진급') >= 2 && !S[side].some(e => e && e.g === '진급')) return '진급 옵션 2개가 모두 ' + BL_SIDE[side === 'main' ? 'sub' : 'main'] + '에 있어 그쪽에서만 교체됩니다';
  return '';
}
function blNormPool(side, g) {
  if (blNormWhy(side, g)) return [];
  return blPool().opts.filter(o => o.type.includes(BL_SIDE[side]) && optGrade(o.type) === g && !blHas(o.effect))
    .flatMap(o => blTiers(o).map(([tr]) => [o, tr]));
}
function blUseNorm(g) {
  const c = blNormPool(blSide, g);
  if (!c.length) return;
  blSave();
  const [o, tr] = pick(c);
  S.cnt[g === '진급' ? 'adv' : 'beg']++; S.cand = null;
  blPut(blSide, blEntry(o, tr), '일반 장기(' + g + ')');
  blRender();
}
// 특수 장기 — 고른 절대자 옵션, 티어 무작위
function blSpecWhy(side) {
  if (blCount('절대') >= 2 && !S[side].some(e => e && e.g === '절대')) return '절대자 옵션 2개가 모두 ' + BL_SIDE[side === 'main' ? 'sub' : 'main'] + '에 있어 그쪽에서만 교체됩니다';
  return '';
}
function blUseSpec(i) {
  const o = blPool().opts[i];
  if (!o || blHas(o.effect) || blSpecWhy(blSide)) return;
  blSave();
  S.cnt.spec++; S.cand = null;
  blPut(blSide, blEntry(o, pick(blTiers(o))[0]), '특수 장기');
  blRender();
}
// 핵심 장기 — 후보 3개 (랜덤 옵션 자리는 그 풀에서 여러 갈래를 함께 보여 준다)
function blCoreWhy() {
  if (blAll().some(x => !x.e)) return '메인 3칸 · 서브 3칸이 다 차야 레전드 옵션을 넣을 수 있습니다';
  const n = blLegs().length;
  if (n >= 2) return '레전드 옵션이 이미 2개입니다 — 다른 장기로 레전드 자리를 덮어쓴 뒤에 다시 넣을 수 있습니다';
  const it = blItemOf(S.lock || blItem);
  if (!it) return '레전드 장비를 먼저 고르세요';
  if (n && blItemCap(it) <= 1) return '옵션이 2개뿐인 레전드라 1개만 넣을 수 있습니다';
  if (!blCoreOpts(it).length) return '이 장비에서 더 넣을 옵션이 없습니다';
  return '';
}
function blCoreOpts(it) { // 아직 안 붙은 옵션 줄 (랜덤 자리는 'R0'·'R1'…)
  const got = new Set(blLegs().map(x => x.e.oi));
  return [...it.o.map((o, i) => i), ...(it.r ? Array.from({length: it.rn || 1}, (_, k) => 'R' + k) : [])].filter(i => !got.has(i));
}
function blUseCore() {
  if (blCoreWhy()) return;
  blSave();
  const it = blItemOf(S.lock || blItem);
  S.cnt.core++;
  S.cand = {n: it.n, c: sample(blCoreOpts(it), BL_CAND_N).map(i => typeof i === 'string'
    ? {oi: i, vs: sample(it.r.filter(t => !blHas(t)), BL_RAND_N).map(t => ({t, v: rollText(t)}))}
    : {oi: i, vs: [{t: it.o[i][0], v: rollText(it.o[i][0]), tips: it.o[i][1] || null}]}).filter(cd => cd.vs.length)};
  blLog(`핵심 장기 — <b>${esc(it.n)}</b> 후보 ${S.cand.c.length}개`);
  blRender();
}
function blPickCand(ci, vi) {
  const cd = S.cand && S.cand.c[ci], x = cd && cd.vs[vi];
  if (!x) return;
  blSave();
  const spots = blAll().filter(y => y.e && y.e.g !== '레전드'), at = pick(spots), old = at.e;
  S[at.side][at.i] = {g: '레전드', t: x.t, v: x.v, tips: x.tips || null, src: S.cand.n, oi: cd.oi};
  S.lock = S.cand.n; S.last = at.side + at.i;
  blLog(`레전드 옵션 → <b>${BL_SIDE[at.side]} ${at.i + 1}</b> ${optHtml(x.v)} <small>(덮어씀: ${esc(BL_GR_NAME[old.g])} ${optHtml(old.v)})</small>`);
  S.cand = null;
  blRender();
}
function blDropCand() { blSave(); S.cand = null; blLog('핵심 장기 후보를 고르지 않고 닫음'); blRender(); }
// 절단 도구 — 수치만 다시
function blUseCut() {
  if (!blAll().some(x => x.e)) return;
  blSave();
  blAll().forEach(x => { if (x.e) x.e.v = rollText(x.e.tpl || x.e.t); });
  S.cnt.cut++; S.last = 'all';
  blLog('절단 도구 — 모든 옵션 수치를 다시 굴림');
  blRender();
}
function blUndo() { if (!undo.length) return; S = JSON.parse(undo.pop()); S.last = null; blRender(); }
function blReset() { if (blAll().some(x => x.e) && !confirm('처음부터 다시 할까요? 지금 옵션과 기록이 지워집니다.')) return; undo = []; S = blNew(S.part, S.ab); blRender(); }
function blSetPart(p, ab) {
  if (p === S.part && !!ab === S.ab) return;
  if (blAll().some(x => x.e) && !confirm('부위를 바꾸면 지금 옵션이 지워집니다. 바꿀까요?')) return;
  undo = []; S = blNew(p, ab && blHasAb(p)); blItem = ''; blQ = ''; blRender();
}
function blSetBase(i, v) { S.base[i] = v; blRender(); }
function blSetMode(m) { blMode = m; blQ = ''; blRender(); }
function blSetSide(s) { blSide = s; blRender(); }
function blSearch(v, which) {
  if (which === 'item') blItemQ = v; else blQ = v;
  const box = document.getElementById('blList');
  if (box) box.innerHTML = which === 'item' ? blItemListHtml() : blSpecListHtml();
}
function blSetItem(n) { blItem = blItem === n ? '' : n; blRender(); } // 목록 스크롤은 blRender 가 그대로 둔다

// ── 그리기
// 구성 요약 — 사용자들이 꼽는 베스트: 초·진·절 / 초·진·절 을 만든 뒤 레전드 2개가 초급 자리에 들어간 레·진·절 / 레·진·절 (2026-10-27 사용자)
const BL_SHORT = {'초급': '초', '진급': '진', '절대': '절', '레전드': '레'};
function blShape(side) { return S[side].map(e => e ? BL_SHORT[e.g] : '·').sort((a, b) => '레초진절·'.indexOf(a) - '레초진절·'.indexOf(b)).join(''); }
const blBest = () => ['main', 'sub'].every(sd => blShape(sd) === '레진절');
function blShapeHtml() {
  const best = blBest();
  return `<div class="bl-shape${best ? ' best' : ''}">구성 <b>메인 ${blShape('main')}</b> / <b>서브 ${blShape('sub')}</b>` +
    (best ? ' <span>★ 베스트 (레·진·절 / 레·진·절)</span>' : ' <small>베스트: 레진절 / 레진절</small>') + '</div>';
}
function blSlotHtml(e, key, label) {
  const nw = S.last === key || (S.last === 'all' && e) ? ' new' : '';
  if (!e) return `<div class="bl-sl empty${nw}"><span>${label} — 빈 칸</span></div>`;
  return `<div class="bl-sl ${BL_GR_ROW[e.g] || ''}${nw}"><span>${optHtml(e.v, e.tips)}${e.src ? `<small class="src">${esc(e.src)}</small>` : ''}</span>` +
    (e.tr ? `<i>T${e.tr}</i>` : '') + `<em class="${BL_GR_CLASS[e.g] || ''}">${BL_GR_NAME[e.g]}</em></div>`;
}
// 메인·서브 묶음 — 눌러서 넣을 쪽을 고른다 (위 단추와 같음, 2026-10-27 사용자). 레전드·절단 도구는 쪽을 안 가리니 표시만 흐리게
function blGrpHtml(sd) {
  const on = blSide === sd, use = blMode === 'norm' || blMode === 'spec';
  return `<div class="bl-grp${on ? ' on' : ''}${use ? ' use' : ''}" onclick="blSetSide('${sd}')"${use ? ` title="눌러서 ${BL_SIDE[sd]}에 넣기로"` : ''}>` +
    `<div class="bl-sec">${BL_SIDE[sd]} 옵션${on && use ? ' <span>◀ 여기에 넣기</span>' : ''}</div>` +
    S[sd].map((e, i) => blSlotHtml(e, sd + i, BL_SIDE[sd] + ' ' + (i + 1))).join('') + '</div>';
}
function blGearHtml() {
  const pool = blPool();
  const sel = i => `<select onchange="blSetBase(${i},this.value)"><option value="">기본 옵션 ${i + 1} — 고르지 않음</option>` +
    pool.basic.map(b => `<option${S.base[i] === b ? ' selected' : ''}${S.base[1 - i] === b ? ' disabled' : ''}>${esc(b)}</option>`).join('') + '</select>';
  return `<div class="bl-box"><div class="bl-h"><b>블러드 러스트 ${esc(S.part)}${S.ab ? ' (이상 부위)' : ''}</b><small>${BL_SET_NAME[BL_SET[S.part]]} 세트</small>` +
    `<span class="bl-r"><span class="g-abs">절대자 ${blCount('절대')}/2</span> · <span class="g-adv">진급 ${blCount('진급')}/2</span> · <span class="g-leg">레전드 ${blLegs().length}/2</span></span></div>` +
    `<div class="bl-sec">기본 옵션 <small>— 베이스에 붙어 있음 (봉합으로 바뀌지 않음)</small></div><div class="bl-base">${sel(0)}${sel(1)}</div>` +
    blShapeHtml() + ['main', 'sub'].map(sd => blGrpHtml(sd)).join('') +
    `<div class="bl-stat"><span>일반 장기(초급) <b>${S.cnt.beg}</b></span><span>일반 장기(진급) <b>${S.cnt.adv}</b></span><span>특수 장기 <b>${S.cnt.spec}</b></span><span>핵심 장기 <b>${S.cnt.core}</b></span><span>절단 도구 <b>${S.cnt.cut}</b></span></div></div>` +
    `<div class="bl-box"><div class="bl-h"><b>기록</b><small>최근 것이 위</small></div>` +
    (S.log.length ? `<ul class="bl-log">${S.log.map(l => `<li>${l}</li>`).join('')}</ul>` : '<div class="bl-note">오른쪽에서 장기를 골라 써 보세요.</div>') + '</div>';
}
function blSideHtml(why) {
  return '<div class="bl-row">' + ['main', 'sub'].map(s => `<button class="bl-chip${blSide === s ? ' on' : ''}" onclick="blSetSide('${s}')">${BL_SIDE[s]}에 넣기</button>`).join('') +
    (why ? '' : `<small class="bl-note">들어갈 자리: ${blWhereText(blSide)}</small>`) + '</div>';
}
function blWhereText(side) {
  const empty = S[side].filter(e => !e).length;
  return empty ? `${BL_SIDE[side]} ${S[side].findIndex(e => !e) + 1}번 칸 (빈칸은 위에서부터)` : `${BL_SIDE[side]} 3칸 중 무작위 (진급·절대자가 2개면 같은 등급 자리만)`;
}
function blSpecListHtml() {
  const pool = blPool(), q = blQ.trim().toLowerCase(), why = blSpecWhy(blSide);
  const rows = pool.opts.map((o, i) => ({o, i})).filter(x => optGrade(x.o.type) === '절대' && x.o.type.includes(BL_SIDE[blSide]) && qHit(q, x.o.effect));
  return rows.map(({o, i}) => {
    const dis = blHas(o.effect) || !!why;
    return `<div class="bl-opt${dis ? ' dis' : ''}"${dis ? '' : ` onclick="blUseSpec(${i})"`}><span>${optHtml(o.effect, o.tips)}</span>` +
      `<em>${blHas(o.effect) ? '붙어 있음' : 'T' + blTiers(o).map(x => x[0]).join('·')}</em></div>`;
  }).join('') || '<div class="bl-note">조건에 맞는 옵션이 없습니다</div>';
}
function blItemListHtml() {
  const q = blItemQ.trim().toLowerCase(), set = BL_SET[S.part];
  const list = BLOOD_LEG.filter(it => it.set === set && qHit(q, it.n, it.src, ...it.o.map(o => o[0])));
  return list.map(it => `<div class="bl-opt${blItem === it.n ? ' on' : ''}" onclick="blSetItem('${esc(it.n).replace(/'/g, "\\'")}')">` +
    (it.img ? `<img src="${esc(it.img)}" alt="" loading="lazy">` : '') +
    `<span><b>${esc(it.n)}</b><br><small style="color:#7d8794">${esc(it.src)} · 옵션 ${blItemLines(it)}줄${it.r ? ' (랜덤 ' + (it.rn || 1) + ')' : ''}${blItemCap(it) <= 1 ? ' · 1개만' : ''}${it.su ? ' · ' + esc(it.su) : ''}</small></span></div>`).join('') ||
    '<div class="bl-note">조건에 맞는 레전드가 없습니다</div>';
}
function blActHtml() {
  const acts = [['norm', '일반 장기', '초급·진급 옵션 무작위'], ['spec', '특수 장기', '절대자 골라 넣기'], ['core', '핵심 장기', '레전드 옵션'], ['cut', '절단 도구', '수치 다시 굴리기']];
  let h = '<div class="bl-acts">' + acts.map(([k, n, d]) => `<button class="bl-act${blMode === k ? ' on' : ''}" onclick="blSetMode('${k}')">${n}<small>${d}</small></button>`).join('') + '</div>';
  if (blMode === 'norm') {
    const one = g => { const n = blNormPool(blSide, g).length, why = blNormWhy(blSide, g);
      return `<div class="bl-row"><button class="bl-go" onclick="blUseNorm('${g}')"${n ? '' : ' disabled'}>일반 장기 (${g}) 쓰기</button>` +
        (why ? `<small class="bl-why">${esc(why)}</small>` : `<small class="bl-note">후보 ${n}가지 (옵션 × 티어)</small>`) + '</div>'; };
    h += '<div class="bl-note">초급용·진급용 장기가 따로 있습니다. 고른 쪽의 그 등급 옵션 전체(티어 포함)에서 무작위로 하나가 붙습니다. 진급이 이미 2개면 같은 쪽 진급 자리만 교체됩니다.</div>' +
      blSideHtml() + one('초급') + one('진급');
  } else if (blMode === 'spec') {
    const why = blSpecWhy(blSide);
    h += '<div class="bl-note">절대자 옵션을 골라 넣습니다 (티어 무작위 · 89레벨 이상). 이미 붙은 옵션은 다시 고를 수 없습니다.</div>' + blSideHtml(why) +
      (why ? `<div class="bl-why">${esc(why)}</div>` : '') +
      `<input class="bl-q" type="search" placeholder="절대자 옵션 검색" value="${esc(blQ)}" oninput="blSearch(this.value)"><div class="bl-list" id="blList">${blSpecListHtml()}</div>`;
  } else if (blMode === 'core') {
    if (S.cand) {
      h += `<div class="bl-note"><b>${esc(S.cand.n)}</b> — 하나를 고르면 레전드가 아닌 무작위 자리를 대신합니다.</div><div class="bl-cands">` +
        S.cand.c.map((cd, ci) => `<div class="bl-cand"><small>후보 ${ci + 1}${typeof cd.oi === 'string' ? ' · 랜덤 옵션 (갈래 중 하나)' : ''}</small>` +
          cd.vs.map((x, vi) => `<div class="bl-opt" onclick="blPickCand(${ci},${vi})"><span>${optHtml(x.v, x.tips)}</span></div>`).join('') + '</div>').join('') +
        '</div><div class="bl-row"><button class="bl-go sub" onclick="blDropCand()">고르지 않고 닫기</button></div>';
    } else {
      const why = blCoreWhy();
      h += '<div class="bl-note">메인·서브 6칸이 다 찬 뒤, 고른 레전드의 옵션 중 무작위 ' + BL_CAND_N + '개가 후보로 나옵니다. 레전드 옵션은 최대 2개이고 한 장비에서만 넣을 수 있습니다. 목록은 핵심 장기가 있는 레전드만입니다.</div>' +
        (S.lock ? `<div class="bl-row"><small class="bl-note">추출 중인 장비: <b>${esc(S.lock)}</b> (같은 장비만)</small></div>` : '') +
        `<div class="bl-row"><button class="bl-go" onclick="blUseCore()"${why ? ' disabled' : ''}>핵심 장기 쓰기</button>` +
        (!S.lock && blItem ? `<small class="bl-note">고른 장비: <b style="color:#f3e3b5">${esc(blItem)}</b></small>` : '') + '</div>' +
        (why ? `<div class="bl-why">${esc(why)}</div>` : '') +
        (S.lock ? '' : `<input class="bl-q" type="search" placeholder="레전드 이름·옵션 검색 (${BL_SET_NAME[BL_SET[S.part]]})" value="${esc(blItemQ)}" oninput="blSearch(this.value,'item')"><div class="bl-list" id="blList">${blItemListHtml()}</div>`);
    }
  } else {
    h += '<div class="bl-note">붙어 있는 메인·서브 옵션의 수치를 모두 다시 굴립니다. 옵션과 티어는 그대로입니다.</div>' +
      `<div class="bl-row"><button class="bl-go" onclick="blUseCut()"${blAll().some(x => x.e) ? '' : ' disabled'}>절단 도구 쓰기</button></div>`;
  }
  return `<div class="bl-box">${h}</div>`;
}
function blRender() {
  const parts = BL_PARTS.map(p => `<button class="bl-chip${S.part === p ? ' on' : ''}" onclick="blSetPart('${p}',${S.ab && blHasAb(p)})">${p}</button>`).join('');
  const ab = blHasAb(S.part) ? `<span class="bl-chips"><button class="bl-chip${!S.ab ? ' on' : ''}" onclick="blSetPart('${S.part}',false)">일반 부위</button>` +
    `<button class="bl-chip${S.ab ? ' on' : ''}" onclick="blSetPart('${S.part}',true)">이상 부위</button></span>` : '';
  const lst = document.getElementById('blList'), top = lst ? lst.scrollTop : 0; // 다시 그려도 목록 스크롤 자리 유지 (2026-10-27 사용자)
  document.getElementById('bloodApp').innerHTML = `<div class="bl-top"><span class="bl-ttl"><b>봉합 시뮬레이터</b><small>블러드 장비 · 세라일</small></span>` +
    `<span class="bl-chips">${parts}</span>${ab}<span class="bl-r"><button class="bl-chip" onclick="blUndo()"${undo.length ? '' : ' disabled'}>↶ 되돌리기</button>` +
    `<button class="bl-chip" onclick="blReset()">처음부터</button></span></div>` +
    `<div class="bl-main"><div>${blGearHtml()}</div><div>${blActHtml()}</div></div>` +
    '<div class="bl-note" style="margin-top:10px">티어 확률은 공개되지 않아 같은 확률로 굴립니다. 봉합선 등 재료와 결점 투성이 효과는 다루지 않습니다.</div>';
  const nl = document.getElementById('blList');
  if (nl && top) nl.scrollTop = top;
}
S = blNew('투구', false);
blRender();
