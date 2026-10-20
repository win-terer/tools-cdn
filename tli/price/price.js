// 생성물 — 고칠 땐 update/src/price_page.js (build_html2.build_tool_pages)
// 소비 아이템 시세 (/tli/price, 2026-10-20 사용자 요청) — 시즌 초반 1·2·3·4·7·14일차 시세 + 구간별 변동률 순위
// 데이터: CONSUM {cats, items:[{id, name, cat, q, icon, page, desc}]} (build_consum.py, tlidb Inventory 분류 29개)
//         CPRICE {seasons:[{id, label, start}], items:{id:{시즌:{일차:[평균, 최저, 최고]}}}} (etor_prices.py --consum, 단위 결정)
// 규칙: 가장 비쌀 때도 3결 이하인 아이템은 뺀다(사용자 2026-10-20 — 싼 건 몇 %가 움직여도 의미 없음)
const PR_DAYS = [1, 2, 3, 4, 5, 6, 7, 14];  // 7일차까지 매일 + 14일차 (사용자 2026-10-20)
const PR_IVS = [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 14], [1, 7], [1, 14]];
const PR_MIN = 3;    // 결정
const PR_TOP = 10;
const PR_NOTE = '이 시세는 중국 트래커 易火 ETor 의 시세 서버에서 수집했습니다.\nETor 측의 허가를 받지 않고 가져온 자료라, 문제가 된다면 디스코드 win.terer 로 연락 주시면 바로 내리겠습니다.\n\n단위: 최초의 불꽃 결정. 일차는 시즌 시작일 기준입니다.';
const PR = {se: '', iv: '1-2', cat: '', q: '', sort: 'pct', mode: 'list', bd: 1, admin: false};
const PR_BUY_DAYS = [1, 2, 3, 4, 5, 6, 7];
const PR_BUY_TOP = 20, PR_BUY_MIN = 2;  // 추천은 2개 시즌 이상 기록이 있는 것만
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
    if (PR_BUY_DAYS.includes(+sp.get('bd'))) PR.bd = +sp.get('bd');
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
  if (PR.mode === 'buy' && PR.admin) { app.innerHTML = prTabsHtml() + prBuyHtml(); return; }
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
    return `<button type="button" class="pr-iv${PR.iv === k ? ' on' : ''}"${has ? ` onclick="prSet('iv','${k}')"` : ' disabled title="아직 그 일차 시세가 없습니다"'}>${v[0]}일차 → ${v[1]}일차${k === '1-14' ? ' <small>전체</small>' : k === '1-7' ? ' <small>첫 주</small>' : ''}</button>`;
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
// 아이템마다 판매일(구매일 뒤 2~14일차) 중 시즌별 상승률 중앙값이 가장 큰 날을 고른다. 중앙값이라 한 시즌 튀는 값(TTD 매물 적은 날)에 덜 흔들린다
function prTabsHtml() {
  if (!PR.admin) return '';
  return `<div class="pr-tabs"><button type="button" class="pr-tab${PR.mode === 'list' ? ' on' : ''}" onclick="prSet('mode','list')">📈 시세</button>` +
    `<button type="button" class="pr-tab${PR.mode === 'buy' ? ' on' : ''}" onclick="prSet('mode','buy')" title="관리자에게만 보이는 화면">🛒 추천 구매 🔒</button></div>`;
}
const prMed = a => { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
function prBuyRows() {
  const ses = prSeasons(), bd = PR.bd, out = [];
  CONSUM.items.forEach(it => {
    if (PR.cat && it.cat !== PR.cat) return;
    const per = CPRICE.items[it.id] || {};
    const top = Math.max(0, ...Object.values(per).flatMap(d => Object.values(d).map(v => v[0])));
    if (top <= PR_MIN) return;  // 시세 화면과 같은 규칙 — 가장 비쌀 때도 3결 이하면 뺀다
    let best = null;
    PR_DAYS.filter(d => d > bd).forEach(sd => {
      const ps = ses.map(x => { const d = per[x.id]; return d && d[bd] && d[sd] && d[bd][0] > 0 ? [x.label, prPct(d[bd][0], d[sd][0])] : null; }).filter(Boolean);
      if (ps.length < PR_BUY_MIN) return;
      const med = prMed(ps.map(p => p[1])), hit = ps.filter(p => p[1] > 0).length;
      if (!best || med > best.med) best = {it, sd, med, hit, n: ps.length, per: ps, buy: prMed(ses.map(x => per[x.id] && per[x.id][bd] && per[x.id][bd][0]).filter(Boolean))};
    });
    if (best) out.push(best);
  });
  return out;
}
function prBuyHtml() {
  const rows = prBuyRows(), all = CONSUM.items.filter(it => !PR.cat || it.cat === PR.cat);
  const up = rows.filter(r => r.med > 0 && r.hit * 2 >= r.n).sort((a, b) => b.med - a.med).slice(0, PR_BUY_TOP);
  const dn = rows.filter(r => r.med < 0).sort((a, b) => a.med - b.med).slice(0, 10);
  const ses = prSeasons();
  const row = (r, i) => `<li class="pr-b"><span class="pr-rk">${i + 1}</span>${prItemHead(r.it)}` +
    `<span class="pr-bper">${r.per.map(([l, p]) => `<i class="${p > 0 ? 'up' : 'dn'}" title="${l} · ${PR.bd}일차 → ${r.sd}일차">${l.replace('SS', '')} ${prPctTxt(p)}</i>`).join('')}</span>` +
    `<span class="pr-rv"><em>${PR.bd}일차 ${prNum(r.buy)}결 → <b class="pr-sd">${r.sd}일차</b> 판매</em><b class="${r.med > 0 ? 'up' : 'dn'}">${prPctTxt(r.med)}</b><em>${r.n}시즌 중 ${r.hit}번 상승</em></span></li>`;
  return `<div class="pr-top"><div class="pr-ttl"><b>추천 구매</b><small>${ses.map(x => x.label).join('·')} 기록을 모아 본 일차별 구매 후보 · 관리자만</small></div>` +
    `<details class="pr-note"><summary>ⓘ 계산 방법</summary><div>구매일을 고르면 아이템마다 그 뒤 판매일(2~14일차) 중 <b>시즌별 상승률의 중앙값</b>이 가장 큰 날을 고릅니다.<br>` +
    `${PR_BUY_MIN}개 시즌 이상 기록이 있는 것만, 오른 시즌이 절반 이상인 것만 추천에 넣습니다. 가장 비쌀 때도 ${PR_MIN}결 이하인 아이템은 뺍니다.<br>` +
    `SS11·SS12 는 TTD 디아블로 기록(1일차 기록 없음, SS11 은 7·14일차만), SS13·SS14 는 ETor 기록입니다. 지난 시즌 흐름일 뿐 이번 시즌도 같다는 보장은 없습니다.</div></details></div>` +
    `<div class="pr-ivs">${PR_BUY_DAYS.map(d => `<button type="button" class="pr-iv${PR.bd === d ? ' on' : ''}" onclick="prSet('bd',${d})">${d}일차에 사기</button>`).join('')}</div>` +
    `<div class="pr-cats"><button type="button" class="pr-chip${!PR.cat ? ' on' : ''}" onclick="prSet('cat','')">전체</button>` +
    CONSUM.cats.filter(c => CONSUM.items.some(x => x.cat === c)).map(c => `<button type="button" class="pr-chip${PR.cat === c ? ' on' : ''}" onclick="prSet('cat','${prEsc(c)}')">${prEsc(c)}</button>`).join('') + '</div>' +
    `<div class="pr-buy"><div class="pr-rcol up"><div class="pr-rh">🛒 ${PR.bd}일차에 사 두면 좋았던 아이템 <small>${rows.length}개 중</small></div>${up.length ? '<ol>' + up.map(row).join('') + '</ol>' : '<p class="pr-none">해당 아이템이 없습니다</p>'}</div>` +
    `<div class="pr-rcol dn"><div class="pr-rh">⚠ ${PR.bd}일차에 사면 손해였던 아이템 <small>어느 날 팔아도 내림</small></div>${dn.length ? '<ol>' + dn.map(row).join('') + '</ol>' : '<p class="pr-none">해당 아이템이 없습니다</p>'}</div></div>` +
    (all.length ? '' : '');
}
prInit();
