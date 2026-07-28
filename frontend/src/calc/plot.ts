// 动态函数绘图模块：多条 y=f(x) 曲线、滚轮缩放、拖拽平移
import { parse, evalNum, type EvalEnv } from "./parser";

const COLORS = ["#4338ca", "#16a34a", "#dc2626", "#f59e0b", "#0891b2", "#7c3aed", "#db2777", "#0f766e"];

interface PlotFn {
  id: string;
  expr: string;
  color: string;
  ast: ReturnType<typeof parse> | null;
  err: string | null;
}

export class Plotter {
  private root: HTMLElement;
  private listEl: HTMLElement;
  private input: HTMLInputElement;
  private addBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fns: PlotFn[] = [];
  private scale = 40; // 每单位多少像素
  private ox = 0; // 原点在画布中心后偏移
  private oy = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private raf = 0;

  constructor(root: HTMLElement) {
    this.root = root;
    this.listEl = root.querySelector<HTMLElement>("#plot-list")!;
    this.input = root.querySelector<HTMLInputElement>("#plot-input")!;
    this.addBtn = root.querySelector<HTMLButtonElement>("#plot-add")!;
    this.clearBtn = root.querySelector<HTMLButtonElement>("#plot-clear")!;
    this.canvas = root.querySelector<HTMLCanvasElement>("#plot-canvas")!;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("无法获取 2D 上下文");
    this.ctx = ctx;
    this.bind();
    this.resize();
    this.renderList();
    this.draw();
  }

