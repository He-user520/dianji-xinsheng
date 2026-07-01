/**
 * 典籍新生 - AI 驱动的古籍活化智能平台
 * 核心交互逻辑
 */

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
        this.dustParticles = [];    // 金色光尘
        this.inkParticles = [];     // 墨点
        this.charParticles = [];    // 汉字
        this.ripples = [];          // 点击涟漪
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
        // 触摸支持
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
        // 金色光尘（远景层）- 80~120个
        const dustCount = Math.min(120, Math.floor(window.innerWidth / 12));
        for (let i = 0; i < dustCount; i++) {
            this.dustParticles.push(this.createDust());
        }
        // 墨点粒子（中景层）- 30~50个
        const inkCount = Math.min(50, Math.floor(window.innerWidth / 30));
        for (let i = 0; i < inkCount; i++) {
            this.inkParticles.push(this.createInk());
        }
        // 汉字粒子（近景层）- 15~20个
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

        // ---- 绘制墨点（最底层）----
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

        // ---- 绘制汉字（中间层）----
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

        // ---- 绘制金色光尘（上层）+ 鼠标引力 ----
        this.dustParticles.forEach(p => {
            // 呼吸闪烁
            p.phase += p.pulseSpeed;
            p.opacity = p.baseOpacity + Math.sin(p.phase) * 0.2;
            p.size = p.baseSize + Math.sin(p.phase * 0.7) * 0.3;

            // 鼠标引力
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

            // 阻尼
            p.speedX *= 0.98;
            p.speedY *= 0.98;

            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0) p.x = this.canvas.width;
            if (p.x > this.canvas.width) p.x = 0;
            if (p.y < 0) p.y = this.canvas.height;
            if (p.y > this.canvas.height) p.y = 0;

            // 光晕
            const glowSize = p.size * 3;
            const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
            glow.addColorStop(0, `rgba(${p.hue}, ${p.opacity * 0.8})`);
            glow.addColorStop(1, `rgba(${p.hue}, 0)`);
            this.ctx.fillStyle = glow;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
            this.ctx.fill();

            // 核心点
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${p.hue}, ${Math.min(1, p.opacity)})`;
            this.ctx.fill();
        });

        // ---- 光尘连线（近距离时）----
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

        // ---- 点击涟漪 ----
        this.ripples = this.ripples.filter(r => {
            r.radius += r.speed;
            r.alpha *= 0.96;
            if (r.alpha < 0.01 || r.radius > r.maxRadius) return false;

            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(201, 169, 110, ${r.alpha})`;
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            // 内圈
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(139, 94, 52, ${r.alpha * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            return true;
        });

        // ---- 鼠标金色光晕跟随 ----
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
// 页面加载卷轴动画
// ========================================
function initScrollLoader() {
    const loader = document.getElementById('scrollLoader');
    if (!loader) return;

    // 加载期间禁止滚动
    document.body.style.overflow = 'hidden';

    // 等待页面资源加载完成后展开卷轴
    const startOpen = () => {
        // 先短暂显示加载状态，再展开
        setTimeout(() => {
            loader.classList.add('opened');
            // 卷轴展开后，切换body状态类，触发hero区域入场动画
            document.body.classList.remove('is-loading');
            document.body.classList.add('is-loaded');
            // 卷轴开始展开的同时启动打字机效果（与hero淡入同步）
            setTimeout(() => {
                startTypewriter();
            }, 400);
            // 卷轴展开后，再淡出遮罩
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.style.overflow = '';
            }, 1200);
        }, 800);
    };

    if (document.readyState === 'complete') {
        startOpen();
    } else {
        window.addEventListener('load', startOpen);
        // 兜底：即使load事件未触发，3秒后也展开
        setTimeout(startOpen, 3000);
    }
}

// ========================================
// Hero 标题打字机效果
// ========================================
function startTypewriter() {
    const lines = document.querySelectorAll('.typewriter-line');
    const cursor = document.querySelector('.typewriter-cursor');
    if (!lines.length) return;

    let lineIndex = 0;
    let charIndex = 0;
    const typeSpeed = 120; // 每个字的间隔(ms)
    const lineDelay = 400; // 两行之间的间隔(ms)

    function moveCursorToLine(lineEl) {
        if (cursor && lineEl) {
            lineEl.appendChild(cursor);
            cursor.classList.remove('hidden');
            cursor.classList.add('visible');
        }
    }

    function typeChar() {
        if (lineIndex >= lines.length) {
            // 打字完成
            if (cursor) {
                setTimeout(() => cursor.classList.add('hidden'), 800);
            }
            // 为每行添加流光效果
            lines.forEach((line, i) => {
                setTimeout(() => {
                    line.classList.add('shimmer', 'done');
                    if (line.classList.contains('highlight')) {
                        line.classList.add('underline-show');
                    }
                }, i * 300);
            });
            return;
        }

        const currentLine = lines[lineIndex];
        const text = currentLine.getAttribute('data-text') || '';

        if (charIndex === 0) {
            currentLine.classList.add('typing');
            currentLine.textContent = '';
            moveCursorToLine(currentLine);
        }

        if (charIndex < text.length) {
            // 在光标前插入字符
            currentLine.insertBefore(document.createTextNode(text[charIndex]), cursor);
            charIndex++;
            setTimeout(typeChar, typeSpeed);
        } else {
            // 当前行完成
            currentLine.classList.remove('typing');
            currentLine.classList.add('done');
            lineIndex++;
            charIndex = 0;
            setTimeout(typeChar, lineDelay);
        }
    }

    // 开始打字
    typeChar();
}

// ========================================
// 导航栏滚动效果
// ========================================
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 更新导航链接激活状态
        const sections = document.querySelectorAll('section[id]');
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);
            
            if (currentScroll >= top && currentScroll < bottom) {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                if (link) link.classList.add('active');
            }
        });

        lastScroll = currentScroll;
    });
}

