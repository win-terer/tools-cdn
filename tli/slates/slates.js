// 생성물 — 고칠 땐 update/src/js/00_gear.js · update/src/js/00_slate.js · update/src/page_common.js · update/src/wz_slate.js · update/src/wz_slshare.js · update/src/slates_page.js (build_html2.build_tool_pages)
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
// ── 침식 규칙 (2026-11-03 사용자) ──
// 레전드는 '옵션 줄이 침식되는 것'과 '침식으로 생긴 기본 옵션' 중 하나만 둔다 — 둘 다는 안 된다.
// 장갑만 특이 케이스라 3줄 넘게 침식되기도 하고 침식 기본 옵션이 여러 줄 달리기도 한다 →
// 실제 상한을 모르니 장갑은 막지 않는다(사용자 '제한 없음'). 제작 장비는 장갑이라도 다른 부위와 같다.
const GLOVE_PARTS = ['힘 글러브', '민첩 장갑', '지혜 장갑'];
const gloveParts = () => (typeof PARTS !== 'undefined' && PARTS.GLOVES) || GLOVE_PARTS;
const isLegendGlove = v => !!(v && v.kind === 'item' && gloveParts().includes(v.part));
// 침식 강화 개수 — 레전드·제작 2개, 블러드 3개, 레전드 장갑은 줄 수만큼 (19 = 공유 코드 자리 한계 20 안)
function corrLimit(v) { return v.kind === 'blood' ? 3 : isLegendGlove(v) ? 19 : 2; }
// 침식 기본 옵션 개수 — 레전드 1개, 레전드 장갑은 후보 전부
function eroBaseLimit(v) { return isLegendGlove(v) ? 99 : 1; }
// 레전드 택1 — 장갑이 아니면 침식 강화와 침식 기본 옵션을 함께 둘 수 없다
const eroExclusive = v => !!(v && v.kind === 'item' && !isLegendGlove(v));

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

// ── 신격 석판 공용 조각 (2026-10-08) ──
// 빌더(보드 보기·로그 재현)와 빌더 2(석판 배치 편집)가 함께 쓰는 규칙: 석판 모양(SLATES)·신격 변형·활성 칸(다이아몬드)·
// 회전·겹침/개수 한도·심판/전염/복제 파생 효과·보드 → 재능 목록 재생성.
// 기대하는 바깥 것: preset · ALL_DATA · SLATEIDX · rowKey (빌더는 01_core, 빌더 2 는 slate_data.js 연결부)
// 석판 아이템 카탈로그 — 키 = tlidb 상세 페이지 id(=로그 UniqueItmId), 신격의 석판만 BaseId.
// c = 칸 좌표(원점 셀 (0,0), Direction=0 기준), 회전 = 원점 셀 고정 반시계 90°×Direction.
// 실로그 두 보드(장비 교체 전후, 하나는 24칸 만재)를 다이아몬드(2·4·6·6·4·2)에 제약 풀이해 검증.
// v=0은 실배치 미관측이라 기본 방향 미확정 — 렌더에서 점선 표시, 충돌하면 원점 칸만 표시
const SLATES = {
  // sl = 옵션 슬롯 등급 템플릿(slateRank: 0=핵심[명칭] 1=레전드 중위·절대자 2=중위 3=하위), 없으면 소켓 불가
  // copy = 복제 규칙 {a: 'all'(인접 전부)|'dir'(Direction 방향)|'lr'(좌우), p: 'last'(마지막 줄)|'ranks', r: 허용 rank}
  //        — tlidb SS13 문구 기준, 핵심[명칭]은 항상 복제 불가
  1001: {n: '빛이 된 나방', c: [[0,0]], v: 1, copy: {a: 'dir', p: 'last'}, limit: 3},
  // 중위 칸에는 레전드 중위(rank 1)도 들어간다 — tlidb 표기는 '중위'만 적지만 게임에선 된다 (사용자 확인 2026-10-08)
  1003: {n: '추락하는 별빛', c: [[0,0],[-1,0]], v: 1, sl: [[3],[3],[1,2,3],[1,2]], limit: 3},
  1005: {n: '신성의 일각', c: [[0,0],[0,1],[-1,0]], v: 1, sl: [[1],[1]], limit: 3},
  1009: {n: '우주의 균열', c: [[0,0],[-1,0],[-2,0],[1,0],[2,0],[3,0]], v: 0, copy: {a: 'lr', p: 'ranks', r: [1,2]}, limit: 1},
  1010: {n: '신의 계보', c: [[0,0],[0,1],[0,-1],[-1,0],[-1,-1],[1,1],[1,0]], v: 1, sl: [[1,2,3],[1,2,3],[0,1,2],[0]], limit: 1},  // 핵심 재능은 계보에만, 최대 2 (슬롯 템플릿이 보장)
  1011: {n: '별들의 고향', c: [[0,0],[-1,1],[0,-1],[0,1],[1,0],[1,1],[1,2],[2,0]], v: 0, copy: {a: 'all', p: 'ranks', r: [2]}, limit: 1},
  1012: {n: '들불 번지는 순간', c: [[0,0]], v: 1, copy: {a: 'all', p: 'last'}, limit: 1},
  // 신격(제작 석판): uniq=0이라 BaseId가 키, 소켓은 자유 4칸(명칭+인챈트 3)
  260001: {n: '사냥의 여신의 신격', c: [[0,0]], v: 0, god: 1, sl: [[1,2,3],[1,2,3],[1,2,3],[1,2,3],[1,2,3]]},
  260101: {n: '기만의 여신의 신격', c: [[0,0]], v: 0, god: 1, sl: [[1,2,3],[1,2,3],[1,2,3],[1,2,3],[1,2,3]]},
  260201: {n: '지식의 여신의 신격', c: [[0,0]], v: 0, god: 1, sl: [[1,2,3],[1,2,3],[1,2,3],[1,2,3],[1,2,3]]},
  260301: {n: '전쟁의 신의 신격', c: [[0,0]], v: 0, god: 1, sl: [[1,2,3],[1,2,3],[1,2,3],[1,2,3],[1,2,3]]},
  260401: {n: '기계의 신의 신격', c: [[0,0]], v: 0, god: 1, sl: [[1,2,3],[1,2,3],[1,2,3],[1,2,3],[1,2,3]]},
  260501: {n: '힘의 신의 신격', c: [[0,0]], v: 0, god: 1, sl: [[1,2,3],[1,2,3],[1,2,3],[1,2,3],[1,2,3]]},
  // 불완전한 2종은 SS14 에 와서 게임·tlidb 에서 사라졌다 (2026-11-04 사용자) — 팔레트에서 뺐지만
  // 옛 공유 코드·지난 로그가 아직 번호를 들고 있어 카탈로그에는 남겨 둔다 (old: 1)
  394001: {old: 1, lg: 'nether', n: '명왕의 불완전한 신격: 심판', c: [[0,0],[-3,0]], v: 0, god: 1, boost: {v: 30}, pc: 1, sl: [[1,2,3],[1,2,3]]},
  394002: {old: 1, lg: 'nether', n: '명왕의 불완전한 신격: 인펙션', c: [[0,0],[1,0]], v: 1, god: 1, spread: {v: -90}, pc: 1, sl: [[1,2,3],[1,2,3]]},
  394004: {lg: 'nether', n: '명왕의 신격: 심판', c: [[0,0],[-3,0],[-3,3]], v: 1, god: 1, boost: {v: 40, self: -30}, /* SS14 너프: 70% → 40%, 자체 낙인 -30% (tlidb Judgment, 2026-10-22) */ pc: 1, sl: [[1,2,3],[1,2,3],[1,2,3]]},
  394005: {lg: 'nether', n: '명왕의 신격: 인펙션', c: [[0,0],[1,0],[-1,0]], v: 1, god: 1, spread: {v: -88}, pc: 1, sl: [[1,2,3],[1,2,3],[1,2,3]]}, // SS14 너프 -50% → -88% (tlidb Contamination, 2026-10-22). 원점=가운데 칸, c 순서=게임 옵션 순(가운데→아래→위: 1번=가운데·2번=아래·3번=위 칸), 전염 -50% (세이지 실보드·아이템 카드 확정)
  394006: {lg: 'nether', n: '명왕의 신격: 추방', c: [[0,0],[1,1],[2,2]], v: 0, god: 1, pc: 1, banish: 1, sl: [[1,2,3],[1,2,3],[1,2,3]]},
};
// ── 명왕의 신격: 추방 — 10가지 「효과」 중 하나 (tlidb Banishment, 2026-11-04 사용자) ──
// 조건: 자신과 인접한 신격의 석판 · 인접하지 않은 신격의 석판이 모두 3개 이상일 때 그 효과를 얻는다.
// 효과 줄은 우리 옵션 표(SLATE_DB)에 없는 전용 문구라 계산에는 안 들어가고 툴팁·안내로만 보여 준다
// (심판 강화·인펙션 전염과 같은 취급). 저장은 피스의 b = 1~10 (0·없음 = 미선택)
const BANISH_NEED = 3;
const BANISH_FX = [
  {n: '파괴', d: ['파괴 스킬 시전 시 주변 15 미터 내의 적에게 마비를 시전한다.',
                '파괴 스킬이 마비된 적에게 입히는 대미지 별도 +10%, 마비 효과에 대한 보너스는 해당 효과의 보너스에도 적용된다.']},
  {n: '슬래시', d: ['메인 슬래시 스킬 시전 시, 100%를 초과하는 슬래시 확률을 1% 보유 시마다 +1% 확률로 메인 슬래시 스킬을 1회 발동하고, 발동한 스킬의 대미지 별도 +40%, 스킬 범위 +40%']},
  {n: '그림자', d: ['위치 이동 공격 스킬 시전 후 그림자 습격 스킬 대미지 별도 +5%, 4 초간 지속한다.',
                 '위치 이동 공격 스킬 시전 시 핵심 그림자 습격 스킬을 2 회 발동한다.']},
  {n: '버스트', d: ['매직 버스트로 시전하는 스킬의 적중 대미지 별도 +5%',
                 '매직 버스트 충전이 최대치 도달 시 25 미터 내의 가장 가까운 적에게 메인 주술 스킬을 발동하고, 메인 주술 스킬의 매직 버스트 활성화를 시도한다.',
                 '이동 속도 -30%']},
  {n: '오멘', d: ['주변 15 미터 내의 강적이 오멘을 최소 4 회 보유한다.',
                '지속 대미지 부여 시 HP 10% 미만인 적을 도태시킨다.',
                '강적 도태 시 최대 HP와 최대 보호막 1%를 상실한다. 간격 0.03 초']},
  {n: '수렁', d: ['적이 저주 효과 1개의 영향을 받을 때마다 지면 스킬이 적에게 입히는 대미지 별도 +10%']},
  {n: '투사', d: ['투사체 스킬 시전 시 명왕: 투사를 1회 획득한다. 4 초간 지속, 최대 5 회 중첩한다.',
                '명왕: 투사가 최대치 도달 시 수평 사격 투사체가 영구 관통한다.']},
  {n: '공양', d: ['비회복 영약 효과는 자신이 아닌 소환체에 작용한다.',
                '영약 스킬 효과 +40%',
                '영약 효과를 받는 소환체의 대미지 별도 +15%']},
  {n: '부착', d: ['부착은 적이 아닌 소환체에 작용한다.',
                '부착 스킬 시전 시, 가장 가까운 스마트 웨폰 소환체 1개의 최대 HP 80 포인트당 부착 대미지 별도 +1%, 최대 별도 +130%']},
  {n: '불멸', d: ['치명적 일격을 받을 때 최대 HP의 100%만큼 임시 HP를 획득하고, 이후 4 초간 최대 HP를 100% 잃는다. 해당 효과의 간격 20 초',
                '해당 효과가 준비와 발동 상태일 때 대미지와 소환체 대미지 별도 +10%']},
];
const banishFx = sl => (sl && +sl.b >= 1 && +sl.b <= BANISH_FX.length) ? BANISH_FX[+sl.b - 1] : null;
// ── 명왕 석판은 꽂은 옵션 수만큼만 칸을 차지한다 (2026-11-04 사용자: 옵션 0~1개면 1칸·2개면 2칸·3개면 3칸) ──
// 칸 순서(c)와 소켓 번호가 1:1 이라 「마지막으로 채운 소켓까지」를 쓴다 — 가운데를 비워 둬도 번호와 칸이 안 어긋난다.
// 피스를 안 주면(모양 비교·새로 놓기) 빈 석판으로 보고 1칸.
function slateUseN(info, sl) {
  const n = ((info && info.c) || []).length;
  if (!info || !info.pc) return n;
  // 공유 배치에서 온 피스는 소켓이 비어 있고 칸 수만 pcN 으로 들고 온다 (slateShareParse, 2026-11-08)
  if (sl && sl.pcN) return Math.max(1, Math.min(n, sl.pcN));
  let last = 0;
  ((sl && sl.t) || []).slice(0, n).forEach((x, i) => { if (x) last = i + 1; });
  return Math.max(1, last);
}
// 시즌별 명왕 수치 — SS14 너프(심판 +70%→+40%·자체 낙인 -30%, 인펙션 -50%→-88%). SS13 데이터로 볼 때(지난 시즌 보관 보기·SS13 실측 시험)는 예전 수치로 (2026-10-22)
(() => {
  let l = '';  // 빌더(옛)는 SEASON 상수가 이 파일보다 뒤에 선언돼 여기서 읽으면 오류 — 앞서 실린 PD.season_raw 를 본다
  try { l = (typeof PD !== 'undefined' && PD.season_raw && JSON.parse(PD.season_raw).label) || (typeof window !== 'undefined' && window.TLI_SEASON && window.TLI_SEASON.label) || ''; } catch (e) {}
  const n = +String(l).replace(/\D/g, '');
  if (n && n < 14) { SLATES[394004].boost = {v: 70}; SLATES[394005].spread = {v: -50}; }
})();
// ── 같은 석판인데 번호가 다르게 오는 것 (2026-11-03 제보) ──
// 우리 키는 tlidb 상세 페이지 id(=보통 로그 UniqueItmId)다. 로그가 그 번호 대신 다른 번호로 적어 보내는 석판이 있어
// '석판 #261010 (모양·방향 미확정)' 으로만 보였다. 261010 은 신의 계보 — 그 자리에 계보를 넣으면
// 보드 24칸이 정확히 꽉 차고 겹침도 없어 같은 석판임이 확인된다 (공유 1ua1q5m2).
// 새 번호가 또 나오면 여기 한 줄만 더하면 된다.
const SLATE_ALIAS = {261010: 1010};
const slateId = u => SLATE_ALIAS[+u] || +u;
// 신격의 석판 = 신 6종 × 모양 6변형 (id 26xx01~06, tlidb 아이콘 코드 순서는 Z1·Z2·L1·L2·O·T) + 빌더 전용 ㅗ(26xx07)
// 색은 신마다 고정, 모양은 변형별 테트로미노. 소켓 = 5칸(하위~레전드 중위, 핵심 불가 — 핵심은 계보 전용)
const GOD_SHAPES = [ // [표시 이름(그림 기준, 2026-10-15 정리 — 예전 Z1·L1·T 는 tlidb 아이콘 코드라 그림과 달랐다), 칸]
  ['L', [[0,0],[-1,0],[0,-1],[0,-2]]], // 변형1 실측(리스틸 기만 실보드) — 위1+왼쪽2 = ┘ L형
  ['Z2', [[0,1],[1,0],[1,1],[2,0]]],
  ['Z', [[0,0],[1,0],[0,1],[-1,1]]], // 변형3 실측(세이지 전쟁의 신, ShapeId 1023·Direction 1) — S/Z형
  ['L2', [[0,2],[1,0],[1,1],[1,2]]],
  ['O', [[0,0],[0,1],[1,0],[1,1]]],
  ['J', [[0,0],[-1,0],[0,1],[0,2]]], // 변형6 실측(호자 지식 실보드) — 위1+오른쪽2 = └ J형, 변형1의 거울
  // 변형7 = ㅗ(T) — 사용자 2026-10-15 "ㅗ 모양이 없다". tlidb 아이콘 UI_TalantNG_T1 이 진짜 T 모양인데 실측 변형1~6 엔 T 가 없어
  // 빌더 전용 번호(26xx07)로 둔다 — 로그 ShapeId 로 T 가 확인되면 그 번호로 옮길 것
  ['T', [[0,0],[0,-1],[0,1],[-1,0]]],
];
const GOD_BASES = {260000: '사냥의 여신', 260100: '기만의 여신', 260200: '지식의 여신', 260300: '전쟁의 신', 260400: '기계의 신', 260500: '힘의 신'};
const GOD_PAL = [[3, 'Z'], [1, 'L'], [5, 'O'], [7, 'T']]; // 팔레트·[모양] 순환에 노출하는 변형 (variant, 라벨) — J(변형6)는 L 의 [좌우 반전]으로
// 로그 ShapeId → 신격 변형 번호 (실측 누적 — 로그의 BaseId는 기본형으로만 기록되고 실제 모양은 ShapeId에 있다)
// 값 = 변형 번호, 또는 [변형 번호, 방향 보정] — 빌더 쪽 기본 방향이 게임과 다른 모양(빌더 전용 T)은 로그 Direction 에 보정을 더한다
// 16번 티아 실보드(2026-10-18): 1010·1012=Z 반전(변형 13 — 빌더가 만든 거울 번호지만 게임에도 있는 모양) · 1020=Z · 1062=T(방향 +2) / 17번 티아 실보드(2026-10-19): 1060=T(방향 +2, 로그 Direction 없음)
const GOD_SHAPE_IDS = {'1010': 13, '1011': 2, '1012': 13, '1020': 3, '1023': 3, '1031': 6, '1060': [7, 2], '1062': [7, 2]}; // ShapeId → 신격 모양 변형 (실측: 15번 기만=Z2 · 리스틸 1023=L1 · 1031=T) // 1023=전쟁의 신 S자(세이지), 1031=기만의 여신 T형(리스틸)
Object.keys(GOD_BASES).forEach(b => GOD_SHAPES.forEach((g, vi) => {
  SLATES[+b + vi + 1] = {n: GOD_BASES[b] + '의 신격', c: g[1].map(c => c.slice()), v: 0, god: 1, shp: g[0],
    sl: [[1,2,3],[1,2,3],[1,2,3],[1,2,3],[1,2,3]]};
}));
// 좌우 반전 (2026-10-14 문의 — L(S자) 모양을 거꾸로 놓고 싶다): 신격 모양의 거울상 = 열 부호 반전.
// 거울상이 기존 변형과 (회전·평행이동까지) 같으면 그 변형으로(Z↔T), 없으면 반전 전용 변형(변형 번호 +10, 예: L 반전)을 만든다.
// 반전 전용 변형은 빌더 안에서만 쓰는 번호 — 로그 ShapeId 로는 오지 않는다
const slateShapeKey = c => { // 회전 4가지 중 가장 작은 정규화 문자열
  let cs = c.map(p => p.slice()), best = null;
  for (let k = 0; k < 4; k++) {
    const r0 = Math.min(...cs.map(p => p[0])), c0 = Math.min(...cs.map(p => p[1]));
    const s = cs.map(p => (p[0] - r0) + ',' + (p[1] - c0)).sort().join(';');
    if (best == null || s < best) best = s;
    cs = cs.map(p => [p[1], -p[0]]);
  }
  return best;
};
const GOD_MIRROR = {}; // 신격 u → 좌우 반전한 u (자기 자신이면 대칭 모양)
Object.keys(GOD_BASES).forEach(b => GOD_SHAPES.forEach((g, vi) => {
  const u = +b + vi + 1, mc = g[1].map(p => [p[0], -p[1]]), mk = slateShapeKey(mc);
  if (slateShapeKey(g[1]) === mk) { GOD_MIRROR[u] = u; return; }
  const hit = GOD_SHAPES.findIndex(h => slateShapeKey(h[1]) === mk);
  const m = hit >= 0 ? +b + hit + 1 : +b + vi + 11;
  if (hit < 0) SLATES[m] = Object.assign({}, SLATES[u], {c: mc, shp: g[0].replace(/\d$/, '') + ' 반전'});
  GOD_MIRROR[u] = m; if (!(m in GOD_MIRROR)) GOD_MIRROR[m] = u;
}));

