const api = require('../../utils/api');
const app = getApp();

Page({
  data: { loading: false },

  async onGetUserInfo(e) {
    if (!e.detail.userInfo) return;
    this.setData({ loading: true });
    try {
      const { nickName, avatarUrl } = e.detail.userInfo;
      const userData = await api.login();
      app.globalData.userInfo = { nickName, avatarUrl, ...userData };
      app.globalData.isLoggedIn = true;
      app.globalData.isMember = userData.memberStatus === 1;
      app.globalData.memberExpireTime = userData.memberExpireTime;
      wx.setStorageSync('userInfo', app.globalData.userInfo);
      wx.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => wx.switchTab({ url: '/pages/today/index' }), 1000);
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },
});
