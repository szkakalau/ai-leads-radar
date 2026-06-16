Page({
  data: {
    faqs: [
      { q: '内容每天什么时候更新？', a: '每日早 8:00 准时更新当日日报，更新后可刷新查看。', open: false },
      { q: '付款后多久开通权限？', a: '上传付款凭证后，我们会尽快审核，一般 10 分钟内完成开通。', open: false },
      { q: '不满意可以退款吗？', a: '支持 7 天无理由退款，联系客服处理即可。', open: false },
    ],
  },
  toggleFaq(e) {
    const { index } = e.currentTarget.dataset;
    const faqs = this.data.faqs;
    faqs[index].open = !faqs[index].open;
    this.setData({ faqs });
  },
});
