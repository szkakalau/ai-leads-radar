const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async () => {
  try {
    const [totalUsers, paidUsers, pendingOrders, todayUsers] = await Promise.all([
      db.collection('user_info').count(),
      db.collection('user_info').where({ member_status: 1 }).count(),
      db.collection('payment_order').where({ audit_status: 0 }).count(),
      db.collection('user_info').where({ register_time: db.command.gte(new Date(new Date().setHours(0, 0, 0, 0))) }).count(),
    ]);
    return { code: 0, data: { totalUsers: totalUsers.total, paidUsers: paidUsers.total, pendingOrders: pendingOrders.total, todayNewUsers: todayUsers.total } };
  } catch (e) {
    return { code: -1, message: '获取统计数据失败' };
  }
};
