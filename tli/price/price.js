// 생성물 — 고칠 땐 update/src/price_page.js (build_html2.build_tool_pages)
// 소비 아이템 시세 (/tli/price, 2026-10-20 사용자 요청) — 시즌 초반 1·2·3·4·7·14일차 시세 + 구간별 변동률 순위
// 데이터: CONSUM {cats, items:[{id, name, cat, q, icon, page, desc}]} (build_consum.py, tlidb Inventory 분류 29개)
//         CPRICE {seasons:[{id, label, start}], items:{id:{시즌:{일차:[평균, 최저, 최고]}}}} (etor_prices.py --consum, 단위 결정)
// 규칙: 가장 비쌀 때도 3결 이하인 아이템은 뺀다(사용자 2026-10-20 — 싼 건 몇 %가 움직여도 의미 없음)
const PR_DAYS = Array.from({length: 14}, (_, i) => i + 1);  // 1~14일차 매일 (사용자 2026-10-20)
const PR_IVS = PR_DAYS.slice(0, -1).map(d => [d, d + 1]).concat([[1, 7], [7, 14], [1, 14]]);
const PR_MIN = 3;    // 결정
const PR_TOP = 10;
const PR_NOTE = '이 시세는 중국 트래커 易火 ETor 의 시세 서버에서 수집했습니다.\nETor 측의 허가를 받지 않고 가져온 자료라, 문제가 된다면 디스코드 win.terer 로 연락 주시면 바로 내리겠습니다.\n\n단위: 최초의 불꽃 결정. 일차는 시즌 시작일 기준입니다.';
const PR = {se: '', iv: '1-2', cat: '', q: '', sort: 'pct', mode: 'list', bd: 1, admin: false, nohot: false, wide: false};
const PR_BUY_DAYS = PR_DAYS.slice(0, -1);  // 1~13일차에 사서 다음 날 팔기
const PR_BUY_TOP = 20, PR_BUY_MIN = 2;  // 추천은 2개 시즌 이상 기록이 있는 것만
const PR_SPREAD = [60, 1.5];  // 시즌별 차이 큼 = (가장 높은 시즌 − 가장 낮은 시즌) > max(60%p, 중앙값 × 1.5) — 기본으로 뺀다 (사용자 2026-10-20)
const PR_RECENT_W = [1, 0.6, 0.35, 0.2], PR_CLIP = 300, PR_WEAK = 0.3;  // 최근 시즌 가중치·튀는 값 자르기·'최근 시즌 약함' 기준
const PR_GAP = 30;  // 이번 시즌 누적 상승률이 지난 시즌 같은 기간보다 30%p 넘게 높으면 '이미 더 오름', 낮으면 '덜 오름'
const prEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const prNum = v => v >= 100 ? Math.round(v).toLocaleString('ko-KR') : v >= 10 ? (Math.round(v * 10) / 10) : (Math.round(v * 100) / 100);
const prPct = (a, b) => (b - a) / a * 100;
const prPctTxt = p => (p > 0 ? '+' : '') + (Math.abs(p) >= 100 ? Math.round(p) : Math.round(p * 10) / 10) + '%';
const prIv = () => PR.iv.split('-').map(Number);

// 시즌 순서 = 표기의 숫자(SS14 → SS11) — id 는 ETor('1601')·TTD('s12') 가 섞인다
function prSeasons() { const n = s => +String(s.label).replace(/\D/g, '') || 0; return (CPRICE.seasons || []).slice().sort((a, b) => n(b) - n(a)); }
function prDays(id) { return (CPRICE.items[id] || {})[PR.se] || null; }
// 이 시즌에 시세가 있고, 가장 비쌀 때 3결을 넘는 아이템
function prPool() {
  const all = CONSUM.items.filter(it => prDays(it.id));
  const ok = all.filter(it => Math.max(...Object.values(prDays(it.id)).map(v => v[0])) > PR_MIN);
  return {ok, cheap: all.length - ok.length, none: CONSUM.items.length - all.length};
}
function prHasDay(pool, d) { return pool.some(it => prDays(it.id)[d]); }
function prChange(it, [a, b]) {
  const d = prDays(it.id), x = d && d[a], y = d && d[b];
  return x && y && x[0] > 0 ? prPct(x[0], y[0]) : null;
}

