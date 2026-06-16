const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { action, reportId, data, date } = event;
  try {
    switch (action) {
      case 'list':
        const listRes = await db.collection('daily_report').orderBy('date', 'desc').limit(30).get();
        return { code: 0, data: listRes.data };
      case 'create':
        const addRes = await db.collection('daily_report').add({ data: { ...data, status: 0, create_time: new Date(), update_time: new Date() } });
        return { code: 0, data: { id: addRes._id } };
      case 'update':
        await db.collection('daily_report').doc(reportId).update({ data: { ...data, update_time: new Date() } });
        return { code: 0, data: { message: '更新成功' } };
      case 'publish':
        await db.collection('daily_report').doc(reportId).update({ data: { status: 1, update_time: new Date() } });
        return { code: 0, data: { message: '发布成功' } };
      default:
        return { code: -1, message: '未知操作' };
    }
  } catch (e) {
    return { code: -1, message: '操作失败：' + e.message };
  }
};
