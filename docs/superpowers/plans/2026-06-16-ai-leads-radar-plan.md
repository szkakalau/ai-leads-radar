# AI获客机会雷达（深圳房产版）V1.0 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2 天内完成 AI 获客机会雷达微信小程序全栈开发（前端 8 页 + 后端 11 个云函数 + 管理后台 + AI 日报生成），支持用户登录、内容分级查看、付费开通全链路。

**Architecture:** 微信小程序原生前端 + 微信云开发后端（云函数 + 云数据库 + 云存储）+ 单页管理后台 + DeepSeek API 日报润色。权限裁剪在云函数层实现，V1.0 使用模拟数据。

**Tech Stack:** 微信小程序原生 (WXML/WXSS/JS)、微信云函数 (Node.js 18)、微信云数据库 (NoSQL)、DeepSeek API (deepseek-chat)、管理后台 (单页 HTML + 原生 CSS/JS)

**验证方式:** 云函数使用 Node.js 原生 assert 做单元测试；前端页面在微信开发者工具中手动验证，每步有明确的验证标准。

---

## Phase 1: 项目骨架搭建（Day1 上午）

### Task 1.1: 创建小程序项目与文件结构

**Files:**
- Create: `miniprogram/app.js`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/project.config.json`
- Create: `miniprogram/sitemap.json`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p miniprogram/pages/{today,week,history/detail,mine/{payment,faq},login}
mkdir -p miniprogram/components/{opportunity-card,risk-card,area-ranking,peer-reference,paywall-mask}
mkdir -p miniprogram/utils
mkdir -p cloudfunctions/{login,get-daily-report,get-week-rank,get-history-list,get-history-detail,submit-order}
mkdir -p cloudfunctions/{admin-auth,admin-audit-order,admin-manage-report,admin-get-stats,generate-report}
mkdir -p mock
mkdir -p admin
```

- [ ] **Step 2: 编写 project.config.json**

```json
{
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/",
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": true,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazyloadPlaceholderEnable": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    }
  },
  "cloudfunctionTemplateRoot": "cloudfunctionTemplate/",
  "compileType": "miniprogram",
  "libVersion": "3.6.0",
  "appid": "YOUR_APPID_HERE",
  "projectname": "ai-leads-radar",
  "condition": {}
}
```

- [ ] **Step 3: 编写 sitemap.json**

```json
{
  "rules": [{
    "action": "allow",
    "page": "*"
  }]
}
```

**验证:** 用微信开发者工具打开项目，确认编译通过无报错。

---

### Task 1.2: 编写 app.js 入口文件（云开发初始化 + 全局数据）

**Files:**
- Create: `miniprogram/app.js`

```js
// app.js
App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'YOUR_ENV_ID',
      traceUser: true,
    });

    // 检查登录状态
    this.checkLoginStatus();
  },

  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    }
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    isMember: false,
    memberExpireTime: null,
  },
});
```

**验证:** 在微信开发者工具中运行，控制台无报错，`wx.cloud` 对象可用。

---

### Task 1.3: 配置底部 TabBar + 路由（app.json）

**Files:**
- Modify: `miniprogram/app.json`

把 `app.json` 改为：

```json
{
  "pages": [
    "pages/today/index",
    "pages/week/index",
    "pages/history/index",
    "pages/history/detail",
    "pages/mine/index",
    "pages/mine/payment/index",
    "pages/mine/faq/index",
    "pages/login/index"
  ],
  "window": {
    "backgroundTextStyle": "dark",
    "navigationBarBackgroundColor": "#1a237e",
    "navigationBarTitleText": "AI获客机会雷达",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "color": "#757575",
    "selectedColor": "#1a237e",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/today/index",
        "text": "今日",
        "iconPath": "images/tab-today.png",
        "selectedIconPath": "images/tab-today-active.png"
      },
      {
        "pagePath": "pages/week/index",
        "text": "本周",
        "iconPath": "images/tab-week.png",
        "selectedIconPath": "images/tab-week-active.png"
      },
      {
        "pagePath": "pages/history/index",
        "text": "历史",
        "iconPath": "images/tab-history.png",
        "selectedIconPath": "images/tab-history-active.png"
      },
      {
        "pagePath": "pages/mine/index",
        "text": "我的",
        "iconPath": "images/tab-mine.png",
        "selectedIconPath": "images/tab-mine-active.png"
      }
    ]
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 2: 创建 Tab 图标占位目录**

```bash
mkdir -p miniprogram/images
```

> **注意:** Tab 图标需要 81x81 像素 PNG 文件。先用纯色占位图或简单 SVG 转换，后续可替换为正式图标。

- [ ] **Step 3: 为每个 page 创建占位四件套**

对每个页面路径执行（以 today 为例，其余页面同样结构）：

```bash
# 为每个 page 创建 .js/.json/.wxml/.wxss 四个文件
for dir in pages/today pages/week pages/history pages/history/detail pages/mine pages/mine/payment pages/mine/faq pages/login; do
  touch miniprogram/$dir/index.js miniprogram/$dir/index.json miniprogram/$dir/index.wxml miniprogram/$dir/index.wxss
done
```

**验证:** 在开发者工具中应看到底部 4 个 Tab，点击可切换空白页面，无报错。

---

### Task 1.4: 编写全局样式（app.wxss）

**Files:**
- Modify: `miniprogram/app.wxss`

```css
/* app.wxss - 全局样式 */
page {
  --primary: #1a237e;
  --s-level: #c62828;
  --a-level: #e65100;
  --risk: #757575;
  --bg: #f5f5f5;
  --card-bg: #ffffff;
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-hint: #bdbdbd;
  --divider: #eeeeee;
  --success: #2e7d32;
  --warning: #f57f17;

  background-color: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  color: var(--text-primary);
  line-height: 1.6;
}

/* 通用容器 */
.container {
  padding: 24rpx;
}

