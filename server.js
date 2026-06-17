/**
 * 典籍新生 - API 代理服务器
 * 解决浏览器跨域问题，同时保护 API Key 不暴露在前端
 *
 * 使用方法：node server.js（本地） 或 部署到 Vercel（自动）
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 配置：优先读取环境变量（Vercel），其次读取 config.js（本地）
let config;
try {
    config = require('./config');
} catch (e) {
    config = {};
}
const CONFIG = {
    MIMO_API_KEY: process.env.MIMO_API_KEY || config.MIMO_API_KEY,
    MIMO_BASE_URL: process.env.MIMO_BASE_URL || config.MIMO_BASE_URL || 'https://token-plan-cn.xiaomimimo.com/v1',
    TRANSLATION_MODEL: process.env.TRANSLATION_MODEL || config.TRANSLATION_MODEL || 'mimo-v2.5-pro',
    VISION_MODEL: process.env.VISION_MODEL || config.VISION_MODEL || 'mimo-v2.5',
    ANNOTATION_MODEL: process.env.ANNOTATION_MODEL || config.ANNOTATION_MODEL || 'mimo-v2.5-pro',
    BAIDU_OCR_API_KEY: process.env.BAIDU_OCR_API_KEY || config.BAIDU_OCR_API_KEY,
    BAIDU_OCR_SECRET_KEY: process.env.BAIDU_OCR_SECRET_KEY || config.BAIDU_OCR_SECRET_KEY,
    PORT: process.env.PORT || config.PORT || 3001
};

const PORT = CONFIG.PORT;

// 百度OCR AccessToken缓存
let baiduAccessToken = null;
let baiduTokenExpireTime = 0;

/**
 * 获取百度OCR AccessToken（带缓存）
 */
