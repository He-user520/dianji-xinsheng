/**
 * 典籍新生 - AI 驱动的古籍活化智能平台
 * 决赛级完整功能 - 核心交互逻辑
 */

'use strict';

// ========================================
// 墨韵流光 - 三层粒子系统
// 远景：金色光尘（呼吸闪烁+鼠标吸引）
// 中景：墨点粒子（缓慢飘落）
// 近景：汉字飘落（极低透明度）
// 交互：鼠标引力场 + 点击涟漪 + 金色光晕跟随
// ========================================
class InkParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dustParticles = [];
        this.inkParticles = [];
        this.charParticles = [];
        this.ripples = [];
        this.mouse = { x: -9999, y: -9999, active: false };
        this.cursorGlow = { x: 0, y: 0, alpha: 0 };
        this.chars = '之乎者也仁义礼智信道君子学诗书礼乐易春秋论语孟子大学中庸';
        this.time = 0;
        this.resize();
        this.init();
        this.bindEvents();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            this.mouse.active = true;
        });
        window.addEventListener('mouseleave', () => {
            this.mouse.active = false;
        });
        window.addEventListener('click', (e) => {
            this.ripples.push({
                x: e.clientX,
                y: e.clientY,
                radius: 0,
                maxRadius: 80 + Math.random() * 40,
                alpha: 0.6,
                speed: 2 + Math.random()
            });
        });
        window.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            this.mouse.x = t.clientX;
            this.mouse.y = t.clientY;
            this.mouse.active = true;
            this.ripples.push({
                x: t.clientX,
                y: t.clientY,
                radius: 0,
                maxRadius: 80,
                alpha: 0.6,
                speed: 2.5
            });
        });
        window.addEventListener('touchmove', (e) => {
            const t = e.touches[0];
            this.mouse.x = t.clientX;
            this.mouse.y = t.clientY;
        });
    }

    init() {
        const dustCount = Math.min(120, Math.floor(window.innerWidth / 12));
        for (let i = 0; i < dustCount; i++) {
            this.dustParticles.push(this.createDust());
        }
        const inkCount = Math.min(50, Math.floor(window.innerWidth / 30));
        for (let i = 0; i < inkCount; i++) {
            this.inkParticles.push(this.createInk());
        }
        const charCount = Math.min(20, Math.floor(window.innerWidth / 60));
        for (let i = 0; i < charCount; i++) {
            this.charParticles.push(this.createChar());
        }
    }

    createDust() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 1.8 + 0.4,
            baseSize: Math.random() * 1.8 + 0.4,
            speedX: (Math.random() - 0.5) * 0.4,
            speedY: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.4 + 0.1,
            baseOpacity: Math.random() * 0.4 + 0.1,
            phase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.005 + Math.random() * 0.01,
            hue: Math.random() > 0.7 ? '232, 195, 130' : '201, 169, 110'
        };
    }

    createInk() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 60 + 20,
            speedX: (Math.random() - 0.5) * 0.15,
            speedY: Math.random() * 0.2 + 0.05,
            opacity: Math.random() * 0.06 + 0.02,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.002
        };
    }

    createChar() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            char: this.chars[Math.floor(Math.random() * this.chars.length)],
            size: Math.random() * 20 + 16,
            speedX: (Math.random() - 0.5) * 0.2,
            speedY: Math.random() * 0.3 + 0.1,
            opacity: Math.random() * 0.05 + 0.02,
            rotation: Math.random() * 0.4 - 0.2,
            rotSpeed: (Math.random() - 0.5) * 0.003
        };
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.time++;

        // 墨点（最底层）
        this.inkParticles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotSpeed;
            if (p.y - p.size > this.canvas.height) { p.y = -p.size; p.x = Math.random() * this.canvas.width; }
            if (p.x < -p.size) p.x = this.canvas.width + p.size;
            if (p.x > this.canvas.width + p.size) p.x = -p.size;
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
            gradient.addColorStop(0, `rgba(60, 40, 20, ${p.opacity})`);
            gradient.addColorStop(0.5, `rgba(80, 55, 30, ${p.opacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(60, 40, 20, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });

        // 汉字（中间层）
        this.charParticles.forEach(p => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.rotation += p.rotSpeed;
            if (p.y - p.size > this.canvas.height) { p.y = -p.size; p.x = Math.random() * this.canvas.width; p.char = this.chars[Math.floor(Math.random() * this.chars.length)]; }
            if (p.x < -p.size) p.x = this.canvas.width + p.size;
            if (p.x > this.canvas.width + p.size) p.x = -p.size;
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.font = `${p.size}px "Noto Serif SC", serif`;
            this.ctx.fillStyle = `rgba(201, 169, 110, ${p.opacity})`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(p.char, 0, 0);
            this.ctx.restore();
        });

        // 金色光尘（上层）+ 鼠标引力
        this.dustParticles.forEach(p => {
            p.phase += p.pulseSpeed;
            p.opacity = p.baseOpacity + Math.sin(p.phase) * 0.2;
            p.size = p.baseSize + Math.sin(p.phase * 0.7) * 0.3;
            if (this.mouse.active) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    const force = (150 - dist) / 150;
                    p.speedX += (dx / dist) * force * 0.08;
                    p.speedY += (dy / dist) * force * 0.08;
                    p.opacity = Math.min(0.8, p.opacity + force * 0.4);
                    p.size = p.baseSize + force * 1.5;
                }
            }
            p.speedX *= 0.98;
            p.speedY *= 0.98;
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;
            const glowSize = p.size * 3;
            const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
            glow.addColorStop(0, `rgba(${p.hue}, ${p.opacity * 0.8})`);
            glow.addColorStop(1, `rgba(${p.hue}, 0)`);
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${p.hue}, ${Math.min(1, p.opacity)})`;
            this.ctx.fill();
        });

        // 光尘连线
        this.dustParticles.forEach((p1, i) => {
            for (let j = i + 1; j < this.dustParticles.length; j++) {
                const p2 = this.dustParticles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(201, 169, 110, ${0.08 * (1 - dist / 100)})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
        });

        // 点击涟漪
        this.ripples = this.ripples.filter(r => {
            r.radius += r.speed;
            r.alpha *= 0.96;
            if (r.alpha < 0.01 || r.radius > r.maxRadius) return false;
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(201, 169, 110, ${r.alpha})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(139, 94, 52, ${r.alpha * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            return true;
        });

        // 鼠标金色光晕跟随
        if (this.mouse.active) {
            this.cursorGlow.x += (this.mouse.x - this.cursorGlow.x) * 0.1;
            this.cursorGlow.y += (this.mouse.y - this.cursorGlow.y) * 0.1;
            this.cursorGlow.alpha += (0.15 - this.cursorGlow.alpha) * 0.08;
        } else {
            this.cursorGlow.alpha *= 0.92;
        }
        if (this.cursorGlow.alpha > 0.01) {
            const cg = this.ctx.createRadialGradient(
                this.cursorGlow.x, this.cursorGlow.y, 0,
                this.cursorGlow.x, this.cursorGlow.y, 120
            );
            cg.addColorStop(0, `rgba(201, 169, 110, ${this.cursorGlow.alpha})`);
            cg.addColorStop(0.3, `rgba(201, 169, 110, ${this.cursorGlow.alpha * 0.3})`);
            cg.addColorStop(1, 'rgba(201, 169, 110, 0)');
            this.ctx.fillStyle = cg;
            this.ctx.beginPath();
            this.ctx.arc(this.cursorGlow.x, this.cursorGlow.y, 120, 0, Math.PI * 2);
            this.ctx.fill();
        }

        requestAnimationFrame(() => this.animate());
    }
}

// ========================================
// 全局状态
// ========================================
const APP_STATE = {
    currentData: null,
    isProcessing: false,
    hasResults: false,
    isSpeaking: false,
    currentUtterance: null,
    graphSimulation: null,
    qaEnabled: false
};

// ========================================
// 模拟数据 - 论语学而篇（丰富版）
// ========================================
const SAMPLE_DATA = {
    original: [
        '子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」',
        '有子曰：「其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与！」',
        '子曰：「巧言令色，鲜矣仁！」',
        '曾子曰：「吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？」',
        '子曰：「道千乘之国，敬事而信，节用而爱人，使民以时。」'
    ],
    translated: [
        '孔子说：「学了知识又按时温习实践，不是很愉快吗？有志同道合的朋友从远方来，不是很快乐吗？别人不了解我，我却不恼怒，不也是有才德的君子吗？」',
        '有子说：「一个人孝顺父母、敬爱兄长，却喜欢冒犯上级，这种人是很少的；不喜欢冒犯上级，却喜欢造反作乱，这种人从来没有过。君子致力于根本，根本确立了，治国做人的道也就产生了。孝顺父母、敬爱兄长，这就是仁的根本吧！」',
        '孔子说：「花言巧语，装出和颜悦色的样子，这种人的仁德之心就很少了。」',
        '曾子说：「我每天多次反省自己：为别人办事是否尽心竭力了呢？与朋友交往是否诚实可信了呢？老师传授的知识是否复习实践了呢？」',
        '孔子说：「治理拥有千辆兵车的诸侯国，要严谨认真地办理政事而又恪守信用，节约财政开支而又爱护官吏臣僚，役使百姓要不误农时。」'
    ],
    annotations: [
        {
            type: 'person',
            title: '子 / 孔子',
            content: '孔子（公元前551年—公元前479年），名丘，字仲尼，春秋末期鲁国陬邑（今山东曲阜）人。中国古代伟大的思想家、教育家，儒家学派创始人。被后世尊为"至圣先师""万世师表"。其思想核心为"仁"，主张"礼"治，倡导"有教无类"。'
        },
        {
            type: 'person',
            title: '有子 / 有若',
            content: '有若（公元前518年—约公元前458年），字子有，后人尊称为有子，孔子晚年弟子。他在孔门中以道德修养著称，《论语》中对其弟子多称字，唯独曾参与有若被称为"子"，可见其地位之特殊。'
        },
        {
            type: 'person',
            title: '曾子 / 曾参',
            content: '曾参（公元前505年—公元前435年），字子舆，春秋末年鲁国南武城人，孔子晚年弟子。以孝行著称，被后世尊为"宗圣"。相传著述《大学》《孝经》，是儒家道统传承的重要人物。"吾日三省吾身"即出自其口。'
        },
        {
            type: 'person',
            title: '颜回',
            content: '颜回（公元前521年—公元前481年），字子渊，亦称颜渊，春秋末期鲁国人。孔子最得意的弟子，以德行著称，被尊为"复圣"。孔子称赞他"一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐"。'
        },
        {
            type: 'term',
            title: '说 / 悦',
            content: '"说"在此处读yuè，通"悦"，意为愉快、高兴。"不亦说乎"即"不也是令人愉悦的吗"。古文中"说"常作"悦"的通假字，表示内心的喜悦。这种学习之乐是儒家所追求的精神境界。'
        },
        {
            type: 'term',
            title: '孝弟 / 孝悌',
            content: '孝，指孝顺父母；弟（tì），同"悌"，指敬爱兄长。孝悌是儒家伦理的根基，是"仁"的本源。儒家认为，一个人如果能做到在家孝敬父母、敬爱兄长，那么在外就能忠君爱国、顺从长上，不会犯上作乱。'
        },
        {
            type: 'term',
            title: '仁',
            content: '"仁"是孔子思想体系的核心范畴，也是儒家最高的道德准则。其基本含义是"爱人"，即推己及人、关爱他人。"仁"的内涵极为丰富，包括忠、恕、孝、悌、智、勇、恭、宽、信、敏、惠等诸多美德。孔子以"克己复礼为仁"。'
        },
        {
            type: 'term',
            title: '君子',
            content: '"君子"在先秦典籍中含义有二：一指贵族统治者，二指有道德修养的人。《论语》中的"君子"主要指后者，即具有高尚品德和理想人格的人，与"小人"（品德低下者）相对。君子应具备仁、义、礼、智、信等美德。'
        },
        {
            type: 'term',
            title: '礼',
            content: '"礼"是儒家思想的重要范畴，指周代以来形成的典章制度、行为规范和礼仪形式。孔子主张"克己复礼"，认为通过恢复周礼可以整顿社会秩序。礼不仅是外在的仪式规范，更是内在仁德的外在体现。'
        },
        {
            type: 'allusion',
            title: '学而时习之',
            content: '出自《论语·学而》开篇首句，是整部《论语》的纲领。这里的"习"不仅指温习、复习，更包含实践、演习之意。儒家强调知行合一，学习知识后要在实践中不断践行，才能获得真正的快乐和收获。'
        },
        {
            type: 'place',
            title: '鲁国',
            content: '周朝诸侯国之一，都城在今山东曲阜，是周公旦之子伯禽的封国。鲁国是周代礼乐文化保存最完整的诸侯国，有"周礼尽在鲁矣"之称。这为孔子思想的形成提供了深厚的文化土壤。'
        },
        {
            type: 'book',
            title: '《论语》',
            content: '儒家经典"四书"之一，由孔子弟子及再传弟子编纂而成，约成书于战国初期。全书共20篇492章，以语录体为主，记录了孔子及其弟子的言行，集中体现了孔子的政治主张、伦理思想、道德观念及教育原则。'
        }
    ],
    graph: {
        nodes: [
            { id: '孔子', type: 'person', radius: 32 },
            { id: '论语', type: 'book', radius: 30 },
            { id: '学而篇', type: 'book', radius: 24 },
            { id: '颜回', type: 'person', radius: 24 },
            { id: '曾子', type: 'person', radius: 24 },
            { id: '有子', type: 'person', radius: 22 },
            { id: '仁', type: 'term', radius: 28 },
            { id: '礼', type: 'term', radius: 26 },
            { id: '君子', type: 'term', radius: 24 },
            { id: '孝悌', type: 'term', radius: 22 }
        ],
        links: [
            { source: '孔子', target: '论语', value: 3 },
            { source: '孔子', target: '仁', value: 3 },
            { source: '孔子', target: '礼', value: 3 },
            { source: '孔子', target: '君子', value: 2 },
            { source: '孔子', target: '颜回', value: 2 },
            { source: '孔子', target: '曾子', value: 2 },
            { source: '孔子', target: '有子', value: 1 },
            { source: '论语', target: '学而篇', value: 3 },
            { source: '学而篇', target: '仁', value: 2 },
            { source: '学而篇', target: '君子', value: 2 },
            { source: '学而篇', target: '孝悌', value: 2 },
            { source: '仁', target: '孝悌', value: 2 },
            { source: '仁', target: '礼', value: 2 },
            { source: '仁', target: '君子', value: 2 },
            { source: '曾子', target: '孝悌', value: 2 },
            { source: '有子', target: '孝悌', value: 2 },
            { source: '颜回', target: '仁', value: 1 }
        ]
    },
    story: ''
};

// ========================================
// 加载提示文本
// ========================================
const LOADER_TIPS = [
    '中国最早的书籍形式是简牍，以竹片或木片编成，始于商周时期。',
    '《论语》共20篇492章，是儒家学派最重要的经典著作之一。',
    '雕版印刷术发明于唐代，极大推动了古籍的传播与文化普及。',
    '甲骨文是最早的成熟汉字系统，距今已有三千多年历史。',
    '《四库全书》收录古籍3500余种、79000余卷，是中国古代最大的丛书。',
    '"学富五车"源自战国时期，形容读书多、学识渊博，典出《庄子·天下》。',
    '线装书是中国古籍最具代表性的装帧形式，出现于明代中叶。'
];

const PROCESSING_TIPS = [
    '正在运用AI视觉技术识别古籍文字...',
    '智能断句标点，还原古文原貌...',
    '深度学习模型进行文白对照翻译...',
    '知识图谱引擎提取人物、地点、典故...',
    '构建实体关系网络，连接千年文脉...'
];

// ========================================
// 2. 卷轴加载动画
// ========================================
function initScrollLoader() {
    const loader = document.getElementById('scrollLoader');
    if (!loader) {
        // 如果没有loader，直接移除loading状态
        document.body.classList.remove('is-loading');
        document.body.classList.add('is-loaded');
        return;
    }

    const progressBar = loader.querySelector('.loader-progress, .progress-bar');
    const tipEl = loader.querySelector('.loader-tip, .loader-text');
    document.body.style.overflow = 'hidden';

    let progress = 0;
    let tipIndex = 0;

    // 切换提示文字
    const tipInterval = setInterval(() => {
        tipIndex = (tipIndex + 1) % LOADER_TIPS.length;
        if (tipEl) tipEl.textContent = LOADER_TIPS[tipIndex];
    }, 500);

    // 进度条动画
    const progressInterval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            if (progressBar) progressBar.style.width = '100%';

            // 加载完成，收起卷轴
            setTimeout(() => {
                clearInterval(tipInterval);
                loader.classList.add('opening', 'opened');
                document.body.classList.remove('is-loading');
                document.body.classList.add('is-loaded');

                // 卷轴收起后启动打字机
                setTimeout(() => {
                    initTypewriter();
                }, 400);

                setTimeout(() => {
                    loader.classList.add('hidden');
                    document.body.style.overflow = '';
                }, 1400);
            }, 300);
        } else {
            if (progressBar) progressBar.style.width = progress + '%';
        }
    }, 80);
}

