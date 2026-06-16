const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const ADMIN = { username: 'admin', password: 'radar2026' };
exports.main = async (event) => {
  const { username, password } = event;
  if (username === ADMIN.username && password === ADMIN.password) {
    return { code: 0, data: { token: 'admin_session_' + Date.now(), expires: Date.now() + 8 * 3600000 } };
  }
  return { code: -1, message: '账号或密码错误' };
};
