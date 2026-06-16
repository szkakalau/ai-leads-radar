# AI获客机会雷达（深圳房产版）V1.0 — 技术设计文档

**日期**: 2026-06-16  
**版本**: V1.0 MVP  
**基于**: 《AI获客机会雷达（深圳房产版）V1.0 MVP 产品需求文档》

---

## 一、技术选型总览

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | 微信小程序原生 (WXML + WXSS + JS) | 无额外框架，体积最小 |
| 后端 | 微信云函数 (Node.js 18+) | 免运维，自动扩缩容 |
| 数据库 | 微信云数据库 (NoSQL) | 4 张核心表 |
| 存储 | 微信云存储 | 付款凭证截图 |
| 管理后台 | 单页 HTML + 云托管 | 无框架，极简实现 |
| AI 模型 | DeepSeek V4 Pro (deepseek-chat) | 仅做文案润色 |
| 数据源 | V1.0 模拟数据 | 验证通过后对接第三方 API |
| 支付 | 微信收款码 + 人工审核 | V1.0 不做 OCR 自动识别 |

### 设计哲学

- **纯微信生态**：全部能力在微信云开发体系内完成，零外部服务器
- **AI 只润色不做判断**：DeepSeek 仅负责文案表述，所有评级结论由固定规则计算
- **数据与逻辑分离**：模拟数据结构与正式数据完全一致，后续对接真实 API 无需改 Schema

---

## 二、前端架构

### 2.1 页面结构

```
app.json 配置底部 TabBar（4 个固定 Tab）
├── pages/today/index       ← Tab1 今日（首页）
├── pages/week/index        ← Tab2 本周
├── pages/history/index     ← Tab3 历史
│     └── pages/history/detail ← 历史日报详情页
├── pages/mine/index        ← Tab4 我的
│     ├── pages/payment/index  ← 付款详情页
│     └── pages/faq/index      ← 常见问题
└── pages/login/index       ← 微信授权登录页
```

### 2.2 公共组件（5个）

| 组件 | 用途 | 复用页面 |
|------|------|----------|
| `opportunity-card` | S/A 级机会卡片，含生命周期进度条、折叠数据详情 | 今日、历史详情 |
| `risk-card` | 风险预警卡片，含折叠风险详情 | 今日、历史详情 |
| `area-ranking` | 片区热度榜列表（火焰图标 + 趋势） | 今日、历史详情 |
| `peer-reference` | 同行黑马参考列表 | 今日、历史详情 |
| `paywall-mask` | 未付费遮罩 + 引导开通会员 | 今日、本周、历史 |

### 2.3 设计规范

- **主色调**：商务深蓝 `#1a237e`
- **机会标识色**：S 级 `#c62828`（红）、A 级 `#e65100`（橙）、风险 `#757575`（灰）
- **过渡动画**：所有状态切换使用 `duration-200 ease-out`，禁止突变
- **视觉层级**：依靠文字粗细和间距建立层级，无装饰元素、无背景渐变
- **移动端优先**：适配 iOS/Android 主流机型，文字无截断

### 2.4 Tab 页面关键交互

**Tab1 今日（7 个模块垂直排列）**：
1. 顶部标题栏（产品名 + 日期）
2. 核心速览（免费可见，3 条结论）
3. S 级机会卡片（付费可见，未付费显示 paywall-mask）
4. A 级机会卡片（同上）
5. 风险预警模块（同上）
6. 片区热度榜（同上）
7. 同行黑马参考（同上）
8. 底部合规提示（固定展示）

**Tab2 本周**：战场排名 TOP 榜 → 需求说明 → 操作建议，全部付费可见

**Tab3 历史**：按日期倒序列表，点击进入详情页（复用今日页结构）

**Tab4 我的**：用户信息 → 会员状态 → 付费档位卡片 → 常见问题 → 联系客服

---

## 三、后端架构

### 3.1 云函数清单

**用户端（6个）**：

| 函数名 | 触发方式 | 功能 | 权限 |
|--------|----------|------|------|
| `login` | 小程序调用 | 微信授权登录，新用户自动注册 | 公开 |
| `get-daily-report` | 小程序调用 | 获取今日日报，未付费用户仅返回 core_summary | 按权限裁剪 |
| `get-week-rank` | 小程序调用 | 获取本周战场内容 | 需付费 |
| `get-history-list` | 小程序调用 | 历史日报列表（分页，每页 20 条） | 需付费 |
| `get-history-detail` | 小程序调用 | 某日日报详情（参数：date） | 需付费 |
| `submit-order` | 小程序调用 | 上传付款截图 → 云存储 → 写入订单表 | 公开 |

