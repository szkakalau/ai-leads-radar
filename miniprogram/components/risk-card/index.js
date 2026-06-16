Component({
  properties: {
    data: { type: Object, value: {} },
    blurred: { type: Boolean, value: false },
  },
  data: { expanded: false },
  methods: {
    toggleExpand() {
      if (this.properties.blurred) return;
      this.setData({ expanded: !this.data.expanded });
    },
  },
});
