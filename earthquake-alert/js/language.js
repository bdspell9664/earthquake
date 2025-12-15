// 语言处理模块 - 支持地震国原语言显示
class LanguageManager {
    constructor(config = {}) {
        // 使用配置文件中的语言设置
        this.config = config.language || {
            default: 'ja',
            available: ['ja', 'zh', 'en'],
            showOriginalLanguage: true,
            autoDetect: true
        };
        
        // 初始化支持的语言
        this.supportedLanguages = this.config.available;
        this.currentLanguage = this.config.autoDetect ? this.detectUserLanguage() : this.config.default;
        
        // 初始化翻译词典
        this.initDictionaries();
        
        // 初始化地理名称翻译
        this.locationTranslations = new Map();
        
        // 预加载一些常见位置的翻译
        this.preloadLocationTranslations();
        
        console.log('语言管理器初始化完成，当前语言:', this.currentLanguage);
    }
    
    // 检测用户语言
    detectUserLanguage() {
        const userLang = navigator.language || navigator.userLanguage;
        const langCode = userLang.split('-')[0].toLowerCase();
        
        // 检查是否支持该语言
        if (this.supportedLanguages.includes(langCode)) {
            return langCode;
        }
        
        // 默认返回配置中的默认语言
        return this.config.default;
    }
    
    // 设置当前语言
    setLanguage(languageCode) {
        if (this.supportedLanguages.includes(languageCode)) {
            this.currentLanguage = languageCode;
            console.log('语言已切换为:', languageCode);
            return true;
        }
        return false;
    }
    
    // 获取当前语言
    getLanguage() {
        return this.currentLanguage;
    }
    
    // 获取是否显示原语言
    showOriginalLanguage() {
        return this.config.showOriginalLanguage;
    }
    
    // 初始化词典 - 使用简化的语言代码
    initDictionaries() {
        this.dictionaries = {
            'zh': {
                'app.title': '全球地震速报',
                'app.subtitle': '实时监测与模拟',
                'menu.refresh': '刷新',
                'menu.simulate': '模拟地震',
                'menu.settings': '设置',
                'menu.about': '关于',
                'earthquake.magnitude': '震级',
                'earthquake.depth': '深度',
                'earthquake.time': '时间',
                'earthquake.location': '位置',
                'earthquake.intensity': '震度',
                'earthquake.details': '详细信息',
                'earthquake.original_location': '原位置',
                'simulator.title': '地震模拟器',
                'simulator.magnitude': '震级范围',
                'simulator.location': '选择位置',
                'simulator.generate': '生成模拟',
                'status.online': '在线',
                'status.offline': '离线',
                'status.updating': '更新中',
                'status.error': '错误',
                'notification.new_earthquake': '检测到新地震',
                'notification.update_failed': '数据更新失败',
                'notification.connection_restored': '连接已恢复',
                'loading': '加载中...',
                'unit.km': '公里',
                'unit.magnitude': '级',
                'time.just_now': '刚刚',
                'time.minutes_ago': '分钟前',
                'time.hours_ago': '小时前',
                'emergency.alert': '紧急地震速报',
                'emergency.attention': '注意',
                'emergency.warning': '警报'
            },
            'ja': {
                'app.title': '世界地震速報',
                'app.subtitle': 'リアルタイムモニタリング',
                'menu.refresh': '更新',
                'menu.simulate': '地震シミュレート',
                'menu.settings': '設定',
                'menu.about': 'について',
                'earthquake.magnitude': 'マグニチュード',
                'earthquake.depth': '深さ',
                'earthquake.time': '時間',
                'earthquake.location': '位置',
                'earthquake.intensity': '震度',
                'earthquake.details': '詳細情報',
                'earthquake.original_location': '原位置',
                'simulator.title': '地震シミュレータ',
                'simulator.magnitude': 'マグニチュード範囲',
                'simulator.location': '位置を選択',
                'simulator.generate': 'シミュレーションを生成',
                'status.online': 'オンライン',
                'status.offline': 'オフライン',
                'status.updating': '更新中',
                'status.error': 'エラー',
                'notification.new_earthquake': '新しい地震を検出',
                'notification.update_failed': 'データ更新に失敗',
                'notification.connection_restored': '接続が回復',
                'loading': '読み込み中...',
                'unit.km': 'キロメートル',
                'unit.magnitude': 'M',
                'time.just_now': 'たった今',
                'time.minutes_ago': '分前',
                'time.hours_ago': '時間前',
                'emergency.alert': '緊急地震速報',
                'emergency.attention': '注意',
                'emergency.warning': '警報'
            },
            'en': {
                'app.title': 'Global Earthquake Alert',
                'app.subtitle': 'Real-time Monitoring',
                'menu.refresh': 'Refresh',
                'menu.simulate': 'Simulate Earthquake',
                'menu.settings': 'Settings',
                'menu.about': 'About',
                'earthquake.magnitude': 'Magnitude',
                'earthquake.depth': 'Depth',
                'earthquake.time': 'Time',
                'earthquake.location': 'Location',
                'earthquake.intensity': 'Intensity',
                'earthquake.details': 'Details',
                'earthquake.original_location': 'Original Location',
                'simulator.title': 'Earthquake Simulator',
                'simulator.magnitude': 'Magnitude Range',
                'simulator.location': 'Select Location',
                'simulator.generate': 'Generate Simulation',
                'status.online': 'Online',
                'status.offline': 'Offline',
                'status.updating': 'Updating',
                'status.error': 'Error',
                'notification.new_earthquake': 'New earthquake detected',
                'notification.update_failed': 'Data update failed',
                'notification.connection_restored': 'Connection restored',
                'loading': 'Loading...',
                'unit.km': 'km',
                'unit.magnitude': '',
                'time.just_now': 'Just now',
                'time.minutes_ago': 'minutes ago',
                'time.hours_ago': 'hours ago',
                'emergency.alert': 'Emergency Earthquake Alert',
                'emergency.attention': 'Attention',
                'emergency.warning': 'Warning'
            }
        };
    }
    
