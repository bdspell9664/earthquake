// API处理模块
class EarthquakeAPI {
    constructor(config) {
        this.config = config;
        this.cache = {
            data: null,
            timestamp: 0,
            lastQuakeId: null
        };
        this.isFetching = false;
        this.updateInterval = null;
        this.listeners = [];
        this.retryCount = 0;
        
        // 初始化实时更新
        this.initRealtimeUpdates();
    }
    
    // 初始化实时更新
    initRealtimeUpdates() {
        // 启动实时更新定时器
        this.updateInterval = setInterval(async () => {
            try {
                await this.fetchAndBroadcastUpdates();
                this.retryCount = 0; // 重置重试计数
            } catch (error) {
                this.retryCount++;
                console.error(`实时更新失败 (${this.retryCount}/${this.config.api.jma_quake.retryAttempts}):`, error);
                
                // 如果重试次数超过限制，使用模拟数据
                if (this.retryCount >= this.config.api.jma_quake.retryAttempts) {
                    console.warn('重试次数超过限制，使用模拟数据');
                    const mockData = this.getMockData();
                    this.updateCache(mockData);
                    this.broadcastUpdate(mockData);
                    this.retryCount = 0;
                }
            }
        }, this.config.data.refreshInterval);
        
        console.log('实时更新已启动，更新间隔:', this.config.data.refreshInterval, 'ms');
    }
    
    // 获取地震列表数据
    async getEarthquakeList(forceRefresh = false) {
        try {
            // 检查缓存是否有效
            if (!forceRefresh && this.isCacheValid()) {
                return this.cache.data;
            }
            
            if (this.isFetching) {
                return new Promise((resolve) => {
                    const check = setInterval(() => {
                        if (!this.isFetching) {
                            clearInterval(check);
                            resolve(this.cache.data);
                        }
                    }, 100);
                });
            }
            
            const data = await this.fetchCombinedData();
            return data;
        } catch (error) {
            console.error('获取地震数据时发生错误:', error);
            // 返回缓存数据或模拟数据作为后备
            return this.cache.data || this.getMockData();
        }
    }
    
    // 获取并广播更新
    async fetchAndBroadcastUpdates() {
        const newData = await this.fetchCombinedData();
        this.broadcastUpdate(newData);
        return newData;
    }
    
    // 广播数据更新
    broadcastUpdate(data) {
        this.listeners.forEach(listener => {
            try {
                listener(data);
            } catch (error) {
                console.error('广播更新时发生错误:', error);
            }
        });
    }
    