**管理端 + 自动化（5个）**：

| 函数名 | 触发方式 | 功能 |
|--------|----------|------|
| `admin-auth` | HTTP 调用 | 管理员账号密码登录，返回 session |
| `admin-audit-order` | HTTP 调用 | 审核订单（通过/驳回），通过后更新用户会员状态 |
| `admin-manage-report` | HTTP 调用 | 日报内容 CRUD，支持设置发布状态 |
| `admin-get-stats` | HTTP 调用 | 基础数据概览（用户数、付费数、访问数） |
| `generate-report` | 定时触发 / 手动触发 | AI 日报生成：规则评级 + DeepSeek 润色 → 存待审核 |

### 3.2 权限控制

- **未付费用户**：仅 `login`、`get-daily-report`（裁剪版）、`submit-order` 可正常返回完整数据
- **付费会员**：所有内容函数返回完整数据
- **内容裁剪在云函数层实现**：前端不判断权限，避免客户端篡改绕过

### 3.3 模拟数据策略

V1.0 使用预设模拟数据，结构完全对齐真实数据格式：

```
mock/data.js 包含：
- 深圳 6 个片区（龙华、宝安、南山、福田、罗湖、龙岗）的需求指标
- 每日 3-5 个话题方向的数据（供需比、增速、购买意图占比）
- 5-8 个同行爆款案例
- 数据每天变化以模拟真实趋势
```

---

## 四、数据库设计

完全按 PRD 第九章定义，4 张表：

### daily_report（日报内容表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `date` | string | YYYY-MM-DD |
| `core_summary` | object | `{must_do, must_not, hot_area}` |
| `s_opportunity` | object | S 级机会详情 |
| `a_opportunity` | object | A 级机会详情 |
| `risk_warning` | object | 风险预警详情 |
| `area_rank` | array | 片区热度榜 |
| `peer_reference` | array | 同行参考 |
| `status` | number | 0=待审核, 1=已发布 |
| `create_time` | date | 创建时间 |
| `update_time` | date | 更新时间 |

### week_rank（本周战场表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `week_num` | string | YYYY年第X周 |
| `top_list` | array | 战场排名 |
| `risk_item` | object | 风险赛道 |
| `week_summary` | string | 需求总结 |

### user_info（用户信息表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `openid` | string | 微信唯一标识 |
| `nick_name` | string | 微信昵称 |
| `avatar_url` | string | 头像链接 |
| `member_status` | number | 0=普通, 1=会员 |
| `member_expire_time` | date | 会员到期时间 |
| `register_time` | date | 注册时间 |

### payment_order（付款订单表）
| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `user_openid` | string | 用户 openid |
| `plan_type` | string | personal / store |
| `amount` | number | 付款金额 |
| `voucher_url` | string | 凭证图片云存储 URL |
| `contact_wechat` | string | 用户联系微信号 |
| `audit_status` | number | 0=待审核, 1=通过, 2=驳回 |
| `reject_reason` | string | 驳回原因 |
| `submit_time` | date | 提交时间 |
| `audit_time` | date | 审核时间 |

---

## 五、管理后台

### 5.1 技术方案

- 部署方式：微信云托管（CloudBase Hosting）
- 技术选型：单页 HTML + 原生 CSS/JS，无框架
- 认证方式：固定管理员账号密码，云函数校验

### 5.2 功能模块

| 模块 | 功能 |
|------|------|
| 数据概览 | 总用户数、今日新增、付费用户数、待审核订单数 |
| 内容管理 | 日报列表 → 新建/编辑/删除，本周战场编辑，发布状态切换 |
| 用户管理 | 用户列表（昵称、openid、会员状态、到期时间），手动修改会员状态 |
| 订单审核 | 订单列表，查看付款截图，通过/驳回操作 |
| AI 生成 | 手动触发 generate-report 云函数，查看生成结果，审核后发布 |

---

## 六、AI 日报生成流程

