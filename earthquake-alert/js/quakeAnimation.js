// 地震速报动画模块 - 与jquake一致
class EarthquakeAnimation {
    constructor(config) {
        this.config = config;
        this.alertElement = null;
        this.emergencyAlertElement = null;
        this.waveAnimations = new Map();
        this.activeAnimations = new Map();
        this.isAnimating = false;
        this.isEmergencyAlert = false;
        this.audioContext = null;
        
        this.initAlertElements();
        this.initAudioContext();
    }
    
    // 初始化警报元素 - 与jquake一致
    initAlertElements() {
        // 创建普通警报动画元素
        this.alertElement = document.createElement('div');
        this.alertElement.className = 'alert-animation jquake-style';
        this.alertElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s ease;
            pointer-events: none;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        `;
        document.body.appendChild(this.alertElement);
        
        // 创建紧急地震速报元素 - 与jquake一致
        this.emergencyAlertElement = document.createElement('div');
        this.emergencyAlertElement.className = 'emergency-alert-animation jquake-style';
        this.emergencyAlertElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.3);
            color: red;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            opacity: 0;
            pointer-events: none;
            font-family: 'MS Gothic', sans-serif;
        `;
        
        // 添加紧急地震速报标题
        const emergencyTitle = document.createElement('div');
        emergencyTitle.style.cssText = `
            font-size: 48px;
            font-weight: bold;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            margin-bottom: 20px;
            animation: blink 0.5s infinite alternate;
        `;
        emergencyTitle.textContent = '緊急地震速報';
        
        // 添加紧急地震速报内容
        const emergencyContent = document.createElement('div');
        emergencyContent.className = 'emergency-content';
        emergencyContent.style.cssText = `
            font-size: 24px;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px 40px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.8);
        `;
        
        this.emergencyAlertElement.appendChild(emergencyTitle);
        this.emergencyAlertElement.appendChild(emergencyContent);
        document.body.appendChild(this.emergencyAlertElement);
        
        // 添加CSS动画样式
        this.addCSSAnimations();
    }
    
