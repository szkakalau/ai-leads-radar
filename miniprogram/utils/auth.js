const app = getApp();

const auth = {
  isLoggedIn() { return app.globalData.isLoggedIn; },
  isMember() {
    if (!app.globalData.isMember) return false;
    if (!app.globalData.memberExpireTime) return false;
    return new Date(app.globalData.memberExpireTime) > new Date();
  },
  requireLogin() {
    if (!this.isLoggedIn()) { wx.navigateTo({ url: '/pages/login/index' }); return false; }
    return true;
  },
  requireMember() {
    if (!this.isMember()) {
      wx.showModal({
        title: '会员专享内容', content: '开通会员即可查看完整获客情报',
        confirmText: '去开通', success(res) { if (res.confirm) wx.switchTab({ url: '/pages/mine/index' }); },
      });
      return false;
    }
    return true;
  },
};
module.exports = auth;
