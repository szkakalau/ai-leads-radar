const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { code: -1, message: '请先登录' };
  const { plan_type, amount, voucher_url, contact_wechat } = event;
  if (!plan_type || !amount || !voucher_url) return { code: -1, message: '缺少必填参数' };
  try {
    await db.collection('payment_order').add({
      data: {
        user_openid: OPENID, plan_type, amount, voucher_url,
        contact_wechat: contact_wechat || '', audit_status: 0,
        submit_time: new Date(), audit_time: null, reject_reason: '',
      },
    });
    return { code: 0, data: { message: '订单提交成功，等待审核' } };
  } catch (e) {
    console.error('submit-order error:', e);
    return { code: -1, message: '订单提交失败' };
  }
};
