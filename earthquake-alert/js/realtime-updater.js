// 实时数据更新模块
class RealtimeUpdater {
    constructor(appInstance, config) {
        this.app = appInstance; // 主应用实例引用
        this.config = config || window.config;
        this.updateInterval = null;
        this.smoothUpdateFrame = null;
        this.updateErrors = 0;
        this.maxUpdateErrors = 5;
        this.isUpdating = false;
        this.isReducedFrequency = false;
        this.shouldRestartUpdatesOnConnection = false;
    }
    
    // 启动实时更新机制
    start() {
        console.log('启动增强型实时数据更新...');
        
        // 清除可能存在的旧间隔
        this.stop();
        
        // 重置状态
        this.updateErrors = 0;
        this.isUpdating = false;
        this.isReducedFrequency = false;
        
        // 设置主要更新间隔
        this.updateInterval = setInterval(() => {
            if (!this.isUpdating) {
                this.performUpdate();
            }
        }, this.config.api.updateIntervalMs);
        
        // 设置平滑更新调度
        this.setupSmoothUpdates();
        
        // 设置网络和可见性监听
        this.setupEventListeners();
        
        // 更新状态指示器
        this.updateStatusIndicator('online');
        
        console.log(`实时更新已启动，间隔: ${this.config.api.updateIntervalMs / 1000}秒`);
    }
    
