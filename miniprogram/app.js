App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-d7g17h93r50c9cd1f',
      traceUser: true,
    });
    this.checkLoginStatus();
  },

  checkLoginStatus: function () {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
    }
  },

  onError(error) {
    console.error('App Error:', error);
  },

  onPageNotFound(res) {
    wx.redirectTo({ url: '/pages/today/index' });
  },

  globalData: {
    userInfo: null,
    isLoggedIn: false,
    isMember: false,
    memberExpireTime: null,
  },
});
