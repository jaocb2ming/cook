// pages/history/history.js
const storage = require('../../utils/storage');

Page({
    data: {
        allLogs: [],
        filteredLogs: [],
        searchQuery: '',
        sortBy: 'date', // date, intensity, duration
        sortOrder: 'desc', // desc, asc
        page: 1,
        pageSize: 20,
        hasMore: true,
        loading: false,
        showSortMenu: false
    },

    onLoad() {
        this.loadData();
    },

    onShow() {
        // Reload data when returning from edit modal
        this.loadData();
    },

    loadData() {
        const logs = storage.getAllLogs();

        // Format logs for display
        const formattedLogs = this.formatLogsForDisplay(logs);

        this.setData({
            allLogs: formattedLogs,
            filteredLogs: formattedLogs.slice(0, this.data.pageSize),
            page: 1,
            hasMore: formattedLogs.length > this.data.pageSize
        });
    },

    formatLogsForDisplay(logs) {
        return logs.map(log => {
            const intensity = log.intensity || 0;

            // 统一的等级判定逻辑
            let level = 1;
            if (intensity >= 4.7) level = 4;
            else if (intensity >= 3.9) level = 3;
            else if (intensity >= 2.6) level = 2;
            else level = 1;

            const date = new Date(log.timestamp);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear();

            const timeDisplay = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${hours}:${minutes}`;

            return {
                ...log,
                intensityLevel: level,
                dateDisplay: storage.formatTimeDisplay(log.timestamp),
                timeDisplay: timeDisplay
            };
        });
    },

    // Search input handler
    onSearchInput(e) {
        const query = e.detail.value.toLowerCase();
        this.setData({ searchQuery: query });

        this.applyFilters();
    },

    // Clear search
    clearSearch() {
        this.setData({ searchQuery: '' });
        this.applyFilters();
    },

    // Toggle sort menu
    toggleSortMenu() {
        this.setData({
            showSortMenu: !this.data.showSortMenu
        });
    },

    // Select sort option
    selectSort(e) {
        const sortBy = e.currentTarget.dataset.sort;
        let sortOrder = 'desc';

        // If clicking the same sort option, toggle order
        if (sortBy === this.data.sortBy) {
            sortOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
        }

        this.setData({
            sortBy: sortBy,
            sortOrder: sortOrder,
            showSortMenu: false
        });

        this.applyFilters();
    },

    // Apply search and sort filters
    applyFilters() {
        let filtered = [...this.data.allLogs];

        // Apply search filter
        if (this.data.searchQuery) {
            filtered = filtered.filter(log => {
                const title = (log.title || '').toLowerCase();
                const notes = log.description && !log.description.startsWith('强度:')
                    ? log.description.toLowerCase()
                    : '';
                return title.includes(this.data.searchQuery) || notes.includes(this.data.searchQuery);
            });
        }

        // Apply sort
        filtered.sort((a, b) => {
            let compareValA, compareValB;

            switch (this.data.sortBy) {
                case 'intensity':
                    compareValA = a.intensity || 0;
                    compareValB = b.intensity || 0;
                    break;
                case 'duration':
                    compareValA = a.duration || 0;
                    compareValB = b.duration || 0;
                    break;
                case 'date':
                default:
                    compareValA = a.timestamp || 0;
                    compareValB = b.timestamp || 0;
                    break;
            }

            if (this.data.sortOrder === 'asc') {
                return compareValA - compareValB;
            } else {
                return compareValB - compareValA;
            }
        });

        // Reset pagination
        this.setData({
            filteredLogs: filtered.slice(0, this.data.pageSize),
            page: 1,
            hasMore: filtered.length > this.data.pageSize
        });
    },

    // Load more records (pagination)
    loadMore() {
        if (this.data.loading || !this.data.hasMore) return;

        this.setData({ loading: true });

        // Get all filtered logs (re-apply filters to get full list)
        let filtered = [...this.data.allLogs];

        if (this.data.searchQuery) {
            filtered = filtered.filter(log => {
                const title = (log.title || '').toLowerCase();
                const notes = log.description && !log.description.startsWith('强度:')
                    ? log.description.toLowerCase()
                    : '';
                return title.includes(this.data.searchQuery) || notes.includes(this.data.searchQuery);
            });
        }

        // Apply sort
        filtered.sort((a, b) => {
            let compareValA, compareValB;

            switch (this.data.sortBy) {
                case 'intensity':
                    compareValA = a.intensity || 0;
                    compareValB = b.intensity || 0;
                    break;
                case 'duration':
                    compareValA = a.duration || 0;
                    compareValB = b.duration || 0;
                    break;
                case 'date':
                default:
                    compareValA = a.timestamp || 0;
                    compareValB = b.timestamp || 0;
                    break;
            }

            if (this.data.sortOrder === 'asc') {
                return compareValA - compareValB;
            } else {
                return compareValB - compareValA;
            }
        });

        const nextPage = this.data.page + 1;
        const startIdx = this.data.page * this.data.pageSize;
        const newLogs = filtered.slice(startIdx, startIdx + this.data.pageSize);

        this.setData({
            filteredLogs: [...this.data.filteredLogs, ...newLogs],
            page: nextPage,
            hasMore: startIdx + this.data.pageSize < filtered.length,
            loading: false
        });
    },

    // Pull to refresh
    onPullDownRefresh() {
        this.loadData();
        wx.stopPullDownRefresh();
    },

    // Edit log - navigate back to index with log id
    editLog(e) {
        const id = e.currentTarget.dataset.id;
        // Navigate back to index and pass the log id
        wx.navigateBack({
            success: () => {
                // Use event channel or global data to pass the log id
                const pages = getCurrentPages();
                const indexPage = pages[pages.length - 1];
                if (indexPage && indexPage.editLogFromHistory) {
                    indexPage.editLogFromHistory(id);
                }
            },
            fail: () => {
                // If can't navigate back, redirect to index
                wx.redirectTo({
                    url: `/pages/index/index?editId=${id}`
                });
            }
        });
    },

    // Go back to index
    goBack() {
        wx.navigateBack();
    }
});