### 6.1 Pipeline

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────┐    ┌────────┐
│ 模拟数据源    │ →  │ 规则引擎     │ →  │ DeepSeek API │ →  │ 人工审核  │ →  │ 发布    │
│ (JSON 数据集) │    │ (纯代码计算) │    │ (文案润色)   │    │ (后台确认)│    │ 对用户  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────┘    └────────┘
```

### 6.2 规则引擎（代码实现，AI 不参与判断）

| 评级 | 判定标准 |
|------|----------|
| S 级机会 | 供需比 > 5；高购买意图占比 > 60%；日需求增速 > 100%；处于爆发初期 |
| A 级机会 | 供需比 2-5；高购买意图占比 > 50%；日需求增速 50%-100%；处于上升期 |
| 风险预警 | 供需比 < 0.5；供给增速远高于需求增速；处于衰退期 |

生命周期判断：
- 预热期：需求连续 2 天上涨，增速 < 50%
- 爆发期：需求增速 > 100%，持续 1-3 天
- 高峰期：需求增速放缓，保持高位，持续 1-2 天
- 衰退期：需求连续 2 天下滑，供给持续增长

### 6.3 DeepSeek API 集成

```
Endpoint: https://api.deepseek.com/v1/chat/completions
Model: deepseek-chat
调用位置: 云函数 generate-report
API Key: 存于云函数环境变量 DEEPSEEK_API_KEY

成本: 每天 1 次调用，约 2000 tokens，月成本 < ¥1
```

**Prompt 约束**：
- 固定 System Prompt 模板
- 仅润色文案表达，不改动任何数据结论
- 每条文案 ≤ 60 字
- 严格按模板格式输出 JSON

### 6.4 运营流程

1. 每日早上或手动触发 `generate-report` 云函数
2. 结果存入 `daily_report` 表，status = 0（待审核）
3. 运营在管理后台查看、校准、编辑
4. 确认无误，点击发布，status → 1
5. 小程序端用户刷新即可看到最新日报

---

## 七、支付开通流程

### 7.1 用户端流程

1. 「我的」页面 → 选择档位（个人版 49 元 / 单店版 599 元）
2. 展示微信收款码 + 价格 + 权益说明
3. 用户扫码付款 → 截图 → 点击「上传付款凭证」
4. 填写联系微信号 → 提交
5. 提示「10 分钟内审核开通」

### 7.2 管理端审核流程

1. 运营后台查看待审核订单
2. 核对付款截图（金额 + 时间）
3. 通过 → 更新 `user_info.member_status = 1`，设置 30 天到期
4. 驳回 → 填写原因

### 7.3 V1.1 预留：OCR 自动审核

后续通过 OCR 自动识别付款金额和付款时间，匹配成功自动开通，仅异常订单人工处理。

---

## 八、项目结构

```
房产中介agent/
├── miniprogram/              # 小程序前端代码
│   ├── app.js                # 入口，初始化云开发
│   ├── app.json              # 全局配置 + TabBar
│   ├── app.wxss              # 全局样式
│   ├── pages/
│   │   ├── today/            # 今日页
│   │   ├── week/             # 本周页
│   │   ├── history/          # 历史页
│   │   │   └── detail/       # 历史详情页
│   │   ├── mine/             # 我的页
│   │   │   ├── payment/      # 付款页
│   │   │   └── faq/          # 常见问题
│   │   └── login/            # 登录页
│   └── components/           # 公共组件
│       ├── opportunity-card/
│       ├── risk-card/
│       ├── area-ranking/
│       ├── peer-reference/
│       └── paywall-mask/
├── cloudfunctions/           # 云函数
│   ├── login/
│   ├── get-daily-report/
│   ├── get-week-rank/
│   ├── get-history-list/
│   ├── get-history-detail/
│   ├── submit-order/
│   ├── admin-auth/
│   ├── admin-audit-order/
│   ├── admin-manage-report/
│   ├── admin-get-stats/
│   └── generate-report/
├── admin/                    # 管理后台
│   └── index.html
├── mock/                     # 模拟数据
│   └── data.js
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-06-16-ai-leads-radar-design.md
└── PRD.txt                   # 原始需求文档
```

---

## 九、开发顺序

按 PRD 排期逻辑，2 天分 4 个阶段：

| 阶段 | 时间 | 内容 |
|------|------|------|
| P1 | Day1 上午 | 小程序项目搭建、云开发初始化、底部 TabBar + 4 个页面骨架 |
| P2 | Day1 下午 | 云函数开发 + 数据库建表 + 模拟数据填充 + 前端数据联调 |
| P3 | Day2 上午 | 支付流程 + 权限逻辑 + 管理后台 + DeepSeek 集成 |
| P4 | Day2 下午 | 全链路联调、异常处理、合规提示、上线检查 |

---

## 十、风险与约束

| 风险 | 应对 |
|------|------|
| 云函数冷启动延迟 | 首屏使用缓存策略，设置云函数最小实例数 |
| DeepSeek API 不稳定 | generate-report 支持手动重试，失败不影响已发布内容 |
| 付款凭证审核压力 | 初期用户量小（种子 30 人），人工审核完全可行 |
| 模拟数据不够真实 | 每日手动维护 3-5 条数据变更，模拟真实市场波动 |