async function getBaiduAccessToken() {
    if (baiduAccessToken && Date.now() < baiduTokenExpireTime) {
        return baiduAccessToken;
    }
    return new Promise((resolve, reject) => {
        const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${CONFIG.BAIDU_OCR_API_KEY}&client_secret=${CONFIG.BAIDU_OCR_SECRET_KEY}`;
        https.get(tokenUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.access_token) {
                        baiduAccessToken = result.access_token;
                        // 提前5分钟过期
                        baiduTokenExpireTime = Date.now() + (result.expires_in - 300) * 1000;
                        console.log('百度OCR AccessToken已刷新');
                        resolve(baiduAccessToken);
                    } else {
                        reject(new Error('获取百度AccessToken失败: ' + data));
                    }
                } catch (e) {
                    reject(new Error('解析百度Token响应失败: ' + e.message));
                }
            });
        }).on('error', reject);
    });
}

/**
 * 百度OCR - 通用文字识别（高精度版）
 * @param {string} imageBase64 - 图片的base64编码（不含data:image前缀）
 */
async function baiduOCR(imageBase64) {
    const accessToken = await getBaiduAccessToken();

    // 去掉data:image/xxx;base64,前缀
    let pureBase64 = imageBase64;
    if (pureBase64.includes(',')) {
        pureBase64 = pureBase64.split(',')[1];
    }

    const postData = `image=${encodeURIComponent(pureBase64)}&language_type=CHN_ENG&detect_direction=true&paragraph=true`;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'aip.baidubce.com',
            path: `/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.words_result) {
                        // 合并所有识别到的文字
                        const text = result.words_result.map(item => item.words).join('\n');
                        console.log(`百度OCR识别成功，共${result.words_result.length}行`);
                        resolve(text);
                    } else {
                        reject(new Error('百度OCR返回错误: ' + (result.error_msg || JSON.stringify(result))));
                    }
                } catch (e) {
                    reject(new Error('解析百度OCR响应失败: ' + e.message));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * 发送请求到 MiMo API（兼容 OpenAI 接口，带重试+超时）
 */
async function callMiMo(model, messages, options = {}) {
    const url = `${CONFIG.MIMO_BASE_URL}/chat/completions`;
    const maxRetries = 3;
    const timeout = options.timeout || 60000; // 默认60秒超时
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const body = {
                model: model,
                messages: messages,
                temperature: options.temperature || 0.3,
                max_tokens: options.max_tokens || 4000,
                stream: false
            };

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${CONFIG.MIMO_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`MiMo API Error ${response.status}: ${errorText}`);
                }

                return await response.json();
            } finally {
                clearTimeout(timer);
            }
        } catch (e) {
            lastError = e;
            console.error(`MiMo API 第${attempt}次调用失败: ${e.message}`);
            if (attempt < maxRetries) {
                const delay = attempt * 2000;
                console.log(`等待 ${delay}ms 后重试...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw lastError;
}

/**
 * 古文识别（OCR）- 使用视觉语言模型
 */
async function recognizeAncientText(imageBase64) {
    const messages = [
        {
            role: 'system',
            content: '你是一位专业的古籍文字识别专家。请仔细识别图片中的古文文字，并按原文顺序输出。注意：1.保持原文的繁体字；2.不要添加标点；3.按行输出，每行之间用换行符分隔；4.只输出识别到的文字，不要输出任何解释。'
        },
        {
            role: 'user',
            content: [
                {
                    type: 'image_url',
                    image_url: {
                        url: imageBase64.startsWith('data:')
                            ? imageBase64
                            : `data:image/jpeg;base64,${imageBase64}`
                    }
                },
                {
                    type: 'text',
                    text: '请识别这张古籍图片中的所有文字。'
                }
            ]
        }
    ];

    const result = await callMiMo(CONFIG.VISION_MODEL, messages, {
        temperature: 0.1,
        max_tokens: 2000
    });

    return result.choices[0].message.content.trim();
}

/**
 * 古文断句标点
 */
async function punctuateText(text) {
    const messages = [
        {
            role: 'user',
            content: '你是一位专业的古文标点专家。请为以下无标点的古文添加现代标点符号。要求：1.准确断句；2.使用标准中文标点（逗号、句号、问号、感叹号、冒号、引号等）；3.保持原文用字不变；4.只输出标点后的文本，不要输出任何解释。\n\n请为以下古文添加标点：\n' + text
        }
    ];

    const result = await callMiMo(CONFIG.TRANSLATION_MODEL, messages, {
        temperature: 0.1,
        max_tokens: 2000
    });

    return result.choices[0].message.content.trim();
}

/**
 * 文白对照翻译
 */
async function translateText(text) {
    const messages = [
        {
            role: 'user',
            content: '你是一位精通古文翻译的学者。请将以下古文翻译成现代白话文。\n\n要求：\n1. 翻译准确、通顺、优美\n2. 保持原文的段落结构\n3. 对人名、地名、典故在括号中简要注释\n4. 只输出翻译结果，不要输出原文或其他内容\n5. 每段原文对应一段译文，用空行分隔\n\n请翻译以下古文：\n' + text
        }
    ];

    const result = await callMiMo(CONFIG.TRANSLATION_MODEL, messages, {
        temperature: 0.3,
        max_tokens: 4000
    });

    return result.choices[0].message.content.trim();
}

/**
 * 注释解读生成
 */
async function generateAnnotations(text) {
    const messages = [
        {
            role: 'user',
            content: `你是一位古文学者。请从以下古文中提取所有需要注释的词语，包括：人名、地名、官职、典故、生僻字词、历史事件等。

请严格按以下JSON格式输出（不要输出任何其他内容）：
[
  {"term": "词语", "type": "person|place|term|allusion", "desc": "详细解释"}
]

type说明：
- person: 人物
- place: 地点
- term: 术语/生僻词
- allusion: 典故

请从以下古文中提取需要注释的词语：
${text}`
        }
    ];

    try {
        const result = await callMiMo(CONFIG.ANNOTATION_MODEL, messages, {
            temperature: 0.1,
            max_tokens: 3000,
            timeout: 90000
        });

        const content = result.choices[0].message.content.trim();
        
        // 清理markdown代码块
        let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const annotations = JSON.parse(jsonMatch[0]);
            if (annotations.length > 0) {
                return annotations;
            }
        }
    } catch (e) {
        console.error('注释生成失败:', e.message);
    }

    // Fallback: 基于规则提取注释
    console.log('使用 fallback 规则生成注释...');
    return generateAnnotationsFallback(text);
}

/**
 * Fallback: 基于规则生成注释
 */
function generateAnnotationsFallback(text) {
    const annotations = [];
    const found = new Set();

    const dict = [
        { term: '子曰', type: 'person', desc: '孔子说。子，古代对男子的尊称，在《论语》中特指孔子（公元前551-前479年），名丘，字仲尼，春秋时期鲁国人，儒家学派创始人。' },
        { term: '孔子', type: 'person', desc: '（公元前551-前479年）名丘，字仲尼，春秋时期鲁国陬邑人，儒家学派创始人，被尊为"至圣先师"。' },
        { term: '有子', type: 'person', desc: '有若（公元前518-前458年），字子有，孔子的学生，春秋末期鲁国人。' },
        { term: '曾子', type: 'person', desc: '曾参（公元前505-前435年），字子舆，孔子的学生，以孝道著称。' },
        { term: '孟子', type: 'person', desc: '孟轲（公元前372-前289年），字子舆，战国时期邹国人，儒家代表人物，被尊为"亚圣"。' },
        { term: '颜回', type: 'person', desc: '颜渊（公元前521-前481年），字子渊，孔子最得意的弟子，以德行著称。' },
        { term: '子路', type: 'person', desc: '仲由（公元前542-前480年），字子路，孔子的弟子，以勇政著称。' },
        { term: '子贡', type: 'person', desc: '端木赐（公元前520-前456年），字子贡，孔子的弟子，以口才和经商著称。' },
        { term: '鲁国', type: 'place', desc: '周朝诸侯国之一，位于今山东省南部，是孔子的故乡，儒家文化的发源地。' },
        { term: '齐国', type: 'place', desc: '周朝诸侯国之一，位于今山东省北部，春秋五霸之首。' },
        { term: '楚国', type: 'place', desc: '周朝诸侯国之一，位于今长江中下游地区，春秋战国时期的南方大国。' },
        { term: '秦国', type: 'place', desc: '周朝诸侯国之一，位于今陕西一带，后统一六国建立秦朝。' },
        { term: '仁', type: 'term', desc: '儒家核心思想，指爱人、推己及人的道德境界，是孔子思想体系中的最高道德标准。' },
        { term: '义', type: 'term', desc: '儒家重要概念，指正当、合理的道理或行为，与"仁"互为表里。' },
        { term: '礼', type: 'term', desc: '儒家重要概念，指社会规范和礼仪制度，是维护社会秩序的重要手段。' },
        { term: '智', type: 'term', desc: '儒家重要概念，指智慧和明辨是非的能力。' },
        { term: '信', type: 'term', desc: '儒家重要概念，指诚信、守信，是为人处世的基本准则。' },
        { term: '孝', type: 'term', desc: '孝顺父母，儒家伦理的核心概念之一，是所有道德的起点。' },
        { term: '悌', type: 'term', desc: '敬爱兄长，与"孝"合称"孝悌"，是儒家家庭伦理的基础。' },
        { term: '孝弟', type: 'term', desc: '即孝悌，孝指孝顺父母，弟同"悌"指敬爱兄长，是儒家伦理的核心。' },
        { term: '忠', type: 'term', desc: '忠诚、尽心竭力，儒家重要道德规范。' },
        { term: '恕', type: 'term', desc: '推己及人、宽恕待人，孔子说"己所不欲，勿施于人"即是恕道。' },
        { term: '君子', type: 'term', desc: '儒家理想人格，指有道德修养、品行高尚的人，与"小人"相对。' },
        { term: '小人', type: 'term', desc: '儒家概念，指品德低下、只顾私利的人，与"君子"相对。' },
        { term: '圣人', type: 'term', desc: '儒家概念，指道德修养达到最高境界的人，如尧、舜、禹、汤、文王、武王、周公、孔子等。' },
        { term: '中庸', type: 'term', desc: '儒家重要概念，指不偏不倚、恰到好处的处世态度和方法。' },
        { term: '王道', type: 'term', desc: '儒家政治理念，指以德服人、以仁政治国的统治方式，与"霸道"相对。' },
        { term: '霸道', type: 'term', desc: '指以武力、权术统治的方式，与儒家的"王道"相对。' },
        { term: '天命', type: 'term', desc: '上天赋予的使命或命运，儒家认为君子应"知天命"。' },
        { term: '春秋时期', type: 'term', desc: '公元前770-前476年，中国历史上东周的前半期，因孔子修订《春秋》而得名。' },
        { term: '战国时期', type: 'term', desc: '公元前475-前221年，春秋之后的中国历史时期，诸侯争霸战争频繁。' },
        { term: '论语', type: 'book', desc: '儒家经典著作，记录孔子及其弟子言行的语录体散文集，共20篇，是儒家思想的重要来源。' },
        { term: '诗经', type: 'book', desc: '中国最早的诗歌总集，收录西周至春秋诗歌305篇，分风、雅、颂三部分。' },
        { term: '尚书', type: 'book', desc: '中国最早的史书，记录上古历史文献和帝王言论，是儒家经典之一。' },
        { term: '礼记', type: 'book', desc: '儒家经典，记录先秦礼仪制度和社会规范，是研究古代社会的重要文献。' },
        { term: '周易', type: 'book', desc: '又称《易经》，儒家经典之一，通过八卦推演万物变化，包含丰富的哲学思想。' },
        { term: '春秋', type: 'book', desc: '儒家经典之一，相传为孔子所修订的鲁国史书，微言大义，寓褒贬于记事之中。' },
        { term: '大学', type: 'book', desc: '儒家经典，原为《礼记》中的一篇，提出"三纲领八条目"的修身治国理论。' },
        { term: '中庸', type: 'book', desc: '儒家经典，原为《礼记》中的一篇，论述"中庸"之道，强调不偏不倚。' },
        { term: '道德经', type: 'book', desc: '道家经典著作，相传为老子所著，共81章，阐述"道法自然"的哲学思想。' },
        { term: '学而时习之', type: 'allusion', desc: '出自《论语·学而》开篇第一句，强调学习与实践相结合，是儒家教育思想的重要体现。' },
        { term: '巧言令色', type: 'allusion', desc: '出自《论语·学而》，指花言巧语、装出和颜悦色，孔子认为这种人缺少仁德。' },
        { term: '温故知新', type: 'allusion', desc: '出自《论语·为政》"温故而知新，可以为师矣"，指复习旧知识以获得新理解。' },
        { term: '三人行必有我师', type: 'allusion', desc: '出自《论语·述而》，强调随时向他人学习，体现孔子谦虚好学的态度。' }
    ];

    dict.forEach(item => {
        if (text.includes(item.term) && !found.has(item.term)) {
            found.add(item.term);
            annotations.push(item);
        }
    });

    // 如果什么都没匹配到，返回基本注释
    if (annotations.length === 0) {
        annotations.push({ term: '古文', type: 'term', desc: '中国古代文献的总称，包括经、史、子、集四大部分，是中华文明的重要载体。' });
    }

    console.log(`Fallback 注释生成完成: ${annotations.length} 条`);
    return annotations;
}

/**
 * 知识图谱实体抽取
 */
async function extractEntities(text) {
    const messages = [
        {
            role: 'user',
            content: `你是一位古文知识图谱专家。请从以下古文中提取所有实体及其关系。

请严格按以下JSON格式输出（不要输出任何其他内容，不要用markdown代码块包裹）：
{"nodes":[{"id":"实体名","type":"person|place|event|book|term"}],"links":[{"source":"实体A","target":"实体B","value":2}]}

type说明：
- person: 人物
- place: 地点
- event: 事件
- book: 典籍
- term: 概念/术语

value表示关系强度(1-3)。

请从以下古文中提取实体和关系：
${text}`
        }
    ];

    try {
        const result = await callMiMo(CONFIG.ANNOTATION_MODEL, messages, {
            temperature: 0.1,
            max_tokens: 2000,
            timeout: 90000
        });

        const content = result.choices[0].message.content.trim();
        console.log('知识图谱原始返回:', content.substring(0, 200));

        // 清理可能的markdown代码块包裹
        let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            // 确保nodes和links存在
            if (!parsed.nodes) parsed.nodes = [];
            if (!parsed.links) parsed.links = [];
            // 如果API返回了有效节点，直接使用
            if (parsed.nodes.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('知识图谱提取失败:', e.message);
    }

    // Fallback: 基于文本规则提取实体
    console.log('使用 fallback 规则提取知识图谱实体...');
    return extractEntitiesFallback(text);
}

/**
 * Fallback: 基于文本规则提取知识图谱实体
 */
function extractEntitiesFallback(text) {
    const nodes = [];
    const links = [];
    const nodeIds = new Set();

    function addNode(id, type) {
        if (id && !nodeIds.has(id)) {
            nodeIds.add(id);
            nodes.push({ id, type });
        }
    }

    function addLink(source, target, value) {
        if (nodeIds.has(source) && nodeIds.has(target) && source !== target) {
            links.push({ source, target, value });
        }
    }

    // 常见古人名
    const persons = ['孔子', '子曰', '孟子', '老子', '庄子', '墨子', '荀子', '曾子', '子思', '颜回', '子路', '子贡', '有子', '子夏', '子游', '子张', '曾参', '冉求', '仲由', '端木赐', '言偃', '卜商', '颛孙师', '左丘明', '屈原', '司马迁', '李白', '杜甫', '苏轼', '朱熹', '王阳明', '秦始皇', '汉武帝', '唐太宗', '曹操', '刘备', '孙权', '诸葛亮', '周公', '尧', '舜', '禹', '汤', '文王', '武王', '管仲', '鲍叔牙', '齐桓公', '晋文公', '楚庄王', '宋襄公', '秦穆公'];
    persons.forEach(p => {
        if (text.includes(p)) {
            addNode(p, 'person');
        }
    });

    // "子"开头的称呼（如"有子"）
    const ziPattern = /[有曾冉仲端卜言颛]\s*子/g;
    let match;
    while ((match = ziPattern.exec(text)) !== null) {
        addNode(match[0].replace(/\s/g, ''), 'person');
    }

    // 常见地名
    const places = ['鲁国', '齐国', '楚国', '秦国', '晋国', '宋国', '卫国', '郑国', '燕国', '赵国', '魏国', '韩国', '吴国', '越国', '陈国', '蔡国', '周', '商', '夏', '洛阳', '长安', '曲阜', '泰山', '黄河', '长江', '中原', '天下', '东海', '南海', '西戎', '北狄', '南蛮', '东夷'];
    places.forEach(p => {
        if (text.includes(p)) {
            addNode(p, 'place');
        }
    });

    // 常见典籍
    const books = ['论语', '诗经', '尚书', '礼记', '周易', '春秋', '左传', '孟子', '大学', '中庸', '孝经', '尔雅', '道德经', '庄子', '墨子', '荀子', '韩非子', '孙子兵法', '史记', '汉书', '后汉书', '三国志', '楚辞', '尚书', '周礼', '仪礼', '学而篇', '为政篇', '八佾篇', '里仁篇', '公冶长篇'];
    books.forEach(b => {
        if (text.includes(b)) {
            addNode(b, 'book');
        }
    });

    // 常见概念/术语
    const terms = ['仁', '义', '礼', '智', '信', '孝', '悌', '忠', '恕', '勇', '温', '良', '恭', '俭', '让', '德', '道', '理', '气', '心', '性', '命', '天命', '君子', '小人', '圣人', '善人', '士', '民', '孝弟', '仁政', '王道', '霸道', '中庸', '和', '学', '教', '政', '刑', '乐', '诗', '书', '春秋时期', '战国时期', '三代', '三纲五常', '五伦'];
    terms.forEach(t => {
        if (text.includes(t)) {
            addNode(t, 'term');
        }
    });

    // 如果还是什么都没提取到，至少返回一些通用节点
    if (nodes.length === 0) {
        addNode('古文', 'book');
        addNode('传统文化', 'term');
        addNode('儒家思想', 'term');
        addLink('古文', '传统文化', 2);
        addLink('古文', '儒家思想', 2);
        addLink('传统文化', '儒家思想', 3);
    }

    // 自动建立关系
    // 人物→典籍
    nodes.filter(n => n.type === 'person').forEach(p => {
        nodes.filter(n => n.type === 'book').forEach(b => {
            addLink(p.id, b.id, 2);
        });
    });

    // 人物→概念
    nodes.filter(n => n.type === 'person').forEach(p => {
        nodes.filter(n => n.type === 'term').forEach(t => {
            addLink(p.id, t.id, 1);
        });
    });

    // 地名→人物
    nodes.filter(n => n.type === 'place').forEach(pl => {
        nodes.filter(n => n.type === 'person').forEach(p => {
            addLink(pl.id, p.id, 1);
        });
    });

    // 典籍→概念
    nodes.filter(n => n.type === 'book').forEach(b => {
        nodes.filter(n => n.type === 'term').forEach(t => {
            addLink(b.id, t.id, 2);
        });
    });

    console.log(`Fallback 提取完成: ${nodes.length} 节点, ${links.length} 关系`);
    return { nodes, links };
}

/**
 * 古籍故事生成
 */
async function generateStory(text, translation) {
    const messages = [
        {
            role: 'user',
            content: `你是一位擅长讲故事的作家。请将以下古文内容转化为一个生动有趣的现代故事。

要求：
1. 用通俗易懂的现代汉语讲述
2. 保留原文的核心思想和人物
3. 加入合理的场景描写和对话
4. 故事长度300-500字
5. 可以适当加入现代视角的解读
6. 只输出故事内容，不要输出其他内容

古文原文：
${text}

白话翻译（参考）：
${translation || '（无翻译参考）'}
`
        }
    ];

    try {
        const result = await callMiMo(CONFIG.TRANSLATION_MODEL, messages, {
            temperature: 0.7,
            max_tokens: 2000,
            timeout: 90000
        });
        return result.choices[0].message.content.trim();
    } catch (e) {
        console.error('故事生成失败:', e.message);
        return generateStoryFallback(text, translation);
    }
}

/**
 * Fallback: 简单故事生成
 */
function generateStoryFallback(text, translation) {
    const firstLine = text.split('\n').find(l => l.trim().length > 0) || text.substring(0, 50);
    return `在很久以前的春秋时代，一位智者正在教导他的学生。

"${firstLine}"

这句话穿越了两千多年的时光，来到我们面前。它不仅仅是一句古文，更是一颗智慧的种子，在历史的长河中生根发芽，影响着一代又一代的中国人。

想象一下那个场景：竹简摊开，墨香四溢，老者娓娓道来，弟子们围坐聆听。这便是中国传统文化最生动的画面——知识在师徒间传递，智慧在对话中流淌。

今天，当我们重新读起这段文字，仿佛能听到那跨越千年的声音，感受到古人对人生、对世界的深刻思考。这就是典籍的力量——让千年文明，在指尖重生。`;
}

/**
 * 处理HTTP请求
 */
const server = http.createServer(async (req, res) => {
    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);

    try {
        if (url.pathname === '/api/recognize' && req.method === 'POST') {
            // 古籍OCR识别（百度OCR）
            const body = await getRequestBody(req);
            const { image } = JSON.parse(body);
            const text = await baiduOCR(image);
            sendJSON(res, { success: true, text });

        } else if (url.pathname === '/api/baidu-ocr' && req.method === 'POST') {
            // 百度OCR独立端点
            const body = await getRequestBody(req);
            const { image } = JSON.parse(body);
            const text = await baiduOCR(image);
            sendJSON(res, { success: true, text });

        } else if (url.pathname === '/api/punctuate' && req.method === 'POST') {
            // 断句标点
            const body = await getRequestBody(req);
            const { text } = JSON.parse(body);
            const result = await punctuateText(text);
            sendJSON(res, { success: true, text: result });

        } else if (url.pathname === '/api/translate' && req.method === 'POST') {
            // 文白翻译
            const body = await getRequestBody(req);
            const { text } = JSON.parse(body);
            const translation = await translateText(text);
            sendJSON(res, { success: true, translated: translation });

        } else if (url.pathname === '/api/annotations' && req.method === 'POST') {
            // 注释生成
            const body = await getRequestBody(req);
            const { text } = JSON.parse(body);
            const annotations = await generateAnnotations(text);
            sendJSON(res, { success: true, annotations });

        } else if (url.pathname === '/api/graph' && req.method === 'POST') {
            // 知识图谱
            const body = await getRequestBody(req);
            const { text } = JSON.parse(body);
            const graph = await extractEntities(text);
            sendJSON(res, { success: true, graph });

        } else if (url.pathname === '/api/story' && req.method === 'POST') {
            // 古籍故事生成
            const body = await getRequestBody(req);
            const { text, translation } = JSON.parse(body);
            const story = await generateStory(text, translation);
            sendJSON(res, { success: true, story });

        } else if (url.pathname === '/api/process-text' && req.method === 'POST') {
            // 文本处理（跳过OCR，直接从古文文本开始处理）
            const body = await getRequestBody(req);
            const { text } = JSON.parse(body);
            
            console.log('[1/4] 断句标点中...');
            const punctuatedText = await punctuateText(text);
            
            console.log('[2/4] 翻译中...');
            const translation = await translateText(punctuatedText);
            
            console.log('[3/4] 生成注释中...');
            const annotations = await generateAnnotations(punctuatedText);
            
            console.log('[4/4] 构建知识图谱中...');
            const graph = await extractEntities(punctuatedText);
            
            sendJSON(res, {
                success: true,
                original: punctuatedText,
                translated: translation,
                annotations: annotations,
                graph: graph
            });

        } else if (url.pathname === '/api/process-all' && req.method === 'POST') {
            // 一站式处理（按顺序执行所有步骤）
            const body = await getRequestBody(req);
            const { image } = JSON.parse(body);
            
            console.log('[1/5] 百度OCR识别中...');
            const rawText = await baiduOCR(image);
            
            console.log('[2/5] 断句标点中...');
            const punctuatedText = await punctuateText(rawText);
            
            console.log('[3/5] 翻译中...');
            const translation = await translateText(punctuatedText);
            
            console.log('[4/5] 生成注释中...');
            const annotations = await generateAnnotations(punctuatedText);
            
            console.log('[5/5] 构建知识图谱中...');
            const graph = await extractEntities(punctuatedText);
            
            sendJSON(res, {
                success: true,
                original: punctuatedText,
                rawText: rawText,
                translated: translation,
                annotations: annotations,
                graph: graph
            });

        } else {
            // 静态文件服务
            serveStaticFile(req, res, url.pathname);
        }
    } catch (error) {
        console.error('Error:', error.message);
        sendJSON(res, { success: false, error: error.message }, 500);
    }
});

/**
 * 读取请求体
 */
function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

/**
 * 发送JSON响应
 */
function sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

/**
 * 静态文件服务
 */
function serveStaticFile(req, res, pathname) {
    const publicDir = path.join(__dirname);
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(publicDir, filePath);

    const ext = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
    };

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

server.listen(PORT, () => {
    console.log(`\n  📖 典籍新生 API 服务器已启动`);
    console.log(`  🌐 访问地址: http://localhost:${PORT}`);
    console.log(`  📡 API 端点:`);
    console.log(`     POST /api/recognize    - 古籍OCR识别`);
    console.log(`     POST /api/punctuate    - 断句标点`);
    console.log(`     POST /api/translate    - 文白翻译`);
    console.log(`     POST /api/annotations  - 注释生成`);
    console.log(`     POST /api/graph        - 知识图谱`);
    console.log(`     POST /api/story        - 故事生成`);
    console.log(`     POST /api/process-all  - 一站式处理\n`);
});

// Vercel Serverless 导出
module.exports = async (req, res) => {
    // 复用已有的请求处理逻辑
    const url = new URL(req.url, `http://localhost:${PORT}`);
    req.url = url.pathname + url.search;

    // 手动触发 server 的请求处理
    server.emit('request', req, res);
};