    // 获取翻译 - 支持简化语言代码
    t(key, params = {}) {
        const dict = this.dictionaries[this.currentLanguage] || this.dictionaries['zh'];
        let translation = dict[key] || key;
        
        // 替换参数
        Object.keys(params).forEach(param => {
            const regex = new RegExp(`{{${param}}}`, 'g');
            translation = translation.replace(regex, params[param]);
        });
        
        return translation;
    }
    
    // 翻译位置名称 - 支持地震国原语言显示
    translateLocation(locationName, options = {}) {
        if (!locationName) return { original: '', translated: '' };
        
        const { showOriginal = this.showOriginalLanguage() } = options;
        
        // 检查是否有预定义翻译
        if (this.locationTranslations.has(locationName)) {
            const translations = this.locationTranslations.get(locationName);
            return {
                original: locationName,
                translated: translations[this.currentLanguage] || locationName,
                showOriginal: showOriginal
            };
        }
        
        // 对于没有预定义翻译的，尝试基本处理
        return {
            original: locationName,
            translated: locationName,
            showOriginal: showOriginal
        };
    }
    

    
    // 预加载常见位置翻译 - 扩展支持更多位置
    preloadLocationTranslations() {
        // 日本城市
        this.addLocationTranslation('東京', '东京', 'Tokyo');
        this.addLocationTranslation('大阪', '大阪', 'Osaka');
        this.addLocationTranslation('福岡', '福冈', 'Fukuoka');
        this.addLocationTranslation('札幌', '札幌', 'Sapporo');
        this.addLocationTranslation('仙台', '仙台', 'Sendai');
        this.addLocationTranslation('名古屋', '名古屋', 'Nagoya');
        this.addLocationTranslation('京都', '京都', 'Kyoto');
        this.addLocationTranslation('広島', '广岛', 'Hiroshima');
        this.addLocationTranslation('神戸', '神户', 'Kobe');
        this.addLocationTranslation('横浜', '横滨', 'Yokohama');
        this.addLocationTranslation('千葉', '千叶', 'Chiba');
        this.addLocationTranslation('埼玉', '埼玉', 'Saitama');
        this.addLocationTranslation('茨城', '茨城', 'Ibaraki');
        this.addLocationTranslation('栃木', '栃木', 'Tochigi');
        this.addLocationTranslation('群馬', '群马', 'Gunma');
        this.addLocationTranslation('山梨', '山梨', 'Yamanashi');
        this.addLocationTranslation('新潟', '新潟', 'Niigata');
        this.addLocationTranslation('富山', '富山', 'Toyama');
        this.addLocationTranslation('石川', '石川', 'Ishikawa');
        this.addLocationTranslation('福井', '福井', 'Fukui');
        this.addLocationTranslation('山形', '山形', 'Yamagata');
        this.addLocationTranslation('宮城', '宫城', 'Miyagi');
        this.addLocationTranslation('青森', '青森', 'Aomori');
        this.addLocationTranslation('岩手', '岩手', 'Iwate');
        this.addLocationTranslation('秋田', '秋田', 'Akita');
        this.addLocationTranslation('福島', '福岛', 'Fukushima');
        this.addLocationTranslation('長野', '长野', 'Nagano');
        this.addLocationTranslation('岐阜', '岐阜', 'Gifu');
        this.addLocationTranslation('静岡', '静冈', 'Shizuoka');
        this.addLocationTranslation('愛知', '爱知', 'Aichi');
        this.addLocationTranslation('三重', '三重', 'Mie');
        this.addLocationTranslation('滋賀', '滋贺', 'Shiga');
        this.addLocationTranslation('兵庫', '兵库', 'Hyogo');
        this.addLocationTranslation('奈良', '奈良', 'Nara');
        this.addLocationTranslation('和歌山', '和歌山', 'Wakayama');
        this.addLocationTranslation('鳥取', '鸟取', 'Tottori');
        this.addLocationTranslation('島根', '岛根', 'Shimane');
        this.addLocationTranslation('岡山', '冈山', 'Okayama');
        this.addLocationTranslation('山口', '山口', 'Yamaguchi');
        this.addLocationTranslation('徳島', '德岛', 'Tokushima');
        this.addLocationTranslation('香川', '香川', 'Kagawa');
        this.addLocationTranslation('愛媛', '爱媛', 'Ehime');
        this.addLocationTranslation('高知', '高知', 'Kochi');
        this.addLocationTranslation('佐賀', '佐贺', 'Saga');
        this.addLocationTranslation('長崎', '长崎', 'Nagasaki');
        this.addLocationTranslation('熊本', '熊本', 'Kumamoto');
        this.addLocationTranslation('大分', '大分', 'Oita');
        this.addLocationTranslation('宮崎', '宫崎', 'Miyazaki');
        this.addLocationTranslation('鹿児島', '鹿儿岛', 'Kagoshima');
        this.addLocationTranslation('沖縄', '冲绳', 'Okinawa');
        
        // 中国城市
        this.addLocationTranslation('北京', '北京', 'Beijing');
        this.addLocationTranslation('上海', '上海', 'Shanghai');
        this.addLocationTranslation('广州', '广州', 'Guangzhou');
        this.addLocationTranslation('深圳', '深圳', 'Shenzhen');
        this.addLocationTranslation('杭州', '杭州', 'Hangzhou');
        this.addLocationTranslation('南京', '南京', 'Nanjing');
        this.addLocationTranslation('成都', '成都', 'Chengdu');
        this.addLocationTranslation('武汉', '武汉', 'Wuhan');
        this.addLocationTranslation('西安', '西安', 'Xi\'an');
        this.addLocationTranslation('重庆', '重庆', 'Chongqing');
        this.addLocationTranslation('天津', '天津', 'Tianjin');
        
        // 其他国家和地区
        this.addLocationTranslation('アメリカ', '美国', 'USA');
        this.addLocationTranslation('カナダ', '加拿大', 'Canada');
        this.addLocationTranslation('メキシコ', '墨西哥', 'Mexico');
        this.addLocationTranslation('インドネシア', '印度尼西亚', 'Indonesia');
        this.addLocationTranslation('フィリピン', '菲律宾', 'Philippines');
        this.addLocationTranslation('ニュージーランド', '新西兰', 'New Zealand');
        this.addLocationTranslation('オーストラリア', '澳大利亚', 'Australia');
        this.addLocationTranslation('チリ', '智利', 'Chile');
        this.addLocationTranslation('ペルー', '秘鲁', 'Peru');
        this.addLocationTranslation('アルゼンチン', '阿根廷', 'Argentina');
        this.addLocationTranslation('トルコ', '土耳其', 'Turkey');
        this.addLocationTranslation('ギリシャ', '希腊', 'Greece');
        this.addLocationTranslation('イタリア', '意大利', 'Italy');
        this.addLocationTranslation('スペイン', '西班牙', 'Spain');
        this.addLocationTranslation('ポルトガル', '葡萄牙', 'Portugal');
        this.addLocationTranslation('ドイツ', '德国', 'Germany');
        this.addLocationTranslation('フランス', '法国', 'France');
        this.addLocationTranslation('イギリス', '英国', 'UK');
        this.addLocationTranslation('ロシア', '俄罗斯', 'Russia');
        this.addLocationTranslation('インド', '印度', 'India');
        this.addLocationTranslation('パキスタン', '巴基斯坦', 'Pakistan');
        this.addLocationTranslation('ネパール', '尼泊尔', 'Nepal');
        this.addLocationTranslation('バングラデシュ', '孟加拉国', 'Bangladesh');
        this.addLocationTranslation('ミャンマー', '缅甸', 'Myanmar');
        this.addLocationTranslation('タイ', '泰国', 'Thailand');
        this.addLocationTranslation('ベトナム', '越南', 'Vietnam');
        this.addLocationTranslation('マレーシア', '马来西亚', 'Malaysia');
        this.addLocationTranslation('シンガポール', '新加坡', 'Singapore');
        
        // 海域
        this.addLocationTranslation('東海', '东海', 'East China Sea');
        this.addLocationTranslation('南海', '南海', 'South China Sea');
        this.addLocationTranslation('太平洋', '太平洋', 'Pacific Ocean');
        this.addLocationTranslation('日本海', '日本海', 'Sea of Japan');
        this.addLocationTranslation('東京湾', '东京湾', 'Tokyo Bay');
        this.addLocationTranslation('伊豆諸島', '伊豆诸岛', 'Izu Islands');
        this.addLocationTranslation('小笠原諸島', '小笠原诸岛', 'Ogasawara Islands');
        this.addLocationTranslation('琉球弧', '琉球弧', 'Ryukyu Arc');
        this.addLocationTranslation('南海トラフ', '南海海槽', 'Nankai Trough');
        this.addLocationTranslation('相模トラフ', '相模海槽', 'Sagami Trough');
        this.addLocationTranslation('千島海溝', '千岛海沟', 'Kuril Trench');
        this.addLocationTranslation('日本海溝', '日本海沟', 'Japan Trench');
        
        console.log('已预加载', this.locationTranslations.size, '个位置的翻译');
    }
    