    // 添加更新监听器
    addUpdateListener(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    
    // 获取组合数据
    async fetchCombinedData() {
        this.isFetching = true;
        
        try {
            // 尝试从多个API获取数据
            let allData = [];
            
            // 1. 从JMA地震API获取数据（主要数据源）
            try {
                const jmaData = await this.fetchJMAQuakeData();
                if (jmaData && jmaData.length > 0) {
                    allData = allData.concat(jmaData);
                    console.log('从JMA API获取到', jmaData.length, '条地震数据');
                }
            } catch (jmaError) {
                console.error('JMA地震API错误:', jmaError);
            }
            
            // 2. 从P2Pquake API获取数据（备用数据源）
            try {
                const p2pData = await this.fetchP2PQuakeData();
                if (p2pData && p2pData.length > 0) {
                    // 合并数据，避免重复
                    const existingIds = new Set(allData.map(item => item.id));
                    const uniqueP2pData = p2pData.filter(item => !existingIds.has(item.id));
                    allData = allData.concat(uniqueP2pData);
                    console.log('从P2Pquake API获取到', uniqueP2pData.length, '条新地震数据');
                }
            } catch (p2pError) {
                console.error('P2Pquake API错误:', p2pError);
            }
            
            // 3. 如果没有从API获取到数据，使用模拟数据
            if (allData.length === 0) {
                console.warn('未从API获取到数据，使用模拟数据');
                allData = this.getMockData();
            }
            
            // 去重处理
            const uniqueData = this.removeDuplicates(allData);
            
            // 排序：最新的地震在前
            uniqueData.sort((a, b) => new Date(b.time) - new Date(a.time));
            
            // 限制数据量
            const limitedData = uniqueData.slice(0, this.config.data.maxQuakesToShow);
            
            // 更新缓存
            this.updateCache(limitedData);
            
            return limitedData;
        } finally {
            this.isFetching = false;
        }
    }
    
    // 从JMA地震API获取数据 - 使用指定的API端点
    async fetchJMAQuakeData() {
        try {
            const response = await axios.get(this.config.api.jma_quake.listUrl, {
                timeout: this.config.api.jma_quake.timeout,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'EarthquakeAlertApp/1.0'
                }
            });
            
            const rawData = response.data;
            if (!Array.isArray(rawData) || rawData.length === 0) {
                return [];
            }
            
            // 只处理最新的几个地震事件，避免请求过多
            const recentEvents = rawData.slice(0, 5);
            const earthquakes = [];
            
            // 获取每个地震事件的详细数据 - 使用并行请求提高性能
            const detailRequests = recentEvents.map(async (eventFile) => {
                try {
                    const detailUrl = `${this.config.api.jma_quake.detailUrl}${eventFile}`;
                    const detailResponse = await axios.get(detailUrl, {
                        timeout: this.config.api.jma_quake.timeout,
                        headers: {
                            'Accept': 'application/json',
                            'User-Agent': 'EarthquakeAlertApp/1.0'
                        }
                    });
                    
                    const detailData = detailResponse.data;
                    const quake = this.parseJMAQuakeDetail(detailData, eventFile.replace('.json', ''));
                    return quake;
                } catch (detailError) {
                    console.error(`获取地震详情失败 (${eventFile}):`, detailError);
                    return null;
                }
            });
            
            // 等待所有请求完成
            const detailResults = await Promise.all(detailRequests);
            
            // 过滤掉无效结果
            const validQuakes = detailResults.filter(quake => quake !== null);
            earthquakes.push(...validQuakes);
            
            // 实现增量更新，只返回新的地震数据
            if (this.config.data.enableIncrementalUpdate && this.cache.lastQuakeId) {
                const newQuakes = earthquakes.filter(quake => {
                    // 假设ID是唯一的，且新地震的ID比旧地震的ID大
                    return quake.id > this.cache.lastQuakeId;
                });
                
                if (newQuakes.length > 0) {
                    // 更新最后一个地震ID
                    this.cache.lastQuakeId = newQuakes[0].id;
                }
                
                return newQuakes;
            }
            
            // 如果是首次获取或未启用增量更新，返回所有数据
            if (earthquakes.length > 0) {
                this.cache.lastQuakeId = earthquakes[0].id;
            }
            
            return earthquakes;
        } catch (error) {
            console.error('获取JMA地震API数据失败:', error);
            throw error;
        }
    }
    
