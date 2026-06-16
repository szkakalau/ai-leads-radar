const api = {
  callFunction(name, data = {}) {
    return wx.cloud.callFunction({ name, data }).then(res => {
      if (res.result && res.result.code === 0) return res.result.data;
      throw new Error(res.result?.message || '请求失败');
    });
  },
  login() { return this.callFunction('login', {}); },
  getDailyReport() { return this.callFunction('get-daily-report', {}); },
  getWeekRank() { return this.callFunction('get-week-rank', {}); },
  getHistoryList(page = 1) { return this.callFunction('get-history-list', { page }); },
  getHistoryDetail(date) { return this.callFunction('get-history-detail', { date }); },
  submitOrder(planType, amount, voucherUrl, contactWechat) {
    return this.callFunction('submit-order', { plan_type: planType, amount, voucher_url: voucherUrl, contact_wechat: contactWechat });
  },
};
module.exports = api;