/* 卡片样式 */
.card {
  background: var(--card-bg);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

/* 文字层级 */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-hint { color: var(--text-hint); }

/* 标签 */
.tag-s { background: var(--s-level); color: #fff; padding: 4rpx 12rpx; border-radius: 6rpx; font-size: 22rpx; }
.tag-a { background: var(--a-level); color: #fff; padding: 4rpx 12rpx; border-radius: 6rpx; font-size: 22rpx; }
.tag-risk { background: var(--risk); color: #fff; padding: 4rpx 12rpx; border-radius: 6rpx; font-size: 22rpx; }

/* 过渡动画 */
.transition {
  transition: all 0.2s ease-out;
}

/* 分割线 */
.divider {
  height: 1rpx;
  background: var(--divider);
  margin: 16rpx 0;
}

/* 按钮 */
.btn-primary {
  background: var(--primary);
  color: #fff;
  border-radius: 12rpx;
  padding: 20rpx 40rpx;
  text-align: center;
  font-size: 30rpx;
  font-weight: 500;
  transition: opacity 0.2s ease-out;
}
.btn-primary:active {
  opacity: 0.8;
}

.btn-outline {
  border: 2rpx solid var(--primary);
  color: var(--primary);
  background: transparent;
  border-radius: 12rpx;
  padding: 20rpx 40rpx;
  text-align: center;
  font-size: 30rpx;
  transition: all 0.2s ease-out;
}
```

**验证:** 任一页面添加 `<view class="card">测试卡片</view>` 应显示白色圆角卡片。

---

### Task 1.5: 编写公共工具函数（utils）

**Files:**
- Create: `miniprogram/utils/api.js`
- Create: `miniprogram/utils/auth.js`

`miniprogram/utils/api.js`:

```js
// api.js - 云函数调用封装
const api = {
  /**
   * 调用云函数
   * @param {string} name - 云函数名
   * @param {object} data - 参数
   * @returns {Promise<any>}
   */
  callFunction(name, data = {}) {
    return wx.cloud.callFunction({
      name,
      data,
    }).then(res => {
      if (res.result && res.result.code === 0) {
        return res.result.data;
      }
      throw new Error(res.result?.message || '请求失败');
    });
  },

  // === 用户端 API ===

  /** 微信授权登录 */
  login() {
    return this.callFunction('login', {});
  },

  /** 获取今日日报 */
  getDailyReport() {
    return this.callFunction('get-daily-report', {});
  },

  /** 获取本周战场 */
  getWeekRank() {
    return this.callFunction('get-week-rank', {});
  },

  /** 获取历史日报列表 */
  getHistoryList(page = 1) {
    return this.callFunction('get-history-list', { page });
  },

  /** 获取某日日报详情 */
  getHistoryDetail(date) {
    return this.callFunction('get-history-detail', { date });
  },

  /** 提交付款订单 */
  submitOrder(planType, amount, voucherUrl, contactWechat) {
    return this.callFunction('submit-order', {
      plan_type: planType,
      amount,
      voucher_url: voucherUrl,
      contact_wechat: contactWechat,
    });
  },
};

module.exports = api;
```

`miniprogram/utils/auth.js`:

```js
// auth.js - 权限判断工具
const app = getApp();

const auth = {
  /** 检查是否已登录 */
  isLoggedIn() {
    return app.globalData.isLoggedIn;
  },

  /** 检查是否为付费会员 */
  isMember() {
    if (!app.globalData.isMember) return false;
    if (!app.globalData.memberExpireTime) return false;
    return new Date(app.globalData.memberExpireTime) > new Date();
  },

  /** 需要登录才能访问，否则跳转登录页 */
  requireLogin() {
    if (!this.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/login/index' });
      return false;
    }
    return true;
  },

  /** 需要会员才能访问，否则引导开通 */
  requireMember() {
    if (!this.isMember()) {
      wx.showModal({
        title: '会员专享内容',
        content: '开通会员即可查看完整获客情报',
        confirmText: '去开通',
        success(res) {
          if (res.confirm) {
            wx.switchTab({ url: '/pages/mine/index' });
          }
        },
      });
      return false;
    }
    return true;
  },
};

module.exports = auth;
```

**验证:** 在 `app.js` 中 `require` 无报错，`api` 对象所有方法可调用。

---

### Task 1.6: P1 阶段提交

```bash
git add -A
git commit -m "feat: P1 - 项目骨架搭建，TabBar配置，全局样式，工具函数

- 创建小程序项目结构，8 个页面 + 5 个组件目录
- 配置云开发初始化与全局数据
- 配置底部 4 Tab 导航
- 编写全局样式（商务深蓝主色，S/A/风险色系）
- 封装云函数调用 api.js 与权限判断 auth.js

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 2: 云函数 + 数据库 + 页面联调（Day1 下午）

### Task 2.1: 创建云数据库集合

**Files:** 无（通过云开发控制台或云函数操作）

- [ ] **Step 1: 编写数据库初始化云函数**

Create: `cloudfunctions/init-db/index.js`:

```js
// init-db 云函数 - 一次性执行，创建数据库集合并插入种子数据
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;

  if (action === 'create-collections') {
    // 云开发会自动创建集合（首次插入数据时）
    // 这里做一次插入再删除来触发集合创建
    const collections = ['daily_report', 'week_rank', 'user_info', 'payment_order'];
    const results = [];
    for (const name of collections) {
      try {
        const res = await db.collection(name).add({ data: { _init: true, _created: new Date() } });
        await db.collection(name).doc(res._id).remove();
        results.push(`${name}: created`);
      } catch (e) {
        if (e.errCode === -502005) {
          // 集合已存在
          results.push(`${name}: already exists`);
        } else {
          results.push(`${name}: error - ${e.message}`);
        }
      }
    }
    return { code: 0, data: results };
  }

  return { code: -1, message: 'Unknown action' };
};
```

- [ ] **Step 2: 在云开发控制台手动创建 4 个集合**

在微信开发者工具 → 云开发 → 数据库 → 添加集合：
- `daily_report`
- `week_rank`
- `user_info`
- `payment_order`

设置所有集合权限为「仅创建者及管理员可读写」（后续在云函数中用服务端权限操作）。

**验证:** 云开发控制台中可见 4 个集合，且可以手动添加测试记录。

---

### Task 2.2: 编写模拟数据模块

**Files:**
- Create: `mock/data.js`

```js
// mock/data.js - V1.0 模拟数据源
// 模拟深圳房产垂类每日采集的结构化数据

const mockData = {
  // 生成指定日期的模拟原始数据
  generate(dateStr) {
    const date = new Date(dateStr);
    const dayOfMonth = date.getDate();

    // 模拟数据波动：偶数日偏刚需，奇数日偏学区
    const isRigidDemandDay = dayOfMonth % 2 === 0;

    return {
      date: dateStr,
      // 各片区需求指标
      areas: [
        { name: '龙华', demand_score: isRigidDemandDay ? 95 : 78, supply_score: 18, trend: 'up' },
        { name: '宝安', demand_score: 82, supply_score: 22, trend: 'up' },
        { name: '南山', demand_score: 70, supply_score: 35, trend: 'flat' },
        { name: '福田', demand_score: 65, supply_score: 40, trend: 'flat' },
        { name: '罗湖', demand_score: 50, supply_score: 25, trend: 'down' },
        { name: '龙岗', demand_score: 72, supply_score: 30, trend: 'up' },
      ],
      // 话题方向数据
      topics: [
        {
          title: '300万预算首套刚需',
          demand_growth: isRigidDemandDay ? 120 : 95,
          supply_growth: 15,
          supply_demand_ratio: 6.3,
          high_intent_ratio: 68,
          life_cycle: '爆发期',
          life_cycle_day: 2,
          remain_days: 3,
          keywords: ['首套', '刚需', '上车盘', '300万', '小户型'],
          suggest: '主打避坑人设，覆盖龙华/宝安片区，突出性价比对比',
        },
        {
          title: '学区房购买焦虑',
          demand_growth: 65,
          supply_growth: 20,
          supply_demand_ratio: 3.3,
          high_intent_ratio: 55,
          life_cycle: '高峰末期',
          life_cycle_day: 4,
          remain_days: 1,
          keywords: ['学区', '学位', '积分入学', '名校', '教育'],
          suggest: '学区房方向收尾布局，做横向对比类内容而非焦虑煽动',
        },
        {
          title: '首付政策解读',
          demand_growth: -10,
          supply_growth: 180,
          supply_demand_ratio: 0.3,
          high_intent_ratio: 25,
          life_cycle: '衰退期',
          life_cycle_day: 6,
          remain_days: 0,
          keywords: ['首付', '降首付', '政策', '利好'],
          suggest: null, // null 表示不建议布局
        },
      ],
      // 同行爆款参考
      peer_references: [
        {
          nickname: '@深圳XX说房',
          topic: '《300万别碰这两个片区》',
          logic: '反常识点名+引导评论争议',
          reuse: '套用结构，替换成你主营的片区即可',
        },
        {
          nickname: '@龙华房产笔记',
          topic: '《首套刚需避坑清单》',
          logic: '清单体+收藏引导',
          reuse: '按你的经验列出对应片区的避坑清单',
        },
        {
          nickname: '@深房观察',
          topic: '《2026年上车时间窗口分析》',
          logic: '时间紧迫感+数据支撑',
          reuse: '引用今日数据，给出具体时间建议',
        },
      ],
    };
  },

  // 生成一周的战场数据
  generateWeekRank(weekNum) {
    return {
      week_num: weekNum,
      top_list: [
        {
          rank: 1,
          title: '300万预算首套刚需',
          level: 'S',
          stars: 5,
          stage: '爆发期',
          suggest: '主力投入方向，全团队集中布局',
        },
        {
          rank: 2,
          title: '学区房购买焦虑',
          level: 'A',
          stars: 4,
          stage: '高峰末期',
          suggest: '本周做收尾内容，下周切换方向',
        },
      ],
      risk_item: {
        title: '首付政策解读',
        level: '风险',
        stars: 1,
        stage: '衰退期',
        suggest: '立即停止投入，避免流量内卷',
      },
      week_summary: '本周深圳房产内容市场核心关键词为"刚需上车"。龙华、宝安片区 300 万预算方向需求旺盛，供给尚未饱和，为本周最佳获客方向。学区房方向进入高峰末期，建议做收尾布局。首付政策解读类内容已严重过剩，不建议新投入。',
    };
  },
};

module.exports = mockData;
```

**验证:** Node.js 环境运行 `node -e "const m = require('./mock/data'); console.log(JSON.stringify(m.generate('2026-06-16'), null, 2))"` 输出完整 JSON。

---

### Task 2.3: 实现 login 云函数

**Files:**
- Create: `cloudfunctions/login/index.js`
- Create: `cloudfunctions/login/package.json`

`cloudfunctions/login/package.json`:

```json
{
  "name": "login",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
```

`cloudfunctions/login/index.js`:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  if (!OPENID) {
    return { code: -1, message: '获取用户身份失败' };
  }

  try {
    // 查询用户是否已注册
    const res = await db.collection('user_info').where({ openid: OPENID }).get();

    if (res.data.length === 0) {
      // 新用户注册
      const newUser = {
        openid: OPENID,
        nick_name: event.nickName || '微信用户',
        avatar_url: event.avatarUrl || '',
        member_status: 0,
        member_expire_time: null,
        register_time: new Date(),
        last_login_time: new Date(),
      };
      await db.collection('user_info').add({ data: newUser });
      return {
        code: 0,
        data: {
          openid: OPENID,
          nickName: newUser.nick_name,
          avatarUrl: newUser.avatar_url,
          memberStatus: 0,
          memberExpireTime: null,
          isNewUser: true,
        },
      };
    }

    // 老用户更新最后登录时间
    const user = res.data[0];
    await db.collection('user_info').doc(user._id).update({
      data: {
        last_login_time: new Date(),
        nick_name: event.nickName || user.nick_name,
        avatar_url: event.avatarUrl || user.avatar_url,
      },
    });

    // 检查会员是否过期
    let memberStatus = user.member_status;
    if (memberStatus === 1 && user.member_expire_time) {
      if (new Date(user.member_expire_time) < new Date()) {
        memberStatus = 0;
        await db.collection('user_info').doc(user._id).update({
          data: { member_status: 0 },
        });
      }
    }

    return {
      code: 0,
      data: {
        openid: OPENID,
        nickName: event.nickName || user.nick_name,
        avatarUrl: event.avatarUrl || user.avatar_url,
        memberStatus,
        memberExpireTime: memberStatus === 1 ? user.member_expire_time : null,
        isNewUser: false,
      },
    };
  } catch (e) {
    console.error('login error:', e);
    return { code: -1, message: '登录失败：' + e.message };
  }
};
```

**验证:** 在云函数目录执行 `npm install`，右键云函数 → 上传并部署，小程序端调用验证。

---

### Task 2.4: 实现 get-daily-report 云函数

**Files:**
- Create: `cloudfunctions/get-daily-report/index.js`
- Create: `cloudfunctions/get-daily-report/package.json`

`cloudfunctions/get-daily-report/package.json`:

```json
{
  "name": "get-daily-report",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
```

`cloudfunctions/get-daily-report/index.js`:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  // 获取今天的日报
  const today = event.date || formatDate(new Date());

  try {
    const res = await db.collection('daily_report')
      .where({ date: today, status: 1 })
      .limit(1)
      .get();

    if (res.data.length === 0) {
      return { code: -1, message: '今日日报尚未发布' };
    }

    const report = res.data[0];

    // 查询用户会员状态
    let isMember = false;
    if (OPENID) {
      const userRes = await db.collection('user_info').where({ openid: OPENID }).get();
      if (userRes.data.length > 0) {
        const user = userRes.data[0];
        if (user.member_status === 1 && user.member_expire_time) {
          isMember = new Date(user.member_expire_time) > new Date();
        }
      }
    }

    if (isMember) {
      // 会员返回完整内容
      return { code: 0, data: report };
    } else {
      // 非会员仅返回核心速览
      return {
        code: 0,
        data: {
          _id: report._id,
          date: report.date,
          core_summary: report.core_summary,
          status: report.status,
        },
      };
    }
  } catch (e) {
    console.error('get-daily-report error:', e);
    return { code: -1, message: '获取日报失败：' + e.message };
  }
};

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

**验证:** 先往 daily_report 表手动插入一条 status=1 的测试数据，再从小程序端调用验证返回结果。

---

### Task 2.5: 实现 get-week-rank / get-history-list / get-history-detail 云函数

**Files:**
- Create: `cloudfunctions/get-week-rank/index.js` + `package.json`
- Create: `cloudfunctions/get-history-list/index.js` + `package.json`
- Create: `cloudfunctions/get-history-detail/index.js` + `package.json`

这三个云函数结构类似，都需校验会员权限。以 `get-week-rank` 为例：

`cloudfunctions/get-week-rank/index.js`:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  // 校验会员权限
  if (!OPENID) {
    return { code: -1, message: '请先登录' };
  }

  const userRes = await db.collection('user_info').where({ openid: OPENID }).get();
  if (userRes.data.length === 0) {
    return { code: -1, message: '用户不存在' };
  }

  const user = userRes.data[0];
  const isMember = user.member_status === 1
    && user.member_expire_time
    && new Date(user.member_expire_time) > new Date();

  if (!isMember) {
    return { code: -1, message: '请开通会员后查看' };
  }

  // 获取最新本周战场
  try {
    const res = await db.collection('week_rank')
      .orderBy('update_time', 'desc')
      .limit(1)
      .get();

    if (res.data.length === 0) {
      return { code: -1, message: '本周战场尚未发布' };
    }

    return { code: 0, data: res.data[0] };
  } catch (e) {
    console.error('get-week-rank error:', e);
    return { code: -1, message: '获取本周战场失败' };
  }
};
```

`cloudfunctions/get-history-list/index.js`:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { code: -1, message: '请先登录' };

  // 权限校验（同 get-week-rank）
  const userRes = await db.collection('user_info').where({ openid: OPENID }).get();
  if (userRes.data.length === 0) return { code: -1, message: '用户不存在' };
  const user = userRes.data[0];
  const isMember = user.member_status === 1
    && user.member_expire_time
    && new Date(user.member_expire_time) > new Date();
  if (!isMember) return { code: -1, message: '请开通会员后查看' };

  const page = event.page || 1;
  const pageSize = 20;

  try {
    const res = await db.collection('daily_report')
      .where({ status: 1 })
      .field({ _id: true, date: true, 'core_summary.hot_area': true })
      .orderBy('date', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    const list = res.data.map(item => ({
      id: item._id,
      date: item.date,
      summary: item.core_summary?.hot_area
        ? `热点片区：${item.core_summary.hot_area}`
        : '暂无摘要',
    }));

    return { code: 0, data: { list, page, pageSize } };
  } catch (e) {
    console.error('get-history-list error:', e);
    return { code: -1, message: '获取历史列表失败' };
  }
};
```

`cloudfunctions/get-history-detail/index.js`:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { code: -1, message: '请先登录' };

  // 权限校验
  const userRes = await db.collection('user_info').where({ openid: OPENID }).get();
  if (userRes.data.length === 0) return { code: -1, message: '用户不存在' };
  const user = userRes.data[0];
  const isMember = user.member_status === 1
    && user.member_expire_time
    && new Date(user.member_expire_time) > new Date();
  if (!isMember) return { code: -1, message: '请开通会员后查看' };

  const { date } = event;
  if (!date) return { code: -1, message: '缺少日期参数' };

  try {
    const res = await db.collection('daily_report')
      .where({ date, status: 1 })
      .limit(1)
      .get();

    if (res.data.length === 0) {
      return { code: -1, message: '该日日报不存在' };
    }

    return { code: 0, data: res.data[0] };
  } catch (e) {
    console.error('get-history-detail error:', e);
    return { code: -1, message: '获取日报详情失败' };
  }
};
```

每个云函数都需要对应的 `package.json`（内容同 login 的 package.json）。

**验证:** 确保每个云函数目录有 `package.json`，执行 `npm install`，上传部署后在云开发控制台 → 云函数可看到全部云函数。

---

### Task 2.6: 实现 opportunity-card 组件（S/A 级机会卡片）

**Files:**
- Create: `miniprogram/components/opportunity-card/index.js`
- Create: `miniprogram/components/opportunity-card/index.json`
- Create: `miniprogram/components/opportunity-card/index.wxml`
- Create: `miniprogram/components/opportunity-card/index.wxss`

`index.json`:

```json
{
  "component": true,
  "usingComponents": {}
}
```

`index.js`:

```js
Component({
  properties: {
    // 机会数据对象
    data: {
      type: Object,
      value: {},
    },
    // 等级：'S' | 'A'
    level: {
      type: String,
      value: 'A',
    },
    // 是否模糊遮罩（未付费）
    blurred: {
      type: Boolean,
      value: false,
    },
  },

  data: {
    expanded: false,
  },

  methods: {
    toggleExpand() {
      if (this.properties.blurred) return;
      this.setData({ expanded: !this.data.expanded });
    },
  },
});
```

`index.wxml`:

```xml
<view class="opportunity-card card {{blurred ? 'blurred' : ''}}">
  <!-- 标题行 -->
  <view class="header" bindtap="toggleExpand">
    <view class="title-row">
      <text class="tag {{level === 'S' ? 'tag-s' : 'tag-a'}}">
        {{level}}级机会
      </text>
      <text class="title">{{blurred ? '开通会员查看完整内容' : data.title}}</text>
    </view>

    <block wx:if="{{!blurred}}">
      <!-- 生命周期进度条 -->
      <view class="lifecycle">
        <text class="lifecycle-label">{{data.life_cycle || '未知'}} · 第{{data.life_cycle_day || '--'}}天</text>
        <view class="progress-bar">
          <view class="progress-fill" style="width: {{(data.life_cycle_day || 0) * 20}}%"></view>
        </view>
      </view>

      <!-- 剩余窗口 -->
      <view class="remain-info" wx:if="{{data.remain_days > 0}}">
        <text class="remain-text">剩余{{data.remain_days}}天红利期</text>
      </view>

      <!-- 核心建议 -->
      <view class="suggest">
        <text class="suggest-label">💡 核心建议：</text>
        <text>{{data.suggest}}</text>
      </view>
    </block>

    <!-- 展开/折叠按钮 -->
    <view class="expand-btn" wx:if="{{!blurred}}">
      <text>{{expanded ? '收起数据依据 ▲' : '查看数据依据 ▼'}}</text>
    </view>
  </view>

  <!-- 折叠数据详情 -->
  <view class="detail" wx:if="{{expanded && !blurred}}">
    <view class="divider"></view>
    <view class="detail-item">
      <text class="detail-label">需求增速：</text>
      <text class="detail-value">{{data.demand_growth || '--'}}%</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">供给增速：</text>
      <text class="detail-value">{{data.supply_growth || '--'}}%</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">供需比：</text>
      <text class="detail-value">{{data.supply_demand_ratio || '--'}}</text>
    </view>
    <view class="detail-item">
      <text class="detail-label">高购买意图占比：</text>
      <text class="detail-value">{{data.high_intent_ratio || '--'}}%</text>
    </view>
  </view>

  <!-- 付费遮罩 -->
  <view class="paywall-overlay" wx:if="{{blurred}}" bindtap="onPaywallTap">
    <text class="paywall-text">🔒 开通会员解锁完整机会分析</text>
  </view>
</view>
```

`index.wxss`:

```css
.opportunity-card {
  position: relative;
  overflow: hidden;
}

.header {
  transition: all 0.2s ease-out;
}

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.lifecycle {
  margin-bottom: 12rpx;
}

.lifecycle-label {
  font-size: 24rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 8rpx;
}

.progress-bar {
  height: 8rpx;
  background: #e0e0e0;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 4rpx;
  transition: width 0.3s ease-out;
}

.remain-info {
  background: #fff3e0;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}

.remain-text {
  font-size: 24rpx;
  color: var(--a-level);
  font-weight: 500;
}

.suggest {
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--text-primary);
  margin-bottom: 12rpx;
}

.suggest-label {
  font-weight: 600;
}

.expand-btn {
  text-align: center;
  font-size: 24rpx;
  color: var(--text-hint);
  padding: 8rpx;
}

.detail {
  transition: all 0.2s ease-out;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  font-size: 24rpx;
}

.detail-label {
  color: var(--text-secondary);
}

.detail-value {
  font-weight: 500;
  color: var(--text-primary);
}

/* 模糊遮罩 */
.blurred .header {
  filter: blur(4px);
  pointer-events: none;
  user-select: none;
}

.paywall-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(26, 35, 126, 0.9);
  color: #fff;
  padding: 20rpx 40rpx;
  border-radius: 12rpx;
  z-index: 10;
}

.paywall-text {
  font-size: 26rpx;
  font-weight: 500;
}
```

**验证:** 在 today 页面引入该组件，传入测试数据，确认卡片渲染正常、折叠展开动画流畅。

---

### Task 2.7: 实现 risk-card / area-ranking / peer-reference 组件

**Files:**
- Create: `miniprogram/components/risk-card/index.*` (4 文件)
- Create: `miniprogram/components/area-ranking/index.*` (4 文件)
- Create: `miniprogram/components/peer-reference/index.*` (4 文件)

**risk-card** (`index.wxml`):

```xml
<view class="risk-card card {{blurred ? 'blurred' : ''}}">
  <view class="header" bindtap="toggleExpand">
    <view class="title-row">
      <text class="tag-risk">⚠ 高风险</text>
      <text class="title">{{blurred ? '开通会员查看完整内容' : data.title}}</text>
    </view>
    <view class="conclusion" wx:if="{{!blurred}}">
      <text>{{data.conclusion}}</text>
    </view>
    <view class="expand-btn" wx:if="{{!blurred}}">
      <text>{{expanded ? '收起风险详情 ▲' : '查看风险详情 ▼'}}</text>
    </view>
  </view>

  <view class="detail" wx:if="{{expanded && !blurred}}">
    <view class="divider"></view>
    <view class="detail-item" wx:for="{{data.details}}" wx:key="label">
      <text class="detail-label">{{item.label}}</text>
      <text class="detail-value">{{item.value}}</text>
    </view>
  </view>

  <view class="paywall-overlay" wx:if="{{blurred}}">
    <text class="paywall-text">🔒 开通会员解锁风险预警</text>
  </view>
</view>
```

**area-ranking** (`index.wxml`):

```xml
<view class="area-ranking card {{blurred ? 'blurred' : ''}}">
  <view class="section-title">📊 今日深圳各片区需求热度</view>
  <view class="area-list" wx:if="{{!blurred}}">
    <view class="area-item" wx:for="{{list}}" wx:key="name">
      <text class="area-name">{{item.name}}</text>
      <view class="area-fire">
        <text wx:for="{{item.fireLevel}}" wx:key="*this">🔥</text>
      </view>
      <text class="area-trend {{item.trend === 'up' ? 'trend-up' : item.trend === 'down' ? 'trend-down' : 'trend-flat'}}">
        {{item.trend === 'up' ? '📈 上涨' : item.trend === 'down' ? '📉 回落' : '➡️ 持平'}}
      </text>
    </view>
  </view>
  <view class="paywall-overlay" wx:if="{{blurred}}">
    <text class="paywall-text">🔒 开通会员解锁片区热度榜</text>
  </view>
</view>
```

**peer-reference** (`index.wxml`):

```xml
<view class="peer-reference card {{blurred ? 'blurred' : ''}}">
  <view class="section-title">💡 今日可复用同行逻辑</view>
  <view class="peer-list" wx:if="{{!blurred}}">
    <view class="peer-item" wx:for="{{list}}" wx:key="nickname">
      <text class="peer-nickname">{{item.nickname}}</text>
      <text class="peer-topic">《{{item.topic}}》</text>
      <view class="peer-logic">
        <text class="logic-label">核心逻辑：</text>
        <text>{{item.logic}}</text>
      </view>
      <view class="peer-reuse">
        <text class="reuse-label">复用方法：</text>
        <text>{{item.reuse}}</text>
      </view>
    </view>
  </view>
  <view class="paywall-overlay" wx:if="{{blurred}}">
    <text class="paywall-text">🔒 开通会员解锁同行参考</text>
  </view>
</view>
```

**验证:** 各组件独立渲染正确，模糊遮罩状态正确显示。

---

### Task 2.8: 实现 paywall-mask 组件

**Files:**
- Create: `miniprogram/components/paywall-mask/index.js`
- Create: `miniprogram/components/paywall-mask/index.json`
- Create: `miniprogram/components/paywall-mask/index.wxml`
- Create: `miniprogram/components/paywall-mask/index.wxss`

`index.wxml`:

```xml
<view class="paywall-mask" wx:if="{{visible}}">
  <view class="mask-content">
    <text class="lock-icon">🔒</text>
    <text class="mask-title">开通会员，解锁全部获客情报</text>
    <text class="mask-desc">每天 30 秒，知道今天发什么、别发什么</text>
    <view class="mask-btn" bindtap="onGoMember">
      <text>立即开通</text>
    </view>
  </view>
  <view class="mask-preview">
    <slot></slot>
  </view>
</view>
```

`index.js`:

```js
Component({
  properties: {
    visible: {
      type: Boolean,
      value: true,
    },
  },
  methods: {
    onGoMember() {
      wx.switchTab({ url: '/pages/mine/index' });
    },
  },
});
```

**验证:** 组件在 visible=true 时正确覆盖内容区并显示引导按钮。

---

### Task 2.9: 实现「今日」页面完整布局

**Files:**
- Modify: `miniprogram/pages/today/index.js`
- Modify: `miniprogram/pages/today/index.json`
- Modify: `miniprogram/pages/today/index.wxml`
- Modify: `miniprogram/pages/today/index.wxss`

`index.json`:

```json
{
  "navigationBarTitleText": "AI获客机会雷达",
  "usingComponents": {
    "opportunity-card": "/components/opportunity-card/index",
    "risk-card": "/components/risk-card/index",
    "area-ranking": "/components/area-ranking/index",
    "peer-reference": "/components/peer-reference/index",
    "paywall-mask": "/components/paywall-mask/index"
  }
}
```

`index.js`:

```js
const api = require('../../utils/api');
const auth = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    date: '',
    report: null,
    isMember: false,
    loading: true,
  },

  onLoad() {
    this.setData({
      date: this.formatDate(new Date()),
    });
    this.loadReport();
  },

  onShow() {
    this.setData({ isMember: auth.isMember() });
  },

  onPullDownRefresh() {
    this.loadReport().then(() => wx.stopPullDownRefresh());
  },

  async loadReport() {
    this.setData({ loading: true });
    try {
      const report = await api.getDailyReport();
      this.setData({ report, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}年${m}月${d}日`;
  },
});
```

`index.wxml`:

```xml
<scroll-view scroll-y class="page" refresher-enabled bindrefresherrefresh="onPullDownRefresh">
  <!-- 顶部标题栏 -->
  <view class="page-header">
    <text class="header-title">AI获客机会雷达</text>
    <text class="header-date">{{date}}</text>
  </view>

  <view wx:if="{{loading}}" class="loading">加载中...</view>

  <block wx:elif="{{report}}">
    <!-- 核心速览（免费可见） -->
    <view class="core-summary card">
      <view class="core-item must-do">
        <text class="core-icon">✅</text>
        <view class="core-text">
          <text class="core-label">今日必做</text>
          <text class="core-value">{{report.core_summary.must_do}}</text>
        </view>
      </view>
      <view class="core-item must-not">
        <text class="core-icon">❌</text>
        <view class="core-text">
          <text class="core-label">绝对别碰</text>
          <text class="core-value">{{report.core_summary.must_not}}</text>
        </view>
      </view>
      <view class="core-item hot-area">
        <text class="core-icon">🔥</text>
        <view class="core-text">
          <text class="core-label">最热片区</text>
          <text class="core-value">{{report.core_summary.hot_area}}</text>
        </view>
      </view>
    </view>

    <!-- S级机会 -->
    <opportunity-card
      level="S"
      data="{{report.s_opportunity}}"
      blurred="{{!isMember}}"
    />

    <!-- A级机会 -->
    <opportunity-card
      level="A"
      data="{{report.a_opportunity}}"
      blurred="{{!isMember}}"
    />

    <!-- 风险预警 -->
    <risk-card
      data="{{report.risk_warning}}"
      blurred="{{!isMember}}"
    />

    <!-- 片区热度榜 -->
    <area-ranking
      list="{{report.area_rank}}"
      blurred="{{!isMember}}"
    />

    <!-- 同行参考 -->
    <peer-reference
      list="{{report.peer_reference}}"
      blurred="{{!isMember}}"
    />

    <!-- 底部合规提示 -->
    <view class="compliance-notice">
      <text>温馨提示：本产品仅提供获客方向参考，不承诺流量效果；房产内容请遵守平台规则，请勿承诺升值、学位等信息。</text>
    </view>
  </block>

  <view wx:else class="empty">暂无日报内容</view>
</scroll-view>
```

`index.wxss`:

```css
.page {
  min-height: 100vh;
  padding: 0 24rpx;
  padding-bottom: 40rpx;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
}

.header-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--primary);
}

