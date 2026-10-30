// 생성물 — 고칠 땐 update/src/void_page.js (build_html2.build_tool_pages)
// 공통 대화창(nav.js 의 wtOk·wtAsk·wtAskText·wtCopyBox) — nav.js 가 없는 곳(시험 jsdom)에서는 시스템 창으로 (2026-10-22)
if (!window.wtOk) window.wtOk = (m) => confirm(m);
if (!window.wtAsk) window.wtAsk = (m, ok, o) => { if (confirm(m)) { if (ok) ok(); } else if (o && o.onCancel) o.onCancel(); };
if (!window.wtAskText) window.wtAskText = (m, d, ok) => { const v = prompt(m, d); if (v !== null) ok(v); };
if (!window.wtCopyBox) window.wtCopyBox = (m, t) => prompt(m, t);
// 허공의 성도 시뮬레이터 (/tli/void, 2026-10-16) — 재능 별무리 노드 찍기 · 포인트 · 효과 합계 · 링크 공유
// 데이터 VOID = {star, main, list:[{page, name, icon, unlock, n, main?, vb, start, nodes:[{id,x,y,r,icon,kind,map?,fn?,extra?}], links:[[자식,부모]]}]}
// 규칙(사용자 확인 2026-10-16): 노드 = 1포인트(시작 노드는 공짜) · 그윽한(메인) 별무리는 '메인 스타 재능' 전용 포인트 ·
//   '스타 재능 N개를 추가 소모' 노드는 +N 스타 재능 · 찍으려면 부모(이전 노드) 하나가 찍혀 있어야 함 ·
//   그윽한 별무리의 '이전 노드를 우선 활성화하지 않음' 노드를 찍으면 비 콘텐츠 별무리(ng — 장비·레전드 장비·나침반·화폐·비콘)는
//   이전 노드 없이 아무 노드나 찍을 수 있다 · 그 노드를 빼면 비 콘텐츠 별무리가 모두 초기화된다 (사용자 확인 2026-10-16)
(function () {
  'use strict';
  const ICON = 'https://cdn.tlidb.com/UI/Textures/Common/Icon/TalentPoint/128/';
  const KEY = 'tli_solo_void_v1';
  const nodeText = n => (n.map || []).concat(n.fn || []).join('\n');
  const NOPRE = /이전 노드를 우선 활성화하지 않음/;
  const app = document.getElementById('voidApp');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // 숫자 강조 — 플러스는 옅은 초록, 마이너스는 옅은 빨강(파스텔), 부호 없는 숫자는 옅은 하늘색 (2026-10-28 사용자)
  const hl = s => esc(s).replace(/([+\-]?)(\d+(?:\.\d+)?%?)/g, (m, sg, v) => `<b class="vc-num${sg === '+' ? ' up' : sg === '-' ? ' dn' : ''}">${m}</b>`);

  // ── 별무리 준비: 부모·자식 표, 노드 찾기 ──
  const CS = VOID.list.map((c, ci) => {
    const by = new Map(c.nodes.map(n => [n.id, n]));
    const par = new Map(), kids = new Map();
    c.links.forEach(([a, b]) => {
      if (!par.has(a)) par.set(a, []); par.get(a).push(b);
      if (!kids.has(b)) kids.set(b, []); kids.get(b).push(a);
    });
    const xs = c.nodes.map(n => n.x), ys = c.nodes.map(n => n.y), pad = 70;
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad, w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
    return Object.assign({}, c, { ci, by, par, kids, key: Math.floor(+c.start / 100), box: [x0, y0, w, h] });
  });
  const BYKEY = new Map(CS.map(c => [c.key, c]));

  // ── 상태: 별무리별 찍은 노드 id 집합 (시작 노드는 넣지 않는다 — 늘 켜진 것으로 본다) ──
  let S = CS.map(() => new Set());
  // 나침반 4칸·탐침 1칸 (2026-10-27 사용자) — 아이템 id, 0 = 빈칸. 공유 코드에는 GKEY 묶음으로 뒤에 붙는다
  const GKEY = 9000, CBY = new Map(VOID_GEAR.c.map(x => [x.id, x])), PBY = new Map(VOID_GEAR.p.map(x => [x.id, x]));
  // 정령 3칸 (2026-10-28 사용자) — 드롭 정령만, 칸마다 정령 id(s)·승급 단계(l). 공유 코드에는 PKEY 묶음(id·단계 ×3)
  const PKEY = 9001, PETBY = new Map((typeof VOID_PET === 'object' ? VOID_PET : []).map(x => [x.id, x]));
  const petMax = id => Math.max(1, (PETBY.get(id) || { a: [] }).a.length);
  const emptyG = () => ({ p: 0, c: [0, 0, 0, 0], s: [0, 0, 0], l: [0, 0, 0] });
  // 같은 나침반은 한 칸에만 (2026-10-27 사용자) — 저장본·공유 코드에 겹친 게 있으면 뒤 칸을 비운다
  const normG = g => { const seen = new Set(); return { p: PBY.has(+(g && g.p)) ? +g.p : 0, c: [0, 1, 2, 3].map(i => { const v = +((g && g.c) || [])[i]; if (!CBY.has(v) || seen.has(v)) return 0; seen.add(v); return v; }).filter(x => x).concat([0, 0, 0, 0]).slice(0, 4), ...normS(g) }; };
  // 같은 정령은 한 칸에만, 빈칸은 뒤로. 단계는 1~최대(없거나 넘치면 최대)
  const normS = g => { const seen = new Set(), ps = [];
    [0, 1, 2].forEach(i => { const v = +((g && g.s) || [])[i], lv = +((g && g.l) || [])[i]; if (!PETBY.has(v) || seen.has(v)) return; seen.add(v); ps.push([v, lv >= 1 && lv <= petMax(v) ? lv : petMax(v)]); });
    while (ps.length < 3) ps.push([0, 0]);
    return { s: ps.map(x => x[0]), l: ps.map(x => x[1]) }; };   // 빈칸은 뒤로 — 위 칸이 비면 아래 나침반이 올라온다
  const hasG = g => !!(g.p || g.c.some(x => x) || (g.s || []).some(x => x));
  let G = emptyG();
  let M = '';   // 메모 500자 이내 — 연습판에 저장되고 파밍 빌드 공유 때 글과 함께 올라간다 (2026-10-27 사용자)
  let view = -1;            // -1 = 목록, 아니면 별무리 번호
  let undo = [];
  const load = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.s) S = CS.map(c => new Set((o.s[c.key] || []).filter(id => c.by.has(id) && id !== c.start))); if (o && o.g) G = normG(o.g); if (o && typeof o.m === 'string') M = o.m.slice(0, 500); } catch (e) {} };
  let RO = null;   // 공유 글 보기 중(?s=) — {item, liked, admin, vwait} · 이때 S 는 공유 배치이고 저장하지 않는다
  let ED = null;   // 공유 글 수정 중 — {item, pwd, admin} · 연습판처럼 고치되 내 연습판에는 저장하지 않는다 (2026-10-28 사용자)
  const save = () => { if (RO || ED) return; try { const s = {}; CS.forEach(c => { if (S[c.ci].size) s[c.key] = [...S[c.ci]]; }); const o = { v: 1, s }; if (hasG(G)) o.g = G; if (M) o.m = M; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
  const snap = () => { const a = S.map(x => new Set(x)); a.g = normG(G); undo.push(a); if (undo.length > 50) undo.shift(); };
  const popUndo = () => { const a = undo.pop(); S = a; if (a.g) G = a.g; save(); render(); };

  // ── 포인트 ──
  const nodeCost = (c, n) => c.main ? { m: 1, s: n.extra || 0 } : { m: 0, s: 1 + (n.extra || 0) };
  function used() {
    let m = 0, s = 0;
    CS.forEach(c => S[c.ci].forEach(id => { const k = nodeCost(c, c.by.get(id)); m += k.m; s += k.s; }));
    return { m, s };
  }
  const on = (c, id) => id === c.start || S[c.ci].has(id);
  // 자유 찍기 노드(그윽한 별무리)가 켜져 있나 — 켜져 있으면 비 콘텐츠 별무리는 길 없이 찍는다
  const MAINC = CS.find(c => c.main);
  const FREE_ID = MAINC ? (MAINC.nodes.find(n => NOPRE.test(nodeText(n))) || {}).id : null;
  const freeOn = () => !!(FREE_ID && S[MAINC.ci].has(FREE_ID));
  const freeHere = c => !!c.ng && freeOn();

  // 아직 안 찍힌 노드까지 가는 가장 짧은 길(부모 쪽으로 거슬러 찍힌 노드를 만날 때까지) — 찍을 노드 목록
  function pathTo(c, id) {
    const prev = new Map([[id, null]]), q = [id];
    while (q.length) {
      const v = q.shift();
      if (on(c, v)) { const out = []; let u = prev.get(v); while (u) { out.push(u); u = prev.get(u); } return v === id ? [] : out; }
      for (const p of c.par.get(v) || []) if (!prev.has(p)) { prev.set(p, v); q.push(p); }
    }
    return null;
  }
  // 끊긴 가지 정리 — 찍힌 부모가 하나도 없는 노드를 시작 노드에서 닿을 때까지 거듭 뺀다
  function prune(c) {
    if (freeHere(c)) return;   // 자유 찍기 중인 비 콘텐츠 별무리는 이어짐을 따지지 않는다
    const set = S[c.ci], ok = new Set([c.start]), q = [c.start];
    while (q.length) { const v = q.shift(); for (const k of c.kids.get(v) || []) if (set.has(k) && !ok.has(k)) { ok.add(k); q.push(k); } }
    [...set].forEach(id => { if (!ok.has(id)) set.delete(id); });
  }
  function toggle(c, id) {
    if (id === c.start) return;
    if (RO) return toast('공유 빌드를 보는 중입니다 — 「내 연습판으로 가져오기」 뒤에 고칠 수 있습니다');
    const set = S[c.ci], hadFree = freeOn();
    if (set.has(id)) {
      snap(); set.delete(id); prune(c);
      if (c.main && hadFree && !freeOn()) {   // 자유 찍기 노드가 빠짐 → 비 콘텐츠 별무리 전부 초기화 (게임 규칙)
        const n = CS.filter(x => x.ng && S[x.ci].size).length;
        CS.forEach(x => { if (x.ng) S[x.ci] = new Set(); });
        if (n) toast('비 콘텐츠 재능 별무리 ' + n + '개가 함께 초기화되었습니다');
      }
    } else {
      const p = freeHere(c) ? [] : pathTo(c, id);
      if (!p) return;
      const add = [...new Set([id, ...p])].filter(x => x !== c.start);   // p 는 목표 노드까지 포함
      const u = used(); let m = 0, s = 0;
      add.forEach(x => { const k = nodeCost(c, c.by.get(x)); m += k.m; s += k.s; });
      if (u.m + m > VOID.main) return toast(`메인 스타 재능이 부족합니다 (필요 ${m} · 남음 ${VOID.main - u.m})`);
      if (u.s + s > VOID.star) return toast(`스타 재능이 부족합니다 (필요 ${s} · 남음 ${VOID.star - u.s})`);
      snap(); add.forEach(x => set.add(x));
      if (add.includes(FREE_ID) && c.main) toast('비 콘텐츠 재능 별무리(장비·레전드 장비·나침반·화폐·비콘)는 이제 이전 노드 없이 찍을 수 있습니다');
    }
    save(); render();
  }

  // ── 효과 합계 — 같은 문구는 숫자를 더하고(숫자 1개·'추가/별도' 아닐 때), 아니면 같은 줄끼리 ×n ──
  function merge(lines) {
    const g = new Map();
    lines.forEach(line => {
      const nums = line.match(/[+\-]?\d+(?:\.\d+)?/g) || [];
      // '추가'·'별도' 수치는 곱연산이라 더하지 않고 같은 줄끼리 ×n 으로만 묶는다
      const add = nums.length === 1 && !/추가|별도/.test(line);
      const tpl = add ? line.replace(/[+\-]?\d+(?:\.\d+)?/, '\u0000') : line;
      const e = g.get(tpl) || { tpl, v: 0, k: 0, sign: /^[+\-]/.test(nums[0] || '') };
      if (add) e.v += parseFloat(nums[0]);
      e.k++; g.set(tpl, e);
    });
    // 수치 큰 줄 먼저 (2026-10-28 사용자) — 줄에서 가장 큰 숫자(×n 은 곱해서), 숫자 없는 줄은 맨 뒤
    const big = r => { const ns = (r.t.match(/\d+(?:\.\d+)?/g) || []).map(Number); return ns.length ? Math.max(...ns) * (r.x ? r.k : 1) : -1; };
    return [...g.values()].map(e => {
      if (!e.tpl.includes('\u0000')) return { t: e.tpl, k: e.k, x: e.k > 1 };
      const v = Math.round(e.v * 100) / 100;
      return { t: e.tpl.replace('\u0000', (e.sign && v >= 0 ? '+' : '') + v), k: e.k };
    }).map(r => [r, big(r)]).sort((a, z) => z[1] - a[1]).map(x => x[0]);
  }
  const nodeLines = c => [...S[c.ci]].flatMap(id => { const n = c.by.get(id); return (n.map || []).concat(n.fn || []); });
  // 전체 합계는 별무리별·탐침·나침반 묶음으로 나눠 구분선과 제목을 단다 (2026-10-28 사용자)
  // 묶음은 쓴 포인트 많은 별무리 먼저, 탐침·나침반은 맨 뒤. 위 아이콘 줄로 한 묶음만 골라 볼 수 있다
  let sumSel = null;
  function summary(only) {
    if (only != null) { const c = CS.find(x => x.ci === only); return c ? [{ rows: merge(nodeLines(c)) }] : []; }
    const pts = c => [...S[c.ci]].reduce((a, id) => { const k = nodeCost(c, c.by.get(id)); return a + k.s + k.m; }, 0);
    const out = CS.filter(c => S[c.ci].size).map(c => ({ key: String(c.ci), h: c.name, ic: ICON + c.icon, p: pts(c), n: S[c.ci].size, rows: merge(nodeLines(c)) }))
      .sort((a, z) => z.p - a.p);
    const gi = [PBY.get(G.p)].concat(G.c.map(id => CBY.get(id))).filter(Boolean);
    const gl = gi.flatMap(it => it.e);
    const pi = G.s.map((id, j) => [PETBY.get(id), G.l[j]]).filter(x => x[0]);
    const pl = pi.flatMap(([pt, lv]) => (pt.a[lv - 1] || []).concat(pt.nd));
    if (pl.length) out.push({ key: 'pt', h: '정령', ic: pi[0][0].i, p: -1, n: pi.length, rows: merge(pl) });   // 정령은 한 묶음, 탐침·나침반 앞
    if (gl.length) out.push({ key: 'g', h: '탐침 · 나침반', ic: gi[0].i, p: -1, n: gi.length, rows: merge(gl) });   // 탐침·나침반은 한 묶음·맨 뒤
    return out.filter(x => x.rows.length);
  }

  // ── 공유 코드: [판 1] + 별무리마다 (key, 개수, id 끝자리 차이…) varint → base64url ──
  function encode() {
    const b = [1], vi = n => { while (n > 127) { b.push((n & 127) | 128); n >>>= 7; } b.push(n); };
    CS.forEach(c => {
      const ids = [...S[c.ci]].map(id => +id - +c.start).sort((a, z) => a - z);
      if (!ids.length) return;
      vi(c.key); vi(ids.length); let p = 0; ids.forEach(x => { vi(x - p); p = x; });
    });
    if (G.p || G.c.some(x => x)) { vi(GKEY); vi(5); [G.p].concat(G.c).forEach(vi); }
    if (G.s.some(x => x)) { vi(PKEY); vi(6); G.s.forEach((id, j) => { vi(id); vi(id ? G.l[j] : 0); }); }   // 서버(voidPts)·옛 화면은 모르는 key 로 보고 건너뛴다
    return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(code) {
    const s = atob(code.replace(/-/g, '+').replace(/_/g, '/')), b = [...s].map(ch => ch.charCodeAt(0));
    let i = 0; const vi = () => { let n = 0, sh = 0, x; do { x = b[i++]; if (x == null) throw 0; n |= (x & 127) << sh; sh += 7; } while (x & 128); return n; };
    if (vi() !== 1) throw 0;
    const out = CS.map(() => new Set());
    const g = {};
    while (i < b.length) {
      const key = vi(), k = vi();
      if (key === GKEY) { const a = []; for (let j = 0; j < k; j++) a.push(vi()); g.p = a[0]; g.c = a.slice(1); continue; }
      if (key === PKEY) { const a = []; for (let j = 0; j < k; j++) a.push(vi()); g.s = [a[0], a[2], a[4]]; g.l = [a[1], a[3], a[5]]; continue; }
      const c = BYKEY.get(key); let p = 0;
      for (let j = 0; j < k; j++) { p += vi(); if (c) { const id = String(+c.start + p); if (c.by.has(id) && id !== c.start) out[c.ci].add(id); } }
    }
    const keep = S; S = out;   // 그윽한(자유 찍기 노드) 먼저 정리해야 비 콘텐츠 별무리 판정이 맞다
    CS.filter(c => c.main).concat(CS.filter(c => !c.main)).forEach(prune);
    S = keep;
    out.g = normG(g);
    return out;
  }

  // ── 그리기 ──
  let msgT;
  function toast(t) {
    let el = document.getElementById('vcToast');
    if (!el) { el = document.createElement('div'); el.id = 'vcToast'; document.body.appendChild(el); }
    el.textContent = t; el.classList.add('on'); clearTimeout(msgT); msgT = setTimeout(() => el.classList.remove('on'), 2600);
  }
  function pointsBar() {
    const u = used();
    const chip = (lb, a, b, cls) => `<span class="vc-pt ${cls}${a > b ? ' over' : ''}"><small>${lb}</small><b>${a}</b><i>/ ${b}</i></span>`;
    return chip('스타 재능', u.s, VOID.star, 's') + chip('메인 스타 재능', u.m, VOID.main, 'm');
  }
  function top() {
    return `<div class="vc-top">
      <div class="vc-ttl"><b>허공의 성도</b><small>재능 별무리 시뮬레이터</small></div>
      <div class="vc-pts">${pointsBar()}</div>
      <div class="vc-acts">${RO ? '' : `
        <button class="vc-btn" data-act="undo"${undo.length ? '' : ' disabled'}>↶ 되돌리기</button>
        <button class="vc-btn" data-act="reset">↺ 처음부터</button>${ED ? '' : `
        <button class="vc-btn" data-act="share">🔗 링크 복사</button>
        <button class="vc-btn vc-share" data-act="upload">📤 파밍 빌드 공유</button>`}`}
      </div></div>` + roBar() + edBar();
  }
  function sumBox(only) {
    const li = r => `<li>${hl(r.t).replace(/\n/g, '<br>')}${r.x ? ` <span class="vc-x">×${r.k}</span>` : ''}</li>`;
    const all = summary(only);
    // 처음엔 포인트 가장 많이 쓴 별무리(맨 앞) — [전체]를 누르면 'all' (2026-10-28 사용자)
    const sel = only != null || sumSel === 'all' || all.length < 2 ? null : all.some(x => x.key === sumSel) ? sumSel : all[0].key;
    const gs = sel != null ? all.filter(x => x.key === sel) : all;
    const tabs = only == null && all.length > 1 ? `<div class="vc-stabs"><button class="vc-stab vc-sall${sel == null ? ' on' : ''}" data-act="sumsel" data-k="all">전체</button>${all.map(x =>
      `<button class="vc-stab${sel === x.key ? ' on' : ''}" data-act="sumsel" data-k="${x.key}" title="${esc(x.h)} · ${x.p < 0 ? x.n + '개' : '노드 ' + x.n + '개 · ' + x.p + '포인트'}"${x.key === 'g' ? ' data-g' : x.key === 'pt' ? ' data-pt' : ''}><img src="${esc(x.ic)}" alt=""><b>${x.n}</b></button>`).join('')}</div>` : '';
    const body = gs.length ? gs.map(x => x.key === 'g' || x.key === 'pt'
        ? `<li class="vc-sh ${x.key === 'g' ? 'vc-shg' : 'vc-shp'}"><img src="${esc(x.ic)}" alt="">${esc(x.h)}</li>` + x.rows.map(r => li(r).replace('<li>', `<li class="${x.key === 'g' ? 'vc-lg' : 'vc-lp'}">`)).join('')
        : (x.h ? `<li class="vc-sh">${esc(x.h)}</li>` : '') + x.rows.map(li).join('')).join('')
      : '<li class="vc-empty">찍은 노드가 없습니다</li>';
    return `<div class="vc-sum"><div class="vc-cap">${only != null ? '이 별무리 효과' : '전체 효과 합계'}</div>${tabs}<ul>${body}</ul></div>`;
  }
  // 그윽한 별무리 카드에 찍은 대형 노드(핵심)를 아이콘·효과로 바로 보여 준다 (2026-10-27 사용자)
  function bigPicks(c) {
    const ns = c.nodes.filter(n => n.kind === '대형 노드' && S[c.ci].has(n.id));
    return ns.length ? `<span class="vc-pk">${ns.map(n => `<span><img src="${ICON + n.icon}" alt=""><span>${hl(nodeText(n).replace(/\n+/g, ' · '))}</span></span>`).join('')}</span>` : '';
  }
  // 탐침 1칸·나침반 4칸 — 누르면 고르는 창 (공유 글 보기에서는 고른 칸만, 고르기 없음)
  const gItem = it => `<img class="q${it.q}" src="${esc(it.i)}" alt="" loading="lazy"><span class="vc-gt"><b class="q${it.q}">${esc(it.n)}</b>${it.e.map(l => `<small>${hl(l)}</small>`).join('')}</span>`;
  // 가로 5칸 — 탐침 1(왼쪽, 구분선) + 나침반 4, 그림만 · 이름·효과는 마우스 올리면 툴팁 (2026-10-28 사용자)
  function gearBox() {
    if (RO && !G.p && !G.c.some(x => x)) return '';
    const slot = (k, i, id) => {
      const it = (k === 'p' ? PBY : CBY).get(id);
      if (RO && !it) return '';
      const nm = k === 'p' ? '탐침' : '나침반 ' + (i + 1);
      return it ? `<button class="vc-ps vc-pg on q${it.q}${k === 'p' ? ' probe' : ''}" data-tk="${k}" data-ti="${i}"${RO ? '' : ` data-act="gpick" data-k="${k}" data-i="${i}"`} aria-label="${esc(it.n)}"><img src="${esc(it.i)}" alt="" loading="lazy"></button>`
        : `<button class="vc-ps vc-pg${k === 'p' ? ' probe' : ''}" data-act="gpick" data-k="${k}" data-i="${i}" aria-label="${nm} 고르기"><span>＋</span><small>${k === 'p' ? '탐침' : '나침반'}</small></button>`;
    };
    return `<div class="vc-sum vc-gear"><div class="vc-cap">탐침 · 나침반${RO ? '' : ' <small>누르면 고르기, 우클릭 비우기</small>'}</div><div class="vc-prow vc-grow">${slot('p', 0, G.p)}${G.c.map((id, i) => slot('c', i, id)).join('')}</div></div>`;
  }
  function gearTip(k, i) {
    const it = (k === 'p' ? PBY : CBY).get(k === 'p' ? G.p : G.c[i]); if (!it) return '';
    return `<div class="vc-ptt-h"><b class="q${it.q}">${esc(it.n)}</b><small>${k === 'p' ? '탐침' : '나침반 ' + (i + 1)}</small></div>${it.e.map(l => `<div>${hl(l)}</div>`).join('')}`;
  }
  // 정령 3칸 — 칸을 누르면 고르기, 옆 단계 칸에서 승급 단계 (공유 글 보기에서는 고른 칸만)
  // 칸에는 이름 + 고유 효과(승급 첫 줄)만, 고르기 창은 최고 승급 효과 전부
  const pItem = (pt, lv, brief) => `<img class="q${pt.q}" src="${esc(pt.i)}" alt="" loading="lazy"><span class="vc-gt"><b class="q${pt.q}">${esc(pt.n)}</b>${(pt.a[(lv || pt.a.length) - 1] || []).slice(0, brief ? 1 : 9).map(l => `<small>${hl(l)}</small>`).join('')}</span>`;
  // 가로 3칸 — 초상화 + 5시 방향 승급 숫자만, 이름·효과는 마우스 올리면 툴팁 (2026-10-28 사용자)
  function petBox() {
    if (!PETBY.size || (RO && !G.s.some(x => x))) return '';
    const slot = i => {
      const id = G.s[i], pt = PETBY.get(id), lv = G.l[i];
      if (RO && !pt) return '';
      return pt ? `<button class="vc-ps on q${pt.q}" data-pi="${i}"${RO ? '' : ` data-act="ppick" data-i="${i}"`} aria-label="${esc(pt.n)} 승급 ${lv}"><img src="${esc(pt.i)}" alt="" loading="lazy"><b>${lv}</b></button>`
        : `<button class="vc-ps" data-act="ppick" data-i="${i}" aria-label="정령 ${i + 1} 고르기"><span>＋</span></button>`;
    };
    return `<div class="vc-sum vc-pets"><div class="vc-cap">정령 <small>드롭 정령${RO ? '' : ' · 누르면 고르기·승급, 우클릭 비우기'}</small></div><div class="vc-prow">${[0, 1, 2].map(slot).join('')}</div></div>`;
  }
  function petTip(i) {
    const pt = PETBY.get(G.s[i]), lv = G.l[i]; if (!pt) return '';
    const GR = { 100: '레전드', 3: '레어', 2: '매직' };
    return `<div class="vc-ptt-h"><b class="q${pt.q}">${esc(pt.n)}</b><small>${GR[pt.q] || ''} · 승급 ${lv} / ${pt.a.length}</small></div>`
      // 승급 1단계 줄 수만큼이 기본 효과(단계가 오르면 수치·문구만 강해짐), 그 뒤에 붙는 줄이 승급 효과 (2026-10-28 사용자)
      + (() => { const L = pt.a[lv - 1] || [], nb = (pt.a[0] || []).length, sec = (h, ls) => ls.length ? `<div class="vc-ptt-s">${h}</div>${ls.map(l => `<div>${hl(l)}</div>`).join('')}` : '';
          return sec('기본 효과', L.slice(0, nb)) + sec('승급 효과', L.slice(nb)); })()
      + (pt.nd.length ? `<div class="vc-ptt-s">계약 노드</div>${merge(pt.nd).map(r => `<div>${hl(r.t)}${r.x ? ` <span class="vc-x">×${r.k}</span>` : ''}</div>`).join('')}` : '');
  }
  function pClear(i) {
    if (RO || !G.s[i]) return;
    snap(); G.s[i] = 0; G = normG(G); save(); render();
  }
  function pPicker(i) {
    const cur = G.s[i], other = new Set(G.s.filter((x, j) => j !== i && x));
    const flat = VOID_PET.map(pt => ({ id: pt.id, n: pt.n, e: (pt.a[pt.a.length - 1] || []).concat(pt.nd) }));
    const w = gRecs(flat), GR = { 100: '레전드', 3: '레어', 2: '매직' };
    const btn = (pt, tags) => `<button type="button" class="vc-gs${pt.id === cur ? ' cur' : ''}${tags ? ' rec' : ''}"${other.has(pt.id) ? ' disabled title="이미 다른 칸에 넣은 정령입니다"' : ''} data-pid="${pt.id}" data-s="${esc((pt.n + ' ' + pt.a.flat().concat(pt.nd).join(' ')).toLowerCase())}">${pItem(pt)}${tags ? `<em class="vc-gr">${tags.map(esc).join(' · ')}</em>` : ''}</button>`;
    // 명암의 불꽃(드롭 수량만 — 어디서나 쓰는 범용)은 추천에 늘 넣되 맨 아래 (2026-10-28 사용자)
    const ANY = VOID_PET.find(pt => pt.n === '명암의 불꽃');
    const rec = VOID_PET.filter(pt => w.has(pt.id) && pt !== ANY).sort((a, z) => w.get(z.id).n - w.get(a.id).n || z.q - a.q);
    if (ANY) { rec.push(ANY); w.set(ANY.id, { n: 0, t: ['범용'] }); }
    const groups = [100, 3, 2].map(q => { const l = VOID_PET.filter(pt => pt.q === q); return l.length ? `<div class="vc-gh">${GR[q]}</div>${l.map(pt => btn(pt)).join('')}` : ''; }).join('');
    const d = document.createElement('div'); d.className = 'vc-dim';
    d.innerHTML = `<div class="vc-dlg vc-gpk"><b>정령 ${i + 1}번 칸 고르기 <small>드롭 정령 · 효과는 최고 승급 기준</small></b>
      <div class="vc-gq"><input type="search" placeholder="이름·효과 검색" autocomplete="off"><button type="button" class="vc-btn" data-pid="0"${cur ? '' : ' disabled'}>비우기</button><button type="button" class="vc-btn" data-x>닫기</button></div>
      ${cur ? `<div class="vc-plvs"><span>${esc(PETBY.get(cur).n)} 승급</span>${PETBY.get(cur).a.map((_, j) => `<button type="button" class="vc-btn${G.l[i] === j + 1 ? ' on' : ''}" data-plv="${j + 1}">${j + 1}</button>`).join('')}</div>` : ''}
      <div class="vc-gl">${rec.length ? `<div class="vc-gh">찍은 재능 관련 추천</div>${rec.map(pt => btn(pt, w.get(pt.id).t)).join('')}` : ''}${groups}</div></div>`;
    document.body.appendChild(d);
    const close = () => d.remove(), inp = d.querySelector('input');
    d.addEventListener('click', e => {
      if (e.target === d || e.target.closest('[data-x]')) return close();
      const lb = e.target.closest('[data-plv]');
      if (lb) { snap(); G.l[i] = +lb.dataset.plv; G = normG(G); close(); save(); render(); return; }
      const b = e.target.closest('[data-pid]'); if (!b || b.disabled) return;
      const v = +b.dataset.pid;
      snap(); G.s[i] = v; G.l[i] = v ? petMax(v) : 0;
      G = normG(G); close(); save(); render();
    });
    inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); d.querySelectorAll('.vc-gl > [data-s]').forEach(b => { b.hidden = !!q && !b.dataset.s.includes(q); }); d.querySelectorAll('.vc-gh').forEach(h => { h.hidden = !!q; }); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    inp.focus();
  }
  function memoBox() {
    if (RO) { const m = (RO.item.memo || '').trim(); return m ? `<div class="vc-sum vc-memo"><div class="vc-cap">메모</div><div class="vc-mt" data-noi18n>${esc(m)}</div></div>` : ''; }
    return `<div class="vc-sum vc-memo"><div class="vc-cap">메모 <small id="vcMn">${M.length} / 500</small></div>
      <textarea maxlength="500" rows="3" placeholder="파밍 순서·나침반 조합 같은 메모 (공유할 때 함께 올라갑니다)">${esc(M)}</textarea></div>`;
  }
  // 찍은 별무리와 관련된 나침반·탐침 (2026-10-27 사용자) — [별무리 이름, 짧은 이름, 나침반 이름·효과에서 찾을 말]
  const REL = [
    [/^장비/, '장비', /비레전드|무장 나침반|장비 드롭/], [/^레전드 장비/, '레전드 장비', /레전드 장비/], [/^나침반/, '나침반', /나침반 드롭/],
    [/^화폐/, '화폐', /엠버|약탈 나침반|번영의 (아득|딥)/], [/^정벌/, '정벌', /전쟁의 신|신들/], [/^힘/, '힘', /힘의 신/], [/^사냥/, '사냥', /사냥의 여신/],
    [/^기계 재능/, '기계', /기계의 신/], [/^검은 물결/, '검은 물결', /검은 물결/], [/^검은 돛/, '검은 돛', /검은 돛|차원의 닻/], [/^큐브/, '큐브', /큐브|탐욕|야욕/],
    [/^미궁의 도시/, '미궁의 도시', /미궁의 도시/], [/^악몽/, '악몽', /나이트메어|꿈나라/], [/^괴담/, '괴담', /괴담|안개 도시/], [/^기계 인형/, '기계 인형', /클럽 게임/],
    [/^비콘/, '비콘', /비콘/], [/^설원/, '설원', /설원|스노우맨/], [/^타로/, '타로', /타로/], [/^군주/, '군주', /사막 도적/], [/수배/, '수배', /수배|보안 요원/],
    [/^감옥/, '감옥', /원죄의 감옥|타르타로스/], [/^이면세계/, '이면세계', /이면세계/], [/^블러드 러스트/, '블러드 러스트', /블러드 러스트/], [/^창조/, '창조', /창조/],
    [/^루나리아/, '루나리아', /루나/], [/^애프터라이트/, '애프터라이트', /애프터라이트|악령/],   // 악령 몬스터 = 애프터라이트 몹 (드롭 정령 3종은 이름·효과에 '애프터라이트'가 없다, 2026-10-28 사용자)
  ];
  function gRecs(list) {
    const w = new Map();
    CS.forEach(c => {
      const n = S[c.ci].size, r = n && REL.find(x => x[0].test(c.name));
      if (r) list.forEach(it => { if (r[2].test(it.n + ' ' + it.e.join(' '))) { const o = w.get(it.id) || { n: 0, t: [] }; o.n += n; o.t.push(r[1]); w.set(it.id, o); } });
    });
    return w;
  }
  function gClear(k, i) {
    if (RO || !(k === 'p' ? G.p : G.c[i])) return;
    snap(); if (k === 'p') G.p = 0; else G.c[i] = 0;
    G = normG(G); save(); render();
  }
  function gPicker(k, i) {
    const list = k === 'p' ? VOID_GEAR.p : VOID_GEAR.c, cur = k === 'p' ? G.p : G.c[i];
    const other = new Set(k === 'p' ? [] : G.c.filter((x, j) => j !== i && x));   // 다른 칸에 이미 넣은 나침반
    const w = gRecs(list), rec = list.filter(it => w.has(it.id)).sort((a, z) => w.get(z.id).n - w.get(a.id).n), rest = list.filter(it => !w.has(it.id));
    const btn = (it, tags) => `<button type="button" class="vc-gs${it.id === cur ? ' cur' : ''}${tags ? ' rec' : ''}"${other.has(it.id) ? ' disabled title="이미 다른 칸에 넣은 나침반입니다"' : ''} data-gid="${it.id}" data-s="${esc((it.n + ' ' + it.e.join(' ')).toLowerCase())}">${gItem(it)}${tags ? `<em class="vc-gr">${tags.map(esc).join(' · ')}</em>` : ''}</button>`;
    const d = document.createElement('div'); d.className = 'vc-dim';
    d.innerHTML = `<div class="vc-dlg vc-gpk"><b>${k === 'p' ? '탐침' : '나침반 ' + (i + 1) + '번 칸'} 고르기</b>
      <div class="vc-gq"><input type="search" placeholder="이름·효과 검색" autocomplete="off"><button type="button" class="vc-btn" data-gid="0"${cur ? '' : ' disabled'}>비우기</button><button type="button" class="vc-btn" data-x>닫기</button></div>
      <div class="vc-gl">${rec.length ? `<div class="vc-gh">찍은 재능 관련 추천</div>${rec.map(it => btn(it, w.get(it.id).t)).join('')}<div class="vc-gh">전체</div>` : ''}${rest.map(it => btn(it)).join('')}</div></div>`;
    document.body.appendChild(d);
    const close = () => d.remove(), inp = d.querySelector('input');
    d.addEventListener('click', e => {
      if (e.target === d || e.target.closest('[data-x]')) return close();
      const b = e.target.closest('[data-gid]'); if (!b || b.disabled) return;
      snap(); if (k === 'p') G.p = +b.dataset.gid; else G.c[i] = +b.dataset.gid;
      G = normG(G); close(); save(); render();
    });
    inp.addEventListener('input', () => { const q = inp.value.trim().toLowerCase(); d.querySelectorAll('.vc-gl > [data-s]').forEach(b => { b.hidden = !!q && !b.dataset.s.includes(q); }); d.querySelectorAll('.vc-gh').forEach(h => { h.hidden = !!q; }); });
    d.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    inp.focus();
  }
  function listView() {
    // 공유 글 보기에서는 찍은 별무리만 (2026-10-26 사용자)
    // 그윽한 재능 별무리는 맨 위 한 줄에 따로 고정, 나머지는 찍은 별무리 먼저 (원래 순서 유지) (2026-10-27 사용자)
    const ord = CS.filter(c => !RO || S[c.ci].size)
      .map((c, i) => [c, c.main ? 0 : S[c.ci].size ? 1 : 2, i]).sort((a, z) => a[1] - z[1] || a[2] - z[2]).map(x => x[0]);
    const cards = ord.map(c => {
      const k = S[c.ci].size;
      return `<button class="vc-card${k ? ' used' : ''}${c.main ? ' main' : ''}" data-open="${c.ci}">
        <img src="${ICON + c.icon}" alt="" loading="lazy">
        <span class="vc-cn"><b>${esc(c.name)}</b>${c.unlock ? `<small>${esc(c.unlock)}</small>` : ''}${c.main ? bigPicks(c) : ''}</span>
        <span class="vc-cu"><b>${k}</b>/${c.n}${c.main ? '<em>메인</em>' : ''}${freeHere(c) ? '<em class="free">자유</em>' : ''}<i style="--p:${Math.round(100 * k / Math.max(1, c.n))}%"></i></span>
      </button>`;
    }).join('');
    return top() + `<div class="vc-wrap"><div class="vc-grid">${cards}</div><div class="vc-side">${petBox()}${gearBox()}${memoBox()}${sumBox(null)}</div></div>
      <p class="vc-note">노드 1개 = 스타 재능 1 (시작 노드는 무료) · 그윽한 재능 별무리는 메인 스타 재능 ${VOID.main}포인트로만 찍습니다 · 최대 포인트는 tlidb 기준(스타 재능 ${VOID.star})이며 바뀔 수 있습니다.</p>`;
  }
  function nodeView(c) {
    const set = S[c.ci], [x0, y0, w, h] = c.box;
    const lines = c.links.map(([a, b]) => {
      const A = c.by.get(a), B = c.by.get(b), lit = on(c, a) && on(c, b);
      return `<line class="${lit ? 'on' : ''}" x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}"/>`;
    }).join('');
    const nodes = c.nodes.map(n => {
      const st = n.id === c.start ? 'start' : set.has(n.id) ? 'on' : (freeHere(c) || (c.par.get(n.id) || []).some(p => on(c, p))) ? 'next' : 'off';
      const r = n.r;
      return `<g class="vc-n ${st}${n.extra ? ' extra' : ''}${n.id === FREE_ID && c.main ? ' free' : ''}" data-id="${n.id}" transform="translate(${n.x} ${n.y})">
        <circle class="ring" r="${r + 7}"/><image href="${ICON + n.icon}" x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}"/></g>`;
    }).join('');
    const k = set.size;
    return top() + `<div class="vc-head">
        <button class="vc-btn" data-act="back">← 목록</button>
        <img src="${ICON + c.icon}" alt=""><b>${esc(c.name)}</b>
        <span class="vc-cnt">${k} / ${c.n}${c.main ? ' · 메인 스타 재능' : ''}</span>${freeHere(c) ? '<span class="vc-free">자유 찍기 — 이전 노드 없이 찍을 수 있습니다</span>' : ''}
        <button class="vc-btn" data-act="clear"${k ? '' : ' disabled'}>이 별무리 비우기</button>
        <span class="vc-hint">노드를 누르면 시작 노드까지 길이 함께 찍히고, 찍힌 노드를 누르거나 우클릭하면 그 아래 가지까지 빠집니다</span>
      </div>
      <div class="vc-wrap vc-tree-wrap">
        <div class="vc-tree"><svg viewBox="${x0} ${y0} ${w} ${h}" preserveAspectRatio="xMidYMid meet"><g class="vc-l">${lines}</g>${nodes}</svg><div class="vc-tip" id="vcTip"></div></div>
        <div class="vc-side"><div class="vc-info" id="vcInfo"><div class="vc-empty">노드에 마우스를 올리거나 누르면 효과가 보입니다</div></div>${sumBox(c.ci)}</div>
      </div>`;
  }
  function info(c, n) {
    const k = nodeCost(c, n);
    const cost = n.id === c.start ? '시작 노드 · 무료' : (c.main ? `메인 스타 재능 ${k.m}` + (k.s ? ` + 스타 재능 ${k.s}` : '') : `스타 재능 ${k.s}`);
    const L = a => (a || []).map(l => `<div>${hl(l).replace(/\n/g, '<br>')}</div>`).join('');
    return `<div class="vc-ik"><b>${esc(n.kind)}</b><small>${cost}</small></div>${L(n.map)}${n.fn ? `<div class="vc-fn">${L(n.fn)}</div>` : ''}` +
      (c.main && n.id === FREE_ID ? '<div class="vc-warn">찍으면 비 콘텐츠 재능 별무리(장비·레전드 장비·나침반·화폐·비콘)를 이전 노드 없이 찍을 수 있고, 빼면 그 별무리들이 모두 초기화됩니다</div>' : '');
  }
  function render() {
    app.innerHTML = view < 0 ? listView() : nodeView(CS[view]);
  }

  // ── 파밍 빌드 공유 (/api/vshare*, 2026-10-16) — 올리기·보기(?s=)·추천·수정·삭제·영상 요청(관리자 허가 뒤 보임) ──
  const MINE = 'tli_void_mine_v1';   // 이 브라우저가 올린 글 {id: 비밀번호} — 수정·삭제 때 미리 채운다
  const mine = () => { try { return JSON.parse(localStorage.getItem(MINE) || '{}') || {}; } catch (e) { return {}; } };
  const setMine = (id, pwd) => { try { const m = mine(); if (pwd) m[id] = pwd; else delete m[id]; localStorage.setItem(MINE, JSON.stringify(m)); } catch (e) {} };
  const ME = 'tli_void_author_v1';
  const api = (path, body) => fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {})
    .then(r => r.json().catch(() => ({ ok: false, error: '서버 응답을 읽지 못했습니다.' })), () => ({ ok: false, error: '서버에 닿지 못했습니다.' }));
  const kday = iso => iso ? new Date(Date.parse(iso) + 9 * 3600e3).toISOString().slice(0, 10) : '';
  function roBar() {
    if (!RO) return '';
    const it = RO.item, vids = (() => { try { return JSON.parse(it.videos || '[]'); } catch (e) { return []; } })();
    return `<div class="vc-ro">
      <div class="vc-ro-l"><small>공유된 파밍 빌드</small><b data-noi18n>${esc(it.title)}</b>
        <span class="vc-ro-m"><span data-noi18n>👤 ${esc(it.author)}</span> · ${kday(it.created_at)} · 👁 ${it.views || 0}</span></div>
      <div class="vc-ro-a">
        <button class="vc-btn vc-like${RO.liked ? ' on' : ''}" data-act="like">👍 추천 <b>${it.likes || 0}</b></button>
        <button class="vc-btn vc-share" data-act="take">📥 내 연습판으로 가져오기</button>
        <button class="vc-btn" data-act="copylink">🔗 링크 복사</button>
        <button class="vc-btn" data-act="vreq">🎬 영상 추가</button>
        <button class="vc-btn" data-act="edit">수정</button>
        <button class="vc-btn" data-act="del">삭제</button>
        <button class="vc-btn" data-act="exit">✕ 닫기</button>
      </div>
      ${vids.length ? `<div class="vc-vids">${vids.map(v => `<div class="vc-yt" data-id="${esc(v.id)}" data-start="${+v.start || 0}"><img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy"><span>▶</span><em data-noi18n>${esc(v.title || '')}</em></div>`).join('')}</div>` : ''}
      ${RO.vwait ? `<div class="vc-ro-n">승인 대기 중인 영상 ${RO.vwait}개 — 관리자가 확인한 뒤 보입니다</div>` : ''}
    </div>`;
  }
  function edBar() {
    if (!ED) return '';
    return `<div class="vc-ro vc-ed">
      <div class="vc-ro-l"><small>공유 글 수정 중</small><b data-noi18n>${esc(ED.item.title)}</b>
        <span class="vc-ro-m">노드·정령·탐침·나침반·메모를 고친 뒤 저장하세요 — 내 연습판에는 저장되지 않습니다</span></div>
      <div class="vc-ro-a">
        <button class="vc-btn vc-share" data-act="edsave">💾 저장</button>
        <button class="vc-btn" data-act="edcancel">취소</button>
      </div></div>`;
  }
  // 수정 모드 들어가기 — 글 배치·메모를 그대로 연습판처럼 편다
  function edStart(pwd) {
    ED = { item: RO.item, pwd, admin: RO.admin };
    M = (RO.item.memo || '').slice(0, 500); RO = null; undo = [];
    history.replaceState(null, '', location.pathname + '?s=' + ED.item.id); render(); window.scrollTo(0, 0);
    toast('수정 모드 — 고친 뒤 위의 「저장」을 누르세요');
  }
  async function edEnd() {   // 저장·취소 뒤 글 보기로 돌아간다 (서버에서 다시 받아 옴)
    const id = ED.item.id; ED = null; view = -1;
    if (!(await openShared(id))) { S = CS.map(() => new Set()); G = emptyG(); M = ''; load(); }
    render();
  }
  function edAct(a) {
    if (a === 'edcancel') return wtAsk('수정을 그만둘까요?\n고친 내용은 저장되지 않습니다.', edEnd);
    if (!S.some(x => x.size)) return toast('찍은 노드가 없습니다');
    const it = ED.item;
    dialog('글 수정 저장', [{ k: 'title', label: '제목', value: it.title }, { k: 'author', label: '작성자', value: it.author }],
      '저장', async v => {
        const r = await api('/api/vshare/edit', { id: it.id, pwd: ED.admin ? undefined : ED.pwd, title: v.title, author: v.author, memo: M.trim(), code: encode() });
        if (!r.ok) return r.error;
        if (!ED.admin) setMine(it.id, ED.pwd);
        await edEnd(); toast('수정했습니다'); return '';
      }, `지금 찍은 배치${G.p || G.c.some(x => x) ? '·탐침·나침반' : ''}${G.s.some(x => x) ? '·정령' : ''}${M.trim() ? '·메모' : ''}로 글을 바꿉니다.`);
  }
  // 입력 창 — fields: [{k, label, type, value, ph, opt}] · 확인 시 onOk(values) 가 오류 문구를 돌려주면 창을 닫지 않는다
  function dialog(title, fields, okLabel, onOk, note) {
    const d = document.createElement('div'); d.className = 'vc-dim';
    d.innerHTML = `<form class="vc-dlg"><b>${title}</b>${fields.map(f => f.type === 'check'
        ? `<label class="vc-chk"><input type="checkbox" name="${f.k}"${f.value ? ' checked' : ''}> ${f.label}</label>`
        : f.type === 'area' ? `<label><span>${f.label}${f.opt ? ' <i>(선택)</i>' : ''}</span><textarea name="${f.k}" maxlength="500" rows="4">${esc(f.value || '')}</textarea></label>`
        : `<label><span>${f.label}${f.opt ? ' <i>(선택)</i>' : ''}</span><input name="${f.k}" type="${f.type || 'text'}" value="${esc(f.value || '')}" placeholder="${esc(f.ph || '')}" autocomplete="off"></label>`).join('')}
      ${note ? `<p class="vc-dn">${note}</p>` : ''}<p class="vc-err"></p>
      <div class="vc-dact"><button type="button" class="vc-btn" data-x>취소</button><button class="vc-btn vc-share">${okLabel}</button></div></form>`;
    document.body.appendChild(d);
    const f = d.querySelector('form'), err = d.querySelector('.vc-err'), close = () => d.remove();
    d.addEventListener('click', e => { if (e.target === d || e.target.hasAttribute('data-x')) close(); });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const v = {}; fields.forEach(x => { const el = f.elements[x.k]; v[x.k] = x.type === 'check' ? el.checked : el.value.trim(); });
      const btn = f.querySelector('.vc-share'); btn.disabled = true;
      const m = await onOk(v); btn.disabled = false;
      if (m) err.textContent = m; else close();
    });
    const first = f.querySelector('input:not([type=checkbox])'); if (first) first.focus();
  }
  function upload() {
    if (!S.some(x => x.size)) return toast('찍은 노드가 없습니다');
    let me = {}; try { me = JSON.parse(localStorage.getItem(ME) || '{}') || {}; } catch (e) {}
    dialog('📤 파밍 빌드 공유', [
      { k: 'title', label: '제목', value: '', ph: '예: 화폐 위주 나침반 파밍 (2~40자)' },
      { k: 'author', label: '작성자', value: me.author || '', ph: '한글·영문·숫자 2~10자' },
      { k: 'pwd', label: '삭제·수정 비밀번호', type: 'password', value: me.pwd || '', ph: '4~20자' },
      { k: 'video', label: '가이드 영상 (유튜브 주소)', opt: 1, ph: 'https://youtu.be/…' },
    ], '올리기', async v => {
      const r = await api('/api/vshare', { title: v.title, author: v.author, pwd: v.pwd, code: encode(), memo: M.trim() || undefined, video: v.video || undefined });
      if (!r.ok) {
        if (r.dup) { location.href = location.pathname + '?s=' + r.dup; return ''; }
        return r.error;
      }
      try { localStorage.setItem(ME, JSON.stringify({ author: v.author, pwd: v.pwd })); } catch (e) {}
      setMine(r.id, v.pwd);
      if (window.wtEv) window.wtEv('void_upload');
      if (r.vmsg) alert('글은 올라갔지만 영상은 등록하지 못했습니다: ' + r.vmsg);
      location.href = location.pathname + '?s=' + r.id;
      return '';
    }, `현재 찍은 배치${G.p || G.c.some(x => x) ? '·탐침·나침반' : ''}${G.s.some(x => x) ? '·정령' : ''}${M.trim() ? '·메모' : ''}가 그대로 올라갑니다. 영상은 관리자가 확인한 뒤 보입니다.`);
  }
  async function openShared(id) {
    const r = await api('/api/vshare?id=' + encodeURIComponent(id));
    if (!r.ok) { toast(r.error || '파밍 빌드를 불러오지 못했습니다'); return false; }
    try { S = decode(r.item.code); G = S.g; } catch (e) { toast('배치 코드를 읽지 못했습니다'); return false; }
    RO = r; undo = [];
    document.title = r.item.title + ' · 허공의 성도 파밍 빌드 · 미니토치DB';
    return true;
  }
  async function roAct(a) {
    const it = RO.item, id = it.id, pw = mine()[id] || '';
    if (a === 'like') {
      const r = await api('/api/vlike', { id });
      if (!r.ok) return toast(r.error);
      it.likes = r.likes; RO.liked = true; render(); toast(r.already ? '이미 추천했습니다' : '추천했습니다');
    } else if (a === 'take') {
      let my = null; try { my = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
      const has = my && my.s && Object.keys(my.s).length;
      if (has && !wtOk('이 파밍 빌드를 내 연습판으로 가져올까요?\n지금 찍어 둔 배치는 덮어씁니다.', () => roAct(a))) return;
      M = (RO.item.memo || '').slice(0, 500); RO = null; save(); toast('내 연습판으로 가져왔습니다');
      history.replaceState(null, '', location.pathname + location.hash); render();
    } else if (a === 'copylink') {
      const u = location.origin + location.pathname + '?s=' + id;
      (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => toast('공유 링크를 복사했습니다'), () => wtCopyBox('공유 링크', u));
    } else if (a === 'exit') {
      RO = null; S = CS.map(() => new Set()); G = emptyG(); M = ''; load(); undo = [];
      history.replaceState(null, '', location.pathname); document.title = '허공의 성도 시뮬레이터 · 토치라이트 인피니트 · 미니토치DB'; render();
    } else if (a === 'vreq') {
      dialog('🎬 가이드 영상 추가', [{ k: 'video', label: '유튜브 주소', ph: 'https://youtu.be/…' }, { k: 'pwd', label: '글 비밀번호', type: 'password', value: pw }],
        '요청', async v => { const r = await api('/api/vshare/video-req', { id, pwd: v.pwd, video: v.video }); if (!r.ok) return r.error; RO.vwait = (RO.vwait || 0) + 1; render(); toast('요청했습니다 — 관리자가 확인한 뒤 보입니다'); return ''; },
        '작성자만 요청할 수 있고, 관리자가 확인한 뒤 글에 붙습니다.');
    } else if (a === 'edit') {   // 비밀번호 확인 → 수정 모드 (화면에서 바로 고치고 저장, 2026-10-28 사용자)
      if (RO.admin) return edStart('');
      dialog('글 수정', [{ k: 'pwd', label: '글 비밀번호', type: 'password', value: pw }], '수정하기', async v => {
        const r = await api('/api/vshare/edit', { id, pwd: v.pwd, check: true });
        if (!r.ok) return r.error;
        // 비밀번호가 맞은 지금이 '내 계정에 연결할까요?' 를 묻기 가장 좋은 때 (2026-10-30 사용자).
        // 연결해 두면 다음부터 비밀번호 없이 본인이 고치고 지운다.
        if (r.claimable && confirm(`이 글을 내 디스코드 계정(${r.who})에 연결할까요?\n\n연결하면 다음부터는 비밀번호 없이 고치고 지울 수 있고,\n글쓴이 이름 옆에 인증 표시가 붙습니다.\n(나중에 해도 됩니다)`)) {
          const c = await api('/api/claim', { id, pwd: v.pwd });
          toast(c.ok ? '🔗 내 계정에 연결했습니다' : '연결하지 못했습니다: ' + (c.error || ''));
        }
        setMine(id, v.pwd); edStart(v.pwd); return '';
      }, '확인되면 이 화면에서 노드·정령·탐침·나침반·메모를 고친 뒤 저장할 수 있습니다.');
    } else if (a === 'del') {
      dialog('글 삭제', RO.admin ? [] : [{ k: 'pwd', label: '글 비밀번호', type: 'password', value: pw }], '삭제', async v => {
        const r = await api('/api/vshare/delete', { id, pwd: v.pwd });
        if (!r.ok) return r.error;
        setMine(id, null); location.href = '/tli/farm/'; return '';
      }, RO.admin ? '관리자 권한으로 지웁니다.' : '지우면 되돌릴 수 없습니다.');
    }
  }

  // ── 이벤트 ──
  app.addEventListener('click', e => {
    const t = e.target.closest('[data-open],[data-act],.vc-n');
    if (!t) return;
    if (t.dataset.open != null) { view = +t.dataset.open; history.replaceState(null, '', '#' + CS[view].page); render(); window.scrollTo(0, 0); return; }
    if (t.classList.contains('vc-n')) { const c = CS[view]; toggle(c, t.dataset.id); showInfo(c, c.by.get(t.dataset.id)); return; }
    const a = t.dataset.act;
    if (RO && ['like', 'take', 'copylink', 'exit', 'vreq', 'edit', 'del'].includes(a)) return roAct(a);
    if (ED && (a === 'edsave' || a === 'edcancel')) return edAct(a);
    if (a === 'upload') return upload();
    if (a === 'sumsel') { sumSel = t.dataset.k || null; render(); return; }
    if (a === 'back') { view = -1; history.replaceState(null, '', location.pathname + location.search); render(); }
    else if (a === 'undo' && undo.length) popUndo();
    else if (a === 'reset') { const go = () => { snap(); S = CS.map(() => new Set()); G = emptyG(); save(); render(); }; if (!S.some(x => x.size) && !hasG(G)) go(); else wtAsk('찍은 노드와 나침반·탐침·정령을 모두 지울까요?', go); }
    else if (a === 'gpick') gPicker(t.dataset.k, +t.dataset.i);
    else if (a === 'gclear') gClear(t.dataset.k, +t.dataset.i);
    else if (a === 'ppick') pPicker(+t.dataset.i);
    else if (a === 'pclear') pClear(+t.dataset.i);
    else if (a === 'clear') {
      const hadFree = freeOn(); snap(); S[view] = new Set();
      if (hadFree && !freeOn()) CS.forEach(x => { if (x.ng) S[x.ci] = new Set(); });   // 자유 찍기 노드가 빠짐 → 비 콘텐츠 별무리 초기화
      save(); render();
    }
    else if (a === 'share') {
      if (!S.some(x => x.size)) return toast('찍은 노드가 없습니다');
      const u = location.origin + location.pathname + '?c=' + encode();
      (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => toast('공유 링크를 복사했습니다'), () => wtCopyBox('공유 링크', u));
      if (window.wtEv) window.wtEv('void_share');
    }
  });
  app.addEventListener('input', e => {
    if (!e.target.matches('.vc-memo textarea')) return;
    M = e.target.value.slice(0, 500); save();
    const n = document.getElementById('vcMn'); if (n) n.textContent = M.length + ' / 500';
  });
  // 우클릭 = 포인트 빼기(찍힌 노드와 그 아래 가지) — 노드 화면에선 브라우저 메뉴를 막는다 (2026-10-16)
  app.addEventListener('contextmenu', e => {
    const gs = e.target.closest('.vc-ps[data-act=gpick].on');
    if (gs) { e.preventDefault(); gClear(gs.dataset.k, +gs.dataset.i); return; }
    const ps = e.target.closest('.vc-ps[data-act=ppick].on');
    if (ps) { e.preventDefault(); pClear(+ps.dataset.i); return; }
    if (view < 0 || !e.target.closest('.vc-tree')) return;
    e.preventDefault();
    const g = e.target.closest('.vc-n'); if (!g) return;
    const c = CS[view], id = g.dataset.id;
    if (S[c.ci].has(id)) { toggle(c, id); showInfo(c, c.by.get(id)); }
  });
  // 빠르게 여러 번 누를 때 글자·그림이 선택(드래그)되지 않게
  app.addEventListener('mousedown', e => { if (e.detail > 1 && e.target.closest('.vc-tree, .vc-card')) e.preventDefault(); });
  app.addEventListener('dragstart', e => { if (e.target.closest('.vc-tree')) e.preventDefault(); });
  function showInfo(c, n) { const el = document.getElementById('vcInfo'); if (el && n) el.innerHTML = info(c, n); }
  // 정령 칸 툴팁 — 마우스 올리면 이름·승급·효과 (터치 기기는 누르면 고르기 창)
  let ptip = null;
  app.addEventListener('mouseover', e => {
    const b = e.target.closest('.vc-ps.on');
    if (!b) { if (ptip) ptip.classList.remove('on'); return; }
    if (!ptip) { ptip = document.createElement('div'); ptip.className = 'vc-ptt'; document.body.appendChild(ptip); }
    ptip.innerHTML = b.dataset.tk ? gearTip(b.dataset.tk, +b.dataset.ti) : petTip(+b.dataset.pi);
    ptip.classList.toggle('g', !!b.dataset.tk); ptip.classList.add('on');
    const r = b.getBoundingClientRect(), w = ptip.offsetWidth, h = ptip.offsetHeight;
    let x = Math.min(innerWidth - w - 8, Math.max(8, r.left + r.width / 2 - w / 2)), y = r.bottom + 8;
    if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);
    ptip.style.left = x + 'px'; ptip.style.top = y + 'px';
  });
  app.addEventListener('mouseleave', () => { if (ptip) ptip.classList.remove('on'); });
  app.addEventListener('click', () => { if (ptip) ptip.classList.remove('on'); }, true);
  app.addEventListener('mouseover', e => {
    const g = e.target.closest('.vc-n'); if (!g || view < 0) return;
    const c = CS[view]; showInfo(c, c.by.get(g.dataset.id));
    const tip = document.getElementById('vcTip'), box = tip && tip.parentElement.getBoundingClientRect(), r = g.getBoundingClientRect();
    if (!tip) return;
    tip.innerHTML = info(c, c.by.get(g.dataset.id)); tip.classList.add('on');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = r.right - box.left + 8, y = r.top - box.top - 4;
    if (x + tw > box.width) x = r.left - box.left - tw - 8;
    if (y + th > box.height) y = Math.max(0, box.height - th);
    tip.style.left = Math.max(0, x) + 'px'; tip.style.top = y + 'px';
  });
  // 공유 글의 영상 — 누르면 그 자리에서 재생
  app.addEventListener('click', e => {
    const y = e.target.closest('.vc-yt'); if (!y || y.querySelector('iframe')) return;
    y.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(y.dataset.id)}?autoplay=1&start=${+y.dataset.start || 0}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
    y.classList.add('play');
  });
  app.addEventListener('mouseout', e => { if (e.target.closest('.vc-n')) { const tip = document.getElementById('vcTip'); if (tip) tip.classList.remove('on'); } });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && undo.length) { e.preventDefault(); popUndo(); }
    else if (e.key === 'Escape' && view >= 0) { view = -1; history.replaceState(null, '', location.pathname); render(); }
  });

  // ── 시작: 저장본 → 공유 글(?s=) 또는 공유 링크(?c=) → 주소의 #별무리 ──
  load();
  const sid = new URLSearchParams(location.search).get('s');
  const q = sid ? null : new URLSearchParams(location.search).get('c');
  if (q) {
    try {
      const got = decode(q);
      const same = got.every((s, i) => s.size === S[i].size && [...s].every(x => S[i].has(x))) && JSON.stringify(got.g) === JSON.stringify(G);
      if (same || (!S.some(x => x.size) && !hasG(G))) { S = got; G = got.g; save(); }
      else wtAsk('공유받은 허공의 성도 배치를 불러올까요?\n지금 찍어 둔 배치는 덮어씁니다.', () => { S = got; G = got.g; save(); render(); });
    } catch (e) { toast('공유 링크를 읽지 못했습니다'); }
    history.replaceState(null, '', location.pathname + location.hash);
  }
  const hp = decodeURIComponent(location.hash.slice(1));
  if (hp) { const c = CS.find(x => x.page === hp); if (c) view = c.ci; }
  if (sid) openShared(sid).then(ok => { if (!ok) history.replaceState(null, '', location.pathname + location.hash); render(); });
  else render();
})();