    // 从P2Pquake API获取数据（备用数据源）
    async fetchP2PQuakeData() {
        try {
            const response = await axios.get(this.config.api.p2pquake.endpoint, {
                timeout: this.config.api.p2pquake.timeout,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'EarthquakeAlertApp/1.0'
                }
            });
            
            const rawData = response.data;
            return this.parseP2PQuakeData(rawData);
        } catch (error) {
            console.error('获取P2Pquake API数据失败:', error);
            throw error;
        }
    }
    
    // 解析JMA地震API数据（列表数据）
    parseJMAQuakeData(rawData) {
        return []; // 不再使用此方法，改用parseJMAQuakeDetail
    }
    
    // 解析JMA地震API详细数据
    parseJMAQuakeDetail(detailData, id) {
        if (!detailData || !detailData.reportData) {
            return null;
        }
        
        try {
            const reportData = detailData.reportData;
            const earthquakeData = reportData[0];
            
            // 提取地震基本信息
            const origin = earthquakeData.domestic || earthquakeData.foreign;
            if (!origin) {
                return null;
            }
            
            // 解析时间
            const timeStr = origin.originTime || origin.time;
            const time = new Date(timeStr).toISOString();
            
            // 解析位置
            let locationOriginal = origin.name || '未知位置';
            let location = locationOriginal;
            let locationZh = locationOriginal;
            
            // 尝试翻译位置名称
            if (this.translateLocation) {
                location = this.translateLocation(locationOriginal);
                locationZh = this.translateLocation(locationOriginal, 'zh');
            }
            
            // 解析震级
            const magnitude = parseFloat(origin.magnitude) || 0;
            
            // 解析深度
            const depth = parseFloat(origin.depth) || 0;
            
            // 解析坐标
            const lat = parseFloat(origin.latitude) || 35.0;
            const lng = parseFloat(origin.longitude) || 135.0;
            
            // 解析最大震度
            let intensity = 0;
            if (earthquakeData.intensity) {
                const maxIntensity = earthquakeData.intensity.maxInt || earthquakeData.intensity[0]?.int || 0;
                intensity = parseFloat(maxIntensity) || 0;
            }
            
            // 创建地震对象
            return {
                id: id,
                time: time,
                location: location,
                locationZh: locationZh,
                locationOriginal: locationOriginal,
                magnitude: magnitude,
                depth: depth,
                lat: lat,
                lng: lng,
                intensity: intensity,
                source: 'JMA',
                isDetailed: true,
                rawData: detailData
            };
        } catch (parseError) {
            console.error('解析JMA地震详情失败:', parseError);
            return null;
        }
    }
    
    // 解析P2Pquake API数据
    parseP2PQuakeData(rawData) {
        if (!Array.isArray(rawData)) {
            return [];
        }
        
        return rawData.map(item => {
            try {
                const hypocenter = item.earthquake.hypocenter;
                const magnitude = parseFloat(hypocenter.magnitude) || 0;
                
                // 获取位置的原始语言和翻译
                const locationOriginal = hypocenter.name || '未知位置';
                const locationZh = this.translateLocation(locationOriginal);
                const location = this.translateLocation(locationOriginal);
                
                return {
                    id: `p2p_${item.code}_${item.time}`,
                    time: new Date(item.time).toISOString(),
                    location: location,
                    locationZh: locationZh,
                    locationOriginal: locationOriginal,
                    magnitude: magnitude,
                    depth: parseFloat(hypocenter.depth) || 0,
                    lat: parseFloat(hypocenter.latitude) || 35.0,
                    lng: parseFloat(hypocenter.longitude) || 135.0,
                    intensity: parseFloat(item.earthquake.maxInt) || 0,
                    source: 'P2Pquake',
                    isDetailed: true
                };
            } catch (parseError) {
                console.error('解析P2Pquake数据失败:', parseError);
                return null;
            }
        }).filter(item => item && item.magnitude > 0); // 过滤掉无效的地震数据
    }
    
    // 去重处理
    removeDuplicates(data) {
        const seenIds = new Set();
        return data.filter(item => {
            if (seenIds.has(item.id)) {
                return false;
            }
            seenIds.add(item.id);
            return true;
        });
    }
    
    // 位置翻译功能 - 支持多语言和地震国原语言
    translateLocation(location, targetLang = 'zh') {
        // 支持的语言列表
        const supportedLangs = this.config.language.available;
        
        // 如果目标语言不支持，返回原文
        if (!supportedLangs.includes(targetLang)) {
            return location;
        }
        
        // 翻译字典 - 支持更多国家和地区
        const translations = {
            // 日本
            '東京': { 'zh': '东京', 'en': 'Tokyo' },
            '大阪': { 'zh': '大阪', 'en': 'Osaka' },
            '京都': { 'zh': '京都', 'en': 'Kyoto' },
            '福岡': { 'zh': '福冈', 'en': 'Fukuoka' },
            '札幌': { 'zh': '札幌', 'en': 'Sapporo' },
            '仙台': { 'zh': '仙台', 'en': 'Sendai' },
            '名古屋': { 'zh': '名古屋', 'en': 'Nagoya' },
            '広島': { 'zh': '广岛', 'en': 'Hiroshima' },
            '神戸': { 'zh': '神户', 'en': 'Kobe' },
            '横浜': { 'zh': '横滨', 'en': 'Yokohama' },
            '千葉': { 'zh': '千叶', 'en': 'Chiba' },
            '埼玉': { 'zh': '埼玉', 'en': 'Saitama' },
            '茨城': { 'zh': '茨城', 'en': 'Ibaraki' },
            '栃木': { 'zh': '栃木', 'en': 'Tochigi' },
            '群馬': { 'zh': '群马', 'en': 'Gunma' },
            '山梨': { 'zh': '山梨', 'en': 'Yamanashi' },
            '新潟': { 'zh': '新潟', 'en': 'Niigata' },
            '富山': { 'zh': '富山', 'en': 'Toyama' },
            '石川': { 'zh': '石川', 'en': 'Ishikawa' },
            '福井': { 'zh': '福井', 'en': 'Fukui' },
            '山形': { 'zh': '山形', 'en': 'Yamagata' },
            '宮城': { 'zh': '宫城', 'en': 'Miyagi' },
            '青森': { 'zh': '青森', 'en': 'Aomori' },
            '岩手': { 'zh': '岩手', 'en': 'Iwate' },
            '秋田': { 'zh': '秋田', 'en': 'Akita' },
            '福島': { 'zh': '福岛', 'en': 'Fukushima' },
            '長野': { 'zh': '长野', 'en': 'Nagano' },
            '岐阜': { 'zh': '岐阜', 'en': 'Gifu' },
            '静岡': { 'zh': '静冈', 'en': 'Shizuoka' },
            '愛知': { 'zh': '爱知', 'en': 'Aichi' },
            '三重': { 'zh': '三重', 'en': 'Mie' },
            '滋賀': { 'zh': '滋贺', 'en': 'Shiga' },
            '兵庫': { 'zh': '兵库', 'en': 'Hyogo' },
            '奈良': { 'zh': '奈良', 'en': 'Nara' },
            '和歌山': { 'zh': '和歌山', 'en': 'Wakayama' },
            '鳥取': { 'zh': '鸟取', 'en': 'Tottori' },
            '島根': { 'zh': '岛根', 'en': 'Shimane' },
            '岡山': { 'zh': '冈山', 'en': 'Okayama' },
            '山口': { 'zh': '山口', 'en': 'Yamaguchi' },
            '徳島': { 'zh': '德岛', 'en': 'Tokushima' },
            '香川': { 'zh': '香川', 'en': 'Kagawa' },
            '愛媛': { 'zh': '爱媛', 'en': 'Ehime' },
            '高知': { 'zh': '高知', 'en': 'Kochi' },
            '佐賀': { 'zh': '佐贺', 'en': 'Saga' },
            '長崎': { 'zh': '长崎', 'en': 'Nagasaki' },
            '熊本': { 'zh': '熊本', 'en': 'Kumamoto' },
            '大分': { 'zh': '大分', 'en': 'Oita' },
            '宮崎': { 'zh': '宫崎', 'en': 'Miyazaki' },
            '鹿児島': { 'zh': '鹿儿岛', 'en': 'Kagoshima' },
            '沖縄': { 'zh': '冲绳', 'en': 'Okinawa' },
            
            // 通用地理术语
            '東方': { 'zh': '东方', 'en': 'East' },
            '西方': { 'zh': '西方', 'en': 'West' },
            '南方': { 'zh': '南方', 'en': 'South' },
            '北方': { 'zh': '北方', 'en': 'North' },
            '沖': { 'zh': '冲', 'en': 'Offshore' },
            '沿岸': { 'zh': '沿岸', 'en': 'Coast' },
            '近海': { 'zh': '近海', 'en': 'Nearshore' },
            '遠方': { 'zh': '远方', 'en': 'Distant' },
            '地方': { 'zh': '地方', 'en': 'Region' },
            '県': { 'zh': '县', 'en': 'Prefecture' },
            '市': { 'zh': '市', 'en': 'City' },
            '町': { 'zh': '町', 'en': 'Town' },
            '村': { 'zh': '村', 'en': 'Village' },
            '島': { 'zh': '岛', 'en': 'Island' },
            '半島': { 'zh': '半岛', 'en': 'Peninsula' }
        };
        
        let translated = location;
        
        // 尝试翻译匹配
        for (const [jp, trans] of Object.entries(translations)) {
            if (translated.includes(jp)) {
                translated = translated.replace(jp, trans[targetLang] || jp);
            }
        }
        
        // 处理特殊格式，如「東京都 千代田区」
        if (/(.+)都 (.+)/.test(translated)) {
            translated = translated.replace(/(.+)都 (.+)/, '$1都 $2');
        }
        
        // 处理「xx県xx市」格式
        if (/(.+)県(.+)市/.test(translated)) {
            translated = translated.replace(/(.+)県(.+)市/, '$1县$2市');
        }
        
        return translated;
    }
    
    // 获取模拟数据（当API不可用时）
    getMockData() {
        const mockLocations = [
            { lat: 35.6895, lng: 139.6917, name: '东京', originalName: '東京', country: '日本' },
            { lat: 34.6937, lng: 135.5023, name: '大阪', originalName: '大阪', country: '日本' },
            { lat: 43.0618, lng: 141.3545, name: '札幌', originalName: '札幌', country: '日本' },
            { lat: 33.5904, lng: 130.4017, name: '福冈', originalName: '福岡', country: '日本' },
            { lat: 35.0116, lng: 135.7681, name: '京都', originalName: '京都', country: '日本' },
            { lat: 33.6064, lng: 130.4182, name: '福冈县', originalName: '福岡県', country: '日本' },
            { lat: 36.6952, lng: 137.2112, name: '富山县', originalName: '富山県', country: '日本' },
            { lat: 38.2689, lng: 140.8721, name: '宫城县', originalName: '宮城県', country: '日本' },
            { lat: 36.3418, lng: 139.0403, name: '埼玉县', originalName: '埼玉県', country: '日本' }
        ];
        
        const mockData = [];
        const now = new Date();
        
        for (let i = 0; i < 30; i++) {
            const location = mockLocations[Math.floor(Math.random() * mockLocations.length)];
            const magnitude = (2 + Math.random() * 7).toFixed(1);
            const depth = Math.floor(Math.random() * 100) + 5;
            const time = new Date(now.getTime() - i * Math.random() * 86400000).toISOString();
            const intensity = magnitude > 3 ? parseFloat((magnitude - 2.5).toFixed(1)) : 0;
            
            mockData.push({
                id: `mock_${i}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                time: time,
                location: `${location.name}附近`,
                locationZh: `${location.name}附近`,
                locationOriginal: `${location.originalName}付近`, // 地震国原语言
                magnitude: parseFloat(magnitude),
                depth: depth,
                lat: location.lat + (Math.random() - 0.5) * 0.8,
                lng: location.lng + (Math.random() - 0.5) * 0.8,
                intensity: intensity,
                source: '模拟数据',
                isDetailed: true
            });
        }
        
        return mockData;
    }
    
    // 检查缓存是否有效
    isCacheValid() {
        if (!this.cache.data || !this.cache.timestamp) {
            return false;
        }
        
        const now = Date.now();
        return (now - this.cache.timestamp) < this.config.data.cacheDuration;
    }
    
    // 更新缓存
    updateCache(data) {
        this.cache.data = data;
        this.cache.timestamp = Date.now();
        
        // 更新最后一个地震ID
        if (data && data.length > 0) {
            this.cache.lastQuakeId = data[0].id;
        }
    }
    
    // 清除缓存
    clearCache() {
        this.cache.data = null;
        this.cache.timestamp = 0;
        this.cache.lastQuakeId = null;
    }
    
    // 销毁实例，清理资源
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.listeners = [];
        this.clearCache();
    }
}

// 暴露到window对象，供浏览器使用
window.EarthquakeAPI = EarthquakeAPI;
// 不在这里创建实例，而是在应用初始化时创建
// window.earthquakeAPI = earthquakeAPI;