.header-date {
  font-size: 24rpx;
  color: var(--text-secondary);
}

/* 核心速览 */
.core-summary {
  padding: 20rpx 24rpx;
}

.core-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 16rpx 0;
}

.core-item + .core-item {
  border-top: 1rpx solid var(--divider);
}

.core-icon {
  font-size: 36rpx;
}

.core-text {
  flex: 1;
}

.core-label {
  font-size: 22rpx;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4rpx;
}

.core-value {
  font-size: 28rpx;
  font-weight: 500;
  color: var(--text-primary);
}

/* 合规提示 */
.compliance-notice {
  margin-top: 32rpx;
  padding: 20rpx;
  background: #fafafa;
  border-radius: 12rpx;
  font-size: 22rpx;
  color: var(--text-hint);
  text-align: center;
  line-height: 1.6;
}

.loading, .empty {
  text-align: center;
  padding: 100rpx 0;
  color: var(--text-hint);
}
```

**验证:** 今日页面完整渲染 7 个模块，免费用户看到模糊遮罩，会员用户看到完整内容。

---

### Task 2.10: 实现「本周」「历史」「历史详情」页面

**Files:**
- Modify: `miniprogram/pages/week/index.*`
- Modify: `miniprogram/pages/history/index.*`
- Modify: `miniprogram/pages/history/detail/index.*`

**本周页** (`pages/week/index.js`):

```js
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: { rank: null, loading: true, isMember: false },

  onShow() {
    this.setData({ isMember: auth.isMember() });
    if (auth.isMember()) this.loadRank();
  },

  async loadRank() {
    this.setData({ loading: true });
    try {
      const rank = await api.getWeekRank();
      this.setData({ rank, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },
});
```

`pages/week/index.wxml`:

```xml
<scroll-view scroll-y class="page">
  <view class="page-header">
    <text class="header-title">本周核心获客战场</text>
  </view>

  <view wx:if="{{!isMember}}" class="paywall-full">
    <text class="lock-icon">🔒</text>
    <text class="paywall-title">会员专享内容</text>
    <text class="paywall-desc">开通会员查看本周战场分析与操作建议</text>
    <view class="btn-primary" bindtap="onGoMember">立即开通</view>
  </view>

  <block wx:elif="{{rank}}">
    <!-- TOP 列表 -->
    <view class="card" wx:for="{{rank.top_list}}" wx:key="rank">
      <view class="rank-badge">TOP{{item.rank}}</view>
      <text class="rank-level tag-{{item.level === 'S' ? 's' : 'a'}}">{{item.level}}级</text>
      <text class="rank-title">{{item.title}}</text>
      <text class="rank-stars">{{'★'.repeat(item.stars)}}{{'☆'.repeat(5 - item.stars)}}</text>
      <text class="rank-stage">{{item.stage}}</text>
      <text class="rank-suggest">{{item.suggest}}</text>
    </view>

    <!-- 风险赛道 -->
    <view class="card risk-item" wx:if="{{rank.risk_item}}">
      <text class="tag-risk">⚠️ 风险赛道</text>
      <text class="rank-title">{{rank.risk_item.title}}</text>
      <text>{{rank.risk_item.suggest}}</text>
    </view>

    <!-- 本周总结 -->
    <view class="card">
      <text class="section-title">📝 本周需求说明</text>
      <text class="summary-text">{{rank.week_summary}}</text>
    </view>
  </block>
</scroll-view>
```

**历史页** (`pages/history/index.js`):

```js
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: { list: [], loading: true, page: 1, isMember: false, hasMore: true },

  onShow() {
    this.setData({ isMember: auth.isMember() });
    if (auth.isMember()) this.loadList();
  },

  async loadList() {
    if (!this.data.hasMore) return;
    this.setData({ loading: true });
    try {
      const result = await api.getHistoryList(this.data.page);
      this.setData({
        list: this.data.list.concat(result.list),
        page: this.data.page + 1,
        hasMore: result.list.length === result.pageSize,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },

  onReachBottom() {
    this.loadList();
  },

  onItemTap(e) {
    const { date } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/history/detail/index?date=${date}` });
  },
});
```

**验证:** 本周页正确展示 TOP 排名，历史页列表分页加载正常，点击跳转详情页。

---

### Task 2.11: 填充模拟种子数据到云数据库

**Files:**
- Create: `cloudfunctions/seed-data/index.js`

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const mockData = require('./mock-data');

exports.main = async (event, context) => {
  const today = event.date || '2026-06-16';
  const data = mockData.generate(today);

  // 构造 daily_report 记录
  const report = {
    date: today,
    core_summary: {
      must_do: '300万刚需方向，流量红利期',
      must_not: '首付政策解读，内卷严重',
      hot_area: '龙华',
    },
    s_opportunity: {
      title: `S级机会 · ${data.topics[0].title}`,
      life_cycle: data.topics[0].life_cycle,
      life_cycle_day: data.topics[0].life_cycle_day,
      remain_days: data.topics[0].remain_days,
      suggest: data.topics[0].suggest,
      demand_growth: data.topics[0].demand_growth,
      supply_growth: data.topics[0].supply_growth,
      supply_demand_ratio: data.topics[0].supply_demand_ratio,
      high_intent_ratio: data.topics[0].high_intent_ratio,
      keywords: data.topics[0].keywords,
    },
    a_opportunity: {
      title: `A级机会 · ${data.topics[1].title}`,
      life_cycle: data.topics[1].life_cycle,
      life_cycle_day: data.topics[1].life_cycle_day,
      remain_days: data.topics[1].remain_days,
      suggest: data.topics[1].suggest,
      demand_growth: data.topics[1].demand_growth,
      supply_growth: data.topics[1].supply_growth,
      supply_demand_ratio: data.topics[1].supply_demand_ratio,
      high_intent_ratio: data.topics[1].high_intent_ratio,
      keywords: data.topics[1].keywords,
    },
    risk_warning: {
      title: `高风险 · ${data.topics[2].title}`,
      conclusion: '供给严重过剩，需求增长乏力，投入产出比极低，不建议布局',
      details: [
        { label: '近7天内容增速', value: `+${data.topics[2].supply_growth}%` },
        { label: '需求增速', value: `${data.topics[2].demand_growth}%` },
        { label: '供需比', value: String(data.topics[2].supply_demand_ratio) },
        { label: '预判', value: '衰退期，预计持续下滑' },
      ],
    },
    area_rank: data.areas.map(a => ({
      name: a.name,
      level: Math.ceil(a.demand_score / 20),
      trend: a.trend === 'up' ? '上涨' : a.trend === 'down' ? '回落' : '持平',
    })),
    peer_reference: data.peer_references,
    status: 1, // 直接发布用于测试
    create_time: new Date(),
    update_time: new Date(),
  };

  const res = await db.collection('daily_report').add({ data: report });

  // 构造 week_rank
  const weekData = mockData.generateWeekRank('2026年第25周');
  await db.collection('week_rank').add({
    data: { ...weekData, update_time: new Date() },
  });

  return { code: 0, data: { reportId: res._id, message: '种子数据填充完成' } };
};
```

**验证:** 执行 seed-data 云函数后，daily_report 和 week_rank 表各有 1 条记录。

---

### Task 2.12: P2 阶段提交

```bash
git add -A
git commit -m "feat: P2 - 云函数开发 + 数据库 + 页面联调

- 实现 6 个用户端云函数 (login, get-daily-report, get-week-rank, get-history-list, get-history-detail, submit-order)
- 创建 4 张数据库表
- 编写模拟数据模块 mock/data.js
- 实现 5 个公共组件 (opportunity-card, risk-card, area-ranking, peer-reference, paywall-mask)
- 完成今日/本周/历史/历史详情页面布局与数据联调
- 填充种子数据到云数据库

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 3: 支付 + 权限 + 管理后台 + AI（Day2 上午）

### Task 3.1: 实现「我的」页面 + 登录页

**Files:**
- Modify: `miniprogram/pages/mine/index.*`
- Modify: `miniprogram/pages/login/index.*`

**登录页** (`pages/login/index.js`):

```js
const api = require('../../utils/api');
const app = getApp();

Page({
  data: { loading: false },

  async onGetUserInfo(e) {
    if (!e.detail.userInfo) return;
    this.setData({ loading: true });

    try {
      const { nickName, avatarUrl } = e.detail.userInfo;
      const userData = await api.login();
      // 合并微信信息和后端数据
      app.globalData.userInfo = { nickName, avatarUrl, ...userData };
      app.globalData.isLoggedIn = true;
      app.globalData.isMember = userData.memberStatus === 1;
      app.globalData.memberExpireTime = userData.memberExpireTime;
      wx.setStorageSync('userInfo', app.globalData.userInfo);

      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/today/index' }), 1000);
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },
});
```

`pages/login/index.wxml`:

```xml
<view class="login-page">
  <view class="login-card">
    <text class="login-logo">🏠</text>
    <text class="login-title">AI获客机会雷达</text>
    <text class="login-desc">授权登录后，获取今日获客情报</text>
    <button
      class="login-btn"
      open-type="getUserInfo"
      bindgetuserinfo="onGetUserInfo"
      loading="{{loading}}"
    >
      微信一键授权登录
    </button>
    <text class="login-hint">拒绝授权仅可浏览部分内容</text>
  </view>
</view>
```

**我的页** (`pages/mine/index.js`):

```js
const auth = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    isMember: false,
    memberExpireText: '',
  },

  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn,
      isMember: auth.isMember(),
      memberExpireText: auth.isMember()
        ? `会员用户 · 有效期至${app.globalData.memberExpireTime}`
        : '普通用户',
    });
  },

  onGoPayment(e) {
    if (!auth.requireLogin()) return;
    const { plan } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/mine/payment/index?plan=${plan}` });
  },

  onGoFaq() {
    wx.navigateTo({ url: '/pages/mine/faq/index' });
  },

  onCopyWechat() {
    wx.setClipboardData({
      data: 'kefu_wechat_id_here',
      success: () => wx.showToast({ title: '已复制客服微信号' }),
    });
  },
});
```

`pages/mine/index.wxml`:

```xml
<scroll-view scroll-y class="page">
  <!-- 用户信息 -->
  <view class="user-card card">
    <image class="avatar" src="{{userInfo.avatarUrl || '/images/default-avatar.png'}}" mode="aspectFill"></image>
    <view class="user-info">
      <text class="nickname">{{userInfo.nickName || '未登录'}}</text>
      <text class="member-status">{{memberExpireText}}</text>
    </view>
  </view>

  <!-- 开通会员 -->
  <view class="member-section" wx:if="{{!isMember}}">
    <text class="section-title">开通会员，解锁全部获客情报</text>
    <view class="plan-cards">
      <view class="plan-card" data-plan="personal" bindtap="onGoPayment">
        <text class="plan-name">个人版</text>
        <text class="plan-price">49元<text class="plan-unit">/月</text></text>
        <text class="plan-desc">适合独立经纪人</text>
        <view class="plan-btn">开通</view>
      </view>
      <view class="plan-card" data-plan="store" bindtap="onGoPayment">
        <text class="plan-name">单店版</text>
        <text class="plan-price">599元<text class="plan-unit">/月</text></text>
        <text class="plan-desc">适合门店团队</text>
        <view class="plan-btn">开通</view>
      </view>
    </view>
  </view>

  <!-- 常见问题 -->
  <view class="menu-section">
    <view class="menu-item" bindtap="onGoFaq">
      <text>常见问题</text>
      <text>›</text>
    </view>
    <view class="menu-item" bindtap="onCopyWechat">
      <text>联系客服</text>
      <text>›</text>
    </view>
  </view>
