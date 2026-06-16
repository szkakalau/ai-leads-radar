const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: { rank: null, loading: true, isMember: false },
  onShow() {
    this.setData({ isMember: auth.isMember() });
    if (auth.isMember()) this.loadRank();
  },
  async loadRank() {
    this.setData({ loading: true });
    try { const rank = await api.getWeekRank(); this.setData({ rank, loading: false }); }
    catch (e) { this.setData({ loading: false }); wx.showToast({ title: e.message || '加载失败', icon: 'none' }); }
  },
  onGoMember() { wx.switchTab({ url: '/pages/mine/index' }); },
});
