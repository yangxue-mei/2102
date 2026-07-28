// 历史记录 UI：列表渲染、滚动、回填、清空
import { type HistoryItem, loadHistory, clearHistory } from "./history";

export class HistoryView {
  private root: HTMLElement;
  private list: HTMLElement;
  private clearBtn: HTMLButtonElement;
  private onRefill: (item: HistoryItem) => void;

  constructor(root: HTMLElement, onRefill: (item: HistoryItem) => void) {
    this.root = root;
    this.onRefill = onRefill;
    this.list = root.querySelector<HTMLElement>("#history-list")!;
    this.clearBtn = root.querySelector<HTMLButtonElement>("#history-clear")!;
    this.clearBtn.addEventListener("click", () => {
      clearHistory();
      this.render();
    });
    this.render();
  }

  render() {
    const items = loadHistory();
    if (items.length === 0) {
      this.list.innerHTML = `<li class="text-sm text-muted">还没有历史记录</li>`;
      return;
    }
    this.list.innerHTML = "";
    for (const it of items) {
      const li = document.createElement("li");
      li.className = "history-item";
      li.tabIndex = 0;
      const head = document.createElement("div");
      head.className = "history-head";
      const tag = document.createElement("span");
      tag.className = "history-tag";
      tag.textContent = moduleLabel(it.module);
      const time = document.createElement("span");
      time.className = "history-time";
      time.textContent = new Date(it.at).toLocaleTimeString();
      head.append(tag, time);
      const expr = document.createElement("div");
      expr.className = "history-expr";
      expr.textContent = it.expression;
      const res = document.createElement("div");
      res.className = "history-result";
      res.textContent = it.result;
      li.append(head, expr, res);
      li.addEventListener("click", () => this.onRefill(it));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.onRefill(it);
        }
      });
      this.list.appendChild(li);
    }
  }
}

function moduleLabel(m: HistoryItem["module"]): string {
  if (m === "calc") return "计算";
  if (m === "equation") return "方程";
  return "进制";
}
