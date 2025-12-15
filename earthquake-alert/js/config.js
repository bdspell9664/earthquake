// 应用配置文件
const config = {
    // API配置
    api: {
        jma_quake: {
            endpoint: 'https://www.jma.go.jp/bosai/quake',
            listUrl: 'https://www.jma.go.jp/bosai/quake/data/list.json',
            detailUrl: 'https://www.jma.go.jp/bosai/quake/data/',
            interval: 5000, // 5秒更新一次，实现实时不间断更新
            timeout: 10000,
            retryAttempts: 3
        },
        p2pquake: {
            endpoint: 'https://api.p2pquake.net/v2/history?codes=551',
            interval: 10000, // 10秒更新一次
            timeout: 10000
        },
        jma_vol: {
            endpoint: 'https://www.data.jma.go.jp/developer/xml/feed/eqvol.xml',
            interval: 60000 // 1分钟更新一次
        }
    },
    
    // 地图配置 - 与jquake一致
    map: {
        defaultZoom: 2,
        defaultCenter: { lat: 35, lng: 135 }, // 日本附近
        maxZoom: 8,
        minZoom: 1,
        animationDuration: 1000,
        showSeismometers: true,
        seismometerDensity: 0.8,
        backgroundStyle: 'jquake-dark' // 使用与jquake一致的深色主题
    },
    
    // 地震标记配置 - 与jquake一致
    markers: {
        minSize: 4,
        maxSize: 35,
        colorScale: {
            0: '#4caf50',  // M0-2 浅绿色
            2: '#8bc34a',  // M2-3 绿色
            3: '#cddc39',  // M3-4 黄绿色
            4: '#ffeb3b',  // M4-5 黄色
            5: '#ff9800',  // M5-6 橙色
            6: '#ff5722',  // M6-7 深橙色
            7: '#f44336',  // M7+ 红色
            8: '#d32f2f'   // M8+ 深红色
        },
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        showLabels: true
    },
    
    // 动画配置 - 与jquake一致
    animation: {
        alertDuration: 5000,
        pulseDuration: 2000,
        fadeInDuration: 300,
        fadeOutDuration: 1000,
        waveDuration: 3000,
        shakeDuration: 2000,
        showWaveEffect: true,
        showShakeEffect: true,
        showAlertAnimation: true,
        enableAlertSound: true,
        alertSoundUrl: 'audio/alert.mp3',
        notificationSoundUrl: 'audio/notification.mp3'
    },
    
    // 地震速报配置
    earthquakeAlert: {
        enableEmergencyAlert: true,
        emergencyThreshold: 5.0,
        alertDisplayDuration: 10000,
        showIntensityMap: true
    },
    
    // 模拟配置
    simulation: {
        defaultLocations: {
            tokyo: { lat: 35.6895, lng: 139.6917 },
            osaka: { lat: 34.6937, lng: 135.5023 },
            sapporo: { lat: 43.0618, lng: 141.3545 },
            fukuoka: { lat: 33.5904, lng: 130.4017 },
            Sendai: { lat: 38.2689, lng: 140.8721 },
            Nagoya: { lat: 35.1815, lng: 136.9066 },
            Kyoto: { lat: 35.0116, lng: 135.7681 }
        },
        shakingIntensity: {
            1: 0.05,
            2: 0.1,
            3: 0.2,
            4: 0.4,
            5: 0.6,
            6: 0.8,
            7: 1.0,
            8: 1.3,
            9: 1.6,
            10: 2.0
        },
        defaultMagnitudeRange: [3.0, 7.0],
        defaultDepthRange: [10, 100]
    },
    
    // 数据配置 - 实时不间断更新
    data: {
        maxQuakesToShow: 100,
        refreshInterval: 1000, // 1秒刷新一次，实现实时不间断更新
        cacheDuration: 30000, // 缓存时间30秒
        enableIncrementalUpdate: true,
        maxHistoryDays: 7
    },
    
    // 界面配置 - 与jquake一致
    ui: {
        darkMode: true,
        showAnimation: true,
        showLabels: true,
        autoZoomOnMajorQuake: true,
        majorQuakeThreshold: 5.0, // 视为重大地震的震级阈值
        showMaxAcceleration: true,
        showIntensity: true,
        showDepth: true,
        showSource: true,
        listStyle: 'jquake-compact', // 紧凑列表样式
        showStatusBar: true,
        statusBarPosition: 'bottom'
    },
    
    // 语言配置
    language: {
        default: 'ja',
        available: ['ja', 'zh', 'en'],
        showOriginalLanguage: true, // 显示地震国原语言
        autoDetect: true
    }
};

// 导出配置
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = config;
}

// 暴露到window对象，供浏览器使用
window.config = config;