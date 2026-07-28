// 表达式词法 + 递归下降解析器，输出 AST。
// 同时被基础计算、方程求解、函数绘图共用。

export type Tok =
  | { t: "num"; v: number }
  | { t: "var"; v: string }
  | { t: "const"; v: string }
  | { t: "func"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "comma" };

export type Ast =
  | { type: "num"; v: number }
  | { type: "var"; name: string }
  | { type: "const"; name: string }
  | { type: "unary"; op: "-" | "+"; a: Ast }
  | { type: "bin"; op: string; l: Ast; r: Ast }
  | { type: "call"; name: string; arg: Ast }
  | { type: "fact"; a: Ast };

const FUNCS = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sinh", "cosh", "tanh",
  "ln", "log", "log2", "exp",
  "sqrt", "abs", "cbrt",
]);

const CONSTS = new Set(["pi", "e", "tau"]);

function isDigit(c: string): boolean {
  return c >= "0" && c <= "9";
}
function isAlpha(c: string): boolean {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
}
function isAlnum(c: string): boolean {
  return isAlpha(c) || isDigit(c);
}

export function tokenize(input: string): Tok[] {
  const s = input.replace(/\s+/g, "");
  const out: Tok[] = [];
  let i = 0;
  const n = s.length;
  const pushImplicit = (next: Tok) => {
    const last = out[out.length - 1];
    if (!last) return;
    const lastEndsVal =
      last.t === "num" || last.t === "var" || last.t === "const" || last.t === "rp" ||
      (last.t === "op" && last.v === "!");
    const nextStartsVal =
      next.t === "num" || next.t === "var" || next.t === "const" ||
      next.t === "func" || next.t === "lp";
    if (lastEndsVal && nextStartsVal) {
      out.push({ t: "op", v: "*" });
    }
  };
  while (i < n) {
    const c = s[i];
    if (isDigit(c) || (c === "." && i + 1 < n && isDigit(s[i + 1]))) {
      let j = i + 1;
      while (j < n && (isDigit(s[j]) || s[j] === ".")) j++;
      // 科学计数法
      if (j < n && (s[j] === "e" || s[j] === "E")) {
        // 但要避免把 ex 中的 e 误判为指数
        const next = s[j + 1];
        if (next === "+" || next === "-" || isDigit(next)) {
          let k = j + 1;
          if (s[k] === "+" || s[k] === "-") k++;
          while (k < n && isDigit(s[k])) k++;
          if (k > j + 1) j = k;
        }
      }
      const numStr = s.slice(i, j);
      const v = parseFloat(numStr);
      if (Number.isNaN(v)) throw new Error(`无法解析数字: ${numStr}`);
      const tok: Tok = { t: "num", v };
      pushImplicit(tok);
      out.push(tok);
      i = j;
      continue;
    }
    if (isAlpha(c)) {
      let j = i + 1;
      while (j < n && isAlnum(s[j])) j++;
      const name = s.slice(i, j).toLowerCase();
      let tok: Tok;
      if (name === "x" || name === "y") tok = { t: "var", v: name };
      else if (CONSTS.has(name)) tok = { t: "const", v: name };
      else if (FUNCS.has(name)) tok = { t: "func", v: name };
      else throw new Error(`未知标识符: ${name}`);
      pushImplicit(tok);
      out.push(tok);
      i = j;
      continue;
    }
    if (c === "(") {
      const tok: Tok = { t: "lp" };
      pushImplicit(tok);
      out.push(tok);
      i++;
      continue;
    }
    if (c === ")") {
      out.push({ t: "rp" });
      i++;
      continue;
    }
    if (c === ",") {
      out.push({ t: "comma" });
      i++;
      continue;
    }
    if ("+-*/^%".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "!") {
      out.push({ t: "op", v: "!" });
      i++;
      continue;
    }
    if (c === "π") {
      const tok: Tok = { t: "const", v: "pi" };
      pushImplicit(tok);
      out.push(tok);
      i++;
      continue;
    }
    if (c === "×") { out.push({ t: "op", v: "*" }); i++; continue; }
    if (c === "÷") { out.push({ t: "op", v: "/" }); i++; continue; }
    if (c === "^") { out.push({ t: "op", v: "^" }); i++; continue; }
    if (c === "√") {
      const tok: Tok = { t: "func", v: "sqrt" };
      pushImplicit(tok);
      out.push(tok);
      i++;
      continue;
    }
    throw new Error(`非法字符: ${c}`);
  }
  return out;
}