// ========================================
// 数字计数动画
// ========================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const update = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(update);
            } else {
                counter.textContent = target;
            }
        };

        // 使用 Intersection Observer 触发
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    update();
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(counter);
    });
}

// ========================================
// 滚动显示动画
// ========================================
function initScrollAnimations() {
    const elements = document.querySelectorAll('[data-aos]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.getAttribute('data-delay') || 0;
                setTimeout(() => {
                    entry.target.classList.add('aos-animate');
                }, delay);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
}

// ========================================
// 上传区域交互
// ========================================
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const sampleBtn = document.getElementById('sampleBtn');

    // 拖拽上传
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        });
    });

    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 文件选择
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // 示例按钮
    sampleBtn.addEventListener('click', () => {
        handleSample();
    });
}

// ========================================
// 模拟数据 - 论语选段
// ========================================
const SAMPLE_DATA = {
    original: `子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」

有子曰：「其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与！」

子曰：「巧言令色，鲜矣仁！」`,
    
    translated: `孔子说：「学了知识然后按时温习，不是很愉快吗？有志同道合的人从远方来，不是很快乐吗？人家不了解我，我却不恼怒，不也是品德上有修养的人吗？」

有子说：「一个人孝顺父母，敬爱兄长，却喜欢触犯上位者，这种人很少见；不喜欢触犯上位者，却喜欢造反作乱，这种人从来没有过。君子致力于根本，根本确立了，道也就产生了。孝顺父母、敬爱兄长，大概就是仁的根本吧！」

孔子说：「花言巧语，装出和颜悦色的样子，这种人的仁心就很少了！」`,

    annotations: [
        { term: '子', type: 'person', desc: '古代对男子的尊称，这里特指孔子（公元前551年-公元前479年），名丘，字仲尼，春秋时期鲁国陬邑人，儒家学派创始人。' },
        { term: '有子', type: 'person', desc: '有若（公元前518年-公元前458年），字子有，孔子的学生，春秋末期鲁国人。' },
        { term: '孝弟', type: 'term', desc: '孝，指孝顺父母；弟（tì），同"悌"，指敬爱兄长。孝弟是儒家伦理的核心概念之一。' },
        { term: '仁', type: 'term', desc: '儒家核心思想，指爱人、推己及人的道德境界，是孔子思想体系中的最高道德标准。' },
        { term: '君子', type: 'term', desc: '儒家理想人格，指有道德修养、品行高尚的人，与"小人"相对。' },
        { term: '鲁国', type: 'place', desc: '周朝诸侯国之一，位于今山东南部，是孔子的故乡，也是儒家文化的发源地。' },
        { term: '春秋时期', type: 'term', desc: '公元前770年-公元前476年，中国历史上东周的前半期，因孔子修订的《春秋》而得名。' },
        { term: '学而时习之', type: 'allusion', desc: '出自《论语·学而》开篇第一句，是儒家教育思想的重要体现，强调学习与实践相结合。' }
    ],

    graph: {
        nodes: [
            { id: '孔子', type: 'person', group: 1 },
            { id: '有子', type: 'person', group: 1 },
            { id: '鲁国', type: 'place', group: 2 },
            { id: '春秋时期', type: 'event', group: 3 },
            { id: '论语', type: 'book', group: 4 },
            { id: '儒家', type: 'term', group: 5 },
            { id: '仁', type: 'term', group: 5 },
            { id: '孝', type: 'term', group: 5 },
            { id: '君子', type: 'term', group: 5 },
            { id: '学而篇', type: 'book', group: 4 }
        ],
        links: [
            { source: '孔子', target: '论语', value: 3 },
            { source: '孔子', target: '儒家', value: 3 },
            { source: '孔子', target: '鲁国', value: 2 },
            { source: '孔子', target: '仁', value: 2 },
            { source: '有子', target: '孔子', value: 2 },
            { source: '有子', target: '儒家', value: 2 },
            { source: '论语', target: '学而篇', value: 3 },
            { source: '儒家', target: '仁', value: 3 },
            { source: '儒家', target: '孝', value: 2 },
            { source: '儒家', target: '君子', value: 2 },
            { source: '鲁国', target: '春秋时期', value: 1 },
            { source: '学而篇', target: '仁', value: 2 },
            { source: '学而篇', target: '孝', value: 2 },
            { source: '学而篇', target: '君子', value: 2 }
        ]
    },

    story: ''
};

// ========================================
// API 配置
// ========================================
const API_BASE = window.location.origin; // 同源，通过本地代理服务器

// ========================================
// Toast 通知系统
// ========================================
function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { info: '&#x2139;', success: '&#x2705;', error: '&#x26A0;', warning: '&#x26A0;' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;

    container.appendChild(toast);

    // 动画进入
    requestAnimationFrame(() => toast.classList.add('show'));

    // 自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ========================================
// 带重试的 fetch
// ========================================
async function fetchWithRetry(url, options, retries = 2, timeoutMs = 120000) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const resp = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(timer);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            return resp;
        } catch (e) {
            clearTimeout(timer);
            lastError = e;
            if (attempt < retries) {
                console.warn(`请求失败(${attempt + 1}/${retries + 1})，${1.5}s 后重试...`, e.message);
                showToast(`请求失败，正在重试(${attempt + 1}/${retries + 1})...`, 'warning', 2000);
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    }
    throw lastError;
}

// ========================================
// 处理文件上传
// ========================================
function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        startProcessing(e.target.result);
    };
    reader.readAsDataURL(file);
}

// ========================================
// 处理示例（走完整图片OCR流程）
// ========================================
function handleSample() {
    startProcessing('images/sample_guji_1.jpg');
}

