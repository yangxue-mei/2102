# 个人账本 Web 应用 — 需求说明

## 目标
在 AutoAgent 平台上交付一个完整可用的个人账本应用，支持用户注册/登录、私有数据隔离、收支账目 CRUD、自定义分类、汇总统计、可视化与导出。

## 技术栈
- 前端：Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router
- 后端：Supabase（Auth + Postgres + RLS + Trigger）
- 图表：Chart.js（react-chartjs-2 的 Doughnut）
- 导出：CSV（Blob 下载，UTF-8 BOM）；PDF（jspdf + html2canvas，A4 多页）

## 模块
1. 认证：用户名+密码（内部映射为 `<username>@ledger.local`），登录后跳转仪表盘，未登录拦截。
2. 账目管理：金额 > 0、日期必填、分类必选；保存/编辑/删除成功后 Toast 提示并刷新列表；点击历史可编辑预填。
3. 分类管理：预设 7 个（餐饮/交通/购物/娱乐 + 工资/奖金/理财），通过 trigger 在新用户注册时自动写入；独立页面新增/重命名/删除自定义分类。
4. 汇总：月度/年度视图切换 + 月份/年份选择器，联动所有图表与列表。
5. 可视化：支出分类占比饼图（当前周期）。
6. 导出：CSV 表头 `[日期, 类型, 分类, 金额, 备注]`；PDF A4 报表包含报表时间段、收支汇总、分类占比图、明细清单。
7. UI/UX：PC 侧栏 + 移动端顶栏，卡片式 Dashboard；支出暖色（红/橙）、收入冷色（绿/蓝），响应式 Tailwind breakpoints。

## 数据隔离
- `categories.user_id` 与 `transactions.user_id` 均外键 `auth.users(id)`，开启 RLS，`auth.uid() = user_id` 的 select/insert/update/delete 策略。
