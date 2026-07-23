(() => {
  "use strict";
  const api = window.BANDA_MOBILE_VIEW_MODEL;
  const shell = window.BANDA_MOBILE_SHELL;
  const root = document.querySelector(".mcs-root");
  const view = root?.querySelector(".mcs-view");
  const main = root?.querySelector(".mcs-main");
  const nav = root?.querySelector(".mcs-nav");
  if (!api || !shell || !root || !view || !main || !nav) return;

  const states = new Map();
  let busy = false;
  let queued = false;
  const css = document.createElement("style");
  css.id = "banda-mobile-spells-styles";
  css.textContent = `@media(max-width:820px){
.a11-cast{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.a11-tools{display:grid;gap:9px}.a11-search{width:100%;min-height:46px;box-sizing:border-box;padding:0 13px;border:1px solid var(--mb);border-radius:12px;color:var(--mt);background:#0b110d;font:600 15px system-ui}.a11-search:focus,.a11-chip:focus-visible,.a11-spell summary:focus-visible{outline:2px solid var(--ma);outline-offset:2px}.a11-chips{display:flex;gap:7px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}.a11-chip{min-height:44px;flex:none;padding:0 12px;border:1px solid var(--mb);border-radius:999px;color:var(--mm);background:var(--mp);font:800 10px system-ui}.a11-chip[aria-pressed=true]{color:var(--ma);background:rgba(91,176,108,.16)}.a11-count{margin:8px 0 0;color:var(--mm);font-size:10px;text-align:right}.a11-group{display:grid;gap:8px;margin-top:16px}.a11-group[hidden],.a11-spell[hidden]{display:none}.a11-group h3{display:flex;justify-content:space-between;margin:0;color:var(--mt);font-size:11px;letter-spacing:.1em;text-transform:uppercase}.a11-group h3 span{color:var(--mm);font-size:9px;letter-spacing:0}.a11-list{display:grid;gap:8px}.a11-spell{border:1px solid var(--mb);border-radius:15px;background:linear-gradient(rgba(23,32,25,.94),rgba(15,22,17,.94));overflow:hidden}.a11-spell summary{min-height:64px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:11px 12px;cursor:pointer;list-style:none}.a11-spell summary::-webkit-details-marker{display:none}.a11-title strong{display:block;overflow:hidden;font-size:14px;text-overflow:ellipsis;white-space:nowrap}.a11-title small{display:block;margin-top:3px;color:var(--mm);font-size:10px}.a11-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.a11-tag{padding:3px 6px;border:1px solid var(--mbs);border-radius:999px;color:var(--mm);font-size:8px;font-weight:800}.a11-tag.ok{color:var(--ma)}.a11-tag.warn{color:var(--mw)}.a11-arrow{color:var(--ma);font-size:18px}.a11-spell[open] .a11-arrow{transform:rotate(90deg)}.a11-body{display:grid;gap:10px;padding:12px;border-top:1px solid var(--mbs)}.a11-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.a11-meta div,.a11-act{padding:9px;border:1px solid var(--mbs);border-radius:10px;background:rgba(0,0,0,.14)}.a11-meta span{display:block;color:var(--mm);font-size:8px;font-weight:800;text-transform:uppercase}.a11-meta strong{display:block;margin-top:3px;font-size:11px;overflow-wrap:anywhere}.a11-body p{margin:0;color:var(--mm);font-size:11px;line-height:1.5;white-space:pre-line}.a11-act strong{font-size:12px}.a11-slot{width:44px;height:44px;border:1px solid var(--mb);border-radius:10px;color:var(--mt);background:var(--mp2);font:700 21px system-ui}.a11-empty{margin-top:14px}@media(max-width:360px){.a11-cast{grid-template-columns:repeat(2,minmax(0,1fr))}.a11-cast .mcs-stat:last-child{grid-column:1/-1}}}`;
  document.head.append(css);

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/gi, " ").trim().toLowerCase();
  const num = (v) => Number.isFinite(Number(v)) ? Number(v) : null;
  const int = (v, f = 0) => num(v) === null ? f : Math.round(Number(v));
  const sign = (v) => num(v) === null ? "—" : Number(v) >= 0 ? `+${Number(v)}` : String(Number(v));
  const plain = (v) => {
    const t = document.createElement("template");
    t.innerHTML = String(v || "").replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n");
    return (t.content.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
  };
  const state = (id) => {
    if (!states.has(id)) states.set(id, { query: "", facet: "all", level: "all", open: new Set() });
    return states.get(id);
  };
  const selected = () => !root.hidden && nav.querySelector('[data-tab="spells"]')?.getAttribute("aria-selected") === "true";
  const sectionHead = (title, hint = "") => `<header class="mcs-section-title"><h3>${esc(title)}</h3>${hint ? `<span>${esc(hint)}</span>` : ""}</header>`;
  const stat = (label, value, detail) => `<div class="mcs-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`;
  const tag = (label, cls = "") => `<span class="a11-tag ${cls}">${esc(label)}</span>`;

  function activityText(activity) {
    const out = [];
    const attack = activity?.attack?.bonus ?? activity?.attack?.value;
    const dc = activity?.save?.dc ?? activity?.save?.value;
    const damage = activity?.damage?.parts?.map?.(p => Array.isArray(p) ? p[0] : p?.formula || p)?.filter(Boolean)?.join(" + ");
    if (attack !== undefined && attack !== null && attack !== "") out.push(`Ataque ${sign(attack)}`);
    if (num(dc) !== null) out.push(`Salvación CD ${dc}`);
    if (damage) out.push(`Daño ${damage}`);
    return out.join(" · ");
  }

  function spellHtml(spell, ui) {
    const id = String(spell.id || spell.name);
    const tags = [spell.prepared && tag("PREPARADO", "ok"), spell.concentration && tag("CONCENTRACIÓN", "warn"), spell.ritual && tag("RITUAL"), spell.method === "pact" && tag("PACTO", "ok")].filter(Boolean).join("");
    const acts = (spell.activities || []).map(a => {
      const extra = activityText(a);
      const flavor = plain(a.chatFlavor || a.description);
      return `<section class="a11-act"><strong>${esc(a.name || "Actividad")}</strong>${extra ? `<p>${esc(extra)}</p>` : ""}${flavor ? `<p>${esc(flavor)}</p>` : ""}</section>`;
    }).join("");
    const desc = plain(spell.description);
    return `<details class="a11-spell" data-id="${esc(id)}" data-level="${spell.level}" data-search="${esc(spell.searchText || norm(`${spell.name} ${spell.schoolLabel} ${desc}`))}" data-prepared="${!!spell.prepared}" data-concentration="${!!spell.concentration}" data-ritual="${!!spell.ritual}" ${ui.open.has(id) ? "open" : ""}>
<summary><div class="a11-title"><strong>${esc(spell.name)}</strong><small>${spell.level === 0 ? "Truco" : `Nivel ${spell.level}`} · ${esc(spell.schoolLabel || "Escuela no registrada")}</small>${tags ? `<div class="a11-tags">${tags}</div>` : ""}</div><span class="a11-arrow">›</span></summary>
<div class="a11-body"><div class="a11-meta"><div><span>Activación</span><strong>${esc(spell.activation?.label || "—")}</strong></div><div><span>Alcance</span><strong>${esc(spell.range?.label || "—")}</strong></div><div><span>Duración</span><strong>${esc(spell.duration?.label || "—")}</strong></div><div><span>Componentes</span><strong>${esc((spell.components || []).join(" · ") || "—")}</strong></div></div>${acts}${spell.materials ? `<p><strong>Materiales:</strong> ${esc(spell.materials)}</p>` : ""}${desc ? `<p>${esc(desc)}</p>` : ""}</div></details>`;
  }

  function slotHtml(slot, pact = false) {
    const current = int(slot.sessionCurrent);
    const max = int(slot.max);
    return `<article class="mcs-slot"><header><strong>${pact ? `Pacto · nivel ${slot.level}` : `Nivel ${slot.level}`}</strong><span>${pact ? "PACTO" : "ESPACIOS"}</span></header><div class="mcs-stepper"><button class="a11-slot" type="button" data-a11-slot="${esc(slot.key)}" data-delta="-1" data-focus-key="slot:${esc(slot.key)}:minus" aria-label="Reducir espacios">−</button><output>${current}/${max}</output><button class="a11-slot" type="button" data-a11-slot="${esc(slot.key)}" data-delta="1" data-focus-key="slot:${esc(slot.key)}:plus" aria-label="Aumentar espacios">+</button></div></article>`;
  }

  function apply(container, ui) {
    const q = norm(ui.query);
    let count = 0;
    container.querySelectorAll(".a11-spell").forEach(card => {
      const ok = (!q || card.dataset.search.includes(q)) && (ui.level === "all" || card.dataset.level === ui.level) && (ui.facet === "all" || card.dataset[ui.facet] === "true");
      card.hidden = !ok;
      if (ok) count++;
    });
    container.querySelectorAll(".a11-group").forEach(g => g.hidden = !g.querySelector(".a11-spell:not([hidden])"));
    container.querySelector(".a11-count").textContent = `${count} ${count === 1 ? "hechizo" : "hechizos"}`;
    container.querySelector(".a11-empty").hidden = count > 0;
  }

  function render(opts = {}) {
    if (!selected()) return false;
    const id = shell.activeCharacterId?.();
    const sessionState = shell.getSessionState?.();
    if (!id || !sessionState) return false;
    const model = api.build(id, { sessionState, throwOnInvalid: false });
    if (!model?.validation?.valid) return false;
    const ui = state(id);
    const scroll = opts.keep ? main.scrollTop : 0;
    const casting = model.combat.spellcasting;
    const slots = [...(casting.slots || []).map(s => [s, false]), ...(casting.pact ? [[casting.pact, true]] : [])].filter(([s]) => num(s.max) !== null && Number(s.max) > 0);
    const levels = [...new Set(model.spells.map(s => s.level))].sort((a, b) => a - b);
    const chips = (kind, items, active) => `<div class="a11-chips">${items.map(([label, value]) => `<button type="button" class="a11-chip" data-a11-filter="${kind}" data-value="${value}" aria-pressed="${String(active === String(value))}">${esc(label)}</button>`).join("")}</div>`;
    const groups = levels.map(level => {
      const spells = model.spells.filter(s => s.level === level);
      return `<section class="a11-group"><h3><strong>${level === 0 ? "Trucos" : `Nivel ${level}`}</strong><span>${spells.length} ${spells.length === 1 ? "hechizo" : "hechizos"}</span></h3><div class="a11-list">${spells.map(s => spellHtml(s, ui)).join("")}</div></section>`;
    }).join("");

    busy = true;
    view.innerHTML = `<section data-a11-root="${esc(id)}"><header class="mcs-heading"><h2>HECHIZOS</h2><p>Conjuros, espacios y concentración</p></header>
<section class="mcs-section">${sectionHead("Lanzamiento", `${model.spells.length} conjuros registrados`)}<div class="a11-cast">${stat("HABILIDAD", casting.abilityLabel || casting.ability?.toUpperCase() || "—", "lanzamiento")}${stat("ATAQUE", sign(casting.attack), "de conjuro")}${stat("CD", casting.dc ?? "—", "salvación")}</div></section>
${slots.length ? `<section class="mcs-section">${sectionHead("Espacios de conjuro", "compartidos con Combate")}<div class="mcs-slots">${slots.map(([s,p]) => slotHtml(s,p)).join("")}</div></section>` : ""}
<section class="mcs-section">${sectionHead("Libro de hechizos")}<div class="a11-tools"><input class="a11-search" type="search" data-a11-search value="${esc(ui.query)}" placeholder="Buscar hechizo, escuela o efecto" aria-label="Buscar hechizos">${chips("facet", [["Todos","all"],["Preparados","prepared"],["Concentración","concentration"],["Ritual","ritual"]], ui.facet)}${chips("level", [["Todos los niveles","all"], ...levels.map(l => [l === 0 ? "Trucos" : `Nivel ${l}`, l])], ui.level)}</div><p class="a11-count"></p>${groups}<p class="mcs-empty a11-empty">No hay hechizos que coincidan con los filtros actuales.</p></section></section>`;
    apply(view, ui);
    main.scrollTop = scroll;
    busy = false;
    if (opts.focus) requestAnimationFrame(() => view.querySelector(`[data-focus-key="${opts.focus}"]`)?.focus({ preventScroll: true }));
    return true;
  }

  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (!busy && selected() && !view.querySelector("[data-a11-root]")) render();
    });
  }

  function changeSlot(key, delta, focus) {
    const scroll = main.scrollTop;
    shell.selectTab("combat");
    const button = [...view.querySelectorAll('[data-action="step"][data-domain="slot"]')].find(b => b.dataset.id === key && b.dataset.delta === String(delta));
    button?.click();
    shell.selectTab("spells");
    render({ focus });
    main.scrollTop = scroll;
  }

  view.addEventListener("input", ev => {
    if (!selected() || !ev.target.matches("[data-a11-search]")) return;
    const ui = state(shell.activeCharacterId());
    ui.query = ev.target.value;
    apply(view, ui);
  });
  view.addEventListener("click", ev => {
    const slot = ev.target.closest("[data-a11-slot]");
    if (slot && selected()) return changeSlot(slot.dataset.a11Slot, int(slot.dataset.delta), slot.dataset.focusKey);
    const filter = ev.target.closest("[data-a11-filter]");
    if (!filter || !selected()) return;
    const ui = state(shell.activeCharacterId());
    ui[filter.dataset.a11Filter] = filter.dataset.value;
    view.querySelectorAll(`[data-a11-filter="${filter.dataset.a11Filter}"]`).forEach(b => b.setAttribute("aria-pressed", String(b === filter)));
    apply(view, ui);
  });
  view.addEventListener("toggle", ev => {
    if (!ev.target.matches?.(".a11-spell")) return;
    const open = state(shell.activeCharacterId()).open;
    ev.target.open ? open.add(ev.target.dataset.id) : open.delete(ev.target.dataset.id);
  }, true);
  nav.addEventListener("click", ev => { if (ev.target.closest('[data-tab="spells"]')) schedule(); });
  root.addEventListener("banda:mobile-character-open", schedule);
  const observer = new MutationObserver(() => { if (!busy && selected() && !view.querySelector("[data-a11-root]")) schedule(); });
  observer.observe(view, { childList: true });
  observer.observe(nav, { attributes: true, subtree: true, attributeFilter: ["aria-selected"] });
  window.BANDA_MOBILE_SPELLS = Object.freeze({ version: 1, render: () => render({ keep: true }), isActive: selected });
})();