// ========================================
// 开始处理流程（百度OCR + MiMo 文本理解）
// ========================================
async function startProcessing(imageSrc) {
    const uploadArea = document.getElementById('uploadArea');
    const processingArea = document.getElementById('processingArea');
    const processingImg = document.getElementById('processingImg');

    // 切换视图
    uploadArea.style.display = 'none';
    processingArea.style.display = 'grid';
    processingImg.src = imageSrc;

    // 激活OCR步骤
    const step1 = document.querySelector('.step[data-step="1"]');
    const bar1 = step1.querySelector('.step-bar');
    const status1 = step1.querySelector('.step-status');
    step1.classList.add('active');
    status1.textContent = '百度OCR 识别中...';
    animateProgressBar(bar1);

    // 如果是URL路径，先转成base64
    let imageDataUrl = imageSrc;
    if (!imageSrc.startsWith('data:')) {
        try {
            const resp = await fetch(imageSrc);
            const blob = await resp.blob();
            imageDataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error('图片加载失败:', e);
            showToast('图片加载失败，请重试', 'error');
            resetProcessingUI();
            return;
        }
    }

    // 步骤1: 百度OCR识别
    let rawText = '';
    try {
        console.log('调用百度OCR API...');
        showToast('正在调用百度OCR识别文字...', 'info', 2000);
        const ocrResp = await fetchWithRetry(`${API_BASE}/api/baidu-ocr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageDataUrl })
        }, 1);
        const ocrData = await ocrResp.json();

        if (!ocrData.success) {
            throw new Error(ocrData.error || '百度OCR返回错误');
        }

        rawText = ocrData.text.trim();
        console.log('百度OCR结果:', rawText.substring(0, 100));

        if (!rawText || rawText.length < 2) {
            throw new Error('OCR未识别到有效文字');
        }

        bar1.style.width = '100%';
        step1.classList.remove('active');
        step1.classList.add('completed');
        status1.textContent = '完成';
        status1.style.color = '#2d6a4f';
    } catch (ocrError) {
        console.error('OCR失败:', ocrError);
        showToast('OCR识别失败: ' + ocrError.message + '，已切换演示模式', 'error', 5000);
        startSimulatedProcessing(imageSrc);
        return;
    }

    // 步骤2-5: 调用 MiMo API 处理文本
    try {
        await callTextAPI(rawText, 5);
    } catch (error) {
        console.error('AI处理失败:', error);
        showToast('AI 服务暂时不可用，已切换演示模式', 'error', 5000);
        startSimulatedProcessing(imageSrc);
    }
}

// ========================================
// 重置处理UI
// ========================================
function resetProcessingUI() {
    const uploadArea = document.getElementById('uploadArea');
    const processingArea = document.getElementById('processingArea');
    uploadArea.style.display = 'block';
    processingArea.style.display = 'none';
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active', 'completed');
        step.querySelector('.step-bar').style.width = '0';
        step.querySelector('.step-status').textContent = '等待中';
        step.querySelector('.step-status').style.color = '';
    });
}

// ========================================
// 调用文本处理 API（断句→翻译+注释+图谱 并行）
// ========================================
async function callTextAPI(text, totalSteps) {
    const startStep = totalSteps === 5 ? 2 : 1;

    // 步骤名称映射
    const stepNames = {
        2: '断句标点中...',
        3: '翻译中...',
        4: '生成注释中...',
        5: '构建知识图谱中...'
    };

    // 激活所有待处理步骤的UI（显示等待状态）
    for (let i = startStep; i <= 5; i++) {
        const stepEl = document.querySelector(`.step[data-step="${i}"]`);
        const bar = stepEl.querySelector('.step-bar');
        const status = stepEl.querySelector('.step-status');
        stepEl.classList.add('active');
        status.textContent = '排队中';
        status.style.color = '';
        bar.style.width = '0';
    }

    // 第一步：断句标点（必须先完成，后续步骤依赖它）
    let punctuatedText = text;
    if (startStep <= 2) {
        const step2 = document.querySelector('.step[data-step="2"]');
        const bar2 = step2.querySelector('.step-bar');
        const status2 = step2.querySelector('.step-status');
        status2.textContent = '断句标点中...';
        animateProgressBar(bar2);
        try {
            console.log('[1/4] 断句标点中...');
            const resp = await fetchWithRetry(`${API_BASE}/api/punctuate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await resp.json();
            if (data.success && data.text) {
                punctuatedText = data.text;
                SAMPLE_DATA.original = data.text;
            }
            console.log('[1/4] 断句完成');
            markStepComplete(2);
        } catch (e) {
            console.error('[1/4] 断句失败:', e);
            showToast('断句标点失败，使用原文继续', 'warning');
            markStepSkip(2);
        }
    }

    // 第二~四步：翻译 + 注释 + 图谱 并行执行
    const parallelTasks = [];

    // 翻译
    if (startStep <= 3) {
        parallelTasks.push(
            (async () => {
                const stepEl = document.querySelector('.step[data-step="3"]');
                const bar = stepEl.querySelector('.step-bar');
                const status = stepEl.querySelector('.step-status');
                status.textContent = '翻译中...';
                animateProgressBar(bar);
                try {
                    console.log('[2/4] 翻译中...');
                    const resp = await fetchWithRetry(`${API_BASE}/api/translate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: punctuatedText })
                    });
                    const data = await resp.json();
                    if (data.success && data.translated) {
                        SAMPLE_DATA.translated = data.translated;
                    }
                    console.log('[2/4] 翻译完成');
                    markStepComplete(3);
                } catch (e) {
                    console.error('[2/4] 翻译失败:', e);
                    showToast('翻译服务暂时不可用', 'warning');
                    markStepSkip(3);
                }
            })()
        );
    }

    // 注释
    if (startStep <= 4) {
        parallelTasks.push(
            (async () => {
                const stepEl = document.querySelector('.step[data-step="4"]');
                const bar = stepEl.querySelector('.step-bar');
                const status = stepEl.querySelector('.step-status');
                status.textContent = '生成注释中...';
                animateProgressBar(bar);
                try {
                    console.log('[3/4] 生成注释中...');
                    const resp = await fetchWithRetry(`${API_BASE}/api/annotations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: punctuatedText })
                    });
                    const data = await resp.json();
                    if (data.success && data.annotations && data.annotations.length > 0) {
                        SAMPLE_DATA.annotations = data.annotations;
                    }
                    console.log('[3/4] 注释完成');
                    markStepComplete(4);
                } catch (e) {
                    console.error('[3/4] 注释失败:', e);
                    showToast('注释生成失败', 'warning');
                    markStepSkip(4);
                }
            })()
        );
    }

    // 知识图谱
    if (startStep <= 5) {
        parallelTasks.push(
            (async () => {
                const stepEl = document.querySelector('.step[data-step="5"]');
                const bar = stepEl.querySelector('.step-bar');
                const status = stepEl.querySelector('.step-status');
                status.textContent = '构建知识图谱中...';
                animateProgressBar(bar);
                try {
                    console.log('[4/4] 构建知识图谱中...');
                    const resp = await fetchWithRetry(`${API_BASE}/api/graph`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: punctuatedText })
                    });
                    const data = await resp.json();
                    if (data.success && data.graph) {
                        SAMPLE_DATA.graph = data.graph;
                    }
                    console.log('[4/4] 知识图谱完成, nodes:', SAMPLE_DATA.graph.nodes?.length || 0);
                    markStepComplete(5);
                } catch (e) {
                    console.error('[4/4] 图谱失败:', e);
                    showToast('知识图谱构建失败', 'warning');
                    markStepSkip(5);
                }
            })()
        );
    }

    // 等待所有并行任务完成
    await Promise.allSettled(parallelTasks);

    // 统计完成情况
    const completedCount = document.querySelectorAll('.step.completed').length;
    const skippedCount = document.querySelectorAll('.step-status').length - completedCount;
    if (skippedCount > 0) {
        showToast(`处理完成（${completedCount}步成功，部分步骤已跳过）`, 'warning');
    } else {
        showToast('全部处理完成！', 'success');
    }

    setTimeout(() => showResults(), 500);
}