function slateRank(t) {
  const m = (t.effect || '').match(/^\[([^\]]+)\]/);
  if (!m || !/^(레전드 )?(하위|중위|절대자)( 명왕)? 재능( 포인트)?$/.test(m[1])) return 0;
  if (m[1].startsWith('레전드') || m[1].includes('절대자')) return 1;
  return m[1].startsWith('중위') ? 2 : 3;
}
// ── 석판 보드 (로그 가져오기 배치 재현, 읽기 전용) ──
// Index = 행×10+열(1-based), 활성 칸 = 다이아몬드(행 폭 2·4·6·6·4·2, 6×6)
// 회전 = 원점 셀 고정, T(x,y)=(y,-x)를 Direction번 적용 (반시계 90° 단위) — 실로그 두 보드로 검증
const SLATE_ACT = (() => {
  const s = new Set();
  [2, 4, 6, 6, 4, 2].forEach((w, r) => { const st = (6 - w) / 2 + 1; for (let c = st; c < st + w; c++) s.add((r + 1) * 10 + c); });
  return s;
})();
function slateCellsXY(u, idx, dir, sl) { // 렌더용 (열, 행) 좌표 — 보드 밖(음수 포함)도 정확히 표현 (sl = 피스 — 명왕은 옵션 수만큼만 칸을 쓴다)
  // Index = 열×10+행 (2026-08-14 리스틸 실보드 사진으로 확정 — 이전엔 행·열이 전치되어 그려졌음)
  // 셰이프 c = [d행, d열] 규약: id = (열0+c[1])×10 + (행0+c[0])
  const info = SLATES[u];
  if (!info) return null;
  let cells = info.c.slice(0, slateUseN(info, sl)).map(pt => pt.slice());
  for (let k = 0; k < (dir % 4); k++) cells = cells.map(pt => [pt[1], -pt[0]]);
  const row0 = idx % 10, col0 = (idx / 10) | 0;
  return cells.map(pt => [col0 + pt[1], row0 + pt[0]]);
}
function slateCells(u, idx, dir, sl) {
  const info = SLATES[u];
  if (!info) return null;
  let cells = info.c.slice(0, slateUseN(info, sl)).map(p => p.slice());
  for (let k = 0; k < (dir % 4); k++) cells = cells.map(c => [c[1], -c[0]]);
  const x0 = idx % 10, y0 = (idx / 10) | 0;
  return cells.map(c => (y0 + c[1]) * 10 + (x0 + c[0]));
}
const SLATE_COLORS = ['#e5534b', '#3fb950', '#4493f8', '#d29922', '#a371f7', '#39c5cf', '#f778ba', '#ffa657', '#7ee787', '#79c0ff', '#ff7b72', '#8b949e'];
// 석판 색 — **종류마다 고정** (2026-11-08 사용자: 계보 노랑 · 들불 붉은노랑 · 일각/추별 노랑 · 명왕 진파랑)
//   전엔 놓은 순번(SLATE_COLORS[pi])이라 같은 석판이 판마다 다른 색이었다. 이제 색이 곧 석판 이름이다.
//   같은 석판이 여러 장이면 부르는 쪽에서 명도 단계로 가른다(wsbColors·03_editor).
const SLATE_GOD_COLORS = {260000: '#2dd4bf', 260100: '#d46ad4', 260200: '#5588ff', 260300: '#e5534b', 260400: '#38bdf8', 260500: '#f0883e'};
const SLATE_HUE = {
  1010: '#ffd54a',  // 신의 계보 — 밝은 금빛
  1003: '#d9a327',  // 추락하는 별빛 — 짙은 호박
  1005: '#e8d27a',  // 신성의 일각 — 연한 금빛
  1012: '#f2742e',  // 들불 번지는 순간 — 붉은빛 주황
  1001: '#8fd3f4',  // 빛이 된 나방 (미지정 — 노랑과 안 겹치게 흰 하늘빛)
  1009: '#a371f7',  // 우주의 균열 (미지정)
  1011: '#3fb950',  // 별들의 고향 (미지정)
  394004: '#5b8def', 394005: '#3566d6', 394006: '#2448b8',   // 명왕 — 진한 파랑
  394001: '#4a7ae0', 394002: '#2c57c4',                      // 불완전 명왕(옛 데이터)
};
function slateBaseColor(u, pi) {
  if (SLATE_HUE[u]) return SLATE_HUE[u];
  const info = SLATES[u] || {};
  if (info.god) return SLATE_GOD_COLORS[Math.floor((u - 1) / 100) * 100] || '#c9a6ff';
  return SLATE_COLORS[pi % SLATE_COLORS.length];
}
function sbCellsFree(bd, cells, skip) {
  const used = new Set();
  bd.forEach((s, i) => { if (i !== skip) (slateCells(s.u, s.i, s.d, s) || [s.i]).forEach(c => used.add(c)); });
  return !!cells && cells.every(c => SLATE_ACT.has(c) && !used.has(c));
}
function sbFitDir(bd, u, i, d0, skip, sl) { // d0부터 시작해 들어가는 회전값 탐색 (없으면 -1)
  for (let k = 0; k < 4; k++) {
    const d = (d0 + k) % 4;
    if (sbCellsFree(bd, slateCells(u, i, d, sl), skip)) return d;
  }
  return -1;
}
// 겹침·보드 밖 상태의 피스 인덱스 목록 (포커스 유지·공유 차단 판단용)
function sbConflicts(bd) {
  const out = [], used = new Map();
  (bd || []).forEach((s, pi) => {
    let bad = false;
    (slateCells(s.u, s.i, s.d, s) || [s.i]).forEach(c => {
      if (!SLATE_ACT.has(c)) { bad = true; return; }
      if (used.has(c)) { bad = true; if (out.indexOf(used.get(c)) < 0) out.push(used.get(c)); }
      else used.set(c, pi);
    });
    if (bad && out.indexOf(pi) < 0) out.push(pi);
  });
  return out;
}
// 개수 한도: 별빛·일각·나방 3 / 들불·균열·고향·계보 1 / 명왕 계열(lg:'nether')은 통틀어 1 (사용자 확인)
function sbLimitErr(u) {
  const info = SLATES[u] || {};
  const bd = preset.slateBd || [];
  if (info.lg && bd.some(x => (SLATES[x.u] || {}).lg === info.lg)) return '명왕의 신격은 하나만 배치할 수 있습니다.';
  if (info.limit && bd.filter(x => x.u === u).length >= info.limit) return (info.n || '이 석판') + '은(는) 최대 ' + info.limit + '개까지 배치할 수 있습니다.';
  return null;
}
// 심판 돌 사이 영역: 돌 쌍마다 그 사이 직선 칸(가로·세로 변 + 대각 빗변) — 돌 자신·삼각형 내부는 제외
// (내부 칸 미포함은 실보드 검증: 중앙에 있던 들불이 강화 안 받음 — 2026-08-14 사용자 확인)
function judgeRegion(cells) {
  const pts = cells.map(id => [id % 10, (id / 10) | 0]);
  const out = new Set();
  const seg = (a, b) => {
    const dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    for (let k = 1; k < n; k++) out.add((a[1] + dy * k) * 10 + (a[0] + dx * k));
  };
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) seg(pts[i], pts[j]);
  cells.forEach(id => out.delete(id));
  return out;
}
// 보드 파생 효과 3종 (배치에서 계산 — 게임 로그에는 결과가 안 실림):
// ① 들불 번지는 순간(1012) = 상하좌우 인접 석판의 마지막 줄 옵션 복제 (핵심[명칭]·유효 한도 1은 복제 불가)
// ② boost(심판) = 돌 사이 영역에 걸친 석판의 옵션 강화 (정식 +40% · 자기 낙인 -30%, SS14)
// ③ spread(인펙션) = 자기 옵션을 인접 석판마다 -88%(SS14, 예전 -50%)로 복제해 추가 (세이지 실측 — 카드에 '증식 방향: 양쪽' 필드 존재, InfluenceId 11001로 추정되나 다른 값 미관측이라 방향 제한은 미구현)
function slateDerived(bd) {
  const cellsOf = bd.map(s => slateCells(s.u, s.i, s.d, s) || [s.i]);
  const adjPieces = si => { // si 피스와 변을 맞댄 피스들
    const out = new Set();
    cellsOf[si].forEach(c => [-10, 10, -1, 1].forEach(d => {
      bd.forEach((nb, ni) => { if (ni !== si && cellsOf[ni].indexOf(c + d) >= 0) out.add(ni); });
    }));
    return out;
  };
  const copies = []; // 복제는 항상 기본 수치 (심판 강화 미적용 — 사용자 확인)
  const nameOf = ni => (SLATES[bd[ni].u] || {}).n || '#' + bd[ni].u;
  const rankOfNid = nid => { // 노드의 등급 (핵심[명칭]=0) — 데이터에 없으면 -1
    const ri = SLATEIDX.idx[nid];
    return ri === undefined ? -1 : slateRank(ALL_DATA[ri]);
  };
  const MOTH_DIRS = ['위', '왼쪽', '아래', '오른쪽']; // InfluenceId-1001 순 (실보드 2개 확정: 리스틸 1001=위, 세이지 1002=왼쪽 — tlidb 카드 문구 나열 순과 일치)
  bd.forEach((f, fi) => {
    const cp = (SLATES[f.u] || {}).copy;
    if (!cp) return;
    // 이웃 피스의 '어느 칸'에 맞닿는지 수집 — 명왕은 칸↔옵션 1:1이라 맞닿은 칸이 곧 복제 대상 옵션
    const touched = new Map(); // ni → Set(칸 인덱스)
    const addTouch = cellId => {
      bd.forEach((nb, ni) => {
        if (ni === fi) return;
        const idx = cellsOf[ni].indexOf(cellId);
        if (idx >= 0) { if (!touched.has(ni)) touched.set(ni, new Set()); touched.get(ni).add(idx); }
      });
    };
    if (cp.a === 'dir') { // 나방: InfluenceId 1001~1004 = 위(-1)·왼쪽(-10)·아래(+1)·오른쪽(+10)
      const di = (f.f || 0) - 1001;
      if (di < 0 || di > 3) return; // 방향 정보 없음 (구 데이터·외부 앱 미전송) — 복제 표시 생략
      addTouch(f.i + [-1, -10, 1, 10][di]);
    }
    else if (cp.a === 'lr') cellsOf[fi].forEach(c => [-10, 10].forEach(d => addTouch(c + d))); // 좌우 = 열±1 = ±10
    else cellsOf[fi].forEach(c => [-10, 10, -1, 1].forEach(d => addTouch(c + d)));
    touched.forEach((cis, ni) => {
      const nb = bd[ni];
      if ((SLATES[nb.u] || {}).copy) return; // 복제 석판끼리는 서로 복제할 옵션이 없음
      const t = nb.t || [];
      let picked;
      if (cp.p === 'ranks') { // 균열·고향: 지정 등급 전부
        picked = t.filter(Boolean).filter(nid => cp.r.indexOf(rankOfNid(nid)) >= 0);
      } else if ((SLATES[nb.u] || {}).pc) { // 명왕: 맞닿은 칸의 옵션 (핵심 불가 규칙 동일)
        picked = [...new Set([...cis].map(ci => t[ci]).filter(Boolean).filter(nid => rankOfNid(nid) > 0))];
      } else { // 마지막 줄 하나 (핵심[명칭]이면 복제 불가)
        const filled = t.filter(Boolean);
        const last = filled[filled.length - 1];
        picked = last && rankOfNid(last) > 0 ? [last] : [];
      }
      picked.forEach(nid => copies.push({fi, ni, nid, from: nameOf(ni),
        moth: cp.a === 'dir' ? MOTH_DIRS[(f.f || 0) - 1001] || '?' : null}));
    });
  });
  const boosted = new Map(); // 피스 순번 → 배지 (+40% 등)
  const boostV = new Map(); // 피스 순번 → 강화 % (수치에 곱한다)
  const boostPairs = []; // 강화 관계쌍 (심판 → 대상, 호버 연동용)
  const spreads = [];
  bd.forEach((s, si) => {
    const info = SLATES[s.u] || {};
    if (info.boost) {
      const region = judgeRegion(cellsOf[si]);
      bd.forEach((nb, ni) => {
        if (ni !== si && cellsOf[ni].some(c => region.has(c))) {
          boosted.set(ni, info.boost.v ? '+' + info.boost.v + '%' : '강화');
          if (info.boost.v) boostV.set(ni, Math.max(boostV.get(ni) || 0, info.boost.v));
          boostPairs.push({si, ni});
        }
      });
    }
    if (info.spread && (s.t || []).filter(Boolean).length) {
      // 낙인(칸 소켓)만 전염 — 칸 수 이후 항목(재능 포인트 고정, BaseTalentList)은 인펙션 본체 전용 (세이지 실측)
      const tt = info.pc ? (s.t || []).slice(0, slateUseN(info, s)) : (s.t || []);
      adjPieces(si).forEach(ni => {
        tt.filter(Boolean).forEach(nid => {
          const ri = SLATEIDX.idx[nid];
          const eff = ri !== undefined ? ALL_DATA[ri].effect : '';
          if (slateRank({effect: eff}) === 0) return; // 명칭 줄은 전염 대상 아님
          spreads.push({si, ni, nid, to: (SLATES[bd[ni].u] || {}).n || '#' + bd[ni].u, pct: info.spread.v || ''});
        });
      });
    }
  });
  return {copies, boosted, boostV, spreads, boostPairs, adj: bd.map((_, i) => adjPieces(i))};
}
// 추방 발동 상태 — 변을 맞댄 신격의 석판(인접)과 나머지(비인접)가 각각 3개 이상이어야 한다
function banishState(bd, pi, dv) { // dv = 이미 계산한 slateDerived (없으면 새로 — 호출이 잦은 곳에선 꼭 넘길 것)
  const adj = (dv || slateDerived(bd)).adj[pi] || new Set();
  const far = Math.max(0, (bd || []).length - 1 - adj.size);
  return {fx: banishFx(bd[pi]), adj: adj.size, far, ok: adj.size >= BANISH_NEED && far >= BANISH_NEED};
}
// 피스마다 효과가 닿는 칸(자기 칸 제외) — 마우스를 올리면 빈 칸까지 점선으로 (옵션이 없어 복제·전염이 0건이어도 범위는 보이게, 2026-10-27 사용자)
//   들불·고향 = 상하좌우 · 나방 = 정해진 한 방향 · 균열 = 좌우 · 인펙션 = 변을 맞댄 칸 · 심판 = 돌 사이 영역
function slateRange(bd) {
  return bd.map(s => {
    const info = SLATES[s.u] || {}, cells = slateCells(s.u, s.i, s.d, s) || [s.i], out = new Set();
    const around = ds => cells.forEach(c => ds.forEach(d => out.add(c + d)));
    const cp = info.copy;
    if (cp && cp.a === 'dir') { const di = (s.f || 0) - 1001; if (di >= 0 && di <= 3) out.add(s.i + [-1, -10, 1, 10][di]); }
    else if (cp && cp.a === 'lr') around([-10, 10]);
    else if (cp || info.spread) around([-10, 10, -1, 1]);
    if (info.boost) judgeRegion(cells).forEach(c => out.add(c));
    cells.forEach(c => out.delete(c));
    return out;
  });
}
// 보드(slateBd) → 석판 재능 행 라벨 공통부 — add(nid, src) 콜백으로 밀어넣는다
// (로그 가져오기와 보드 편집 재생성이 같은 라벨 규칙을 쓰도록)
function addSlateTalentRows(bd, add) {
  const dv = slateDerived(bd);
  const AL = {1001: '나방', 1012: '들불', 1009: '균열', 1011: '고향'};
  bd.forEach((s, pi) => {
    const info = SLATES[s.u];
    const nm = info ? info.n : '#' + s.u;
    const tag = dv.boosted.has(pi) ? nm + ' (심판 ' + dv.boosted.get(pi) + ')' : nm;
    // 심판 강화(+40%·자기 낙인 -30%)는 이름표로만 — 곱해 보니 SS13 실측 로그(시전 속도 인게임 311% 등)와 어긋났다. 단순 배율이 아니라서 계산엔 넣지 않는다(2026-10-22)
    (s.t || []).filter(Boolean).forEach(nid => add(nid, tag));
  });
  dv.copies.forEach(c => add(c.nid, (AL[bd[c.fi].u] || '') + ' 복제 ← ' + c.from)); // 복제는 기본 수치
  dv.spreads.forEach(x => add(x.nid, '인펙션 전염 → ' + x.to + (x.pct ? ' (' + x.pct + '%)' : ''),
                              x.pct ? 1 + x.pct / 100 : 1)); // 전염 옵션은 그 비율만큼 줄어든 수치로 적용된다
}
// 보드 편집 후 보드 파생 행(src 있는 행)만 재생성 — 수동 추가 행은 보존
function rebuildSlateTalents(tp) {
  tp = tp || preset;
  tp.talents = (tp.talents || []).filter(t => !t.src);
  const bd = tp.slateBd || [];
  if (!bd.length) return;
  const seen = new Map();
  addSlateTalentRows(bd, (nid, src, mul) => {
    const i = SLATEIDX.idx[nid];
    if (i === undefined) return;
    const row = ALL_DATA[i];
    const k = rowKey(row);
    const sk = k + (mul && mul !== 1 ? '@' + mul : ''); // 같은 옵션이라도 배율이 다르면 따로 센다
    if (seen.has(sk)) {
      const t = tp.talents[seen.get(sk)];
      t.cnt = (t.cnt || 1) + 1;
      if (src && t.src && t.src.indexOf(src) < 0) t.src.push(src);
      return;
    }
    seen.set(sk, tp.talents.length);
    const t = {k, effect: row.effect, type: talentLabel(row)};
    if (mul && mul !== 1) t.mul = mul;
    if (src) t.src = [src];
    tp.talents.push(t);
  });
}
// 석판은 출처(레전드/비레전드), 운명은 "운명 · 하위/중위 숙명"을 계열 라벨로 사용
function talentLabel(r) {
  return r.category === '석판' ? r.source + (r.type ? ' · ' + r.type : '')
    : r.category === '운명' ? '운명 · ' + r.type
    : r.type;
}
function sbMoveDelta(pi, grab, target, force) { // 잡은 칸 기준 평행이동 — 행·열 성분 분리(십진 랩 방지). force=겹침 허용(보드 밖만 차단)
  const bd = preset.slateBd, sl = bd[pi];
  const dc = target % 10 - grab % 10, dr = ((target / 10) | 0) - ((grab / 10) | 0);
  const cells = slateCells(sl.u, sl.i, sl.d, sl) || [sl.i];
  const moved = [];
  for (const c of cells) {
    const nc = c % 10 + dc, nr = ((c / 10) | 0) + dr;
    if (nc < 1 || nc > 6 || nr < 1 || nr > 6) return null;
    moved.push(nr * 10 + nc);
  }
  if (!force && !sbCellsFree(bd, moved, pi)) return null;
  return {i: (((sl.i / 10) | 0) + dr) * 10 + (sl.i % 10 + dc), cells: moved, ok: sbCellsFree(bd, moved, pi)};
}
const SB_RANK_LABEL = {0: '핵심', 1: '레전드 중위·절대자', 2: '중위', 3: '하위'};