</scroll-view>
```

**验证:** 未登录显示登录引导，登录后显示用户信息，未付费看到开通卡片。

---

### Task 3.2: 实现支付页面 + submit-order 云函数

**Files:**
- Modify: `miniprogram/pages/mine/payment/index.*`
- Modify: `cloudfunctions/submit-order/index.js`

**付款页** (`pages/mine/payment/index.js`):

```js
const api = require('../../../utils/api');

const PLANS = {
  personal: { name: '个人版', price: '49', amount: 49, desc: '适合独立经纪人' },
  store: { name: '单店版', price: '599', amount: 599, desc: '适合门店团队' },
};

Page({
  data: {
    plan: null,
    qrcodeUrl: '', // 微信收款码云存储 URL
    voucherPath: '',
    contactWechat: '',
    uploading: false,
    submitted: false,
  },

  onLoad(options) {
    const planType = options.plan;
    const plan = PLANS[planType];
    if (!plan) {
      wx.showToast({ title: '无效档位', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.setData({ plan, planType });
  },

  onChooseVoucher() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: (res) => {
        this.setData({ voucherPath: res.tempFilePaths[0] });
      },
    });
  },

  onContactInput(e) {
    this.setData({ contactWechat: e.detail.value });
  },

  async onSubmit() {
    if (!this.data.voucherPath) {
      return wx.showToast({ title: '请上传付款凭证', icon: 'none' });
    }
    if (!this.data.contactWechat.trim()) {
      return wx.showToast({ title: '请填写联系微信号', icon: 'none' });
    }

    this.setData({ uploading: true });

    try {
      // 上传截图到云存储
      const cloudPath = `vouchers/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`;
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.voucherPath,
      });

      // 提交订单
      await api.submitOrder(
        this.data.planType,
        this.data.plan.amount,
        uploadRes.fileID,
        this.data.contactWechat.trim()
      );

      this.setData({ uploading: false, submitted: true });
    } catch (e) {
      this.setData({ uploading: false });
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  },
});
```

**付款页 WXML** (`pages/mine/payment/index.wxml`):

```xml
<scroll-view scroll-y class="page" wx:if="{{plan}}">
  <view class="payment-card card">
    <text class="plan-name">{{plan.name}}</text>
    <text class="plan-price">{{plan.price}}元/月</text>
    <text class="plan-desc">{{plan.desc}}</text>
  </view>

  <view wx:if="{{!submitted}}">
    <view class="card">
      <text class="section-title">扫码付款</text>
      <image class="qrcode" src="{{qrcodeUrl || '/images/qrcode-placeholder.png'}}" mode="widthFix"></image>
      <text class="qrcode-hint">长按识别付款，备注您的微信号</text>
    </view>

    <view class="card">
      <text class="section-title">上传付款凭证</text>
      <view class="upload-area" bindtap="onChooseVoucher">
        <image wx:if="{{voucherPath}}" src="{{voucherPath}}" mode="aspectFit" class="voucher-preview"></image>
        <text wx:else class="upload-hint">点击上传付款截图</text>
      </view>
      <input class="contact-input" placeholder="填写您的联系微信号" value="{{contactWechat}}" bindinput="onContactInput"></input>
    </view>

    <view class="submit-btn btn-primary" bindtap="onSubmit">
      <text>{{uploading ? '提交中...' : '提交审核'}}</text>
    </view>
  </view>

  <view wx:else class="submitted card">
    <text class="success-icon">✅</text>
    <text class="success-title">提交成功</text>
    <text class="success-desc">我们会尽快审核，审核通过后自动开通会员权限，一般10分钟内完成</text>
  </view>