function prInit() {
  const q = new URLSearchParams(location.search), ses = prSeasons();
  PR.se = ses.some(s => s.id === q.get('se')) ? q.get('se') : (ses.find(s => s.label === 'SS13') || ses[0] || {}).id || '';
  if (PR_IVS.some(v => v.join('-') === q.get('iv'))) PR.iv = q.get('iv');
  if (CONSUM.cats.includes(q.get('cat'))) PR.cat = q.get('cat');
  prRender();
  prLoadOld();
}
// SS11·SS12 (TTD 디아블로 기록) — 관리자만 (사용자 2026-10-20). 서버가 관리 쿠키를 보고 내주고, 아니면 404 라 조용히 지나간다
async function prLoadOld() {
  try {
    const r = await fetch('/tli/price/old_prices.json', {credentials: 'same-origin', cache: 'no-store'});
    if (!r.ok) return;
    const o = await r.json();
    (o.seasons || []).forEach(x => { if (!CPRICE.seasons.some(y => y.id === x.id)) CPRICE.seasons.push(Object.assign({lock: true}, x)); });
    Object.entries(o.items || {}).forEach(([id, v]) => { CPRICE.items[id] = Object.assign(CPRICE.items[id] || {}, v); });
    const sp = new URLSearchParams(location.search), q = sp.get('se');
    if (q && (o.seasons || []).some(x => x.id === q)) PR.se = q;
    PR.admin = true;
    if (sp.get('mode') === 'buy') PR.mode = 'buy';
    // 구매일 = 주소에 있으면 그것, 없으면 이번 시즌 오늘 일차 (사용자 2026-10-20) — 13일차를 넘었으면 13일차
    const td = prToday();
    PR.bd = PR_BUY_DAYS.includes(+sp.get('bd')) ? +sp.get('bd') : td ? Math.min(Math.max(td, 1), 13) : 1;
    prRender();
  } catch (e) {}
}
function prSet(k, v) {
  PR[k] = v;
  const q = new URLSearchParams();
  if (PR.mode === 'buy') { q.set('mode', 'buy'); if (PR.bd !== 1) q.set('bd', PR.bd); }
  else { if (PR.se) q.set('se', PR.se); if (PR.iv !== '1-2') q.set('iv', PR.iv); }
  if (PR.cat) q.set('cat', PR.cat);
  history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  if (k === 'iv') window.wtEv && wtEv('price_iv', {tab: v});
  if (k === 'mode') window.scrollTo(0, 0);
  prRender(k === 'q' && PR.mode === 'list');
}