  private bind() {
    this.addBtn.addEventListener("click", () => this.addFn());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.addFn();
      }
    });
    this.clearBtn.addEventListener("click", () => this.clearAll());

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const before = this.screenToWorld(mx, my);
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.scale = clamp(this.scale * factor, 4, 400);
      const after = this.screenToWorld(mx, my);
      this.ox += (after.x - before.x) * this.scale;
      this.oy -= (after.y - before.y) * this.scale;
      this.scheduleDraw();
    }, { passive: false });

    this.canvas.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.classList.add("cursor-grabbing");
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.ox += dx;
      this.oy += dy;
      this.scheduleDraw();
    });
    const endDrag = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.canvas.classList.remove("cursor-grabbing");
      try { this.canvas.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    };
    this.canvas.addEventListener("pointerup", endDrag);
    this.canvas.addEventListener("pointercancel", endDrag);
    this.canvas.addEventListener("pointerleave", endDrag);

    const ro = new ResizeObserver(() => {
      this.resize();
      this.scheduleDraw();
    });
    ro.observe(this.canvas);

    new ResizeObserver(() => {
      this.resize();
      this.scheduleDraw();
    }).observe(this.root);
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private addFn() {
    const text = this.input.value.trim();
    if (!text) return;
    if (this.fns.length >= COLORS.length) {
      this.fns.shift();
    }
    const color = COLORS[this.fns.length % COLORS.length];
    let ast: PlotFn["ast"] = null;
    let err: string | null = null;
    try {
      ast = parse(text);
    } catch (e) {
      err = e instanceof Error ? e.message : String(e);
    }
    this.fns.push({
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      expr: text,
      color,
      ast,
      err,
    });
    this.input.value = "";
    this.renderList();
    this.scheduleDraw();
  }

  private clearAll() {
    this.fns = [];
    this.renderList();
    this.scheduleDraw();
  }

  private removeFn(id: string) {
    this.fns = this.fns.filter((f) => f.id !== id);
    this.renderList();
    this.scheduleDraw();
  }

  private renderList() {
    if (this.fns.length === 0) {
      this.listEl.innerHTML = `<li class="text-sm text-muted">还没有函数，试试输入 <code>sin(x)</code> 后按添加</li>`;
      return;
    }
    this.listEl.innerHTML = "";
    for (const f of this.fns) {
      const li = document.createElement("li");
      li.className = "plot-item";
      const tag = document.createElement("span");
      tag.className = "plot-color";
      tag.style.background = f.color;
      const code = document.createElement("code");
      code.textContent = `y = ${f.expr}`;
      if (f.err) {
        code.classList.add("text-danger");
      }
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "plot-del";
      rm.textContent = "×";
      rm.addEventListener("click", () => this.removeFn(f.id));
      li.append(tag, code, rm);
      this.listEl.appendChild(li);
    }
  }

  private scheduleDraw() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.draw();
    });
  }

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const cx = rect.width / 2 + this.ox;
    const cy = rect.height / 2 + this.oy;
    return { x: (sx - cx) / this.scale, y: -(sy - cy) / this.scale };
  }

  private draw() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    ctx.clearRect(0, 0, W, H);
    // 背景
    ctx.fillStyle = getCssVar("--color-surface") || "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2 + this.ox;
    const cy = H / 2 + this.oy;

    // 网格
    const grid = this.niceGrid();
    ctx.lineWidth = 1;
    ctx.strokeStyle = getCssVar("--color-line") || "#e5e7eb";
    ctx.fillStyle = getCssVar("--color-muted") || "#6b7280";
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    // 竖线
    for (let i = Math.floor((-cx) / grid.pxStep); i <= Math.ceil((W - cx) / grid.pxStep); i++) {
      const gx = cx + i * grid.pxStep;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, H);
      ctx.stroke();
      const v = i * grid.unit;
      if (Math.abs(v) > 1e-9) ctx.fillText(grid.fmt(v), gx, 4);
    }
    // 横线
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = Math.floor((-cy) / grid.pxStep); i <= Math.ceil((H - cy) / grid.pxStep); i++) {
      const gy = cy + i * grid.pxStep;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();
      const v = -i * grid.unit;
      if (Math.abs(v) > 1e-9) ctx.fillText(grid.fmt(v), cx - 4, gy);
    }

    // 坐标轴
    ctx.strokeStyle = getCssVar("--color-ink") || "#111827";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(W, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.stroke();
    ctx.fillStyle = getCssVar("--color-ink") || "#111827";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("0", cx + 4, cy + 4);
    ctx.fillText("x", W - 12, cy - 16);
    ctx.save();
    ctx.translate(cx + 6, 4);
    ctx.fillText("y", 0, 0);
    ctx.restore();

    // 曲线
    const env: EvalEnv = { angle: "rad" };
    for (const f of this.fns) {
      if (!f.ast) continue;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let pen = false;
      let prevY: number | null = null;
      for (let px = 0; px <= W; px += 1) {
        const x = (px - cx) / this.scale;
        let y: number;
        try {
          y = evalNum(f.ast, { ...env, x });
        } catch {
          y = NaN;
        }
        const py = cy - y * this.scale;
        if (!Number.isFinite(y) || Math.abs(py) > 1e6) {
          pen = false;
          prevY = null;
          continue;
        }
        if (prevY !== null && Math.abs(py - prevY) > H) {
          pen = false;
        }
        if (!pen) {
          ctx.moveTo(px, py);
          pen = true;
        } else {
          ctx.lineTo(px, py);
        }
        prevY = py;
      }
      ctx.stroke();
    }
  }

  private niceGrid(): { pxStep: number; unit: number; fmt: (n: number) => string } {
    const target = 80; // 目标像素间距
    const raw = target / this.scale;
    const exp = Math.floor(Math.log10(raw));
    const base = Math.pow(10, exp);
    const f = raw / base;
    let unit: number;
    if (f < 1.5) unit = 1 * base;
    else if (f < 3.5) unit = 2 * base;
    else if (f < 7.5) unit = 5 * base;
    else unit = 10 * base;
    const pxStep = unit * this.scale;
    const fmt = (n: number) => {
      const a = Math.abs(n);
      if (a !== 0 && (a >= 1e4 || a < 1e-3)) return n.toExponential(1);
      const r = Math.round(n * 1e6) / 1e6;
      return String(r);
    };
    return { pxStep, unit, fmt };
  }
}

function getCssVar(name: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