function markStepComplete(stepNum) {
    const stepEl = document.querySelector(`.step[data-step="${stepNum}"]`);
    if (!stepEl) return;
    const bar = stepEl.querySelector('.step-bar');
    const status = stepEl.querySelector('.step-status');
    bar.style.width = '100%';
    stepEl.classList.remove('active');
    stepEl.classList.add('completed');
    status.textContent = '完成';
    status.style.color = '#2d6a4f';
}

function markStepSkip(stepNum) {
    const stepEl = document.querySelector(`.step[data-step="${stepNum}"]`);
    if (!stepEl) return;
    const bar = stepEl.querySelector('.step-bar');
    const status = stepEl.querySelector('.step-status');
    bar.style.width = '100%';
    stepEl.classList.remove('active');
    stepEl.classList.add('completed');
    status.textContent = '跳过';
    status.style.color = '#e76f51';
}

// ========================================
// 进度条动画（不确定进度）
// ========================================
function animateProgressBar(bar) {
    let progress = 0;
    const interval = setInterval(() => {
        // 缓慢增长，不超过90%
        if (progress < 90) {
            progress += Math.random() * 3;
            bar.style.width = `${Math.min(progress, 90)}%`;
        }
    }, 200);
    bar._interval = interval;
}

// ========================================
// 模拟处理（API不可用时的降级方案）
// ========================================
function startSimulatedProcessing(imageSrc) {
    const steps = [
        { step: 1, title: 'OCR 文字识别', duration: 1500 },
        { step: 2, title: '智能断句标点', duration: 1200 },
        { step: 3, title: '文白对照翻译', duration: 1800 },
        { step: 4, title: '注释解读生成', duration: 1500 },
        { step: 5, title: '知识图谱构建', duration: 2000 }
    ];

    let currentStep = 0;

    const processStep = () => {
        if (currentStep >= steps.length) {
            setTimeout(() => showResults(), 500);
            return;
        }

        const stepData = steps[currentStep];
        const stepEl = document.querySelector(`.step[data-step="${stepData.step}"]`);
        const bar = stepEl.querySelector('.step-bar');
        const status = stepEl.querySelector('.step-status');

        stepEl.classList.add('active');
        status.textContent = '处理中...';

        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            bar.style.width = `${progress}%`;

            if (progress >= 100) {
                clearInterval(interval);
                stepEl.classList.remove('active');
                stepEl.classList.add('completed');
                status.textContent = '完成';
                status.style.color = '#2d6a4f';
                
                currentStep++;
                setTimeout(processStep, 300);
            }
        }, stepData.duration / 20);
    };

    processStep();
}

// ========================================
// 显示结果
// ========================================
function showResults() {
    const processingArea = document.getElementById('processingArea');
    const resultArea = document.getElementById('resultArea');

    processingArea.style.display = 'none';
    resultArea.style.display = 'block';

    // 填充数据 - 逐句对照模式
    renderTranslationView();

    // 填充注释
    renderAnnotations('all');

    // 渲染知识图谱
    setTimeout(() => renderGraph(), 100);
}

