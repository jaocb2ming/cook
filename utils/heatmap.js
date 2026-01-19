// 热力图数据处理模块

/**
 * 生成热力图网格数据
 * @param {number} year - 年份
 * @param {object} logData - 日志数据 {date: count}
 * @returns {array} 网格数据
 */
function generateHeatmapGrid(year, logData) {
    const now = new Date();

    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();

    const endDate = new Date(todayYear, todayMonth, todayDay);
    const startDate = new Date(todayYear, todayMonth - 4, todayDay);

    console.log('[DEBUG] generateHeatmapGrid - endDate:', endDate.toISOString(), '本地:', endDate.toLocaleDateString());
    console.log('[DEBUG] generateHeatmapGrid - startDate:', startDate.toISOString(), '本地:', startDate.toLocaleDateString());

    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== 1) {
        currentDate.setDate(currentDate.getDate() - 1);
    }
    currentDate.setHours(0, 0, 0, 0);
    console.log('[DEBUG] generateHeatmapGrid - 实际起始日期（周一）:', currentDate.toISOString());

    const allDays = [];
    const tempDate = new Date(currentDate);
    let dayCount = 0;
    let todayFound = false;

    while (tempDate <= endDate) {
        const dateStr = formatDate(tempDate);
        const count = logData[dateStr] || 0;
        const level = getIntensityLevel(count);

        if (dateStr === formatDate(endDate)) {
            todayFound = true;
            console.log('[DEBUG] generateHeatmapGrid - 找到今天:', dateStr, 'count:', count, 'level:', level);
        }

        allDays.push({
            date: dateStr,
            count: count,
            level: level,
            day: tempDate.getDay()
        });

        tempDate.setDate(tempDate.getDate() + 1);
        dayCount++;
    }

    console.log('[DEBUG] generateHeatmapGrid - 总天数:', dayCount, '今天是否在范围内:', todayFound);

    const weeks = [];
    let week = [];

    allDays.forEach(dayData => {
        week.push(dayData);
        if (dayData.day === 0) {
            weeks.push([...week]);
            week = [];
        }
    });

    if (week.length > 0) {
        weeks.push(week);
    }

    console.log('[DEBUG] generateHeatmapGrid - 总周数:', weeks.length);

    const rows = [
        { label: '一', days: [] },
        { label: '二', days: [] },
        { label: '三', days: [] },
        { label: '四', days: [] },
        { label: '五', days: [] },
        { label: '六', days: [] },
        { label: '日', days: [] }
    ];

    weeks.forEach(week => {
        for (let dayIndex = 1; dayIndex <= 7; dayIndex++) {
            const dayData = week.find(d => d.day === (dayIndex % 7));
            if (dayData) {
                rows[dayIndex - 1].days.push(dayData);
            } else {
                // 填充空白格子
                rows[dayIndex - 1].days.push({
                    date: '',
                    count: 0,
                    level: 0,
                    day: dayIndex
                });
            }
        }
    });

    return rows;
}

/**
 * 获取强度等级
 * @param {number} count - 记录数量
 * @returns {number} 0-4的等级
 */
function getIntensityLevel(count) {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    if (count >= 4) return 4;
    return 1;
}

/**
 * 获取月份标签
 * @returns {array} 月份标签数组
 */
function getMonthLabels() {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const labels = [];

    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - 4);

    // 找到起始日期所在周的周一
    let currentDate = new Date(startDate);
    while (currentDate.getDay() !== 1) {
        currentDate.setDate(currentDate.getDate() - 1);
    }

    // 记录每个月第一次出现的位置
    const monthPositions = new Map();
    let weekIndex = 0;
    let lastMonth = -1;

    while (currentDate <= endDate) {
        const month = currentDate.getMonth();

        if (month !== lastMonth && !monthPositions.has(month)) {
            monthPositions.set(month, weekIndex);
            lastMonth = month;
        }

        // 移动到下一周
        currentDate.setDate(currentDate.getDate() + 7);
        weekIndex++;
    }

    // 生成标签数组
    monthPositions.forEach((position, monthIndex) => {
        labels.push({
            label: months[monthIndex],
            month: monthIndex,
            position: position
        });
    });

    return labels;
}

/**
 * 格式化日期
 */
const _pad = (n) => (n < 10 ? '0' + n : n);

function formatDate(date) {
    const year = date.getFullYear();
    const month = _pad(date.getMonth() + 1);
    const day = _pad(date.getDate());
    return `${year}-${month}-${day}`;
}

module.exports = {
    generateHeatmapGrid,
    getIntensityLevel,
    getMonthLabels,
    formatDate
};