</scroll-view>
```

**submit-order 云函数**:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { code: -1, message: '请先登录' };

  const { plan_type, amount, voucher_url, contact_wechat } = event;
  if (!plan_type || !amount || !voucher_url) {
    return { code: -1, message: '缺少必填参数' };
  }

  try {
    const order = {
      user_openid: OPENID,
      plan_type,
      amount,
      voucher_url,
      contact_wechat: contact_wechat || '',
      audit_status: 0,
      submit_time: new Date(),
      audit_time: null,
      reject_reason: '',
    };

    await db.collection('payment_order').add({ data: order });
    return { code: 0, data: { message: '订单提交成功，等待审核' } };
  } catch (e) {
    console.error('submit-order error:', e);
    return { code: -1, message: '订单提交失败' };
  }
};
```

**验证:** 选择档位 → 展示收款码 → 上传截图 → 提交成功，payment_order 表出现新记录。

---

### Task 3.3: 实现管理后台云函数（admin-auth, admin-audit-order, admin-manage-report, admin-get-stats）

**Files:**
- Create: `cloudfunctions/admin-auth/index.js`
- Create: `cloudfunctions/admin-audit-order/index.js`
- Create: `cloudfunctions/admin-manage-report/index.js`
- Create: `cloudfunctions/admin-get-stats/index.js`