    // 停止实时更新
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.smoothUpdateFrame) {
            cancelAnimationFrame(this.smoothUpdateFrame);
            this.smoothUpdateFrame = null;
        }
        
        // 移除事件监听
        this.removeEventListeners();
        
        console.log('实时更新已停止');
    }
    
    // 设置平滑更新调度
    setupSmoothUpdates() {
        if (this.smoothUpdateFrame) {
            cancelAnimationFrame(this.smoothUpdateFrame);
        }
        
        // 计算下次更新时间
        const lastUpdate = this.app.lastUpdateTime || 0;
        const nextUpdateTime = lastUpdate + this.config.api.updateIntervalMs;
        const now = Date.now();
        const timeUntilUpdate = Math.max(0, nextUpdateTime - now);
        
        // 使用setTimeout延迟，然后用requestAnimationFrame确保UI流畅
        setTimeout(() => {
            this.smoothUpdateFrame = requestAnimationFrame(() => {
                if (!this.isUpdating && this.updateInterval) {
                    this.performUpdate();
                }
                this.setupSmoothUpdates(); // 递归调度下一次
            });
        }, timeUntilUpdate);
    }
    
    // 设置事件监听器
    setupEventListeners() {
        window.addEventListener('online', this.handleNetworkChange.bind(this));
        window.addEventListener('offline', this.handleNetworkChange.bind(this));
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    // 移除事件监听器
    removeEventListeners() {
        window.removeEventListener('online', this.handleNetworkChange.bind(this));
        window.removeEventListener('offline', this.handleNetworkChange.bind(this));
        document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
    
    // 执行数据更新
    async performUpdate() {
        if (this.isUpdating) {
            console.log('更新已在进行中，跳过此次请求');
            return;
        }
        
        this.isUpdating = true;
        
        try {
            // 更新状态指示器
            this.updateStatusIndicator('updating');
            
            console.log(`开始数据更新... (${new Date().toLocaleTimeString()})`);
            
            // 使用Promise.allSettled确保一个API失败不影响另一个
            const results = await Promise.allSettled([
                this.app.quakeAPI.fetchJMAData(),
                this.app.quakeAPI.fetchNIEDData()
            ]);
            
            // 处理结果
            let jmaData = [];
            let niedData = [];
            
            if (results[0].status === 'fulfilled') {
                jmaData = results[0].value;
            } else {
                console.warn('JMA API数据获取失败:', results[0].reason);
            }
            
            if (results[1].status === 'fulfilled') {
                niedData = results[1].value;
            } else {
                console.warn('NIED API数据获取失败:', results[1].reason);
            }
            
            // 合并并处理数据
            const mergedData = this.app.mergeAndSortQuakeData([...jmaData, ...niedData]);
            
            // 检查是否获取到有效数据
            if (mergedData.length === 0) {
                throw new Error('未能从任何API获取到有效数据');
            }
            
            // 检查新地震
            const newEarthquakes = this.app.findNewEarthquakes(mergedData);
            
            // 清理旧数据并更新
            const cleanedData = this.cleanupOldEarthquakes(mergedData);
            this.app.earthquakes = cleanedData.slice(0, this.config.data.maxDisplay);
            
            // 更新UI
            this.app.updateMapMarkers();
            this.app.updateQuakeList();
            
            // 更新最后更新时间
            this.app.lastUpdateTime = Date.now();
            
            // 对新地震执行动画
            if (newEarthquakes.length > 0) {
                this.app.handleNewEarthquakes(newEarthquakes);
            }
            
            // 重置错误计数
            this.updateErrors = 0;
            
            // 更新状态指示器
            this.updateStatusIndicator('online');
            
            console.log(`数据更新成功，获取 ${this.app.earthquakes.length} 条记录，新增 ${newEarthquakes.length} 条`);
            
        } catch (error) {
            console.error('刷新数据失败:', error);
            
            // 增加错误计数
            this.updateErrors++;
            
            // 更新状态指示器
            this.updateStatusIndicator('error');
            
            // 根据错误次数处理
            if (this.updateErrors >= this.maxUpdateErrors) {
                this.app.showNotification(`数据更新连续失败${this.updateErrors}次，将尝试恢复连接`, 'error');
                this.recoverConnection();
            }
            
        } finally {
            this.isUpdating = false;
        }
    }
    
    // 清理旧地震数据
    cleanupOldEarthquakes(quakeData) {
        // 保留最近24小时的数据
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        
        return quakeData.filter(quake => {
            const quakeTime = new Date(quake.time).getTime();
            return quakeTime > twentyFourHoursAgo;
        });
    }
    
    // 恢复连接
    recoverConnection() {
        console.log('开始连接恢复过程...');
        
        // 停止当前更新
        this.stop();
        
        // 30秒后重新启动
        setTimeout(() => {
            console.log('重新启动数据更新...');
            this.start();
            this.updateErrors = 0;
        }, 30000);
    }
    
    // 处理网络状态变化
    handleNetworkChange() {
        if (navigator.onLine) {
            console.log('网络连接已恢复');
            this.app.showNotification('网络已连接，正在恢复数据更新', 'info');
            
            if (this.shouldRestartUpdatesOnConnection) {
                this.shouldRestartUpdatesOnConnection = false;
                this.start();
                this.performUpdate(); // 立即更新
            }
            
            this.updateStatusIndicator('online');
        } else {
            console.log('网络连接已断开');
            this.app.showNotification('网络连接已断开，将使用缓存数据', 'warning');
            
            this.shouldRestartUpdatesOnConnection = true;
            this.reduceUpdateFrequency();
            
            this.updateStatusIndicator('offline');
        }
    }
    
    // 处理页面可见性变化
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('页面已隐藏，降低更新频率');
            this.reduceUpdateFrequency();
        } else {
            console.log('页面已显示，恢复正常更新频率');
            this.restoreNormalFrequency();
            this.performUpdate(); // 立即更新
        }
    }
    
    // 降低更新频率
    reduceUpdateFrequency() {
        if (this.isReducedFrequency || !this.updateInterval) return;
        
        clearInterval(this.updateInterval);
        
        // 设置为正常频率的1/4
        const reducedInterval = this.config.api.updateIntervalMs * 4;
        this.updateInterval = setInterval(() => {
            if (!this.isUpdating) {
                this.performUpdate();
            }
        }, reducedInterval);
        
        this.isReducedFrequency = true;
        console.log(`已降低更新频率至: ${reducedInterval / 1000}秒`);
    }
    
    // 恢复正常更新频率
    restoreNormalFrequency() {
        if (!this.isReducedFrequency || !this.updateInterval) return;
        
        clearInterval(this.updateInterval);
        
        // 恢复正常频率
        this.updateInterval = setInterval(() => {
            if (!this.isUpdating) {
                this.performUpdate();
            }
        }, this.config.api.updateIntervalMs);
        
        this.isReducedFrequency = false;
        console.log(`已恢复正常更新频率: ${this.config.api.updateIntervalMs / 1000}秒`);
    }
    
    // 更新状态指示器
    updateStatusIndicator(status) {
        let indicator = document.querySelector('.connection-status-indicator');
        if (!indicator) {
            // 创建状态指示器
            indicator = document.createElement('div');
            indicator.className = 'connection-status-indicator';
            indicator.style.position = 'fixed';
            indicator.style.bottom = '10px';
            indicator.style.right = '10px';
            indicator.style.padding = '6px 12px';
            indicator.style.borderRadius = '4px';
            indicator.style.fontSize = '12px';
            indicator.style.zIndex = '1000';
            indicator.style.transition = 'all 0.3s ease';
            document.body.appendChild(indicator);
        }
        
        // 设置状态样式和文本
        switch (status) {
            case 'online':
                indicator.style.backgroundColor = 'rgba(46, 204, 113, 0.9)';
                indicator.style.color = 'white';
                indicator.textContent = `在线 · 最后更新: ${this.formatUpdateTime()}`;
                break;
            case 'offline':
                indicator.style.backgroundColor = 'rgba(231, 76, 60, 0.9)';
                indicator.style.color = 'white';
                indicator.textContent = '离线 · 使用缓存数据';
                break;
            case 'updating':
                indicator.style.backgroundColor = 'rgba(52, 152, 219, 0.9)';
                indicator.style.color = 'white';
                indicator.textContent = '正在更新...';
                break;
            case 'error':
                indicator.style.backgroundColor = 'rgba(241, 196, 15, 0.9)';
                indicator.style.color = 'black';
                indicator.textContent = '更新失败 · 将重试';
                break;
        }
    }
    
    // 格式化更新时间
    formatUpdateTime() {
        const lastUpdate = this.app.lastUpdateTime || 0;
        if (!lastUpdate) return '从未';
        
        const date = new Date(lastUpdate);
        const now = new Date();
        const diffSeconds = Math.floor((now - date) / 1000);
        
        if (diffSeconds < 60) {
            return `${diffSeconds}秒前`;
        } else if (diffSeconds < 3600) {
            return `${Math.floor(diffSeconds / 60)}分钟前`;
        } else {
            return date.toLocaleTimeString();
        }
    }
}

// 创建单例实例
let realtimeUpdaterInstance = null;

// 初始化实时更新器
export function initRealtimeUpdater(appInstance, config) {
    if (!realtimeUpdaterInstance) {
        realtimeUpdaterInstance = new RealtimeUpdater(appInstance, config);
    }
    return realtimeUpdaterInstance;
}

// 获取实时更新器实例
export function getRealtimeUpdater() {
    return realtimeUpdaterInstance;
}
