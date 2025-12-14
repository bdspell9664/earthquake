// 地图处理模块
class EarthquakeMap {
    constructor(mapElement, config) {
        this.mapElement = mapElement;
        this.config = config;
        this.markers = [];
        this.currentZoom = config.map.defaultZoom;
        this.currentCenter = config.map.defaultCenter;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.mapOffset = { x: 0, y: 0 };
        
        this.initMap();
        this.setupEventListeners();
    }
    
    // 初始化地图
    initMap() {
        // 设置地图容器样式
        this.mapElement.style.position = 'relative';
        this.mapElement.style.overflow = 'hidden';
        this.mapElement.style.cursor = 'grab';
        
        // 初始化地图背景 - 使用与jquake一致的离线地图UI
        this.initMapBackground();
        
        // 添加比例尺
        this.addScaleBar();
        
        // 添加图例
        this.addLegend();
        
        // 缩放级别限制
        this.mapElement.dataset.zoom = this.currentZoom;
        
        console.log('地图加载完成 - 使用离线地图UI');
    }
    
    // 初始化地图背景 - 与jquake一致
    initMapBackground() {
        // 创建背景元素容器
        this.backgroundElement = document.createElement('div');
        this.backgroundElement.className = 'map-background jquake-dark';
        this.backgroundElement.style.position = 'absolute';
        this.backgroundElement.style.top = '0';
        this.backgroundElement.style.left = '0';
        this.backgroundElement.style.width = '100%';
        this.backgroundElement.style.height = '100%';
        this.backgroundElement.style.zIndex = '0';
        this.backgroundElement.style.backgroundColor = '#0a0a0a';
        
        // 添加地图底层
        this.addMapBaseLayer();
        
        // 添加详细的日本地图轮廓
        this.addJapanMapOutline();
        
        // 添加测震点分布
        if (this.config.map.showSeismometers) {
            this.addSeismometers();
        }
        
        // 添加到地图容器
        this.mapElement.appendChild(this.backgroundElement);
    }
    
    // 添加地图底层 - 与jquake一致的深色主题
    addMapBaseLayer() {
        const baseLayer = document.createElement('div');
        baseLayer.className = 'map-base-layer';
        baseLayer.style.position = 'absolute';
        baseLayer.style.top = '0';
        baseLayer.style.left = '0';
        baseLayer.style.width = '100%';
        baseLayer.style.height = '100%';
        baseLayer.style.background = '#0a0a0a';
        baseLayer.style.backgroundImage = 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)';
        
        // 添加经纬线
        baseLayer.style.backgroundImage += ', linear-gradient(rgba(30, 30, 30, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 30, 30, 0.3) 1px, transparent 1px)';
        baseLayer.style.backgroundSize = '100% 100%, 50px 50px, 50px 50px';
        