export class Parser {
  private toks: Tok[];
  private i = 0;
  constructor(toks: Tok[]) { this.toks = toks; }
  parse(): Ast {
    const ast = this.parseExpr();
    if (this.i !== this.toks.length) throw new Error("存在未消费的 token");
    return ast;
  }
  private peek(): Tok | undefined { return this.toks[this.i]; }
  private next(): Tok | undefined { return this.toks[this.i++]; }
  private parseExpr(): Ast {
    let l = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "+" || t.v === "-")) {
        this.next();
        const r = this.parseTerm();
        l = { type: "bin", op: t.v, l, r };
      } else break;
    }
    return l;
  }
  private parseTerm(): Ast {
    let l = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "*" || t.v === "/" || t.v === "%")) {
        this.next();
        const r = this.parseUnary();
        l = { type: "bin", op: t.v, l, r };
      } else break;
    }
    return l;
  }
  private parseUnary(): Ast {
    const t = this.peek();
    if (t && t.t === "op" && (t.v === "+" || t.v === "-")) {
      this.next();
      const a = this.parseUnary();
      return { type: "unary", op: t.v as "-" | "+", a };
    }
    return this.parsePower();
  }
  private parsePower(): Ast {
    const base = this.parseFactorial();
    const t = this.peek();
    if (t && t.t === "op" && t.v === "^") {
      this.next();
      const r = this.parseUnary(); // 右结合，且允许 2^-3
      return { type: "bin", op: "^", l: base, r };
    }
    return base;
  }
  private parseFactorial(): Ast {
    let a = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && t.v === "!") {
        this.next();
        a = { type: "fact", a };
      } else break;
    }
    return a;
  }
  private parsePrimary(): Ast {
    const t = this.next();
    if (!t) throw new Error("表达式不完整");
    if (t.t === "num") return { type: "num", v: t.v };
    if (t.t === "var") return { type: "var", name: t.v };
    if (t.t === "const") return { type: "const", name: t.v };
    if (t.t === "func") {
      const lp = this.next();
      if (!lp || lp.t !== "lp") throw new Error(`函数 ${t.v} 后需要 '('`);
      const arg = this.parseExpr();
      const rp = this.next();
      if (!rp || rp.t !== "rp") throw new Error(`函数 ${t.v} 缺少 ')'`);
      return { type: "call", name: t.v, arg };
    }
    if (t.t === "lp") {
      const inner = this.parseExpr();
      const rp = this.next();
      if (!rp || rp.t !== "rp") throw new Error("缺少 ')'");
      return inner;
    }
    throw new Error(`意外 token: ${JSON.stringify(t)}`);
  }
}

export function parse(input: string): Ast {
  return new Parser(tokenize(input)).parse();
}

// 多项式表示：c0 + c1*x + c2*x^2，仅到二次
export type Poly = { c0: number; c1: number; c2: number };

function numToPoly(v: number): Poly { return { c0: v, c1: 0, c2: 0 }; }
function addPoly(a: Poly, b: Poly): Poly { return { c0: a.c0 + b.c0, c1: a.c1 + b.c1, c2: a.c2 + b.c2 }; }
function subPoly(a: Poly, b: Poly): Poly { return { c0: a.c0 - b.c0, c1: a.c1 - b.c1, c2: a.c2 - b.c2 }; }
function mulPoly(a: Poly, b: Poly): Poly {
  // (a0+a1x+a2x^2)*(b0+b1x+b2x^2)，截断到二次
  const c0 = a.c0 * b.c0;
  const c1 = a.c0 * b.c1 + a.c1 * b.c0;
  const c2 = a.c0 * b.c2 + a.c1 * b.c1 + a.c2 * b.c0;
  return { c0, c1, c2 };
}
function negPoly(a: Poly): Poly { return { c0: -a.c0, c1: -a.c1, c2: -a.c2 }; }

const CONST_VALUES: Record<string, number> = { pi: Math.PI, e: Math.E, tau: Math.PI * 2 };