// ── 보드 툴팁·강조용 피스 정보 (빌더 renderSlateBoard 에서 꺼냄 — 빌더 2 석판 배치도 같은 툴팁) ──
// 반환: {pieces: [{name, god, unsure, warn, nodes, keys, sprd, fx, pi}], links: [피스마다 파생 효과로 연결된 피스 Set]}
function slatePieceInfo(bd) {
  const pieces = bd.map((s, pi) => {
    const info = SLATES[s.u];
    const warn = false;
    const keys = new Set(); // 이 석판에 꽂힌 옵션 rowKey (옵션 행 호버 연동)
    const nodes = (s.t || []).filter(Boolean).map(nid => {
      const ri = SLATEIDX.idx[nid];
      if (ri === undefined) return '노드 ' + nid;
      keys.add(rowKey(ALL_DATA[ri]));
      return ALL_DATA[ri].effect;
    });
    return {name: info ? info.n : '석판 #' + s.u, god: !!(info && info.god), unsure: !info || info.v === 0, warn, nodes, keys, pi};
  });
  // 파생 효과를 툴팁·호버 연동에 반영 (복제 4종 / 심판 강화 / 인펙션 전염)
  const dv = slateDerived(bd);
  dv.boosted.forEach((val, pi) => pieces[pi].nodes.unshift('⚖ 심판 강화 ' + val));
  bd.forEach((s, pi) => { // 추방: 고른 효과와 발동 조건(인접·비인접 신격의 석판 각 3개 이상)
    if (!(SLATES[s.u] || {}).banish) return;
    const st = banishState(bd, pi, dv), fx = st.fx;
    const head = ['🚫 추방' + (fx ? ': ' + fx.n : ' — 효과를 고르세요') +
      ' (인접 ' + st.adj + ' · 비인접 ' + st.far + (st.ok ? ' → 발동' : ' — 각 ' + BANISH_NEED + '개 필요') + ')'];
    if (fx) fx.d.forEach(l => head.push((st.ok ? '· ' : '· (미발동) ') + l));
    pieces[pi].bn = head; // 툴팁 맨 위 — 명왕 툴팁은 칸 목록으로 갈아끼우므로 nodes 에 섞지 않는다
  });
  bd.forEach((s, pi) => { // 나방은 방향·로그 값을 툴팁에 표시 (방향 매핑 검증용)
    if (s.u === 1001) pieces[pi].nodes.unshift('복제 방향: ' + (['위', '왼쪽', '아래', '오른쪽'][(s.f || 0) - 1001] || '정보 없음'));
  });
  dv.copies.forEach(c => {
    const ri = SLATEIDX.idx[c.nid];
    if (ri !== undefined) pieces[c.fi].keys.add(rowKey(ALL_DATA[ri]));
    pieces[c.fi].nodes.push('복제' + (c.moth ? '(' + c.moth + ')' : '') + ' ← ' + c.from + ': ' + (ri !== undefined ? ALL_DATA[ri].effect : '노드 ' + c.nid));
  });
  dv.spreads.forEach(x => { // 전염은 nodes에 섞지 않고 별도 섹션(sprd)으로 — 툴팁 상단에 헤더+원문만 표시
    const ri = SLATEIDX.idx[x.nid];
    if (ri !== undefined) pieces[x.ni].keys.add(rowKey(ALL_DATA[ri]));
    const p2 = pieces[x.ni];
    if (!p2.sprd) { p2.sprd = []; p2.sprdSrc = null; }
    if (p2.sprdSrc !== x.si) { // 출처 석판이 바뀔 때만 헤더 (보통 인펙션 1장)
      p2.sprd.push('§전염' + (x.pct ? '(' + x.pct + '%)' : '') + ' ← ' + ((SLATES[bd[x.si].u] || {}).n || '#' + bd[x.si].u));
      p2.sprdSrc = x.si;
    }
    p2.sprd.push(slateOptPlain(ri !== undefined ? ALL_DATA[ri].effect : '노드 ' + x.nid));
  });
  // 파생 효과 관계 링크 (호버 시 상대 피스 2차 강조) + 효과 발신 피스 글로우
  const links = pieces.map(() => new Set());
  const fx = new Set();
  const link = (a, b) => { if (links[a] && links[b]) { links[a].add(b); links[b].add(a); } };
  dv.copies.forEach(c => { link(c.fi, c.ni); fx.add(c.fi); });
  dv.spreads.forEach(x => { link(x.si, x.ni); fx.add(x.si); });
  dv.boostPairs.forEach(b => { link(b.si, b.ni); fx.add(b.si); });
  pieces.forEach(p => { p.fx = fx.has(p.pi); });
  return {pieces, links};
}
// 칸 하나의 툴팁 — 명왕은 고정 옵션 → 구분선 → 1번~ 칸 옵션(마우스 올린 칸 강조), 전염은 머리글 섹션
// 반환 {tip: 글자 툴팁, tipH: HTML 툴팁(data-h)}
function slateCellTip(bd, p, pi, ci, out) {
    let tipBody = p.nodes, hlAt = -1;
    const pinfo = SLATES[bd[pi].u] || {};
    if (pinfo.pc) { // 명왕: 고정(전염 안 됨) 맨 위 → 구분선 → 전 칸 옵션(1번~), 마우스 올린 칸만 강조(hlAt)
      const pt = bd[pi].t || [];
      const fixed = pt.slice(pinfo.c.length).filter(Boolean).map(nid => { // 칸 수 이후 = 재능 포인트 고정
        const ri = SLATEIDX.idx[nid];
        return '고정: ' + (ri !== undefined ? ALL_DATA[ri].effect : '노드 ' + nid);
      });
      // 게임의 칸 번호는 석판 위 칸부터 1번 — 로그의 소켓 순서(c 배열 순)와 다르다 (세이지 인펙션 실측)
      const ord = (pinfo.c || []).slice(0, slateUseN(pinfo, bd[pi])).map((_, i) => i).sort((a, b) =>
        pinfo.c[a][0] - pinfo.c[b][0] || pinfo.c[a][1] - pinfo.c[b][1]);
      tipBody = fixed.concat(fixed.length ? ['✂'] : [], ord.map((ci, no) => {
        const nid = pt[ci];
        const ri = nid ? SLATEIDX.idx[nid] : undefined;
        return (no + 1) + '번 칸: ' + (ri !== undefined ? ALL_DATA[ri].effect : nid ? '노드 ' + nid : '빈 칸');
      }), p.nodes.filter(n => n.startsWith('⚖') || n.startsWith('복제')));
      hlAt = Math.max(0, ord.indexOf(ci)) + (fixed.length ? fixed.length + 1 : 0);
    }
    if (p.bn && p.bn.length) { // 추방 효과·발동 조건은 맨 위에
      const off = p.bn.length + (tipBody.length ? 1 : 0);
      tipBody = p.bn.concat(tipBody.length ? ['✂'] : [], tipBody);
      if (hlAt >= 0) hlAt += off;
    }
    // 줄 구성: [전염 섹션(§헤더+원문)] → 구분선(✂) → 원래 옵션 — 전염이 없으면 기존 그대로
    const sprd = p.sprd || [];
    const lines = sprd.concat(sprd.length && tipBody.length ? ['✂'] : [], tipBody);
    const tname = p.name + (out ? ' (보드 밖 — 재배치 필요)' : p.unsure ? ' (모양·방향 미확정)' : '');
    const tip = tname + (lines.length ? '\n' + lines.map(l => l === '✂' ? '─────' : l.charAt(0) === '§' ? l.slice(1) : l).join('\n') : '');
    const tipH = '<div class="ft-title">' + escapeHtml(tname) + '</div><div class="ft-body">' + lines.map((l, li) =>
      l === '✂' ? '<div class="ft-sep"></div>' :
      l.charAt(0) === '§' ? '<div class="ft-sec">' + escapeHtml(l.slice(1)) + '</div>' :
      '<div' + (hlAt >= 0 && li - (sprd.length ? sprd.length + 1 : 0) === hlAt ? ' class="ft-hl"' : '') + '>' + escapeHtml(l) + '</div>').join('') + '</div>';
  return {tip, tipH};
}