// ========================================
// 渲染文白对照（逐句高亮）
// ========================================
function renderTranslationView() {
    const originalEl = document.getElementById('originalText');
    const translatedEl = document.getElementById('translatedText');

    // 按换行分割段落
    const origParagraphs = SAMPLE_DATA.original.split(/\n+/).filter(p => p.trim());
    const transParagraphs = SAMPLE_DATA.translated.split(/\n+/).filter(p => p.trim());

    originalEl.innerHTML = '';
    translatedEl.innerHTML = '';

    const maxLen = Math.max(origParagraphs.length, transParagraphs.length);
    for (let i = 0; i < maxLen; i++) {
        const origP = origParagraphs[i] || '';
        const transP = transParagraphs[i] || '';

        const origSpan = document.createElement('div');
        origSpan.className = 'sentence-block';
        origSpan.dataset.index = i;
        origSpan.textContent = origP;

        const transSpan = document.createElement('div');
        transSpan.className = 'sentence-block';
        transSpan.dataset.index = i;
        transSpan.textContent = transP;

        // 点击高亮
        origSpan.addEventListener('click', () => highlightSentence(i));
        transSpan.addEventListener('click', () => highlightSentence(i));

        originalEl.appendChild(origSpan);
        translatedEl.appendChild(transSpan);
    }
}

function highlightSentence(index) {
    // 清除所有高亮
    document.querySelectorAll('.sentence-block').forEach(el => el.classList.remove('highlighted'));
    // 高亮对应段落
    document.querySelectorAll(`.sentence-block[data-index="${index}"]`).forEach(el => el.classList.add('highlighted'));
}

// ========================================
// 渲染注释
// ========================================
function renderAnnotations(filter) {
    const list = document.getElementById('annotationsList');
    const annotations = filter === 'all' 
        ? SAMPLE_DATA.annotations 
        : SAMPLE_DATA.annotations.filter(a => a.type === filter);

    list.innerHTML = annotations.map(a => `
        <div class="annotation-card">
            <div class="annotation-term">${a.term}</div>
            <span class="annotation-type ${a.type}">${getTypeLabel(a.type)}</span>
            <div class="annotation-desc">${a.desc}</div>
        </div>
    `).join('');
}

function getTypeLabel(type) {
    const labels = {
        person: '人物',
        place: '地点',
        term: '术语',
        allusion: '典故'
    };
    return labels[type] || type;
}

// ========================================
// 渲染知识图谱 (SVG)
// ========================================
function renderGraph() {
    const svg = document.getElementById('knowledgeGraph');
    const container = document.getElementById('graphContainer');

    if (!SAMPLE_DATA.graph || !SAMPLE_DATA.graph.nodes || SAMPLE_DATA.graph.nodes.length === 0) {
        svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="14">暂无知识图谱数据</text>';
        return;
    }

    let width = container.clientWidth;
    let height = container.clientHeight;

    // 容器可能因为 display:none 尺寸为0，使用默认值
    if (width < 10) width = 800;
    if (height < 10) height = 400;

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const colors = {
        person: '#8b5e34',
        place: '#2d6a4f',
        event: '#c9a96e',
        book: '#6b8cae',
        term: '#a67c52'
    };

    // 简单的力导向布局
    const nodes = SAMPLE_DATA.graph.nodes.map((n, i) => ({
        ...n,
        x: width / 2 + Math.cos(i * 2 * Math.PI / SAMPLE_DATA.graph.nodes.length) * 150,
        y: height / 2 + Math.sin(i * 2 * Math.PI / SAMPLE_DATA.graph.nodes.length) * 150,
        vx: 0,
        vy: 0
    }));

    const links = SAMPLE_DATA.graph.links.map(l => ({
        ...l,
        source: nodes.find(n => n.id === l.source),
        target: nodes.find(n => n.id === l.target)
    }));

    // 模拟力导向
    for (let iter = 0; iter < 100; iter++) {
        // 斥力
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[j].x - nodes[i].x;
                const dy = nodes[j].y - nodes[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = 2000 / (dist * dist);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                nodes[i].vx -= fx;
                nodes[i].vy -= fy;
                nodes[j].vx += fx;
                nodes[j].vy += fy;
            }
        }

        // 引力
        links.forEach(l => {
            const dx = l.target.x - l.source.x;
            const dy = l.target.y - l.source.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 100) * 0.01 * l.value;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            l.source.vx += fx;
            l.source.vy += fy;
            l.target.vx -= fx;
            l.target.vy -= fy;
        });

        // 中心引力
        nodes.forEach(n => {
            n.vx += (width / 2 - n.x) * 0.001;
            n.vy += (height / 2 - n.y) * 0.001;
            n.vx *= 0.9;
            n.vy *= 0.9;
            n.x += n.vx;
            n.y += n.vy;
        });
    }

    // 绘制
    let svgContent = '';

    // 连线
    links.forEach(l => {
        svgContent += `<line x1="${l.source.x}" y1="${l.source.y}" x2="${l.target.x}" y2="${l.target.y}" 
            stroke="rgba(201,169,110,0.3)" stroke-width="${l.value}"
            data-source="${l.source.id}" data-target="${l.target.id}" />`;
    });

    // 节点
    nodes.forEach(n => {
        const color = colors[n.type] || '#8b5e34';
        const radius = n.type === 'person' ? 25 : 20;
        
        svgContent += `
            <g class="graph-node" data-id="${n.id}" style="cursor: pointer;">
                <circle cx="${n.x}" cy="${n.y}" r="${radius}" fill="${color}" opacity="0.9" />
                <circle cx="${n.x}" cy="${n.y}" r="${radius + 3}" fill="none" stroke="${color}" opacity="0.3" stroke-width="2" />
                <text x="${n.x}" y="${n.y + radius + 18}" text-anchor="middle" 
                    fill="rgba(255,255,255,0.8)" font-size="12" font-family="Noto Sans SC">${n.id}</text>
            </g>
        `;
    });

    svg.innerHTML = svgContent;

    // 节点交互
    svg.querySelectorAll('.graph-node').forEach(node => {
        node.addEventListener('mouseenter', function() {
            this.querySelector('circle').setAttribute('opacity', '1');
            this.querySelector('circle').setAttribute('r', parseInt(this.querySelector('circle').getAttribute('r')) + 3);
        });
        node.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.querySelector('circle').setAttribute('opacity', '0.9');
                this.querySelector('circle').setAttribute('r', parseInt(this.querySelector('circle').getAttribute('r')) - 3);
            }
        });
        node.addEventListener('click', function() {
            const nodeId = this.getAttribute('data-id');
            selectNode(nodeId, nodes, links, svg);
        });
    });
}

