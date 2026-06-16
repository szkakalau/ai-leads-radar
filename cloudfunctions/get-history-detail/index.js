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

  const { date } = event;
  if (!date) return { code: -1, message: '缺少日期参数' };
  try {
    const res = await db.collection('daily_report').where({ date, status: 1 }).limit(1).get();
    if (res.data.length === 0) return { code: -1, message: '该日日报不存在' };
    return { code: 0, data: res.data[0] };
  } catch (e) {
    console.error('get-history-detail error:', e);
    return { code: -1, message: '获取日报详情失败' };
  }
};