// 소켓 등급 1 = '레전드 중위·절대자' 이지만 절대자(명왕 재능)는 명왕 석판에만 — 다른 석판에서는 레전드 중위만 (사용자 확인 2026-10-08)
const slateIsNether = info => !!(info && info.lg === 'nether');
// 석판 옵션 문구의 머리말 — '[하위 재능]'·'[…명왕 재능 포인트]' 같은 등급 표시는 지우고, 핵심 재능 이름('[야심]' 등)은 남긴다 (2026-10-10 제보: 이름이 안 보였다)
function slateOptSplit(effect) {
  const m = /^\[([^\]]*)\]\s*/.exec(effect || '');
  if (!m) return {name: '', text: effect || ''};
  return {name: /재능( 포인트)?$/.test(m[1]) ? '' : m[1], text: effect.slice(m[0].length)};
}
const slateOptPlain = effect => { const o = slateOptSplit(effect); return (o.name ? o.name + ': ' : '') + o.text; };
function slateSockLabel(info, ranks) {
  return ranks.map(r => r === 1 && !slateIsNether(info) ? '레전드 중위' : SB_RANK_LABEL[r]).join(' · ');
}
// 신마다 하위 직업(재능 보드 1~4) — 신격의 석판 옵션은 자기 신과 그 하위 직업 옵션만 고를 수 있다(2026-10-22 사용자)
const GOD_SUBS = {
  '힘의 신': ['용자', '약탈자', '장군', '투사'], '사냥의 여신': ['명사수', '블레이드 러너', '드루이드', '어쌔신'],
  '지식의 여신': ['마기스터', '미스틱', '엘리멘탈리스트', '예언가'], '전쟁의 신': ['섀도우 댄서', '사무라이', '레인저', '철갑병'],
  '기만의 여신': ['섀도우 마스터', '초능력자', '어둠의 술사', '언데드'], '기계의 신': ['정비공', '철의 개척자', '연금술사', '장인'],
};
function slateGodOf(info) { return info && info.god && !slateIsNether(info) ? Object.keys(GOD_SUBS).find(g => (info.n || '').startsWith(g)) || null : null; }
function slateSockOk(info, r, ranks) { // 이 소켓에 이 옵션 행이 들어가나
  if (ranks.indexOf(slateRank(r)) < 0) return false;
  const god = slateGodOf(info);   // 신격의 석판: 그 신 + 하위 직업 옵션(+ 직업 표기 없는 공용 옵션)만
  if (god && r.type && r.type !== god && !GOD_SUBS[god].includes(r.type)) return false;
  // 명왕 석판: 핵심 재능(이름 붙은 옵션)·새로운 신 옵션은 빼고 (2026-10-22 사용자)
  if (slateIsNether(info)) return r.type !== '새로운 신' && !slateOptSplit(r.effect).name;
  return !/^\[절대자/.test(r.effect || '');
}

// ── 배치 공유 코드 (2026-11-08 사용자: 석판 배치 공유) ──────────────────────
// **놓인 모양만** 담는다 — 어떤 옵션을 꽂았는지는 빼고(사용자: 작성자도 옵션도 볼 필요 없다),
// 모양을 바꾸는 것만 남긴다. 그래서 코드 하나가 곧 「같은 배치」이고 서버는 UNIQUE 로 중복을 막는다.
//   피스 = u.i.d[.v]  ·  피스끼리 '-'  ·  사전순 정렬 → **한 배치 = 한 글자열**
//   v = 그 석판만의 보조값(u 가 무엇인지로 뜻이 정해진다):
//     · 나방 계열(copy.a === 'dir') → 복제 방향 1001~1004
//     · 명왕(pc)                   → **쓰는 칸 수 1~3**
//       명왕은 꽂은 옵션 수만큼 칸이 늘어난다(slateUseN). 옵션을 코드에서 뺐더니 칸 수까지
//       같이 날아가, 1칸 인펙션과 3칸 인펙션이 한 배치로 합쳐졌다 — 칸 수는 모양이라 넣는다
//       (2026-11-08 사용자: "명왕 한칸 짜리로 쓰는것도 분류를 해줘야할까").
const SLATE_CODE_MAX = 24;   // 다이아몬드 활성 칸 수와 같다 — 그보다 많은 피스는 있을 수 없다
const slateIsMothLike = info => ((info || {}).copy || {}).a === 'dir';
function slateShareVar(sl) {   // 피스 → 보조값 (0 = 없음)
  const info = SLATES[sl.u] || {};
  if (slateIsMothLike(info)) return +sl.f || 0;
  if (info.pc) return slateUseN(info, sl);
  return 0;
}
function slateShareVarOk(u, v) {
  const info = SLATES[u] || {};
  if (slateIsMothLike(info)) return v >= 1001 && v <= 1004;
  if (info.pc) return v >= 1 && v <= (info.c || []).length;
  return false;
}
function slateShareCode(bd) {
  return (bd || []).filter(s => s && SLATES[s.u]).map(s => {
    const v = slateShareVar(s);
    return [s.u, s.i, (+s.d || 0) % 4].join('.') + (v ? '.' + v : '');
  }).sort().join('-');
}
// 코드 → 보드. 하나라도 어긋나면 null.
//   명왕의 칸 수는 `pcN` 으로 들고 온다 — 소켓(t)을 가짜로 채우면 편집 화면에 없는 옵션이 꽂힌
//   것처럼 보이기 때문이다. 그림 그릴 때만 쓰고(slateUseN 이 먼저 본다) 저장에는 안 넣는다.
function slateShareParse(code) {
  const s = String(code || '').trim();
  if (!s || s.length > 400) return null;
  const ps = s.split('-');
  if (!ps.length || ps.length > SLATE_CODE_MAX) return null;
  const bd = [], seen = new Set();
  for (const p of ps) {
    const m = /^(\d{3,7})\.(\d{1,2})\.([0-3])(?:\.(\d{1,4}))?$/.exec(p);
    if (!m) return null;
    if (seen.has(p)) return null;   // 똑같은 피스가 두 번 — 완전히 겹친 배치라 있을 수 없다
    seen.add(p);
    const u = +m[1], i = +m[2];
    if (!SLATES[u]) return null;
    const col = (i / 10) | 0, row = i % 10;
    if (col < 1 || col > 6 || row < 1 || row > 6) return null;
    const sl = {u, i, d: +m[3], t: []};
    if (m[4]) {
      const v = +m[4];
      if (!slateShareVarOk(u, v)) return null;
      if (slateIsMothLike(SLATES[u])) sl.f = v; else sl.pcN = v;
    }
    bd.push(sl);
  }
  return slateShareCode(bd) === s ? bd : null;   // 정규형이 아니면 거절 — 같은 배치가 두 코드로 올라오지 않게
}
// 칩 거르기 — 신격 6종은 「제작 석판」 하나로 묶는다(2026-11-08 사용자).
//   명왕은 판에 하나뿐(sbLimitErr)이라 「N장 이상」이 뜻이 없다. 대신 **칸 수로 나눈다**:
//   심판·인펙션·추방 칩은 **3칸으로 쓴 것만**, 1칸으로 쓴 것은 종류 구분 없이 「명왕 1칸」 하나로
//   (2026-11-08 사용자). 2칸은 어느 칩에도 안 걸리지만 카드에 칸 수가 적혀 눈에는 보인다.
const SLATE_CHIP_GOD = 'god';
const SLATE_CHIP_PC1 = 'pc1';
const SLATE_PC_FULL = 3;
function slateChipOf(sl) {
  const u = typeof sl === 'object' ? sl.u : sl, info = SLATES[u] || {};
  if (info.god && !info.lg) return SLATE_CHIP_GOD;
  if (info.pc) {
    const n = typeof sl === 'object' ? (sl.pcN || slateUseN(info, sl)) : SLATE_PC_FULL;
    if (n === 1) return SLATE_CHIP_PC1;
    return n >= SLATE_PC_FULL ? String(u) : null;   // 2칸은 어느 칩에도 안 건다
  }
  return String(u);
}
function slateChipCount(bd) {
  const m = {};
  (bd || []).forEach(s => { const k = slateChipOf(s); if (k) m[k] = (m[k] || 0) + 1; });
  return m;
}
// 명왕이 몇 칸으로 쓰였나 (카드 꼬리표용) — 명왕이 아니면 0
function slatePcCells(sl) {
  const info = SLATES[sl.u] || {};
  return info.pc ? (sl.pcN || slateUseN(info, sl)) : 0;
}

// 공통 대화창(nav.js 의 wtOk·wtAsk·wtAskText·wtCopyBox) — nav.js 가 없는 곳(시험 jsdom)에서는 시스템 창으로 (2026-10-22)
if (!window.wtOk) window.wtOk = (m) => confirm(m);
if (!window.wtAsk) window.wtAsk = (m, ok, o) => { if (confirm(m)) { if (ok) ok(); } else if (o && o.onCancel) o.onCancel(); };
if (!window.wtAskText) window.wtAskText = (m, d, ok) => { const v = prompt(m, d); if (v !== null) ok(v); };
if (!window.wtCopyBox) window.wtCopyBox = (m, t) => prompt(m, t);
// ── 단독 화면(/tli/hero · /tli/talent) 공용 연결부 (2026-10-08) ──
// 빌더를 통째로 띄우지 않고 기능 조각(00_*.js)과 그 데이터만 싣는다.
// 빌더2·보기 화면은 빌더와 같은 브라우저 저장소(tlidb_presets_v1)의 활성 빌드를 쓴다.
// 메뉴로 들어가는 단독 화면(히어로·재능·석판)은 내 빌드와 완전 별개 연습판 — 화면마다 따로 저장(tli_solo_*), 빌드 목록·빌더와 오가지 않는다 (2026-10-13 사용자 요청)
// 각 화면은 pageRender(다시 그리기)·pageOnSwitch(빌드 바꿀 때 정리, 선택)를 정의한다.
const PRESETS_KEY = 'tlidb_presets_v1';
const PAGE_SOLO = (['heroApp', 'talentApp', 'slateApp'].find(id => document.getElementById(id)) || '').replace('App', '');
const HP_KEY = PAGE_SOLO ? 'tli_solo_' + PAGE_SOLO + '_v1' : PRESETS_KEY;
const KEY_MAP = new Map(); // 옵션 문구는 저장된 effect 로 읽는다 ((KEY_MAP.get(k) || o).effect 폴백)
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
}
const _stripDiv = document.createElement('div');
function stripHtml(s) { _stripDiv.innerHTML = String(s).replace(/<br\s*\/?>/gi, ' '); return _stripDiv.textContent.replace(/\s+/g, ' ').trim(); } // 빌더 05_ui 와 같음
function hpLoad() {
  try { const p = JSON.parse(localStorage.getItem(HP_KEY)); if (p && Array.isArray(p.list) && p.list.length) return p; } catch (e) {}
  return {list: [{id: 1, name: PAGE_SOLO ? '연습판' : '빌드 1', slots: {}, talents: [], skills: {}}], activeId: 1};
}
let presets = hpLoad();
let preset = presets.list.find(p => p.id === presets.activeId) || presets.list[0];
if (!Array.isArray(preset.talents)) preset.talents = [];
// 되돌리기 — 빌더 01_core 의 undoPreset 과 같은 방식: 저장할 때마다 직전 상태를 쌓는다 (Ctrl+Z · Ctrl+Y)
const UNDO_MAX = 20;
const undoStack = [], redoStack = [];
let undoLast = JSON.stringify(presets), undoQuiet = false, undoTick = false; // undoQuiet: 되돌린 뒤 다시 그리는 중의 저장(정규화 등)은 이력에 안 쌓는다 · undoTick: 한 번 누름에 저장이 여러 번이어도 한 단계
function persistPreset() {
  const cur = JSON.stringify(presets);
  if (cur !== undoLast) {
    if (!undoQuiet && !undoTick) {
      undoStack.push(undoLast); if (undoStack.length > UNDO_MAX) undoStack.shift(); redoStack.length = 0;
      undoTick = true; setTimeout(() => { undoTick = false; }, 0);
    }
    undoLast = cur;
  }
  try { localStorage.setItem(HP_KEY, cur); } catch (e) {}
}
function undoPreset(redo) {
  const from = redo ? redoStack : undoStack, to = redo ? undoStack : redoStack;
  if (!from.length) return false;
  to.push(undoLast);
  presets = JSON.parse(from.pop());
  undoLast = JSON.stringify(presets);
  try { localStorage.setItem(HP_KEY, undoLast); } catch (e) {}
  undoQuiet = true;
  try { hpUse(presets.list.find(p => p.id === presets.activeId) || presets.list[0]); pageRender(); } finally { undoQuiet = false; }
  return true;
}
document.addEventListener('keydown', e => {
  if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
  const k = (e.key || '').toLowerCase();
  if (k !== 'z' && k !== 'y') return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; // 글자 입력은 브라우저 기본 되돌리기
  e.preventDefault();
  undoPreset(k === 'y' || e.shiftKey);
});
function renderPreset() { pageRender(); }
function guardShareView() { return false; }
// 위쪽 줄의 빌드 고르기 — 단추(히어로 얼굴 + 이름 ▾) → 빌드 목록 (2026-10-13, 기본 select 대체)
// 목록: 얼굴 · 이름 · 특성·메인 스킬 · 지난 시즌 표시, 빌드가 7개 이상이면 검색칸. 화면이 hpBuildActs() 를 두면 아래에 동작 단추(빌더2)
let hpBpQ = '';
const hpBpName = p => p.name || '빌드 ' + p.id;
function hpBpFace(p) {
  const tr = p.hero && typeof traitInfo === 'function' && traitInfo(p.hero.trait);
  return tr && tr.img ? `<img src="${tr.img}" alt="" loading="lazy">` : '<i>?</i>';
}
function hpBpSub(p) {
  const main = ['a1', 'a2', 'a3', 'a4', 'a5'].map(k => p.skills && p.skills[k] && p.skills[k].main).find(Boolean);
  return (p.shareEdit ? '✏ 공유 글 수정 중 · ' : '') + ([p.hero && p.hero.trait, main && main.name].filter(Boolean).join(' · ') || '비어 있음');
}
function hpBuildPicker() {
  if (PAGE_SOLO) return '<span class="hp-solo-acts"><button type="button" class="hp-bp hp-solo-over" onclick="hpBpToggle(this)" title="이 화면의 ' + HP_SOLO_WHAT[PAGE_SOLO] + '을(를) 내 빌드 하나에 옮깁니다">📥 내 빌드에 덮어쓰기</button>' +
    '<button type="button" class="hp-solo-reset" onclick="hpSoloReset()" title="이 화면에서 찍은 것을 모두 지웁니다 (Ctrl+Z 로 되돌리기)">↺ 처음부터</button></span>'; // 단독 화면 = 빌드 고르기 없음
  return `<button type="button" class="hp-build hp-bp" onclick="hpBpToggle(this)" title="빌드 바꾸기">` +
    `<span class="hp-bp-face">${hpBpFace(preset)}</span><span class="hp-bp-nm">${escapeHtml(hpBpName(preset))}</span><svg class="hp-bp-car" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
}
// ── 단독 화면 → 내 빌드 덮어쓰기 (2026-10-13 사용자 요청) — 이 화면이 다루는 필드만 바꾸고 나머지(장비·스킬 등)는 그대로
const HP_SOLO_WHAT = {talent: '재능 보드', slate: '석판', hero: '히어로·특성'};
const HP_SOLO_FIELDS = {talent: ['gboard', 'gbOrder', 'gbPrism', 'prism', 'inverse'], slate: ['slateBd'], hero: ['hero', 'heroNodes', 'heroHerbs']};
function hpBuilds() { try { const p = JSON.parse(localStorage.getItem(PRESETS_KEY)); if (p && Array.isArray(p.list)) return p; } catch (e) {} return {list: [], activeId: 0}; }
function hpSoloApply(dst, src) { // src(연습판)의 이 화면 몫을 dst(내 빌드)에 — 재능 줄은 핵심 재능(보드)·석판 파생(src 표시) 몫만 갈아 끼운다
  const cp = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  HP_SOLO_FIELDS[PAGE_SOLO].forEach(f => { if (src[f] === undefined) delete dst[f]; else dst[f] = cp(src[f]); });
  const mine = PAGE_SOLO === 'talent' ? (t => !t.src && talGroup(t.type) === 0) : PAGE_SOLO === 'slate' ? (t => !!t.src) : null;
  if (mine) dst.talents = (dst.talents || []).filter(t => !mine(t)).concat(cp((src.talents || []).filter(mine)));
}
function hpSoloOver(id) {
  hpBpClose();
  const bs = hpBuilds(), isNew = id === 0;
  let dst = bs.list.find(p => p.id === id);
  if (!isNew && !dst) return;
  if (PAGE_SOLO === 'hero' && dst && preset.hero && preset.hero.hero !== '아이리스' &&
      Object.values(dst.skills || {}).some(s => s && s.main && s.main.name === '마령')) {
    alert('그 빌드의 액티브 칸에 마령 스킬이 있어 아이리스가 아닌 히어로로 바꿀 수 없습니다.\n빌더에서 먼저 해당 스킬을 비워주세요.'); return;
  }
  if (!isNew && !wtOk(`「${hpBpName(dst)}」의 ${HP_SOLO_WHAT[PAGE_SOLO]}을(를) 이 화면 것으로 바꿀까요?\n장비·스킬 등 나머지는 그대로 둡니다.`, () => hpSoloOver(id))) return;
  if (isNew) {
    dst = {id: bs.list.reduce((m, p) => Math.max(m, p.id || 0), 0) + 1, name: HP_SOLO_WHAT[PAGE_SOLO] + ' 연습', slots: {}, talents: [], skills: {}};
    bs.list.push(dst);
  }
  hpSoloApply(dst, preset);
  bs.activeId = dst.id; // 빌더를 열면 바로 그 빌드
  try { localStorage.setItem(PRESETS_KEY, JSON.stringify(bs)); } catch (e) { alert('저장하지 못했습니다 (브라우저 저장 공간)'); return; }
  hpToast(`「${escapeHtml(hpBpName(dst))}」에 ${isNew ? '새 빌드로 저장' : '덮어썼습니다'} <a href="/tli/builder/">빌더에서 보기 →</a>`);
}
function hpToast(html) {
  let el = document.getElementById('hpToast');
  if (!el) { el = document.createElement('div'); el.id = 'hpToast'; document.body.appendChild(el); }
  el.innerHTML = html; el.classList.add('on');
  clearTimeout(hpToast.t); hpToast.t = setTimeout(() => el.classList.remove('on'), 6000);
}
function hpSoloReset() {
  if (!wtOk('이 화면에서 찍은 것을 모두 지울까요?', hpSoloReset)) return;
  presets = {list: [{id: 1, name: '연습판', slots: {}, talents: [], skills: {}}], activeId: 1};
  hpUse(presets.list[0]);
  persistPreset();
  pageRender();
}
function hpBpClose() { const m = document.getElementById('hpBp'); if (m) m.remove(); document.querySelectorAll('.hp-bp.open').forEach(b => b.classList.remove('open')); }
function hpBpToggle(btn) {
  if (document.getElementById('hpBp')) { hpBpClose(); return; }
  hpBpQ = '';
  const m = document.createElement('div');
  m.id = 'hpBp'; m.className = 'hp-bpm';
  document.body.appendChild(m);
  btn.classList.add('open');
  hpBpDraw();
  hpBpPlace();
  const q = m.querySelector('.hp-bp-q'); if (q) q.focus();
}
function hpBpPlace() { // 단추 바로 아래 — 스크롤·창 크기가 바뀌면 따라간다(단추가 다시 그려졌으면 새 단추 기준)
  const m = document.getElementById('hpBp'), btn = document.querySelector('.hp-bp.open') || document.querySelector('.hp-bp');
  if (!m || !btn) return;
  btn.classList.add('open');
  const r = btn.getBoundingClientRect();
  m.style.top = (r.bottom + 6) + 'px';
  m.style.left = Math.max(8, Math.min(r.left, innerWidth - m.offsetWidth - 8)) + 'px';
}
function hpBpRows() {
  const q = hpBpQ.trim().toLowerCase(), cur = typeof wbSeason === 'function' ? wbSeason() : '';
  if (PAGE_SOLO) { // 덮어쓸 내 빌드 고르기 (공유 글 수정 중인 사본은 뺀다)
    const rows = hpBuilds().list.filter(p => !p.shareEdit).sort((a, b) => b.id - a.id).filter(p => !q || (hpBpName(p) + ' ' + hpBpSub(p)).toLowerCase().includes(q)).map(p =>
      `<button type="button" class="hp-bpr" onclick="hpSoloOver(${p.id})"><span class="hp-bp-face">${hpBpFace(p)}</span>` +
      `<span class="hp-bpr-t"><b>${escapeHtml(hpBpName(p))}</b><small>${escapeHtml(hpBpSub(p))}</small></span></button>`).join('');
    return `<div class="hp-bp-list">${rows || (q ? '<div class="hp-bp-none">맞는 빌드가 없습니다</div>' : '')}</div>`;
  }
  // 시즌 칩 (2026-10-13 사용자 요청) — 기본은 지금 시즌만, 지금 빌드는 시즌이 달라도 늘 보인다
  const ses = [...new Set(presets.list.map(hpSeOf))].sort((a, b) => hpSeNum(b) - hpSeNum(a));
  if (!hpBpSe || ![...hpBpSe].some(l => ses.includes(l))) hpBpSe = new Set([ses.includes(cur) ? cur : hpSeOf(preset)]);
  const add = typeof wbNew === 'function' ? '<button type="button" class="hp-bp-add" onclick="wbNew()" title="새 빌드 만들기">＋ 빌드</button>' : ''; // 칩 줄 오른쪽 끝 (2026-10-13 사용자)
  const chips = ses.length > 1 || add ? '<div class="hp-bp-ses">' + (ses.length > 1 ? ses.map(l => `<button type="button" class="share-se-chip${hpBpSe.has(l) ? ' on' : ''}" onclick="hpBpSeToggle('${l}')">${l} <small>${presets.list.filter(p => hpSeOf(p) === l && !p.shareEdit).length}</small></button>`).join('') : '') + add + '</div>' : '';
  const rows = presets.list.slice().sort((a, b) => b.id - a.id).filter(p => !p.shareEdit || p.id === preset.id)
    .filter(p => p.id === preset.id || ses.length < 2 || hpBpSe.has(hpSeOf(p)))
    .filter(p => !q || (hpBpName(p) + ' ' + hpBpSub(p)).toLowerCase().includes(q)).map(p => {
      const on = p.id === preset.id;
      const title = hpBpRenId === p.id
        ? `<input class="hp-bpr-in" maxlength="30" value="${escapeHtml(p.name || '')}" onclick="event.stopPropagation()" onkeydown="event.stopPropagation();if(event.key==='Enter')this.blur();else if(event.key==='Escape'){hpBpRenId=0;hpBpDraw();}" onblur="hpBpRenSave(${p.id},this.value)">`
        : `<b>${escapeHtml(hpBpName(p))}</b>`;
      return `<div class="hp-bpr${on ? ' on' : ''}" role="button" onclick="hpBpPick(${p.id})">` +
        `<span class="hp-bp-face">${hpBpFace(p)}</span><span class="hp-bpr-t">${title}<small>${escapeHtml(hpBpSub(p))}</small></span>` +
        (p.season && cur && p.season !== cur ? `<span class="hp-bpr-se">${escapeHtml(p.season)}</span>` : '') +
        `<span class="hp-bpr-acts"><button type="button" title="이름 바꾸기" onclick="event.stopPropagation();hpBpRen(${p.id})">✎</button>` +
        `<button type="button" class="del" title="삭제" onclick="event.stopPropagation();hpBpDel(${p.id})">✕</button></span>` +
        (on ? '<span class="hp-bpr-ck">✓</span>' : '') + '</div>';
    }).join('');
  return `<div class="hp-bp-body">${chips}<div class="hp-bp-list">${rows || '<div class="hp-bp-none">맞는 빌드가 없습니다</div>'}</div></div>`;
}
function hpBpDraw() {
  const m = document.getElementById('hpBp'); if (!m) return;
  if (m.dataset.init) { const lst = m.querySelector('.hp-bp-list'), st = lst ? lst.scrollTop : 0; m.querySelector('.hp-bp-body').outerHTML = hpBpRows(); const l2 = m.querySelector('.hp-bp-list'); if (l2) l2.scrollTop = st; return; }
  m.dataset.init = '1';
  const n = PAGE_SOLO ? hpBuilds().list.filter(p => !p.shareEdit).length : presets.list.length;
  m.innerHTML = (PAGE_SOLO ? `<div class="hp-bp-cap">${HP_SOLO_WHAT[PAGE_SOLO]}만 바뀝니다 — 덮어쓸 빌드 고르기</div>` : '') + (n > 6 ? '<input class="hp-bp-q" type="search" placeholder="빌드 이름·히어로·스킬 검색" oninput="hpBpQ=this.value;hpBpDraw()"' +
    ' onkeydown="if(event.key===\'Enter\'){const b=document.querySelector(\'#hpBp .hp-bpr\');if(b)b.click();}">' : '') +
    hpBpRows() + (PAGE_SOLO ? '<div class="hp-bp-acts"><button type="button" class="hp-bp-new" onclick="hpSoloOver(0)">＋ 새 빌드로 저장</button></div>' : '') + (typeof hpBuildActs === 'function' ? '<div class="hp-bp-acts">' + hpBuildActs() + '</div>' : '');
}
let hpBpSe = null, hpBpRenId = 0;
const hpSeOf = p => p.season || 'SS13', hpSeNum = l => +String(l).replace(/\D/g, '') || 0;
function hpBpSeToggle(l) { if (hpBpSe.has(l)) { if (hpBpSe.size > 1) hpBpSe.delete(l); } else hpBpSe.add(l); hpBpDraw(); }
function hpBpRen(id) {
  hpBpRenId = id; hpBpDraw();
  const el = document.querySelector('#hpBp .hp-bpr-in'); if (el) { el.focus(); el.select(); }
}
function hpBpRenSave(id, v) {
  if (hpBpRenId !== id) return;
  hpBpRenId = 0;
  const p = presets.list.find(x => x.id === id), nm = String(v || '').trim().slice(0, 30);
  if (p && nm && nm !== p.name) { p.name = nm; persistPreset(); pageRender(); }
  hpBpDraw();
}
function hpBpDel(id) {
  const p = presets.list.find(x => x.id === id); if (!p) return;
  const go = () => {
    presets.list = presets.list.filter(x => x.id !== id);
    if (!presets.list.length) presets.list.push({id: 1, name: '빌드 1', slots: {}, talents: [], skills: {}});
    if (presets.activeId === id || preset.id === id) { // 지금 빌드를 지우면 가장 최근 빌드로
      const nx = presets.list.filter(x => !x.shareEdit).sort((a, b) => b.id - a.id)[0] || presets.list[0];
      presets.activeId = nx.id; hpUse(nx);
    }
    persistPreset(); pageRender(); hpBpDraw();
  };
  const msg = `[${hpBpName(p)}] 빌드를 삭제할까요?`;
  if (typeof uiConfirm === 'function') uiConfirm(msg, go, {title: '빌드 삭제', ok: '삭제'}); else wtAsk(msg, go);
}
function hpBpPick(id) { hpBpClose(); if (id !== preset.id) hpSwitch(id); }
document.addEventListener('mousedown', e => {
  const m = document.getElementById('hpBp');
  if (m && !m.contains(e.target) && !(e.target.closest && e.target.closest('.hp-bp'))) hpBpClose();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('hpBp')) hpBpClose(); });
window.addEventListener('resize', hpBpPlace);
window.addEventListener('scroll', hpBpPlace, true);
function hpUse(p) {
  preset = p;
  if (!Array.isArray(preset.talents)) preset.talents = [];
  if (typeof pageOnSwitch === 'function') pageOnSwitch();
}
function hpSwitch(id) {
  const p = presets.list.find(x => x.id === id);
  if (!p) return;
  presets.activeId = id;
  hpUse(p);
  persistPreset();
  pageRender();
}
// 다른 탭(빌더)에서 바꾸면 따라간다
window.addEventListener('storage', e => {
  if (e.key !== HP_KEY) return;
  presets = hpLoad(); undoLast = JSON.stringify(presets);
  hpUse(presets.list.find(p => p.id === presets.activeId) || presets.list[0]);
  pageRender();
});
// 툴팁 — 빌더의 .tip2 툴팁을 가볍게: data-h(미리 만든 HTML) 또는 title(첫 줄 제목 + 나머지 본문). 마우스를 올리면 표시
const floatTip2 = document.createElement('div');
floatTip2.id = 'floatTip2';
document.body.appendChild(floatTip2);
let tip2Pin = null; // 눌러서 띄운 툴팁 (터치 화면·밑줄 용어) — 다른 데를 누르면 닫는다
document.addEventListener('click', e => {
  const el = e.target.closest && e.target.closest('.tip2');
  const term = el && el.tagName === 'SPAN' && !el.hasAttribute('onclick'); // 문구 속 밑줄 용어
  if (el && (term || matchMedia('(hover: none)').matches)) { tip2Pin = el; tip2Show(el); return; }
  if (tip2Pin) { tip2Pin = null; floatTip2.style.display = 'none'; }
});
document.addEventListener('mouseover', e => {
  const el = e.target.closest && e.target.closest('.tip2');
  if (!el) { if (!tip2Pin) floatTip2.style.display = 'none'; return; }
  tip2Pin = null; tip2Show(el);
});
function tip2Show(el) {
  if (el.getAttribute('title')) { el.dataset.t = el.getAttribute('title'); el.removeAttribute('title'); } // 브라우저 기본 툴팁과 겹치지 않게
  if (el.dataset.h) floatTip2.innerHTML = el.dataset.h;
  else if (el.dataset.t) {
    const ls = el.dataset.t.split('\n');
    floatTip2.innerHTML = `<div class="ft-title">${escapeHtml(ls[0])}</div>` + (ls.length > 1 ? `<div class="ft-body">${ls.slice(1).map(escapeHtml).join('\n')}</div>` : '');
  } else { floatTip2.style.display = 'none'; return; }
  floatTip2.style.display = 'block';
  const r = el.getBoundingClientRect(), w = floatTip2.offsetWidth, h = floatTip2.offsetHeight;
  const x = Math.min(Math.max(8, r.left), innerWidth - w - 8);
  let y = r.bottom + 8;
  if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);
  floatTip2.style.left = x + 'px'; floatTip2.style.top = y + 'px';
}
// 단계 제목 옆 ⓘ — 게임 규칙 설명 (빌더 1 패널 ⓘ 의 규칙 부분을 옮김, 2026-10-09). 화면 조작법은 각 머리줄에
const GBM_HELP = {
  hero: ['히어로 특성', ['왼쪽에서 히어로 → 위에서 특성을 고르면 아래에 노드가 나옵니다 (특성을 고르면 빌드의 히어로가 그 특성으로 바뀝니다)',
    '기본 노드는 늘 보유 — 보통은 단계마다 하나씩, 빈「크리에이티브 지니어스」는 단계마다 위·아래 묶음에서 하나씩, 갈래형은 기본에서 이어진 노드만 (여러 갈래에 나눠 찍기 가능)',
    '단계 레벨은 따라가는 추억의 레벨입니다 — 이미테이션 추억 · 근원 · 자기 수호 · 진격 순',
    '추억 등급이 기본 레벨(절대 3 · 엘리트/레어 2 · 매직/일반 1)이고, 추억의 \'히어로 특성 레벨 +2\' 옵션이 더해집니다',
    '약재가 있는 노드는 분류마다 3종 중 1개를 고릅니다']],
  talent: ['재능 보드', ['1번 칸 = 신 보드, 2번 = 그 신의 하위 보드, 3·4번 = 자유 (3·4번은 끌어서 순서 바꾸기)',
    '열 위 숫자 = 그 열을 여는 데 필요한 왼쪽 포인트 · 노드마다 최대 포인트가 있습니다',
    '핵심 재능: 보드 이름 옆 동그라미 — 신 보드 12·24pt, 하위 보드 24pt에서 하나씩 (모자라도 눌러서 미리 보기)',
    '프리즘·역상: 보드 머리 버튼으로 빌드당 하나씩 — 신 보드엔 못 놓고, 둘은 서로 다른 보드에']],
  skill: ['스킬', ['액티브 5칸 + 패시브 4칸, 칸마다 보조 5칸',
    '액티브 칸에는 모듈화 스킬(모듈: OO)도 넣을 수 있습니다',
    '보조칸: 1번 = 촉발체 + 일반, 3번 = 부귀 + 일반, 5번 = 숭고 + 일반, 2·4번 = 일반']],
  gear: ['장비', ['레전드: 칸을 누르고 목록에서 고르기 (양손 무기는 무기 두 칸)',
    '제작: 부위(베이스) → 기본 2 · 메인 3 · 서브 3 옵션, 절대자·진급 옵션은 각 2개까지',
    '블러드: 빌드당 1개, 무기 칸 제외 — 부위마다 베이스가 정해져 있습니다',
    '조향 = 벨트 전용 1줄 · 시퀀스 = 무기 칸마다 1줄',
    '침식: 옵션 줄을 눌러 강화 (레전드·제작 2개, 블러드 3개)',
    'T0/T1/T2: 제작 옵션 수치를 그 티어 기준으로 표시 (그 티어가 없는 옵션은 T1)']],
  slate: ['석판 시뮬레이터', ['위에서 석판을 고르고 판의 빈 칸을 누르면 놓입니다 (들어가는 방향으로 자동 회전)',
    '놓인 석판을 누르면 회전 · 신격 모양 · 삭제 · 옵션 소켓 — 끌어서 옮기기도 됩니다',
    '레전드 석판은 종류마다 1개, 명왕 석판은 하나만 — 겹치거나 판 밖이면 ⚠',
    '칸에 마우스를 올리면 그 칸의 옵션·복제·전염 같은 파생 효과, 이어진 석판이 함께 강조됩니다',
    '아래 \'적용되는 효과\' = 지금 배치에서 실제로 걸리는 재능 옵션 합계 · 내 빌드와 별개로 이 화면에만 저장']],
  mem: ['추억 · 석판 · 정령', ['추억: 기본 속성 1 · 고유 옵션 2 · 랜덤 옵션 2 — 추억 등급이 히어로 특성 레벨의 기준',
    '부활 옵션: 추억 하나에만 — \'추가 슬롯\' 옵션이면 추가 추억을 하나 더 만듭니다',
    '신격 석판: 판에 놓고 소켓마다 옵션을 고릅니다 (석판 종류별 개수 제한)',
    '전투 정령: 최대 3개, 정령마다 노드 10개 + 미정 숙명 칸 1개',
    '노드 자리에 운명(숙명)을 끼우면 그 노드 대신 운명 효과가 걸리고, 미정 숙명을 끼우면 운명 칸이 최대 5개까지 늘어납니다']],
};
function gbmHelp(key) {
  const h = GBM_HELP[key]; if (!h) return '';
  const html = '<div class="ft-title">' + escapeHtml(h[0]) + '</div><div class="ft-body">' + h[1].map(l => '· ' + escapeHtml(l)).join('<br>') + '</div>';
  return `<span class="gbm-help tip2" data-h="${escapeHtml(html).replace(/"/g, '&quot;')}">ⓘ</span>`;
}
// 연타(더블클릭) 때 글자가 드래그 선택되지 않게 — 재능 노드처럼 여러 번 눌러야 하는 버튼 (2026-10-12)
// 입력칸·본문 글은 그대로 두고, 누르는 요소(버튼·onclick·노드 등)에서만 두 번째 누름부터 선택을 막는다
if (!window._noDblSel) {
  window._noDblSel = true;
  document.addEventListener('mousedown', e => {
    if (e.detail < 2 || !(e.target instanceof Element)) return;
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (e.target.closest('button, a, [onclick], [role="button"], svg, .gb-node, .tn-node, label')) e.preventDefault();
  });
}