// ========================================
// 4. 打字机效果
// ========================================
function initTypewriter() {
    const lines = document.querySelectorAll('.typewriter-line');
    if (!lines.length) return;

    let lineIndex = 0;
    let charIndex = 0;
    const typeSpeed = 100;
    const lineDelay = 350;

    function typeLine() {
        if (lineIndex >= lines.length) {
            // 所有行打完，触发highlight流光
            lines.forEach((line, i) => {
                setTimeout(() => {
                    if (line.classList.contains('highlight') || line.classList.contains('title-line')) {
                        line.classList.add('shimmer');
                    }
                    line.classList.add('done');
                }, i * 200);
            });
            return;
        }

        const currentLine = lines[lineIndex];
        const text = currentLine.getAttribute('data-text') || currentLine.textContent || '';
        currentLine.textContent = '';
        currentLine.classList.add('typing');

        function typeChar() {
            if (charIndex < text.length) {
                currentLine.textContent = text.substring(0, charIndex + 1);
                charIndex++;
                setTimeout(typeChar, typeSpeed);
            } else {
                currentLine.classList.remove('typing');
                currentLine.classList.add('done');
                lineIndex++;
                charIndex = 0;
                setTimeout(typeLine, lineDelay);
            }
        }
        typeChar();
    }

    // 光标处理
    const cursor = document.querySelector('.typewriter-cursor');
    if (cursor) {
        cursor.style.animation = 'blink 0.8s infinite';
    }

    typeLine();
}

