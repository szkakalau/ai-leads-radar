Component({
  properties: {
    data: { type: Object, value: {} },
    level: { type: String, value: 'A' },
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