// 내가 올린 공유 — 올린 브라우저에만 남기는 목록 (링크 전용 글은 링크를 잊으면 본인도 못 찾아서, 2026-10-13 사용자)
// 링크 전용 글은 서버가 마지막 조회 뒤 UNLISTED_DAYS 일이 지나면 지운다 (tli_api.js purgeUnlisted 와 같은 값)
const MY_SHARES_KEY = 'tli_my_shares_v1', UNLISTED_DAYS = 14;
function mySharesGet() { try { const a = JSON.parse(localStorage.getItem(MY_SHARES_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
function mySharesPut(e) { // {id, title, unl} — 같은 글은 맨 앞으로 옮겨 갱신 (올린 날 at 은 처음 것을 둔다)
  try { const a = mySharesGet(), old = a.find(x => x.id === e.id);
    localStorage.setItem(MY_SHARES_KEY, JSON.stringify([Object.assign({at: (old && old.at) || new Date().toISOString()}, e)].concat(a.filter(x => x.id !== e.id)).slice(0, 50))); } catch (err) {}
}
function mySharesDrop(id) { try { localStorage.setItem(MY_SHARES_KEY, JSON.stringify(mySharesGet().filter(x => x.id !== id))); } catch (e) {} }

// ── 빌더 2 「추억·석판·정령」 화면의 석판 배치 — 기존 빌더 석판 보드 디자인을 바탕으로 크게 (사용자 2026-10-08) ──
// 규칙은 공용 조각(00_slate.js): 모양·회전·겹침/개수 한도·파생 효과·재능 목록 재생성. 저장은 빌더와 같은 preset.slateBd
// [{u: 석판 id, i: 원점 칸(열×10+행), d: 회전 0~3, t: [소켓 노드 id…]}] — 바꿀 때마다 보드 파생 재능 행을 다시 만든다.
// 위: 석판 고르기(모양 미리보기) · 가운데: 보드(칸 클릭 = 놓기·고르기, 끌어서 옮기기) · 오른쪽: 고른 석판(회전·모양·삭제·소켓)
let ALL_DATA = null, SLATEIDX = null; // 석판 옵션 행 — mem_data.js 의 SLATE_DB 로 채운다 (빌더는 장비·옵션 전체 행)
function wsbInit() {
  if (ALL_DATA) return;
  ALL_DATA = SLATE_DB; SLATEIDX = {idx: {}};
  ALL_DATA.forEach((r, i) => (r.nids || []).forEach(n => { SLATEIDX.idx[n] = i; }));
}
let wsbPal = null, wsbSel = null, wsbGod = null, wsbSock = null, wsbQ = '', wsbMsg = '', wsbDrag = null, wsbNoClick = false;
const WSB_GOD_COLORS = SLATE_GOD_COLORS;   // 신격 팔레트 점 색 (00_slate.js 공용)
const WSB_LEGEND = [1003, 1005, 1010, 1001, 1012, 1009, 1011];
// 불완전한 명왕 2종(394001·394002)은 SS14 에서 사라져 팔레트에서 뺐다 (2026-11-04 사용자)
const WSB_NETHER = [394004, 394005, 394006];
const wsbBd = () => preset.slateBd || (preset.slateBd = []);
function wsbApply() { // 빌더 sbApply 와 같음 — 보드 파생 재능 행 재생성 + 저장
  if (preset.slateBd && !preset.slateBd.length) delete preset.slateBd;
  rebuildSlateTalents(preset);
  persistPreset(); pageRender();
}
// 옵션 한 줄 — 핵심 재능은 이름을 굵게 앞에 (slateOptSplit)
function wsbOptHtml(r) { const o = slateOptSplit(r.effect); return (o.name ? `<b class="wsb-onm">${escapeHtml(o.name)}</b>` : '') + wgOptHtml(o.text, r.tips); }
const wsbShort = n => n.replace('명왕의 불완전한 신격: ', '불완전 ').replace('명왕의 신격: ', '명왕 ').replace('의 신격', '');
function wsbMini(u, col) { // 모양 미리보기 (작은 격자)
  const c = (SLATES[u] || {}).c || [[0, 0]];
  const rs = c.map(p => p[0]), cs = c.map(p => p[1]), r0 = Math.min(...rs), c0 = Math.min(...cs);
  const w = Math.max(...cs) - c0 + 1, h = Math.max(...rs) - r0 + 1, on = new Set(c.map(p => (p[0] - r0) + ',' + (p[1] - c0)));
  let g = `<span class="wsb-mini" style="grid-template-columns:repeat(${w},8px)">`;
  for (let r = 0; r < h; r++) for (let x = 0; x < w; x++) g += on.has(r + ',' + x) ? `<i style="background:${col}"></i>` : '<i class="e"></i>';
  return g + '</span>';
}
const wsbColorOf = (u, pi) => slateBaseColor(u, pi);   // 색은 00_slate.js 공용 (석판 종류마다 고정)
function wsbColors(bd) { // 빌더 보드와 같은 규칙 — 같은 색이 여러 장이면 밝기 단계로 구분
  const cnt = new Map();
  return bd.map((s, pi) => {
    const base = wsbColorOf(s.u, pi), n = cnt.get(base) || 0;
    cnt.set(base, n + 1);
    return n === 0 ? base : `color-mix(in srgb, ${base} ${Math.max(35, 100 - n * 28)}%, #f0f6fc)`;
  });
}
function wsbPalPick(u) { wsbPal = wsbPal === u ? null : u; wsbSel = null; wsbSock = null; wsbMsg = ''; pageRender(); }
function wsbGodPick(b) { wsbGod = wsbGod === b ? null : b; wsbPal = null; wsbMsg = ''; pageRender(); }
function wsbCellClick(id) {
  if (guardShareView()) return;
  if (wsbNoClick) { wsbNoClick = false; return; }
  const bd = wsbBd();
  const hit = bd.findIndex(s => (slateCells(s.u, s.i, s.d, s) || [s.i]).indexOf(id) >= 0);
  wsbMsg = '';
  if (wsbPal != null && hit < 0) { // 놓기 — 들어가는 회전을 찾고, 안 맞으면 겹친 채로(⚠ 표시 후 옮기면 됨)
    const err = sbLimitErr(wsbPal);
    if (err) { wsbMsg = err; pageRender(); return; }
    const d = sbFitDir(bd, wsbPal, id, 0, -1);
    bd.push(Object.assign({u: wsbPal, i: id, d: d < 0 ? 0 : d, t: []}, ((SLATES[wsbPal] || {}).copy || {}).a === 'dir' ? {f: 1001} : {})); // 나방은 복제 방향 '위'로 시작 (회전 단추로 바꾼다)
    wsbSel = bd.length - 1; wsbPal = null; wsbSock = null;
    wsbApply(); return;
  }
  if (hit >= 0) { wsbSel = hit === wsbSel ? null : hit; wsbPal = null; wsbSock = null; pageRender(); return; }
  if (wsbSel != null && bd[wsbSel]) { // 고른 석판을 빈 칸으로 — 맞는 회전 우선
    const sl = bd[wsbSel], d = sbFitDir(bd, sl.u, id, sl.d, wsbSel, sl);
    sl.i = id; if (d >= 0) sl.d = d;
    wsbApply();
  }
}
// 나방(한 칸)은 회전해도 모양이 같아 회전 = 복제 방향 돌리기 — 시계 방향 위→오른쪽→아래→왼쪽 (InfluenceId 1001 위·1002 왼쪽·1003 아래·1004 오른쪽, 2026-10-27 사용자: 나방 강조 안 됨 — 방향 값이 없었다)
const WSB_MOTH_NEXT = {1001: 1004, 1004: 1003, 1003: 1002, 1002: 1001};
const wsbIsMoth = sl => ((SLATES[sl.u] || {}).copy || {}).a === 'dir';
function wsbRotate() { const sl = wsbBd()[wsbSel]; if (!sl) return; if (wsbIsMoth(sl)) sl.f = WSB_MOTH_NEXT[sl.f] || 1001; else sl.d = (sl.d + 1) % 4; wsbApply(); }
function wsbShape() { // 신격 모양 변형 순환 (소켓·위치·회전 유지)
  const sl = wsbBd()[wsbSel]; if (!sl) return;
  const base = Math.floor((sl.u - 1) / 100) * 100;
  if (!(base in GOD_BASES)) return;
  const order = GOD_PAL.map(gp => gp[0]);
  const v = sl.u - base > 10 ? sl.u - base - 10 : sl.u - base; // 반전 전용 변형(+10)은 원래 변형 자리에서 다음으로
  sl.u = base + order[(order.indexOf(v) + 1) % order.length];
  wsbApply();
}
// 반전 (2026-10-27 사용자: 회전한 뒤 [좌우 반전]이 상하로 뒤집혀 어색함 → 화면 기준 좌우·상하 두 버튼).
// 지금 화면에 놓인 칸을 제자리(외곽 상자 안)에서 뒤집은 모양을 만든 뒤, 같은 모양이 되는 (변형, 회전, 위치)를 찾는다 —
// 거울상 변형(GOD_MIRROR)이 회전·평행이동까지 다른 번호일 수 있어 공식 대신 탐색으로
function wsbFlip(axis) { // axis 'h' = 좌우 · 'v' = 상하
  const sl = wsbBd()[wsbSel]; if (!sl) return;
  const cur = slateCellsXY(sl.u, sl.i, sl.d, sl); if (!cur) return;
  const k = axis === 'h' ? 0 : 1, lo = Math.min(...cur.map(p => p[k])), hi = Math.max(...cur.map(p => p[k]));
  const want = cur.map(p => { const q = p.slice(); q[k] = lo + hi - p[k]; return q; });
  const norm = cs => { const c0 = Math.min(...cs.map(p => p[0])), r0 = Math.min(...cs.map(p => p[1])); return {c0, r0, key: cs.map(p => (p[0] - c0) + ',' + (p[1] - r0)).sort().join(';')}; };
  const w = norm(want);
  for (const u of [sl.u, GOD_MIRROR[sl.u]].filter(x => x && SLATES[x])) {
    for (let d = 0; d < 4; d++) {
      const c = norm(slateCellsXY(u, 0, d, sl));
      if (c.key !== w.key) continue;
      const col0 = w.c0 - c.c0, row0 = w.r0 - c.r0;
      if (col0 < 0 || row0 < 0 || row0 > 9) continue;
      if (u === sl.u && d === sl.d && col0 * 10 + row0 === sl.i) return; // 대칭 모양 — 뒤집어도 그대로
      sl.u = u; sl.d = d; sl.i = col0 * 10 + row0; wsbApply(); return;
    }
  }
}
// 추방 효과 고르기 (2026-11-04 사용자) — 다시 누르면 해제
function wsbBanish(i) { if (guardShareView()) return; const sl = wsbBd()[wsbSel]; if (!sl) return; sl.b = +sl.b === i ? 0 : i; wsbApply(); }
function wsbDelete() { const bd = wsbBd(); if (!bd[wsbSel]) return; bd.splice(wsbSel, 1); wsbSel = null; wsbSock = null; wsbApply(); }
const wsbPickShow = () => (window.requestAnimationFrame || setTimeout)(() => { ['.wsb-pick', '.wsb-sock.on'].forEach(q => { const el = document.querySelector(q); if (el && el.scrollIntoView) el.scrollIntoView({block: 'nearest'}); }); }); // 고른 소켓과 고르기 창이 둘 다 보이게 // 고르기 창이 화면 밖이면 보이게만(필요할 때만 조금 스크롤)
function wsbSockPick(si) { wsbSock = wsbSock === si ? null : si; wsbQ = ''; pageRender(); wsbPickShow(); }
function wsbSockRows() { // 이 소켓 등급에 맞는 석판 옵션
  const sl = wsbBd()[wsbSel], info = SLATES[sl.u], fix = wsbIsFix(info, wsbSock), ranks = fix ? null : info.sl[wsbSock], q = wsbQ.trim().toLowerCase();
  const h = SLATE_DB.map((r, ri) => { // 석판 행만 (ALL_DATA 는 로그 가져오기 뒤 전체 행 — 석판 행이 앞자리라 ri 는 같다)
    if (!(r.nids && r.nids.length) || !(fix ? wsbFixOk(r) : slateSockOk(info, r, ranks))) return '';
    if (!qHit(q, r.effect, r.type)) return '';
    const on = String((sl.t || [])[wsbSock]) === String(r.nids[0]);
    return `<div class="wg-opt${on ? ' on' : ''}" onclick="wsbAssign(${ri})"><span>${wsbOptHtml(r)}</span><em>${slateSockLabel(info, [slateRank(r)])}</em></div>`;
  }).join('');
  return h || '<div class="hrm-empty">이 등급의 옵션이 없습니다</div>';
}
// 명왕 석판 기본 고정 옵션 (2026-10-22 사용자) — 소켓 칸 수 다음 자리(sl.t[c.length], 로그 BaseTalentList 와 같은 자리).
//   후보 = 명왕 재능 포인트 옵션(90000xxx — 하위·중위·레전드 중위·절대자). '~효과 활성화 시' 낙인(92xxxx)은 소켓 칸 몫이라 뺀다. 전염되지 않는다
const wsbIsFix = (info, si) => !!(info && info.pc && si === info.c.length);
const wsbFixOk = r => r.type === '명왕' && /^9000/.test(String(r.nids[0]));
function wsbSockClear(si) { // 소켓 우클릭 — 그 소켓 옵션 빼기(2026-10-22 사용자)
  if (guardShareView()) return;
  const sl = wsbBd()[wsbSel]; if (!sl || !sl.t || !sl.t[si]) return;
  sl.t[si] = ''; wsbSock = si; wsbQ = '';
  wsbApply();
}
function wsbSockSearch(v) { wsbQ = v; const b = document.getElementById('wsbSockList'); if (b) b.innerHTML = wsbSockRows(); }
function wsbAssign(ri) {
  if (guardShareView()) return;
  const sl = wsbBd()[wsbSel]; sl.t = sl.t || [];
  while (sl.t.length <= wsbSock) sl.t.push('');
  const nid = String(ALL_DATA[ri].nids[0]);
  sl.t[wsbSock] = sl.t[wsbSock] === nid ? '' : nid; // 다시 누르면 빼기
  const nx = SLATES[sl.u].sl.findIndex((_, k) => !sl.t[k]);  // 다음 빈 소켓으로 (기본 고정을 고른 뒤에도 소켓 1번부터)
  wsbSock = nx >= 0 ? nx : null; wsbQ = '';
  wsbApply(); wsbPickShow();
}
// 끌어서 옮기기 (pointer — PC·터치 공용). 빌더의 드래그와 같은 규칙(sbMoveDelta)
document.addEventListener('pointerdown', e => {
  const cell = e.target.closest && e.target.closest('#wsbBoard .wsb-cell.on');
  if (!cell) return;
  wsbDrag = {pi: +cell.dataset.pi, grab: +cell.dataset.cid, moved: false};
});
document.addEventListener('pointermove', e => {
  if (!wsbDrag) return;
  const el = document.elementFromPoint(e.clientX, e.clientY), cell = el && el.closest && el.closest('#wsbBoard .wsb-cell');
  document.querySelectorAll('#wsbBoard .drop-ok, #wsbBoard .drop-bad').forEach(x => x.classList.remove('drop-ok', 'drop-bad'));
  if (!cell || cell.dataset.cid === undefined) return;
  const t = +cell.dataset.cid;
  if (t !== wsbDrag.grab) wsbDrag.moved = true;
  if (!wsbDrag.moved) return;
  const prevSel = preset.slateBd; // sbMoveDelta 는 preset.slateBd 를 본다
  const mv = sbMoveDelta(wsbDrag.pi, wsbDrag.grab, t, true);
  (mv ? mv.cells : [t]).forEach(c => { const x = document.querySelector('#wsbBoard .wsb-cell[data-cid="' + c + '"]'); if (x) x.classList.add(mv && mv.ok ? 'drop-ok' : 'drop-bad'); });
});
document.addEventListener('pointerup', e => {
  if (!wsbDrag) return;
  const dr = wsbDrag; wsbDrag = null;
  if (!dr.moved) return;
  wsbNoClick = true;
  const el = document.elementFromPoint(e.clientX, e.clientY), cell = el && el.closest && el.closest('#wsbBoard .wsb-cell');
  if (cell && cell.dataset.cid !== undefined) {
    const mv = sbMoveDelta(dr.pi, dr.grab, +cell.dataset.cid, true);
    if (mv) { preset.slateBd[dr.pi].i = mv.i; wsbSel = dr.pi; wsbApply(); return; }
  }
  pageRender();
});
let wsbLinks = []; // 피스 → 파생 효과로 연결된 피스 (마우스 올리면 함께 강조 — 빌더와 같음)
let wsbRange = []; // 피스 → 효과가 닿는 칸 id (slateRange)
function wsbBoardHtml() {
  const bd = wsbBd(), cellOf = new Map();
  const colOf = wsbColors(bd);
  const all = slatePieceInfo(bd); // 빌더와 같은 피스 정보·툴팁 (00_slate.js)
  wsbLinks = all.links; wsbRange = slateRange(bd);
  bd.forEach((s, pi) => {
    (slateCellsXY(s.u, s.i, s.d, s) || [[(s.i / 10) | 0, s.i % 10]]).forEach((xy, ci) => {
      const key = xy[0] + ',' + xy[1], out = xy[0] < 1 || xy[0] > 6 || xy[1] < 1 || xy[1] > 6 || !SLATE_ACT.has(xy[1] * 10 + xy[0]);
      const prev = cellOf.get(key);
      if (prev) { prev.conflict = true; return; }
      cellOf.set(key, {pi, ci, out, org: xy[0] === ((s.i / 10) | 0) && xy[1] === s.i % 10});
    });
  });
  const selCells = new Set();
  if (wsbSel != null && bd[wsbSel]) (slateCellsXY(bd[wsbSel].u, bd[wsbSel].i, bd[wsbSel].d, bd[wsbSel]) || []).forEach(xy => selCells.add(xy[0] + ',' + xy[1]));
  let h = '<div class="wsb-board" id="wsbBoard">';
  for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) {
    const id = c * 10 + r, key = c + ',' + r, act = SLATE_ACT.has(id), cd = cellOf.get(key);
    if (!act && !cd) { h += '<span class="wsb-void"></span>'; continue; }
    if (!cd) { h += `<span class="wsb-cell${wsbPal != null ? ' can' : ''}" data-cid="${id}" onclick="wsbCellClick(${id})"></span>`; continue; }
    const p = all.pieces[cd.pi];
    const same = (dx, dy) => (cellOf.get((c + dx) + ',' + (r + dy)) || {}).pi === cd.pi;
    const join = (same(0, -1) ? ' jt' : '') + (same(1, 0) ? ' jr' : '') + (same(0, 1) ? ' jb' : '') + (same(-1, 0) ? ' jl' : '');
    const {tipH} = slateCellTip(bd, p, cd.pi, cd.ci, cd.out);
    h += `<span class="wsb-cell on tip2${cd.conflict ? ' bad' : ''}${cd.out ? ' out' : ''}${p.fx ? ' fx' : ''}${selCells.has(key) ? ' sel' : ''}${join}" data-cid="${id}" data-pi="${cd.pi}" ` +
      `style="--sc:${colOf[cd.pi]}" data-h="${escapeHtml(tipH).replace(/"/g, '&quot;')}" onclick="wsbCellClick(${id})">${cd.org ? '<i class="o"></i>' : ''}</span>`;
  }
  return h + '</div>';
}
// 마우스를 올린 석판 + 파생 효과로 이어진 석판(복제 원본·전염/강화 대상)을 강조, 나머지는 흐리게 (빌더 sbHighlight 와 같음)
function wsbHighlight(pis, sec, rng) {
  sec = sec || new Set(); rng = rng || new Set();
  const on = pis.size > 0;
  document.querySelectorAll('#wsbBoard .wsb-cell').forEach(el => el.classList.toggle('rng', rng.has(+el.dataset.cid)));
  document.querySelectorAll('#wsbBoard .wsb-cell.on').forEach(el => {
    const p = +el.dataset.pi, hit = pis.has(p);
    el.classList.toggle('hl', hit);
    el.classList.toggle('hl2', !hit && sec.has(p));
    el.classList.toggle('dim', on && !hit && !sec.has(p));
  });
}
document.addEventListener('mouseover', e => {
  const cell = e.target.closest && e.target.closest('#wsbBoard .wsb-cell.on, .wsb-li[data-pi]');
  if (cell) { const pi = +cell.dataset.pi; wsbHighlight(new Set([pi]), wsbLinks[pi] || new Set(), wsbRange[pi]); }
});
document.addEventListener('mouseout', e => {
  if (e.target.closest && e.target.closest('#wsbBoard .wsb-cell.on, .wsb-li[data-pi]')) wsbHighlight(new Set());
});
function wsbRender() {
  wsbInit();
  const bd = wsbBd(), cf = new Set(sbConflicts(bd));
  if (wsbSel != null && !bd[wsbSel]) wsbSel = null;
  const tile = (u, label) => {
    const info = SLATES[u] || {}, n = bd.filter(x => x.u === u).length, err = sbLimitErr(u);
    const lim = info.lg ? (bd.some(x => (SLATES[x.u] || {}).lg === info.lg) ? '1/1' : '0/1') : info.limit ? n + '/' + info.limit : '';
    const nc = info.pc ? '1~' + (info.c || []).length + '칸 (옵션 수만큼)' : (info.c || []).length + '칸';
    return `<div class="wsb-tile${wsbPal === u ? ' on' : ''}${err && wsbPal !== u ? ' full' : ''}" onclick="wsbPalPick(${u})" title="${escapeHtml(info.n || '')} (${nc})${err ? ' — ' + escapeHtml(err) : ''}">` +
      wsbMini(u, wsbColorOf(u, WSB_LEGEND.indexOf(u) >= 0 ? WSB_LEGEND.indexOf(u) : 4)) + `<b>${escapeHtml(label || wsbShort(info.n || ''))}</b>${lim ? `<small>${lim}</small>` : ''}</div>`;
  };
  let pal = '<div class="wsb-palrow"><small>레전드</small>' + WSB_LEGEND.map(u => tile(u)).join('') + '</div>' +
    '<div class="wsb-palrow"><small>명왕</small>' + WSB_NETHER.map(u => tile(u)).join('') + '</div>' +
    '<div class="wsb-palrow"><small>신격</small>' + Object.keys(GOD_BASES).map(b => `<span class="ws-tag${wsbGod === +b ? ' on' : ''}" style="--gc:${WSB_GOD_COLORS[b]}" onclick="wsbGodPick(${b})"><i class="wsb-dot" style="background:${WSB_GOD_COLORS[b]}"></i>${escapeHtml(GOD_BASES[b])}</span>`).join('') + '</div>';
  if (wsbGod != null) pal += '<div class="wsb-palrow"><small>모양</small>' + GOD_PAL.map(gp => tile(wsbGod + gp[0], gp[1])).join('') + '</div>';
  // 오른쪽: 고른 석판 / 안내 + 목록
  let side;
  const sl = bd[wsbSel];
  if (sl) {
    const info = SLATES[sl.u] || {}, isGod = (Math.floor((sl.u - 1) / 100) * 100) in GOD_BASES;
    side = `<div class="wg-addbox"><div class="wg-addh"><b>${escapeHtml(info.n || '#' + sl.u)}</b><span>${slateUseN(info, sl)}칸${info.pc ? ' / ' + (info.c || []).length : ''}</span></div>` +
      '<div class="wsb-acts"><button class="wz-btn" onclick="wsbRotate()">' + (wsbIsMoth(sl) ? '↻ 복제 방향: ' + ({1001: '위', 1002: '왼쪽', 1003: '아래', 1004: '오른쪽'}[sl.f] || '없음') : '↻ 회전') + '</button>' + (isGod ? `<button class="wz-btn" onclick="wsbShape()">모양: ${escapeHtml((info.shp || '?').replace(/1$/, ''))}</button>` : '') +
      (isGod && GOD_MIRROR[sl.u] ? '<button class="wz-btn" onclick="wsbFlip(\'h\')" title="보이는 그대로 좌우로 뒤집습니다">⇋ 좌우 반전</button><button class="wz-btn" onclick="wsbFlip(\'v\')" title="보이는 그대로 위아래로 뒤집습니다">⇅ 상하 반전</button>' : '') +
      '<button class="wz-btn" onclick="wsbDelete()">삭제</button></div>' +
      (cf.has(wsbSel) ? '<div class="wsb-warn">⚠ 겹치거나 보드 밖입니다 — 빈 칸을 누르거나 끌어서 옮기세요</div>' : '<div class="wg-addd">빈 칸을 누르면 그 자리로 옮깁니다 (끌어도 됩니다)</div>') + '</div>';
    if (info.banish) { // 추방 — 10가지 효과 중 하나 (인접·비인접 신격의 석판 각 3개 이상일 때 발동)
      const st = banishState(bd, wsbSel);
      side += '<div class="wg-addbox"><div class="wg-addh"><b>추방 효과</b>' +
        `<span class="${st.ok ? 'wsb-ok' : 'wsb-no'}">인접 ${st.adj} · 비인접 ${st.far}</span></div>` +
        '<div class="wsb-acts">' + BANISH_FX.map((f, i) =>
          `<button class="wz-btn${+sl.b === i + 1 ? ' pri' : ''}" onclick="wsbBanish(${i + 1})">${escapeHtml(f.n)}</button>`).join('') + '</div>' +
        (st.fx ? '<div class="wg-addd">' + st.fx.d.map(escapeHtml).join('<br>') + '</div>' : '') +
        '<div class="wg-addd">' + (st.ok ? '✔ 조건 충족 — 효과가 발동합니다.'
          : `인접한 신격의 석판과 인접하지 않은 신격의 석판이 <b>각각 ${BANISH_NEED}개 이상</b>이어야 발동합니다.`) + '</div></div>';
    }
    if (info.sl) {
      const fx = info.c.length, fnid = info.pc ? (sl.t || [])[fx] : null, fri = fnid ? SLATEIDX.idx[fnid] : undefined;
      if (info.pc) { // 명왕: 기본 고정 옵션 칸
        const sock = `<div class="wsb-sock fix${wsbSock === fx ? ' on' : ''}" data-si="${fx}" onclick="wsbSockPick(${fx})"><small>기본 고정 · 명왕 재능 포인트 (전염 안 됨)</small>` +
          `<span>${fri !== undefined ? wsbOptHtml(ALL_DATA[fri]) : fnid ? '노드 ' + escapeHtml(fnid) : '<i>비어 있음 — 눌러서 고르기</i>'}</span></div>`;
        side += `<div class="wg-addbox"><div class="wg-addh"><b>기본 고정 옵션</b><span>${fnid ? 1 : 0} / 1</span></div>` + sock +
          (wsbSock === fx ? `<div class="wsb-pick"><div class="ws-filter"><input type="search" placeholder="옵션 검색" value="${escapeHtml(wsbQ)}" oninput="wsbSockSearch(this.value)"></div><div class="wg-list" id="wsbSockList">${wsbSockRows()}</div></div>` : '') + '</div>';
      }
      side += `<div class="wg-addbox grow"><div class="wg-addh"><b>옵션 소켓</b><span>${(sl.t || []).slice(0, info.sl.length).filter(Boolean).length} / ${info.sl.length}</span></div>` +
        // 명왕 석판은 꽂은 옵션 수만큼만 칸을 차지한다 (2026-11-04 사용자)
        (info.pc ? `<div class="wg-addd">꽂은 옵션 수만큼 칸이 늘어납니다 — 0~1개면 1칸, 2개면 2칸, 3개면 3칸. <b>지금 ${slateUseN(info, sl)}칸</b></div>` : '') +
        // 옵션 고르기 창은 고른 소켓 바로 옆에 — 위쪽 소켓은 아래로, 아래쪽 소켓은 위로 펼친다(2026-10-22 사용자: 창이 너무 아래에 뜸)
        info.sl.map((ranks, si) => {
          const nid = (sl.t || [])[si], ri = nid ? SLATEIDX.idx[nid] : undefined;
          const sock = `<div class="wsb-sock${wsbSock === si ? ' on' : ''}" data-si="${si}" onclick="wsbSockPick(${si})"><small>${si + 1}. ${slateSockLabel(info, ranks)}</small>` +
            `<span>${ri !== undefined ? wsbOptHtml(ALL_DATA[ri]) : '<i>비어 있음 — 눌러서 고르기</i>'}</span></div>`;
          if (wsbSock !== si) return sock;
          const up = info.sl.length > 2 && si >= Math.ceil(info.sl.length / 2);
          const pick = `<div class="wsb-pick${up ? ' up' : ''}"><div class="ws-filter"><input type="search" placeholder="옵션 검색" value="${escapeHtml(wsbQ)}" oninput="wsbSockSearch(this.value)"></div><div class="wg-list" id="wsbSockList">${wsbSockRows()}</div></div>`;
          return up ? pick + sock : sock + pick;
        }).join('') + '</div>';
    } else side += '<div class="wg-addbox"><div class="wg-addd">이 석판은 옵션 소켓이 없습니다 (복제·강화 같은 효과만)</div></div>';
  } else {
    side = '<div class="wg-addbox grow"><div class="wg-addh"><b>놓인 석판</b><span>' + bd.length + '개</span></div>' +
      (bd.length ? bd.map((s, pi) => `<div class="wsb-li${cf.has(pi) ? ' bad' : ''}" data-pi="${pi}" onclick="wsbSel=${pi};wsbPal=null;pageRender()"><i style="background:${wsbColors(bd)[pi]}"></i>${escapeHtml((SLATES[s.u] || {}).n || '#' + s.u)}` +
        `<small>${(s.t || []).filter(Boolean).length ? '옵션 ' + (s.t || []).filter(Boolean).length : ''}${cf.has(pi) ? ' ⚠' : ''}</small></div>`).join('')
        : '<div class="wg-addd">위에서 석판을 고르고 보드의 빈 칸을 누르면 놓입니다.<br>놓인 석판을 누르면 회전·모양·옵션 소켓을 고칩니다.</div>') + '</div>';
  }
  return `<div class="wsb-pal">${pal}</div>` + (wsbMsg ? `<div class="wsb-warn">${escapeHtml(wsbMsg)}</div>` : '') +
    `<div class="wsb-split"><div class="wsb-left">${wsbBoardHtml()}<div class="wsb-hint">${wsbPal != null ? '<b>' + escapeHtml(SLATES[wsbPal].n) + '</b> — 놓을 빈 칸을 누르세요' : '칸에 마우스를 올리면 옵션 · 피스를 끌어서 옮기기'}</div></div><div class="wg-vright">${side}</div></div>`;
}
// 우클릭 — 석판 옵션 소켓·켜진 옵션 줄은 빼기, 석판 화면 안에선 브라우저 메뉴 막기(2026-10-22 사용자).
//   빌더 단계 틀(wgCtx)이 먼저 처리했으면(defaultPrevented) 건너뛴다 — 단독 석판 화면(/tli/slate)용
document.addEventListener('contextmenu', e => {
  if (e.defaultPrevented || !e.target.closest) return;
  const t = e.target;
  if (t.closest('input, textarea, a[href]')) return;
  const sk = t.closest('.wsb-sock[data-si]');
  if (sk) { e.preventDefault(); wsbSockClear(+sk.dataset.si); return; }
  const row = t.closest('#wsbSockList .wg-opt.on');
  if (row) { e.preventDefault(); row.click(); return; }
  if (t.closest('.gbm, .wsb-board, #wzApp, #slateApp')) e.preventDefault();
});

// ── 석판 배치 공유 (2026-11-08 사용자 요청) ────────────────────────────────
// 「작성자 정보도 딱히 필요없고 옵션도 볼 필요 없으니까 중복으로 등록하는것만 막는정도」
//   → 글이 아니라 **배치 목록**이다. 제목·작성자·비밀번호·추천이 없고, 같은 배치는 한 줄로 합쳐진다.
//   한 줄 = {id, code, n}. n = 같은 배치를 올린 사람 수(IP 기준) — 많이 쓰는 배치가 위로 간다.
//
// 칩 거르기 —
//   · 왼쪽 클릭 = 필요 개수 +1, **오른쪽 클릭 = −1** (2026-11-08 사용자). 0 이 되면 해제.
//   · 「N장 이상」이다 — 두 번 누르면 2장 이상 든 배치.
//   · 신격 6종은 모양만 다른 같은 물건이라 「제작 석판」 하나로 묶는다.
//   · 명왕은 판에 하나뿐(sbLimitErr)이라 장수로 나눌 게 없다. 그래서 **칸 수로 나눈다**:
//     심판·인펙션·추방 칩은 3칸으로 쓴 것만, 1칸으로 쓴 것은 종류 구분 없이 「명왕 1칸」 하나로.
//     (규칙 자체는 00_slate.js slateChipOf 에 있다 — 시험도 같은 것을 본다.)
//
// 목록은 통째로 받아 브라우저에서 거른다 — 한 줄이 100바이트 안쪽이라 600줄이어도 60KB 다.
//
// 기대하는 바깥 것: SLATES·SLATE_ACT·slateCellsXY·slateShareCode/slateShareParse/slateChipCount/
//   slatePcCells·sbConflicts·rebuildSlateTalents (00_slate.js) · wsbColors·wsbColorOf·wsbShort·
//   WSB_LEGEND (wz_slate.js) · escapeHtml·hpToast·wtOk·persistPreset (page_common.js)

let sshList = null;       // 서버에서 받은 전체 목록 (null = 아직 안 받음)
let sshAdmin = false;     // 관리 쿠키로 들어왔나 — 삭제 단추는 이때만 (2026-11-08 사용자)
let sshErr = '';
let sshBusy = false;
let sshNeed = {};         // 칩 → 필요 개수 (0·없음 = 안 고름)
let sshPage = 0;
let sshOpenId = null;     // 상세 창에 띄운 배치 — 누른다고 바로 불러오지 않는다 (2026-11-08 사용자)
const SSH_PAGE = 24;

// 칩 줄 — 레전드 7 · 명왕 3(3칸으로 쓴 것만) · 명왕 1칸 · 제작 석판(신격 묶음)
const SSH_CHIPS = [
  {k: '1010', n: '계보'}, {k: '1003', n: '추별'}, {k: '1005', n: '일각'}, {k: '1001', n: '나방'},
  {k: '1012', n: '들불'}, {k: '1009', n: '균열'}, {k: '1011', n: '고향'},
  {k: '394004', n: '명왕 심판'}, {k: '394005', n: '인펙션'}, {k: '394006', n: '추방'},
  {k: SLATE_CHIP_PC1, n: '명왕 1칸'},
  {k: SLATE_CHIP_GOD, n: '제작 석판'},
];
// 칩을 눌러 올릴 수 있는 최대치 — 석판 자체 한도(명왕은 판에 하나뿐이라 1)
function sshMaxOf(k) {
  if (k === SLATE_CHIP_GOD) return 6;
  if (k === SLATE_CHIP_PC1) return 1;
  const info = SLATES[+k] || {};
  return info.lg ? 1 : info.limit || 1;
}
function sshColorOf(k) {
  if (k === SLATE_CHIP_GOD) return '#c9a6ff';
  if (k === SLATE_CHIP_PC1) return '#8b949e';
  return wsbColorOf(+k, WSB_LEGEND.indexOf(+k) >= 0 ? WSB_LEGEND.indexOf(+k) : 4);
}
function sshFullName(k) {
  if (k === SLATE_CHIP_GOD) return '제작 석판 (신격 6종 — 모양만 다른 같은 물건이라 묶었습니다)';
  if (k === SLATE_CHIP_PC1) return '명왕의 신격을 1칸으로 쓴 배치 (종류 구분 없이)';
  const info = SLATES[+k] || {};
  return (info.n || k) + (info.pc ? ' — 3칸으로 쓴 배치만' : '');
}

// 칩 — 왼쪽은 늘리고 오른쪽은 줄인다 (2026-11-08 사용자)
function sshChipBump(k, by) {
  const max = sshMaxOf(k), cur = sshNeed[k] || 0;
  let n = cur + by;
  if (by > 0 && cur >= max) n = 0;   // 한도를 넘겨 누르면 해제 — 한 바퀴 돈다
  if (n <= 0) delete sshNeed[k]; else sshNeed[k] = Math.min(max, n);
  sshPage = 0; pageRender();
}
const sshChipClick = k => sshChipBump(k, 1);
const sshChipDown = k => sshChipBump(k, -1);
function sshChipClear() { sshNeed = {}; sshPage = 0; pageRender(); }

// 한 배치가 칩 조건을 모두 만족하나 — 「그 개수 이상」
function sshHit(cnt) {
  for (const k in sshNeed) if ((cnt[k] || 0) < sshNeed[k]) return false;
  return true;
}
function sshRows() {
  if (!sshList) return [];
  return sshList.map(r => {
    if (!r._bd) { r._bd = slateShareParse(r.code); r._cnt = r._bd ? slateChipCount(r._bd) : {}; }
    return r;
  }).filter(r => r._bd && sshHit(r._cnt));
}

// 작은 보드 그림 — 편집용 보드(wsbBoardHtml)와 달리 손댈 수 없는 그림 한 장
function sshMiniBoard(bd, cls, ids) {
  const cellOf = new Map(), col = wsbColors(bd);
  bd.forEach((s, pi) => (slateCellsXY(s.u, s.i, s.d, s) || []).forEach(xy => {
    if (!cellOf.has(xy[0] + ',' + xy[1])) cellOf.set(xy[0] + ',' + xy[1], pi);
  }));
  let h = '<div class="' + (cls || 'ssh-mini') + '">';
  for (let r = 1; r <= 6; r++) for (let c = 1; c <= 6; c++) {
    const act = SLATE_ACT.has(c * 10 + r), pi = cellOf.get(c + ',' + r);
    // 큰 그림만 칸 번호(data-cid)·피스 번호(data-pi)를 단다 — 마우스 강조가 이걸 보고 움직인다
    const at = ids ? ` data-cid="${c * 10 + r}"` + (pi === undefined ? '' : ` data-pi="${pi}"`) : '';
    if (!act && pi === undefined) { h += `<i class="v"${at}></i>`; continue; }
    h += pi === undefined ? `<i${at}></i>` : `<i class="on" style="background:${col[pi]}"${at}></i>`;
  }
  return h + '</div>';
}
// 어떤 석판이 몇 장 들어갔나 — 명왕은 쓰는 칸 수까지 적는다
//   (칩으로는 3칸·1칸만 갈라지므로 2칸짜리도 눈에는 보이게)
function sshTags(bd) {
  const seen = new Map();
  bd.forEach(s => {
    const info = SLATES[s.u] || {};
    const god = info.god && !info.lg;
    const ck = god ? SLATE_CHIP_GOD : String(s.u);
    const base = god ? '제작 석판' : (SSH_CHIPS.find(c => c.k === ck) || {}).n || wsbShort(info.n || '');
    const pc = slatePcCells(s), key = ck + (pc ? '/' + pc : '');
    if (!seen.has(key)) seen.set(key, {label: base + (pc ? ' ' + pc + '칸' : ''), c: sshColorOf(ck), n: 0});
    seen.get(key).n++;
  });
  return [...seen.values()].map(t =>
    `<span class="ssh-tag" style="--c:${t.c}">${escapeHtml(t.label)}${t.n > 1 ? ' ×' + t.n : ''}</span>`).join('');
}

// ── 상세 보기 ───────────────────────────────────────────────────────────
// 카드를 누르면 바로 불러오던 것을, 「내 빌더 안 지우고 그냥 보기만」(2026-11-08 사용자)
// 하도록 큰 그림 한 장 띄우는 창으로 바꿨다. 불러오기는 이 창 안에서만 한다.
function sshOpen(id) { sshOpenId = id; pageRender(); }
function sshClose() { if (sshOpenId === null) return; sshOpenId = null; pageRender(); }
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  if (e.key === 'Escape') sshClose();
});

// 조각마다 한 줄 — 보드 색과 같은 색 점을 달아 어느 칸이 무엇인지 눈으로 잇는다
//   (ssh-tag 는 같은 석판을 ×N 으로 합치므로 밝기로 갈라 둔 색과 1:1 이 아니다)
function sshPieceList(bd) {
  const col = wsbColors(bd);
  return '<ul class="ssh-plist">' + bd.map((s, pi) => {
    const info = SLATES[s.u] || {}, pc = slatePcCells(s), n = (sshFx[pi] || {size: 0}).size;
    return `<li data-pi="${pi}"><i style="background:${col[pi]}"></i>${escapeHtml(info.n || String(s.u))}` +
      (pc ? `<em>${pc}칸</em>` : '') +
      (sshAim.has(pi) ? '<em class="g" title="올린 사람이 정한 방향이 빈 칸을 가리켜, 이웃 석판 쪽으로 돌려 보여 줍니다 (불러올 땐 원래대로)">방향 추정</em>' : '') +
      (n ? `<b title="효과가 닿는 석판 ${n}장">↗${n}</b>` : '') + '</li>';
  }).join('') + '</ul>';
}

// 마우스를 올린 석판 강조 — 빌더·시뮬레이터의 wsbHighlight 와 같은 모양(hl / hl2 / dim / rng)
//   범위(slateRange)는 **옵션 없이 자리만으로** 난다 — 들불·고향은 상하좌우, 나방은 정한 한 방향,
//   균열은 좌우, 인펙션은 변을 맞댄 칸, 심판은 돌 사이 영역. 공유 배치엔 옵션이 없지만 범위는 그대로다.
let sshRng = [];   // 피스 → 효과가 닿는 칸 id
let sshFx = [];    // 피스 → 그 범위에 걸친 다른 피스
let sshAim = new Set();  // 방향을 우리가 짐작한 나방 피스
// 나방 방향 겨누기 (2026-11-08 사용자: 「인접한 석판이 있는 방향으로 대충 잡아줄래?」)
//   올린 사람이 정한 방향이 빈 칸을 가리키면(또는 옛 코드라 방향이 없으면) 이웃 석판 쪽으로 돌려 본다.
//   **보여 줄 때만** 돌린다 — 공유 코드·불러오기는 올린 그대로다.
//   복제 석판끼리는 복제할 옵션이 없으니(slateDerived) 복제 아닌 이웃을 먼저 고른다.
const SSH_MOTH_D = [-1, -10, 1, 10];   // 1001 위 · 1002 왼쪽 · 1003 아래 · 1004 오른쪽
function sshAimMoths(bd) {
  const occ = new Map();
  bd.forEach((s, pi) => (slateCellsXY(s.u, s.i, s.d, s) || []).forEach(xy => occ.set(xy[0] * 10 + xy[1], pi)));
  const other = (c, pi) => { const n = occ.get(c); return n === undefined || n === pi ? -1 : n; };
  sshAim = new Set();
  return bd.map((s, pi) => {
    if (!slateIsMothLike(SLATES[s.u] || {})) return s;
    const di = (s.f || 0) - 1001;
    if (di >= 0 && di <= 3 && other(s.i + SSH_MOTH_D[di], pi) >= 0) return s;   // 이미 이웃을 보고 있다
    const pick = want => SSH_MOTH_D.findIndex(d => {
      const n = other(s.i + d, pi);
      return n >= 0 && (!want || !(SLATES[bd[n].u] || {}).copy);
    });
    let k = pick(1); if (k < 0) k = pick(0);
    if (k < 0) return s;                                                        // 사방이 비었다 — 그냥 둔다
    sshAim.add(pi);
    return Object.assign({}, s, {f: 1001 + k});
  });
}
function sshCalcFx(bd0) {
  const bd = sshAimMoths(bd0);
  sshRng = slateRange(bd);
  const cellsOf = bd.map(s => (slateCellsXY(s.u, s.i, s.d, s) || []).map(xy => xy[0] * 10 + xy[1]));
  sshFx = bd.map((_, pi) => new Set(bd.map((_, ni) => ni)
    .filter(ni => ni !== pi && cellsOf[ni].some(c => sshRng[pi].has(c)))));
}
function sshHighlight(pi) {
  const root = typeof document === 'undefined' ? null : document.querySelector('.ssh-modal');
  if (!root) return;
  const on = pi >= 0, rng = (on && sshRng[pi]) || new Set(), sec = (on && sshFx[pi]) || new Set();
  root.querySelectorAll('.ssh-big i').forEach(el => {
    const p = el.dataset.pi === undefined ? -1 : +el.dataset.pi;
    el.classList.toggle('rng', rng.has(+el.dataset.cid));
    el.classList.toggle('hl', on && p === pi);
    el.classList.toggle('hl2', on && p >= 0 && p !== pi && sec.has(p));
    el.classList.toggle('dim', on && p >= 0 && p !== pi && !sec.has(p));
  });
  root.querySelectorAll('.ssh-plist li').forEach(el => {
    const p = +el.dataset.pi;
    el.classList.toggle('hl', on && p === pi);
    el.classList.toggle('hl2', on && p !== pi && sec.has(p));
    el.classList.toggle('dim', on && p !== pi && !sec.has(p));
  });
}
if (typeof document !== 'undefined') document.addEventListener('mouseover', e => {
  if (sshOpenId === null || !e.target.closest) return;
  const t = e.target.closest('.ssh-modal [data-pi]');
  sshHighlight(t ? +t.dataset.pi : -1);
});

function sshDetail() {
  const row = (sshList || []).find(x => x.id === sshOpenId);
  if (!row || !row._bd) return '';
  const grew = row._bd.some(s => s.pcN > 1);
  sshCalcFx(row._bd);
  return '<div class="ssh-dim" onclick="sshClose()"></div>' +
    '<div class="ssh-modal" role="dialog" aria-label="석판 배치 상세">' +
    '<div class="ssh-mtop"><b>석판 배치</b>' +
    `<span>석판 ${row._bd.length}장${row.n > 1 ? ' · 👥 ' + row.n + '명' : ''}</span>` +
    (sshAdmin ? `<button type="button" class="wz-btn" onclick="sshDelete('${row.id}')">✕ 삭제</button>` : '') +
    '<button type="button" class="ssh-x" onclick="sshClose()" title="닫기 (Esc)">✕</button></div>' +
    '<div class="ssh-mbody">' + sshMiniBoard(row._bd, 'ssh-big', 1) +
    `<div class="ssh-mside"><div class="ssh-tags">${sshTags(row._bd)}</div>${sshPieceList(row._bd)}</div></div>` +
    '<div class="ssh-mfoot">' +
    `<small>석판에 마우스를 올리면 <b class="ssh-lg-r">효과가 닿는 칸</b>이 점선으로, <b class="ssh-lg-h">닿는 석판</b>이 함께 밝아집니다.` +
    (grew ? ' 명왕은 옵션을 꽂아야 칸이 다시 늘어납니다.' : ' 불러오기 전까지 시뮬레이터는 그대로입니다.') + '</small>' +
    `<button type="button" class="wz-btn pri" onclick="sshTake('${row.id}')">🧩 시뮬레이터로 불러오기</button></div></div>`;
}

async function sshLoad(fresh) {
  if (sshBusy) return;
  sshBusy = true; sshErr = ''; pageRender();
  try {
    const r = await fetch('/api/slshares' + (fresh ? '?fresh=1' : ''), {headers: {accept: 'application/json'}});
    const j = await r.json();
    if (!j || !j.ok) throw new Error((j && j.error) || '목록을 받지 못했습니다.');
    sshList = j.list || [];
    sshAdmin = !!j.admin;   // 서버가 관리 쿠키를 확인해 준 것만 믿는다 — 단추는 편의일 뿐 빗장은 서버에 있다
  } catch (e) {
    sshErr = (e && e.message) || '목록을 받지 못했습니다.';
  }
  sshBusy = false; pageRender();
}

async function sshUpload() {
  const bd = preset.slateBd || [];
  if (!bd.length) { hpToast('먼저 석판 시뮬레이터에서 배치를 짜 주세요.'); return; }
  if (sbConflicts(bd).length) { hpToast('겹치거나 보드 밖에 있는 석판이 있습니다. 고친 뒤 올려 주세요.'); return; }
  if (sshBusy) return;
  sshBusy = true; pageRender();
  try {
    const r = await fetch('/api/slshare', {method: 'POST', headers: {'content-type': 'application/json'},
      body: JSON.stringify({code: slateShareCode(bd)})});
    const j = await r.json();
    if (!j || !j.ok) throw new Error((j && j.error) || '올리지 못했습니다.');
    hpToast(j.dup ? '이미 올라와 있는 배치입니다 — 쓰는 사람 수에 더했습니다.' : '올렸습니다.');
    sshBusy = false; sshList = null; await sshLoad(true);
    return;
  } catch (e) {
    hpToast((e && e.message) || '올리지 못했습니다.');
  }
  sshBusy = false; pageRender();
}

// 삭제 — 관리자만 보이고, 진짜 빗장은 서버(관리 쿠키 + 같은 출처)에 있다
async function sshDelete(id) {
  if (!sshAdmin || sshBusy) return;
  if (!wtOk('이 배치를 목록에서 지울까요? 되돌릴 수 없습니다.', () => sshDelete(id))) return;
  sshBusy = true; pageRender();
  try {
    const r = await fetch('/api/slshare/delete', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({id})});
    const j = await r.json();
    if (!j || !j.ok) throw new Error((j && j.error) || '지우지 못했습니다.');
    sshList = (sshList || []).filter(x => x.id !== id);
    if (sshOpenId === id) sshOpenId = null;
    hpToast('지웠습니다.');
  } catch (e) {
    hpToast((e && e.message) || '지우지 못했습니다.');
  }
  sshBusy = false; pageRender();
}