// ========================================
// 选中节点：高亮关联节点+显示详情
// ========================================
function selectNode(nodeId, nodes, links, svg) {
    // 清除之前的高亮
    svg.querySelectorAll('.graph-node').forEach(n => {
        n.classList.remove('selected', 'dimmed', 'connected');
        n.querySelector('circle').setAttribute('opacity', '0.9');
    });
    svg.querySelectorAll('line').forEach(l => {
        l.setAttribute('stroke', 'rgba(201,169,110,0.3)');
        l.setAttribute('stroke-width', l.getAttribute('stroke-width') || 1);
    });

    // 找到关联节点
    const connectedIds = new Set([nodeId]);
    links.forEach(l => {
        if (l.source.id === nodeId) connectedIds.add(l.target.id);
        if (l.target.id === nodeId) connectedIds.add(l.source.id);
    });

    // 高亮选中节点和关联节点，暗化其他节点
    svg.querySelectorAll('.graph-node').forEach(n => {
        const id = n.getAttribute('data-id');
        if (id === nodeId) {
            n.classList.add('selected');
            n.querySelector('circle').setAttribute('opacity', '1');
        } else if (connectedIds.has(id)) {
            n.classList.add('connected');
            n.querySelector('circle').setAttribute('opacity', '0.9');
        } else {
            n.classList.add('dimmed');
            n.querySelector('circle').setAttribute('opacity', '0.2');
        }
    });

    // 高亮关联连线
    svg.querySelectorAll('line').forEach(l => {
        const src = l.getAttribute('data-source');
        const tgt = l.getAttribute('data-target');
        if (src === nodeId || tgt === nodeId) {
            l.setAttribute('stroke', 'rgba(201,169,110,0.8)');
            l.setAttribute('stroke-width', '3');
        } else {
            l.setAttribute('stroke', 'rgba(201,169,110,0.05)');
        }
    });

    // 显示详情面板
    showNodeDetail(nodeId, nodes, links);
}

// ========================================
// 显示节点详情面板
// ========================================
function showNodeDetail(nodeId, nodes, links) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const typeLabels = {
        person: '人物', place: '地点', event: '事件', book: '典籍', term: '术语'
    };

    // 找到关联节点
    const relations = [];
    links.forEach(l => {
        if (l.source.id === nodeId) {
            relations.push({ name: l.target.id, type: l.target.type, direction: '→' });
        } else if (l.target.id === nodeId) {
            relations.push({ name: l.source.id, type: l.source.type, direction: '←' });
        }
    });

    // 查找注释
    const annotation = SAMPLE_DATA.annotations.find(a => a.term === nodeId || a.term.includes(nodeId) || nodeId.includes(a.term));
    const desc = annotation ? annotation.desc : '暂无详细注释';

    let panel = document.getElementById('nodeDetailPanel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'nodeDetailPanel';
        panel.className = 'node-detail-panel';
        document.querySelector('.graph-view').appendChild(panel);
    }

    panel.innerHTML = `
        <div class="node-detail-header">
            <span class="node-detail-name">${nodeId}</span>
            <span class="node-detail-type ${node.type}">${typeLabels[node.type] || node.type}</span>
            <button class="node-detail-close" onclick="document.getElementById('nodeDetailPanel').style.display='none'">&times;</button>
        </div>
        <div class="node-detail-desc">${desc}</div>
        ${relations.length > 0 ? `
        <div class="node-detail-relations">
            <div class="relations-title">关联节点 (${relations.length})</div>
            <div class="relations-list">
                ${relations.map(r => `<span class="relation-tag" onclick="selectNode('${r.name}', window._graphNodes, window._graphLinks, document.getElementById('knowledgeGraph'))">${r.direction} ${r.name}</span>`).join('')}
            </div>
        </div>` : ''}
    `;
    panel.style.display = 'block';

    // 保存全局引用供关联节点点击使用
    window._graphNodes = nodes;
    window._graphLinks = links;
}

// ========================================
// 标签切换
// ========================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tab}Tab`).classList.add('active');

            // 如果切换到图谱标签，等布局完成后重新渲染
            if (tab === 'graph') {
                setTimeout(() => renderGraph(), 200);
            }
        });
    });

    // 故事生成按钮
    const storyBtn = document.getElementById('storyBtn');
    if (storyBtn) {
        storyBtn.addEventListener('click', generateStory);
    }
}

// ========================================
// 注释筛选
// ========================================
function initAnnotationFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderAnnotations(btn.getAttribute('data-filter'));
        });
    });
}

// ========================================
// 复制翻译
// ========================================
function initCopy() {
    const copyBtn = document.getElementById('copyTranslation');
    copyBtn.addEventListener('click', () => {
        const text = document.getElementById('translatedText').textContent;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = '已复制!';
            setTimeout(() => {
                copyBtn.textContent = '\u{1F4CB} 复制';
            }, 2000);
        });
    });
}

