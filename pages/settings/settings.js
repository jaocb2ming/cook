// pages/settings/settings.js
const storage = require('../../utils/storage');
const supabase = require('../../utils/supabase');

Page({
    data: {
        yearlyGoal: 150,
        version: '1.0.2',
        showGoalModal: false,
        showClearModal: false,
        showResetModal: false,
        tempGoal: 150,
        cloudSync: false,
        syncKey: '',
        showSyncKeyModal: false,
        showRestoreModal: false,
        inputSyncKey: ''
    },

    onLoad() {
        this.loadConfig();
    },

    onShow() {
        this.loadConfig();
    },

    loadConfig() {
        const config = storage.getConfig();
        this.setData({
            yearlyGoal: config.yearlyGoal,
            version: config.version,
            tempGoal: config.yearlyGoal,
            cloudSync: config.cloudSync || false,
            syncKey: config.syncKey || ''
        });
    },

    // 返回首页
    goBack() {
        wx.navigateBack();
    },

    // 导出数据
    exportData() {
        const csv = storage.exportToCSV();

        if (!csv || csv === 'ID,Title,Description,Date,Timestamp\n') {
            wx.showToast({
                title: 'No data to export',
                icon: 'none'
            });
            return;
        }

        // 微信小程序中,可以使用文件系统API保存文件
        const fs = wx.getFileSystemManager();
        const fileName = `intimacy_hub_${Date.now()}.csv`;
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;

        try {
            fs.writeFileSync(filePath, csv, 'utf8');

            wx.showModal({
                title: 'Export Successful',
                content: `Data exported to ${fileName}. You can share this file.`,
                showCancel: false,
                success: () => {
                    // 可以选择分享文件
                    wx.shareFileMessage({
                        filePath: filePath,
                        success: () => {
                            wx.showToast({
                                title: 'Shared successfully',
                                icon: 'success'
                            });
                        },
                        fail: () => {
                            wx.showToast({
                                title: 'File saved locally',
                                icon: 'success'
                            });
                        }
                    });
                }
            });
        } catch (e) {
            wx.showToast({
                title: 'Export failed',
                icon: 'none'
            });
        }
    },

    // 显示清除数据弹窗
    showClearDataModal() {
        this.setData({
            showClearModal: true
        });
    },

    // 隐藏清除数据弹窗
    hideClearModal() {
        this.setData({
            showClearModal: false
        });
    },

    // 确认清除数据
    confirmClearData() {
        storage.clearAllData();

        wx.showToast({
            title: 'All data cleared',
            icon: 'success'
        });

        this.hideClearModal();
        this.loadConfig();
    },

    // 显示目标设置弹窗
    showGoalModal() {
        const config = storage.getConfig();
        this.setData({
            showGoalModal: true,
            tempGoal: config.yearlyGoal
        });
    },

    // 隐藏目标设置弹窗
    hideGoalModal() {
        this.setData({
            showGoalModal: false
        });
    },

    // 滑块变化
    onGoalSliderChange(e) {
        this.setData({
            tempGoal: e.detail.value
        });
    },

    // 确认目标
    confirmGoal() {
        storage.setYearlyGoal(this.data.tempGoal);

        wx.showToast({
            title: 'Goal updated',
            icon: 'success'
        });

        this.hideGoalModal();
        this.loadConfig();
    },

    // 显示重置进度弹窗
    showResetProgressModal() {
        this.setData({
            showResetModal: true
        });
    },

    // 隐藏重置进度弹窗
    hideResetModal() {
        this.setData({
            showResetModal: false
        });
    },

    // 确认重置进度
    confirmResetProgress() {
        storage.resetYearlyProgress();

        wx.showToast({
            title: 'Progress reset',
            icon: 'success'
        });

        this.hideResetModal();
        this.loadConfig();
    },

    // 显示隐私政策
    showPrivacyPolicy() {
        wx.showModal({
            title: 'Privacy Policy',
            content: 'All data is stored locally on your device. We do not collect or transmit any personal information. Your privacy is our priority.',
            showCancel: false,
            confirmText: 'Got it'
        });
    },

    stopPropagation() { },

    onCloudSyncChange(e) {
        const isChecked = e.detail.value;
        const config = storage.getConfig();

        if (isChecked) {
            if (!config.syncKey) {
                const newSyncKey = supabase.generateSyncKey();
                config.syncKey = newSyncKey;
                config.cloudSync = true;
                wx.setStorageSync('appConfig', config);

                wx.showModal({
                    title: '同步码已生成',
                    content: `您的同步码是：${newSyncKey}\n\n请妥善保存，它是找回数据的唯一凭证。`,
                    confirmText: '复制',
                    success: (res) => {
                        if (res.confirm) {
                            wx.setClipboardData({
                                data: newSyncKey,
                                success: () => {
                                    wx.showToast({
                                        title: '已复制',
                                        icon: 'success'
                                    });
                                }
                            });
                        }
                    }
                });
            } else {
                config.cloudSync = true;
                wx.setStorageSync('appConfig', config);
            }

            storage.triggerSync();

            wx.showToast({
                title: '云同步已开启',
                icon: 'success'
            });
        } else {
            wx.showModal({
                title: '关闭云同步？',
                content: '关闭后数据将仅保存在本地，若卸载微信或更换手机，数据将永久丢失。',
                confirmText: '确认关闭',
                confirmColor: '#ef4444',
                success: (res) => {
                    if (res.confirm) {
                        config.cloudSync = false;
                        wx.setStorageSync('appConfig', config);
                        this.setData({ cloudSync: false });
                        wx.showToast({
                            title: '云同步已关闭',
                            icon: 'success'
                        });
                    } else {
                        this.setData({ cloudSync: true });
                    }
                }
            });
            return;
        }

        this.setData({ cloudSync: isChecked });
    },

    showSyncKeyModal() {
        this.setData({ showSyncKeyModal: true });
    },

    hideSyncKeyModal() {
        this.setData({ showSyncKeyModal: false });
    },

    copySyncKey() {
        wx.setClipboardData({
            data: this.data.syncKey,
            success: () => {
                wx.showToast({
                    title: '已复制到剪贴板',
                    icon: 'success'
                });
                this.hideSyncKeyModal();
            }
        });
    },

    showRestoreModal() {
        this.setData({
            showRestoreModal: true,
            inputSyncKey: ''
        });
    },

    hideRestoreModal() {
        this.setData({ showRestoreModal: false });
    },

    onSyncKeyInput(e) {
        this.setData({ inputSyncKey: e.detail.value });
    },

    confirmRestore() {
        const syncKey = this.data.inputSyncKey.trim();

        if (!syncKey) {
            wx.showToast({
                title: '请输入同步码',
                icon: 'none'
            });
            return;
        }

        wx.showLoading({
            title: '正在恢复...',
            mask: true
        });

        supabase.downloadData(syncKey,
            (data) => {
                const { logs, config } = data;

                wx.hideLoading();

                wx.showModal({
                    title: '确认恢复数据？',
                    content: `找到 ${logs.length} 条记录，年度目标为 ${config.yearlyGoal || 150}。\n\n当前本地数据将被覆盖，是否继续？`,
                    confirmText: '确认恢复',
                    confirmColor: '#7c3aed',
                    success: (res) => {
                        if (res.confirm) {
                            wx.setStorageSync('logs', logs);

                            const currentConfig = storage.getConfig();
                            currentConfig.yearlyGoal = config.yearlyGoal;
                            currentConfig.syncKey = syncKey;
                            currentConfig.cloudSync = true;
                            wx.setStorageSync('appConfig', currentConfig);

                            storage.updateCount();

                            wx.showToast({
                                title: '恢复成功',
                                icon: 'success'
                            });

                            this.hideRestoreModal();
                            this.loadConfig();
                        }
                    }
                });
            },
            (err) => {
                wx.hideLoading();
                wx.showToast({
                    title: '恢复失败',
                    icon: 'none'
                });
                console.error('[Restore] Failed:', err);
            }
        );
    }
});