// 이 배치를 석판 시뮬레이터의 연습판으로 — 지금 배치는 지워지므로 물어본다
function sshTake(id) {
  const row = (sshList || []).find(x => x.id === id);
  if (!row || !row._bd) return;
  if ((preset.slateBd || []).length && !wtOk('석판 시뮬레이터의 지금 배치를 지우고 이 배치를 불러올까요?', () => sshTake(id))) return;
  // pcN(명왕이 쓰던 칸 수)은 저장하지 않는다 — 소켓을 꽂으면 칸이 다시 늘어난다(slateUseN)
  const grew = row._bd.some(s => s.pcN > 1);
  sshCalcFx(row._bd);
  preset.slateBd = row._bd.map(s => Object.assign({u: s.u, i: s.i, d: s.d, t: []}, s.f ? {f: s.f} : null));
  rebuildSlateTalents(preset); persistPreset();
  hpToast('석판 시뮬레이터로 불러왔습니다' + (grew ? ' — 명왕은 옵션을 꽂으면 칸이 다시 늘어납니다.' : '.'));
  sshGo('/tli/slate/');
}
function sshGo(u) { location.href = u; }   // 시험에서 갈아끼우려고 따로 뺐다 (jsdom 은 이동을 못 한다)

function sshChipRow() {
  const sel = Object.keys(sshNeed).length;
  return '<div class="ssh-chips">' + SSH_CHIPS.map(c => {
    const n = sshNeed[c.k] || 0, max = sshMaxOf(c.k);
    const tip = sshFullName(c.k) + (max > 1 ? ' · 왼쪽 클릭 늘리기 / 오른쪽 클릭 줄이기' : '');
    return `<button type="button" class="ssh-chip${n ? ' on' : ''}" style="--c:${sshColorOf(c.k)}" ` +
      `onclick="sshChipClick('${c.k}')" oncontextmenu="sshChipDown('${c.k}');return false;" title="${escapeHtml(tip)}">` +
      `${escapeHtml(c.n)}${n > 1 ? `<b>${n}</b>` : n ? '<b>✓</b>' : ''}</button>`;
  }).join('') + (sel ? '<button type="button" class="ssh-chip clr" onclick="sshChipClear()">✕ 조건 지우기</button>' : '') + '</div>';
}

