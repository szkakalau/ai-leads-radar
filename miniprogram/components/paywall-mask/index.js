Component({
  properties: { visible: { type: Boolean, value: true } },
  methods: {
    onGoMember() { wx.switchTab({ url: '/pages/mine/index' }); },
  },
});