    // 添加位置翻译 - 支持简化语言代码
    addLocationTranslation(original, zh, en) {
        this.locationTranslations.set(original, {
            'zh': zh,
            'ja': original,
            'en': en
        });
    }
    

    
    // 检查字符串是否包含日文字符
    containsJapaneseChars(str) {
        const japaneseRegex = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;
        return japaneseRegex.test(str);
    }
    
    // 格式化地震信息
    formatEarthquakeInfo(quake) {
        if (!quake) return null;
        
        // 获取位置翻译
        const location = this.translateLocation(quake.location || '未知位置');
        
        // 格式化时间
        const formattedTime = this.formatTime(quake.time);
        
        // 格式化深度
        const depth = quake.depth ? `${Math.round(quake.depth)}${this.t('unit.km')}` : '未知';
        
        // 格式化震级
        const magnitudeUnit = this.t('unit.magnitude');
        const magnitude = quake.magnitude ? 
            `${quake.magnitude}${magnitudeUnit}` : 
            '未知';
        
        // 构建信息对象
        return {
            // 原语言信息
            original: {
                location: location.original,
                time: formattedTime.original,
                depth: depth,
                magnitude: magnitude,
                intensity: quake.intensity || '未知'
            },
            // 翻译后的信息
            translated: {
                location: location.translated,
                time: formattedTime.translated,
                depth: depth,
                magnitude: magnitude,
                intensity: quake.intensity || '未知'
            }
        };
    }
    
