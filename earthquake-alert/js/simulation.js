// 地震模拟模块 - 与jquake一致
class EarthquakeSimulation {
    constructor(config, map, animation) {
        this.config = config;
        this.map = map;
        this.animation = animation;
        this.isSimulating = false;
        this.simulationInterval = null;
        this.currentQuake = null;
        this.waveElements = [];
        this.isManualTrigger = false;
        
        this.initSimulationControls();
        this.setupEventListeners();
        
        console.log('地震模拟模块初始化完成 - 与jquake一致');
    }
    
    // 初始化模拟控制面板 - 与jquake一致
    initSimulationControls() {
        // 获取模拟相关元素
        this.toggleElement = document.getElementById('simulationToggle');
        this.statusElement = document.getElementById('simulationStatus');
        this.speedSlider = document.getElementById('simulationSpeed');
        this.speedValueElement = document.getElementById('simulationSpeedValue');
        this.manualButton = document.getElementById('manualQuakeButton');
        
        // 初始化状态显示
        if (this.toggleElement && this.statusElement) {
            this.updateSimulationStatus(false);
        }
        
        // 初始化速度滑块显示
        if (this.speedSlider && this.speedValueElement) {
            this.speedValueElement.textContent = `${this.speedSlider.value}秒`;
        }
        
        // 添加高级控制面板
        this.initAdvancedControls();
        
        console.log('模拟控制面板初始化完成');
    }
    
