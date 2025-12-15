// 地震速报动画管理器
class AnimationManager {
    constructor(config) {
        this.config = config || window.config?.animation || {};
        this.config.duration = this.config.duration || 2000;
        this.config.waveCount = this.config.waveCount || 3;
        this.config.waveSpeed = this.config.waveSpeed || 0.8;
        
        this.activeAnimations = new Map(); // 存储活动的动画
        this.lastAnimationTime = 0;
        
        // 初始化DOM引用
        this.mapContainer = document.getElementById('earthquakeMap');
    }
    
    // 触发地震动画
    triggerQuakeAnimation(quake) {
        if (!quake || !quake.lat || !quake.lng || !this.mapContainer) {
            console.warn('无效的地震数据，无法触发动画');
            return;
        }
        
        // 生成唯一ID
        const animationId = `${quake.time}-${quake.lat}-${quake.lng}`;
        
        // 避免重复动画
        if (this.activeAnimations.has(animationId)) {
            console.log('动画已在进行中，跳过');
            return;
        }
        
        console.log(`触发地震动画: ID=${animationId}, 震级=${quake.magnitude}`);
        
        // 存储动画状态
        this.activeAnimations.set(animationId, {
            quake,
            startTime: Date.now(),
            isActive: true
        });
        
        // 执行震动动画
        this.executeShakeAnimation(quake.magnitude);
        
        // 创建震波动画
        this.createWaveAnimation(quake);
        
        // 创建标记点动画
        this.createMarkerAnimation(quake);
        
        // 2秒后移除动画记录
        setTimeout(() => {
            this.activeAnimations.delete(animationId);
        }, this.config.duration * 2);
    }
    
    // 执行地图震动动画
    executeShakeAnimation(magnitude) {
        if (!this.mapContainer) return;
        
        // 根据震级确定震动强度和持续时间
        const intensity = Math.min(5, Math.max(1, Math.floor(magnitude)));
        const shakeDuration = Math.min(1000, Math.max(300, magnitude * 100));
        
        // 保存原始位置
        const originalTransform = this.mapContainer.style.transform || '';
        
        // 震动动画
        let startTime;
        const shake = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            
            if (elapsed < shakeDuration) {
                // 计算震动位移
                const progress = elapsed / shakeDuration;
                const decay = 1 - progress;
                const displacement = intensity * decay;
                
                // 随机位移
                const x = (Math.random() - 0.5) * displacement;
                const y = (Math.random() - 0.5) * displacement;
                
                this.mapContainer.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                // 恢复原始位置
                this.mapContainer.style.transform = originalTransform;
            }
        };
        
