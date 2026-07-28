// 进制转换模块：2/8/10/16 实时互转，按键权限控制
import { addHistory } from "./history";

const BASES = [
  { id: 2, label: "BIN" },
  { id: 8, label: "OCT" },
  { id: 10, label: "DEC" },
  { id: 16, label: "HEX" },
] as const;

const KEYS_BIN = ["0", "1"];
const KEYS_OCT = ["0", "1", "2", "3", "4", "5", "6", "7"];
const KEYS_DEC = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const KEYS_HEX = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];

function keysFor(base: number): string[] {
  if (base === 2) return KEYS_BIN;
  if (base === 8) return KEYS_OCT;
  if (base === 10) return KEYS_DEC;
  return KEYS_HEX;
}

function parseBigIntStrict(text: string, base: number): number {
  const t = text.trim();
  if (!t) return 0;
  const v = Number.parseInt(t, base);
  if (Number.isNaN(v)) throw new Error(`无法在 ${base} 进制下解析: ${t}`);
  // 校验每位是否合法
  const valid = "0123456789ABCDEF".slice(0, base).toLowerCase();
  for (const ch of t.toLowerCase()) {
    if (!valid.includes(ch)) throw new Error(`非法字符 ${ch}（当前 ${base} 进制）`);
  }
  return v;
}

function toBase(n: number, base: number): string {
  if (!Number.isFinite(n)) return String(n);
  // 整数部分按 base 转换
  const intPart = Math.trunc(n);
  const frac = n - intPart;
  const intStr = intPart.toString(base).toUpperCase();
  if (frac === 0) return intStr;
  // 小数部分支持有限位（最多 12 位）
  let f = frac;
  let digits = "";
  for (let i = 0; i < 12 && f > 0; i++) {
    f *= base;
    const d = Math.floor(f);
    digits += d.toString(base).toUpperCase();
    f -= d;
  }
  if (!digits) return intStr;
  return `${intStr}.${digits}`;
}

export class BaseConverter {
  private root: HTMLElement;
  private input: HTMLInputElement;
  private display: HTMLElement;
  private pad: HTMLElement;
  private segButtons: HTMLElement;
  private base: 2 | 8 | 10 | 16 = 10;
  private onHistoryChange: () => void;
  private onAnswer: (expr: string, result: string) => void;

  constructor(
    root: HTMLElement,
    onAnswer: (expr: string, result: string) => void,
    onHistoryChange: () => void,
  ) {
    this.root = root;
    this.onAnswer = onAnswer;
    this.onHistoryChange = onHistoryChange;
    this.input = root.querySelector<HTMLInputElement>("#base-input")!;
    this.display = root.querySelector<HTMLElement>("#base-display")!;
    this.pad = root.querySelector<HTMLElement>("#base-pad")!;
    this.segButtons = root.querySelector<HTMLElement>("#base-seg")!;
    this.buildSegments();
    this.renderPad();
    this.input.value = "0";
    this.bind();
    this.refresh();
  }

  private buildSegments() {
    this.segButtons.innerHTML = "";
    for (const b of BASES) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      btn.dataset.base = String(b.id);
      btn.className = "seg-btn";
      if (b.id === this.base) btn.classList.add("active");
      btn.addEventListener("click", () => this.setBase(b.id as 2 | 8 | 10 | 16));
      this.segButtons.appendChild(btn);
    }
  }

  private setBase(b: 2 | 8 | 10 | 16) {
    // 转换当前输入到新进制
    let n = 0;
    try {
      n = parseBigIntStrict(this.input.value, this.base);
    } catch {
      // 解析失败则清空
      this.input.value = "";
    }
    this.base = b;
    Array.from(this.segButtons.children).forEach((el) => {
      const btn = el as HTMLButtonElement;
      btn.classList.toggle("active", Number(btn.dataset.base) === b);
    });
    if (this.input.value === "" && !Number.isNaN(n)) {
      this.input.value = toBase(n, b);
    } else if (this.input.value !== "") {
      this.input.value = toBase(n, b);
    }
    this.renderPad();
    this.refresh();
    this.input.focus();
  }

  private renderPad() {
    this.pad.innerHTML = "";
    const allowed = new Set(keysFor(this.base));
    for (const k of KEYS_HEX) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = k;
      btn.className = "calc-key";
      btn.disabled = !allowed.has(k);
      if (btn.disabled) btn.classList.add("key-disabled");
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        this.appendKey(k);
      });
      this.pad.appendChild(btn);
    }
    const clr = document.createElement("button");
    clr.type = "button";
    clr.textContent = "C";
    clr.className = "calc-key btn-danger";
    clr.addEventListener("click", () => this.clearAll());
    this.pad.appendChild(clr);
    const back = document.createElement("button");
    back.type = "button";
    back.textContent = "⌫";
    back.className = "calc-key btn-warn";
    back.addEventListener("click", () => this.backspace());
    this.pad.appendChild(back);
  }

  private appendKey(k: string) {
    if (this.input.value === "0") this.input.value = "";
    this.input.value += k;
    this.refresh();
  }

  private backspace() {
    this.input.value = this.input.value.slice(0, -1);
    this.refresh();
  }

  private clearAll() {
    this.input.value = "";
    this.refresh();
  }

  private bind() {
    this.input.addEventListener("input", () => {
      this.refresh();
    });
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.commit();
      }
    });
  }

  private refresh() {
    const text = this.input.value.trim();
    let n = 0;
    let err = "";
    if (text) {
      try {
        n = parseBigIntStrict(text, this.base);
      } catch (e) {
        err = e instanceof Error ? e.message : String(e);
      }
    }
    if (err) {
      this.display.innerHTML = `<div class="text-danger text-sm">错误: ${escapeHtml(err)}</div>`;
      return;
    }
    const rows = BASES.map((b) => {
      const cur = b.id === this.base;
      const v = toBase(n, b.id);
      return `<div class="base-row ${cur ? "row-active" : ""}">
        <span class="base-tag">${b.label}</span>
        <span class="base-val">${escapeHtml(v || "0")}</span>
      </div>`;
    }).join("");
    this.display.innerHTML = rows;
  }

  private commit() {
    const text = this.input.value.trim();
    if (!text) return;
    try {
      const n = parseBigIntStrict(text, this.base);
      const expr = `${this.base}进制:${text}`;
      const result = `DEC ${n}`;
      addHistory({ expression: expr, result, module: "base" });
      this.onAnswer(expr, result);
      this.onHistoryChange();
    } catch {
      // 静默
    }
  }

  refill(text: string) {
    this.input.value = text;
    this.refresh();
    this.input.focus();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}
