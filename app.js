// app.js
App({
  onLaunch() {
    // 初始化应用数据
    this.initAppData();
  },

  initAppData() {
    // 检查是否首次启动
    const config = wx.getStorageSync('appConfig');
    if (!config) {
      // 设置默认配置
      const defaultConfig = {
        yearlyGoal: 150,
        currentCount: 0,
        version: '1.0.2',
        cloudSync: false,
        syncKey: ''
      };
      wx.setStorageSync('appConfig', defaultConfig);
    }

    // 检查是否有记录数据
    const logs = wx.getStorageSync('logs');
    if (!logs) {
      wx.setStorageSync('logs', []);
    }
  },

  globalData: {
    userInfo: null
  }
});