function sshRender(myBd) {
  if (sshList === null && !sshBusy && !sshErr) sshLoad();
  const rows = sshRows(), sel = Object.keys(sshNeed);
  const cond = sel.length ? sel.map(k => {
    const nm = (SSH_CHIPS.find(c => c.k === k) || {n: k}).n;
    return sshMaxOf(k) > 1 ? nm + ' ' + sshNeed[k] + '장 이상' : nm;
  }).join(' · ') : '';
  const mine = (myBd || []).length;
  let body;
  if (sshBusy && sshList === null) body = '<div class="ssh-empty">불러오는 중…</div>';
  else if (sshErr) body = `<div class="ssh-empty">${escapeHtml(sshErr)}<br><button type="button" class="wz-btn" onclick="sshLoad(1)">다시 시도</button></div>`;
  else if (!sshList.length) body = '<div class="ssh-empty">아직 올라온 배치가 없습니다.<br><a href="/tli/slate/">석판 시뮬레이터</a>에서 배치를 짠 뒤 <b>[지금 배치 올리기]</b>를 눌러 주세요.</div>';
  else if (!rows.length) body = `<div class="ssh-empty">조건(${escapeHtml(cond)})에 맞는 배치가 없습니다.<br><button type="button" class="wz-btn" onclick="sshChipClear()">조건 지우기</button></div>`;
  else {
    const page = rows.slice(0, (sshPage + 1) * SSH_PAGE);
    body = '<div class="ssh-grid">' + page.map(r =>
      `<div class="ssh-card" onclick="sshOpen('${r.id}')" title="누르면 크게 봅니다">` +
      sshMiniBoard(r._bd) +
      (sshAdmin ? `<button type="button" class="ssh-del" onclick="event.stopPropagation();sshDelete('${r.id}')" title="이 배치를 지웁니다 (관리자)">✕</button>` : '') +
      `<div class="ssh-cbody"><div class="ssh-tags">${sshTags(r._bd)}</div>` +
      `<div class="ssh-meta"><span>석판 ${r._bd.length}장</span><em>${r.n > 1 ? '👥 ' + r.n : ''}</em></div></div></div>`).join('') + '</div>' +
      (page.length < rows.length ? `<div class="ssh-more"><button type="button" class="wz-btn" onclick="sshPage++;pageRender()">더 보기 (${rows.length - page.length}개 남음)</button></div>` : '');
  }
  return '<div class="ssh-wrap">' + sshChipRow() +
    `<div class="ssh-bar"><span>${sshList ? rows.length + ' / ' + sshList.length + '개' : ''}${cond ? ' · ' + escapeHtml(cond) : ''}</span>` +
    `<button type="button" class="wz-btn pri" onclick="sshUpload()"${sshBusy || !mine ? ' disabled' : ''} ` +
    `title="${mine ? '석판 시뮬레이터에 짜 둔 배치를 올립니다' : '석판 시뮬레이터에 짜 둔 배치가 없습니다'}">⬆ 지금 배치 올리기${mine ? ' (' + mine + '장)' : ''}</button>` +
    `<button type="button" class="wz-btn" onclick="sshLoad(1)"${sshBusy ? ' disabled' : ''}>새로고침</button></div>` +
    body + (sshOpenId !== null ? sshDetail() : '') + '</div>';
}

