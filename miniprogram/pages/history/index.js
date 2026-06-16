const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: { list: [], loading: true, page: 1, isMember: false, hasMore: true },
  onShow() {
    this.setData({ isMember: auth.isMember() });
    if (auth.isMember()) this.loadList();
  },
  async loadList() {
    if (!this.data.hasMore) return;
    this.setData({ loading: true });
    try {
      const result = await api.getHistoryList(this.data.page);
      this.setData({
        list: this.data.list.concat(result.list),
        page: this.data.page + 1,
        hasMore: result.list.length === result.pageSize,
        loading: false,
      });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message, icon: 'none' });
    }
  },
  onReachBottom() { this.loadList(); },
  onItemTap(e) {
    const { date } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/history/detail/index?date=${date}` });
  },
  onGoMember() { wx.switchTab({ url: '/pages/mine/index' }); },
});
