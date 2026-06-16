const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const today = event.date || formatDate(new Date());

  try {
    const res = await db.collection('daily_report').where({ date: today, status: 1 }).limit(1).get();
    if (res.data.length === 0) return { code: -1, message: '今日日报尚未发布' };

    const report = res.data[0];
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

    if (isMember) return { code: 0, data: report };
    return { code: 0, data: { _id: report._id, date: report.date, core_summary: report.core_summary, status: report.status } };
  } catch (e) {
    console.error('get-daily-report error:', e);
    return { code: -1, message: '获取日报失败：' + e.message };
  }
};
