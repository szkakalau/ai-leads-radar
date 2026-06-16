const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: { date: '', report: null, isMember: false, loading: true },

  onLoad() {
    this.setData({ date: this.formatDate(new Date()) });
    this.loadReport();
  },

  onShow() { this.setData({ isMember: auth.isMember() }); },

  onPullDownRefresh() { this.loadReport().then(() => wx.stopPullDownRefresh()); },

  async loadReport() {
    this.setData({ loading: true });
    try {
      const report = await api.getDailyReport();
      this.setData({ report, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '加载失败', icon: 'none' });
    }
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}年${m}月${d}日`;
  },
});