// ========================================
// 3. 导航栏功能
// ========================================
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    // 滚动时改变背景
    const onScroll = () => {
        const scrollY = window.pageYOffset;
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 更新导航链接active状态
        const sections = document.querySelectorAll('section[id]');
        let currentId = '';
        sections.forEach(section => {
            const top = section.offsetTop - 120;
            const bottom = top + section.offsetHeight;
            if (scrollY >= top && scrollY < bottom) {
                currentId = section.getAttribute('id');
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === '#' + currentId) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // 导航链接平滑滚动
    document.querySelectorAll('.nav-link, a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

// ========================================
// 3b. 日夜模式切换
// ========================================
function initThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle') || document.querySelector('.theme-toggle');
    if (!toggleBtn) return;

    // 读取localStorage偏好或跟随系统
    const savedTheme = localStorage.getItem('dianji-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'night' || (!savedTheme && prefersDark)) {
        document.body.classList.add('night-mode');
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('night-mode');
        const isNight = document.body.classList.contains('night-mode');
        localStorage.setItem('dianji-theme', isNight ? 'night' : 'day');
        showToast(isNight ? '已切换至夜间模式' : '已切换至日间模式', 'info', 1500);
    });
}

// ========================================
// 5. 全局滚动动画(IntersectionObserver)
// ========================================
function initEnhancedScrollAnimations() {
    const selectors = [
        '.feature-card',
        '.tech-node',
        '.about-card',
        '.section-header',
        '.about-footer',
        '.footer',
        '.story-number-item',
        '.story-quote'
    ];

    const elements = document.querySelectorAll(selectors.join(', '));
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 计算stagger延迟（同级兄弟元素）
                const parent = entry.target.parentElement;
                let delay = 0;
                if (parent) {
                    const siblings = Array.from(parent.children).filter(
                        c => selectors.some(s => c.matches(s))
                    );
                    const index = siblings.indexOf(entry.target);
                    delay = Math.min(index * 100, 600);
                }

                setTimeout(() => {
                    entry.target.classList.add('aos-animate', 'in-view');
                }, delay);

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
}

// ========================================
// 6. 数字计数动画
// ========================================
function initCounters() {
    const counters = document.querySelectorAll('[data-count], .stat-number, .story-num');
    if (!counters.length) return;

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function formatNumber(n) {
        if (n >= 100000000) return (n / 100000000).toFixed(0) + '亿';
        if (n >= 10000) return n.toLocaleString('zh-CN');
        return n.toString();
    }

    counters.forEach(counter => {
        const targetStr = counter.getAttribute('data-count') || counter.textContent;
        const target = parseInt(targetStr.replace(/[^0-9]/g, ''));
        if (isNaN(target)) return;

        // 大数直接显示
        const isLargeNumber = target >= 5000;
        const duration = 2000;
        let hasAnimated = false;

        const animate = () => {
            if (hasAnimated) return;
            hasAnimated = true;

            if (isLargeNumber && target >= 100000000) {
                counter.textContent = formatNumber(target);
                return;
            }

            const startTime = performance.now();
            function update(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeOutCubic(progress);
                const current = Math.round(eased * target);
                counter.textContent = isLargeNumber ? formatNumber(current) : current;
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counter.textContent = formatNumber(target);
                }
            }
            requestAnimationFrame(update);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(counter);
    });
}

// ========================================
// 7. 滚动进度条
// ========================================
function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress') || document.querySelector('.scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = percent + '%';
    }, { passive: true });
}

// ========================================
// 8. 返回顶部按钮
// ========================================
function initBackToTop() {
    const btn = document.getElementById('backToTop') || document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 600) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========================================
// 9. 水墨分隔符动画
// ========================================
function initInkDividerAnimations() {
    const dividers = document.querySelectorAll('.ink-divider');
    if (!dividers.length) return;

    dividers.forEach(d => {
        d.style.transform = 'scaleY(0)';
        d.style.transformOrigin = 'top center';
        d.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease';
        d.style.opacity = '0';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transform = 'scaleY(1)';
                entry.target.style.opacity = '1';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    dividers.forEach(d => observer.observe(d));
}

// ========================================
// 20. Toast通知系统
// ========================================
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        container.style.cssText = 'position:fixed;top:80px;right:20px;z-index:10000;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
        document.body.appendChild(container);
    }

    const icons = {
        info: '&#x2139;',
        success: '&#x2714;',
        error: '&#x2716;',
        warning: '&#x26A0;'
    };

    const colors = {
        info: '#6b8cae',
        success: '#2d6a4f',
        error: '#c0392b',
        warning: '#e67e22'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        background: rgba(26, 20, 16, 0.95);
        border: 1px solid ${colors[type]};
        border-left: 4px solid ${colors[type]};
        border-radius: 8px;
        color: #e8dcc8;
        font-size: 14px;
        font-family: "Noto Sans SC", sans-serif;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transform: translateX(120%);
        transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s;
        opacity: 0;
        max-width: 360px;
    `;
    toast.innerHTML = `<span class="toast-icon" style="color:${colors[type]};font-size:18px;">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ========================================
// 10. Demo上传功能
// ========================================
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const sampleBtn = document.getElementById('sampleBtn');
    const dragOverlay = document.querySelector('.upload-drag-overlay');
    if (!uploadArea) return;

    // 拖拽事件
    ['dragenter', 'dragover'].forEach(ev => {
        uploadArea.addEventListener(ev, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.add('drag-over');
            if (dragOverlay) dragOverlay.style.display = 'flex';
        });
    });

    ['dragleave', 'drop'].forEach(ev => {
        uploadArea.addEventListener(ev, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('drag-over');
            if (dragOverlay) dragOverlay.style.display = 'none';
        });
    });

    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 文件选择
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        // 点击上传区域触发文件选择
        uploadArea.addEventListener('click', (e) => {
            if (e.target === sampleBtn || e.target.closest('#sampleBtn')) return;
            fileInput.click();
        });
    }

    // 示例按钮
    if (sampleBtn) {
        sampleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleSample();
        });
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件（JPG/PNG等）', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        startProcessing(e.target.result);
    };
    reader.onerror = () => {
        showToast('文件读取失败，请重试', 'error');
    };
    reader.readAsDataURL(file);
}

function handleSample() {
    const samplePaths = [
        'assets/sample_guji_1.jpg',
        'images/sample_guji_1.jpg',
        './assets/sample_guji_1.jpg'
    ];

    // 尝试加载示例图片，失败则直接用模拟数据
    const tryLoad = (index) => {
        if (index >= samplePaths.length) {
            // 全部失败，直接用模拟数据（无图片）
            showToast('示例图片加载失败，使用内置模拟数据演示', 'warning');
            startProcessing(null);
            return;
        }
        const img = new Image();
        img.onload = () => startProcessing(samplePaths[index]);
        img.onerror = () => tryLoad(index + 1);
        img.src = samplePaths[index];
    };
    tryLoad(0);
}

