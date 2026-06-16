const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// Inline mock data generator to avoid file dependency issues in cloud functions
function generateMockData(dateStr) {
  const dayOfMonth = new Date(dateStr).getDate();
  const isRigidDemandDay = dayOfMonth % 2 === 0;
  return {
    areas: [
      { name: '龙华', demand_score: isRigidDemandDay ? 95 : 78, supply_score: 18, trend: 'up' },
      { name: '宝安', demand_score: 82, supply_score: 22, trend: 'up' },
      { name: '南山', demand_score: 70, supply_score: 35, trend: 'flat' },
      { name: '福田', demand_score: 65, supply_score: 40, trend: 'flat' },
      { name: '罗湖', demand_score: 50, supply_score: 25, trend: 'down' },
      { name: '龙岗', demand_score: 72, supply_score: 30, trend: 'up' },
    ],
    topics: [
      { title: '300万预算首套刚需', demand_growth: isRigidDemandDay ? 120 : 95, supply_growth: 15, supply_demand_ratio: 6.3, high_intent_ratio: 68, life_cycle: '爆发期', life_cycle_day: 2, remain_days: 3, keywords: ['首套', '刚需', '300万'], suggest: '主打避坑人设，覆盖龙华/宝安片区' },
      { title: '学区房购买焦虑', demand_growth: 65, supply_growth: 20, supply_demand_ratio: 3.3, high_intent_ratio: 55, life_cycle: '高峰末期', life_cycle_day: 4, remain_days: 1, keywords: ['学区', '学位', '名校'], suggest: '做横向对比类内容而非焦虑煽动' },
      { title: '首付政策解读', demand_growth: -10, supply_growth: 180, supply_demand_ratio: 0.3, high_intent_ratio: 25, life_cycle: '衰退期', life_cycle_day: 6, remain_days: 0, keywords: ['首付', '政策'], suggest: null },
    ],
    peers: [
      { nickname: '@深圳XX说房', topic: '《300万别碰这两个片区》', logic: '反常识点名+引导评论争议', reuse: '套用结构，替换成你主营的片区即可' },
      { nickname: '@龙华房产笔记', topic: '《首套刚需避坑清单》', logic: '清单体+收藏引导', reuse: '按你的经验列出对应片区的避坑清单' },
      { nickname: '@深房观察', topic: '《2026年上车时间窗口分析》', logic: '时间紧迫感+数据支撑', reuse: '引用今日数据，给出具体时间建议' },
    ],
  };
}

function generateWeekRank(weekNum) {
  return {
    week_num: weekNum,
    top_list: [
      { rank: 1, title: '300万预算首套刚需', level: 'S', stars: 5, stage: '爆发期', suggest: '主力投入方向，全团队集中布局' },
      { rank: 2, title: '学区房购买焦虑', level: 'A', stars: 4, stage: '高峰末期', suggest: '本周做收尾内容，下周切换方向' },
    ],
    risk_item: { title: '首付政策解读', level: '风险', stars: 1, stage: '衰退期', suggest: '立即停止投入，避免流量内卷' },
    week_summary: '本周深圳房产内容市场核心关键词为"刚需上车"。龙华、宝安片区 300 万预算方向需求旺盛，供给尚未饱和，为本周最佳获客方向。学区房方向进入高峰末期，建议做收尾布局。首付政策解读类内容已严重过剩，不建议新投入。',
  };
}

exports.main = async (event, context) => {
  const today = event.date || '2026-06-16';
  const mockData = generateMockData(today);

  const report = {
    date: today,
    core_summary: { must_do: '300万刚需方向，流量红利期', must_not: '首付政策解读，内卷严重', hot_area: '龙华' },
    s_opportunity: {
      title: `S级机会 · ${mockData.topics[0].title}`,
      life_cycle: mockData.topics[0].life_cycle, life_cycle_day: mockData.topics[0].life_cycle_day,
      remain_days: mockData.topics[0].remain_days, suggest: mockData.topics[0].suggest,
      demand_growth: mockData.topics[0].demand_growth, supply_growth: mockData.topics[0].supply_growth,
      supply_demand_ratio: mockData.topics[0].supply_demand_ratio, high_intent_ratio: mockData.topics[0].high_intent_ratio,
      keywords: mockData.topics[0].keywords,
    },
    a_opportunity: {
      title: `A级机会 · ${mockData.topics[1].title}`,
      life_cycle: mockData.topics[1].life_cycle, life_cycle_day: mockData.topics[1].life_cycle_day,
      remain_days: mockData.topics[1].remain_days, suggest: mockData.topics[1].suggest,
      demand_growth: mockData.topics[1].demand_growth, supply_growth: mockData.topics[1].supply_growth,
      supply_demand_ratio: mockData.topics[1].supply_demand_ratio, high_intent_ratio: mockData.topics[1].high_intent_ratio,
      keywords: mockData.topics[1].keywords,
    },
    risk_warning: {
      title: `高风险 · ${mockData.topics[2].title}`,
      conclusion: '供给严重过剩，需求增长乏力，投入产出比极低，不建议布局',
      details: [
        { label: '近7天内容增速', value: `+${mockData.topics[2].supply_growth}%` },
        { label: '需求增速', value: `${mockData.topics[2].demand_growth}%` },
        { label: '供需比', value: String(mockData.topics[2].supply_demand_ratio) },
        { label: '预判', value: '衰退期，预计持续下滑' },
      ],
    },
    area_rank: mockData.areas.map(a => ({
      name: a.name, level: Math.ceil(a.demand_score / 20),
      trend: a.trend === 'up' ? '上涨' : a.trend === 'down' ? '回落' : '持平',
    })),
    peer_reference: mockData.peers,
    status: 1,
    create_time: new Date(),
    update_time: new Date(),
  };

  const res = await db.collection('daily_report').add({ data: report });

  const weekData = generateWeekRank('2026年第25周');
  await db.collection('week_rank').add({ data: { ...weekData, update_time: new Date() } });

  return { code: 0, data: { reportId: res._id, message: '种子数据填充完成' } };
};
