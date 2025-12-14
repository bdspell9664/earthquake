// 地震速报主应用模块
class EarthquakeApp {
    constructor() {
        this.config = window.config;
        this.quakeAPI = null;
        this.quakeMap = null;
        this.animationManager = null;
        this.quakeSimulation = null;
        // 语言管理器 - 从window或创建新实例
        this.languageManager = window.languageManagerInstance || new LanguageManager(this.config);
        this.realtimeUpdater = null; // 实时更新器
        this.earthquakes = [];
        this.updateInterval = null;
        this.lastUpdateTime = 0;
        this.isInitialized = false;
        
        // 初始化应用
        this.init();
    }
    
    // 初始化应用
    async init() {
        if (this.isInitialized) return;
        
        try {
            console.log('开始初始化地震速报应用...');
            
            // 初始化API模块
            this.quakeAPI = new EarthquakeAPI(this.config);
            
            // 初始化地图模块
            const mapElement = document.getElementById('earthquakeMap');
            if (!mapElement) {
                throw new Error('地图元素未找到');
            }
            this.quakeMap = new EarthquakeMap(mapElement, this.config);
            
            // 初始化动画模块
            this.animationManager = new AnimationManager(this.config.animation);
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 更新UI文本为当前语言
            this.updateUIText();
            
            // 加载初始地震数据
            await this.loadInitialData();
            
            // 启动实时更新
            this.startRealTimeUpdates();
            
            // 初始化模拟模块
            this.initSimulation();
            
            // 更新当前时间显示
            this.updateCurrentTime();
            setInterval(() => {
                this.updateCurrentTime();
            }, 1000);
            
            this.isInitialized = true;
            console.log('地震速报应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('应用初始化失败，请刷新页面重试。');
        }
    }
    
    // 初始化模拟模块
    initSimulation() {
        // 检查是否有模拟模块
        if (typeof initSimulation === 'function') {
            this.quakeSimulation = initSimulation(this.quakeMap, this.animationManager);
        }
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 监听模拟地震创建事件
        document.addEventListener('simulationQuakeCreated', (event) => {
            const simulatedQuake = event.detail;
            this.addEarthquake(simulatedQuake);
        });
        
        // 监听地图点击事件
        const mapElement = document.getElementById('earthquakeMap');
        if (mapElement) {
            mapElement.addEventListener('click', (event) => {
                // 点击地图标记时的处理
                const marker = event.target.closest('.earthquake-marker-container');
                if (marker) {
                    const quakeId = marker.dataset.id;
                    if (quakeId) {
                        this.showQuakeDetails(quakeId);
                    }
                }
            });
        }
        
        // 监听列表项点击事件
        const quakeList = document.querySelector('.quake-list');
        if (quakeList) {
            quakeList.addEventListener('click', (event) => {
                const listItem = event.target.closest('.quake-item');
                if (listItem) {
                    const quakeId = listItem.dataset.quakeId;
                    if (quakeId) {
                        this.showQuakeDetails(quakeId);
                    }
                }
            });
        }
        
        // 监听手动刷新按钮
        const refreshButton = document.getElementById('refreshButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshData();
            });
        }
        