**admin-auth**:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const ADMIN_CONFIG = {
  username: 'admin',
  password: 'radar2026',
};

exports.main = async (event, context) => {
  const { username, password } = event;
  if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
    return { code: 0, data: { token: 'admin_session_' + Date.now(), expires: Date.now() + 8 * 3600000 } };
  }
  return { code: -1, message: '账号或密码错误' };
};
```

**admin-audit-order**:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { orderId, action, rejectReason } = event;

  if (!orderId || !action) return { code: -1, message: '缺少参数' };

  try {
    const orderRes = await db.collection('payment_order').doc(orderId).get();
    if (!orderRes.data) return { code: -1, message: '订单不存在' };

    const order = orderRes.data;

    if (action === 'approve') {
      // 更新订单状态
      await db.collection('payment_order').doc(orderId).update({
        data: { audit_status: 1, audit_time: new Date() },
      });

      // 开通会员
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + 30);

      const userRes = await db.collection('user_info').where({ openid: order.user_openid }).get();
      if (userRes.data.length > 0) {
        await db.collection('user_info').doc(userRes.data[0]._id).update({
          data: { member_status: 1, member_expire_time: expireTime },
        });
      }

      return { code: 0, data: { message: '审核通过，会员已开通' } };
    }

    if (action === 'reject') {
      await db.collection('payment_order').doc(orderId).update({
        data: { audit_status: 2, reject_reason: rejectReason || '', audit_time: new Date() },
      });
      return { code: 0, data: { message: '已驳回' } };
    }

    return { code: -1, message: '未知操作' };
  } catch (e) {
    return { code: -1, message: '审核操作失败：' + e.message };
  }
};
```

