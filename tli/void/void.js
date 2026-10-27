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
  const hl = s => esc(s).replace(/([+\-]?\d+(?:\.\d+)?%?)/g, '<b class="vc-num">$1</b>');

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
  const emptyG = () => ({ p: 0, c: [0, 0, 0, 0] });
  // 같은 나침반은 한 칸에만 (2026-10-27 사용자) — 저장본·공유 코드에 겹친 게 있으면 뒤 칸을 비운다
  const normG = g => { const seen = new Set(); return { p: PBY.has(+(g && g.p)) ? +g.p : 0, c: [0, 1, 2, 3].map(i => { const v = +((g && g.c) || [])[i]; if (!CBY.has(v) || seen.has(v)) return 0; seen.add(v); return v; }).filter(x => x).concat([0, 0, 0, 0]).slice(0, 4) }; };   // 빈칸은 뒤로 — 위 칸이 비면 아래 나침반이 올라온다
  const hasG = g => !!(g.p || g.c.some(x => x));
  let G = emptyG();
  let M = '';   // 메모 500자 이내 — 연습판에 저장되고 파밍 빌드 공유 때 글과 함께 올라간다 (2026-10-27 사용자)
  let view = -1;            // -1 = 목록, 아니면 별무리 번호
  let undo = [];
  const load = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.s) S = CS.map(c => new Set((o.s[c.key] || []).filter(id => c.by.has(id) && id !== c.start))); if (o && o.g) G = normG(o.g); if (o && typeof o.m === 'string') M = o.m.slice(0, 500); } catch (e) {} };
  let RO = null;   // 공유 글 보기 중(?s=) — {item, liked, admin, vwait} · 이때 S 는 공유 배치이고 저장하지 않는다
  const save = () => { if (RO) return; try { const s = {}; CS.forEach(c => { if (S[c.ci].size) s[c.key] = [...S[c.ci]]; }); const o = { v: 1, s }; if (hasG(G)) o.g = G; if (M) o.m = M; localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} };
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
    return [...g.values()].map(e => {
      if (!e.tpl.includes('\u0000')) return { t: e.tpl, k: e.k, x: e.k > 1 };
      const v = Math.round(e.v * 100) / 100;
      return { t: e.tpl.replace('\u0000', (e.sign && v >= 0 ? '+' : '') + v), k: e.k };
    });
  }
  const nodeLines = c => [...S[c.ci]].flatMap(id => { const n = c.by.get(id); return (n.map || []).concat(n.fn || []); });
  // 전체 합계는 별무리별·탐침·나침반 묶음으로 나눠 구분선과 제목을 단다 (2026-10-28 사용자)
  function summary(only) {
    if (only != null) { const c = CS.find(x => x.ci === only); return c ? [{ rows: merge(nodeLines(c)) }] : []; }
    const out = CS.filter(c => S[c.ci].size).map(c => ({ h: c.name, rows: merge(nodeLines(c)) }));
    const gl = [PBY.get(G.p)].concat(G.c.map(id => CBY.get(id))).filter(Boolean).flatMap(it => it.e);
    if (gl.length) out.push({ h: '탐침 · 나침반', rows: merge(gl) });
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
    if (hasG(G)) { vi(GKEY); vi(5); [G.p].concat(G.c).forEach(vi); }   // 서버(voidPts)·옛 화면은 모르는 key 로 보고 건너뛴다
    return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(code) {
    const s = atob(code.replace(/-/g, '+').replace(/_/g, '/')), b = [...s].map(ch => ch.charCodeAt(0));
    let i = 0; const vi = () => { let n = 0, sh = 0, x; do { x = b[i++]; if (x == null) throw 0; n |= (x & 127) << sh; sh += 7; } while (x & 128); return n; };
    if (vi() !== 1) throw 0;
    const out = CS.map(() => new Set());
    let g = null;
    while (i < b.length) {
      const key = vi(), k = vi();
      if (key === GKEY) { const a = []; for (let j = 0; j < k; j++) a.push(vi()); g = normG({ p: a[0], c: a.slice(1) }); continue; }
      const c = BYKEY.get(key); let p = 0;
      for (let j = 0; j < k; j++) { p += vi(); if (c) { const id = String(+c.start + p); if (c.by.has(id) && id !== c.start) out[c.ci].add(id); } }
    }
    const keep = S; S = out;   // 그윽한(자유 찍기 노드) 먼저 정리해야 비 콘텐츠 별무리 판정이 맞다
    CS.filter(c => c.main).concat(CS.filter(c => !c.main)).forEach(prune);
    S = keep;
    out.g = g || emptyG();
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
        <button class="vc-btn" data-act="reset">↺ 처음부터</button>
        <button class="vc-btn" data-act="share">🔗 링크 복사</button>
        <button class="vc-btn vc-share" data-act="upload">📤 파밍 빌드 공유</button>`}
      </div></div>` + roBar();
  }
  function sumBox(only) {
    const li = r => `<li>${hl(r.t).replace(/\n/g, '<br>')}${r.x ? ` <span class="vc-x">×${r.k}</span>` : ''}</li>`;
    const gs = summary(only);
    const body = gs.length ? gs.map(x => (x.h ? `<li class="vc-sh">${esc(x.h)}</li>` : '') + x.rows.map(li).join('')).join('')
      : '<li class="vc-empty">찍은 노드가 없습니다</li>';
    return `<div class="vc-sum"><div class="vc-cap">${only != null ? '이 별무리 효과' : '전체 효과 합계'}</div><ul>${body}</ul></div>`;
  }
  // 그윽한 별무리 카드에 찍은 대형 노드(핵심)를 아이콘·효과로 바로 보여 준다 (2026-10-27 사용자)
  function bigPicks(c) {
    const ns = c.nodes.filter(n => n.kind === '대형 노드' && S[c.ci].has(n.id));
    return ns.length ? `<span class="vc-pk">${ns.map(n => `<span><img src="${ICON + n.icon}" alt=""><span>${hl(nodeText(n).replace(/\n+/g, ' · '))}</span></span>`).join('')}</span>` : '';
  }
  // 탐침 1칸·나침반 4칸 — 누르면 고르는 창 (공유 글 보기에서는 고른 칸만, 고르기 없음)
  const gItem = it => `<img class="q${it.q}" src="${esc(it.i)}" alt="" loading="lazy"><span class="vc-gt"><b class="q${it.q}">${esc(it.n)}</b>${it.e.map(l => `<small>${hl(l)}</small>`).join('')}</span>`;
  function gearBox() {
    if (RO && !hasG(G)) return '';
    const row = (k, i, id) => {
      const it = (k === 'p' ? PBY : CBY).get(id);
      if (RO && !it) return '';
      return `<div class="vc-gw"><button class="vc-gs${it ? ' on' : ''}"${RO ? ' disabled' : ` data-act="gpick" data-k="${k}" data-i="${i}"`}${it && !RO ? ' title="누르면 바꾸기 · 우클릭하면 비우기"' : ''}>${it ? gItem(it) : `<span class="vc-gph">＋ ${k === 'p' ? '탐침' : '나침반 ' + (i + 1)} 고르기</span>`}</button>${it && !RO ? `<button class="vc-gx" data-act="gclear" data-k="${k}" data-i="${i}" aria-label="비우기" title="비우기">✕</button>` : ''}</div>`;
    };
    return `<div class="vc-sum vc-gear"><div class="vc-cap">탐침 · 나침반</div>${row('p', 0, G.p)}${G.c.map((id, i) => row('c', i, id)).join('')}</div>`;
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
    [/^루나리아/, '루나리아', /루나/], [/^애프터라이트/, '애프터라이트', /애프터라이트/],
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
    return top() + `<div class="vc-wrap"><div class="vc-grid">${cards}</div><div class="vc-side">${gearBox()}${memoBox()}${sumBox(null)}</div></div>
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
    }, `현재 찍은 배치${hasG(G) ? '·탐침·나침반' : ''}${M.trim() ? '·메모' : ''}가 그대로 올라갑니다. 영상은 관리자가 확인한 뒤 보입니다.`);
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
    } else if (a === 'edit') {
      dialog('글 수정', [{ k: 'title', label: '제목', value: it.title }, { k: 'author', label: '작성자', value: it.author },
        { k: 'memo', label: '메모 (500자 이내)', type: 'area', value: it.memo || '', opt: 1 },
        { k: 'pwd', label: '글 비밀번호', type: 'password', value: pw }, { k: 'cur', label: '배치를 내 연습판의 지금 배치(탐침·나침반 포함)로 바꾸기', type: 'check' }],
        '저장', async v => {
          let code;
          if (v.cur) {
            let my = null; try { my = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
            const keep = S, keepG = G; S = CS.map(c => new Set(((my && my.s && my.s[c.key]) || []).filter(x => c.by.has(x)))); G = normG(my && my.g);
            code = S.some(x => x.size) ? encode() : null; S = keep; G = keepG;
            if (!code) return '내 연습판에 찍은 노드가 없습니다.';
          }
          const r = await api('/api/vshare/edit', { id, pwd: RO.admin ? undefined : v.pwd, title: v.title, author: v.author, memo: v.memo, code });
          if (!r.ok) return r.error;
          setMine(id, v.pwd); await openShared(id); render(); toast('수정했습니다'); return '';
        });
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
    if (a === 'upload') return upload();
    if (a === 'back') { view = -1; history.replaceState(null, '', location.pathname + location.search); render(); }
    else if (a === 'undo' && undo.length) popUndo();
    else if (a === 'reset') { const go = () => { snap(); S = CS.map(() => new Set()); G = emptyG(); save(); render(); }; if (!S.some(x => x.size) && !hasG(G)) go(); else wtAsk('찍은 노드와 나침반·탐침을 모두 지울까요?', go); }
    else if (a === 'gpick') gPicker(t.dataset.k, +t.dataset.i);
    else if (a === 'gclear') gClear(t.dataset.k, +t.dataset.i);
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
    const gs = e.target.closest('.vc-gs[data-act=gpick].on');
    if (gs) { e.preventDefault(); gClear(gs.dataset.k, +gs.dataset.i); return; }
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
