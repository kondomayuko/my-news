const CATS = { ai: "AI", world: "世界", tech: "テック・サイエンス", economy: "経済" };
const TABS = [["all", "すべて"], ...Object.entries(CATS), ["later", "★ あとで読む"]];
const LATER_KEY = "mynews.later";

function readLater() {
  try { return new Set(JSON.parse(localStorage.getItem(LATER_KEY) || "[]")); } catch { return new Set(); }
}

const state = { items: [], tab: "all", q: "", later: readLater(), scroll: {}, version: null };
const $ = (id) => document.getElementById(id);

function saveLater() {
  try { localStorage.setItem(LATER_KEY, JSON.stringify([...state.later])); } catch {}
}

function fmtDay(d) {
  const dt = new Date(d + "T00:00:00");
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日（${"日月火水木金土"[dt.getDay()]}）`;
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  }
  for (const c of children) e.append(c);
  return e;
}

function matches(it) {
  if (state.tab === "later" && !state.later.has(it.id)) return false;
  if (CATS[state.tab] && it.category !== state.tab) return false;
  if (!state.q) return true;
  const hay = `${it.title} ${it.summary} ${it.source}`.toLowerCase();
  return state.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}

function renderTabs() {
  const count = (k) => k === "all" ? state.items.length
    : k === "later" ? state.items.filter((i) => state.later.has(i.id)).length
    : state.items.filter((i) => i.category === k).length;
  $("tabs").replaceChildren(...TABS.map(([k, label]) =>
    el("button", { class: "tab", "aria-pressed": String(state.tab === k), onclick: () => switchTab(k) },
      label, el("span", { class: "n" }, String(count(k))))));
}

function switchTab(k) {
  if (k === state.tab) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
  state.scroll[state.tab] = window.scrollY;
  state.tab = k;
  render();
  window.scrollTo(0, state.scroll[k] || 0);
}

function card(it) {
  const on = state.later.has(it.id);
  const btn = el("button", { class: "later", "aria-pressed": String(on), onclick: () => {
    state.later.has(it.id) ? state.later.delete(it.id) : state.later.add(it.id);
    saveLater(); render();
  } }, on ? "★ あとで読む" : "☆ あとで読む");
  return el("article", { class: "card" },
    el("span", { class: `chip ${it.category}` }, CATS[it.category] || it.category),
    el("h3", {}, el("a", { href: it.url, target: "_blank", rel: "noopener noreferrer" }, it.title)),
    el("p", {}, it.summary),
    el("div", { class: "meta" },
      el("span", {}, it.date.replaceAll("-", "/")),
      el("a", { href: it.url, target: "_blank", rel: "noopener noreferrer" }, `${it.source} ↗`),
      btn));
}

function render() {
  renderTabs();
  const shown = state.items.filter(matches);
  const list = [];
  let day = null;
  for (const it of shown) {
    if (it.date !== day) { day = it.date; list.push(el("h2", { class: "day" }, fmtDay(day))); }
    list.push(card(it));
  }
  $("list").replaceChildren(...list);
  $("status").textContent = shown.length ? "" : (state.tab === "later" ? "「あとで読む」の印はまだありません。" : "該当するニュースはありません。");
}

async function load() {
  try {
    const res = await fetch(`data/news.json?t=${Date.now()}`, { cache: "no-store" });
    const db = await res.json();
    const version = db.items.map((i) => i.id).join("|");
    if (version === state.version) return;
    const first = state.version === null;
    state.version = version;
    state.items = db.items.slice().sort((a, b) => (b.date + b.addedAt).localeCompare(a.date + a.addedAt));
    if (db.updatedAt) {
      const u = new Date(db.updatedAt);
      $("updated").textContent = `更新 ${u.getMonth() + 1}/${u.getDate()} ${String(u.getHours()).padStart(2, "0")}:${String(u.getMinutes()).padStart(2, "0")}`;
    }
    render();
    if (!first) { state.scroll = {}; window.scrollTo(0, 0); }
  } catch (e) {
    if (state.version === null) $("status").textContent = "ニュースを読み込めませんでした。";
  }
}

$("q").addEventListener("input", (e) => { state.q = e.target.value.trim(); render(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") load(); });
window.addEventListener("pageshow", (e) => { if (e.persisted) load(); });
load();