// ── /tli/slates 단독 화면 — 석판 배치 공유 (2026-11-08 사용자: 「빌드 공유에 석판 배치 메뉴 하나 추가」) ──
// 처음엔 석판 시뮬레이터 안의 탭이었는데, 공유는 공유끼리 모이는 게 낫다는 사용자 판단으로 떼어 냈다.
// 저장소는 석판 시뮬레이터와 **같은 연습판**(page_common.js PAGE_SOLO, #slateApp → tli_solo_slate_v1) —
// 그래서 여기서 「불러오기」를 누르면 /tli/slate 가 그 배치를 그대로 들고 뜬다.
const wgOptHtml = (text, tips) => hlNums(tipWrapEffect(text, tips)); // wz_slate.js 가 쓴다 (옵션 화면은 안 싣는다)
function pageRender() {
  wsbInit();
  const bd = preset.slateBd || [];
  document.getElementById('slateApp').innerHTML = '<div class="gbm wsp"><div class="gbm-top">' +
    '<b class="gbm-title">석판 배치 공유</b>' +
    '<a class="ssh-go" href="/tli/slate/">🧩 석판 시뮬레이터</a>' +
    `<span class="gbm-keys">칩을 <kbd>왼쪽</kbd> 눌러 늘리고 <kbd>오른쪽</kbd> 눌러 줄입니다 <span class="gbm-sep">·</span> 배치를 누르면 크게 보기</span>` +
    '</div>' + sshRender(bd) + '</div>';
}
function pageOnSwitch() {}
pageRender();
