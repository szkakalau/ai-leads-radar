const cloud = require('wx-server-sdk');
const fetch = require('node-fetch');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function generateMockData(dateStr) {
  const dayOfMonth = new Date(dateStr).getDate();
  const isRigidDemandDay = dayOfMonth % 2 === 0;
  return {
    date: dateStr,
    topics: [
      { title: '300万预算首套刚需', demand_growth: isRigidDemandDay ? 120 : 95, supply_growth: 15, supply_demand_ratio: 6.3, high_intent_ratio: 68, life_cycle: '爆发期', life_cycle_day: 2, remain_days: 3, keywords: ['首套', '刚需', '300万'], suggest: '主打避坑人设，覆盖龙华/宝安片区' },
      { title: '学区房购买焦虑', demand_growth: 65, supply_growth: 20, supply_demand_ratio: 3.3, high_intent_ratio: 55, life_cycle: '高峰末期', life_cycle_day: 4, remain_days: 1, keywords: ['学区', '学位', '名校'], suggest: '做横向对比类内容而非焦虑煽动' },
      { title: '首付政策解读', demand_growth: -10, supply_growth: 180, supply_demand_ratio: 0.3, high_intent_ratio: 25, life_cycle: '衰退期', life_cycle_day: 6, remain_days: 0, keywords: ['首付', '政策'], suggest: null },
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

function runRules(topics) {
  return topics.map(t => {
    let level, levelReason;
    if (t.supply_demand_ratio > 5 && t.high_intent_ratio > 60 && t.demand_growth > 100) { level = 'S'; levelReason = '供需比>5，高购买意图>60%，日需求增速>100%'; }
    else if (t.supply_demand_ratio >= 2 && t.high_intent_ratio > 50 && t.demand_growth >= 50) { level = 'A'; levelReason = '供需比2-5，高购买意图>50%，日需求增速50%-100%'; }
    else if (t.supply_demand_ratio < 0.5 && t.supply_growth > t.demand_growth * 1.5) { level = 'RISK'; levelReason = '供需比<0.5，供给增速远高于需求增速'; }
    else { level = 'B'; levelReason = '未达到A/S/风险标准'; }
    return { ...t, level, levelReason };
  });
}

async function callDeepSeek(structuredData) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) { console.warn('DEEPSEEK_API_KEY not set, using rule-based output'); return null; }

  const systemPrompt = `你是深圳房产获客情报分析师。你的任务是将结构化数据润色为专业日报文案。
规则：
1. 仅润色文案表达，不修改任何数据结论
2. 每条文案不超过60字
3. 风格：专业、直接、有行动指导性
4. 严格按 JSON 格式输出`;

  const userPrompt = `今日数据如下：\n${JSON.stringify(structuredData, null, 2)}\n\n请生成日报文案，JSON 格式：\n{\n  "core_summary": { "must_do": "必做建议", "must_not": "避免方向", "hot_area": "最热片区名" },\n  "s_opportunity": { "title": "含S前缀", "suggest": "核心建议" },\n  "a_opportunity": { "title": "含A前缀", "suggest": "核心建议" },\n  "risk_warning": { "title": "含风险前缀", "conclusion": "核心结论" }\n}`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], temperature: 0.7, max_tokens: 2000 }),
    });
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (e) { console.error('DeepSeek API error:', e.message); return null; }
}

exports.main = async (event) => {
  const dateStr = event.date || new Date().toISOString().split('T')[0];
  try {
    const mockData = generateMockData(dateStr);
    const ratedTopics = runRules(mockData.topics);
    const sTopic = ratedTopics.find(t => t.level === 'S');
    const aTopic = ratedTopics.find(t => t.level === 'A');
    const riskTopic = ratedTopics.find(t => t.level === 'RISK');

    const structured = { date: dateStr, areas: mockData.areas, s_topic: sTopic || ratedTopics[0], a_topic: aTopic || ratedTopics[1], risk_topic: riskTopic || ratedTopics[2], peers: mockData.peers };
    const aiResult = await callDeepSeek(structured);

    const report = {
      date: dateStr,
      core_summary: aiResult?.core_summary || { must_do: '300万刚需方向，流量红利期', must_not: '首付政策解读，内卷严重', hot_area: '龙华' },
      s_opportunity: {
        title: aiResult?.s_opportunity?.title || `S级机会 · ${sTopic?.title || '暂无'}`,
        life_cycle: sTopic?.life_cycle || '--', life_cycle_day: sTopic?.life_cycle_day || 0, remain_days: sTopic?.remain_days || 0,
        suggest: aiResult?.s_opportunity?.suggest || sTopic?.suggest || '--',
        demand_growth: sTopic?.demand_growth || 0, supply_growth: sTopic?.supply_growth || 0,
        supply_demand_ratio: sTopic?.supply_demand_ratio || 0, high_intent_ratio: sTopic?.high_intent_ratio || 0,
        keywords: sTopic?.keywords || [],
      },
      a_opportunity: {
        title: aiResult?.a_opportunity?.title || `A级机会 · ${aTopic?.title || '暂无'}`,
        life_cycle: aTopic?.life_cycle || '--', life_cycle_day: aTopic?.life_cycle_day || 0, remain_days: aTopic?.remain_days || 0,
        suggest: aiResult?.a_opportunity?.suggest || aTopic?.suggest || '--',
        demand_growth: aTopic?.demand_growth || 0, supply_growth: aTopic?.supply_growth || 0,
        supply_demand_ratio: aTopic?.supply_demand_ratio || 0, high_intent_ratio: aTopic?.high_intent_ratio || 0,
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
      area_rank: mockData.areas.map(a => ({ name: a.name, level: Math.ceil(a.demand_score / 20), trend: a.trend === 'up' ? '上涨' : a.trend === 'down' ? '回落' : '持平' })),
      peer_reference: mockData.peers,
      status: 0,
      create_time: new Date(),
      update_time: new Date(),
    };

    const res = await db.collection('daily_report').add({ data: report });
    return { code: 0, data: { reportId: res._id, message: '日报初稿已生成，请在管理后台审核后发布', aiUsed: !!aiResult } };
  } catch (e) { console.error('generate-report error:', e); return { code: -1, message: '日报生成失败：' + e.message }; }
};
