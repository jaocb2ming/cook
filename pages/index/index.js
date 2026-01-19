// pages/index/index.js
const storage = require('../../utils/storage');
const heatmap = require('../../utils/heatmap');

Page({
    data: {
        yearlyGoal: 150,
        currentCount: 0,
        progressPercentage: 0,
        heatmapRows: [],
        monthLabels: [],
        recentLogs: [],
        showModal: false,
        isEditing: false,
        editingId: null,
        durationOptions: [
            { label: '15m', value: 15 },
            { label: '30m', value: 30 },
            { label: '45m', value: 45 },
            { label: '1h', value: 60 }
        ],
        newLog: {
            date: '',
            dateDisplay: '',
            time: '',
            duration: 45,
            intensity: 4.2,
            notes: ''
        },
        intensityLabel: '浓郁',
        intensityColor: '#7c3aed',
        intensityLevelClass: 'level-3',
        // 计时器相关
        isTimerActive: false,
        timerStartTime: 0,
        timerDisplay: '00:00:00',
        // Daily records modal
        showDailyModal: false,
        selectedDate: '',
        selectedDateLogs: []
    },

    onLoad() {
        this.loadData();
    },

    onShow() {
        this.loadData();
        this.initTimer();
    },

    onHide() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    },

    onUnload() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    },

    loadData() {
        // 加载配置
        const config = storage.getConfig();
        const logs = storage.getAllLogs();

        // 计算进度
        const percentage = config.yearlyGoal > 0
            ? Math.round((config.currentCount / config.yearlyGoal) * 100)
            : 0;

        // 加载热力图数据
        const currentYear = new Date().getFullYear();
        const heatmapData = storage.getHeatmapData();
        console.log('[DEBUG] 热力图原始数据:', heatmapData);
        const heatmapRows = heatmap.generateHeatmapGrid(currentYear, heatmapData);
        console.log('[DEBUG] 热力图网格数据:', JSON.stringify(heatmapRows, null, 2));
        const monthLabels = heatmap.getMonthLabels();

        // 加载最近记录 (最多显示3条)
        const recentLogs = logs.slice(0, 3).map(log => {
            const intensity = log.intensity || 0;
            
            // 统一的等级判定逻辑 (用于列表显示)
            let level = 1;
            if (intensity >= 4.7) level = 4;      // 荧光粉紫 (爆表)
            else if (intensity >= 3.9) level = 3; // 深邃紫 (浓郁)
            else if (intensity >= 2.6) level = 2; // 正紫色 (佳境)
            else level = 1;                       // 淡紫色 (起步)

            const date = new Date(log.timestamp);
            const now = new Date();

            const isToday = date.toDateString() === now.toDateString();
            const isThisYear = date.getFullYear() === now.getFullYear();

            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear();

            let timeDisplay = '';
            if (isToday) {
                timeDisplay = `${hours}:${minutes}`;
            } else if (isThisYear) {
                timeDisplay = `${month}月${day}日 ${hours}:${minutes}`;
            } else {
                timeDisplay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }

            return {
                ...log,
                intensityLevel: level,
                dateDisplay: storage.formatTimeDisplay(log.timestamp),
                timeDisplay: timeDisplay
            };
        });

        this.setData({
            yearlyGoal: config.yearlyGoal,
            currentCount: config.currentCount,
            progressPercentage: percentage,
            heatmapRows: heatmapRows,
            monthLabels: monthLabels,
            recentLogs: recentLogs
        });
    },

    // 显示添加记录弹窗
    showAddLogModal() {
        const now = new Date();
        const dateStr = this.formatDate(now);
        const timeStr = this.formatTime(now);

        const initialIntensity = 4.2;
        this.setData({
            showModal: true,
            isEditing: false,
            editingId: null,
            'newLog.date': dateStr,
            'newLog.dateDisplay': this.formatDateDisplay(now),
            'newLog.time': timeStr,
            'newLog.duration': 45,
            'newLog.intensity': initialIntensity,
            'newLog.notes': ''
        });
        
        this.updateIntensityVisuals(initialIntensity);
    },

    // 编辑记录
    editLog(e) {
        const id = e.currentTarget.dataset.id;
        const logs = storage.getAllLogs();
        const log = logs.find(l => l.id === id);

        if (!log) return;

        const date = new Date(log.timestamp);
        
        this.setData({
            showModal: true,
            isEditing: true,
            editingId: id,
            'newLog.date': this.formatDate(date),
            'newLog.dateDisplay': this.formatDateDisplay(date),
            'newLog.time': this.formatTime(date),
            'newLog.duration': log.duration,
            'newLog.intensity': log.intensity,
            'newLog.notes': log.description.startsWith('强度:') ? '' : log.description 
        });

        this.updateIntensityVisuals(log.intensity);
    },

    // 删除当前正在编辑的记录
    deleteCurrentLog() {
        const that = this;
        wx.showModal({
            title: '确认删除',
            content: '确定要删除这条记录吗？此操作无法撤销。',
            confirmColor: '#ef4444',
            success(res) {
                if (res.confirm) {
                    storage.deleteLog(that.data.editingId);
                    
                    wx.showToast({
                        title: '记录已删除',
                        icon: 'success'
                    });

                    that.hideAddLogModal();
                    that.loadData();
                }
            }
        });
    },

    // 隐藏添加记录弹窗
    hideAddLogModal() {
        this.setData({
            showModal: false,
            isEditing: false,
            editingId: null
        });
    },

    // 阻止冒泡
    stopPropagation() { },

    // 日期选择
    onDateChange(e) {
        const dateStr = e.detail.value;
        const date = new Date(dateStr);
        this.setData({
            'newLog.date': dateStr,
            'newLog.dateDisplay': this.formatDateDisplay(date)
        });
    },

    // 时间选择
    onTimeChange(e) {
        this.setData({
            'newLog.time': e.detail.value
        });
    },

    // 时长输入
    onDurationInput(e) {
        const value = parseInt(e.detail.value);
        if (isNaN(value)) return;
        
        this.setData({
            'newLog.duration': value
        });
    },

    // 时长选择 (Pill)
    onDurationSelect(e) {
        const value = parseInt(e.currentTarget.dataset.value);
        this.setData({
            'newLog.duration': value
        });
    },

    // 强度滑块
    onIntensityChange(e) {
        const value = (e.detail.value / 10).toFixed(1);
        const floatVal = parseFloat(value);
        this.setData({
            'newLog.intensity': floatVal
        });
        this.updateIntensityVisuals(floatVal);
    },
    
    // 快速选择强度
    quickSetIntensity(e) {
        const val = parseInt(e.currentTarget.dataset.val);
        this.setData({
            'newLog.intensity': val
        });
        this.updateIntensityVisuals(val);
    },
    
    // 更新强度视觉反馈 (弹窗实时预览)
    updateIntensityVisuals(value) {
        let label = '';
        let color = '';
        let levelClass = '';

        if (value >= 4.7) {
            label = '灵魂出窍';
            color = '#f0abfc'; // Level 4
            levelClass = 'level-extreme';
        } else if (value >= 3.9) {
            label = '如痴如醉';
            color = '#6d28d9'; // Level 3
            levelClass = 'level-high';
        } else if (value >= 2.6) {
            label = '渐入佳境';
            color = '#8b5cf6'; // Level 2
            levelClass = 'level-medium';
        } else {
            label = '浅尝辄止';
            color = '#c4b5fd'; // Level 1
            levelClass = 'level-light';
        }

        this.setData({
            intensityLabel: label,
            intensityColor: color,
            intensityLevelClass: levelClass
        });
    },

    // 备注输入
    onNotesInput(e) {
        this.setData({
            'newLog.notes': e.detail.value
        });
    },

    // 确认添加/更新记录
    confirmAddLog() {
        const { date, time, duration, intensity, notes } = this.data.newLog;

        if (!date || !time) {
            wx.showToast({
                title: '请选择日期和时间',
                icon: 'none'
            });
            return;
        }

        if (!duration) {
            wx.showToast({
                title: '请输入时长',
                icon: 'none'
            });
            return;
        }

        // 生成准确的 timestamp
        const timestamp = new Date(`${date.replace(/-/g, '/')} ${time}`).getTime();
        const title = `${duration}分钟 Cook`;
        const description = notes || `强度: ${intensity}/5.0`;
        
        const logData = {
            title: title,
            description: description,
            duration: duration,
            intensity: intensity,
            timestamp: timestamp
        };

        if (this.data.isEditing) {
            // 更新逻辑
            logData.id = this.data.editingId;
            storage.updateLog(logData);
            
            wx.showToast({
                title: '记录已更新',
                icon: 'success'
            });
        } else {
            // 新增逻辑
            storage.addLog(logData);
            
            wx.showToast({
                title: '记录已添加',
                icon: 'success'
            });
        }

        // 关闭弹窗并刷新数据
        this.hideAddLogModal();
        this.loadData();
    },

    // 格式化日期
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // 格式化时间
    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    },

    // 格式化日期显示
    formatDateDisplay(date) {
        return `${date.getMonth() + 1}月 ${date.getDate()}, ${date.getFullYear()}`;
    },

    // 计时器逻辑
    initTimer() {
        const timerStartTime = wx.getStorageSync('timerStartTime');
        if (timerStartTime) {
            this.setData({
                isTimerActive: true,
                timerStartTime: timerStartTime
            });
            this.startTimerInterval();
        }
    },

    startTimer() {
        const startTime = Date.now();
        wx.setStorageSync('timerStartTime', startTime);
        this.setData({
            isTimerActive: true,
            timerStartTime: startTime
        });
        this.startTimerInterval();

        wx.showToast({
            title: '计时开始!',
            icon: 'none'
        });
    },

    startTimerInterval() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        const update = () => {
            const now = Date.now();
            const diff = now - this.data.timerStartTime;
            this.setData({
                timerDisplay: this.formatTimerTime(diff)
            });
        };

        update();
        this.timerInterval = setInterval(update, 1000);
    },

    stopTimer() {
        const endTime = Date.now();
        const startTime = this.data.timerStartTime;
        const diffMs = endTime - startTime;
        const diffMins = Math.max(1, Math.ceil(diffMs / (1000 * 60))); // 至少1分钟

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        wx.removeStorageSync('timerStartTime');
        this.setData({
            isTimerActive: false,
            timerStartTime: 0,
            timerDisplay: '00:00:00'
        });

        // 自动打开记录弹窗并填充时长
        const now = new Date();
        const dateStr = this.formatDate(now);
        const timeStr = this.formatTime(now);

        this.setData({
            showModal: true,
            isEditing: false, 
            editingId: null,
            'newLog.date': dateStr,
            'newLog.dateDisplay': this.formatDateDisplay(now),
            'newLog.time': timeStr,
            'newLog.duration': diffMins,
            'newLog.intensity': 4.2,
            'newLog.notes': ''
        });
        
        this.updateIntensityVisuals(4.2);
    },

    formatTimerTime(ms) {
        let totalSeconds = Math.floor(ms / 1000);
        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;

        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    },

    goToSettings() {
        wx.navigateTo({
            url: '/pages/settings/settings'
        });
    },

    // Navigate to history page
    goToHistory() {
        wx.navigateTo({
            url: '/pages/history/history'
        });
    },

    // Heatmap cell click handler
    onHeatmapCellClick(e) {
        const date = e.currentTarget.dataset.date;
        if (!date) return; // Skip empty cells

        const logs = storage.getAllLogs().filter(log => log.date === date);

        this.setData({
            selectedDate: date,
            selectedDateLogs: this.formatLogsForDisplay(logs),
            showDailyModal: true
        });
    },

    // Format logs for display (reused from loadData)
    formatLogsForDisplay(logs) {
        return logs.map(log => {
            const intensity = log.intensity || 0;

            let level = 1;
            if (intensity >= 4.7) level = 4;
            else if (intensity >= 3.9) level = 3;
            else if (intensity >= 2.6) level = 2;
            else level = 1;

            const date = new Date(log.timestamp);
            const now = new Date();

            const isToday = date.toDateString() === now.toDateString();
            const isThisYear = date.getFullYear() === now.getFullYear();

            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear();

            let timeDisplay = '';
            if (isToday) {
                timeDisplay = `${hours}:${minutes}`;
            } else if (isThisYear) {
                timeDisplay = `${month}月${day}日 ${hours}:${minutes}`;
            } else {
                timeDisplay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }

            return {
                ...log,
                intensityLevel: level,
                dateDisplay: storage.formatTimeDisplay(log.timestamp),
                timeDisplay: timeDisplay
            };
        });
    },

    // Hide daily records modal
    hideDailyRecordsModal() {
        this.setData({
            showDailyModal: false,
            selectedDate: '',
            selectedDateLogs: []
        });
    },

    // Format date for modal title
    formatSelectedDate(dateStr) {
        const date = new Date(dateStr.replace(/-/g, '/'));
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return '今天';
        if (diffDays === 1) return '昨天';
        if (diffDays === -1) return '明天';
        if (diffDays > 1 && diffDays < 7) return `${diffDays}天前`;

        return `${date.getMonth() + 1}月${date.getDate()}日`;
    },

    // Edit log from daily modal
    editLogFromDaily(e) {
        const id = e.currentTarget.dataset.id;
        this.hideDailyRecordsModal();
        this.editLog({ currentTarget: { dataset: { id } } });
    },

    // Handle navigation from history page
    editLogFromHistory(id) {
        if (id) {
            this.editLog({ currentTarget: { dataset: { id } } });
        }
    }
});
