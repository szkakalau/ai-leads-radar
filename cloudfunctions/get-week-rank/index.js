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
  try {
    const res = await db.collection('week_rank').orderBy('update_time', 'desc').limit(1).get();
    if (res.data.length === 0) return { code: -1, message: '本周战场尚未发布' };
    return { code: 0, data: res.data[0] };
  } catch (e) {
    console.error('get-week-rank error:', e);
    return { code: -1, message: '获取本周战场失败' };
  }
};
