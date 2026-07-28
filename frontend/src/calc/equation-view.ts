// 方程求解 UI
import { solveEquation } from "./equation";
import { addHistory } from "./history";

export class EquationView {
  private root: HTMLElement;
  private input: HTMLInputElement;
  private out: HTMLElement;
  private solveBtn: HTMLButtonElement;
  private onHistoryChange: () => void;
  private onAnswer: (expr: string, result: string) => void;
  private presets: HTMLElement;

  constructor(
    root: HTMLElement,
    onAnswer: (expr: string, result: string) => void,
    onHistoryChange: () => void,
  ) {
    this.root = root;
    this.onAnswer = onAnswer;
    this.onHistoryChange = onHistoryChange;
    this.input = root.querySelector<HTMLInputElement>("#eq-input")!;
    this.out = root.querySelector<HTMLElement>("#eq-out")!;
    this.solveBtn = root.querySelector<HTMLButtonElement>("#eq-solve")!;
    this.presets = root.querySelector<HTMLElement>("#eq-presets")!;
    this.bind();
    this.renderPresets();
  }

  private bind() {
    this.solveBtn.addEventListener("click", () => this.solve());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.solve();
      }
    });
  }

  private renderPresets() {
    const samples = ["2x+1=9", "x^2-5x+6=0", "x^2+1=0", "3x-7=14", "x^2-2x+1=0"];
    this.presets.innerHTML = "";
    for (const s of samples) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.textContent = s;
      btn.addEventListener("click", () => {
        this.input.value = s;
        this.solve();
      });
      this.presets.appendChild(btn);
    }
  }

  private solve() {
    const text = this.input.value.trim();
    if (!text) {
      this.out.innerHTML = `<div class="text-danger text-sm">请输入方程</div>`;
      return;
    }
    const r = solveEquation(text);
    if (!r.ok) {
      this.out.innerHTML = `<div class="text-danger text-sm">${escapeHtml(r.message)}</div>${r.display ? `<pre class="eq-detail">${escapeHtml(r.display)}</pre>` : ""}`;
      return;
    }
    this.out.innerHTML = `<div class="text-sm text-muted">${escapeHtml(r.message)}</div><pre class="eq-detail">${escapeHtml(r.display)}</pre>`;
    addHistory({ expression: text, result: r.message + " · " + r.display.replace(/\n/g, " | "), module: "equation" });
    this.onAnswer(text, r.display.split("\n")[0] || r.message);
    this.onHistoryChange();
  }

  refill(text: string) {
    this.input.value = text;
    this.solve();
    this.input.focus();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}