function prRender(onlyTable) {
  const app = document.getElementById('priceApp'), ses = prSeasons();
  if (!ses.length) { app.innerHTML = prTopHtml(null) + prEmptyHtml(); return; }
  if (PR.mode === 'buy' && PR.admin) {
    app.innerHTML = prTabsHtml() + prBuyHtml();
    const on = app.querySelector('.pb-day.on'), bar = app.querySelector('.pb-days');  // 휴대폰: 고른 날이 보이게 일차 줄만 옆으로
    if (on && bar && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2;
    return;
  }
  const pool = prPool();
  // 고른 구간에 값이 없으면(진행 중인 시즌 등) 값이 있는 첫 구간으로
  if (!PR_IVS.some(v => v.join('-') === PR.iv && prHasDay(pool.ok, v[0]) && prHasDay(pool.ok, v[1]))) {
    const f = PR_IVS.find(v => prHasDay(pool.ok, v[0]) && prHasDay(pool.ok, v[1])); if (f) PR.iv = f.join('-');
  }
  const inCat = pool.ok.filter(it => !PR.cat || it.cat === PR.cat);
  if (onlyTable) { document.getElementById('prTable').innerHTML = prTableHtml(inCat, pool); return; }
  app.innerHTML = prTabsHtml() + prTopHtml(pool) + prIvHtml(pool.ok) + prCatHtml(pool.ok) + prRankHtml(inCat) +
    `<div class="pr-sec"><div class="pr-sech"><b>전체 시세</b><input class="pr-q" placeholder="아이템 이름 검색" value="${prEsc(PR.q)}" oninput="prSet('q', this.value)">` +
    `<select class="pr-sort" onchange="prSet('sort', this.value)">${[['pct', '변동률순'], ['price', '가격순'], ['name', '이름순']].map(([k, t]) => `<option value="${k}"${PR.sort === k ? ' selected' : ''}>${t}</option>`).join('')}</select></div>` +
    `<div id="prTable">${prTableHtml(inCat, pool)}</div></div>`;
}
function prTopHtml(pool) {
  const ses = prSeasons(), s = ses.find(x => x.id === PR.se);
  const start = s && s.start ? new Date(s.start).toLocaleDateString('ko-KR', {timeZone: 'Asia/Seoul', month: 'long', day: 'numeric'}) : '';
  return `<div class="pr-top"><div class="pr-ttl"><b>소비 아이템 시세</b><small>시즌 초반 일차별 시세 · 변동률 순위</small></div>` +
    (ses.length > 1 ? `<div class="pr-ses">${ses.map(x => `<button type="button" class="pr-chip${x.id === PR.se ? ' on' : ''}${x.lock ? ' lock' : ''}" onclick="prSet('se','${x.id}')"${x.lock ? ' title="관리자에게만 보이는 시즌 (TTD 디아블로 기록)"' : ''}>${prEsc(x.label)}${x.lock ? ' 🔒' : ''}</button>`).join('')}</div>` : '') +
    `<div class="pr-meta">${s ? `${prEsc(s.label)} 1일차 = ${start}` : ''}${s && s.src === 'TTD' ? ' · <b class="pr-src" title="ETor 에 기록이 없는 시즌이라 TTD 디아블로(ttdiablo.com) 기록을 씁니다. 같은 결정 단위이고, SS13 을 비교하면 ETor 보다 4%쯤 낮게 나옵니다.">TTD 디아블로 기록 · 관리자만</b>' : ''}${pool ? ` · 시세 ${pool.ok.length}개 · <span title="가장 비쌀 때도 ${PR_MIN}결정 이하">${PR_MIN}결 이하 ${pool.cheap}개 제외</span>` : ''}</div>` +
    `<details class="pr-note"><summary title="${prEsc(PR_NOTE)}">ⓘ 시세 출처</summary><div>${prEsc(PR_NOTE).replace(/\n/g, '<br>')}</div></details></div>`;
}
function prEmptyHtml() {
  return `<div class="pr-empty"><b>아직 시세를 받지 못했습니다</b><p>시세를 가져오는 ETor 서버가 지금 응답하지 않습니다. 서버가 돌아오는 대로 받아서 채우겠습니다.</p>` +
    `<div class="pr-cats">${CONSUM.cats.map(c => `<span class="pr-chip">${prEsc(c)} <small>${CONSUM.items.filter(x => x.cat === c).length}</small></span>`).join('')}</div></div>`;
}
function prIvHtml(ok) {
  return `<div class="pr-ivs" role="tablist">` + PR_IVS.map(v => {
    const k = v.join('-'), has = prHasDay(ok, v[0]) && prHasDay(ok, v[1]);
    return `<button type="button" class="pr-iv${PR.iv === k ? ' on' : ''}"${has ? ` onclick="prSet('iv','${k}')"` : ' disabled title="아직 그 일차 시세가 없습니다"'}>${v[0]}일차 → ${v[1]}일차${k === '1-14' ? ' <small>2주</small>' : k === '1-7' ? ' <small>첫 주</small>' : k === '7-14' ? ' <small>둘째 주</small>' : ''}</button>`;
  }).join('') + '</div>';
}
function prCatHtml(ok) {
  const n = c => ok.filter(x => x.cat === c).length;
  return `<div class="pr-cats"><button type="button" class="pr-chip${!PR.cat ? ' on' : ''}" onclick="prSet('cat','')">전체 <small>${ok.length}</small></button>` +
    CONSUM.cats.filter(n).map(c => `<button type="button" class="pr-chip${PR.cat === c ? ' on' : ''}" onclick="prSet('cat','${prEsc(c)}')">${prEsc(c)} <small>${n(c)}</small></button>`).join('') + '</div>';
}
function prItemHead(it) {
  return `<img src="${prEsc(it.icon)}" alt="" loading="lazy" class="q${it.q}" onerror="this.style.visibility='hidden'"><span class="pr-in"><b>${prEsc(it.name)}</b><small>${prEsc(it.cat)}</small></span>`;
}
function prRankHtml(list) {
  const iv = prIv(), rows = list.map(it => [it, prChange(it, iv)]).filter(x => x[1] != null);
  const up = rows.filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, PR_TOP);
  const dn = rows.filter(x => x[1] < 0).sort((a, b) => a[1] - b[1]).slice(0, PR_TOP);
  const li = ([it, p], i) => {
    const d = prDays(it.id);
    return `<li class="pr-r"><span class="pr-rk">${i + 1}</span>${prItemHead(it)}<span class="pr-rv"><em>${prNum(d[iv[0]][0])} → ${prNum(d[iv[1]][0])}</em><b class="${p > 0 ? 'up' : 'dn'}">${prPctTxt(p)}</b></span></li>`;
  };
  const col = (t, cls, xs) => `<div class="pr-rcol ${cls}"><div class="pr-rh">${t}</div>${xs.length ? '<ol>' + xs.map(li).join('') + '</ol>' : '<p class="pr-none">해당 아이템이 없습니다</p>'}</div>`;
  return `<div class="pr-rank">${col('▲ 가장 많이 오른 아이템', 'up', up)}${col('▼ 가장 많이 내린 아이템', 'dn', dn)}</div>`;
}
function prTableHtml(list, pool) {
  const iv = prIv(), q = PR.q.trim().toLowerCase();
  const days = PR_DAYS.filter(d => prHasDay(pool.ok, d));
  let xs = list.filter(it => !q || it.name.toLowerCase().includes(q));
  const last = it => { const d = prDays(it.id); return (d[days.filter(x => d[x]).pop()] || [0])[0]; };
  if (PR.sort === 'name') xs.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  else if (PR.sort === 'price') xs.sort((a, b) => last(b) - last(a));
  else { // 변동률순 = 오른 것 위 → 내린 것 맨 아래 (사용자 2026-10-20), 그 구간 값이 없는 것은 그보다도 뒤
    const pv = it => { const p = prChange(it, iv); return p == null ? -Infinity : p; };
    xs.sort((a, b) => pv(b) - pv(a));
  }
  if (!xs.length) return '<p class="pr-none">해당 아이템이 없습니다</p>';
  return `<div class="pr-tw"><table class="pr-t"><thead><tr><th>아이템</th>${days.map(d => `<th${iv.includes(d) ? ' class="sel"' : ''}>${d}일차</th>`).join('')}<th class="sel">${iv[0]}→${iv[1]}</th></tr></thead><tbody>` +
    xs.map(it => {
      const d = prDays(it.id), p = prChange(it, iv);
      return `<tr><td class="pr-tn"><a href="https://tlidb.com/ko/${encodeURIComponent(it.page)}" target="_blank" rel="noopener" title="tlidb에서 보기">${prItemHead(it)}</a></td>` +
        days.map(x => d[x] ? `<td${iv.includes(x) ? ' class="sel"' : ''} title="${x}일차 · 평균 ${d[x][0]} (최저 ${d[x][1]} ~ 최고 ${d[x][2]}) 결정">${prNum(d[x][0])}</td>` : '<td class="na">–</td>').join('') +
        `<td class="sel pct ${p > 0 ? 'up' : p < 0 ? 'dn' : ''}">${p == null ? '–' : prPctTxt(p)}</td></tr>`;
    }).join('') + '</tbody></table></div>';
}
// ── 추천 구매 (관리자만, 2026-10-20 사용자) — SS11~SS14 를 모아 'N일차에 사서 M일차에 팔면' 시즌마다 몇 % 였는지 ──
// 판매일은 바로 다음 날, 시즌별 상승률의 중앙값으로 순위. 중앙값이라 한 시즌 튀는 값(TTD 매물 적은 날)에 덜 흔들린다
function prTabsHtml() {
  if (!PR.admin) return '';
  return `<div class="pr-tabs"><button type="button" class="pr-tab${PR.mode === 'list' ? ' on' : ''}" onclick="prSet('mode','list')">📈 시세</button>` +
    `<button type="button" class="pr-tab${PR.mode === 'buy' ? ' on' : ''}" onclick="prSet('mode','buy')" title="관리자에게만 보이는 화면">🛒 추천 구매 🔒</button></div>`;
}
// 이번 시즌(가장 최근) 기준 일차·날짜 — 1일차 = 시즌 start(KST 자정)
const prCur = () => prSeasons()[0];
const prDayDate = d => { const c = prCur(); return c && c.start ? new Date(c.start + (d - 1) * 864e5).toLocaleDateString('ko-KR', {timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric'}).replace(/\.\s?/g, '/').replace(/\/$/, '') : ''; };
function prToday() { const c = prCur(); return c && c.start ? Math.floor((Date.now() - c.start) / 864e5) + 1 : 0; }
const prMed = a => { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
function prBuyRows() {
  const ses = prSeasons(), bd = PR.bd, out = [];
  CONSUM.items.forEach(it => {
    if (PR.cat && it.cat !== PR.cat) return;
    const per = CPRICE.items[it.id] || {};
    const top = Math.max(0, ...Object.values(per).flatMap(d => Object.values(d).map(v => v[0])));
    if (top <= PR_MIN) return;  // 시세 화면과 같은 규칙 — 가장 비쌀 때도 3결 이하면 뺀다
    let best = null;
    // 판매일 = 바로 다음 날 (사용자 2026-10-20 — 처음엔 '가장 많이 오른 날'을 골랐다)
    PR_DAYS.filter(d => d > bd).slice(0, 1).forEach(sd => {
      // ps = [시즌, %, 산 값, 판 값] — 최근 시즌 먼저 (prSeasons 순서)
      const ps = ses.map(x => { const d = per[x.id]; return d && d[bd] && d[sd] && d[bd][0] > 0 ? [x.label, prPct(d[bd][0], d[sd][0]), d[bd][0], d[sd][0]] : null; }).filter(Boolean);
      if (ps.length < PR_BUY_MIN) return;
      const vs = ps.map(p => p[1]), hit = vs.filter(v => v > 0).length, mid = prMed(vs);
      // 순위 = 최근 시즌 가중 평균 (사용자 2026-10-20: 시즌마다 드롭률 등이 달라 최근 시즌을 더 믿는다). 한 시즌 튀는 값은 ±300% 에서 자른다
      const ws = vs.map((v, k) => PR_RECENT_W[k] || PR_RECENT_W[PR_RECENT_W.length - 1]);
      const med = vs.reduce((t, v, k) => t + Math.max(-PR_CLIP, Math.min(PR_CLIP, v)) * ws[k], 0) / ws.reduce((t, w) => t + w, 0);
      const spread = Math.max(...vs) - Math.min(...vs), olderMax = Math.max(...vs.slice(1));
      // 최근 시즌 약함 = 가장 최근 시즌 상승폭이 예전 시즌 최고치의 30% 도 안 됨 (예전엔 좋았는데 요즘은 아닌 것)
      const weak = olderMax > 0 && vs[0] < olderMax * PR_WEAK;
      const wide = spread > Math.max(PR_SPREAD[0], Math.abs(mid) * PR_SPREAD[1]);
      if (!best || med > best.med) best = {it, sd, med, mid, hit, n: ps.length, per: ps, wide: wide || weak, why: [wide && '시즌별 차이 큼', weak && '최근 시즌 약함'].filter(Boolean).join(' · '), buy: prMed(ses.map(x => per[x.id] && per[x.id][bd] && per[x.id][bd][0]).filter(Boolean))};
    });
    if (best) { best.flow = prFlow(per, bd); out.push(best); }
  });
  return out;
}
// 이번 시즌 흐름 (사용자 2026-10-20) — 이번 시즌이 구매일까지 얼마나 올랐는지 vs 지난 시즌들의 같은 기간 중앙값.
// 기준일은 2일차(TTD 시즌은 1일차 기록이 없음), 이번 시즌에 2일차가 없으면 1일차. 끝은 구매일 이하에서 이번 시즌의 가장 최근 기록
function prFlow(per, bd) {
  const c = prCur(), cd = c && per[c.id]; if (!cd) return null;
  const L = Object.keys(cd).map(Number).filter(d => d <= bd).sort((a, b) => b - a)[0];
  const s0 = cd[2] && L >= 3 ? 2 : 1;
  if (!L || L <= s0 || !cd[s0] || !cd[s0][0]) return null;
  const past = prSeasons().filter(x => x.id !== c.id).map(x => per[x.id]).filter(d => d && d[s0] && d[L] && d[s0][0] > 0).map(d => prPct(d[s0][0], d[L][0]));
  if (!past.length) return null;
  const cur = prPct(cd[s0][0], cd[L][0]), pm = prMed(past), gap = cur - pm;
  return {s0, L, cur, past: pm, n: past.length, gap, k: gap > PR_GAP ? 'hot' : gap < -PR_GAP ? 'cold' : 'same'};
}
function prFlowHtml(f) {
  if (!f) return '<i class="pr-flow na" title="이번 시즌 기록이 아직 비교할 만큼 없습니다">이번 시즌 –</i>';
  const t = {hot: '이미 더 오름', cold: '덜 오름', same: '비슷'}[f.k];
  return `<i class="pr-flow ${f.k}" title="이번 시즌 ${f.s0}→${f.L}일차 ${prPctTxt(f.cur)} · 지난 시즌 같은 기간 중앙값 ${prPctTxt(f.past)} (${f.n}시즌)">이번 시즌 ${t} <b>${prPctTxt(f.cur)}</b> <small>지난 ${prPctTxt(f.past)}</small></i>`;
}
function prBuyHtml() {
  const rows = prBuyRows(), ses = prSeasons(), cur = prCur(), td = prToday(), bd = PR.bd, sd = PR_DAYS.find(x => x > bd);
  const good = r => r.med > 0 && r.hit * 2 >= r.n, hot = r => r.flow && r.flow.k === 'hot';
  const hotN = rows.filter(r => good(r) && hot(r)).length, wideN = rows.filter(r => good(r) && r.wide).length;
  const up = rows.filter(r => good(r) && !(PR.nohot && hot(r)) && (PR.wide || !r.wide)).sort((a, b) => b.med - a.med).slice(0, PR_BUY_TOP);
  const dn = rows.filter(r => r.med < 0 && (PR.wide || !r.wide)).sort((a, b) => a.med - b.med).slice(0, 10);
  const card = (r, i) => `<li class="pb-card${i < 3 ? ' top' : ''}${r.med < 0 ? ' neg' : ''}">` +
    `<div class="pb-h"><span class="pb-rk">${i + 1}</span><img src="${prEsc(r.it.icon)}" alt="" loading="lazy" class="q${r.it.q}" onerror="this.style.visibility='hidden'">` +
    `<span class="pb-nm"><b>${prEsc(r.it.name)}</b><small>${prEsc(r.it.cat)}</small></span>` +
    `<span class="pb-pct ${r.med > 0 ? 'up' : 'dn'}" title="최근 시즌 가중 평균 ${prPctTxt(r.med)} · 중앙값 ${prPctTxt(r.mid)}&#10;${r.per.map(p => `${p[0]} · ${bd}일차 ${prNum(p[2])}결 → ${r.sd}일차 ${prNum(p[3])}결 (${prPctTxt(p[1])})`).join('&#10;')}">${prPctTxt(r.med)}<small>${r.n}시즌 중 ${r.hit}번 상승</small></span></div>` +
    `<div class="pb-f"><span class="pb-buy">${prNum(r.buy)}<small>결</small></span>${prFlowHtml(r.flow)}` +
    `<span class="pb-ses">${r.per.map(([l, p, a, b]) => `<i class="${p > 0 ? 'up' : 'dn'}" title="${l} · ${bd}일차 ${prNum(a)}결 → ${r.sd}일차 ${prNum(b)}결 (${prPctTxt(p)})">${l} ${prPctTxt(p)}</i>`).join('')}</span>` +
    (r.why && PR.wide ? `<span class="pb-why">⚠ ${r.why}</span>` : '') + '</div></li>';
  const days = PR_BUY_DAYS.map(d => `<button type="button" class="pb-day${bd === d ? ' on' : ''}${td === d ? ' today' : ''}${d < td ? ' past' : ''}" onclick="prSet('bd',${d})">` +
    `<b>${d}일차</b><small>${prDayDate(d)}</small>${td === d ? '<i>오늘</i>' : ''}</button>`).join('');
  const cats = ['', ...CONSUM.cats.filter(c => CONSUM.items.some(x => x.cat === c))].map(c =>
    `<button type="button" class="pr-chip${PR.cat === c ? ' on' : ''}" onclick="prSet('cat','${prEsc(c)}')">${c ? prEsc(c) : '전체'}</button>`).join('');
  return `<div class="pb-hero"><div class="pb-ht"><b>추천 구매</b><small>${ses.map(x => x.label).join('·')} 기록 · 관리자만</small></div>` +
    `<div class="pb-now"><span>오늘</span><b>${prDayDate(td)}</b><em>${prEsc(cur.label)} ${td}일차</em></div>` +
    `<details class="pr-note"><summary>ⓘ 계산 방법</summary><div>구매일에 사서 <b>바로 다음 날</b> 팔았을 때의 상승률을 <b>최근 시즌일수록 무게를 더 줘서</b>(가장 최근 1 · 그 전 0.6 · 0.35 · 0.2) 평균 낸 값으로 순위를 매깁니다. 한 시즌만 튄 값은 ±${PR_CLIP}%에서 자릅니다. ` +
    `${PR_BUY_MIN}개 시즌 이상 기록이 있고 오른 시즌이 절반 이상인 것만 넣고, 가장 비쌀 때도 ${PR_MIN}결 이하인 아이템은 뺍니다. ` +
    `<b>믿기 어려운 것</b>은 기본으로 뺍니다 — 시즌마다 결과가 크게 갈린 것(가장 높은·낮은 시즌 차이가 ${PR_SPREAD[0]}%p 와 중앙값의 ${PR_SPREAD[1]}배를 넘음), 그리고 예전 시즌엔 좋았지만 가장 최근 시즌 상승폭이 그 ${PR_WEAK * 100}%도 안 되는 것.<br>` +
    `<b>이번 시즌 흐름</b>: 이번 시즌이 2일차부터 구매일(또는 가장 최근 기록일)까지 오른 정도를 지난 시즌들의 같은 기간 중앙값과 비교합니다. ${PR_GAP}%p 넘게 더 올랐으면 「이미 더 오름」, 덜 올랐으면 「덜 오름」.<br>` +
    `날짜는 이번 시즌 ${prEsc(cur.label)} 기준. SS11·SS12 는 TTD 디아블로 기록(1일차 없음, SS11 은 6일차부터), SS13·SS14 는 ETor 기록입니다. 지난 시즌 흐름일 뿐 이번 시즌도 같다는 보장은 없습니다.</div></details></div>` +
    `<div class="pb-days">${days}</div>` +
    `<div class="pb-bar"><div class="pb-bt"><b>${bd}일차 ${prDayDate(bd)}</b>에 사서 <b>${sd}일차 ${prDayDate(sd)}</b>에 팔기 <small>${rows.length}개 비교</small></div>` +
    `<span class="pb-opts"><label class="pr-nohot" title="시즌마다 결과가 크게 갈린 것(가장 높은·낮은 시즌 차이가 ${PR_SPREAD[0]}%p·중앙값의 ${PR_SPREAD[1]}배를 넘음)과, 최근 시즌 상승폭이 예전 시즌 최고치의 ${PR_WEAK * 100}%도 안 되는 것"><input type="checkbox"${!PR.wide ? ' checked' : ''} onchange="prSet('wide', !this.checked)"> 믿기 어려운 것 빼기 <small>${wideN}</small></label>` +
    `<label class="pr-nohot"><input type="checkbox"${PR.nohot ? ' checked' : ''} onchange="prSet('nohot', this.checked)"> 이번 시즌 이미 많이 오른 것 빼기 <small>${hotN}</small></label></span></div>` +
    `<div class="pb-cats">${cats}</div>` +
    (up.length ? `<ol class="pb-grid">${up.map(card).join('')}</ol>` : '<p class="pr-none">해당 아이템이 없습니다</p>') +
    (dn.length ? `<details class="pb-dn"><summary>⚠ 다음 날 내린 아이템 ${dn.length}개 — 이날 사면 손해였던 것</summary><ol class="pb-grid">${dn.map(card).join('')}</ol></details>` : '');
}
prInit();
