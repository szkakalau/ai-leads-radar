const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) return { code: -1, message: '获取用户身份失败' };

  try {
    const res = await db.collection('user_info').where({ openid: OPENID }).get();

    if (res.data.length === 0) {
      const newUser = {
        openid: OPENID, nick_name: event.nickName || '微信用户', avatar_url: event.avatarUrl || '',
        member_status: 0, member_expire_time: null, register_time: new Date(), last_login_time: new Date(),
      };
      await db.collection('user_info').add({ data: newUser });
      return { code: 0, data: { openid: OPENID, nickName: newUser.nick_name, avatarUrl: newUser.avatar_url, memberStatus: 0, memberExpireTime: null, isNewUser: true } };
    }

    const user = res.data[0];
    await db.collection('user_info').doc(user._id).update({
      data: { last_login_time: new Date(), nick_name: event.nickName || user.nick_name, avatar_url: event.avatarUrl || user.avatar_url },
    });

    let memberStatus = user.member_status;
    if (memberStatus === 1 && user.member_expire_time) {
      if (new Date(user.member_expire_time) < new Date()) {
        memberStatus = 0;
        await db.collection('user_info').doc(user._id).update({ data: { member_status: 0 } });
      }
    }

    return { code: 0, data: { openid: OPENID, nickName: event.nickName || user.nick_name, avatarUrl: event.avatarUrl || user.avatar_url, memberStatus, memberExpireTime: memberStatus === 1 ? user.member_expire_time : null, isNewUser: false } };
  } catch (e) {
    console.error('login error:', e);
    return { code: -1, message: '登录失败：' + e.message };
  }
};