export function toPoly(ast: Ast): Poly {
  switch (ast.type) {
    case "num": return numToPoly(ast.v);
    case "const": return numToPoly(CONST_VALUES[ast.name] ?? NaN);
    case "var": {
      if (ast.name === "x") return { c0: 0, c1: 1, c2: 0 };
      throw new Error(`方程中不支持变量 ${ast.name}`);
    }
    case "unary": {
      const p = toPoly(ast.a);
      return ast.op === "-" ? negPoly(p) : p;
    }
    case "bin": {
      const l = toPoly(ast.l);
      const r = toPoly(ast.r);
      switch (ast.op) {
        case "+": return addPoly(l, r);
        case "-": return subPoly(l, r);
        case "*": return mulPoly(l, r);
        case "/": {
          // 仅允许除以常数
          if (r.c1 === 0 && r.c2 === 0) {
            const k = 1 / r.c0;
            return { c0: l.c0 * k, c1: l.c1 * k, c2: l.c2 * k };
          }
          throw new Error("方程不支持除以含 x 的表达式");
        }
        case "%": throw new Error("方程不支持取模运算");
        case "^": {
          // 仅支持整数次幂
          if (r.c1 !== 0 || r.c2 !== 0) throw new Error("方程中指数必须为常数");
          const k = r.c0;
          if (k < 0) throw new Error("方程不支持负指数");
          if (Number.isInteger(k)) {
            if (k === 0) return numToPoly(1);
            if (k === 1) return l;
            if (k === 2) return mulPoly(l, l);
            if (k >= 3) {
              // x^3 及以上：仅当 l 是纯常数才支持；否则方程超过二次
              if (l.c1 === 0 && l.c2 === 0) {
                return numToPoly(Math.pow(l.c0, k));
              }
              throw new Error("方程仅支持一元二次以内的方程");
            }
          }
          // 非整数指数：仅当底为常数
          if (l.c1 === 0 && l.c2 === 0) return numToPoly(Math.pow(l.c0, k));
          throw new Error("方程中指数必须为整数");
        }
      }
      throw new Error(`未知运算符 ${ast.op}`);
    }
    case "fact": throw new Error("方程不支持阶乘");
    case "call": throw new Error(`方程不支持函数 ${ast.name}`);
  }
}

export interface EvalEnv {
  x?: number;
  angle: "deg" | "rad";
}

function toRad(v: number, angle: "deg" | "rad"): number {
  return angle === "deg" ? (v * Math.PI) / 180 : v;
}
function fromRad(v: number, angle: "deg" | "rad"): number {
  return angle === "deg" ? (v * 180) / Math.PI : v;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

export function evalNum(ast: Ast, env: EvalEnv): number {
  switch (ast.type) {
    case "num": return ast.v;
    case "const": return CONST_VALUES[ast.name] ?? NaN;
    case "var": {
      if (ast.name === "x") return env.x ?? NaN;
      if (ast.name === "y") return env.x ?? NaN;
      return NaN;
    }
    case "unary": {
      const v = evalNum(ast.a, env);
      return ast.op === "-" ? -v : v;
    }
    case "bin": {
      const l = evalNum(ast.l, env);
      const r = evalNum(ast.r, env);
      switch (ast.op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/": return l / r;
        case "%": return l % r;
        case "^": return Math.pow(l, r);
      }
      throw new Error(`未知运算符 ${ast.op}`);
    }
    case "fact": return factorial(evalNum(ast.a, env));
    case "call": {
      const v = evalNum(ast.arg, env);
      switch (ast.name) {
        case "sin": return Math.sin(toRad(v, env.angle));
        case "cos": return Math.cos(toRad(v, env.angle));
        case "tan": return Math.tan(toRad(v, env.angle));
        case "asin": return fromRad(Math.asin(v), env.angle);
        case "acos": return fromRad(Math.acos(v), env.angle);
        case "atan": return fromRad(Math.atan(v), env.angle);
        case "sinh": return Math.sinh(v);
        case "cosh": return Math.cosh(v);
        case "tanh": return Math.tanh(v);
        case "ln": return Math.log(v);
        case "log": return Math.log10(v);
        case "log2": return Math.log2(v);
        case "exp": return Math.exp(v);
        case "sqrt": return Math.sqrt(v);
        case "cbrt": return Math.cbrt(v);
        case "abs": return Math.abs(v);
      }
      throw new Error(`未知函数 ${ast.name}`);
    }
  }
}

export function evaluate(input: string, env: EvalEnv): number {
  return evalNum(parse(input), env);
}