        // 监听语言切换事件
        const langButtons = document.querySelectorAll('.language-selector button');
        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                const langCode = button.dataset.lang;
                this.changeLanguage(langCode);
            });
        });
        
        // 设置地震模拟切换
        const simulationToggle = document.getElementById('simulationToggle');
        if (simulationToggle) {
            simulationToggle.addEventListener('change', () => {
                if (this.quakeSimulation && this.quakeSimulation.toggleSimulation) {
                    const isActive = this.quakeSimulation.toggleSimulation();
                    this.updateSimulationStatus(isActive);
                }
            });
        }
        
        // 设置模拟速度控制
        const simulationSpeed = document.getElementById('simulationSpeed');
        if (simulationSpeed) {
            simulationSpeed.addEventListener('input', () => {
                const speed = simulationSpeed.value * 1000; // 转换为毫秒
                if (this.quakeSimulation && this.quakeSimulation.setSpeed) {
                    this.quakeSimulation.setSpeed(speed);
                }
                const speedValue = document.getElementById('simulationSpeedValue');
                if (speedValue) {
                    speedValue.textContent = `${simulationSpeed.value}秒`;
                }
            });
        }
        
        // 设置手动触发模拟地震按钮
        const manualQuakeButton = document.getElementById('manualQuakeButton');
        if (manualQuakeButton) {
            manualQuakeButton.addEventListener('click', () => {
                if (this.quakeSimulation && this.quakeSimulation.triggerEarthquake) {
                    this.quakeSimulation.triggerEarthquake();
                }
            });
        }
    }
    
    // 加载初始数据
    async loadInitialData() {
        try {
            // 显示加载状态
            this.showLoading('加载初始数据...');
            
            // 从API获取数据
            const data = await this.quakeAPI.getEarthquakeList(true);
            
            // 更新本地数据
            this.earthquakes = data.slice(0, this.config.data.maxDisplay);
            
            // 更新UI
            this.updateMapMarkers();
            this.updateQuakeList();
            
            // 更新最后更新时间
            this.lastUpdateTime = Date.now();
            this.updateLastUpdateTime();
            
            console.log(`已加载 ${this.earthquakes.length} 条地震数据`);
        } catch (error) {
            console.error('加载初始数据失败:', error);
            // 尝试使用缓存或模拟数据
            this.loadFallbackData();
        } finally {
            // 隐藏加载状态
            this.hideLoading();
        }
    }
    
    // 加载备选数据（当API失败时）
    loadFallbackData() {
        console.log('使用备选数据...');
        
        // 生成一些模拟数据
        const mockData = [
            {
                id: `mock_1`,
                time: new Date(Date.now() - 3600000).toISOString(),
                location: '福岛県冲',
                locationZh: '福岛县近海',
                locationOriginal: '福岛県冲',
                magnitude: 5.2,
                depth: 45,
                lat: 37.5,
                lng: 141.5,
                intensity: 3.5,
                source: '模拟'
            },
            {
                id: `mock_2`,
                time: new Date(Date.now() - 7200000).toISOString(),
                location: '东京都',
                locationZh: '东京都',
                locationOriginal: '东京都',
                magnitude: 3.8,
                depth: 30,
                lat: 35.6,
                lng: 139.8,
                intensity: 2.0,
                source: '模拟'
            },
            {
                id: `mock_3`,
                time: new Date(Date.now() - 10800000).toISOString(),
                location: '伊豆诸岛近海',
                locationZh: '伊豆群岛近海',
                locationOriginal: '伊豆诸岛近海',
                magnitude: 4.5,
                depth: 50,
                lat: 34.0,
                lng: 139.0,
                intensity: 2.5,
                source: '模拟'
            }
        ];
        
        // 更新本地数据
        this.earthquakes = mockData;
        
        // 更新UI
        this.updateMapMarkers();
        this.updateQuakeList();
        
        // 更新最后更新时间
        this.lastUpdateTime = Date.now();
        this.updateLastUpdateTime();
        
        // 显示提示
        this.showNotification('使用离线数据模式，数据仅供参考', 'warning');
    }
    
    // 启动实时更新
    startRealTimeUpdates() {
        // 检查是否已存在更新定时器
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // 设置新的更新定时器
        this.updateInterval = setInterval(async () => {
            await this.refreshData(false); // 静默刷新，不显示加载状态
        }, this.config.data.refreshInterval);
        
        console.log(`已启动实时更新，间隔: ${this.config.data.refreshInterval / 1000}秒`);
    }
    
    // 停止实时更新
    stopRealTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        console.log('已停止实时更新');
    }
    
    // 手动刷新数据
    async refreshData(showLoading = true) {
        try {
            // 显示加载状态
            if (showLoading) {
                this.showLoading('刷新数据...');
            }
            
            // 获取最新数据
            const newData = await this.quakeAPI.getEarthquakeList(true);
            
            // 检查是否获取到有效数据
            if (!newData || newData.length === 0) {
                throw new Error('未能从API获取到有效数据');
            }
            
            // 检查新地震
            const newEarthquakes = this.findNewEarthquakes(newData);
            
            // 更新本地数据
            this.earthquakes = newData.slice(0, this.config.data.maxDisplay);
            
            // 更新UI
            this.updateMapMarkers();
            this.updateQuakeList();
            
            // 更新最后更新时间
            this.lastUpdateTime = Date.now();
            this.updateLastUpdateTime();
            
            // 对新地震执行动画
            if (newEarthquakes.length > 0) {
                this.handleNewEarthquakes(newEarthquakes);
            }
            
            console.log(`已刷新数据，获取 ${this.earthquakes.length} 条记录，新增 ${newEarthquakes.length} 条`);
        } catch (error) {
            console.error('刷新数据失败:', error);
            if (showLoading) {
                this.showNotification('刷新数据失败，将继续使用当前数据', 'error');
            }
        } finally {
            // 隐藏加载状态
            this.hideLoading();
        }
    }
    
    // 合并并排序地震数据
    mergeAndSortQuakeData(quakeArray) {
        // 去重（基于ID）
        const uniqueQuakes = {};
        quakeArray.forEach(quake => {
            if (!uniqueQuakes[quake.id]) {
                uniqueQuakes[quake.id] = quake;
            }
        });
        
        // 转换为数组
        const quakes = Object.values(uniqueQuakes);
        
        // 按时间排序（最新的在前）
        quakes.sort((a, b) => {
            return new Date(b.time) - new Date(a.time);
        });
        
        return quakes;
    }
    
    // 查找新地震
    findNewEarthquakes(newQuakeData) {
        const newQuakes = [];
        
        // 检查每个新地震是否已经存在
        newQuakeData.forEach(quake => {
            const exists = this.earthquakes.some(q => q.id === quake.id);
            if (!exists) {
                newQuakes.push(quake);
            }
        });
        
        return newQuakes;
    }
    
    // 处理新地震
    handleNewEarthquakes(newQuakes) {
        // 对每个新地震执行动画
        newQuakes.forEach(quake => {
            // 重要地震（震级大于等于5.0）显示特殊动画
            if (quake.magnitude >= 5.0) {
                this.handleMajorQuake(quake);
            } else {
                this.handleMinorQuake(quake);
            }
        });
    }
    
    // 处理重要地震
    handleMajorQuake(quake) {
        // 显示警报动画
        if (this.animationManager && this.animationManager.triggerMajorQuakeAnimation) {
            this.animationManager.triggerMajorQuakeAnimation(quake);
        }
        
        // 聚焦到地震位置
        if (this.quakeMap) {
            setTimeout(() => {
                this.quakeMap.focus(quake.lat, quake.lng, 3);
            }, 500);
        }
        
        // 格式化地震信息（多语言）
        const formattedInfo = this.languageManager.formatEarthquakeInfo(quake);
        
        // 显示通知
        this.showNotification(
            `重要地震: ${formattedInfo.translated.location} (${formattedInfo.translated.magnitude})`,
            'alert'
        );
    }
    
    // 处理小型地震
    handleMinorQuake(quake) {
        // 显示小型地震动画
        if (this.animationManager && this.animationManager.triggerMinorQuakeAnimation) {
            this.animationManager.triggerMinorQuakeAnimation(quake);
        }
    }
    
    // 添加地震（用于模拟）
    addEarthquake(quake) {
        console.log('添加地震:', quake);
        
        // 为模拟地震添加特殊标记
        if (quake.type === 'simulation') {
            quake.isSimulated = true;
            
            // 创建特殊的通知
            const message = quake.type === 'simulation' ? 
                `模拟地震: ${quake.location || quake.name} M${quake.magnitude}` : 
                `${quake.location || quake.name} M${quake.magnitude}`;
            
            this.showNotification(message, 'simulation');
        }
        
        // 添加到数据数组前面
        this.earthquakes.unshift(quake);
        
        // 限制数量
        if (this.earthquakes.length > this.config.data.maxDisplay) {
            this.earthquakes = this.earthquakes.slice(0, this.config.data.maxDisplay);
        }
        
        // 更新UI
        this.updateMapMarkers();
        this.updateQuakeList();
        
        // 根据震级显示相应的动画
        if (this.animationManager) {
            if (quake.magnitude >= 7.0) {
                this.animationManager.triggerMajorQuakeAnimation(quake);
            } else if (quake.magnitude >= 5.0) {
                this.animationManager.triggerModerateQuakeAnimation(quake);
            } else {
                this.animationManager.triggerMinorQuakeAnimation(quake);
            }
        }
    }
    
    // 更新地图标记
    updateMapMarkers() {
        // 清除现有的所有标记
        if (this.quakeMap && this.quakeMap.clearMarkers) {
            this.quakeMap.clearMarkers();
        }
        
        // 添加所有地震标记
        if (this.quakeMap && this.quakeMap.addMarker) {
            this.earthquakes.forEach(quake => {
                this.quakeMap.addMarker(quake);
            });
        }
    }
    
    // 更新地震列表
    updateQuakeList() {
        const listElement = document.getElementById('quakeList');
        if (!listElement) return;
        
        // 清空列表
        listElement.innerHTML = '';
        
        // 如果没有数据，显示空状态
        if (this.earthquakes.length === 0) {
            listElement.innerHTML = '<div class="loading">暂无地震数据</div>';
            return;
        }
        
        // 添加列表项
        this.earthquakes.forEach(quake => {
            const listItem = this.createQuakeListItem(quake);
            listElement.appendChild(listItem);
        });
    }
    
    // 创建地震列表项
    createQuakeListItem(quake) {
        const item = document.createElement('div');
        item.className = 'quake-item';
        item.dataset.quakeId = quake.id;
        
        // 设置样式（根据震级）
        const magnitude = quake.magnitude;
        if (magnitude >= 6.0) {
            item.classList.add('major-quake');
        } else if (magnitude >= 4.0) {
            item.classList.add('moderate-quake');
        }
        
        // 格式化地震信息（多语言）
        const formattedInfo = this.languageManager.formatEarthquakeInfo(quake);
        
        // 设置内容
        item.innerHTML = `
            <div class="quake-time">${formattedInfo.translated.time}</div>
            <div class="quake-location">
                <div class="location-translated">${formattedInfo.translated.location}</div>
                <div class="location-original">${formattedInfo.original.location}</div>
            </div>
            <div class="quake-details">
                <span class="quake-magnitude">${formattedInfo.translated.magnitude}</span>
                <span class="quake-depth">深度 ${formattedInfo.translated.depth}</span>
            </div>
            <div class="quake-source">${quake.source}</div>
        `;
        
        return item;
    }
    
    // 格式化时间
    formatTime(timeString) {
        const date = new Date(timeString);
        const now = new Date();
        const diffMs = now - date;
        
        // 小于1分钟
        if (diffMs < 60000) {
            return `${Math.floor(diffMs / 1000)}秒前`;
        }
        
        // 小于1小时
        if (diffMs < 3600000) {
            return `${Math.floor(diffMs / 60000)}分钟前`;
        }
        
        // 小于24小时
        if (diffMs < 86400000) {
            return `${Math.floor(diffMs / 3600000)}小时前`;
        }
        
        // 大于等于1天，显示日期
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}`;
    }
    
    // 显示地震详情
    showQuakeDetails(quakeId) {
        const quake = this.earthquakes.find(q => q.id === quakeId);
        if (!quake) return;
        
        // 格式化地震信息（多语言）
        const formattedInfo = this.languageManager.formatEarthquakeInfo(quake);
        
        // 创建详情面板
        const detailPanel = document.createElement('div');
        detailPanel.className = 'quake-detail-panel';
        detailPanel.innerHTML = `
            <div class="detail-header">
                <h3>地震详情</h3>
                <button class="close-detail" id="closeDetail">×</button>
            </div>
            <div class="detail-content">
                <div class="detail-row">
                    <span class="detail-label">时间:</span>
                    <span class="detail-value">${formattedInfo.original.time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">位置:</span>
                    <span class="detail-value">${formattedInfo.translated.location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">原始位置:</span>
                    <span class="detail-value">${formattedInfo.original.location}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">震级:</span>
                    <span class="detail-value">${formattedInfo.translated.magnitude}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">深度:</span>
                    <span class="detail-value">${formattedInfo.translated.depth}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">震度:</span>
                    <span class="detail-value">${formattedInfo.translated.intensity || '未知'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">坐标:</span>
                    <span class="detail-value">${quake.lat.toFixed(4)}, ${quake.lng.toFixed(4)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">来源:</span>
                    <span class="detail-value">${quake.source}</span>
                </div>
            </div>
            <div class="detail-actions">
                <button class="focus-map" id="focusMapBtn">聚焦到地图</button>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(detailPanel);
        
        // 显示面板
        setTimeout(() => {
            detailPanel.classList.add('active');
        }, 10);
        
        // 绑定关闭事件
        const closeBtn = detailPanel.querySelector('#closeDetail');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                detailPanel.classList.remove('active');
                setTimeout(() => {
                    if (document.body.contains(detailPanel)) {
                        document.body.removeChild(detailPanel);
                    }
                }, 300);
            });
        }
        
        // 绑定聚焦地图事件
        const focusBtn = detailPanel.querySelector('#focusMapBtn');
        if (focusBtn && this.quakeMap) {
            focusBtn.addEventListener('click', () => {
                this.quakeMap.focus(quake.lat, quake.lng, 3);
            });
        }
        
        // 点击外部关闭
        detailPanel.addEventListener('click', (event) => {
            if (event.target === detailPanel) {
                detailPanel.classList.remove('active');
                setTimeout(() => {
                    if (document.body.contains(detailPanel)) {
                        document.body.removeChild(detailPanel);
                    }
                }, 300);
            }
        });
    }
    
    // 更新最后更新时间
    updateLastUpdateTime() {
        const element = document.getElementById('lastUpdate');
        if (!element) return;
        
        const time = new Date(this.lastUpdateTime);
        const hours = String(time.getHours()).padStart(2, '0');
        const minutes = String(time.getMinutes()).padStart(2, '0');
        const seconds = String(time.getSeconds()).padStart(2, '0');
        
        element.textContent = `最后更新: ${hours}:${minutes}:${seconds}`;
    }
    
    // 更新当前时间
    updateCurrentTime() {
        const element = document.getElementById('currentTime');
        if (!element) return;
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        element.textContent = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }
    
    // 切换语言
    changeLanguage(languageCode) {
        if (this.languageManager.setLanguage(languageCode)) {
            console.log(`语言已切换为: ${languageCode}`);
            
            // 更新UI
            this.updateUIWithNewLanguage();
            
            // 显示通知
            this.showNotification(`语言已切换为: ${languageCode === 'zh' ? '中文' : languageCode === 'ja' ? '日本語' : 'English'}`, 'info');
        }
    }
    
    // 使用新语言更新UI
    updateUIWithNewLanguage() {
        // 更新地震列表
        this.updateQuakeList();
        
        // 更新地图上的标记和文本
        if (this.quakeMap && this.quakeMap.updateLabels) {
            this.quakeMap.updateLabels();
        }
    }
    
    // 更新模拟状态显示
    updateSimulationStatus(enabled) {
        const statusElement = document.getElementById('simulationStatus');
        if (statusElement) {
            statusElement.textContent = enabled ? '地震模拟已启用' : '地震模拟已禁用';
        }
    }
    
    // 显示加载状态
    showLoading(message) {
        let loader = document.getElementById('dataLoader');
        
        if (!loader) {
            // 创建加载器
            loader = document.createElement('div');
            loader.id = 'dataLoader';
            loader.className = 'loader';
            loader.innerHTML = `
                <div class="loader-spinner"></div>
                <div class="loader-text"></div>
            `;
            document.body.appendChild(loader);
        }
        
        // 更新消息
        loader.querySelector('.loader-text').textContent = message || '加载中...';
        
        // 显示加载器
        loader.classList.add('active');
    }
    
    // 隐藏加载状态
    hideLoading() {
        const loader = document.getElementById('dataLoader');
        if (loader) {
            loader.classList.remove('active');
        }
    }
    
    // 显示通知
    showNotification(message, type = 'info') {
        const notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 为模拟地震添加特殊样式
        if (type === 'simulation') {
            notification.classList.add('notification-simulation');
        }
        
        // 添加到页面
        notificationContainer.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('active');
        }, 10);
        
        // 点击关闭
        notification.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // 模拟地震通知显示时间更长
        const duration = type === 'simulation' ? 7000 : 5000;
        
        // 自动消失
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }
    
    // 移除通知
    removeNotification(notification) {
        notification.classList.remove('active');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    // 显示错误信息
    showError(error) {
        this.showNotification(error, 'error');
    }
    
    // 清理资源
    cleanup() {
        // 停止更新
        this.stopRealTimeUpdates();
        
        // 清理地图
        if (this.quakeMap && this.quakeMap.cleanup) {
            this.quakeMap.cleanup();
        }
        
        // 清理动画
        if (this.animationManager && this.animationManager.cleanup) {
            this.animationManager.cleanup();
        }
        
        // 清理模拟
        if (this.quakeSimulation && this.quakeSimulation.stopSimulation) {
            this.quakeSimulation.stopSimulation();
        }
    }
}

// 当文档加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 确保config已加载
    if (window.config) {
        // 初始化应用
        const app = new EarthquakeApp();
        window.earthquakeApp = app;
    } else {
        // 延迟初始化，等待config加载
        setTimeout(() => {
            if (window.config) {
                const app = new EarthquakeApp();
                window.earthquakeApp = app;
            } else {
                console.error('配置文件加载失败');
                alert('应用配置加载失败，请刷新页面重试。');
            }
        }, 500);
    }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (window.earthquakeApp) {
        window.earthquakeApp.cleanup();
    }
});