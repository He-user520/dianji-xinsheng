/**
 * API 配置文件模板
 * 复制此文件为 config.js 并填入你的真实 API Key
 * 
 * 复制命令：cp config.example.js config.js
 */
module.exports = {
    // 小米 MiMo API
    MIMO_API_KEY: '你的_MiMo_API_Key',
    MIMO_BASE_URL: 'https://token-plan-cn.xiaomimimo.com/v1',
    TRANSLATION_MODEL: 'mimo-v2.5-pro',
    VISION_MODEL: 'mimo-v2.5',
    ANNOTATION_MODEL: 'mimo-v2.5-pro',

    // 百度智能云 OCR
    BAIDU_OCR_API_KEY: '你的_百度_API_Key',
    BAIDU_OCR_SECRET_KEY: '你的_百度_Secret_Key',

    PORT: 3001
};
