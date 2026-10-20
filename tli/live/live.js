// 생성물 — 고칠 땐 update/src/live_page.js (build_html2.build_tool_pages)
// 오늘의 시세 (/tli/live, 2026-10-20 사용자 — 처음 이름 '실시간 시세', 30분 간격이라 바꿈) — 공개(출입 확인 없음)·메뉴 없음(검증 중). 소비 아이템 이번 시즌 지금 가격.
// 데이터: LCONSUM(아이템) · LSEASON · LDAYS(이번 시즌 일봉, 묶음) · CHOURS(시간대) + /api/price-now(워커 크론이 30분마다 ETor 한 번에 받기 → 오늘·어제 표본)
const LV = {cat: '', q: '', sort: 'pct', now: null, more: 10, cards: 6};  // 표 10줄·카드 6장부터 (사용자 2026-10-20: 스크롤이 길다 → 20 → 10)
const LV_MIN = 3, LV_TOP = 10, DAY = 864e5;
const lvEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const lvNum = v => v >= 100 ? Math.round(v).toLocaleString('ko-KR') : v >= 10 ? (Math.round(v * 10) / 10) : (Math.round(v * 100) / 100);
const lvPct = (a, b) => (b - a) / a * 100;
const lvPctTxt = p => (p > 0 ? '+' : '') + (Math.abs(p) >= 100 ? Math.round(p) : Math.round(p * 10) / 10) + '%';
const lvIcon = u => String(u || '').replace('https://cdn.tlidb.com/', '/timg/');
const LV_IMG_ERR = `onerror="if(!this.dataset.o){this.dataset.o=1;this.src=this.src.replace(location.origin+'/timg/','https://cdn.tlidb.com/')}else this.style.visibility='hidden'"`;
const lvDay = () => Math.floor((Date.now() - LSEASON.start) / DAY) + 1;
const lvDate = d => { const k = new Date(LSEASON.start + (d - 1) * DAY + 9 * 3600e3); return `${k.getUTCMonth() + 1}/${k.getUTCDate()}`; };
const lvTime = ms => { const k = new Date(ms + 9 * 3600e3); return String(k.getUTCHours()).padStart(2, '0') + ':' + String(k.getUTCMinutes()).padStart(2, '0'); };

// 아이템마다 지금 가격·어제 평균·오늘 최저/최고 — 실시간 표본(오늘 t·어제 y)이 있으면 그것, 없으면 묶음 일봉
function lvRow(it) {
  const td = lvDay(), x = (LV.now && LV.now.items[it.id]) || {}, d = LDAYS[it.id] || {};
  const now = x.t ? x.t[5] : d[td] ? d[td][0] : null, at = x.t ? x.t[4] : 0;
  const base = x.y && x.y[3] >= 3 ? x.y[0] : d[td - 1] ? d[td - 1][0] : null;
  const lo = x.t ? x.t[1] : d[td] ? d[td][1] : null, hi = x.t ? x.t[2] : d[td] ? d[td][2] : null;
  return {it, now, at, base, lo, hi, pct: now != null && base ? lvPct(base, now) : null};
}
function lvRows() {
  return LCONSUM.items.map(lvRow).filter(r => r.now != null && Math.max(r.now, r.base || 0, r.hi || 0) > LV_MIN && (!LV.cat || r.it.cat === LV.cat));
}

// 시간대 (소비 아이템 시세 화면과 같은 계산 — CHOURS)
function lvWin(p) {
  if (!p || !p.length) return null;
  const av = [...Array(24).keys()].map(h => { const v = [0, 1, 2].map(k => p[(h + k) % 24]).filter(x => x != null); return v.length >= 2 ? v.reduce((a, b) => a + b, 0) / v.length : null; });
  const ok = av.map((v, h) => [v, h]).filter(x => x[0] != null); if (ok.length < 12) return null;
  const lo = ok.reduce((a, b) => b[0] < a[0] ? b : a), hi = ok.reduce((a, b) => b[0] > a[0] ? b : a);
  return {cheap: lo[1], dear: hi[1], amp: hi[0] - lo[0]};
}
const lvHh = h => String((h + 24) % 24).padStart(2, '0'), lvRange = h => `${lvHh(h)}~${lvHh(h + 2)}시`;
function lvHourChip(id) {
  const x = CHOURS.items && CHOURS.items[id], w = x && lvWin(x.p);
  return w && w.amp >= 3 ? `<i class="pr-hour" data-tip="이번 시즌 하루 중 시간대 (KST)">⏰ 싸게 ${lvRange(w.cheap)} · 비싸게 ${lvRange(w.dear)}</i>` : '';
}
function lvHourHtml() {
  const a = CHOURS.all; if (!a || !a.length) return '';
  const w = lvWin(a), mx = Math.max(...a.map(v => Math.abs(v || 0)), 0.5);
  const per = h => { const n = (h + 24) % 24; return n < 6 ? '새벽' : n < 12 ? '오전' : n < 18 ? '오후' : '저녁'; };
  const bars = a.map((v, h) => `<span class="ph-b${w && (h + 24 - w.cheap) % 24 < 3 ? ' lo' : ''}${w && (h + 24 - w.dear) % 24 < 3 ? ' hi' : ''}" data-tip="${lvHh(h)}시 · 앞뒤 12시간 대비 ${v == null ? '–' : lvPctTxt(v)}"><i style="height:${v == null || !v ? 0 : Math.max(4, Math.abs(v) / mx * 48)}%" class="${(v || 0) >= 0 ? 'p' : 'n'}"></i><small>${h % 3 ? '' : h}</small></span>`).join('');
  return `<div class="ph"><div class="ph-t"><b>⏰ 하루 중 시간대</b>${w ? `<span>보통 <em class="lo">${per(w.cheap)} ${lvRange(w.cheap)}</em>가 가장 싸고 <em class="hi">${per(w.dear)} ${lvRange(w.dear)}</em>가 가장 비쌉니다</span>` : ''}` +
    `<small class="ph-s">이번 시즌 ${lvEsc(CHOURS.cur || '')} · KST</small></div><div class="ph-bars">${bars}</div></div>`;
}