// ========================================
// 11. 处理流程模拟
// ========================================
function startProcessing(imgSrc) {
    if (APP_STATE.isProcessing) return;
    APP_STATE.isProcessing = true;

    const uploadArea = document.getElementById('uploadArea');
    const processingArea = document.getElementById('processingArea');
    const processingImg = document.getElementById('processingImg');
    const resultArea = document.getElementById('resultArea');

    if (uploadArea) uploadArea.style.display = 'none';
    if (processingArea) processingArea.style.display = 'grid';
    if (resultArea) resultArea.style.display = 'none';

    if (processingImg && imgSrc) {
        processingImg.src = imgSrc;
        processingImg.style.display = 'block';
    } else if (processingImg) {
        processingImg.style.display = 'none';
    }

    // 重置步骤状态
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
        const bar = step.querySelector('.step-bar');
        const status = step.querySelector('.step-status');
        if (bar) bar.style.width = '0%';
        if (status) {
            status.textContent = '等待中';
            status.style.color = '';
        }
    });

    const steps = [
        { num: 1, name: 'OCR 文字识别', tip: PROCESSING_TIPS[0] },
        { num: 2, name: '智能断句标点', tip: PROCESSING_TIPS[1] },
        { num: 3, name: '文白对照翻译', tip: PROCESSING_TIPS[2] },
        { num: 4, name: '注释解读生成', tip: PROCESSING_TIPS[3] },
        { num: 5, name: '知识图谱构建', tip: PROCESSING_TIPS[4] }
    ];

    const tipEl = document.getElementById('processingTip') || document.querySelector('.processing-tip');

    let stepIndex = 0;

    const processNextStep = () => {
        if (stepIndex >= steps.length) {
            APP_STATE.isProcessing = false;
            setTimeout(() => showResults(SAMPLE_DATA), 400);
            return;
        }

        const stepData = steps[stepIndex];
        const stepEl = document.querySelector(`.step[data-step="${stepData.num}"]`);
        if (!stepEl) {
            stepIndex++;
            processNextStep();
            return;
        }

        const bar = stepEl.querySelector('.step-bar');
        const status = stepEl.querySelector('.step-status');

        stepEl.classList.add('active');
        if (status) {
            status.textContent = '处理中...';
            status.style.color = '';
        }
        if (tipEl) tipEl.textContent = stepData.tip;

        // 进度条动画
        let progress = 0;
        const stepDuration = 800 + Math.random() * 400;
        const progressInterval = setInterval(() => {
            progress += 4 + Math.random() * 4;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                if (bar) bar.style.width = '100%';
                stepEl.classList.remove('active');
                stepEl.classList.add('completed');
                if (status) {
                    status.innerHTML = '&#x2713; 完成';
                    status.style.color = '#2d6a4f';
                }
                stepIndex++;
                setTimeout(processNextStep, 150);
            } else {
                if (bar) bar.style.width = progress + '%';
            }
        }, stepDuration / 25);
    };

    // 延迟一下再开始，让用户看到processing界面
    setTimeout(processNextStep, 500);
}

// ========================================
// 13. 结果展示
// ========================================
function showResults(data) {
    APP_STATE.currentData = data;
    APP_STATE.hasResults = true;
    APP_STATE.qaEnabled = true;

    const processingArea = document.getElementById('processingArea');
    const resultArea = document.getElementById('resultArea');
    if (processingArea) processingArea.style.display = 'none';
    if (resultArea) resultArea.style.display = 'block';

    // 填充原文
    renderTextContent('originalText', data.original, true);
    // 填充译文
    renderTextContent('translatedText', data.translated, false);

    // 填充注释
    renderAnnotations('all');

    // 渲染知识图谱
    setTimeout(() => renderKnowledgeGraph(), 200);

    // 启用QA
    enableQA();

    // 重置故事区域
    const storyContent = document.getElementById('storyContent');
    if (storyContent) storyContent.innerHTML = '';
    const storyBtn = document.getElementById('storyBtn');
    if (storyBtn) {
        storyBtn.disabled = false;
        storyBtn.innerHTML = '<span class="btn-icon">&#x2728;</span> 生成故事';
    }

    showToast('古籍解析完成！', 'success');
}

function renderTextContent(containerId, paragraphs, isOriginal) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const textArray = Array.isArray(paragraphs) ? paragraphs : paragraphs.split(/\n+/).filter(p => p.trim());

    textArray.forEach((text, i) => {
        const p = document.createElement('p');
        p.className = 'brush-text';
        p.textContent = text;
        // 逐字显现动画
        p.style.opacity = '0';
        p.style.transform = 'translateY(10px)';
        p.style.transition = `opacity 0.6s ease ${i * 0.15}s, transform 0.6s ease ${i * 0.15}s`;
        container.appendChild(p);

        setTimeout(() => {
            p.style.opacity = '1';
            p.style.transform = 'translateY(0)';
        }, 50 + i * 100);
    });
}

