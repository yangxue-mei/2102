import "./index.css";
import { BasicCalc } from "./calc/basic";
import { EquationView } from "./calc/equation-view";
import { BaseConverter } from "./calc/base";
import { Plotter } from "./calc/plot";
import { HistoryView } from "./calc/history-view";
import type { HistoryItem } from "./calc/history";

type TabId = "calc" | "equation" | "base" | "plot" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "calc", label: "计算" },
  { id: "equation", label: "方程" },
  { id: "base", label: "进制" },
  { id: "plot", label: "绘图" },
  { id: "history", label: "历史" },
];

const lastExpr: Record<HistoryItem["module"], string> = {
  calc: "",
  equation: "",
  base: "",
};

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`缺少元素 #${id}`);
  return el;
}

function init() {
  const bar = $("tab-bar");
  const panels = $("tab-panels");
  bar.innerHTML = "";
  TABS.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab-btn";
    btn.textContent = t.label;
    btn.dataset.tab = t.id;
    if (i === 0) btn.classList.add("active");
    btn.addEventListener("click", () => switchTab(t.id));
    bar.appendChild(btn);
  });

  let activeTab: TabId = "calc";
  const panelsByName: Partial<Record<TabId, HTMLElement>> = {};
  Array.from(panels.children).forEach((el) => {
    const id = el.getAttribute("data-panel") as TabId | null;
    if (id) panelsByName[id] = el as HTMLElement;
    el.classList.toggle("hidden", id !== activeTab);
  });

  function switchTab(id: TabId) {
    activeTab = id;
    Array.from(bar.children).forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-tab") === id);
    });
    for (const k of Object.keys(panelsByName) as TabId[]) {
      const p = panelsByName[k];
      if (p) p.classList.toggle("hidden", k !== id);
    }
    if (id === "history") historyView?.render();
    if (id === "plot") {
      // 切换到绘图标签时如果面板可见性变化，触发一次重绘
      window.dispatchEvent(new Event("resize"));
    }
  }

  // 历史回填路由：根据来源模块决定回填到哪个面板并切过去
  const refill = (item: HistoryItem) => {
    if (item.module === "calc") {
      switchTab("calc");
      basicCalc?.refill(item.expression);
    } else if (item.module === "equation") {
      switchTab("equation");
      equationView?.refill(item.expression);
    } else if (item.module === "base") {
      switchTab("base");
      // base 历史的 expression 形如 "10进制:42"
      const m = item.expression.match(/(\d+)进制:([0-9a-fA-F.]+)/);
      baseConverter?.refill(m ? m[2] : "");
    }
  };

  const historyView = new HistoryView($("panel-history"), refill);

  const onAnswer = (expr: string, result: string) => {
    if (expr) lastExpr[activeTab as HistoryItem["module"]] = expr;
    void result;
  };
  const onHistoryChange = () => historyView.render();

  const basicCalc = new BasicCalc($("panel-calc"), onAnswer, onHistoryChange);
  const equationView = new EquationView($("panel-equation"), onAnswer, onHistoryChange);
  const baseConverter = new BaseConverter($("panel-base"), onAnswer, onHistoryChange);
  const plotter = new Plotter($("panel-plot"));
  void plotter;

  // 切换主题（明/暗）
  const themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      document.documentElement.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