        requestAnimationFrame(shake);
    }
    
    // 创建震波动画
    createWaveAnimation(quake) {
        if (!this.mapContainer) return;
        
        // 计算地震位置在容器中的像素坐标
        const pixelCoords = this.getPixelCoordinates(quake.lat, quake.lng);
        if (!pixelCoords) return;
        
        // 创建震波容器
        const waveContainer = document.createElement('div');
        waveContainer.className = 'quake-wave-container';
        waveContainer.style.position = 'absolute';
        waveContainer.style.left = `${pixelCoords.x}px`;
        waveContainer.style.top = `${pixelCoords.y}px`;
        waveContainer.style.transform = 'translate(-50%, -50%)';
        waveContainer.style.zIndex = '100';
        waveContainer.style.pointerEvents = 'none';
        
        this.mapContainer.appendChild(waveContainer);
        
        // 根据震级确定震波参数
        const baseRadius = Math.max(50, quake.magnitude * 15);
        const baseOpacity = 0.8;
        
        // 创建多个震波
        for (let i = 0; i < this.config.waveCount; i++) {
            const wave = document.createElement('div');
            wave.className = 'quake-wave';
            wave.style.position = 'absolute';
            wave.style.border = '2px solid rgba(0, 150, 255, 0.8)';
            wave.style.borderRadius = '50%';
            wave.style.width = '0';
            wave.style.height = '0';
            wave.style.left = '50%';
            wave.style.top = '50%';
            wave.style.transform = 'translate(-50%, -50%)';
            wave.style.animation = `wave-animation ${this.config.duration / 1000}s ease-out forwards`;
            wave.style.animationDelay = `${i * 200}ms`;
            
            waveContainer.appendChild(wave);
        }
        
        // 添加样式规则
        this.addWaveAnimationStyle(baseRadius, baseOpacity);
        
        // 动画结束后移除
        setTimeout(() => {
            if (this.mapContainer.contains(waveContainer)) {
                this.mapContainer.removeChild(waveContainer);
            }
        }, this.config.duration + (this.config.waveCount - 1) * 200);
    }
    
    // 添加震波动画样式
    addWaveAnimationStyle(maxRadius, startOpacity) {
        // 检查是否已存在样式
        if (document.getElementById('quake-wave-animation-style')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'quake-wave-animation-style';
        
        const animationKeyframes = `
            @keyframes wave-animation {
                0% {
                    width: 0px;
                    height: 0px;
                    opacity: ${startOpacity};
                }
                100% {
                    width: ${maxRadius * 2}px;
                    height: ${maxRadius * 2}px;
                    opacity: 0;
                }
            }
        `;
        
        style.textContent = animationKeyframes;
        document.head.appendChild(style);
    }
    
    // 创建标记点动画
    createMarkerAnimation(quake) {
        if (!this.mapContainer) return;
        
        // 计算地震位置在容器中的像素坐标
        const pixelCoords = this.getPixelCoordinates(quake.lat, quake.lng);
        if (!pixelCoords) return;
        
        // 创建标记点
        const marker = document.createElement('div');
        marker.className = 'quake-marker-animation';
        
        // 设置样式
        marker.style.position = 'absolute';
        marker.style.left = `${pixelCoords.x}px`;
        marker.style.top = `${pixelCoords.y}px`;
        marker.style.transform = 'translate(-50%, -50%)';
        marker.style.width = '12px';
        marker.style.height = '12px';
        marker.style.borderRadius = '50%';
        marker.style.backgroundColor = this.getMagnitudeColor(quake.magnitude);
        marker.style.boxShadow = '0 0 10px 2px rgba(0, 0, 0, 0.3)';
        marker.style.zIndex = '200';
        marker.style.pointerEvents = 'none';
        marker.style.animation = 'marker-pulse 2s ease-out forwards';
        
        this.mapContainer.appendChild(marker);
        
        // 添加标记点动画样式
        this.addMarkerAnimationStyle();
        
        // 动画结束后移除
        setTimeout(() => {
            if (this.mapContainer.contains(marker)) {
                this.mapContainer.removeChild(marker);
            }
        }, 2000);
    }
    
    // 添加标记点动画样式
    addMarkerAnimationStyle() {
        if (document.getElementById('quake-marker-animation-style')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'quake-marker-animation-style';
        
        const animationKeyframes = `
            @keyframes marker-pulse {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                }
                50% {
                    transform: translate(-50%, -50%) scale(1.5);
                    opacity: 0.8;
                }
                100% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0;
                }
            }
        `;
        
        style.textContent = animationKeyframes;
        document.head.appendChild(style);
    }
    
    // 获取像素坐标（简化版）
    getPixelCoordinates(lat, lng) {
        if (!this.mapContainer) return null;
        
        // 获取地图容器的尺寸
        const containerRect = this.mapContainer.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        
        // 简单的坐标转换（实际应用中需要根据地图投影进行调整）
        // 这里使用简化的墨卡托投影近似
        const mercatorY = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
        
        // 假设地图中心点为[35, 135]，缩放级别为5
        const centerLat = 35;
        const centerLng = 135;
        
        // 计算相对于中心点的偏移
        const lngOffset = (lng - centerLng) / 360;
        const latOffset = (mercatorY - Math.log(Math.tan(Math.PI / 4 + (centerLat * Math.PI / 180) / 2))) / (2 * Math.PI);
        
        // 转换为像素坐标
        const x = width / 2 + lngOffset * width;
        const y = height / 2 - latOffset * height;
        
        return { x, y };
    }
    
    // 根据震级获取颜色
    getMagnitudeColor(magnitude) {
        if (magnitude >= 7.0) return '#ff0000';      // 红色
        if (magnitude >= 6.0) return '#ff4500';      // 橙红色
        if (magnitude >= 5.0) return '#ffa500';      // 橙色
        if (magnitude >= 4.0) return '#ffd700';      // 黄色
        if (magnitude >= 3.0) return '#00ff00';      // 绿色
        return '#00bfff';                            // 蓝色
    }
    
    // 清除所有动画
    clearAllAnimations() {
        // 清除所有活动动画记录
        this.activeAnimations.clear();
        
        // 移除所有动画DOM元素
        const waveContainers = document.querySelectorAll('.quake-wave-container');
        waveContainers.forEach(container => container.remove());
        
        const markers = document.querySelectorAll('.quake-marker-animation');
        markers.forEach(marker => marker.remove());
        
        console.log('所有动画已清除');
    }
    
    // 获取活动动画数量
    getActiveAnimationsCount() {
        return this.activeAnimations.size;
    }
    
    // 检查动画是否活跃
    isAnimationActive(animationId) {
        return this.activeAnimations.has(animationId);
    }
    
    // 触发重大地震动画
    triggerMajorQuakeAnimation(quake) {
        if (!quake) return;
        
        // 先执行普通地震动画
        this.triggerQuakeAnimation(quake);
        
        // 添加更强烈的动画效果
        this.triggerShakeEffect(quake.magnitude);
        
        // 显示紧急警报
        this.showEmergencyAlert(quake);
    }
    
    // 触发中等地震动画
    triggerModerateQuakeAnimation(quake) {
        if (!quake) return;
        
        // 执行普通地震动画
        this.triggerQuakeAnimation(quake);
    }
    
    // 触发小型地震动画
    triggerMinorQuakeAnimation(quake) {
        if (!quake) return;
        
        // 简化版动画，只有标记点动画
        if (!this.mapContainer) return;
        
        // 计算地震位置在容器中的像素坐标
        const pixelCoords = this.getPixelCoordinates(quake.lat, quake.lng);
        if (!pixelCoords) return;
        
        // 创建小型标记点
        const marker = document.createElement('div');
        marker.className = 'quake-minor-marker';
        marker.style.cssText = `
            position: absolute;
            left: ${pixelCoords.x}px;
            top: ${pixelCoords.y}px;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #00bfff;
            box-shadow: 0 0 5px 1px rgba(0, 191, 255, 0.5);
            z-index: 100;
            pointer-events: none;
            animation: minor-pulse 1.5s ease-out forwards;
        `;
        
        // 创建动画样式
        if (!document.getElementById('minor-pulse-style')) {
            const style = document.createElement('style');
            style.id = 'minor-pulse-style';
            style.textContent = `
                @keyframes minor-pulse {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(2);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 添加到页面
        this.mapContainer.appendChild(marker);
        
        // 2秒后移除
        setTimeout(() => {
            if (this.mapContainer.contains(marker)) {
                this.mapContainer.removeChild(marker);
            }
        }, 1500);
    }
    
    // 触发震动效果
    triggerShakeEffect(magnitude) {
        if (!this.mapContainer) return;
        
        // 更强的震动效果
        const intensity = Math.min(10, Math.max(1, Math.floor(magnitude) + 2));
        const shakeDuration = Math.min(2000, Math.max(500, magnitude * 150));
        
        // 保存原始位置
        const originalTransform = this.mapContainer.style.transform || '';
        
        // 震动动画
        let startTime;
        const shake = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            
            if (elapsed < shakeDuration) {
                // 计算震动位移
                const progress = elapsed / shakeDuration;
                const decay = 1 - progress;
                const displacement = intensity * decay;
                
                // 随机位移
                const x = (Math.random() - 0.5) * displacement;
                const y = (Math.random() - 0.5) * displacement;
                
                this.mapContainer.style.transform = `${originalTransform} translate(${x}px, ${y}px)`;
                requestAnimationFrame(shake);
            } else {
                // 恢复原始位置
                this.mapContainer.style.transform = originalTransform;
            }
        };
        
        requestAnimationFrame(shake);
    }
    
    // 显示紧急地震速报 - 与jquake完全一致
    showEmergencyAlert(quake) {
        // 创建警报元素
        const alertElement = document.createElement('div');
        alertElement.className = 'emergency-alert';
        alertElement.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff0000;
            color: white;
            padding: 15px 25px;
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            z-index: 2000;
            border: 2px solid #ffffff;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
            animation: emergency-flash 0.5s infinite alternate, emergency-slide-in 0.5s ease-out;
            font-family: 'MS Gothic', sans-serif;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            white-space: nowrap;
        `;
        
        // 创建动画样式
        if (!document.getElementById('emergency-alert-style')) {
            const style = document.createElement('style');
            style.id = 'emergency-alert-style';
            style.textContent = `
                @keyframes emergency-flash {
                    0% {
                        background-color: #ff0000;
                        box-shadow: 0 0 20px rgba(255, 0, 0, 0.8);
                    }
                    100% {
                        background-color: #ff4444;
                        box-shadow: 0 0 30px rgba(255, 0, 0, 1);
                    }
                }
                
                @keyframes emergency-slide-in {
                    0% {
                        transform: translateX(-50%) translateY(-100%);
                        opacity: 0;
                    }
                    100% {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes emergency-slide-out {
                    0% {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(-50%) translateY(-100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 设置警报内容 - 与jquake格式一致
        const magnitude = quake.magnitude.toFixed(1);
        const location = quake.location || quake.locationZh || '未知位置';
        alertElement.innerHTML = `⚠️ <span style="font-size: 24px;">緊急地震速報</span><br>M${magnitude}  ${location} で地震が発生しました`;
        
        // 添加到页面
        document.body.appendChild(alertElement);
        
        // 播放警报声音
        this.playAlertSound();
        
        // 触发全屏震动效果
        this.triggerFullscreenShake(quake.magnitude);
        
        // 5秒后移除
        setTimeout(() => {
            if (document.body.contains(alertElement)) {
                // 添加退出动画
                alertElement.style.animation = 'emergency-slide-out 0.5s ease-in forwards';
                setTimeout(() => {
                    if (document.body.contains(alertElement)) {
                        document.body.removeChild(alertElement);
                    }
                }, 500);
            }
        }, 5000);
    }
    
    // 播放警报声音 - 与jquake一致
    playAlertSound() {
        try {
            // 创建音频上下文
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 生成警报声音
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 设置警报声音参数
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        } catch (error) {
            console.error('播放警报声音失败:', error);
        }
    }
    
    // 触发全屏震动效果 - 与jquake一致
    triggerFullscreenShake(magnitude) {
        // 计算震动强度和持续时间
        const intensity = Math.min(10, Math.max(3, Math.floor(magnitude) + 2));
        const duration = Math.min(3000, Math.max(500, magnitude * 200));
        
        // 添加震动类到body
        document.body.classList.add('shake-active');
        
        // 设置震动样式
        document.body.style.cssText += `
            animation: fullscreen-shake ${duration}ms ease-in-out;
        `;
        
        // 创建震动动画样式
        if (!document.getElementById('fullscreen-shake-style')) {
            const style = document.createElement('style');
            style.id = 'fullscreen-shake-style';
            style.textContent = `
                @keyframes fullscreen-shake {
                    0%, 100% { transform: translateX(0) translateY(0); }
                    10% { transform: translateX(-${intensity}px) translateY(-${intensity}px); }
                    20% { transform: translateX(${intensity}px) translateY(${intensity}px); }
                    30% { transform: translateX(-${intensity}px) translateY(${intensity}px); }
                    40% { transform: translateX(${intensity}px) translateY(-${intensity}px); }
                    50% { transform: translateX(-${intensity}px) translateY(-${intensity}px); }
                    60% { transform: translateX(${intensity}px) translateY(${intensity}px); }
                    70% { transform: translateX(-${intensity}px) translateY(${intensity}px); }
                    80% { transform: translateX(${intensity}px) translateY(-${intensity}px); }
                    90% { transform: translateX(-${intensity}px) translateY(-${intensity}px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 动画结束后移除震动类和样式
        setTimeout(() => {
            document.body.classList.remove('shake-active');
            document.body.style.removeProperty('animation');
        }, duration);
    }
}

// 导出类
window.AnimationManager = AnimationManager;