// ========================================
// 注释渲染与筛选
// ========================================
function renderAnnotations(filter) {
    const list = document.getElementById('annotationsList');
    if (!list || !APP_STATE.currentData) return;

    const annotations = filter === 'all'
        ? APP_STATE.currentData.annotations
        : APP_STATE.currentData.annotations.filter(a => a.type === filter);

    const typeLabels = { person: '人物', place: '地点', term: '术语', allusion: '典故', book: '典籍' };
    const typeColors = {
        person: '#8b5e34',
        place: '#2d6a4f',
        term: '#a67c52',
        allusion: '#c9a96e',
        book: '#6b8cae'
    };

    list.innerHTML = '';
    annotations.forEach((a, i) => {
        const card = document.createElement('div');
        card.className = 'annotation-card';
        card.style.cssText = `
            background: rgba(201, 169, 110, 0.06);
            border: 1px solid rgba(201, 169, 110, 0.2);
            border-radius: 10px;
            padding: 16px;
            opacity: 0;
            transform: translateY(15px);
            transition: opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s, border-color 0.3s;
        `;
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                <span style="color:${typeColors[a.type] || '#c9a96e'};font-weight:600;font-size:16px;font-family:'Noto Serif SC',serif;">${a.title}</span>
                <span style="font-size:12px;padding:2px 8px;border-radius:10px;background:${typeColors[a.type] || '#c9a96e'}22;color:${typeColors[a.type] || '#c9a96e'};border:1px solid ${typeColors[a.type] || '#c9a96e'}44;">${typeLabels[a.type] || a.type}</span>
            </div>
            <div style="font-size:14px;color:rgba(232,220,200,0.8);line-height:1.8;">${a.content}</div>
        `;
        list.appendChild(card);

        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 50 + i * 60);
    });

    // 绑定筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAnnotations(btn.getAttribute('data-filter') || 'all');
        });
    });
}

// ========================================
// 知识图谱 - SVG力导向图（简化版D3风格）
// ========================================
let graphState = null;

function renderKnowledgeGraph() {
    const svg = document.getElementById('knowledgeGraph');
    const container = document.getElementById('graphContainer') || svg?.parentElement;
    if (!svg || !container || !APP_STATE.currentData?.graph) return;

    let width = container.clientWidth || 600;
    let height = container.clientHeight || 400;
    if (width < 10) width = 600;
    if (height < 10) height = 400;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.innerHTML = '';

    const colors = {
        person: '#c9a96e',
        place: '#6b8cae',
        term: '#8b5e34',
        allusion: '#a67c52',
        book: '#2d6a4f',
        event: '#e67e22'
    };

    const graph = APP_STATE.currentData.graph;
    const nodes = graph.nodes.map((n, i) => ({
        ...n,
        x: width / 2 + (Math.random() - 0.5) * 200 + Math.cos(i * 2 * Math.PI / graph.nodes.length) * 100,
        y: height / 2 + (Math.random() - 0.5) * 200 + Math.sin(i * 2 * Math.PI / graph.nodes.length) * 100,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null
    }));

    const links = graph.links.map(l => ({
        source: nodes.find(n => n.id === l.source),
        target: nodes.find(n => n.id === l.target),
        value: l.value
    })).filter(l => l.source && l.target);

    graphState = { nodes, links, svg, width, height, zoom: 1, dragNode: null };

    // 创建主g元素用于缩放
    const mainG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    mainG.setAttribute('class', 'graph-main');
    svg.appendChild(mainG);

    // 连线组
    const linkGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linkGroup.setAttribute('class', 'links');
    mainG.appendChild(linkGroup);

    // 节点组
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nodeGroup.setAttribute('class', 'nodes');
    mainG.appendChild(nodeGroup);

    // 绘制连线
    const linkEls = [];
    links.forEach(l => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('stroke', 'rgba(201,169,110,0.25)');
        line.setAttribute('stroke-width', String(l.value || 1.5));
        line.setAttribute('data-source', l.source.id);
        line.setAttribute('data-target', l.target.id);
        linkGroup.appendChild(line);
        linkEls.push(line);
    });

    // 绘制节点
    const nodeEls = [];
    nodes.forEach(n => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'graph-node');
        g.setAttribute('data-id', n.id);
        g.style.cursor = 'grab';

        const color = colors[n.type] || '#c9a96e';
        const r = n.radius || 22;

        // 外圈光晕
        const glowCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glowCircle.setAttribute('r', String(r + 6));
        glowCircle.setAttribute('fill', color);
        glowCircle.setAttribute('opacity', '0.15');
        g.appendChild(glowCircle);

        // 主圆
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', String(r));
        circle.setAttribute('fill', color);
        circle.setAttribute('opacity', '0.85');
        circle.setAttribute('stroke', 'rgba(201,169,110,0.5)');
        circle.setAttribute('stroke-width', '2');
        g.appendChild(circle);

        // 文字
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', String(r + 16));
        text.setAttribute('fill', 'rgba(232,220,200,0.9)');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-family', '"Noto Sans SC", sans-serif');
        text.textContent = n.id;
        g.appendChild(text);

        nodeGroup.appendChild(g);
        nodeEls.push({ g, circle, glowCircle, text, node: n });
    });

    // 力导向模拟
    function tick() {
        if (!graphState) return;

        // 斥力
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                let dx = b.x - a.x, dy = b.y - a.y;
                let dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const minDist = (a.radius || 22) + (b.radius || 22) + 20;
                if (dist < minDist) dist = minDist;
                const force = 800 / (dist * dist);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                if (!a.fx) { a.vx -= fx; a.vy -= fy; }
                if (!b.fx) { b.vx += fx; b.vy += fy; }
            }
        }

        // 引力（连线）
        links.forEach(l => {
            const dx = l.target.x - l.source.x;
            const dy = l.target.y - l.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 100) * 0.005 * (l.value || 1);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            if (!l.source.fx) { l.source.vx += fx; l.source.vy += fy; }
            if (!l.target.fx) { l.target.vx -= fx; l.target.vy -= fy; }
        });

        // 中心引力
        nodes.forEach(n => {
            if (n.fx) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; return; }
            n.vx += (width / 2 - n.x) * 0.002;
            n.vy += (height / 2 - n.y) * 0.002;
            n.vx *= 0.85;
            n.vy *= 0.85;
            n.x += n.vx;
            n.y += n.vy;
            // 边界约束
            const r = n.radius || 22;
            n.x = Math.max(r + 20, Math.min(width - r - 20, n.x));
            n.y = Math.max(r + 20, Math.min(height - r - 40, n.y));
        });

        // 更新位置
        linkEls.forEach(line => {
            const s = links.find(l => l.source.id === line.getAttribute('data-source') && l.target.id === line.getAttribute('data-target'));
            if (s) {
                line.setAttribute('x1', s.source.x);
                line.setAttribute('y1', s.source.y);
                line.setAttribute('x2', s.target.x);
                line.setAttribute('y2', s.target.y);
            }
        });

        nodeEls.forEach(({ g, circle, glowCircle, text, node }) => {
            g.setAttribute('transform', `translate(${node.x},${node.y})`);
        });

        graphState.animFrame = requestAnimationFrame(tick);
    }

    // 运行一段时间后停止自动模拟（节省性能）
    let simTime = 0;
    const simInterval = setInterval(() => {
        simTime++;
        if (simTime > 8) {
            clearInterval(simInterval);
            cancelAnimationFrame(graphState.animFrame);
        }
    }, 100);

    tick();

    // 拖拽功能
    nodeEls.forEach(({ g, node }) => {
        const onStart = (e) => {
            e.preventDefault();
            const pt = getSVGPoint(svg, e);
            node.fx = node.x;
            node.fy = node.y;
            graphState.dragNode = node;
            g.style.cursor = 'grabbing';
            // 高亮关联
            highlightNode(node.id, nodeEls, linkEls, true);
        };
        const onMove = (e) => {
            if (!graphState.dragNode || graphState.dragNode !== node) return;
            e.preventDefault();
            const pt = getSVGPoint(svg, e);
            node.fx = pt.x / graphState.zoom;
            node.fy = pt.y / graphState.zoom;
            node.x = node.fx;
            node.y = node.fy;
            // 重启模拟
            cancelAnimationFrame(graphState.animFrame);
            tick();
        };
        const onEnd = () => {
            if (graphState.dragNode === node) {
                node.fx = null;
                node.fy = null;
                graphState.dragNode = null;
                g.style.cursor = 'grab';
                setTimeout(() => {
                    highlightNode(null, nodeEls, linkEls, false);
                    // 让节点自然归位
                    tick();
                    setTimeout(() => cancelAnimationFrame(graphState.animFrame), 2000);
                }, 100);
            }
        };

        g.addEventListener('mousedown', onStart);
        g.addEventListener('touchstart', onStart, { passive: false });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);

        // hover效果
        g.addEventListener('mouseenter', () => {
            if (!graphState.dragNode) highlightNode(node.id, nodeEls, linkEls, true);
        });
        g.addEventListener('mouseleave', () => {
            if (!graphState.dragNode) highlightNode(null, nodeEls, linkEls, false);
        });
    });

    // 缩放功能
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const resetGraph = document.getElementById('resetGraph');

    if (zoomIn) {
        zoomIn.onclick = () => {
            graphState.zoom = Math.min(graphState.zoom * 1.3, 3);
            mainG.setAttribute('transform', `scale(${graphState.zoom})`);
            mainG.setAttribute('transform-origin', 'center');
        };
    }
    if (zoomOut) {
        zoomOut.onclick = () => {
            graphState.zoom = Math.max(graphState.zoom / 1.3, 0.4);
            mainG.setAttribute('transform', `scale(${graphState.zoom})`);
            mainG.setAttribute('transform-origin', 'center');
        };
    }
    if (resetGraph) {
        resetGraph.onclick = () => {
            graphState.zoom = 1;
            mainG.setAttribute('transform', 'scale(1)');
            renderKnowledgeGraph();
        };
    }

    // 滚轮缩放
    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        graphState.zoom = Math.max(0.4, Math.min(3, graphState.zoom * delta));
        mainG.setAttribute('transform', `scale(${graphState.zoom})`);
        mainG.setAttribute('transform-origin', 'center');
    }, { passive: false });
}

function getSVGPoint(svg, event) {
    const pt = svg.createSVGPoint();
    const e = event.touches ? event.touches[0] : event;
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        return { x: transformed.x, y: transformed.y };
    }
    return { x: e.clientX, y: e.clientY };
}

function highlightNode(nodeId, nodeEls, linkEls, active) {
    if (!active || !nodeId) {
        nodeEls.forEach(({ circle, glowCircle }) => {
            circle.setAttribute('opacity', '0.85');
            glowCircle.setAttribute('opacity', '0.15');
        });
        linkEls.forEach(line => {
            line.setAttribute('stroke', 'rgba(201,169,110,0.25)');
            line.setAttribute('stroke-width', String(parseFloat(line.getAttribute('data-sw') || line.getAttribute('stroke-width')) || 1.5));
        });
        return;
    }

    const connectedIds = new Set([nodeId]);
    linkEls.forEach(line => {
        const s = line.getAttribute('data-source');
        const t = line.getAttribute('data-target');
        if (s === nodeId) connectedIds.add(t);
        if (t === nodeId) connectedIds.add(s);
    });

    nodeEls.forEach(({ circle, glowCircle, node }) => {
        if (connectedIds.has(node.id)) {
            circle.setAttribute('opacity', '1');
            glowCircle.setAttribute('opacity', '0.3');
        } else {
            circle.setAttribute('opacity', '0.2');
            glowCircle.setAttribute('opacity', '0.05');
        }
    });

    linkEls.forEach(line => {
        const s = line.getAttribute('data-source');
        const t = line.getAttribute('data-target');
        if (s === nodeId || t === nodeId) {
            line.setAttribute('stroke', 'rgba(201,169,110,0.8)');
            line.setAttribute('stroke-width', '2.5');
        } else {
            line.setAttribute('stroke', 'rgba(201,169,110,0.06)');
        }
    });
}

// ========================================
// 故事生成
// ========================================
function generateStory() {
    const storyBtn = document.getElementById('storyBtn');
    const storyContent = document.getElementById('storyContent');
    if (!storyContent || !APP_STATE.currentData) return;

    if (APP_STATE.currentData.story) {
        storyContent.innerHTML = `<div class="story-text" style="line-height:2;font-size:15px;color:rgba(232,220,200,0.9);padding:16px;background:rgba(201,169,110,0.05);border-radius:10px;border-left:3px solid #c9a96e;">${APP_STATE.currentData.story}</div>`;
        return;
    }

    storyBtn.disabled = true;
    storyBtn.innerHTML = '<span class="btn-icon">&#x23F3;</span> 生成中...';
    storyContent.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(201,169,110,0.7);"><div style="display:inline-block;width:24px;height:24px;border:2px solid rgba(201,169,110,0.3);border-top-color:#c9a96e;border-radius:50%;animation:spin 0.8s linear infinite;margin-bottom:10px;"></div><br>AI 正在将古文转化为生动故事...</div>';

    setTimeout(() => {
        const story = `春秋末期，鲁国曲阜阙里，一位少年正端坐于杏坛之下，凝神聆听夫子讲学。时值暮春，沂水之畔杨柳依依，夫子抚琴而歌："学而时习之，不亦说乎？"少年名唤曾参，虽天资不算最聪颖，却最为勤勉。他每日归家，必再三反省：今日为师长办事是否尽心？与朋友相交是否有信？老师所授学问是否温习践行？

同年，有若在与同门论学时说道："君子务本，本立而道生。孝悌乃是仁之本。"众人深以为然。彼时天下礼崩乐坏，诸侯争霸，孔子周游列国十四载，始归鲁国，删诗书、定礼乐、赞周易、修春秋，终成一代宗师。颜回居陋巷而不改其乐，仲由好勇而善于政事，子贡善辩而货殖有方——孔门三千弟子、七十二贤人，共同书写了中华文明的精神源头。

"人不知而不愠，不亦君子乎？"这声跨越两千五百年的教诲，至今仍在每一个捧读《论语》的人心中回响。那些竹简上的文字，经由雕版、线装，到今日的数字载体，承载着一个民族对修身、齐家、治国、平天下的永恒追求。典籍新生，故纸有灵——古老的智慧正以全新的方式，照见当代人的精神世界。`;

        APP_STATE.currentData.story = story;
        storyContent.innerHTML = `<div class="story-text" style="line-height:2;font-size:15px;color:rgba(232,220,200,0.9);padding:16px;background:rgba(201,169,110,0.05);border-radius:10px;border-left:3px solid #c9a96e;white-space:pre-line;">${story}</div>`;
        storyBtn.disabled = false;
        storyBtn.innerHTML = '<span class="btn-icon">&#x2728;</span> 重新生成';
        showToast('故事生成完成！', 'success');
    }, 1500);
}

// ========================================
// 14. AI问答功能
// ========================================
function initQA() {
    const qaInput = document.getElementById('qaInput');
    const qaSendBtn = document.getElementById('qaSendBtn');
    if (!qaInput || !qaSendBtn) return;

    const sendMessage = () => {
        const question = qaInput.value.trim();
        if (!question || !APP_STATE.qaEnabled) {
            if (!APP_STATE.qaEnabled) showToast('请先上传古籍图片开始解析', 'warning');
            return;
        }
        addQAMessage('user', question);
        qaInput.value = '';

        // "AI思考中"
        const thinkingId = 'thinking-' + Date.now();
        addQAMessage('ai', '正在思考...', thinkingId, true);

        setTimeout(() => {
            // 移除thinking消息
            const thinkingEl = document.getElementById(thinkingId);
            if (thinkingEl) thinkingEl.remove();

            const answer = generateAnswer(question);
            addQAMessage('ai', answer);
        }, 1000 + Math.random() * 1000);
    };

    qaSendBtn.addEventListener('click', sendMessage);
    qaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
}

function enableQA() {
    const qaInput = document.getElementById('qaInput');
    const qaSendBtn = document.getElementById('qaSendBtn');
    if (qaInput) qaInput.disabled = false;
    if (qaSendBtn) qaSendBtn.disabled = false;

    // 欢迎消息
    const chatMessages = document.getElementById('qaMessages');
    if (chatMessages && chatMessages.children.length === 0) {
        addQAMessage('ai', '您好！我是典籍助手，您可以向我提问关于这段文字的任何问题，例如：\n· 这段话的核心思想是什么？\n· 孔子是谁？\n· "君子"是什么意思？');
    }
}

function addQAMessage(role, text, id, isThinking) {
    const chatMessages = document.getElementById('qaMessages');
    if (!chatMessages) return;

    const msg = document.createElement('div');
    if (id) msg.id = id;
    msg.className = `qa-message qa-${role}`;
    msg.style.cssText = `
        display: flex;
        ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
        margin-bottom: 12px;
        animation: fadeInUp 0.3s ease;
    `;

    const bubble = document.createElement('div');
    bubble.style.cssText = role === 'user' ? `
        max-width: 80%;
        padding: 10px 14px;
        background: linear-gradient(135deg, #c9a96e, #a67c52);
        color: #1a1410;
        border-radius: 14px 14px 4px 14px;
        font-size: 14px;
        line-height: 1.6;
        white-space: pre-wrap;
    ` : `
        max-width: 85%;
        padding: 12px 16px;
        background: rgba(201, 169, 110, 0.08);
        border: 1px solid rgba(201, 169, 110, 0.2);
        color: #e8dcc8;
        border-radius: 14px 14px 14px 4px;
        font-size: 14px;
        line-height: 1.7;
        white-space: pre-wrap;
    `;

    if (isThinking) {
        bubble.innerHTML = '<span style="display:inline-block;width:8px;height:8px;background:#c9a96e;border-radius:50%;margin:0 2px;animation:bounce 1.4s infinite ease-in-out both;"></span><span style="display:inline-block;width:8px;height:8px;background:#c9a96e;border-radius:50%;margin:0 2px;animation:bounce 1.4s infinite ease-in-out both;animation-delay:0.16s;"></span><span style="display:inline-block;width:8px;height:8px;background:#c9a96e;border-radius:50%;margin:0 2px;animation:bounce 1.4s infinite ease-in-out both;animation-delay:0.32s;"></span>';
    } else {
        bubble.textContent = text;
    }

    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateAnswer(question) {
    const q = question.toLowerCase();

    if (q.includes('核心思想') || q.includes('主旨') || q.includes('主要讲') || q.includes('讲了什么')) {
        return '《学而》篇作为《论语》开篇，核心思想可概括为三个层面：\n\n一、「为学之道」——"学而时习之"强调学习与实践结合，知行合一才能获得真正的愉悦；\n\n二、「交友之乐」——"有朋自远方来"表达学术交流与志同道合之乐，学问需要切磋琢磨；\n\n三、「修身之境」——"人不知而不愠"指向君子不怨天尤人、反求诸己的修养境界。\n\n此外，有子提出的"孝弟为仁之本"确立了儒家伦理从家庭出发的修养路径，而曾子的"吾日三省吾身"则强调了内省自律的修养方法。整体贯穿了"学—思—行"的修身主线。';
    }

    if (q.includes('孔子') || q.includes('夫子') || q.includes('孔丘')) {
        return '孔子（公元前551年—公元前479年），名丘，字仲尼，春秋末期鲁国陬邑（今山东曲阜）人。他是中国古代最伟大的思想家、教育家，儒家学派的创始人。\n\n孔子的主要贡献：\n· 思想上：创立以"仁"为核心、以"礼"为规范的儒家思想体系；\n· 教育上：首创私学，主张"有教无类"，打破了贵族对教育的垄断，相传有弟子三千、贤人七十二；\n· 文化上：整理编订《诗》《书》《礼》《乐》《易》《春秋》六经，保存了上古文化典籍。\n\n孔子被后世尊为"至圣先师""万世师表"，其思想不仅深刻塑造了中华文明，也对东亚乃至世界文化产生了深远影响。';
    }

    if (q.includes('君子')) {
        return '"君子"是儒家理想人格的核心概念，在《论语》中出现多达107次。其含义在孔子这里实现了从"地位贵族"到"道德贵族"的转化：\n\n一、内在修养：君子以"仁"为本，具备仁、义、礼、智、信五常之德；\n\n二、外在表现："君子务本""君子坦荡荡""君子成人之美""君子和而不同"；\n\n三、处世态度："人不知而不愠"——不因他人不了解自己而恼怒；"先行其言而后从之"——先做后说；\n\n四、对照小人："君子喻于义，小人喻于利""君子周而不比，小人比而不周"。\n\n简言之，君子是兼具道德自觉、文化修养和社会责任的理想人格典范。';
    }

    if (q.includes('仁')) {
        return '"仁"是孔子思想的最高范畴和核心理念，在《论语》中出现109次。其内涵极为丰富：\n\n· 核心定义："樊迟问仁，子曰：爱人。"即关爱他人、推己及人；\n· 实践方法："己所不欲，勿施于人"（恕道）、"己欲立而立人，己欲达而达人"（忠道）；\n· 外在规范："克己复礼为仁"，通过约束自身、践行礼义来实现仁；\n· 具体德目：恭、宽、信、敏、惠——庄重、宽厚、诚信、勤敏、慈惠；\n· 根本起点：孝悌为仁之本，从孝顺父母、敬爱兄长开始培养仁德。\n\n仁不是抽象的概念，而是要在日常人伦中践行的生命境界。';
    }

    if (q.includes('孝') || q.includes('悌') || q.includes('孝弟')) {
        return '"孝"指孝顺父母，"弟"（tì）同"悌"，指敬爱兄长。孝悌是儒家伦理的根基：\n\n有子曰："孝弟也者，其为仁之本与！"在儒家看来，人一生最先面对的人伦关系就是家庭中的亲子和兄弟关系。一个人如果能在家庭中做到孝亲敬长，自然会将这份爱心推广到社会——对朋友有信、对国家尽忠，就不会犯上作乱。\n\n孝不是盲从，而是"生，事之以礼；死，葬之以礼，祭之以礼"。孟子后来将孝推至"老吾老以及人之老"，成为中华文明最温暖的底色。';
    }

    if (q.includes('翻译') || q.includes('译文') || q.includes('意思')) {
        return '以下是《学而》前三章的白话翻译：\n\n【第一章】孔子说："学了知识又按时温习实践，不是很愉快吗？有志同道合的朋友从远方来，不是很快乐吗？别人不了解我，我却不恼怒，不也是有才德的君子吗？"\n\n【第二章】有子说："孝顺父母、敬爱兄长却喜欢冒犯上级的人很少；不冒犯上级却喜欢造反的人从来没有。君子致力于根本，根本确立了，道也就产生了。孝悌就是仁的根本！"\n\n【第三章】孔子说："花言巧语、装出和颜悦色的人，仁德之心很少。"';
    }

    // 通用回答
    return `关于"${question}"这个问题，我可以从原文角度为您解读：\n\n从《论语·学而》的文本来看，这段文字主要围绕"为学"与"修身"两大主题展开。孔子及其弟子强调学习的快乐、道德修养的自觉性，以及"仁"作为核心价值的重要性。\n\n建议您重点关注以下几个方面：\n1. "学而时习之"中的"习"不仅是复习，更是实践；\n2. "人不知而不愠"体现了儒家反求诸己的修养态度；\n3. "君子务本，本立而道生"强调根本的重要性；\n4. 孝悌是仁之本，道德修养从家庭开始。\n\n如需深入了解某一具体概念，可以直接提问，例如"什么是仁""君子的含义"等。`;
}

// ========================================
// 15. 语音朗读功能
// ========================================
function initSpeech() {
    const speakOriginal = document.getElementById('speakOriginal');
    const speakTranslation = document.getElementById('speakTranslation');

    function stopSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        APP_STATE.isSpeaking = false;
        APP_STATE.currentUtterance = null;
        [speakOriginal, speakTranslation].forEach(btn => {
            if (btn) btn.innerHTML = btn.getAttribute('data-original-html') || '<span class="btn-icon">&#x1F50A;</span> 朗读';
        });
    }

    function speak(text, btn) {
        if (!('speechSynthesis' in window)) {
            showToast('您的浏览器不支持语音朗读功能', 'error');
            return;
        }

        if (APP_STATE.isSpeaking) {
            stopSpeaking();
            return;
        }

        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.85;
            utterance.pitch = 1.0;

            if (!btn.getAttribute('data-original-html')) {
                btn.setAttribute('data-original-html', btn.innerHTML);
            }
            btn.innerHTML = '<span class="btn-icon">&#x23F9;</span> 停止';
            APP_STATE.isSpeaking = true;
            APP_STATE.currentUtterance = utterance;

            utterance.onend = () => {
                APP_STATE.isSpeaking = false;
                btn.innerHTML = btn.getAttribute('data-original-html') || '<span class="btn-icon">&#x1F50A;</span> 朗读';
            };
            utterance.onerror = () => {
                APP_STATE.isSpeaking = false;
                btn.innerHTML = btn.getAttribute('data-original-html') || '<span class="btn-icon">&#x1F50A;</span> 朗读';
                showToast('语音朗读出错', 'error');
            };

            window.speechSynthesis.speak(utterance);
        } catch (e) {
            showToast('语音功能不可用: ' + e.message, 'error');
        }
    }

    if (speakOriginal) {
        speakOriginal.addEventListener('click', () => {
            const text = APP_STATE.currentData
                ? (Array.isArray(APP_STATE.currentData.original) ? APP_STATE.currentData.original.join('。') : APP_STATE.currentData.original)
                : document.getElementById('originalText')?.textContent || '';
            if (text) speak(text, speakOriginal);
        });
    }

    if (speakTranslation) {
        speakTranslation.addEventListener('click', () => {
            const text = APP_STATE.currentData
                ? (Array.isArray(APP_STATE.currentData.translated) ? APP_STATE.currentData.translated.join('。') : APP_STATE.currentData.translated)
                : document.getElementById('translatedText')?.textContent || '';
            if (text) speak(text, speakTranslation);
        });
    }
}

// ========================================
// 16. 复制功能
// ========================================
function initCopy() {
    const copyOriginal = document.getElementById('copyOriginal');
    const copyTranslation = document.getElementById('copyTranslation');

    async function copyText(text, btn, label) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            const origHTML = btn.innerHTML;
            btn.innerHTML = '<span class="btn-icon">&#x2714;</span> 已复制';
            showToast(`${label}已复制到剪贴板`, 'success', 1500);
            setTimeout(() => { btn.innerHTML = origHTML; }, 2000);
        } catch (e) {
            showToast('复制失败: ' + e.message, 'error');
        }
    }

    if (copyOriginal) {
        copyOriginal.addEventListener('click', () => {
            const text = APP_STATE.currentData
                ? (Array.isArray(APP_STATE.currentData.original) ? APP_STATE.currentData.original.join('\n\n') : APP_STATE.currentData.original)
                : document.getElementById('originalText')?.textContent || '';
            if (text) copyText(text, copyOriginal, '原文');
        });
    }

    if (copyTranslation) {
        copyTranslation.addEventListener('click', () => {
            const text = APP_STATE.currentData
                ? (Array.isArray(APP_STATE.currentData.translated) ? APP_STATE.currentData.translated.join('\n\n') : APP_STATE.currentData.translated)
                : document.getElementById('translatedText')?.textContent || '';
            if (text) copyText(text, copyTranslation, '译文');
        });
    }
}

// ========================================
// 17. 横排/竖排切换
// ========================================
function initReadingMode() {
    const modeBtns = document.querySelectorAll('.result-mode-btn');
    if (!modeBtns.length) return;

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const mode = btn.getAttribute('data-mode');
            if (mode === 'vertical') {
                document.body.classList.add('vertical-reading');
            } else {
                document.body.classList.remove('vertical-reading');
            }
        });
    });
}

// ========================================
// 18. 分享卡片
// ========================================
function initShareModal() {
    const shareBtn = document.getElementById('shareBtn');
    const modal = document.getElementById('shareModal');
    const modalClose = document.getElementById('modalClose');
    const copyLink = document.getElementById('copyLink');
    const downloadCard = document.getElementById('downloadCard');
    if (!shareBtn || !modal) return;

    shareBtn.addEventListener('click', () => {
        if (!APP_STATE.currentData) {
            showToast('请先完成古籍解析再分享', 'warning');
            return;
        }
        const origFirst = Array.isArray(APP_STATE.currentData.original)
            ? APP_STATE.currentData.original[0]
            : APP_STATE.currentData.original.split('\n')[0];
        const transFirst = Array.isArray(APP_STATE.currentData.translated)
            ? APP_STATE.currentData.translated[0]
            : APP_STATE.currentData.translated.split('\n')[0];

        const quoteEl = document.getElementById('shareQuote');
        const transEl = document.getElementById('shareTranslation');
        if (quoteEl) quoteEl.textContent = origFirst || '';
        if (transEl) transEl.textContent = transFirst || '';

        modal.classList.add('active');
        modal.style.display = 'flex';
    });

    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    };

    if (modalClose) modalClose.addEventListener('click', closeModal);
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) overlay.addEventListener('click', closeModal);

    if (copyLink) {
        copyLink.addEventListener('click', async () => {
            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(window.location.href);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = window.location.href;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                copyLink.innerHTML = '<span class="btn-icon">&#x2714;</span> 已复制';
                setTimeout(() => { copyLink.innerHTML = '<span class="btn-icon">&#x1F517;</span> 复制链接'; }, 2000);
                showToast('链接已复制', 'success');
            } catch (e) {
                showToast('复制失败', 'error');
            }
        });
    }

    if (downloadCard) {
        downloadCard.addEventListener('click', () => {
            // 不依赖html2canvas，显示toast提示
            showToast('请长按卡片图片保存到本地', 'info', 2500);
        });
    }
}

// ========================================
// 重置按钮
// ========================================
function initReset() {
    const resetBtn = document.getElementById('resetBtn');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', () => {
        APP_STATE.isProcessing = false;
        APP_STATE.hasResults = false;
        APP_STATE.qaEnabled = false;
        APP_STATE.currentData = null;
        APP_STATE.story = '';

        const resultArea = document.getElementById('resultArea');
        const uploadArea = document.getElementById('uploadArea');
        const processingArea = document.getElementById('processingArea');
        const fileInput = document.getElementById('fileInput');

        if (resultArea) resultArea.style.display = 'none';
        if (processingArea) processingArea.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'flex';
        if (fileInput) fileInput.value = '';

        // 停止语音
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        APP_STATE.isSpeaking = false;

        // 重置聊天
        const chatMessages = document.getElementById('qaMessages');
        if (chatMessages) chatMessages.innerHTML = '';

        // 重置QA输入
        const qaInput = document.getElementById('qaInput');
        const qaSendBtn = document.getElementById('qaSendBtn');
        if (qaInput) qaInput.disabled = true;
        if (qaSendBtn) qaSendBtn.disabled = true;

        // 重置步骤
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active', 'completed');
            const bar = step.querySelector('.step-bar');
            const status = step.querySelector('.step-status');
            if (bar) bar.style.width = '0';
            if (status) { status.textContent = '等待中'; status.style.color = ''; }
        });

        showToast('已重置，可以重新上传古籍', 'info', 1500);
    });
}

// ========================================
// 20. About卡片3D倾斜
// ========================================
function initAboutCardTilt() {
    const cards = document.querySelectorAll('.about-card');
    if (!cards.length) return;

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;
            card.style.transform = `translateY(-6px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) perspective(1000px) rotateX(0) rotateY(0)';
            card.style.transition = 'transform 0.5s ease';
            setTimeout(() => { card.style.transition = ''; }, 500);
        });

        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0.1s ease';
        });
    });
}

