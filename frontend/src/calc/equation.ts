// 一元一次 / 一元二次方程求解
import { parse, toPoly, type Poly } from "./parser";

export interface EquationResult {
  ok: boolean;
  message: string;
  display: string;
}

function fmt(n: number): string {
  if (Number.isNaN(n)) return "NaN";
  if (!Number.isFinite(n)) return n > 0 ? "∞" : "-∞";
  const rounded = Math.round(n * 1e10) / 1e10;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

function fmtComplex(re: number, im: number): string {
  const r = Math.round(re * 1e10) / 1e10;
  const i = Math.round(im * 1e10) / 1e10;
  if (i === 0) return fmt(r);
  if (r === 0) return `${fmt(Math.abs(i))}i`;
  const sign = i > 0 ? " + " : " - ";
  return `${fmt(r)}${sign}${fmt(Math.abs(i))}i`;
}

function normalize(poly: Poly): Poly {
  if (poly.c2 === 0 && poly.c1 === 0 && poly.c0 === 0) return poly;
  return poly;
}

export function solveEquation(input: string): EquationResult {
  const text = input.trim();
  if (!text) return { ok: false, message: "请输入方程", display: "" };
  const eq = text.split("=");
  if (eq.length !== 2) {
    return { ok: false, message: "方程必须包含一个 '='", display: "" };
  }
  const lhs = eq[0].trim();
  const rhs = eq[1].trim();
  if (!lhs || !rhs) return { ok: false, message: "方程两边不能为空", display: "" };
  let pL: Poly, pR: Poly;
  try {
    pL = toPoly(parse(lhs));
    pR = toPoly(parse(rhs));
  } catch (e) {
    return { ok: false, message: `解析失败: ${e instanceof Error ? e.message : String(e)}`, display: "" };
  }
  const eq2: Poly = { c0: pL.c0 - pR.c0, c1: pL.c1 - pR.c1, c2: pL.c2 - pR.c2 };
  const a = eq2.c2, b = eq2.c1, c = eq2.c0;
  const polyStr = formatPoly(a, b, c);
  if (Math.abs(a) > 1e-12) {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      const x1 = (-b + sq) / (2 * a);
      const x2 = (-b - sq) / (2 * a);
      const same = Math.abs(x1 - x2) < 1e-9;
      return {
        ok: true,
        message: "一元二次方程，实数根",
        display: `合并后: ${polyStr} = 0\n判别式 Δ = ${fmt(disc)}\n${same ? `x = ${fmt(x1)}` : `x₁ = ${fmt(x1)}\nx₂ = ${fmt(x2)}`}`,
      };
    } else {
      const re = -b / (2 * a);
      const im = Math.sqrt(-disc) / (2 * a);
      return {
        ok: true,
        message: "一元二次方程，复数根（a+bi 格式）",
        display: `合并后: ${polyStr} = 0\n判别式 Δ = ${fmt(disc)}\nx₁ = ${fmtComplex(re, im)}\nx₂ = ${fmtComplex(re, -im)}`,
      };
    }
  }
  if (Math.abs(b) > 1e-12) {
    const x = -c / b;
    return {
      ok: true,
      message: "一元一次方程，实数根",
      display: `合并后: ${formatPoly(0, b, c)} = 0\nx = ${fmt(x)}`,
    };
  }
  if (Math.abs(c) > 1e-12) {
    return { ok: false, message: "方程无解（0 = 常数 ≠ 0）", display: `合并后: ${formatPoly(0, 0, c)} = 0` };
  }
  return { ok: true, message: "方程恒等（任意 x 成立）", display: `合并后: 0 = 0` };
}

function formatPoly(a: number, b: number, c: number): string {
  const parts: string[] = [];
  if (Math.abs(a) > 1e-12) {
    const sign = a < 0 ? "-" : "";
    parts.push(`${sign}${fmt(Math.abs(a))}x²`);
  }
  if (Math.abs(b) > 1e-12) {
    if (parts.length === 0) {
      parts.push(`${b < 0 ? "-" : ""}${fmt(Math.abs(b))}x`);
    } else {
      parts.push(` ${b < 0 ? "-" : "+"} ${fmt(Math.abs(b))}x`);
    }
  }
  if (Math.abs(c) > 1e-12) {
    if (parts.length === 0) {
      parts.push(`${c < 0 ? "-" : ""}${fmt(Math.abs(c))}`);
    } else {
      parts.push(` ${c < 0 ? "-" : "+"} ${fmt(Math.abs(c))}`);
    }
  }
  if (parts.length === 0) return "0";
  return parts.join("");
}
