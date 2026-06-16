const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { action } = event;
  if (action === 'create-collections') {
    const collections = ['daily_report', 'week_rank', 'user_info', 'payment_order'];
    const results = [];
    for (const name of collections) {
      try {
        const res = await db.collection(name).add({ data: { _init: true, _created: new Date() } });
        await db.collection(name).doc(res._id).remove();
        results.push(`${name}: created`);
      } catch (e) {
        if (e.errCode === -502005) { results.push(`${name}: already exists`); }
        else { results.push(`${name}: error - ${e.message}`); }
      }
    }
    return { code: 0, data: results };
  }
  return { code: -1, message: 'Unknown action' };
};