    // 初始化高级控制面板
    initAdvancedControls() {
        // 创建高级控制面板
        this.advancedPanel = document.createElement('div');
        this.advancedPanel.className = 'simulation-advanced-panel';
        this.advancedPanel.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            display: none;
        `;
        
        // 高级控制面板HTML内容
        this.advancedPanel.innerHTML = `
            <h4>高级设置</h4>
            <div class="advanced-controls">
                <div class="control-group">
                    <label for="simMagnitudeRange">震级范围:</label>
                    <div class="range-control">
                        <input type="range" id="simMagnitudeRange" min="3.0" max="9.0" step="0.1" value="5.0">
                        <span id="simMagnitudeRangeValue">5.0</span>
                    </div>
                </div>
                <div class="control-group">
                    <label for="simDepthRange">深度范围:</label>
                    <div class="range-control">
                        <input type="range" id="simDepthRange" min="5" max="200" step="5" value="30">
                        <span id="simDepthRangeValue">30</span>
                    </div>
                </div>
                <div class="control-group">
                    <label for="simLocationRandomness">位置随机性:</label>
                    <div class="range-control">
                        <input type="range" id="simLocationRandomness" min="0" max="1" step="0.1" value="0.5">
                        <span id="simLocationRandomnessValue">0.5</span>
                    </div>
                </div>
                <div class="control-group">
                    <label for="simWaveCount">地震波数量:</label>
                    <div class="range-control">
                        <input type="range" id="simWaveCount" min="1" max="10" step="1" value="5">
                        <span id="simWaveCountValue">5</span>
                    </div>
                </div>
            </div>
        `;
        
        // 添加到模拟面板
        const panel = document.querySelector('.simulation-panel');
        if (panel) {
            panel.appendChild(this.advancedPanel);
        }
        
        // 初始化高级控制事件
        this.initAdvancedControlEvents();
        
        console.log('高级控制面板初始化完成');
    }
    
    // 设置事件监听器 - 与jquake一致
    setupEventListeners() {
        // 模拟开关事件
        if (this.toggleElement && this.statusElement) {
            this.toggleElement.addEventListener('change', (e) => {
                this.toggleSimulation(e.target.checked);
            });
        }
        
        // 速度滑块事件
        if (this.speedSlider && this.speedValueElement) {
            this.speedSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.speedValueElement.textContent = `${value}秒`;
                
                // 如果正在模拟，更新模拟间隔
                if (this.isSimulating) {
                    this.restartSimulationInterval();
                }
            });
        }
        
        // 手动触发按钮事件
        if (this.manualButton) {
            this.manualButton.addEventListener('click', () => {
                this.triggerManualQuake();
            });
        }
        
        console.log('事件监听器设置完成');
    }
    
    // 初始化高级控制事件
    initAdvancedControlEvents() {
        // 震级范围滑块
        const magnitudeRange = document.getElementById('simMagnitudeRange');
        const magnitudeRangeValue = document.getElementById('simMagnitudeRangeValue');
        if (magnitudeRange && magnitudeRangeValue) {
            magnitudeRange.addEventListener('input', (e) => {
                magnitudeRangeValue.textContent = e.target.value;
            });
        }
        
        // 深度范围滑块
        const depthRange = document.getElementById('simDepthRange');
        const depthRangeValue = document.getElementById('simDepthRangeValue');
        if (depthRange && depthRangeValue) {
            depthRange.addEventListener('input', (e) => {
                depthRangeValue.textContent = e.target.value;
            });
        }
        
        // 位置随机性滑块
        const locationRandomness = document.getElementById('simLocationRandomness');
        const locationRandomnessValue = document.getElementById('simLocationRandomnessValue');
        if (locationRandomness && locationRandomnessValue) {
            locationRandomness.addEventListener('input', (e) => {
                locationRandomnessValue.textContent = e.target.value;
            });
        }
        
        // 地震波数量滑块
        const waveCount = document.getElementById('simWaveCount');
        const waveCountValue = document.getElementById('simWaveCountValue');
        if (waveCount && waveCountValue) {
            waveCount.addEventListener('input', (e) => {
                waveCountValue.textContent = e.target.value;
            });
        }
    }
    
    // 切换模拟状态
    toggleSimulation(enable) {
        this.isSimulating = enable;
        this.updateSimulationStatus(enable);
        
        if (enable) {
            this.startSimulationInterval();
            console.log('地震模拟已启用');
        } else {
            this.stopSimulationInterval();
            console.log('地震模拟已禁用');
        }
    }
    
    // 开始模拟间隔
    startSimulationInterval() {
        // 清除现有间隔
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
        
        // 获取模拟间隔时间
        const intervalMs = parseInt(this.speedSlider?.value || 10) * 1000;
        
        // 启动新的间隔
        this.simulationInterval = setInterval(() => {
            this.generateRandomQuake();
        }, intervalMs);
        
        console.log(`模拟间隔已启动，间隔时间: ${intervalMs}ms`);
    }
    
    // 停止模拟间隔
    stopSimulationInterval() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
        
        // 清除现有动画
        this.clearWaveAnimations();
        
        console.log('模拟间隔已停止');
    }
    
    // 重启模拟间隔
    restartSimulationInterval() {
        if (this.isSimulating) {
            this.startSimulationInterval();
        }
    }
    
    // 手动触发地震
    triggerManualQuake() {
        this.isManualTrigger = true;
        this.generateRandomQuake();
        this.isManualTrigger = false;
        
        console.log('手动触发地震');
    }
    
    // 生成随机地震
    generateRandomQuake() {
        // 获取高级控制参数
        const magnitudeRange = document.getElementById('simMagnitudeRange');
        const depthRange = document.getElementById('simDepthRange');
        const locationRandomness = document.getElementById('simLocationRandomness');
        
        // 随机震级
        const baseMagnitude = parseFloat(magnitudeRange?.value || 5.0);
        const magnitude = Math.max(3.0, Math.min(9.0, baseMagnitude + (Math.random() - 0.5) * 2.0));
        
        // 随机深度
        const baseDepth = parseInt(depthRange?.value || 30);
        const depth = Math.max(5, Math.min(200, baseDepth + (Math.random() - 0.5) * 50));
        
        // 随机位置
        const randomness = parseFloat(locationRandomness?.value || 0.5);
        const location = this.getRandomLocation(randomness);
        
        // 生成地震数据
        const quake = this.generateSimulationQuake(magnitude, depth, location);
        
        // 在地图上显示地震
        this.displayQuakeOnMap(quake);
        
        // 添加到地震列表
        this.addToQuakeList(quake);
        
        console.log(`生成随机地震: M${magnitude.toFixed(1)}，深度${depth}km，位置${location.name}`);
    }
    
    // 获取随机位置
    getRandomLocation(randomness = 0.5) {
        // 获取预设位置列表
        const locations = this.config.simulation.defaultLocations;
        const locationKeys = Object.keys(locations);
        
        // 随机选择一个预设位置
        const randomKey = locationKeys[Math.floor(Math.random() * locationKeys.length)];
        const baseLocation = locations[randomKey];
        const locationName = this.getLocationName(randomKey);
        
        // 添加随机偏移
        const latOffset = (Math.random() - 0.5) * 5 * randomness;
        const lngOffset = (Math.random() - 0.5) * 10 * randomness;
        
        return {
            lat: baseLocation.lat + latOffset,
            lng: baseLocation.lng + lngOffset,
            name: locationName
        };
    }
    
    // 更新模拟状态显示
    updateSimulationStatus(enabled) {
        if (this.statusElement) {
            this.statusElement.textContent = enabled ? '地震模拟已启用' : '地震模拟已禁用';
        }
    }
    
    // 生成模拟地震数据 - 与jquake一致
    generateSimulationQuake(magnitude, depth, location) {
        // 确保位置是有效的对象
        const validLocation = typeof location === 'string' ? this.getLocationFromKey(location) : location;
        
        // 生成地震数据
        const quake = {
            id: `sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            time: new Date().toISOString(),
            location: `${validLocation.name}附近`,
            locationZh: `${validLocation.name}附近`,
            locationOriginal: `${validLocation.name}付近`, // 地震国原语言
            magnitude: parseFloat(magnitude.toFixed(1)),
            depth: Math.round(depth),
            lat: validLocation.lat + (Math.random() - 0.5) * 0.3, // 添加随机偏移
            lng: validLocation.lng + (Math.random() - 0.5) * 0.3,
            intensity: this.calculateIntensity(magnitude, depth),
            source: this.isManualTrigger ? '手动模拟' : '自动模拟',
            isDetailed: true
        };
        