// ========================================
// 21. Demo上传区波纹
// ========================================
function initUploadRipple() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;

    let rippleInterval = null;

    uploadArea.addEventListener('mouseenter', () => {
        const createAutoRipple = () => {
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: absolute;
                width: 250px;
                height: 250px;
                border-radius: 50%;
                background: radial-gradient(circle, rgba(201, 169, 110, 0.06), transparent 70%);
                transform: translate(-50%, -50%) scale(0);
                pointer-events: none;
                z-index: 0;
                left: ${20 + Math.random() * 60}%;
                top: ${20 + Math.random() * 60}%;
                animation: rippleFade 2.5s ease-out forwards;
            `;
            uploadArea.appendChild(ripple);
            setTimeout(() => ripple.remove(), 2500);
        };
        createAutoRipple();
        rippleInterval = setInterval(createAutoRipple, 1200);
    });

    uploadArea.addEventListener('mouseleave', () => {
        if (rippleInterval) clearInterval(rippleInterval);
    });

    uploadArea.addEventListener('click', (e) => {
        if (e.target.closest('#sampleBtn') || e.target.closest('button')) return;
        const ripple = document.createElement('div');
        const rect = uploadArea.getBoundingClientRect();
        ripple.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(201, 169, 110, 0.2), transparent);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 10;
            left: ${e.clientX - rect.left}px;
            top: ${e.clientY - rect.top}px;
            animation: rippleExpand 0.8s ease-out forwards;
        `;
        uploadArea.appendChild(ripple);
        setTimeout(() => ripple.remove(), 800);
    });
}