function lvCard(r, i) {
  return `<li class="pb-card lv-card${i < 3 ? ' top' : ''}"><div class="pb-h"><span class="pb-rk">${i + 1}</span><img src="${lvEsc(lvIcon(r.it.icon))}" alt="" loading="lazy" class="q${r.it.q}" ${LV_IMG_ERR}>` +
    `<span class="pb-nm"><b>${lvEsc(r.it.name)}</b><small>${lvEsc(r.it.cat)}</small></span>` +
    `<span class="lv-big ${r.pct > 0 ? 'up' : 'dn'}">${lvPctTxt(r.pct)}<small>어제 평균 ${lvNum(r.base)} → 지금 <b>${lvNum(r.now)}결</b></small></span></div>` +
    `<div class="pg-f2">${r.lo != null ? `<i class="lv-chip">오늘 ${lvNum(r.lo)} ~ ${lvNum(r.hi)}</i>` : ''}${r.at ? `<i class="lv-chip">${lvTime(r.at)} 기준</i>` : ''}${lvHourChip(r.it.id)}</div></li>`;
}
function lvTable(rows) {
  const q = LV.q.trim().toLowerCase(); let xs = rows.filter(r => !q || r.it.name.toLowerCase().includes(q));
  if (LV.sort === 'name') xs.sort((a, b) => a.it.name.localeCompare(b.it.name, 'ko'));
  else if (LV.sort === 'price') xs.sort((a, b) => b.now - a.now);
  else xs.sort((a, b) => (b.pct == null ? -1e9 : b.pct) - (a.pct == null ? -1e9 : a.pct));
  if (!xs.length) return '<p class="pr-none">해당 아이템이 없습니다</p>';
  const all = xs.length; xs = xs.slice(0, LV.more);
  return `<div class="pr-tw"><table class="pr-t lv-t"><thead><tr><th>아이템</th><th>어제 평균</th><th class="sel">지금</th><th class="sel">변동</th><th>오늘 최저~최고</th><th>기준 시각</th></tr></thead><tbody>` +
    xs.map(r => `<tr><td class="pr-tn"><a href="https://tlidb.com/ko/${encodeURIComponent(r.it.page)}" target="_blank" rel="noopener"><img src="${lvEsc(lvIcon(r.it.icon))}" alt="" loading="lazy" class="q${r.it.q}" ${LV_IMG_ERR}><span class="pr-in"><b>${lvEsc(r.it.name)}</b><small>${lvEsc(r.it.cat)}</small></span></a></td>` +
      `<td>${r.base ? lvNum(r.base) : '–'}</td><td class="sel"><b>${lvNum(r.now)}</b></td><td class="sel pct ${r.pct > 0 ? 'up' : r.pct < 0 ? 'dn' : ''}">${r.pct == null ? '–' : lvPctTxt(r.pct)}</td>` +
      `<td>${r.lo != null ? lvNum(r.lo) + ' ~ ' + lvNum(r.hi) : '–'}</td><td class="na">${r.at ? lvTime(r.at) : '–'}</td></tr>`).join('') + '</tbody></table></div>' +
    (all > xs.length ? `<div class="lv-more"><button type="button" class="pr-chip" onclick="lvMore(10)">더보기 +10</button><button type="button" class="pr-chip" onclick="lvMore(1e9)">전체 ${all}개 보기</button><small>${xs.length} / ${all}</small></div>` : '');
}
function lvRender(onlyTable) {
  const app = document.getElementById('priceApp'), rows = lvRows(), td = lvDay();
  if (onlyTable) { document.getElementById('lvTable').innerHTML = lvTable(rows); return; }
  const mv = rows.filter(r => r.pct != null);
  const up = mv.filter(r => r.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, LV.cards), dn = mv.filter(r => r.pct < 0).sort((a, b) => a.pct - b.pct).slice(0, LV.cards);
  const got = LV.now && LV.now.got;
  const cats = ['', ...LCONSUM.cats.filter(c => LCONSUM.items.some(x => x.cat === c))].map(c =>
    `<button type="button" class="pr-chip${LV.cat === c ? ' on' : ''}" onclick="lvSet('cat','${lvEsc(c)}')">${c ? lvEsc(c) : '전체'}</button>`).join('');
  const sec = (t, cls, xs) => `<div class="pb-sec ${cls}"><div class="pb-sh">${t}</div>${xs.length ? `<ol class="pb-grid">${xs.map(lvCard).join('')}</ol>` : '<p class="pr-none">해당 아이템이 없습니다</p>'}</div>`;
  const cardMore = LV.cards < LV_TOP && mv.length > LV.cards * 2 ? `<div class="lv-more"><button type="button" class="pr-chip" onclick="LV.cards=${LV_TOP};lvRender()">많이 오른·내린 아이템 ${LV_TOP}개씩 보기</button></div>` : '';
  app.innerHTML = `<div class="pb-hero"><div class="pb-ht"><b>오늘의 시세</b><small>소비 아이템 · 이번 시즌 · 30분마다 갱신 (단위 결정)</small></div>` +
    `<div class="pb-now"><span>오늘</span><b>${lvDate(td)}</b><em>${lvEsc(LSEASON.label)} ${td}일차</em></div>` +
    `<div class="pb-meta">${got ? `마지막 갱신 <b>${lvTime(got)}</b>` : ''}<br><small>변동 = 어제 평균 대비 지금 가격</small></div>` +
    `<details class="pr-note"><summary>ⓘ 시세 출처</summary><div>중국 트래커 易火 ETor 의 시세 서버에서 30분마다 받습니다. 허가를 받은 자료가 아니라 문제가 되면 내리겠습니다.<br>단위: 최초의 불꽃 결정. 가장 비쌀 때도 ${LV_MIN}결 이하인 아이템은 뺐습니다.</div></details></div>` +
    lvHourHtml() + `<div class="pb-cats">${cats}</div>` +
    sec('▲ 오늘 많이 오른 아이템', 'up', up) + sec('▼ 오늘 많이 내린 아이템', 'dn', dn) + cardMore +
    `<div class="pr-sec"><div class="pr-sech"><b>전체 시세</b><input class="pr-q" placeholder="아이템 이름 검색" value="${lvEsc(LV.q)}" oninput="lvSet('q', this.value)">` +
    ddHtml(LV.sort, [['pct', '변동순'], ['price', '가격순'], ['name', '이름순']], 'lvSort') + '</div>' +
    `<div id="lvTable">${lvTable(rows)}</div></div>`;
}
// 맞춤 드롭다운 — 기본 <select> 대신 (2026-10-20 사용자: 셀렉트 박스가 깨져 보임)
function ddHtml(cur, opts, fn) {  // opts = [[값, 글자]], fn = 고르면 부를 함수 이름(값을 받음)
  const t = (opts.find(o => o[0] === cur) || opts[0])[1];
  return `<div class="dd"><button type="button" class="dd-b" onclick="ddToggle(this, event)">${t}<i>▾</i></button><div class="dd-m">` +
    opts.map(([k, v]) => `<button type="button" class="${k === cur ? 'on' : ''}" onclick="${fn}('${k}')">${v}</button>`).join('') + '</div></div>';
}
function ddToggle(b, e) { e.stopPropagation(); const d = b.parentNode, o = d.classList.contains('open'); document.querySelectorAll('.dd.open').forEach(x => x.classList.remove('open')); if (!o) d.classList.add('open'); }
document.addEventListener('click', () => document.querySelectorAll('.dd.open').forEach(x => x.classList.remove('open')));
function lvSort(v) { lvSet('sort', v); }
function lvSet(k, v) { LV[k] = v; LV.more = 10; lvRender(k === 'q'); }  // 검색·정렬·분류를 바꾸면 다시 10개부터
function lvMore(n) { LV.more += n; lvRender(true); }
async function lvLoad() {
  try { const r = await fetch('/api/price-now', {cache: 'no-store'}); if (r.ok) { const o = await r.json(); if (o.ok && o.season === LSEASON.id) LV.now = o; } } catch (e) {}
  lvRender();
}
// 맞춤 툴팁 (소비 아이템 시세 화면과 같음)
const lvTip = document.createElement('div'); lvTip.className = 'pr-tip'; document.body.appendChild(lvTip);
document.addEventListener('mousemove', e => { const el = e.target.closest && e.target.closest('[data-tip]'); if (!el) { lvTip.style.display = 'none'; return; }
  lvTip.textContent = el.dataset.tip; lvTip.style.display = 'block'; const w = lvTip.offsetWidth, h = lvTip.offsetHeight;
  lvTip.style.left = Math.max(8, Math.min(e.clientX + 14, innerWidth - w - 8)) + 'px'; lvTip.style.top = (e.clientY + 18 + h > innerHeight ? e.clientY - h - 12 : e.clientY + 18) + 'px'; });
lvRender(); lvLoad();
setInterval(lvLoad, 5 * 60e3);  // 5분마다 다시 (서버는 30분마다 갱신)