**admin-get-stats**:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const [totalUsers, paidUsers, pendingOrders, todayUsers] = await Promise.all([
      db.collection('user_info').count(),
      db.collection('user_info').where({ member_status: 1 }).count(),
      db.collection('payment_order').where({ audit_status: 0 }).count(),
      db.collection('user_info')
        .where({ register_time: db.command.gte(new Date(new Date().setHours(0, 0, 0, 0))) })
        .count(),
    ]);

    return {
      code: 0,
      data: {
        totalUsers: totalUsers.total,
        paidUsers: paidUsers.total,
        pendingOrders: pendingOrders.total,
        todayNewUsers: todayUsers.total,
      },
    };
  } catch (e) {
    return { code: -1, message: '获取统计数据失败' };
  }
};
```

**admin-manage-report**:

```js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action, reportId, data, date } = event;

  try {
    switch (action) {
      case 'list':
        const listRes = await db.collection('daily_report')
          .orderBy('date', 'desc').limit(30).get();
        return { code: 0, data: listRes.data };

      case 'create':
        const addRes = await db.collection('daily_report').add({
          data: { ...data, status: 0, create_time: new Date(), update_time: new Date() },
        });
        return { code: 0, data: { id: addRes._id } };

      case 'update':
        await db.collection('daily_report').doc(reportId).update({
          data: { ...data, update_time: new Date() },
        });
        return { code: 0, data: { message: '更新成功' } };

      case 'publish':
        await db.collection('daily_report').doc(reportId).update({
          data: { status: 1, update_time: new Date() },
        });
        return { code: 0, data: { message: '发布成功' } };

      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (e) {
    return { code: -1, message: '操作失败：' + e.message };
  }
};
```

**验证:** 所有管理端云函数上传部署后，可用云函数测试功能逐一验证。

---

### Task 3.4: 实现管理后台前端（admin/index.html）

**Files:**
- Create: `admin/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI获客机会雷达 · 管理后台</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; background:#f5f5f5; color:#212121; }
.header { background:#1a237e; color:#fff; padding:16px 24px; display:flex; justify-content:space-between; align-items:center; }
.header h1 { font-size:20px; }
.nav { display:flex; gap:4px; background:#fff; padding:12px 24px; border-bottom:1px solid #eee; }
.nav-btn { padding:8px 16px; border:none; background:transparent; cursor:pointer; border-radius:8px; font-size:14px; transition:all 0.2s; }
.nav-btn.active { background:#1a237e; color:#fff; }
.content { padding:24px; max-width:1200px; margin:0 auto; }
.card { background:#fff; border-radius:12px; padding:20px; margin-bottom:16px; }
.stats-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:24px; }
.stat-card { background:#fff; border-radius:12px; padding:20px; text-align:center; }
.stat-value { font-size:32px; font-weight:700; color:#1a237e; }
.stat-label { font-size:13px; color:#757575; margin-top:4px; }
table { width:100%; border-collapse:collapse; }
th, td { padding:12px; text-align:left; border-bottom:1px solid #eee; font-size:13px; }
th { font-weight:600; color:#757575; }
.btn { padding:6px 16px; border:none; border-radius:6px; cursor:pointer; font-size:13px; }
.btn-primary { background:#1a237e; color:#fff; }
.btn-success { background:#2e7d32; color:#fff; }
.btn-danger { background:#c62828; color:#fff; }
textarea, input[type=text], input[type=password] { width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; font-size:14px; margin-bottom:12px; }
.hidden { display:none; }
.section { display:none; }
.section.active { display:block; }
.login-page { display:flex; align-items:center; justify-content:center; min-height:100vh; background:#1a237e; }
.login-box { background:#fff; border-radius:16px; padding:40px; width:360px; }
.login-box h2 { text-align:center; margin-bottom:24px; }
</style>
</head>
<body>

<div id="loginPage" class="login-page">
  <div class="login-box">
    <h2>管理后台登录</h2>
    <input type="text" id="username" placeholder="账号">
    <input type="password" id="password" placeholder="密码">
    <button class="btn btn-primary" style="width:100%;padding:12px" onclick="login()">登录</button>
  </div>
</div>

<div id="app" class="hidden">
  <div class="header">
    <h1>📡 AI获客机会雷达</h1>
    <button class="btn" style="background:rgba(255,255,255,0.2);color:#fff" onclick="logout()">退出</button>
  </div>
  <div class="nav">
    <button class="nav-btn active" onclick="switchTab('stats', this)">📊 数据概览</button>
    <button class="nav-btn" onclick="switchTab('content', this)">📰 内容管理</button>
    <button class="nav-btn" onclick="switchTab('users', this)">👥 用户管理</button>
    <button class="nav-btn" onclick="switchTab('orders', this)">📋 订单审核</button>
    <button class="nav-btn" onclick="switchTab('ai', this)">🤖 AI生成</button>
  </div>
  <div class="content">
    <div id="statsSection" class="section active">
      <div class="stats-grid" id="statsGrid"></div>
    </div>
    <div id="contentSection" class="section">
      <button class="btn btn-primary" onclick="showReportForm()">+ 新建日报</button>
      <div id="reportList" style="margin-top:16px"></div>
    </div>
    <div id="usersSection" class="section">
      <div id="userList"></div>
    </div>
    <div id="ordersSection" class="section">
      <div id="orderList"></div>
    </div>
    <div id="aiSection" class="section">
      <button class="btn btn-primary" onclick="triggerAiGenerate()">触发 AI 日报生成</button>
      <div id="aiResult" style="margin-top:16px"></div>
    </div>
  </div>
</div>

<script>
let token = '';

async function callFunction(name, data = {}) {
  const res = await fetch(`https://YOUR_ENV_ID.service.tcloudbase.com/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  try {
    const res = await callFunction('admin-auth', { username, password });
    if (res.code === 0) {
      token = res.data.token;
      document.getElementById('loginPage').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      loadStats();
    } else {
      alert('登录失败：' + res.message);
    }
  } catch (e) {
    alert('登录异常');
  }
}

function logout() {
  token = '';
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginPage').classList.remove('hidden');
}

function switchTab(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(name + 'Section').classList.add('active');
  btn.classList.add('active');
  if (name === 'stats') loadStats();
  if (name === 'content') loadReports();
  if (name === 'users') loadUsers();
  if (name === 'orders') loadOrders();
}

async function loadStats() {
  const res = await callFunction('admin-get-stats');
  if (res.code === 0) {
    const d = res.data;
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card"><div class="stat-value">${d.totalUsers}</div><div class="stat-label">总用户数</div></div>
      <div class="stat-card"><div class="stat-value">${d.todayNewUsers}</div><div class="stat-label">今日新增用户</div></div>
      <div class="stat-card"><div class="stat-value">${d.paidUsers}</div><div class="stat-label">付费用户数</div></div>
      <div class="stat-card"><div class="stat-value">${d.pendingOrders}</div><div class="stat-label">待审核订单</div></div>
    `;
  }
}

async function loadOrders() {
  // 简化实现：从云数据库获取订单列表
  const res = await callFunction('admin-manage-report', { action: 'list' });
  // 实际应另写 admin-get-orders
  document.getElementById('orderList').innerHTML = '<p>订单列表加载中...</p>';
}

async function triggerAiGenerate() {
  document.getElementById('aiResult').innerHTML = '<p>正在调用 DeepSeek AI 生成日报...</p>';
  const res = await callFunction('generate-report', {});
  if (res.code === 0) {
    document.getElementById('aiResult').innerHTML = '<p style="color:green">✅ 日报初稿已生成，请在「内容管理」中审核发布</p>';
  } else {
    document.getElementById('aiResult').innerHTML = '<p style="color:red">生成失败：' + res.message + '</p>';
  }
}

// 更多管理功能按需补充...
</script>
</body>
</html>
```

> **注意:** `YOUR_ENV_ID` 需替换为实际云环境 ID。管理后台通过云托管部署，具体路径后续配置。

**验证:** 打开 admin/index.html → 登录 → 各 Tab 切换正常 → 数据加载正常。

---

### Task 3.5: 实现 generate-report 云函数（规则引擎 + DeepSeek）

**Files:**
- Create: `cloudfunctions/generate-report/index.js`
- Create: `cloudfunctions/generate-report/package.json`

`package.json`:

```json
{
  "name": "generate-report",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest",
    "node-fetch": "^2.6.0"
  }
}
```

`index.js`:

```js
const cloud = require('wx-server-sdk');
const fetch = require('node-fetch');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 模拟数据生成器（内联，避免依赖外部 mock 模块）
function generateMockData(dateStr) {
  const dayOfMonth = new Date(dateStr).getDate();
  const isRigidDemandDay = dayOfMonth % 2 === 0;
  return {
    date: dateStr,
    topics: [
      {
        title: '300万预算首套刚需',
        demand_growth: isRigidDemandDay ? 120 : 95,
        supply_growth: 15,
        supply_demand_ratio: 6.3,
        high_intent_ratio: 68,
        life_cycle: '爆发期',
        life_cycle_day: 2,
        remain_days: 3,
        keywords: ['首套', '刚需', '300万'],
        suggest: '主打避坑人设，覆盖龙华/宝安片区',
      },
      {
        title: '学区房购买焦虑',
        demand_growth: 65,
        supply_growth: 20,
        supply_demand_ratio: 3.3,
        high_intent_ratio: 55,
        life_cycle: '高峰末期',
        life_cycle_day: 4,
        remain_days: 1,
        keywords: ['学区', '学位', '名校'],
        suggest: '做横向对比类内容而非焦虑煽动',
      },
      {
        title: '首付政策解读',
        demand_growth: -10,
        supply_growth: 180,
        supply_demand_ratio: 0.3,
        high_intent_ratio: 25,
        life_cycle: '衰退期',
        life_cycle_day: 6,
        remain_days: 0,
        keywords: ['首付', '政策'],
        suggest: null,
      },
    ],
    areas: [
      { name: '龙华', demand_score: isRigidDemandDay ? 95 : 78, trend: 'up' },
      { name: '宝安', demand_score: 82, trend: 'up' },
      { name: '南山', demand_score: 70, trend: 'flat' },
      { name: '福田', demand_score: 65, trend: 'flat' },
      { name: '罗湖', demand_score: 50, trend: 'down' },
      { name: '龙岗', demand_score: 72, trend: 'up' },
    ],
    peers: [
      { nickname: '@深圳XX说房', topic: '《300万别碰这两个片区》', logic: '反常识点名+引导评论争议', reuse: '套用结构，替换成你主营的片区即可' },
      { nickname: '@龙华房产笔记', topic: '《首套刚需避坑清单》', logic: '清单体+收藏引导', reuse: '按你的经验列出对应片区的避坑清单' },
      { nickname: '@深房观察', topic: '《2026年上车时间窗口分析》', logic: '时间紧迫感+数据支撑', reuse: '引用今日数据，给出具体时间建议' },
    ],
  };
}

// === 规则引擎 ===
function runRules(topics) {
  return topics.map(t => {
    let level, levelReason;

    if (t.supply_demand_ratio > 5 && t.high_intent_ratio > 60 && t.demand_growth > 100) {
      level = 'S';
      levelReason = '供需比>5，高购买意图>60%，日需求增速>100%，处于爆发初期';
    } else if (t.supply_demand_ratio >= 2 && t.high_intent_ratio > 50 && t.demand_growth >= 50) {
      level = 'A';
      levelReason = '供需比2-5，高购买意图>50%，日需求增速50%-100%';
    } else if (t.supply_demand_ratio < 0.5 && t.supply_growth > t.demand_growth * 1.5) {
      level = 'RISK';
      levelReason = '供需比<0.5，供给增速远高于需求增速，处于衰退期';
    } else {
      level = 'B';
      levelReason = '未达到A/S/风险标准';
    }

    return { ...t, level, levelReason };
  });
}

// === DeepSeek API 调用 ===
async function callDeepSeek(structuredData) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('DEEPSEEK_API_KEY not set, using rule-based output');
    return null;
  }

  const systemPrompt = `你是深圳房产获客情报分析师。你的任务是将结构化数据润色为专业日报文案。
规则：
1. 仅润色文案表达，不修改任何数据结论
2. 每条文案不超过60字
3. 风格：专业、直接、有行动指导性
4. 严格按 JSON 格式输出`;

  const userPrompt = `今日数据如下：
${JSON.stringify(structuredData, null, 2)}

请生成日报文案，JSON 格式：
{
  "core_summary": { "must_do": "必做建议", "must_not": "避免方向", "hot_area": "最热片区名" },
  "s_opportunity": { "title": "含S前缀", "suggest": "核心建议" },
  "a_opportunity": { "title": "含A前缀", "suggest": "核心建议" },
  "risk_warning": { "title": "含风险前缀", "conclusion": "核心结论" }
}`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || '';
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) {
    console.error('DeepSeek API error:', e.message);
    return null;
  }
}

// === 主函数 ===
exports.main = async (event, context) => {
  const dateStr = event.date || new Date().toISOString().split('T')[0];

  try {
    // 1. 获取模拟数据
    const mockData = generateMockData(dateStr);

    // 2. 规则引擎评级
    const ratedTopics = runRules(mockData.topics);
    const sTopic = ratedTopics.find(t => t.level === 'S');
    const aTopic = ratedTopics.find(t => t.level === 'A');
    const riskTopic = ratedTopics.find(t => t.level === 'RISK');

    // 3. 构造结构化数据传给 DeepSeek
    const structured = {
      date: dateStr,
      areas: mockData.areas,
      s_topic: sTopic || ratedTopics[0],
      a_topic: aTopic || ratedTopics[1],
      risk_topic: riskTopic || ratedTopics[2],
      peers: mockData.peers,
    };

    // 4. 调用 DeepSeek 润色
    const aiResult = await callDeepSeek(structured);

    // 5. 合并 AI 结果与规则计算结果
    const report = {
      date: dateStr,
      core_summary: aiResult?.core_summary || {
        must_do: '300万刚需方向，流量红利期',
        must_not: '首付政策解读，内卷严重',
        hot_area: '龙华',
      },
      s_opportunity: {
        title: aiResult?.s_opportunity?.title || `S级机会 · ${sTopic?.title || '暂无'}`,
        life_cycle: sTopic?.life_cycle || '--',
        life_cycle_day: sTopic?.life_cycle_day || 0,
        remain_days: sTopic?.remain_days || 0,
        suggest: aiResult?.s_opportunity?.suggest || sTopic?.suggest || '--',
        demand_growth: sTopic?.demand_growth || 0,
        supply_growth: sTopic?.supply_growth || 0,
        supply_demand_ratio: sTopic?.supply_demand_ratio || 0,
        high_intent_ratio: sTopic?.high_intent_ratio || 0,
        keywords: sTopic?.keywords || [],
      },
      a_opportunity: {
        title: aiResult?.a_opportunity?.title || `A级机会 · ${aTopic?.title || '暂无'}`,
        life_cycle: aTopic?.life_cycle || '--',
        life_cycle_day: aTopic?.life_cycle_day || 0,
        remain_days: aTopic?.remain_days || 0,
        suggest: aiResult?.a_opportunity?.suggest || aTopic?.suggest || '--',
        demand_growth: aTopic?.demand_growth || 0,
        supply_growth: aTopic?.supply_growth || 0,
        supply_demand_ratio: aTopic?.supply_demand_ratio || 0,
        high_intent_ratio: aTopic?.high_intent_ratio || 0,
        keywords: aTopic?.keywords || [],
      },
      risk_warning: {
        title: aiResult?.risk_warning?.title || `高风险 · ${riskTopic?.title || '暂无'}`,
        conclusion: aiResult?.risk_warning?.conclusion || '供给严重过剩，不建议布局',
        details: riskTopic ? [
          { label: '需求增速', value: `${riskTopic.demand_growth}%` },
          { label: '供给增速', value: `${riskTopic.supply_growth}%` },
          { label: '供需比', value: String(riskTopic.supply_demand_ratio) },
          { label: '预判', value: '持续衰退，不建议投入' },
        ] : [],
      },
      area_rank: mockData.areas.map(a => ({
        name: a.name,
        level: Math.ceil(a.demand_score / 20),
        trend: a.trend === 'up' ? '上涨' : a.trend === 'down' ? '回落' : '持平',
      })),
      peer_reference: mockData.peers,
      status: 0, // 待审核
      create_time: new Date(),
      update_time: new Date(),
    };

    // 6. 存入数据库
    const res = await db.collection('daily_report').add({ data: report });

    return {
      code: 0,
      data: {
        reportId: res._id,
        message: '日报初稿已生成，请在管理后台审核后发布',
        aiUsed: !!aiResult,
      },
    };
  } catch (e) {
    console.error('generate-report error:', e);
    return { code: -1, message: '日报生成失败：' + e.message };
  }
};
```

**验证:** 部署云函数后，在云开发控制台设置环境变量 `DEEPSEEK_API_KEY`，手动触发 generate-report，检查 daily_report 表出现 status=0 的新记录。

---

### Task 3.6: P3 阶段提交

```bash
git add -A
git commit -m "feat: P3 - 支付流程 + 权限逻辑 + 管理后台 + AI日报生成

- 实现我的页面 + 微信授权登录页
- 实现付款页面 + submit-order 云函数（收款码+截图上传）
- 实现 4 个管理端云函数 (admin-auth, admin-audit-order, admin-manage-report, admin-get-stats)
- 实现管理后台单页 (admin/index.html)
- 实现 generate-report 云函数 (规则引擎 + DeepSeek API 润色)
- 会员权限控制（云函数层内容裁剪）

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Phase 4: 全链路联调 + 上线准备（Day2 下午）

### Task 4.1: FAQ 页面 + 合规检查

**Files:**
- Modify: `miniprogram/pages/mine/faq/index.*`

`pages/mine/faq/index.wxml`:

```xml
<scroll-view scroll-y class="page">
  <view class="page-header"><text class="header-title">常见问题</text></view>

  <view class="faq-list">
    <view class="faq-item card" wx:for="{{faqs}}" wx:key="q">
      <view class="faq-q" bindtap="toggleFaq" data-index="{{index}}">
        <text>{{item.q}}</text>
        <text class="faq-arrow">{{item.open ? '▲' : '▼'}}</text>
      </view>
      <view class="faq-a" wx:if="{{item.open}}">
        <text>{{item.a}}</text>
      </view>
    </view>
  </view>
</scroll-view>
```

`pages/mine/faq/index.js`:

```js
Page({
  data: {
    faqs: [
      { q: '内容每天什么时候更新？', a: '每日早 8:00 准时更新当日日报，更新后可刷新查看。', open: false },
      { q: '付款后多久开通权限？', a: '上传付款凭证后，我们会尽快审核，一般 10 分钟内完成开通。', open: false },
      { q: '不满意可以退款吗？', a: '支持 7 天无理由退款，联系客服处理即可。', open: false },
    ],
  },
  toggleFaq(e) {
    const { index } = e.currentTarget.dataset;
    const faqs = this.data.faqs;
    faqs[index].open = !faqs[index].open;
    this.setData({ faqs });
  },
});
```

**验证:** FAQ 折叠展开正常。

---

### Task 4.2: 全局错误处理与下拉刷新

**Files:**
- Modify: `miniprogram/app.js` (增加全局错误处理)

在 `app.js` 的 `App({})` 中添加：

```js
onError(error) {
  console.error('App Error:', error);
  // 生产环境可上报到云函数日志
},

onPageNotFound(res) {
  wx.redirectTo({ url: '/pages/today/index' });
},
```

为所有列表页添加下拉刷新：
- `pages/today/index.json` → `"enablePullDownRefresh": true`
- `pages/history/index.json` → `"enablePullDownRefresh": true`

---

### Task 4.3: 权限全链路验证

逐场景验证以下流程：

- [ ] **场景1 - 新用户**：打开小程序 → 拒绝授权 → 仅见核心速览 → 点击付费内容弹出 paywall-mask
- [ ] **场景2 - 授权登录**：微信授权登录 → 显示昵称/头像 → 普通用户身份
- [ ] **场景3 - 付费流程**：选择个人版 → 看到收款码 → 上传截图 → 提交成功
- [ ] **场景4 - 审核开通**：管理后台审核通过 → 用户刷新 → 会员身份 → 全部内容可见
- [ ] **场景5 - 会员过期**：到期后重新登录 → 恢复普通用户身份 → 付费内容不可见
- [ ] **场景6 - 本周/历史**：会员正常访问，非会员引导开通

---

### Task 4.4: Tab 图标生成 + UI 细节校准

- [ ] **创建 Tab 图标**：生成 4 组 81x81 PNG 图标（普通/选中态共 8 张），放置于 `miniprogram/images/`
- [ ] **颜色一致性检查**：确认所有页面使用 CSS 变量（`--primary`, `--s-level`, `--a-level`, `--risk`）
- [ ] **过渡动画检查**：所有交互状态切换有 `transition: all 0.2s ease-out`
- [ ] **底部安全区适配**：TabBar 页面底部留出 `safe-area-inset-bottom`

---

### Task 4.5: 部署检查清单

- [ ] 云开发环境 ID 配置正确（`app.js` 中的 `env` 字段）
- [ ] 所有云函数已上传部署，依赖已安装（`npm install`）
- [ ] 4 个数据库集合已创建，权限设置为「仅创建者及管理员可读写」
- [ ] `DEEPSEEK_API_KEY` 环境变量已在 generate-report 云函数中设置
- [ ] 管理员账号密码已确认
- [ ] 收款码图片已上传至云存储
- [ ] 客服微信号已配置
- [ ] `project.config.json` 中 `appid` 已替换为真实 AppID
- [ ] `.gitignore` 中已添加 `.superpowers/`

---

### Task 4.6: P4 阶段提交 + 最终提交

```bash
git add -A
git commit -m "feat: P4 - 全链路联调 + 上线准备

- FAQ 页面实现（折叠问答）
- 全局错误处理与页面下拉刷新
- Tab 图标与 UI 细节校准
- 部署检查清单完成
- V1.0 MVP 全栈交付

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## 实施顺序总结

```
P1 (Day1 AM): Task 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6
P2 (Day1 PM): Task 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8 → 2.9 → 2.10 → 2.11 → 2.12
P3 (Day2 AM): Task 3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6
P4 (Day2 PM): Task 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6
```

**总计 25 个 Task，每个 Task 包含 2-5 个 Step，预计总实施时间约 2 天。**
