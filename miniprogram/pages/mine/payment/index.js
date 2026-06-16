const api = require('../../../utils/api');

const PLANS = {
  personal: { name: '个人版', price: '49', amount: 49, desc: '适合独立经纪人' },
  store: { name: '单店版', price: '599', amount: 599, desc: '适合门店团队' },
};

Page({
  data: {
    plan: null, planType: '', qrcodeUrl: '', voucherPath: '',
    contactWechat: '', uploading: false, submitted: false,
  },

  onLoad(options) {
    const planType = options.plan;
    const plan = PLANS[planType];
    if (!plan) { wx.showToast({ title: '无效档位', icon: 'none' }); setTimeout(() => wx.navigateBack(), 1500); return; }
    this.setData({ plan, planType });
  },

  onChooseVoucher() {
    wx.chooseImage({ count: 1, sizeType: ['compressed'], success: (res) => { this.setData({ voucherPath: res.tempFilePaths[0] }); } });
  },

  onContactInput(e) { this.setData({ contactWechat: e.detail.value }); },

  async onSubmit() {
    if (!this.data.voucherPath) return wx.showToast({ title: '请上传付款凭证', icon: 'none' });
    if (!this.data.contactWechat.trim()) return wx.showToast({ title: '请填写联系微信号', icon: 'none' });
    this.setData({ uploading: true });
    try {
      const cloudPath = `vouchers/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`;
      const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: this.data.voucherPath });
      await api.submitOrder(this.data.planType, this.data.plan.amount, uploadRes.fileID, this.data.contactWechat.trim());
      this.setData({ uploading: false, submitted: true });
    } catch (e) {
      this.setData({ uploading: false });
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }
  },
});