        this.backgroundElement.appendChild(baseLayer);
    }
    
    // 添加详细的日本地图轮廓 - 与jquake一致
    addJapanMapOutline() {
        const japanLayer = document.createElement('div');
        japanLayer.className = 'japan-map-outline';
        japanLayer.style.position = 'absolute';
        japanLayer.style.top = '0';
        japanLayer.style.left = '0';
        japanLayer.style.width = '100%';
        japanLayer.style.height = '100%';
        
        // 使用SVG路径绘制日本地图轮廓
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 1000 600');
        svg.style.opacity = '0.7';
        
        // 简化的日本地图路径
        const japanPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        japanPath.setAttribute('d', 'M350,200 L400,180 L450,190 L500,210 L550,230 L600,250 L620,280 L630,320 L620,350 L600,380 L580,400 L550,420 L520,430 L480,430 L450,420 L420,400 L400,380 L380,350 L370,320 L360,280 L350,250 Z');
        japanPath.setAttribute('fill', '#1a2a3a');
        japanPath.setAttribute('stroke', '#3a4a5a');
        japanPath.setAttribute('stroke-width', '2');
        
        // 添加主要岛屿
        const hokkaidoPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hokkaidoPath.setAttribute('d', 'M480,120 L520,100 L560,110 L580,130 L570,160 L540,180 L500,170 L460,150 L450,130 Z');
        hokkaidoPath.setAttribute('fill', '#1a2a3a');
        hokkaidoPath.setAttribute('stroke', '#3a4a5a');
        hokkaidoPath.setAttribute('stroke-width', '1');
        
        const kyushuPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        kyushuPath.setAttribute('d', 'M420,450 L450,440 L480,450 L500,470 L480,500 L450,510 L420,500 L400,480 Z');
        kyushuPath.setAttribute('fill', '#1a2a3a');
        kyushuPath.setAttribute('stroke', '#3a4a5a');
        kyushuPath.setAttribute('stroke-width', '1');
        
        const shikokuPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        shikokuPath.setAttribute('d', 'M460,390 L480,380 L500,390 L510,410 L490,430 L470,420 L450,410 Z');
        shikokuPath.setAttribute('fill', '#1a2a3a');
        shikokuPath.setAttribute('stroke', '#3a4a5a');
        shikokuPath.setAttribute('stroke-width', '1');
        
        svg.appendChild(japanPath);
        svg.appendChild(hokkaidoPath);
        svg.appendChild(kyushuPath);
        svg.appendChild(shikokuPath);
        
        japanLayer.appendChild(svg);
        this.backgroundElement.appendChild(japanLayer);
    }
    
    // 添加测震点分布 - 与jquake一致
    addSeismometers() {
        const seismometerLayer = document.createElement('div');
        seismometerLayer.className = 'seismometer-layer';
        seismometerLayer.style.position = 'absolute';
        seismometerLayer.style.top = '0';
        seismometerLayer.style.left = '0';
        seismometerLayer.style.width = '100%';
        seismometerLayer.style.height = '100%';
        seismometerLayer.style.zIndex = '1';
        
        // 生成测震点 - 主要集中在日本地区
        const seismometerCount = 200;
        
        for (let i = 0; i < seismometerCount; i++) {
            const seismometer = document.createElement('div');
            seismometer.className = 'seismometer';
            
            // 随机位置，主要集中在日本附近
            const lat = 30 + Math.random() * 20;
            const lng = 125 + Math.random() * 20;
            
            const position = this.coordinatesToPixel(lat, lng);
            
            seismometer.style.position = 'absolute';
            seismometer.style.left = `${position.x}px`;
            seismometer.style.top = `${position.y}px`;
            seismometer.style.width = '2px';
            seismometer.style.height = '2px';
            seismometer.style.backgroundColor = '#0080ff';
            seismometer.style.borderRadius = '50%';
            seismometer.style.opacity = '0.6';
            seismometer.style.boxShadow = '0 0 3px #0080ff';
            
            seismometerLayer.appendChild(seismometer);
        }
        
        this.backgroundElement.appendChild(seismometerLayer);
        console.log('已添加测震点分布，与jquake一致');
    }
    
    // 添加网格（备用方案）
    addGrid() {
        const grid = document.createElement('div');
        grid.className = 'map-grid';
        grid.style.position = 'absolute';
        grid.style.top = '0';
        grid.style.left = '0';
        grid.style.width = '100%';
        grid.style.height = '100%';
        grid.style.backgroundImage = 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)';
        grid.style.backgroundSize = '20px 20px';
        
        this.backgroundElement.appendChild(grid);
    }
    
    // 添加比例尺
    addScaleBar() {
        const scaleBar = document.createElement('div');
        scaleBar.className = 'map-scale-bar';
        scaleBar.style.position = 'absolute';
        scaleBar.style.bottom = '20px';
        scaleBar.style.left = '20px';
        scaleBar.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        scaleBar.style.color = 'white';
        scaleBar.style.padding = '5px 10px';
        scaleBar.style.borderRadius = '3px';
        scaleBar.style.fontSize = '12px';
        scaleBar.style.zIndex = '10';
        
        // 比例尺HTML结构
        scaleBar.innerHTML = `
            <div class="scale-label">比例尺:</div>
            <div class="scale-line">
                <div class="scale-tick" style="left: 0%;"></div>
                <div class="scale-tick" style="left: 50%;"></div>
                <div class="scale-tick" style="left: 100%;"></div>
            </div>
            <div class="scale-labels">
                <span>0</span>
                <span>500km</span>
                <span>1000km</span>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .map-scale-bar .scale-line {
                position: relative;
                width: 100px;
                height: 2px;
                background: white;
                margin: 3px 0;
            }
            .map-scale-bar .scale-tick {
                position: absolute;
                width: 1px;
                height: 6px;
                background: white;
                top: -2px;
            }
            .map-scale-bar .scale-labels {
                display: flex;
                justify-content: space-between;
                width: 100px;
                font-size: 10px;
            }
        `;
        scaleBar.appendChild(style);
        
        this.mapElement.appendChild(scaleBar);
    },
    
    // 添加图例
    addLegend() {
        const legend = document.createElement('div');
        legend.className = 'map-legend';
        legend.style.position = 'absolute';
        legend.style.top = '20px';
        legend.style.right = '20px';
        legend.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        legend.style.color = 'white';
        legend.style.padding = '10px';
        legend.style.borderRadius = '5px';
        legend.style.fontSize = '12px';
        legend.style.zIndex = '10';
        legend.style.minWidth = '120px';
        
        // 图例内容 - 与jquake风格一致
        legend.innerHTML = `
            <div class="legend-title">地震震级</div>
            <div class="legend-item">
                <span class="legend-marker" style="background: #4caf50; width: 16px; height: 16px;"></span>
                <span>M2.0 - 3.0</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker" style="background: #8bc34a; width: 20px; height: 20px;"></span>
                <span>M3.0 - 4.0</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker" style="background: #ff9800; width: 24px; height: 24px;"></span>
                <span>M4.0 - 5.0</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker" style="background: #ff5722; width: 28px; height: 28px;"></span>
                <span>M5.0 - 6.0</span>
            </div>
            <div class="legend-item">
                <span class="legend-marker" style="background: #f44336; width: 32px; height: 32px;"></span>
                <span>M6.0+</span>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .map-legend .legend-title {
                font-weight: bold;
                margin-bottom: 8px;
                text-align: center;
                font-size: 13px;
            }
            .map-legend .legend-item {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
            }
            .map-legend .legend-marker {
                display: inline-block;
                border-radius: 50%;
                margin-right: 8px;
                border: 1px solid rgba(255, 255, 255, 0.5);
            }
        `;
        legend.appendChild(style);
        
        this.mapElement.appendChild(legend);
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 鼠标滚轮缩放
        this.mapElement.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });
        
        // 拖拽地图
        this.mapElement.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        // 触摸屏支持
        this.mapElement.addEventListener('touchstart', (e) => this.startDrag(e.touches[0]), { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (this.isDragging && e.touches.length === 1) {
                this.drag(e.touches[0]);
                e.preventDefault();
            }
        }, { passive: false });
        document.addEventListener('touchend', () => this.stopDrag());
        
        // 双击放大
        this.mapElement.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }
    
    // 处理缩放
    handleZoom(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(this.config.map.minZoom, 
                                 Math.min(this.config.map.maxZoom, 
                                          this.currentZoom + delta));
        
        if (newZoom !== this.currentZoom) {
            this.currentZoom = newZoom;
            this.mapElement.dataset.zoom = this.currentZoom;
            
            // 调整地图背景大小
            this.updateMapTransform();
            
            // 更新所有标记大小
            this.updateMarkers();
        }
    }
    
    // 处理双击放大
    handleDoubleClick(e) {
        e.preventDefault();
        
        if (this.currentZoom < this.config.map.maxZoom) {
            this.currentZoom += 0.2;
            this.mapElement.dataset.zoom = this.currentZoom;
            
            // 以点击位置为中心缩放
            const rect = this.mapElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 调整偏移以保持点击位置相对不变
            this.mapOffset.x = x - (x - this.mapOffset.x) * (this.currentZoom / (this.currentZoom - 0.2));
            this.mapOffset.y = y - (y - this.mapOffset.y) * (this.currentZoom / (this.currentZoom - 0.2));
            
            this.updateMapTransform();
            this.updateMarkers();
        }
    }
    
    // 开始拖拽
    startDrag(e) {
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        this.mapElement.style.cursor = 'grabbing';
    }
    
    // 拖拽中
    drag(e) {
        if (!this.isDragging) return;
        
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;
        
        this.mapOffset.x += dx;
        this.mapOffset.y += dy;
        
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        
        this.updateMapTransform();
    }
    
    // 停止拖拽
    stopDrag() {
        this.isDragging = false;
        this.mapElement.style.cursor = 'grab';
    }
    
    // 更新地图变换
    updateMapTransform() {
        const scale = `scale(${this.currentZoom})`;
        const translate = `translate(${this.mapOffset.x / this.currentZoom}px, ${this.mapOffset.y / this.currentZoom}px)`;
        
        this.mapElement.style.transform = `${scale} ${translate}`;
        this.mapElement.style.transformOrigin = 'center';
        
        // 更新背景元素的变换
        if (this.backgroundElement) {
            const transform = `scale(${this.currentZoom})`;
            const children = this.backgroundElement.children;
            for (let i = 0; i < children.length; i++) {
                if (children[i].tagName.toLowerCase() === 'img') {
                    children[i].style.transform = transform;
                    children[i].style.transformOrigin = 'center center';
                    children[i].style.transition = 'transform 0.3s ease';
                }
            }
        }
    }
    
    // 添加地震标记 - 与jquake一致
    addMarker(quake) {
        // 检查是否已存在相同ID的标记
        const existingMarker = this.markers.find(m => m.id === quake.id);
        if (existingMarker) {
            this.updateMarker(existingMarker, quake);
            return existingMarker.element;
        }
        
        // 创建标记容器
        const markerContainer = document.createElement('div');
        markerContainer.className = 'earthquake-marker-container';
        markerContainer.dataset.id = quake.id;
        markerContainer.style.position = 'absolute';
        markerContainer.style.pointerEvents = 'all';
        markerContainer.style.zIndex = '10';
        
        // 设置位置
        const position = this.coordinatesToPixel(quake.lat, quake.lng);
        markerContainer.style.left = `${position.x}px`;
        markerContainer.style.top = `${position.y}px`;
        
        // 创建地震标记 - 与jquake一致的样式
        const marker = document.createElement('div');
        marker.className = 'earthquake-marker jquake-style';
        
        // 设置标记样式
        const size = this.calculateMarkerSize(quake.magnitude);
        const color = this.getMarkerColor(quake.magnitude);
        
        marker.style.width = `${size}px`;
        marker.style.height = `${size}px`;
        marker.style.backgroundColor = color;
        marker.style.borderRadius = '50%';
        marker.style.border = `${this.config.markers.borderWidth}px solid ${this.config.markers.borderColor}`;
        marker.style.opacity = '0.85';
        marker.style.boxShadow = `0 0 ${size * 0.5}px ${color}`;
        marker.style.transform = 'translate(-50%, -50%) scale(0)';
        marker.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        
        // 添加脉冲效果
        const pulse = document.createElement('div');
        pulse.className = 'earthquake-marker-pulse';
        pulse.style.position = 'absolute';
        pulse.style.left = '50%';
        pulse.style.top = '50%';
        pulse.style.width = `${size * 2}px`;
        pulse.style.height = `${size * 2}px`;
        pulse.style.border = `2px solid ${color}`;
        pulse.style.borderRadius = '50%';
        pulse.style.transform = 'translate(-50%, -50%) scale(0)';
        pulse.style.opacity = '0.6';
        pulse.style.pointerEvents = 'none';
        
        // 添加脉冲动画
        pulse.style.animation = `pulse ${this.config.animation.pulseDuration}ms infinite ease-out`;
        
        // 添加到容器
        markerContainer.appendChild(pulse);
        markerContainer.appendChild(marker);
        
        // 添加点击事件
        markerContainer.addEventListener('click', () => this.onMarkerClick(quake));
        
        // 悬停效果
        markerContainer.addEventListener('mouseover', () => {
            marker.style.opacity = '1';
            marker.style.zIndex = '20';
            marker.style.transform = `translate(-50%, -50%) scale(1.2)`;
        });
        
        markerContainer.addEventListener('mouseout', () => {
            marker.style.opacity = '0.85';
            marker.style.zIndex = '10';
            marker.style.transform = `translate(-50%, -50%) scale(1)`;
        });
        
        // 添加到地图
        this.mapElement.appendChild(markerContainer);
        
        // 触发入场动画
        setTimeout(() => {
            marker.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
        
        // 存储标记信息
        const markerInfo = {
            id: quake.id,
            element: markerContainer,
            marker: marker,
            pulse: pulse,
            quake: quake,
            size: size,
            color: color
        };
        
        this.markers.push(markerInfo);
        
        return markerContainer;
    }
    
    // 更新标记 - 适应新的标记结构
    updateMarker(markerInfo, quake) {
        // 更新地震数据
        markerInfo.quake = quake;
        
        // 更新样式
        const size = this.calculateMarkerSize(quake.magnitude);
        const color = this.getMarkerColor(quake.magnitude);
        
        // 获取标记和脉冲元素
        const marker = markerInfo.marker;
        const pulse = markerInfo.pulse;
        
        if (size !== markerInfo.size) {
            // 更新标记大小
            marker.style.width = `${size}px`;
            marker.style.height = `${size}px`;
            marker.style.boxShadow = `0 0 ${size * 0.5}px ${color}`;
            
            // 更新脉冲大小
            if (pulse) {
                pulse.style.width = `${size * 2}px`;
                pulse.style.height = `${size * 2}px`;
            }
            
            markerInfo.size = size;
        }
        
        if (color !== markerInfo.color) {
            // 更新标记颜色
            marker.style.backgroundColor = color;
            marker.style.boxShadow = `0 0 ${size * 0.5}px ${color}`;
            
            // 更新脉冲颜色
            if (pulse) {
                pulse.style.borderColor = color;
            }
            
            markerInfo.color = color;
        }
        
        // 更新位置
        const position = this.coordinatesToPixel(quake.lat, quake.lng);
        markerInfo.element.style.left = `${position.x}px`;
        markerInfo.element.style.top = `${position.y}px`;
    }
    
    // 移除标记
    removeMarker(quakeId) {
        const index = this.markers.findIndex(m => m.id === quakeId);
        if (index !== -1) {
            const markerInfo = this.markers[index];
            if (markerInfo.element && markerInfo.element.parentNode) {
                markerInfo.element.parentNode.removeChild(markerInfo.element);
            }
            this.markers.splice(index, 1);
        }
    }
    
    // 清除所有标记
    clearMarkers() {
        this.markers.forEach(markerInfo => {
            if (markerInfo.element && markerInfo.element.parentNode) {
                markerInfo.element.parentNode.removeChild(markerInfo.element);
            }
        });
        this.markers = [];
    }
    
    // 批量更新标记 - 适应新的标记结构
    updateMarkers() {
        this.markers.forEach(markerInfo => {
            // 更新位置
            const position = this.coordinatesToPixel(markerInfo.quake.lat, markerInfo.quake.lng);
            markerInfo.element.style.left = `${position.x}px`;
            markerInfo.element.style.top = `${position.y}px`;
            
            // 基于缩放级别和震级更新标记大小 - 与jquake风格一致
            const size = this.calculateMarkerSize(markerInfo.quake.magnitude);
            const adjustedSize = size * this.currentZoom;
            const finalSize = Math.max(4, adjustedSize);
            
            // 更新标记大小
            if (markerInfo.marker) {
                markerInfo.marker.style.width = `${finalSize}px`;
                markerInfo.marker.style.height = `${finalSize}px`;
                markerInfo.marker.style.boxShadow = `0 0 ${finalSize * 0.5}px ${markerInfo.color}`;
            }
            
            // 更新脉冲大小
            if (markerInfo.pulse) {
                markerInfo.pulse.style.width = `${finalSize * 2}px`;
                markerInfo.pulse.style.height = `${finalSize * 2}px`;
            }
            
            // 更新存储的大小
            markerInfo.size = finalSize;
        });
    }
    
    // 计算标记大小
    calculateMarkerSize(magnitude) {
        const minSize = this.config.markers.minSize;
        const maxSize = this.config.markers.maxSize;
        
        // 根据震级计算大小，非线性增长
        const relativeSize = Math.min(Math.max((magnitude - 2) / 7, 0), 1);
        const size = minSize + relativeSize * (maxSize - minSize);
        
        return size;
    }
    
    // 获取标记颜色 - 使用与jquake一致的颜色刻度
    getMarkerColor(magnitude) {
        const colorScale = this.config.markers.colorScale;
        
        if (magnitude >= 8) return colorScale[8];
        if (magnitude >= 7) return colorScale[7];
        if (magnitude >= 6) return colorScale[6];
        if (magnitude >= 5) return colorScale[5];
        if (magnitude >= 4) return colorScale[4];
        if (magnitude >= 3) return colorScale[3];
        if (magnitude >= 2) return colorScale[2];
        return colorScale[0];
    }
    
    // 坐标转换为像素位置
    coordinatesToPixel(lat, lng) {
        const rect = this.mapElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // 简化的地理坐标到像素坐标转换
        // 实际项目中可能需要更精确的地图投影
        const x = ((lng + 180) / 360) * width - this.mapOffset.x / this.currentZoom;
        const y = ((90 - lat) / 180) * height - this.mapOffset.y / this.currentZoom;
        
        return { x, y };
    }
    
    // 像素位置转换为坐标
    pixelToCoordinates(x, y) {
        const rect = this.mapElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        const lng = (x + this.mapOffset.x / this.currentZoom) / width * 360 - 180;
        const lat = 90 - (y + this.mapOffset.y / this.currentZoom) / height * 180;
        
        return { lat, lng };
    }
    
    // 标记点击事件处理
    onMarkerClick(quake) {
        // 触发自定义事件
        const event = new CustomEvent('markerClick', { detail: quake });
        document.dispatchEvent(event);
        
        // 可以在这里添加显示详情弹窗的逻辑
        console.log('点击了地震标记:', quake);
    }
    
    // 聚焦到指定位置
    focus(lat, lng, zoom = null) {
        if (zoom !== null) {
            this.currentZoom = Math.max(this.config.map.minZoom, 
                                       Math.min(this.config.map.maxZoom, zoom));
            this.mapElement.dataset.zoom = this.currentZoom;
        }
        
        const position = this.coordinatesToPixel(lat, lng);
        const rect = this.mapElement.getBoundingClientRect();
        
        // 计算偏移使目标位置居中
        this.mapOffset.x = position.x - rect.width / 2;
        this.mapOffset.y = position.y - rect.height / 2;
        
        this.updateMapTransform();
        this.updateMarkers();
    }
    
    // 重置地图
    reset() {
        this.currentZoom = this.config.map.defaultZoom;
        this.currentCenter = this.config.map.defaultCenter;
        this.mapOffset = { x: 0, y: 0 };
        
        this.mapElement.dataset.zoom = this.currentZoom;
        this.updateMapTransform();
        this.updateMarkers();
    }
    
    // 获取当前视图范围内的地震
    getVisibleQuakes(quakes) {
        const rect = this.mapElement.getBoundingClientRect();
        const viewport = {
            left: 0 - this.mapOffset.x / this.currentZoom,
            top: 0 - this.mapOffset.y / this.currentZoom,
            right: rect.width - this.mapOffset.x / this.currentZoom,
            bottom: rect.height - this.mapOffset.y / this.currentZoom
        };
        
        return quakes.filter(quake => {
            const position = this.coordinatesToPixel(quake.lat, quake.lng);
            return position.x >= viewport.left && 
                   position.x <= viewport.right && 
                   position.y >= viewport.top && 
                   position.y <= viewport.bottom;
        });
    }
}

// 创建地图实例
let earthquakeMap;

function initMap() {
    const mapElement = document.getElementById('earthquakeMap');
    if (mapElement) {
        earthquakeMap = new EarthquakeMap(mapElement, config);
        return earthquakeMap;
    }
    return null;
}

// 暴露到window对象，供浏览器使用
window.EarthquakeMap = EarthquakeMap;
window.earthquakeMap = earthquakeMap;
window.initMap = initMap;