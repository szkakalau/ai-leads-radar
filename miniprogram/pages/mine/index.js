const auth = require('../../utils/auth');
const app = getApp();

Page({
  data: {
    userInfo: null, isLoggedIn: false, isMember: false, memberExpireText: '',
  },

  onShow() {
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn,
      isMember: auth.isMember(),
      memberExpireText: auth.isMember()
        ? `会员用户 · 有效期至${app.globalData.memberExpireTime}`
        : '普通用户',
    });
  },

  onGoPayment(e) {
    if (!auth.requireLogin()) return;
    const { plan } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/mine/payment/index?plan=${plan}` });
  },

  onGoFaq() { wx.navigateTo({ url: '/pages/mine/faq/index' }); },

  onCopyWechat() {
    wx.setClipboardData({
      data: 'Kwokchungsz',
      success: () => wx.showToast({ title: '已复制客服微信号' }),
    });
  },
});
