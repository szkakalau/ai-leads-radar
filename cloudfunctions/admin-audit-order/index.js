const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { orderId, action, rejectReason } = event;
  if (!orderId || !action) return { code: -1, message: '缺少参数' };
  try {
    const orderRes = await db.collection('payment_order').doc(orderId).get();
    if (!orderRes.data) return { code: -1, message: '订单不存在' };
    const order = orderRes.data;

    if (action === 'approve') {
      await db.collection('payment_order').doc(orderId).update({ data: { audit_status: 1, audit_time: new Date() } });
      const expireTime = new Date();
      expireTime.setDate(expireTime.getDate() + 30);
      const userRes = await db.collection('user_info').where({ openid: order.user_openid }).get();
      if (userRes.data.length > 0) {
        await db.collection('user_info').doc(userRes.data[0]._id).update({ data: { member_status: 1, member_expire_time: expireTime } });
      }
      return { code: 0, data: { message: '审核通过，会员已开通' } };
    }

    if (action === 'reject') {
      await db.collection('payment_order').doc(orderId).update({ data: { audit_status: 2, reject_reason: rejectReason || '', audit_time: new Date() } });
      return { code: 0, data: { message: '已驳回' } };
    }
    return { code: -1, message: '未知操作' };
  } catch (e) {
    return { code: -1, message: '审核操作失败：' + e.message };
  }
};
