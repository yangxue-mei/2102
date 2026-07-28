// 基础科学计算模块：表达式输入、虚拟键盘、Deg/Rad、运算符优先级解析
import { evaluate, parse, evalNum, type EvalEnv } from "./parser";
import { addHistory } from "./history";

const BUTTONS: { label: string; insert: string; cls?: string }[] = [
  { label: "sin", insert: "sin(" },
  { label: "cos", insert: "cos(" },
  { label: "tan", insert: "tan(" },
  { label: "π", insert: "π" },
  { label: "e", insert: "e" },
  { label: "ln", insert: "ln(" },
  { label: "log", insert: "log(" },
  { label: "√", insert: "√(" },
  { label: "x²", insert: "^2" },
  { label: "xⁿ", insert: "^" },
  { label: "n!", insert: "!" },
  { label: "(", insert: "(" },
  { label: ")", insert: ")" },
  { label: "C", insert: "CLEAR", cls: "btn-danger" },
  { label: "⌫", insert: "BACK", cls: "btn-warn" },
  { label: "7", insert: "7" },
  { label: "8", insert: "8" },
  { label: "9", insert: "9" },
  { label: "÷", insert: "/" },
  { label: "%", insert: "%" },
  { label: "4", insert: "4" },
  { label: "5", insert: "5" },
  { label: "6", insert: "6" },
  { label: "×", insert: "*" },
  { label: "EXP", insert: "e^" },
  { label: "1", insert: "1" },
  { label: "2", insert: "2" },
  { label: "3", insert: "3" },
  { label: "−", insert: "-" },
  { label: "1/x", insert: "1/(" },
  { label: "0", insert: "0" },
  { label: ".", insert: "." },
  { label: "Ans", insert: "ANS" },
  { label: "+", insert: "+" },
  { label: "=", insert: "EQ", cls: "btn-primary" },
];

export class BasicCalc {
  private input: HTMLInputElement;
  private result: HTMLElement;
  private angleBtn: HTMLButtonElement;
  private pad: HTMLElement;
  private angle: "deg" | "rad" = "deg";
  private lastAnswer = "";
  private onHistoryChange: () => void;
  private onAnswer: (expr: string, result: string) => void;

  constructor(
    root: HTMLElement,
    onAnswer: (expr: string, result: string) => void,
    onHistoryChange: () => void,
  ) {
    this.onAnswer = onAnswer;
    this.onHistoryChange = onHistoryChange;
    this.input = root.querySelector<HTMLInputElement>("#calc-input")!;
    this.result = root.querySelector<HTMLElement>("#calc-result")!;
    this.angleBtn = root.querySelector<HTMLButtonElement>("#calc-angle")!;
    this.pad = root.querySelector<HTMLElement>("#calc-pad")!;
    this.angleBtn.textContent = this.angle === "deg" ? "Deg" : "Rad";
    this.input.value = "";
    this.bind();
    this.renderPad();
  }

  private bind() {
    this.angleBtn.addEventListener("click", () => {
      this.angle = this.angle === "deg" ? "rad" : "deg";
      this.angleBtn.textContent = this.angle === "deg" ? "Deg" : "Rad";
      this.liveEval();
    });
    this.input.addEventListener("input", () => this.liveEval());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.compute();
      }
    });
  }

  private renderPad() {
    this.pad.innerHTML = "";
    for (const b of BUTTONS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = b.label;
      btn.className = ["calc-key", b.cls].filter(Boolean).join(" ");
      btn.addEventListener("click", () => this.onKey(b.insert));
      this.pad.appendChild(btn);
    }
  }

  private onKey(ins: string) {
    if (ins === "CLEAR") {
      this.input.value = "";
      this.result.textContent = "";
      return;
    }
    if (ins === "BACK") {
      this.input.value = this.input.value.slice(0, -1);
      this.liveEval();
      return;
    }
    if (ins === "EQ") {
      this.compute();
      return;
    }
    if (ins === "ANS") {
      this.input.value += this.lastAnswer || "";
      this.liveEval();
      return;
    }
    this.input.value += ins;
    this.liveEval();
  }

  private liveEval() {
    const text = this.input.value.trim();
    if (!text) {
      this.result.textContent = "";
      this.result.classList.remove("text-danger");
      return;
    }
    try {
      const env: EvalEnv = { angle: this.angle };
      const v = evaluate(text, env);
      const out = Number.isFinite(v) ? formatNumber(v) : String(v);
      this.result.textContent = "= " + out;
      this.result.classList.remove("text-danger");
    } catch (e) {
      this.result.textContent = "· " + (e instanceof Error ? e.message : String(e));
      this.result.classList.add("text-danger");
    }
  }

  private compute() {
    const text = this.input.value.trim();
    if (!text) return;
    try {
      const env: EvalEnv = { angle: this.angle };
      const v = evaluate(text, env);
      const out = Number.isFinite(v) ? formatNumber(v) : String(v);
      this.result.textContent = "= " + out;
      this.result.classList.remove("text-danger");
      this.lastAnswer = out;
      addHistory({ expression: text, result: out, module: "calc" });
      this.onAnswer(text, out);
      this.onHistoryChange();
      this.input.value = "";
      this.input.focus();
    } catch (e) {
      this.result.textContent = "错误: " + (e instanceof Error ? e.message : String(e));
      this.result.classList.add("text-danger");
    }
  }

  refill(text: string) {
    this.input.value = text;
    this.liveEval();
    this.input.focus();
  }

  getAngle() { return this.angle; }
}

export function formatNumber(n: number): string {
  if (Number.isNaN(n)) return "NaN";
  if (!Number.isFinite(n)) return n > 0 ? "∞" : "-∞";
  if (Math.abs(n) > 1e15 || (Math.abs(n) < 1e-9 && n !== 0)) {
    return n.toExponential(10).replace(/\.?0+e/, "e").replace(/e\+?/, "e");
  }
  const r = Math.round(n * 1e10) / 1e10;
  return String(r);
}

export { parse, evalNum };
