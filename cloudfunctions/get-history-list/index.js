const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { code: -1, message: '请先登录' };
  const userRes = await db.collection('user_info').where({ openid: OPENID }).get();
  if (userRes.data.length === 0) return { code: -1, message: '用户不存在' };
  const user = userRes.data[0];
  const isMember = user.member_status === 1 && user.member_expire_time && new Date(user.member_expire_time) > new Date();
  if (!isMember) return { code: -1, message: '请开通会员后查看' };

  const page = event.page || 1;
  const pageSize = 20;
  try {
    const res = await db.collection('daily_report').where({ status: 1 })
      .field({ _id: true, date: true, 'core_summary.hot_area': true })
      .orderBy('date', 'desc').skip((page - 1) * pageSize).limit(pageSize).get();
    const list = res.data.map(item => ({
      id: item._id, date: item.date,
      summary: item.core_summary?.hot_area ? `热点片区：${item.core_summary.hot_area}` : '暂无摘要',
    }));
    return { code: 0, data: { list, page, pageSize } };
  } catch (e) {
    console.error('get-history-list error:', e);
    return { code: -1, message: '获取历史列表失败' };
  }
};