    // 初始化音频上下文
    initAudioContext() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }
        } catch (error) {
            console.warn('无法初始化音频上下文:', error);
        }
    }
    
    // 添加CSS动画样式 - 与jquake一致
    addCSSAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            /* 脉冲动画 - 与jquake一致 */
            @keyframes pulse {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(3);
                    opacity: 0;
                }
            }
            
            /* 紧急警报闪烁动画 */
            @keyframes blink {
                0% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            
            /* 地震波扩散动画 - 与jquake一致 */
            @keyframes wave {
                0% {
                    transform: translate(-50%, -50%) scale(1);
                    opacity: 0.8;
                }
                100% {
                    transform: translate(-50%, -50%) scale(10);
                    opacity: 0;
                }
            }
            
            /* 震动动画 - 与jquake一致 */
            @keyframes shake {
                0%, 100% { transform: translate(0, 0); }
                10% { transform: translate(-1px, -2px); }
                20% { transform: translate(1px, 2px); }
                30% { transform: translate(-1px, -2px); }
                40% { transform: translate(1px, 2px); }
                50% { transform: translate(-1px, -2px); }
                60% { transform: translate(1px, 2px); }
                70% { transform: translate(-1px, -2px); }
                80% { transform: translate(1px, 2px); }
                90% { transform: translate(-1px, -2px); }
            }
            
            /* 紧急警报背景闪烁 */
            @keyframes emergencyFlash {
                0%, 100% { background-color: rgba(255, 0, 0, 0.3); }
                50% { background-color: rgba(255, 0, 0, 0.1); }
            }
            
            /* 文字滚动动画 */
            @keyframes scroll {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 显示地震速报动画 - 与jquake一致
    showQuakeAlert(quake) {
        if (!this.config.ui.showAnimation) return;
        
        // 根据震级决定警报类型
        if (quake.magnitude >= this.config.earthquakeAlert.emergencyThreshold) {
            this.showEmergencyAlert(quake);
        } else {
            this.showNormalAlert(quake);
        }
        
        // 播放声音效果（如果支持）
        this.playAlertSound(quake.magnitude);
        
        // 触发震动效果
        this.triggerShakeEffect(quake.magnitude);
    }
    
    // 显示普通地震警报
    showNormalAlert(quake) {
        // 构建警报消息
        const alertMessage = this.buildAlertMessage(quake);
        this.alertElement.innerHTML = alertMessage;
        
        // 显示警报
        this.alertElement.style.opacity = '1';
        this.alertElement.style.transform = 'translate(-50%, -50%) scale(1)';
        this.isAnimating = true;
        
        // 设置自动隐藏
        setTimeout(() => {
            this.hideNormalAlert();
        }, this.config.animation.alertDuration);
    }
    
    // 显示紧急地震速报 - 与jquake一致
    showEmergencyAlert(quake) {
        this.isEmergencyAlert = true;
        
        // 构建紧急警报消息
        const emergencyMessage = this.buildEmergencyAlertMessage(quake);
        const contentElement = this.emergencyAlertElement.querySelector('.emergency-content');
        contentElement.innerHTML = emergencyMessage;
        
        // 显示紧急警报
        this.emergencyAlertElement.style.opacity = '1';
        this.emergencyAlertElement.style.animation = 'emergencyFlash 1s infinite alternate';
        this.isAnimating = true;
        
        // 设置自动隐藏
        setTimeout(() => {
            this.hideEmergencyAlert();
        }, this.config.earthquakeAlert.alertDisplayDuration);
    }
    
    // 隐藏普通地震警报
    hideNormalAlert() {
        this.alertElement.style.opacity = '0';
        this.alertElement.style.transform = 'translate(-50%, -50%) scale(0.9)';
        setTimeout(() => {
            this.isAnimating = false;
        }, 300);
    }
    
    // 隐藏紧急地震速报
    hideEmergencyAlert() {
        this.emergencyAlertElement.style.opacity = '0';
        this.emergencyAlertElement.style.animation = '';
        setTimeout(() => {
            this.isAnimating = false;
            this.isEmergencyAlert = false;
        }, 300);
    }
    
    // 隐藏所有警报
    hideAllAlerts() {
        this.hideNormalAlert();
        this.hideEmergencyAlert();
    }
    
    // 构建警报消息 - 与jquake一致
    buildAlertMessage(quake) {
        // 根据震级决定警报级别
        let alertLevel = '';
        if (quake.magnitude >= 7.0) {
            alertLevel = '<span style="color: red; font-weight: bold;">【紧急地震速报】</span>';
        } else if (quake.magnitude >= 5.0) {
            alertLevel = '<span style="color: orange; font-weight: bold;">【地震速报】</span>';
        } else {
            alertLevel = '<span style="color: yellow; font-weight: bold;">【地震情报】</span>';
        }
        
        // 格式化时间
        const timeStr = this.formatTime(quake.time);
        
        // 构建完整消息
        return `
            ${alertLevel}<br>
            <strong>${timeStr}</strong><br>
            <div style="margin: 10px 0;">
                ${quake.locationOriginal}<br>
                ${quake.locationZh || quake.location}
            </div>
            <div style="display: flex; gap: 20px;">
                <span>震级: <strong>M${quake.magnitude}</strong></span>
                <span>深度: <strong>${quake.depth}km</strong></span>
                ${quake.intensity > 0 ? `<span>最大震度: <strong>${quake.intensity}</strong></span>` : ''}
            </div>
        `;
    }
    
    // 构建紧急地震速报消息 - 与jquake一致
    buildEmergencyAlertMessage(quake) {
        // 格式化时间
        const timeStr = this.formatTime(quake.time);
        
        // 构建紧急警报消息
        return `
            <div style="margin: 10px 0;">
                ${quake.locationOriginal}<br>
                ${quake.locationZh || quake.location}
            </div>
            <div style="font-size: 28px; margin: 15px 0;">
                <strong>M${quake.magnitude}</strong>
            </div>
            <div style="display: flex; gap: 20px; margin: 15px 0;">
                <span>発生時間: <strong>${timeStr}</strong></span>
                <span>深さ: <strong>${quake.depth}km</strong></span>
            </div>
            <div style="color: red; font-size: 20px; margin-top: 20px;">
                <strong>注意: 強い揺れに警戒してください！</strong>
            </div>
        `;
    }
    
    // 格式化时间
    formatTime(timeStr) {
        const date = new Date(timeStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }
    
    // 播放警报声音 - 与jquake一致
    playAlertSound(magnitude) {
        if (!this.config.animation.enableAlertSound || !this.audioContext) return;
        
        try {
            // 恢复音频上下文（如果被暂停）
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // 根据震级决定警报音类型
            if (magnitude >= this.config.earthquakeAlert.emergencyThreshold) {
                this.playEmergencyAlertSound();
            } else {
                this.playNormalAlertSound();
            }
            
        } catch (error) {
            console.warn('无法播放警报声音:', error);
        }
    }
    
    // 播放普通警报声音
    playNormalAlertSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 连接节点
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 设置警报声音参数 - 与jquake一致
        oscillator.type = 'sine';
        
        // 警报声音模式：双音调
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.2); // E5
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime + 0.4); // C5
        
        // 音量控制
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);
        
        // 播放声音
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.0);
    }
    
    // 播放紧急警报声音 - 与jquake一致
    playEmergencyAlertSound() {
        // 紧急警报音：三个上升音调，模仿jquake
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'square'; // 方波，更尖锐的声音
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                
                // 音量控制
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.1);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                
                // 播放声音
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.5);
            }, index * 200);
        });
    }
    
    // 触发震动效果 - 与jquake一致
    triggerShakeEffect(magnitude) {
        // 根据震级确定震动强度和持续时间
        const intensity = Math.min(magnitude / 10, 1);
        const duration = Math.min(magnitude * 150, 2000); // 最长2秒
        
        // 使用CSS动画实现震动效果
        document.body.style.animation = `shake ${duration}ms ease-in-out`;
        document.body.classList.add('shaking');
        
        // 设置震动强度
        document.body.style.setProperty('--shake-intensity', `${intensity}`);
        
        // 动画结束后移除类
        setTimeout(() => {
            document.body.classList.remove('shaking');
            document.body.style.animation = '';
        }, duration);
    }
    
    // 触发地震波扩散效果 - 与jquake一致
    triggerWaveEffect(quake, marker) {
        if (!this.config.animation.showWaveEffect || !marker) return;
        
        // 获取标记位置
        const rect = marker.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // 创建地震波元素
        const wave = document.createElement('div');
        wave.className = 'earthquake-wave';
        wave.style.cssText = `
            position: fixed;
            left: ${centerX}px;
            top: ${centerY}px;
            transform: translate(-50%, -50%);
            border: 3px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999;
            animation: wave ${this.config.animation.waveDuration}ms ease-out;
        `;
        
        // 根据震级设置波的大小
        const maxWaveSize = Math.max(window.innerWidth, window.innerHeight) * 0.5;
        const waveSize = maxWaveSize * (quake.magnitude / 10);
        wave.style.width = `${waveSize}px`;
        wave.style.height = `${waveSize}px`;
        
        // 添加到文档
        document.body.appendChild(wave);
        
        // 动画结束后移除
        setTimeout(() => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        }, this.config.animation.waveDuration);
        
        // 存储动画引用
        this.waveAnimations.set(quake.id, wave);
    }
    
    // 为地震标记添加动画 - 与jquake一致
    animateMarker(marker, quake) {
        if (!marker || !this.config.ui.showAnimation) return;
        
        // 检查是否已有动画在运行
        if (this.activeAnimations.has(quake.id)) {
            return;
        }
        
        // 获取实际的标记元素（如果是容器的话）
        const actualMarker = marker.querySelector('.earthquake-marker') || marker;
        
        // 保存原始样式
        const originalStyle = {
            opacity: actualMarker.style.opacity,
            transform: actualMarker.style.transform,
            boxShadow: actualMarker.style.boxShadow
        };
        
        // 创建入场动画 - 与jquake一致
        actualMarker.style.opacity = '0';
        actualMarker.style.transform = 'translate(-50%, -50%) scale(0)';
        actualMarker.style.transition = `opacity ${this.config.animation.fadeInDuration}ms ease-out, transform ${this.config.animation.fadeInDuration}ms ease-out, box-shadow ${this.config.animation.fadeInDuration}ms ease-out`;
        
        setTimeout(() => {
            actualMarker.style.opacity = '0.85';
            actualMarker.style.transform = 'translate(-50%, -50%) scale(1)';
            actualMarker.style.boxShadow = `0 0 ${actualMarker.offsetWidth * 0.5}px ${actualMarker.style.backgroundColor}`;
        }, 10);
        
        // 添加脉冲动画
        const pulseAnimation = this.createPulseAnimation(actualMarker);
        
        // 触发地震波扩散效果
        setTimeout(() => {
            this.triggerWaveEffect(quake, actualMarker);
        }, this.config.animation.fadeInDuration / 2);
        
        // 添加到活跃动画列表
        this.activeAnimations.set(quake.id, {
            marker: actualMarker,
            container: marker,
            animation: pulseAnimation,
            originalStyle: originalStyle
        });
    }
    
    // 创建脉冲动画 - 与jquake一致
    createPulseAnimation(marker) {
        // 创建脉冲元素容器
        const pulseContainer = document.createElement('div');
        pulseContainer.className = 'quake-pulse-container';
        pulseContainer.style.position = 'absolute';
        pulseContainer.style.left = '50%';
        pulseContainer.style.top = '50%';
        pulseContainer.style.transform = 'translate(-50%, -50%)';
        pulseContainer.style.pointerEvents = 'none';
        
        // 获取标记大小和颜色
        const markerRect = marker.getBoundingClientRect();
        const diameter = Math.max(markerRect.width, markerRect.height);
        const color = marker.style.backgroundColor;
        
        // 创建多层脉冲效果
        const pulseCount = 3;
        for (let i = 0; i < pulseCount; i++) {
            const pulse = document.createElement('div');
            pulse.className = 'quake-pulse';
            pulse.style.position = 'absolute';
            pulse.style.left = '50%';
            pulse.style.top = '50%';
            pulse.style.transform = 'translate(-50%, -50%) scale(0)';
            pulse.style.borderRadius = '50%';
            pulse.style.border = `2px solid ${color}`;
            pulse.style.opacity = '0.7';
            pulse.style.pointerEvents = 'none';
            pulse.style.boxSizing = 'border-box';
            
            // 设置脉冲大小和延迟
            pulse.style.width = `${diameter * 2}px`;
            pulse.style.height = `${diameter * 2}px`;
            pulse.style.animation = `pulse ${this.config.animation.pulseDuration}ms ease-out ${i * 300}ms infinite`;
            
            pulseContainer.appendChild(pulse);
        }
        
        // 添加到标记父元素
        if (marker.parentNode) {
            marker.parentNode.appendChild(pulseContainer);
        }
        
        return pulseContainer;
    }
    
    // 停止特定地震的动画
    stopAnimation(quakeId) {
        // 停止标记动画
        if (this.activeAnimations.has(quakeId)) {
            const animationInfo = this.activeAnimations.get(quakeId);
            const marker = animationInfo.marker;
            
            // 恢复原始样式
            marker.style.opacity = animationInfo.originalStyle.opacity || '0.85';
            marker.style.transform = animationInfo.originalStyle.transform || 'translate(-50%, -50%) scale(1)';
            marker.style.boxShadow = animationInfo.originalStyle.boxShadow || '';
            marker.style.transition = '';
            
            // 移除脉冲元素容器
            if (animationInfo.animation && animationInfo.animation.parentNode) {
                animationInfo.animation.parentNode.removeChild(animationInfo.animation);
            }
            
            // 从活跃动画列表中移除
            this.activeAnimations.delete(quakeId);
        }
        
        // 停止地震波动画
        if (this.waveAnimations.has(quakeId)) {
            const wave = this.waveAnimations.get(quakeId);
            if (wave && wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
            this.waveAnimations.delete(quakeId);
        }
    }
    
    // 停止所有动画
    stopAllAnimations() {
        // 停止所有标记动画
        for (const [quakeId] of this.activeAnimations) {
            this.stopAnimation(quakeId);
        }
        
        // 停止所有地震波动画
        for (const [quakeId] of this.waveAnimations) {
            const wave = this.waveAnimations.get(quakeId);
            if (wave && wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        }
        this.waveAnimations.clear();
        
        // 隐藏所有警报
        this.hideAllAlerts();
        
        // 停止震动效果
        document.body.classList.remove('shaking');
        document.body.style.animation = '';
        
        // 重置动画状态
        this.isAnimating = false;
        this.isEmergencyAlert = false;
    }
    
    // 检查是否有动画在运行
    hasActiveAnimations() {
        return this.isAnimating || this.activeAnimations.size > 0;
    }
    
    // 获取活跃动画数量
    getActiveAnimationsCount() {
        return this.activeAnimations.size;
    }
    
    // 为重大地震添加特殊动画
    animateMajorQuake(quake, marker) {
        // 先显示普通警报
        this.showQuakeAlert(quake);
        
        // 如果有标记，添加更强烈的动画
        if (marker) {
            // 闪烁效果
            marker.style.transition = 'opacity 0.2s ease-in-out';
            
            let blinkCount = 0;
            const maxBlinks = 5;
            
            const blinkInterval = setInterval(() => {
                marker.style.opacity = marker.style.opacity === '1' ? '0.5' : '1';
                blinkCount++;
                
                if (blinkCount >= maxBlinks * 2) {
                    clearInterval(blinkInterval);
                    marker.style.opacity = '0.8';
                    marker.style.transition = '';
                }
            }, 200);
            
            // 添加到活跃动画列表
            this.activeAnimations.set(`${quake.id}_major`, {
                marker: marker,
                animation: blinkInterval,
                originalStyle: { opacity: marker.style.opacity, transform: marker.style.transform }
            });
        }
    }
    
    // 为地震列表项添加高亮动画
    highlightQuakeItem(element, duration = 1000) {
        if (!element) return;
        
        // 保存原始背景色
        const originalBg = element.style.backgroundColor;
        
        // 添加高亮效果
        element.style.backgroundColor = '#333366';
        element.style.transition = `background-color ${duration}ms ease-out`;
        
        // 恢复原始样式
        setTimeout(() => {
            element.style.backgroundColor = originalBg || '';
            element.style.transition = '';
        }, duration);
    }
    
    // 屏幕边缘警告效果
    showEdgeWarning(direction) {
        const warning = document.createElement('div');
        warning.className = 'edge-warning';
        warning.style.position = 'fixed';
        warning.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        warning.style.color = 'white';
        warning.style.padding = '10px';
        warning.style.fontSize = '14px';
        warning.style.zIndex = '1000';
        warning.style.transition = 'opacity 0.3s ease';
        warning.textContent = `地震位于屏幕${this.getDirectionText(direction)}`;
        
        // 设置位置
        switch (direction) {
            case 'north':
                warning.style.top = '0';
                warning.style.left = '50%';
                warning.style.transform = 'translateX(-50%)';
                break;
            case 'south':
                warning.style.bottom = '0';
                warning.style.left = '50%';
                warning.style.transform = 'translateX(-50%)';
                break;
            case 'east':
                warning.style.top = '50%';
                warning.style.right = '0';
                warning.style.transform = 'translateY(-50%)';
                break;
            case 'west':
                warning.style.top = '50%';
                warning.style.left = '0';
                warning.style.transform = 'translateY(-50%)';
                break;
        }
        
        document.body.appendChild(warning);
        
        // 自动移除
        setTimeout(() => {
            warning.style.opacity = '0';
            setTimeout(() => {
                if (warning.parentNode) {
                    warning.parentNode.removeChild(warning);
                }
            }, 300);
        }, 2000);
    }
    
    // 获取方向文本
    getDirectionText(direction) {
        const directions = {
            north: '北部以外',
            south: '南部以外',
            east: '东部以外',
            west: '西部以外'
        };
        return directions[direction] || '';
    }
}

// 创建动画实例
let earthquakeAnimation;

function initAnimation() {
    earthquakeAnimation = new EarthquakeAnimation(config);
    return earthquakeAnimation;
}