// ========================================
// 分享功能
// ========================================
function initShare() {
    const shareBtn = document.getElementById('shareBtn');
    const modal = document.getElementById('shareModal');
    const modalClose = document.getElementById('modalClose');
    const downloadBtn = document.getElementById('downloadCard');
    const copyLinkBtn = document.getElementById('copyLink');

    shareBtn.addEventListener('click', () => {
        const original = SAMPLE_DATA.original.split('\n')[0].substring(0, 50) + '...';
        const translated = SAMPLE_DATA.translated.split('\n')[0].substring(0, 50) + '...';
        
        document.getElementById('shareQuote').textContent = original;
        document.getElementById('shareTranslation').textContent = translated;
        modal.classList.add('active');
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        modal.classList.remove('active');
    });

    downloadBtn.addEventListener('click', () => {
        // 用 Canvas 生成分享卡片图片
        const canvas = document.createElement('canvas');
        canvas.width = 750;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // 背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1410');
        gradient.addColorStop(1, '#2d1f14');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 边框
        ctx.strokeStyle = '#c9a96e';
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        
        // 标题
        ctx.fillStyle = '#c9a96e';
        ctx.font = 'bold 36px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.fillText('典籍新生', canvas.width / 2, 80);
        
        // 分隔线
        ctx.strokeStyle = 'rgba(201, 169, 110, 0.3)';
        ctx.beginPath();
        ctx.moveTo(100, 110);
        ctx.lineTo(canvas.width - 100, 110);
        ctx.stroke();
        
        // 原文
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '24px "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        const originalText = SAMPLE_DATA.original.split('\n')[0].substring(0, 30);
        ctx.fillText(originalText, canvas.width / 2, 180);
        
        // 译文
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '18px "Noto Sans SC", sans-serif';
        const translatedText = SAMPLE_DATA.translated.split('\n')[0].substring(0, 35);
        ctx.fillText(translatedText, canvas.width / 2, 230);
        
        // 注释数量
        ctx.fillStyle = '#c9a96e';
        ctx.font = '16px "Noto Sans SC", sans-serif';
        ctx.fillText(`AI 生成 ${SAMPLE_DATA.annotations.length} 条注释 · ${SAMPLE_DATA.graph.nodes?.length || 0} 个知识图谱节点`, canvas.width / 2, 300);
        
        // 底部
        ctx.fillStyle = 'rgba(201, 169, 110, 0.5)';
        ctx.font = '14px "Noto Sans SC", sans-serif';
        ctx.fillText('AI 驱动的古籍活化智能平台', canvas.width / 2, canvas.height - 60);
        ctx.fillText('TRAE AI 创造力大赛参赛作品', canvas.width / 2, canvas.height - 35);
        
        // 下载
        const link = document.createElement('a');
        link.download = 'dianji-xinsheng-share.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    copyLinkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href);
        copyLinkBtn.innerHTML = '<span class="btn-icon">&#x2705;</span> 已复制';
        setTimeout(() => {
            copyLinkBtn.innerHTML = '<span class="btn-icon">&#x1F4CB;</span> 复制链接';
        }, 2000);
    });
}

// ========================================
// 重置功能
// ========================================
function initReset() {
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => {
        document.getElementById('resultArea').style.display = 'none';
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('fileInput').value = '';
        
        // 重置故事
        SAMPLE_DATA.story = '';
        const storyContent = document.getElementById('storyContent');
        if (storyContent) storyContent.innerHTML = '';

        // 隐藏节点详情面板
        const detailPanel = document.getElementById('nodeDetailPanel');
        if (detailPanel) detailPanel.style.display = 'none';
        
        // 重置步骤状态
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active', 'completed');
            step.querySelector('.step-bar').style.width = '0';
            step.querySelector('.step-status').textContent = '等待中';
            step.querySelector('.step-status').style.color = '';
        });
    });
}

// ========================================
// 图谱控制
// ========================================
function initGraphControls() {
    document.getElementById('resetGraph').addEventListener('click', renderGraph);
    document.getElementById('zoomIn').addEventListener('click', () => {
        const svg = document.getElementById('knowledgeGraph');
        const currentTransform = svg.style.transform || 'scale(1)';
        const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
        svg.style.transform = `scale(${currentScale * 1.2})`;
    });
    document.getElementById('zoomOut').addEventListener('click', () => {
        const svg = document.getElementById('knowledgeGraph');
        const currentTransform = svg.style.transform || 'scale(1)';
        const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
        svg.style.transform = `scale(${currentScale / 1.2})`;
    });
}

// ========================================
// 古籍故事生成
// ========================================
async function generateStory() {
    const storyBtn = document.getElementById('storyBtn');
    const storyContent = document.getElementById('storyContent');
    
    if (SAMPLE_DATA.story) {
        // 已经生成过，直接显示
        storyContent.innerHTML = `<div class="story-text">${SAMPLE_DATA.story}</div>`;
        return;
    }

    storyBtn.disabled = true;
    storyBtn.innerHTML = '<span class="btn-icon">&#x23F3;</span> 故事生成中...';
    storyContent.innerHTML = '<div class="story-loading">AI 正在将古文转化为生动故事，请稍候...</div>';

    try {
        const resp = await fetchWithRetry(`${API_BASE}/api/story`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: SAMPLE_DATA.original,
                translation: SAMPLE_DATA.translated
            })
        }, 1);
        const data = await resp.json();
        if (data.success && data.story) {
            SAMPLE_DATA.story = data.story;
            storyContent.innerHTML = `<div class="story-text">${data.story.replace(/\n/g, '<br>')}</div>`;
            showToast('故事生成完成！', 'success');
        } else {
            throw new Error(data.error || '故事生成失败');
        }
    } catch (e) {
        console.error('故事生成失败:', e);
        storyContent.innerHTML = `<div class="story-error">故事生成失败，请稍后重试。<br>错误: ${e.message}</div>`;
        showToast('故事生成失败: ' + e.message, 'error');
    } finally {
        storyBtn.disabled = false;
        storyBtn.innerHTML = '<span class="btn-icon">&#x1F3A5;</span> 生成故事';
    }
}

