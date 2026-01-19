const supabase = require('./supabase');

function triggerSync() {
  try {
    const config = getConfig();
    if (config.cloudSync && config.syncKey) {
      const logs = getAllLogs();
      supabase.silentUpload(config.syncKey, logs, config);
    }
  } catch (e) {
    console.error('[Sync] Failed to trigger sync:', e);
  }
}

function getAllLogs() {
    return wx.getStorageSync('logs') || [];
}

/**
 * 添加新记录
 */
function addLog(log) {
    const logs = getAllLogs();
    const timestamp = log.timestamp || Date.now();
    const newLog = {
        id: timestamp.toString() + Math.random().toString(36).substr(2, 5),
        timestamp: timestamp,
        date: formatDate(new Date(timestamp)),
        ...log
    };
    logs.unshift(newLog);
    wx.setStorageSync('logs', logs);

    // 更新计数
    updateCount();

    triggerSync();

    return newLog;
}

/**
 * 更新记录
 */
function updateLog(updatedLog) {
    let logs = getAllLogs();
    const index = logs.findIndex(log => log.id === updatedLog.id);
    
    if (index !== -1) {
        // 更新记录，保留原有 ID
        logs[index] = {
            ...logs[index],
            ...updatedLog,
            date: formatDate(new Date(updatedLog.timestamp)) // 确保 date 字段与 timestamp 一致
        };
        
        wx.setStorageSync('logs', logs);
        updateCount();
        triggerSync();
        return true;
    }
    return false;
}

/**
 * 删除记录
 */
function deleteLog(id) {
    let logs = getAllLogs();
    logs = logs.filter(log => log.id !== id);
    wx.setStorageSync('logs', logs);
    updateCount();
    triggerSync();
}

/**
 * 清空所有数据
 */
function clearAllData() {
    wx.removeStorageSync('logs');
    wx.setStorageSync('logs', []);
    const config = getConfig();
    config.currentCount = 0;
    wx.setStorageSync('appConfig', config);
    triggerSync();
}

/**
 * 获取应用配置
 */
function getConfig() {
    return wx.getStorageSync('appConfig') || {
        yearlyGoal: 150,
        currentCount: 0,
        version: '1.0.2'
    };
}

/**
 * 设置年度目标
 */
function setYearlyGoal(goal) {
    const config = getConfig();
    config.yearlyGoal = goal;
    wx.setStorageSync('appConfig', config);
    triggerSync();
}

/**
 * 重置年度进度
 */
function resetYearlyProgress() {
    const config = getConfig();
    config.currentCount = 0;
    wx.setStorageSync('appConfig', config);
}

/**
 * 更新当前计数
 */
function updateCount() {
    const logs = getAllLogs();
    const config = getConfig();
    const currentYear = new Date().getFullYear();

    // 统计当年的记录数 (基于记录自身的 timestamp)
    const yearLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getFullYear() === currentYear;
    });

    config.currentCount = yearLogs.length;
    wx.setStorageSync('appConfig', config);
}

/**
 * 导出CSV
 */
function exportToCSV() {
    const logs = getAllLogs();
    let csv = '编号,标题,描述,日期,时间戳\n';

    logs.forEach(log => {
        csv += `${log.id},"${log.title || ''}","${log.description || ''}",${log.date},${log.timestamp}\n`;
    });

    return csv;
}

function getHeatmapData() {
    const logs = getAllLogs();
    const heatmapData = {};

    console.log('[DEBUG] getHeatmapData - 总记录数:', logs.length);

    logs.forEach(log => {
        const ts = Number(log.timestamp);
        if (isNaN(ts)) return;

        const d = new Date(ts);
        const dateStr = formatDate(d);

        if (dateStr) {
            if (!heatmapData[dateStr]) {
                heatmapData[dateStr] = 0;
            }
            heatmapData[dateStr]++;
        }
    });

    console.log('[DEBUG] getHeatmapData - 热力图数据:', Object.keys(heatmapData));

    return heatmapData;
}

/**
 * 格式化日期
 * 保持原始签名和逻辑：接收 Date 对象，返回 YYYY-MM-DD
 */
const _pad = (n) => (n < 10 ? '0' + n : n);

function formatDate(date) {
    const year = date.getFullYear();
    const month = _pad(date.getMonth() + 1);
    const day = _pad(date.getDate());
    return `${year}-${month}-${day}`;
}

/**
 * 格式化时间显示
 */
function formatTimeDisplay(timestamp) {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // 规格化到今天凌晨
    const nowTime = now.getTime();

    const targetDate = new Date(timestamp);
    targetDate.setHours(0, 0, 0, 0); // 规格化到目标日期凌晨
    const targetTime = targetDate.getTime();

    const diff = nowTime - targetTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days > 1 && days < 7) return `${days}天前`;
    if (days < 0) {
        // 对于未来的日期显示完整日期
        const d = new Date(timestamp);
        return `${d.getMonth() + 1}月 ${d.getDate()}日`;
    }

    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月 ${date.getDate()}日`;
}

module.exports = {
    getAllLogs,
    addLog,
    updateLog,
    deleteLog,
    clearAllData,
    getConfig,
    setYearlyGoal,
    resetYearlyProgress,
    updateCount,
    exportToCSV,
    getHeatmapData,
    formatDate,
    formatTimeDisplay,
    triggerSync
};