// ========================================
// 22. 粒子区域感知
// ========================================
function initParticleZoneAwareness() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;

    const sections = document.querySelectorAll('section');

    const update = () => {
        const scrollY = window.pageYOffset;
        const centerY = scrollY + window.innerHeight / 2;
        let currentSection = null;

        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            if (centerY >= top && centerY < bottom) {
                currentSection = section;
            }
        });

        if (currentSection) {
            const isDark = currentSection.classList.contains('hero')
                || currentSection.classList.contains('demo')
                || currentSection.classList.contains('about')
                || currentSection.classList.contains('dark-bg');
            canvas.style.opacity = isDark ? '0.45' : '0.15';
            canvas.style.transition = 'opacity 0.8s ease';
        }
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
}

// ========================================
// 注入必要CSS动画
// ========================================
function injectStyles() {
    if (document.getElementById('dianji-dynamic-styles')) return;
    const style = document.createElement('style');
    style.id = 'dianji-dynamic-styles';
    style.textContent = `
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes rippleExpand {
            from { width: 0; height: 0; opacity: 0.5; }
            to { width: 400px; height: 400px; opacity: 0; }
        }
        @keyframes rippleFade {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }
        .title-line.highlight.shimmer, .typewriter-line.highlight.shimmer {
            background: linear-gradient(90deg, transparent 30%, rgba(201,169,110,0.4) 50%, transparent 70%);
            background-size: 200% 100%;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 2s ease forwards;
        }
        .brush-text {
            position: relative;
        }
        .vertical-reading .original-text,
        .vertical-reading .translated-text {
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }
        .vertical-reading .text-content {
            flex-direction: row-reverse;
            overflow-x: auto;
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// 故事按钮绑定
// ========================================
function initStoryButton() {
    const storyBtn = document.getElementById('storyBtn');
    if (storyBtn) {
        storyBtn.addEventListener('click', generateStory);
    }
}

// ========================================
// Tab切换
// ========================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(`${tab}Tab`);
            if (target) target.classList.add('active');
            if (tab === 'graph') {
                setTimeout(() => renderKnowledgeGraph(), 200);
            }
        });
    });
}

// ========================================
// 初始化入口
// ========================================

// 清理TRAE预览工具注入的调试标注覆盖层
function cleanupDebugOverlays() {
    // 我们页面中body直接子元素的白名单
    const whitelist = new Set([
        'scrollLoader', 'particleCanvas', 'scrollProgress',
        'shareModal', 'toastContainer'
    ]);

    // 清理已有的非页面覆盖层
    function removeOverlays() {
        const allChildren = document.body.children;
        for (let i = allChildren.length - 1; i >= 0; i--) {
            const el = allChildren[i];
            if (el.id && whitelist.has(el.id)) continue;
            if (el.tagName === 'CANVAS' && el.id === 'particleCanvas') continue;
            if (el.tagName === 'NAV') continue;
            if (el.tagName === 'SECTION') continue;
            if (el.tagName === 'FOOTER') continue;
            if (el.tagName === 'DIV') {
                const text = el.textContent || '';
                // 检测TRAE调试标注特征
                if ((text.includes('Hero') || text.includes('Banner') ||
                     text.includes('#0a') || text.includes('#c9') ||
                     text.includes('AI平台') || text.includes('设纪')) &&
                    el.style &&
                    (el.style.position === 'fixed' || el.style.position === 'absolute')) {
                    el.remove();
                    continue;
                }
            }
        }
        // 也检查shadow host
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                const shadowText = el.shadowRoot.textContent || '';
                if (shadowText.includes('Hero') && shadowText.includes('Banner')) {
                    el.style.display = 'none';
                }
            }
        });
    }

    // 立即执行一次
    removeOverlays();

    // MutationObserver持续监控
    const observer = new MutationObserver((mutations) => {
        let found = false;
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === 1 && node.tagName === 'DIV') {
                    const text = node.textContent || '';
                    if ((text.includes('Hero') || text.includes('Banner') ||
                         text.includes('#0a') || text.includes('设纪')) &&
                        node.style && node.style.position === 'fixed') {
                        node.remove();
                        found = true;
                    }
                }
            }
        }
    });

    observer.observe(document.body, { childList: true });
}

document.addEventListener('DOMContentLoaded', () => {
    injectStyles();

    // 清理TRAE预览工具注入的调试覆盖层
    cleanupDebugOverlays();

    // 粒子背景
    const canvas = document.getElementById('particleCanvas');
    if (canvas) new InkParticleSystem(canvas);

    // 卷轴加载动画
    initScrollLoader();

    // 导航栏
    initNavbar();

    // 日夜模式
    initThemeToggle();

    // 全局滚动动画
    initEnhancedScrollAnimations();

    // 数字计数
    initCounters();

    // 滚动进度条
    initScrollProgress();

    // 返回顶部
    initBackToTop();

    // 水墨分隔符
    initInkDividerAnimations();

    // 上传
    initUpload();

    // 故事按钮
    initStoryButton();

    // Tab切换
    initTabs();

    // AI问答
    initQA();

    // 语音朗读
    initSpeech();

    // 复制
    initCopy();

    // 阅读模式切换
    initReadingMode();

    // 分享弹窗
    initShareModal();

    // 重置
    initReset();

    // About卡片3D倾斜
    initAboutCardTilt();

    // 上传区波纹
    initUploadRipple();

    // 粒子区域感知
    initParticleZoneAwareness();

    // 注释筛选按钮（委托）
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderAnnotations(e.target.getAttribute('data-filter') || 'all');
        }
    });
});