    // 格式化时间 - 支持相对时间和绝对时间
    formatTime(timestamp) {
        if (!timestamp) return { original: '', translated: '', formatted: '' };
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        
        // 最近的时间显示相对时间
        let relativeTime;
        if (diffSecs < 60) {
            relativeTime = this.t('time.just_now');
        } else if (diffMins < 60) {
            relativeTime = `${diffMins}${this.t('time.minutes_ago')}`;
        } else if (diffHours < 24) {
            relativeTime = `${diffHours}${this.t('time.hours_ago')}`;
        } else {
            // 超过24小时显示具体日期和时间
            relativeTime = this.formatDateTime(date);
        }
        
        // 格式化的完整时间
        const formattedTime = this.formatDateTime(date);
        
        return {
            original: date.toISOString(),
            translated: relativeTime,
            formatted: formattedTime
        };
    }
    
    // 格式化日期时间 - 使用简化语言代码
    formatDateTime(date) {
        if (!date) return '';
        
        // 根据当前语言设置日期格式
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        
        // 使用完整的语言标签用于toLocaleString
        const fullLangTag = this.getFullLanguageTag();
        return date.toLocaleString(fullLangTag, options);
    }
    
    // 获取完整的语言标签（用于toLocaleString）
    getFullLanguageTag() {
        const langMap = {
            'zh': 'zh-CN',
            'ja': 'ja-JP',
            'en': 'en-US'
        };
        return langMap[this.currentLanguage] || this.currentLanguage;
    }
    
    // 获取语言切换控件HTML - 使用简化语言代码
    getLanguageSelectorHTML() {
        const langNames = {
            'zh': '中文',
            'ja': '日本語',
            'en': 'English'
        };
        
        let optionsHTML = '';
        for (const lang of this.supportedLanguages) {
            const selected = this.currentLanguage === lang ? 'selected' : '';
            const langName = langNames[lang] || lang;
            optionsHTML += `<option value="${lang}" ${selected}>${langName}</option>`;
        }
        
        return `
        <div class="language-selector">
            <select id="language-select" onchange="app.changeLanguage(this.value)">
                ${optionsHTML}
            </select>
        </div>`;
    }
}

// 创建单例实例
const languageManagerInstance = new LanguageManager();

// 导出实例和类到window对象
window.LanguageManager = LanguageManager;
window.languageManagerInstance = languageManagerInstance;
