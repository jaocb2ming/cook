const SUPABASE_URL = 'https://eqhzpnbihkjjbwzdxnow.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxaHpwbmJpaGtqamJ3emR4bm93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDY3MzQsImV4cCI6MjA4NDEyMjczNH0.-jfRdIWhNZzaS85CpXkApdzspN9WGtdlYMCpCwd7NBg';

/**
 * 生成随机同步码 (UUID v4)
 */
function generateSyncKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 上传数据到云端
 * @param {string} syncKey - 同步码
 * @param {Array} logs - 做饭记录数组
 * @param {Object} config - 配置对象 (包含 yearlyGoal)
 * @param {Function} onSuccess - 成功回调
 * @param {Function} onFail - 失败回调
 */
function uploadData(syncKey, logs, config, onSuccess, onFail) {
  if (!syncKey) {
    console.warn('[Supabase] syncKey is empty, skip upload');
    return;
  }

  const data = {
    id: syncKey,
    logs: logs,
    config: config,
    updated_at: new Date().toISOString()
  };

  wx.request({
    url: `${SUPABASE_URL}/rest/v1/user_backups`,
    method: 'POST',
    header: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    data: data,
    success: (res) => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('[Supabase] Upload success');
        if (onSuccess) onSuccess(res.data);
      } else {
        console.error('[Supabase] Upload failed:', res.statusCode, res.data);
        if (onFail) onFail(res.data);
      }
    },
    fail: (err) => {
      console.error('[Supabase] Upload request failed:', err);
      if (onFail) onFail(err);
    }
  });
}

/**
 * 从云端下载数据
 * @param {string} syncKey - 同步码
 * @param {Function} onSuccess - 成功回调，参数为 { logs, config }
 * @param {Function} onFail - 失败回调
 */
function downloadData(syncKey, onSuccess, onFail) {
  if (!syncKey) {
    if (onFail) onFail({ message: 'syncKey is empty' });
    return;
  }

  wx.request({
    url: `${SUPABASE_URL}/rest/v1/user_backups`,
    method: 'GET',
    header: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    data: {
      id: `eq.${syncKey}`,
      select: 'logs,config,updated_at'
    },
    success: (res) => {
      if (res.statusCode === 200) {
        const data = res.data;
        if (data && data.length > 0) {
          const backup = data[0];
          console.log('[Supabase] Download success');
          if (onSuccess) onSuccess({
            logs: backup.logs || [],
            config: backup.config || {},
            updatedAt: backup.updated_at
          });
        } else {
          console.log('[Supabase] No data found for this syncKey');
          if (onFail) onFail({ message: 'No data found' });
        }
      } else {
        console.error('[Supabase] Download failed:', res.statusCode, res.data);
        if (onFail) onFail(res.data);
      }
    },
    fail: (err) => {
      console.error('[Supabase] Download request failed:', err);
      if (onFail) onFail(err);
    }
  });
}

/**
 * 静默上传（不显示任何提示，用于自动同步）
 * @param {string} syncKey - 同步码
 * @param {Array} logs - 做饭记录数组
 * @param {Object} config - 配置对象
 */
function silentUpload(syncKey, logs, config) {
  uploadData(syncKey, logs, config, null, null);
}

module.exports = {
  generateSyncKey,
  uploadData,
  downloadData,
  silentUpload
};