// ========================================
// 平滑滚动
// ========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// 全局滚动进度条
// ========================================
function initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) return;
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// ========================================
// 返回顶部按钮
// ========================================
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 600) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    });
    
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========================================
// 增强版全局滚动入场动画
// ========================================
function initEnhancedScrollAnimations() {
    // 所有section-header入场
    const sectionHeaders = document.querySelectorAll('.section-header');
    // feature-card入场
    const featureCards = document.querySelectorAll('.feature-card');
    // tech-node入场
    const techNodes = document.querySelectorAll('.tech-node');
    // about-card入场
    const aboutCards = document.querySelectorAll('.about-card');
    // about-footer入场
    const aboutFooters = document.querySelectorAll('.about-footer');
    // footer入场
    const footer = document.querySelector('.footer');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 添加stagger delay
                const parent = entry.target.parentElement;
                const index = Array.from(parent ? parent.children : []).indexOf(entry.target);
                const delay = Math.min(index * 150, 900); // 每个元素延迟150ms，最大900ms
                
                setTimeout(() => {
                    entry.target.classList.add('in-view', 'aos-animate');
                }, delay);
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    
    // 观察所有目标元素
    [...sectionHeaders, ...featureCards, ...techNodes, ...aboutCards, ...aboutFooters].forEach(el => {
        observer.observe(el);
    });
    
    if (footer) observer.observe(footer);
}

// ========================================
// About卡片3D倾斜效果
// ========================================
function initAboutCardTilt() {
    const cards = document.querySelectorAll('.about-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / centerY * -8; // -8 to 8 degrees
            const rotateY = (x - centerX) / centerX * 8;
            
            card.style.transform = `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
            card.style.transition = 'transform 0.5s ease';
            setTimeout(() => {
                card.style.transition = '';
            }, 500);
        });
        
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease';
        });
    });
}

// ========================================
// Demo上传区域波纹效果
// ========================================
function initUploadRipple() {
    const uploadArea = document.getElementById('uploadArea');
    if (!uploadArea) return;
    
    uploadArea.addEventListener('mouseenter', () => {
        createRipple(uploadArea);
    });
    
    uploadArea.addEventListener('click', (e) => {
        // 在点击位置创建波纹
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(201, 169, 110, 0.2), transparent);
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 0;
            animation: rippleExpand 0.8s ease-out forwards;
        `;
        const rect = uploadArea.getBoundingClientRect();
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        uploadArea.appendChild(ripple);
        setTimeout(() => ripple.remove(), 800);
    });
}

function createRipple(container) {
    const existing = container.querySelectorAll('.auto-ripple');
    if (existing.length > 2) return; // 限制数量
    
    const ripple = document.createElement('div');
    ripple.classList.add('auto-ripple');
    ripple.style.cssText = `
        position: absolute;
        width: 300px;
        height: 300px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(201, 169, 110, 0.05), transparent 70%);
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 0;
        animation: rippleFade 2s ease-out forwards;
    `;
    ripple.style.left = Math.random() * 100 + '%';
    ripple.style.top = Math.random() * 100 + '%';
    container.appendChild(ripple);
    setTimeout(() => ripple.remove(), 2000);
}

// ========================================
// 粒子Canvas区域感知
// ========================================
function initParticleZoneAwareness() {
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const viewHeight = window.innerHeight;
        const centerY = scrollY + viewHeight / 2;
        
        // 判断当前可视区域属于哪个section
        let currentSection = null;
        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            if (centerY >= top && centerY < bottom) {
                currentSection = section;
            }
        });
        
        // 根据section调整canvas透明度
        const canvas = document.getElementById('particleCanvas');
        if (!canvas) return;
        
        if (currentSection) {
            const isDark = currentSection.classList.contains('hero') || 
                          currentSection.classList.contains('demo') || 
                          currentSection.classList.contains('about');
            canvas.style.opacity = isDark ? '0.4' : '0.15';
        }
    });
}

// ========================================
// 数字计数动画增强（带缓动效果）
// ========================================
function initEnhancedCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const startTime = performance.now();
        
        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            const current = Math.round(easedProgress * target);
            counter.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                counter.textContent = target;
            }
        }
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    requestAnimationFrame(update);
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(counter);
    });
}

// ========================================
// 水墨分隔符入场动画
// ========================================
function initInkDividerAnimations() {
    const dividers = document.querySelectorAll('.ink-divider');
    
    dividers.forEach(divider => {
        divider.style.opacity = '0';
        divider.style.transform = 'scaleY(0)';
        divider.style.transformOrigin = 'top';
        divider.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    });
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'scaleY(1)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    dividers.forEach(d => observer.observe(d));
}

// ========================================
// 初始化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 卷轴加载动画（内部会在完成后触发打字机效果）
    initScrollLoader();

    // 粒子背景
    const canvas = document.getElementById('particleCanvas');
    if (canvas) new InkParticleSystem(canvas);

    // 导航栏
    initNavbar();
    
    // 增强版全局功能
    initEnhancedScrollAnimations();
    initScrollProgress();
    initBackToTop();
    initUploadRipple();
    initAboutCardTilt();
    initParticleZoneAwareness();
    initInkDividerAnimations();

    // 计数器（增强版，替代原有 animateCounters）
    initEnhancedCounters();

    // 上传
    initUpload();
    
    // 其他功能
    initTabs();
    initAnnotationFilters();
    initCopy();
    initShare();
    initReset();
    initGraphControls();
    initSmoothScroll();
});
