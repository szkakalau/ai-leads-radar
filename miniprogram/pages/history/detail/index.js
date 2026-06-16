const api = require('../../../utils/api');

Page({
  data: { report: null, loading: true, date: '' },
  onLoad(options) {
    const date = options.date;
    this.setData({ date });
    if (date) this.loadReport(date);
  },
  async loadReport(date) {
    this.setData({ loading: true });
    try { const report = await api.getHistoryDetail(date); this.setData({ report, loading: false }); }
    catch (e) { this.setData({ loading: false }); wx.showToast({ title: e.message, icon: 'none' }); }
  },
});
