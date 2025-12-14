/**
 * 地震模拟器模块
 * 用于生成和管理模拟地震数据
 */
class QuakeSimulator {
    constructor(app) {
        this.app = app;
        this.isSimulating = false;
        this.simulationInterval = null;
        this.simulationSpeed = 10000; // 默认10秒一次模拟
        
        // 世界主要地震带坐标范围
        this.earthquakeZones = [
            { name: '环太平洋地震带', lat: { min: -60, max: 60 }, lng: { min: -180, max: 180 }, weight: 0.6 },
            { name: '地中海-喜马拉雅地震带', lat: { min: 0, max: 50 }, lng: { min: -10, max: 150 }, weight: 0.3 },
            { name: '其他地区', lat: { min: -90, max: 90 }, lng: { min: -180, max: 180 }, weight: 0.1 }
        ];
    }

    /**
     * 开始地震模拟
     * @param {number} speed - 模拟速度（毫秒）
     */
    startSimulation(speed = this.simulationSpeed) {
        if (this.isSimulating) return;
        
        this.simulationSpeed = speed;
        this.isSimulating = true;
        
        this.simulationInterval = setInterval(() => {
            this.generateRandomEarthquake();
        }, this.simulationSpeed);
        
        console.log(`地震模拟已启动，每${this.simulationSpeed/1000}秒生成一次模拟地震`);
    }

    /**
     * 停止地震模拟
     */
    stopSimulation() {
        if (!this.isSimulating) return;
        
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
        this.isSimulating = false;
        
        console.log('地震模拟已停止');
    }

    /**
     * 切换模拟状态
     */
    toggleSimulation() {
        if (this.isSimulating) {
            this.stopSimulation();
        } else {
            this.startSimulation();
        }
        
        return this.isSimulating;
    }

    /**
     * 设置模拟速度
     * @param {number} speed - 模拟速度（毫秒）
     */
    setSimulationSpeed(speed) {
        this.simulationSpeed = Math.max(1000, speed); // 最小1秒
        
        if (this.isSimulating) {
            this.stopSimulation();
            this.startSimulation(this.simulationSpeed);
        }
    }

    /**
     * 生成随机地震
     * @returns {Object} 模拟地震数据
     */
    generateRandomEarthquake() {
        // 随机选择地震带
        const zone = this.selectRandomZone();
        
        // 生成随机坐标
        const lat = this.getRandomInRange(zone.lat.min, zone.lat.max);
        const lng = this.getRandomInRange(zone.lng.min, zone.lng.max);
        
        // 生成随机震级 (2.0-7.5之间，小地震概率更大)
        const magnitude = this.generateMagnitude();
        
        // 生成随机深度 (浅源地震概率更大)
        const depth = this.generateDepth(magnitude);
        
        // 生成时间
        const time = new Date();
        
        // 生成位置名称
        const location = this.generateLocationName(lat, lng);
        
        // 创建地震数据对象
        const quakeData = {
            id: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            time: time.toISOString(),
            magnitude: magnitude,
            depth: depth,
            latitude: lat,
            longitude: lng,
            name: location,
            type: 'simulation',
            agency: '模拟器'
        };
        
        // 调用应用的addEarthquake方法添加地震
        if (this.app && this.app.addEarthquake) {
            this.app.addEarthquake(quakeData);
        }
        
        return quakeData;
    }

    /**
     * 根据权重随机选择地震带
     * @returns {Object} 地震带数据
     */
    selectRandomZone() {
        const random = Math.random();
        let cumulativeWeight = 0;
        
        for (const zone of this.earthquakeZones) {
            cumulativeWeight += zone.weight;
            if (random < cumulativeWeight) {
                return zone;
            }
        }
        
        return this.earthquakeZones[this.earthquakeZones.length - 1];
    }

    /**
     * 在指定范围内生成随机数
     * @param {number} min - 最小值
     * @param {number} max - 最大值
     * @returns {number} 随机数
     */
    getRandomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * 生成震级（小地震概率更大）
     * @returns {number} 震级
     */
    generateMagnitude() {
        const random = Math.random();
        let magnitude;
        
        if (random < 0.7) { // 70%概率发生小地震
            magnitude = 2.0 + Math.random() * 2.0; // 2.0-4.0
        } else if (random < 0.95) { // 25%概率发生中等地震
            magnitude = 4.0 + Math.random() * 2.0; // 4.0-6.0
        } else { // 5%概率发生大地震
            magnitude = 6.0 + Math.random() * 1.5; // 6.0-7.5
        }
        
        return Math.round(magnitude * 10) / 10; // 保留一位小数
    }

    /**
     * 生成震源深度（浅源地震概率更大）
     * @param {number} magnitude - 震级
     * @returns {number} 深度（千米）
     */
    generateDepth(magnitude) {
        const random = Math.random();
        let depth;
        
        if (random < 0.6) { // 60%概率为浅源地震
            depth = 10 + Math.random() * 50; // 10-60km
        } else if (random < 0.9) { // 30%概率为中源地震
            depth = 60 + Math.random() * 140; // 60-200km
        } else { // 10%概率为深源地震
            depth = 200 + Math.random() * 400; // 200-600km
        }
        
        // 大地震往往深度更深
        depth += (magnitude - 4) * 10;
        
        return Math.round(depth);
    }

    /**
     * 生成位置名称
     * @param {number} lat - 纬度
     * @param {number} lng - 经度
     * @returns {string} 位置名称
     */
    generateLocationName(lat, lng) {
        // 简化的位置名称生成
        const latDir = lat >= 0 ? '北纬' : '南纬';
        const lngDir = lng >= 0 ? '东经' : '西经';
        
        const latDeg = Math.abs(Math.round(lat));
        const lngDeg = Math.abs(Math.round(lng));
        
        return `${latDir}${latDeg}度${lngDir}${lngDeg}度附近`;
    }

    /**
     * 获取模拟状态
     * @returns {boolean} 模拟状态
     */
    getSimulationStatus() {
        return this.isSimulating;
    }

    /**
     * 手动触发一次模拟地震
     * @returns {Object} 模拟地震数据
     */
    triggerManualEarthquake() {
        return this.generateRandomEarthquake();
    }
}

// 导出模块
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = QuakeSimulator;
}