        return quake;
    }
    
    // 从位置键获取位置对象
    getLocationFromKey(locationKey) {
        // 使用预设位置
        const baseLocation = this.config.simulation.defaultLocations[locationKey] || this.config.simulation.defaultLocations.tokyo;
        const locationName = this.getLocationName(locationKey);
        
        return {
            lat: baseLocation.lat,
            lng: baseLocation.lng,
            name: locationName
        };
    }
    
    // 在地图上显示地震
    displayQuakeOnMap(quake) {
        if (!this.map) return;
        
        // 在地图上添加标记
        const marker = this.map.addMarker(quake);
        
        // 聚焦到地震位置（仅手动触发或重大地震）
        if (this.isManualTrigger || quake.magnitude >= 6.0) {
            this.map.focus(quake.lat, quake.lng, 3);
        }
        
        // 显示地震警报动画
        if (this.animation) {
            this.animation.animateMarker(marker, quake);
            
            // 对于重大地震，显示警报
            if (quake.magnitude >= this.config.earthquakeAlert.emergencyThreshold) {
                this.animation.showQuakeAlert(quake);
            }
        }
        
        // 创建地震波动画
        this.createSeismicWaveAnimation(quake, marker);
        
        console.log(`在地图上显示地震: M${quake.magnitude}，位置: ${quake.location}`);
    }
    
    // 获取位置名称
    getLocationName(locationKey) {
        const names = {
            tokyo: '东京',
            osaka: '大阪',
            sapporo: '札幌',
            fukuoka: '福冈'
        };
        return names[locationKey] || locationKey;
    }
    
    // 计算震度
    calculateIntensity(magnitude, depth) {
        // 简化的震度计算模型
        // 实际震度计算会更复杂，这里使用简化公式
        const baseIntensity = magnitude - 3;
        const depthFactor = Math.max(1, depth / 10); // 深度衰减因子
        const intensity = Math.max(0, baseIntensity / Math.sqrt(depthFactor));
        
        return parseFloat(intensity.toFixed(1));
    }
    
    // 创建地震波动画
    createSeismicWaveAnimation(quake, epicenterMarker) {
        const waveCount = Math.min(Math.floor(quake.magnitude), 5); // 根据震级决定波的数量
        const waveSpeed = 100; // 波传播速度（像素/秒）
        const maxWaveRadius = this.calculateMaxWaveRadius(quake.magnitude);
        
        let currentWaveIndex = 0;
        
        // 创建地震波生成间隔
        this.simulationInterval = setInterval(() => {
            if (currentWaveIndex < waveCount && this.isSimulating) {
                const wave = this.createWaveElement(quake, epicenterMarker, maxWaveRadius);
                this.waveElements.push(wave);
                
                // 动画地震波
                this.animateWave(wave, maxWaveRadius, waveSpeed);
                
                currentWaveIndex++;
            } else if (currentWaveIndex >= waveCount) {
                // 所有波都已生成，清除间隔
                clearInterval(this.simulationInterval);
            }
        }, 500);
        
        // 触发震动效果
        this.triggerSynchronizedShake(quake.magnitude);
    }
    
    // 创建地震波元素
    createWaveElement(quake, epicenterMarker, maxRadius) {
        const wave = document.createElement('div');
        wave.className = 'seismic-wave';
        wave.style.position = 'absolute';
        wave.style.borderRadius = '50%';
        wave.style.border = '2px solid rgba(255, 255, 255, 0.6)';
        wave.style.backgroundColor = 'rgba(0, 150, 255, 0.1)';
        wave.style.transform = 'translate(-50%, -50%)';
        wave.style.pointerEvents = 'none';
        wave.style.zIndex = '5';
        wave.style.boxSizing = 'border-box';
        
        // 设置初始大小
        wave.style.width = '10px';
        wave.style.height = '10px';
        
        // 设置位置（与震中相同）
        if (epicenterMarker) {
            const rect = epicenterMarker.getBoundingClientRect();
            const mapRect = this.map.mapElement.getBoundingClientRect();
            
            wave.style.left = `${rect.left - mapRect.left + rect.width / 2}px`;
            wave.style.top = `${rect.top - mapRect.top + rect.height / 2}px`;
        }
        
        // 添加到地图
        if (this.map.mapElement) {
            this.map.mapElement.appendChild(wave);
        }
        
        return wave;
    }
    
    // 动画地震波
    animateWave(wave, maxRadius, speed) {
        const duration = (maxRadius * 2) / speed * 1000; // 毫秒
        
        // 设置动画
        wave.style.transition = `width ${duration}ms linear, height ${duration}ms linear, opacity ${duration * 0.8}ms linear`;
        
        // 触发动画
        setTimeout(() => {
            wave.style.width = `${maxRadius * 2}px`;
            wave.style.height = `${maxRadius * 2}px`;
            wave.style.opacity = '0';
            wave.style.borderWidth = '1px';
        }, 10);
        
        // 动画结束后移除
        setTimeout(() => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
                // 从数组中移除
                const index = this.waveElements.indexOf(wave);
                if (index > -1) {
                    this.waveElements.splice(index, 1);
                }
            }
        }, duration);
    }
    
    // 计算最大波半径
    calculateMaxWaveRadius(magnitude) {
        // 震级越大，波半径越大
        const baseRadius = 100;
        const radiusPerMagnitude = 50;
        
        return baseRadius + (magnitude - 3) * radiusPerMagnitude;
    }
    
    // 触发同步震动
    triggerSynchronizedShake(magnitude) {
        // 获取震动强度配置
        const intensityConfig = this.config.simulation.shakingIntensity;
        let shakeIntensity = 0.5;
        
        // 根据震级选择震动强度
        for (const [mag, intensity] of Object.entries(intensityConfig)) {
            if (magnitude >= parseFloat(mag)) {
                shakeIntensity = intensity;
            }
        }
        
        // 计算震动持续时间
        const duration = Math.min(magnitude * 200, 2000); // 最长2秒
        
        let startTime = Date.now();
        let lastUpdateTime = startTime;
        
        // 震动函数
        const shake = () => {
            if (!this.isSimulating) return;
            
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const deltaTime = currentTime - lastUpdateTime;
            lastUpdateTime = currentTime;
            
            if (elapsed >= duration) {
                // 震动结束，恢复
                document.body.style.transform = 'translate(0, 0)';
                return;
            }
            
            // 随时间减弱震动强度
            const currentIntensity = shakeIntensity * (1 - elapsed / duration);
            
            // 计算震动位移（考虑频率）
            const frequency = 10; // Hz
            const phase = (elapsed / 1000 * frequency) * Math.PI * 2;
            
            const shakeX = Math.sin(phase) * currentIntensity * 5;
            const shakeY = Math.cos(phase * 1.2) * currentIntensity * 5;
            
            // 应用位移
            document.body.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
            
            // 继续震动
            requestAnimationFrame(shake);
        };
        
        // 设置过渡时间
        document.body.style.transition = 'transform 0.02s ease-out';
        
        // 开始震动
        requestAnimationFrame(shake);
    }
    
    // 清除波动画
    clearWaveAnimations() {
        this.waveElements.forEach(wave => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        });
        this.waveElements = [];
    }
    
    // 添加到地震列表
    addToQuakeList(quake) {
        // 触发自定义事件，通知主应用更新列表
        const event = new CustomEvent('simulationQuakeCreated', { detail: quake });
        document.dispatchEvent(event);
    }
    
    // 更新模拟状态
    updateSimulationStatus(status) {
        const statusElement = document.createElement('div');
        statusElement.className = 'simulation-status';
        statusElement.style.position = 'fixed';
        statusElement.style.top = '20px';
        statusElement.style.right = '20px';
        statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        statusElement.style.color = 'white';
        statusElement.style.padding = '10px 20px';
        statusElement.style.borderRadius = '5px';
        statusElement.style.zIndex = '1000';
        statusElement.style.fontSize = '14px';
        statusElement.textContent = status;
        
        // 移除旧的状态元素
        const oldStatus = document.querySelector('.simulation-status');
        if (oldStatus && oldStatus.parentNode) {
            oldStatus.parentNode.removeChild(oldStatus);
        }
        
        // 添加新的状态元素
        document.body.appendChild(statusElement);
        
        // 如果不是正在模拟，3秒后自动移除
        if (status !== '正在模拟...') {
            setTimeout(() => {
                if (statusElement.parentNode) {
                    statusElement.parentNode.removeChild(statusElement);
                }
            }, 3000);
        }
    }
    
    // 获取模拟参数
    getSimulationParams() {
        return {
            magnitude: parseFloat(this.magnitudeSlider?.value || 5.5),
            depth: parseInt(this.depthSlider?.value || 10),
            location: this.locationSelect?.value || 'tokyo'
        };
    }
    
    // 设置模拟参数
    setSimulationParams(params) {
        if (params.magnitude !== undefined && this.magnitudeSlider) {
            this.magnitudeSlider.value = params.magnitude;
            if (this.magnitudeValue) {
                this.magnitudeValue.textContent = params.magnitude;
            }
        }
        
        if (params.depth !== undefined && this.depthSlider) {
            this.depthSlider.value = params.depth;
            if (this.depthValue) {
                this.depthValue.textContent = params.depth;
            }
        }
        
        if (params.location !== undefined && this.locationSelect) {
            this.locationSelect.value = params.location;
        }
    }
    
    // 检查是否正在模拟
    isRunning() {
        return this.isSimulating;
    }
}

// 创建模拟实例
let earthquakeSimulation;

function initSimulation(map, animation) {
    earthquakeSimulation = new EarthquakeSimulation(config, map, animation);
    return earthquakeSimulation;
}

// 暴露到window对象，供浏览器使用
window.EarthquakeSimulation = EarthquakeSimulation;
window.initSimulation = initSimulation;
window.earthquakeSimulation = earthquakeSimulation;