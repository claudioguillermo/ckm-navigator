console.log("DEBUG: main.js starting execution...");

const REFACTOR_ACTION_ALLOWLIST = [
    'navigateTo',
    'toggleChat',
    'toggleTheme',
    'setLanguage',
    'minimizeChat',
    'sendSidebarChatMessage',
    'closeModal',
    'renderModuleDetail',
    'startQuiz',
    'toggleClinicalNote',
    'showMyMedications',
    'markModuleComplete',
    'handleQuizOptionClick',
    'resetProgress',
    'renderMovementExplorer',
    'renderFoodLabel',
    'renderMedicationCategory',
    'clearMount',
    'toggleMedicationCard',
    'toggleMyMedication',
    'removeMyMedication',
    'closeMyMedications',
    'renderMetricsDashboard',
    'renderStageExplorer',
    'toggleAnalogyControl',
    'showMyth',
    'renderAnalogyAnimation',
    'scrollToStaging',
    'toggleEatingDetails',
    'renderEatingPlateAnimation',
    'scrollToElement',
    'renderCulturalFoodExplorer',
    'showSourcePreview',
    'handleQuizAnswer',
    'closeQuizAndGoBack',
    'closePassport',
    'showOrganDetail',
    'reloadApp'
];

const app = {
    translations: {
        en: (typeof INLINE_FALLBACK_EN !== 'undefined' ? INLINE_FALLBACK_EN : {})
    },
    secureStorage: null,
    activeLanguageRequest: null,
    activeTimeouts: new Set(),
    currentLanguage: 'en', // Will be loaded from secure storage

    currentPage: 'home',
    chatHistory: [],
    completedModules: [], // Will be loaded from secure storage
    myMedications: [], // Will be loaded from secure storage
    cachedKnowledge: null,
    curriculumController: null,
    i18nService: null,
    _actionDispatcherCleanup: null,

    checkUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const validPages = new Set(['home', 'education', 'clinic', 'staging']);
        const page = params.get('page');
        if (page === 'chat') {
            this.currentPage = 'home';
            this._openChatOnLoad = true;
        } else if (page && validPages.has(page)) {
            this.currentPage = page;
        }
        const lang = params.get('lang');
        if (lang && ['en', 'es', 'pt'].includes(lang)) {
            this.currentLanguage = lang;
        }
    },

    celebrate() {
        const colors = [
            'var(--accent-red)',
            'var(--system-blue)',
            'var(--system-green)',
            'var(--system-orange)',
            'var(--system-purple)'
        ];
        const container = document.getElementById('app-root') || document.body;

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti animate-confetti';
            // Random start position
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            // Random size
            const size = Math.random() * 10 + 5 + 'px';
            confetti.style.width = size;
            confetti.style.height = size;

            // Stagger animations
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.opacity = Math.random();

            container.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }
    },

    haptic(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },

    async initMyMedications() {
        let meds = await this.secureStorage.getItem('ckm_my_medications', []);

        // Migrate old format to new format
        if (meds.length > 0 && meds[0].className && !meds[0].classId && typeof meds[0].classIndex === 'undefined') {
            console.log('Migrating old medication format...');
            meds = meds.map(med => {
                // Try to find class by name in current language or default to en
                const categoryId = med.categoryId;
                const medMap = this.translations['en'] && this.translations['en'].modules && this.translations['en'].modules.medicationMap;
                const categories = medMap && Array.isArray(medMap.categories) ? medMap.categories : [];
                const cat = categories.find(c => c.id === categoryId);
                let classIndex = -1;
                let classId = 'unknown';

                if (cat) {
                    // Try to find by name in various languages if possible, or just assume English name match
                    // Since we don't have all languages loaded sync, we'll try our best or match by index if names match
                    // Realistically, we just need to assign a classIndex.
                    const cls = cat.classes.find(c => c.name === med.className);
                    if (cls) {
                        classIndex = cat.classes.indexOf(cls);
                        classId = cls.id;
                    }
                }

                return {
                    ...med,
                    classId: classId,
                    classIndex: classIndex
                };
            });

            await this.secureStorage.setItem('ckm_my_medications', meds);
            console.log('Migration complete');
            this.myMedications = meds;
        }
    },

    showUpdateNotification() {
        const banner = document.createElement('div');
        banner.className = 'update-banner';
        DOMUtils.safeSetHTML(banner, `
            <span>🎉 New version available!</span>
            <button data-action="reloadApp" data-args="">Refresh</button>
        `);
        document.body.prepend(banner);
    },

    reloadApp() {
        window.location.reload();
    },

    initRefactorModules() {
        if (typeof CurriculumController !== 'undefined') {
            this.curriculumController = CurriculumController;
        }

        if (typeof I18nService !== 'undefined') {
            this.i18nService = new I18nService({
                basePath: './locales',
                inlineFallbackEn: (typeof INLINE_FALLBACK_EN !== 'undefined' ? INLINE_FALLBACK_EN : {})
            });
        }
    },

    runRefactorCompatibilityCheck() {
        const missing = REFACTOR_ACTION_ALLOWLIST.filter(name => typeof this[name] !== 'function');
        if (missing.length > 0) {
            console.warn('[RefactorCompatibility] Missing action handlers:', missing);
        }
    },

    async init() {

        // Initialize Secure Storage
        if (typeof SecureStorage !== 'undefined') {
            this.secureStorage = new SecureStorage();
        } else {
            console.error('SecureStorage not defined!');
            // Fallback mock or error handling
            this.secureStorage = {
                async getItem(_, fallback = null) { return fallback; },
                async setItem() { return false; },
                removeItem() { }
            };
        }

        this.navItems = document.querySelectorAll('.nav-item');
        this.mainView = document.getElementById('main-view');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.modalBody = document.getElementById('modal-body');

        // Initialize Task Manager for Cancelable Tasks
        if (typeof TaskManager !== 'undefined') {
            this.tasks = new TaskManager();
        } else {
            console.error('TaskManager not loaded!');
            // Fallback dummy
            this.tasks = { setTimeout: setTimeout, abortAll: () => { }, signal: new AbortController().signal };
        }

        this._chatOpenedBefore = false;
        window.app = this;

        this.initRefactorModules();

        const storedLanguage = await this.secureStorage.getItem('ckm_lang', this.currentLanguage);
        if (storedLanguage && ['en', 'es', 'pt'].includes(storedLanguage)) {
            this.currentLanguage = storedLanguage;
        }

        // Apply URL overrides before locale loading (preserves original precedence)
        this.checkUrlParams();

        // Load baseline English first for migration safety, then active language
        await this.loadLanguage('en');
        if (this.currentLanguage !== 'en') {
            await this.loadLanguage(this.currentLanguage);
        }

        // Initialize Data Migration after translations are available
        await this.initMyMedications();

        // CRITICAL FIX: Load persisted state
        this.completedModules = await this.secureStorage.getItem('ckm_progress', []);
        this.myMedications = await this.secureStorage.getItem('ckm_my_medications', []);

        this.updateUIContent();

        // Initialize AI RAG System
        this.initChatbot();

        // Global Event Delegation for data-action
        if (this._actionDispatcherCleanup) {
            this._actionDispatcherCleanup();
        }

        if (typeof ActionDispatcher !== 'undefined') {
            this._actionDispatcherCleanup = ActionDispatcher.attach(
                document,
                () => this,
                { logger: console }
            );
        } else {
            console.warn('[RefactorCompatibility] ActionDispatcher not loaded, using legacy fallback dispatcher.');
            document.addEventListener('click', (e) => {
                const trigger = e.target.closest('[data-action]');
                if (!trigger) return;

                const action = trigger.dataset.action;
                const argsRaw = trigger.dataset.args;
                let args = [];

                if (argsRaw) {
                    const parts = argsRaw.match(/(".*?"|'.*?'|[^",\s]+)(?=\s*,|\s*$)/g);
                    if (parts) {
                        args = parts.map(part => {
                            const arg = part.trim();
                            if ((arg.startsWith("'") && arg.endsWith("'")) || (arg.startsWith('"') && arg.endsWith('"'))) {
                                return arg.slice(1, -1);
                            }
                            if (arg === 'true') return true;
                            if (arg === 'false') return false;
                            if (!isNaN(arg) && arg !== '') return Number(arg);
                            return arg;
                        });
                    } else {
                        args = [argsRaw];
                    }
                }

                if (typeof this[action] === 'function') {
                    this[action].apply(this, args);
                } else {
                    console.warn(`Action method '${action}' not found on app object.`);
                }
            });
        }

        this.runRefactorCompatibilityCheck();

        // Initialize Theme
        this.initTheme();

        // Initialize Hamburger Menu
        this.initHamburgerMenu();

        // Header Collision Detection
        this.initHeaderCollisionDetection();

        // Initialize Performance Observers (Tier 2)
        this.initIntersectionObserver();
        this.initNotifications();

        // Sync initial language slider
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.getAttribute('data-lang') === this.currentLanguage);
        });

        this.navigateTo(this.currentPage);
        this.initChatInteraction();

        const chatInput = document.getElementById('chat-input-sidebar');
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendSidebarChatMessage();
                }
            });
        }

        // Handle direct chat link
        if (this._openChatOnLoad) {
            setTimeout(() => this.toggleChat(true), 800);
        }

        // Global Event Delegation for Visual Zooms
        document.addEventListener('click', (e) => {
            const container = e.target.closest('.visual-container');
            if (container && container.querySelector('img')) {
                this.showImageZoom(container.querySelector('img').src);
            }
        });

        document.addEventListener('mouseover', (e) => {
            const zone = e.target.closest('.anatomy-zone[data-tooltip]');
            if (!zone) return;
            if (e.relatedTarget && zone.contains(e.relatedTarget)) return;
            this.showTooltip({ target: zone }, zone.getAttribute('data-tooltip'));
        });

        document.addEventListener('mouseout', (e) => {
            const zone = e.target.closest('.anatomy-zone[data-tooltip]');
            if (!zone) return;
            if (e.relatedTarget && zone.contains(e.relatedTarget)) return;
            this.hideTooltip();
        });

        // Service Worker Registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('Service Worker registered');

                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    });
                })
                .catch((error) => {
                    console.warn('Service Worker registration failed:', error);
                });

            // Listen for messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data.type === 'APP_UPDATED') {
                    this.showUpdateNotification();
                }
            });
        }
    },

    transitionView(pageContent) {
        return new Promise((resolve) => {
            // Store current height to prevent layout shift
            const currentHeight = this.mainView.scrollHeight;
            this.mainView.style.minHeight = currentHeight + 'px';

            // Add GPU acceleration hint
            this.mainView.style.willChange = 'opacity';
            this.mainView.classList.add('fade-out');

            // 1. Wait for fade out (200ms)
            this.tasks.setTimeout(() => {
                // Update DOM while invisible
                DOMUtils.safeSetHTML(this.mainView, pageContent);

                // 2. Render Check
                requestAnimationFrame(() => {
                    if (this.mainView.scrollTo) {
                        this.mainView.scrollTo({ top: 0, behavior: 'auto' });
                    }

                    // 3. Start Fade In
                    requestAnimationFrame(() => {
                        this.mainView.style.minHeight = '';
                        this.mainView.classList.remove('fade-out');
                        this.mainView.classList.add('fade-in');

                        // 4. Resolve Promise once visible (matches fade-in duration)
                        this.tasks.setTimeout(() => {
                            resolve(); // Content is now effectively visible/interactive
                        }, 300);

                        // 5. Cleanup
                        this.tasks.setTimeout(() => {
                            this.mainView.classList.remove('fade-in');
                            this.mainView.style.willChange = '';
                        }, 350);
                    });
                });
            }, 200);
        });
    },

    slideTransition(mount, isInitial, direction, renderFn) {
        if (isInitial) {
            renderFn('animate-fade-in');
            return;
        }

        const current = mount.querySelector('.module-fullwidth, .module-grid, .analogy-container, .plate-container, .quiz-question-container');
        if (current) {
            current.classList.remove('animate-fade-in', 'slide-enter-right', 'slide-enter-left');
            current.classList.add(direction === 'next' ? 'slide-exit-left' : 'slide-exit-right');
            setTimeout(() => {
                renderFn(direction === 'next' ? 'slide-enter-right' : 'slide-enter-left');
            }, 250);
        } else {
            renderFn('animate-fade-in');
        }
    },


    async loadLanguage(lang) {
        const requestId = Symbol();
        this.activeLanguageRequest = requestId;

        const loader = this.showLoadingIndicator('Loading language...');

        try {
            if (!this.i18nService && typeof I18nService !== 'undefined') {
                this.i18nService = new I18nService({
                    basePath: './locales',
                    inlineFallbackEn: (typeof INLINE_FALLBACK_EN !== 'undefined' ? INLINE_FALLBACK_EN : {})
                });
            }

            if (!this.i18nService) {
                throw new Error('I18nService unavailable');
            }

            const result = await this.i18nService.loadLanguage(lang, this.translations, {
                requestToken: requestId,
                isLatestRequest: token => this.activeLanguageRequest === token
            });

            if (result.stale) {
                return;
            }
        } catch (error) {
            console.error('Localization Error:', error);
            if (!this.translations.en) {
                this.translations.en = (typeof INLINE_FALLBACK_EN !== 'undefined' ? INLINE_FALLBACK_EN : {});
            }
            if (!this.translations[lang]) {
                this.translations[lang] = this.translations.en;
            }
        } finally {
            if (this.activeLanguageRequest === requestId) {
                this.hideLoadingIndicator(loader);
            }
        }
    },

    showLoadingIndicator(message) {
        const loader = document.createElement('div');
        loader.className = 'global-loader';
        DOMUtils.safeSetHTML(loader, `
            <div class="loader-backdrop"></div>
            <div class="loader-card">
                <div class="spinner"></div>
                <p style="font-weight: 600; color: var(--text-primary); font-size: 16px;">${message}</p>
            </div>
        `);
        document.body.appendChild(loader);
        return loader;
    },

    hideLoadingIndicator(loader) {
        if (!loader) return;
        loader.classList.add('fade-out');
        setTimeout(() => {
            if (loader.parentNode) loader.parentNode.removeChild(loader);
        }, 300);
    },

    initChatbot() {
        const chunks = extractModuleKnowledge(this.translations);
        this.searchEngine = new HybridSearchEngine(chunks);
        this.chatbot = new MedicalChatbot(this.searchEngine);
        this.chatbot.setLanguage(this.currentLanguage);
    },

    initHamburgerMenu() {
        const hamburger = document.querySelector('.hamburger-menu');
        const navWrapper = document.querySelector('.nav-wrapper');
        const navLinks = document.querySelectorAll('.main-nav .nav-item');

        if (!hamburger || !navWrapper) return;

        const toggleMenu = () => {
            const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !isExpanded);
            hamburger.classList.toggle('active');
            navWrapper.classList.toggle('expanded');
        };

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        // Close on link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (hamburger.getAttribute('aria-expanded') === 'true') {
                    toggleMenu();
                }
            });
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (navWrapper.classList.contains('expanded') && !navWrapper.contains(e.target)) {
                toggleMenu();
            }
        });
    },

    initHeaderCollisionDetection() {
        // Disabled: Hamburger menu relies on manual toggle, not collision detection.
        // Keeping function stub to prevent errors if called elsewhere.
        return;
    },

    showImageZoom(src) {
        DOMUtils.safeSetHTML(this.modalBody, `
            <div style="text-align: center; padding: 20px;">
                <img src="${src}" style="max-width: 100%; max-height: 80vh; border-radius: 16px; box-shadow: 0 30px 60px rgba(0,0,0,0.3);">
                <p style="margin-top: 24px; font-weight: 600; opacity: 0.7;">Pinch or scroll to explore diagram details</p>
            </div>
        `);
        this.modalOverlay.classList.remove('hidden');
    },

    async setLanguage(lang) {
        if (!this.translations[lang]) {
            await this.loadLanguage(lang);
        }
        this.currentLanguage = lang;
        await this.secureStorage.setItem('ckm_lang', lang);

        if (this.chatbot) this.chatbot.setLanguage(lang);
        this.updateUIContent();

        // Re-render current page with new language
        this.navigateTo(this.currentPage);

        // Update slider UI and ARIA states
        document.querySelectorAll('.lang-option').forEach(opt => {
            const isActive = opt.getAttribute('data-lang') === lang;
            opt.classList.toggle('active', isActive);
            opt.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    },




    updateUIContent() {
        const t = this.translations[this.currentLanguage];
        if (!t) return;

        const resolveKey = (keyPath) => keyPath
            .split('.')
            .reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), t);

        // Update Nav
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = resolveKey(key);
            if (val !== undefined) el.textContent = val;
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = resolveKey(key);
            if (val !== undefined) el.setAttribute('placeholder', val);
        });
    },

    // Tier 2: Performance & Responsiveness - IntersectionObserver
    initIntersectionObserver() {
        const options = {
            root: null, // viewport
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Stop observing once visible if it's a one-time animation
                    if (entry.target.dataset.animateOnce !== 'false') {
                        obs.unobserve(entry.target);
                    }
                }
            });
        }, options);

        // Observe all current and future elements with .animate-on-scroll
        // We use a MutationObserver to watch for new content added via navigation
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList && node.classList.contains('animate-on-scroll')) {
                                observer.observe(node);
                            }
                            // Check children
                            node.querySelectorAll?.('.animate-on-scroll').forEach(el => observer.observe(el));
                        }
                    });
                }
            });
        });

        mutationObserver.observe(this.mainView, { childList: true, subtree: true });

        // Initial check
        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    },

    // Tier 4: PWA Completeness (Notifications & Badging)
    initNotifications() {
        if ('Notification' in window && Notification.permission !== 'granted') {
            // We don't auto-request, but we prepare the logic
        }
    },

    async setAppBadge(count) {
        if ('setAppBadge' in navigator) {
            try {
                if (count > 0) {
                    await navigator.setAppBadge(count);
                } else {
                    await navigator.clearAppBadge();
                }
            } catch (e) {
                console.warn('Error setting app badge', e);
            }
        }
    },

    // Theme Management
    initTheme() {
        const storedTheme = localStorage.getItem('theme');

        // If user has a stored preference, use it; otherwise follow system preference
        if (storedTheme) {
            this.applyTheme(storedTheme);
        } else {
            // No stored preference - follow system
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        }

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            // Only auto-follow if user hasn't set an explicit preference
            if (!localStorage.getItem('theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);

        // Visual feedback
        this.haptic(30);
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Update Theme Color Meta for browser UI
        const bg = theme === 'dark' ? '#000000' : '#ffffff';
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'theme-color';
            document.head.appendChild(meta);
        }
        meta.content = bg;

        // Update Toggle Button Icon
        const btn = document.querySelector('.theme-toggle');
        if (btn) {
            const sun = btn.querySelector('.theme-icon-sun');
            const moon = btn.querySelector('.theme-icon-moon');
            if (sun && moon) {
                if (theme === 'dark') {
                    sun.style.display = 'block';
                    moon.style.display = 'none';
                    btn.setAttribute('aria-label', 'Switch to Light Mode');
                } else {
                    sun.style.display = 'none';
                    moon.style.display = 'block';
                    btn.setAttribute('aria-label', 'Switch to Dark Mode');
                }
            }
        }
    },

    navigateTo(pageId) {
        if (!pageId) return;

        // CRITICAL: Cancel any pending tasks/rendering from previous view
        this.tasks.abortAll();

        this.currentPage = pageId;
        const t = this.translations[this.currentLanguage];
        const pageContent = this.getPageContent(pageId, t);

        // Update Nav UI
        if (this.navItems) {
            this.navItems.forEach(item => {
                const args = item.dataset.args; // e.g. "'home'"
                const targetPage = args ? args.replace(/['"]/g, '') : '';

                // Education nav item should be active for 'education', 'staging', and single module IDs
                const isEducationSubPage = (pageId === 'staging' || typeof pageId === 'number') && targetPage === 'education';
                const isActive = targetPage === String(pageId) || isEducationSubPage;
                item.classList.toggle('active', !!isActive);
            });
        }

        // AI Assistant nav item usually doesn't stay "activePage" as it's a drawer
        const chatItem = Array.from(this.navItems || []).find(i => i.getAttribute('onclick')?.includes('toggleChat'));
        if (chatItem) chatItem.classList.remove('active');

        // Update Content with Smooth Transition
        this.transitionView(pageContent);
    },

    getPageContent(pageId, t) {
        if (this.curriculumController && typeof this.curriculumController.getPageContent === 'function') {
            return this.curriculumController.getPageContent(this, pageId, t);
        }
        return '';
    },

    // Module Logic
    async renderModuleDetail(id) {
        if (this.curriculumController && typeof this.curriculumController.renderModuleDetail === 'function') {
            return this.curriculumController.renderModuleDetail(this, id);
        }
    },

    renderKnowledgeCheck(moduleId, selectedIndex = null, showFeedback = false) {
        if (this.curriculumController && typeof this.curriculumController.renderKnowledgeCheck === 'function') {
            this.curriculumController.renderKnowledgeCheck(this, moduleId, selectedIndex, showFeedback);
        }
    },

    handleQuizOptionClick(moduleId, selectedIdx) {
        if (this.curriculumController && typeof this.curriculumController.handleQuizOptionClick === 'function') {
            this.curriculumController.handleQuizOptionClick(this, moduleId, selectedIdx);
        }
    },

    async markModuleComplete(id) {
        if (this.curriculumController && typeof this.curriculumController.markModuleComplete === 'function') {
            return this.curriculumController.markModuleComplete(this, id);
        }
    },

    renderProgressBar() {
        if (this.curriculumController && typeof this.curriculumController.renderProgressBar === 'function') {
            return this.curriculumController.renderProgressBar(this);
        }
        return '';
    },

    renderMovementExplorer(activeIdx = 0, level = null, barrier = null) {
        const mount = document.getElementById('zone2-guide-mount') || document.getElementById('movement-explorer-mount');
        if (!mount) return;

        const direction = activeIdx > (this._prevMovementIdx || 0) ? 'next' : 'prev';
        const isInitial = this._prevMovementIdx === undefined;
        this._prevMovementIdx = activeIdx;

        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang].modules.movementExplorer;
        const slide = t.slides[activeIdx];

        let visualHtml = this.getMovementVisual(activeIdx);
        let contentHtml = `<p style="font-size: 18px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 32px;">${slide.text}</p>`;

        if (activeIdx === 7) {
            if (!level) {
                contentHtml += `
                    <div style="background: var(--bg-card); padding: 32px; border-radius: 20px; box-shadow: var(--shadow-card); margin-bottom: 32px; border: 1px solid var(--border-soft);">
                        <h4 style="margin-top: 0; margin-bottom: 12px; font-weight: 800;">Generate Your Personalized Plan</h4>
                        <p style="font-size: 15px; color: var(--text-tertiary); margin-bottom: 24px;">Answer two quick questions to get a tailored 12-week roadmap designed for your current level and lifestyle.</p>
                        <button class="btn btn-primary" data-action="renderMovementExplorer" data-args="7, 'start'" style="width: 100%;">Start Plan Generator</button>
                    </div>
                `;
            } else if (level === 'start') {
                contentHtml = `
                    <div style="background: var(--bg-card); padding: 32px; border-radius: 20px; box-shadow: var(--shadow-card); margin-bottom: 32px; border: 1px solid var(--border-soft);">
                        <h4 style="margin-top: 0; margin-bottom: 20px; font-weight: 800;">1. Where are you starting today?</h4>
                        <button class="btn btn-secondary" data-action="renderMovementExplorer" data-args="7, 'zero'" style="width: 100%; margin-bottom: 16px; text-align: left; justify-content: flex-start; padding: 20px;">I currently do NO exercise</button>
                        <button class="btn btn-secondary" data-action="renderMovementExplorer" data-args="7, 'active'" style="width: 100%; text-align: left; justify-content: flex-start; padding: 20px;">I walk 2-3 times a week</button>
                    </div>
                `;
            } else if (level && !barrier) {
                contentHtml = `
                    <div style="background: var(--bg-card); padding: 32px; border-radius: 20px; box-shadow: var(--shadow-card); margin-bottom: 32px; border: 1px solid var(--border-soft);">
                        <h4 style="margin-top: 0; margin-bottom: 20px; font-weight: 800;">2. What's your biggest challenge?</h4>
                        <button class="btn btn-secondary" data-action="renderMovementExplorer" data-args="7, '${level}', 'time'" style="width: 100%; margin-bottom: 16px; text-align: left; justify-content: flex-start; padding: 20px;">Limited Time / Busy Schedule</button>
                        <button class="btn btn-secondary" data-action="renderMovementExplorer" data-args="7, '${level}', 'pain'" style="width: 100%; margin-bottom: 16px; text-align: left; justify-content: flex-start; padding: 20px;">Joint Pain / Physical Limits</button>
                        <button class="btn btn-secondary" data-action="renderMovementExplorer" data-args="7, '${level}', 'weather'" style="width: 100%; text-align: left; justify-content: flex-start; padding: 20px;">Winter Weather (MA Specific)</button>
                    </div>
                `;
            } else if (barrier) {
                const plan = this.generateTailoredPlan({ level: level, barrier: barrier });
                contentHtml = `
                    <div style="background: var(--bg-component); padding: 32px; border-radius: 20px; margin-bottom: 32px; border: 2px solid var(--accent-red);">
                        <h4 style="margin-top: 0; color: var(--accent-red); font-weight: 800; font-size: 20px;">Your Tailored CKM Roadmap</h4>
                        <div style="margin-top: 16px; font-size: 15px; line-height: 1.6;">
                            ${plan}
                        </div>
                        <button class="btn btn-text" data-action="renderMovementExplorer" data-args="7" style="margin-top: 24px; font-weight: 800;">← Restart Quiz</button>
                    </div>
                `;
            }
        }

        this.slideTransition(mount, isInitial, direction, (slideClass) => {
            DOMUtils.safeSetHTML(mount, `
                <div class="module-fullwidth ${slideClass}">
                    <div class="module-grid">
                        <div class="module-visual">
                            ${visualHtml}
                        </div>
                        <div class="module-text">
                            <div class="explorer-counter">Slide ${activeIdx + 1} of ${t.slides.length}</div>
                            <h3 class="explorer-title">${slide.title}</h3>
                            ${contentHtml}

                            <div class="explorer-insight">
                                <div class="section-header-row" style="margin-bottom: 12px; gap: 8px;">
                                    <h4 class="insight-label" style="margin: 0;">Doctor's Survival Tip</h4>
                                    <div class="info-trigger" style="width: 18px; height: 18px;">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                        <div class="info-tooltip">Clinical Insight</div>
                                    </div>
                                </div>
                                <p class="insight-text">${slide.lesson}</p>
                            </div>

                            <div class="explorer-navigation">
                                <button class="btn btn-secondary" data-action="renderMovementExplorer" data-args="${activeIdx - 1}" ${activeIdx === 0 ? 'disabled' : ''}>← ${t.prev}</button>
                                <button class="btn btn-primary" data-action="${activeIdx === t.slides.length - 1 ? 'markModuleComplete' : 'renderMovementExplorer'}" data-args="${activeIdx === t.slides.length - 1 ? 3 : activeIdx + 1}">
                                    ${activeIdx === t.slides.length - 1 ? 'Finish Lesson' : t.next + ' →'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
    `);
            if (activeIdx === 7) {
                const btn = document.getElementById('complete-btn');
                if (btn) btn.classList.add('pulse-once');
            }
        });
    },

    getMovementVisual(idx) {
        const colors = { red: 'var(--accent-red)', blue: 'var(--system-blue)', gray: 'var(--text-secondary)', light: 'var(--bg-depth)', green: 'var(--system-green)' };
        const arrowDef = `
            <defs>
                <marker id="arrow-move" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="${colors.gray}" />
                </marker>
            </defs>
        `;

        const baseStyles = `<style>
            @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.2); opacity: 0; } }
            .animate-float { animation: float 3s ease-in-out infinite; }
            .animate-ring { transform-origin: center; animation: pulse-ring 2s ease-out infinite; }
        </style>`;

        if (idx === 0) { // Glucose Sponge
            return `
    <svg viewBox="0 0 400 300" width="100%">
        ${baseStyles}
                    <rect x="50" y="50" width="300" height="200" rx="40" fill="${colors.light}" stroke="${colors.gray}" stroke-width="1" />
                    <text x="200" y="35" text-anchor="middle" font-weight="800" fill="${colors.gray}" font-size="10" letter-spacing="1">BLOODSTREAM</text>
                    
                    <!--Glucose dots-->
                    <circle cx="100" cy="90" r="5" fill="${colors.red}" class="animate-float" />
                    <circle cx="200" cy="110" r="5" fill="${colors.red}" class="animate-float" style="animation-delay: 0.5s;" />
                    <circle cx="250" cy="85" r="5" fill="${colors.red}" class="animate-float" style="animation-delay: 1.2s;" />
                    <circle cx="300" cy="100" r="5" fill="${colors.red}" class="animate-float" style="animation-delay: 0.8s;" />

                    <!--Muscle -->
                    <path d="M80,180 Q200,140 320,180 L320,240 Q200,280 80,240 Z" fill="${colors.red}" opacity="0.9" />
                    <text x="200" y="225" text-anchor="middle" fill="var(--text-white)" font-weight="900" font-size="16">MUSCLE SPONGE</text>
                    
                    <!--Diffusion -->
                    <path d="M150,140 L150,170" stroke="${colors.green}" stroke-width="3" stroke-dasharray="4" marker-end="url(#arrow-move)" />
                    <path d="M200,145 L200,175" stroke="${colors.green}" stroke-width="3" stroke-dasharray="4" marker-end="url(#arrow-move)" />
                    <path d="M250,140 L250,170" stroke="${colors.green}" stroke-width="3" stroke-dasharray="4" marker-end="url(#arrow-move)" />
                </svg>
    `;
        }
        if (idx === 1) { // Synergy
            return `
    <svg viewBox="0 0 400 300" width="100%">
        ${baseStyles}
                    <circle cx="140" cy="150" r="70" fill="${colors.blue}" opacity="0.1" stroke="${colors.blue}" stroke-width="2" />
                    <circle cx="260" cy="150" r="70" fill="${colors.red}" opacity="0.1" stroke="${colors.red}" stroke-width="2" />
                    <text x="140" y="155" text-anchor="middle" font-weight="900" fill="${colors.blue}" font-size="12">CARDIO</text>
                    <text x="260" y="155" text-anchor="middle" font-weight="900" fill="${colors.red}" font-size="12">STRENGTH</text>
                    <circle cx="200" cy="150" r="30" fill="var(--bg-card)" stroke="${colors.green}" stroke-width="4" />
                    <text x="200" y="155" text-anchor="middle" font-weight="900" fill="${colors.green}" font-size="10">CKM+</text>
                </svg>
    `;
        }
        if (idx === 2) { // Small Starts
            return `
    <svg viewBox="0 0 400 300" width="100%">
                    <rect x="50" y="220" width="300" height="10" rx="5" fill="${colors.light}" />
                    <circle cx="80" cy="225" r="15" fill="${colors.red}" />
                    <path d="M80,225 L320,80" stroke="${colors.gray}" stroke-width="2" stroke-dasharray="8" />
                    <circle cx="320" cy="80" r="25" fill="${colors.green}" opacity="0.4" />
                    <text x="80" y="260" text-anchor="middle" font-weight="800" font-size="12">DAY 1</text>
                    <text x="320" y="130" text-anchor="middle" font-weight="800" font-size="12">LONG LIFE</text>
                </svg>
    `;
        }
        if (idx === 3) { // Zone 2
            return `
    <svg viewBox="0 0 400 300" width="100%">
                    <rect x="50" y="100" width="300" height="100" rx="50" fill="${colors.light}" />
                    <rect x="50" y="100" width="180" height="100" rx="50" fill="${colors.green}" opacity="0.6" />
                    <text x="140" y="155" text-anchor="middle" font-weight="900" font-size="20" fill="var(--text-white)">SWEET SPOT</text>
                    <path d="M300,100 L300,200" stroke="${colors.red}" stroke-width="4" stroke-dasharray="4" />
                    <text x="320" y="155" font-weight="800" font-size="10" fill="${colors.red}">TOO HARD</text>
                </svg>
    `;
        }
        if (idx === 4) { // Strength
            return `
    <svg viewBox="0 0 400 300" width="100%">
                    <rect x="100" y="140" width="200" height="20" rx="4" fill="${colors.gray}" />
                    <rect x="80" y="100" width="40" height="100" rx="10" fill="${colors.red}" />
                    <rect x="280" y="100" width="40" height="100" rx="10" fill="${colors.red}" />
                    <path d="M200,80 Q250,50 300,80" fill="none" stroke="${colors.blue}" stroke-width="4" marker-end="url(#arrow-move)" />
                    <text x="200" y="240" text-anchor="middle" font-weight="900" font-size="18">BUILDING SPONGES</text>
                </svg>
    `;
        }
        return `
    <svg viewBox="0 0 400 300" width="100%">
                <circle cx="200" cy="150" r="100" fill="${colors.light}" stroke="${colors.gray}" stroke-width="2" />
                <path d="M160,150 L240,150 M200,110 L200,190" stroke="${colors.red}" stroke-width="8" stroke-linecap="round" />
            </svg>
    `;
    },

    generateTailoredPlan(quiz) {
        let roadmap = '';
        if (quiz.level === 'zero') {
            roadmap += `<strong>Weeks 1-4: The 5-Minute Habit</strong><p>Goal: Walk for 5 minutes after your biggest meal, 3 days a week. Focus on consistency over speed.</p>`;
            roadmap += `<strong>Weeks 5-8: Double Up</strong><p>Goal: Increase to 10 minutes, 5 days a week. Introduce 1 day of 'Wall Pushups' (5-8 reps).</p>`;
            roadmap += `<strong>Weeks 9-12: The Foundation</strong><p>Goal: 20-minute walks, 5 days a week. Total 100 min. Add 2 days of bodyweight squats.</p>`;
        } else {
            roadmap += `<strong>Weeks 1-4: Focus on Quality</strong><p>Goal: Ensure your walks are in 'Zone 2' (The Talk Test). Aim for 30 min, 3 days a week.</p>`;
            roadmap += `<strong>Weeks 5-8: Power Up</strong><p>Goal: Increase to 30 min, 5 days a week (150 min total). Add 2 days of basic strength training.</p>`;
            roadmap += `<strong>Weeks 9-12: Maintenance</strong><p>Goal: 150 min cardio + 2 full body strength sessions. Your glucose 'sponge' is now fully active!</p>`;
        }

        if (quiz.barrier === 'weather') {
            roadmap += `<div style="margin-top: 12px; padding: 12px; background: var(--bg-card); border-radius: 8px; font-size: 14px; border: 1px solid var(--border-soft);"><strong>MA Strategy:</strong> Since weather is a concern, plan 2 of your weekly walks at <strong>Natick Mall</strong> or use a 10-minute <strong>YouTube 'Walk at Home'</strong> video.</div>`;
        } else if (quiz.barrier === 'pain') {
            roadmap += `<div style="margin-top: 12px; padding: 12px; background: var(--bg-card); border-radius: 8px; font-size: 14px; border: 1px solid var(--border-soft);"><strong>Pain Strategy:</strong> Replace walking with <strong>'Chair Marches'</strong> and 'Seated Leg Lifts'. Move for 2 minutes every hour you are sitting.</div>`;
        } else if (quiz.barrier === 'time') {
            roadmap += `<div style="margin-top: 12px; padding: 12px; background: var(--bg-card); border-radius: 8px; font-size: 14px; border: 1px solid var(--border-soft);"><strong>Time Strategy:</strong> Use 'Movement Snacking'. Three 5-minute walks (after breakfast, lunch, dinner) = 15 minutes. It counts!</div>`;
        }

        return roadmap;
    },

    renderFoodLabel(activeIdx = 0, activeHotspot = null) {
        const mount = document.getElementById('food-label-mount');
        if (!mount) return;

        const direction = activeIdx > (this._prevFoodLabelIdx || 0) ? 'next' : 'prev';
        const isInitial = this._prevFoodLabelIdx === undefined;
        this._prevFoodLabelIdx = activeIdx;

        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang].modules.foodLabel;
        const slide = t.slides[activeIdx];

        let visualHtml = this.getFoodLabelSVGForSlide(activeIdx, activeHotspot);

        const hotspotColors = {
            'serving-size': 'var(--system-red)',
            'calories': 'var(--system-orange)',
            'fats': 'var(--system-purple)',
            'sodium': 'var(--system-yellow)',
            'carbs': 'var(--system-green)',
            'added-sugar': 'var(--system-blue)'
        };
        const activeColor = activeHotspot ? (hotspotColors[activeHotspot] || 'var(--system-blue)') : 'var(--system-blue)';

        // Use fade animation for hotspot clicks instead of slide
        const isHotspotClick = activeHotspot !== null && this._prevFoodLabelHotspot !== activeHotspot;
        this._prevFoodLabelHotspot = activeHotspot;

        const renderContent = (slideClass) => {
            DOMUtils.safeSetHTML(mount, `
                <div class="module-fullwidth ${slideClass}">
        <div class="module-grid">
            <div class="module-visual">
                ${visualHtml}
            </div>
            <div class="module-text">
                <div class="explorer-counter">Slide ${activeIdx + 1} of ${t.slides.length}</div>
                <h3 class="explorer-title">${slide.title}</h3>
                <p class="explorer-text">${slide.text}</p>

                <div id="hotspot-detail-mount">
                    ${activeHotspot ? `
                                    <div class="explorer-insight animate-slide-up" style="background: ${activeColor}11; border-left: 4px solid ${activeColor};">
                                        <div class="section-header-row" style="margin-bottom: 8px;">
                                            <h4 class="insight-label" style="margin: 0; color: ${activeColor};">
                                                ${slide.hotspots.find(h => h.id === activeHotspot).title}
                                            </h4>
                                        </div>
                                        <p class="insight-text">${slide.hotspots.find(h => h.id === activeHotspot).text}</p>
                                    </div>
                                ` : `
                                    <div class="explorer-insight">
                                        <div class="section-header-row" style="margin-bottom: 12px; gap: 8px;">
                                            <h4 class="insight-label" style="margin: 0;">${t.labels.marketing}</h4>
                                            <div class="info-trigger" style="width: 18px; height: 18px;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                                <div class="info-tooltip">Clinical Insight</div>
                                            </div>
                                        </div>
                                        <p class="insight-text">${slide.lesson}</p>
                                    </div>
                                `}
                </div>

                <div class="explorer-navigation">
                    <button class="btn btn-secondary" data-action="renderFoodLabel" data-args="${activeIdx - 1}" ${activeIdx === 0 ? 'disabled' : ''}>← ${t.prev}</button>
                    <button class="btn btn-primary" data-action="${activeIdx === t.slides.length - 1 ? 'markModuleComplete' : 'renderFoodLabel'}" data-args="${activeIdx === t.slides.length - 1 ? 2 : activeIdx + 1}">
                        ${activeIdx === t.slides.length - 1 ? 'Finish' : t.next + ' →'}
                    </button>
                </div>
            </div>
        </div>
                </div>
    <style>
        .label-hotspot {cursor: pointer; transition: all 0.3s; pointer-events: all; }
        .label-pulse {animation: pulse-ring 2s infinite; }
        @keyframes pulse-ring {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--system-blue-rgb), 0.7); }
            70% {transform: scale(1); box-shadow: 0 0 0 10px rgba(var(--system-blue-rgb), 0); }
            100% {transform: scale(0.95); box-shadow: 0 0 0 0 rgba(var(--system-blue-rgb), 0); }
        }
        .hotspot-plus {transition: transform 0.3s ease; transform-origin: center; transform-box: fill-box; }
        .label-hotspot:hover .hotspot-plus {transform: rotate(90deg); }
        .label-hotspot.active .hotspot-plus {transform: rotate(45deg); }

        .nutrition-label {font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        .nutrition-fact-bold {font-weight: 900; }
    </style>
`);
            // Final Assessment check (if slide 7)
            if (activeIdx === t.slides.length - 1) {
                const btn = document.getElementById('complete-btn');
                if (btn) btn.classList.add('flash-glow');
            }
        };

        // For hotspot clicks, use simple fade instead of slide transition
        if (isHotspotClick) {
            const mount = document.getElementById('food-label-mount');
            if (mount) {
                mount.style.opacity = '0';
                mount.style.transition = 'opacity 0.15s ease-out';
                setTimeout(() => {
                    renderContent('animate-fade-in');
                    requestAnimationFrame(() => {
                        mount.style.opacity = '1';
                    });
                }, 100);
            }
        } else {
            this.slideTransition(mount, isInitial, direction, renderContent);
        }
    },

    getFoodLabelSVGForSlide(idx, activeHotspot) {
        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang].modules.foodLabel;
        const slide = t.slides[idx];
        const accent = 'var(--accent-red)';

        switch (idx) {
            case 0: // Intro
                return `
    <svg viewBox="0 0 400 300" width="100%"  style="max-width: 500px;">
                        <rect x="50" y="50" width="120" height="180" rx="10" fill="var(--bg-skeleton)" stroke="var(--border-soft)" />
                        <text x="110" y="80" text-anchor="middle" font-size="10" font-weight="bold" fill="${accent}">NATURAL!</text>
                        <text x="110" y="100" text-anchor="middle" font-size="10" font-weight="bold" fill="${accent}">HEALTHY!</text>
                        <rect x="110" y="150" width="20" height="10" rx="2" fill="${accent}" opacity="0.3" class="animate-pulse" />
                        
                        <rect x="230" y="50" width="120" height="180" rx="5" fill="var(--bg-card)" stroke="var(--border-strong)" stroke-width="2" />
                        <text x="290" y="65" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--text-primary)">Nutrition Facts</text>
                        <rect x="240" y="80" width="100" height="5" fill="var(--bg-depth)" />
                        <rect x="240" y="100" width="100" height="5" fill="var(--bg-depth)" />
                        <circle cx="290" cy="150" r="30" fill="none" stroke="${accent}" stroke-width="2" class="animate-pulse" />
                    </svg> `;
            case 1: // Anatomy (Interactive)
                const blue = 'var(--system-blue)';
                const createHotspot = (id, x, y, color = blue) => `
    <g class="label-hotspot ${activeHotspot === id ? 'active' : ''}" data-action="renderFoodLabel" data-args="1, '${id}'">
                        <circle cx="${x}" cy="${y}" r="12" fill="var(--bg-card)" stroke="${activeHotspot === id ? color : 'var(--stroke-subtle)'}" stroke-width="2" />
                        <g transform="translate(${x}, ${y})">
                            <g class="hotspot-plus">
                                <line x1="-6" y1="0" x2="6" y2="0" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
                                <line x1="0" y1="-6" x2="0" y2="6" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
                            </g>
                        </g>
                        <rect x="${x - 22}" y="${y - 22}" width="44" height="44" fill="transparent" />
                    </g>
    `;

                return `
    <svg viewBox="-15 -10 340 480" width="100%"  style="max-width: 500px; overflow: visible;" class="nutrition-label">
                        <rect x="10" y="0" width="280" height="460" fill="var(--bg-card)" stroke="var(--border-strong)" stroke-width="1.5"/>
                        
                        <!--Header -->
                        <text x="20" y="32" font-size="34" font-weight="900" style="letter-spacing: -1px;" fill="var(--text-primary)">Nutrition Facts</text>
                        <line x1="15" y1="42" x2="285" y2="42" stroke="var(--border-strong)" stroke-width="3"/>
                        
                        <!--Servings -->
                        <text x="20" y="58" font-size="14" fill="var(--text-primary)">8 servings per container</text>
                        <text x="20" y="78" font-size="18" font-weight="900" fill="var(--text-primary)">Serving size</text>
                        <text x="160" y="78" font-size="18" font-weight="900" text-anchor="start" fill="var(--text-primary)">2/3 cup (55g)</text>
                        <line x1="15" y1="88" x2="285" y2="88" stroke="var(--border-strong)" stroke-width="6"/>
                        
                        <!--Calories -->
                        <text x="20" y="105" font-size="13" font-weight="900" fill="var(--text-primary)">Amount per serving</text>
                        <text x="20" y="140" font-size="38" font-weight="900" style="letter-spacing: -1px;" fill="var(--text-primary)">Calories</text>
                        <text x="280" y="140" font-size="44" font-weight="900" text-anchor="end" fill="var(--text-primary)">230</text>
                        <line x1="15" y1="150" x2="285" y2="150" stroke="var(--border-strong)" stroke-width="4"/>
                        
                        <!-- % Daily Value Head-->
                        <text x="280" y="165" font-size="12" font-weight="900" text-anchor="end" fill="var(--text-primary)">% Daily Value*</text>
                        <line x1="15" y1="172" x2="285" y2="172" stroke="var(--border-strong)" stroke-width="1"/>
                        
                        <!--Stats -->
                        <g font-size="14" fill="var(--text-primary)">
                            <text x="20" y="190"><tspan font-weight="900">Total Fat</tspan> 8g</text> <text x="280" y="190" text-anchor="end" font-weight="900">10%</text>
                            <line x1="20" y1="198" x2="285" y2="198" stroke="var(--stroke-subtle)" stroke-width="0.5"/>
                            
                            <text x="35" y="212">Saturated Fat 1g</text> <text x="280" y="212" text-anchor="end" font-weight="900">5%</text>
                            <line x1="20" y1="220" x2="285" y2="220" stroke="var(--stroke-subtle)" stroke-width="0.5"/>
                            
                            <text x="20" y="235"><tspan font-weight="900">Cholesterol</tspan> 0mg</text> <text x="280" y="235" text-anchor="end" font-weight="900">0%</text>
                            <line x1="20" y1="242" x2="285" y2="242" stroke="var(--stroke-subtle)" stroke-width="0.5"/>
                            
                            <text x="20" y="258"><tspan font-weight="900">Sodium</tspan> 160mg</text> <text x="280" y="258" text-anchor="end" font-weight="900">7%</text>
                            <line x1="20" y1="265" x2="285" y2="265" stroke="var(--stroke-subtle)" stroke-width="0.5"/>
                            
                            <text x="20" y="280"><tspan font-weight="900">Total Carbohydrate</tspan> 37g</text> <text x="280" y="280" text-anchor="end" font-weight="900">13%</text>
                            <line x1="20" y1="288" x2="285" y2="288" stroke="var(--stroke-subtle)" stroke-width="0.5"/>
                            
                            <text x="35" y="302">Dietary Fiber 4g</text> <text x="280" y="302" text-anchor="end" font-weight="900">14%</text>
                            <line x1="20" y1="310" x2="285" y2="310" stroke="var(--stroke-subtle)" stroke-width="0.5"/>
                            
                            <text x="35" y="325">Total Sugars 12g</text>
                            <text x="50" y="345">Includes 10g Added Sugars</text> <text x="280" y="345" text-anchor="end" font-weight="900">20%</text>
                            <line x1="20" y1="353" x2="285" y2="353" stroke="var(--stroke-subtle)" stroke-width="0.5"/>
                            
                            <text x="20" y="368"><tspan font-weight="900">Protein</tspan> 3g</text>
                            <line x1="15" y1="375" x2="285" y2="375" stroke="var(--border-strong)" stroke-width="4"/>
                        </g>

                        <!--Highlights & Hotspots-->
    ${activeHotspot === 'serving-size' ? `<rect x="15" y="45" width="270" height="40" fill="var(--system-red)" opacity="0.1" rx="4"/>` : ''}
                        ${activeHotspot === 'calories' ? `<rect x="15" y="92" width="270" height="55" fill="var(--system-orange)" opacity="0.1" rx="4"/>` : ''}
                        ${activeHotspot === 'fats' ? `<rect x="15" y="175" width="270" height="45" fill="var(--system-purple)" opacity="0.1" rx="4"/>` : ''}
                        ${activeHotspot === 'sodium' ? `<rect x="15" y="244" width="270" height="21" fill="var(--system-yellow)" opacity="0.1" rx="4"/>` : ''}
                        ${activeHotspot === 'carbs' ? `<rect x="15" y="267" width="270" height="21" fill="var(--system-green)" opacity="0.1" rx="4"/>` : ''}
                        ${activeHotspot === 'added-sugar' ? `<rect x="15" y="312" width="270" height="41" fill="var(--system-blue)" opacity="0.1" rx="4"/>` : ''}
                        
                        ${createHotspot('serving-size', 300, 65, 'var(--system-red)')}
                        ${createHotspot('calories', 300, 115, 'var(--system-orange)')}
                        ${createHotspot('fats', 10, 200, 'var(--system-purple)')}
                        ${createHotspot('sodium', 300, 258, 'var(--system-yellow)')}
                        ${createHotspot('carbs', 10, 280, 'var(--system-green)')}
                        ${createHotspot('added-sugar', 300, 335, 'var(--system-blue)')}
                    </svg> `;
            case 2: // %DV
                return `
    <div class="dv-explorer">
                        <svg viewBox="0 0 300 100" width="100%">
                            <rect x="20" y="40" width="260" height="20" rx="10" fill="var(--bg-depth)" />
                            <rect x="20" y="40" width="40" height="20" rx="10" fill="var(--system-green)" />
                            <rect x="240" y="40" width="40" height="20" rx="10" fill="${accent}" />
                            <text x="40" y="80" text-anchor="middle" font-size="10" font-weight="800">5% LOW</text>
                            <text x="260" y="80" text-anchor="middle" font-size="10" font-weight="800">20% HIGH</text>
                        </svg>
                        <div style="background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border-soft); overflow: hidden; box-shadow: var(--shadow-soft);">
                            ${slide.table.map(row => `
                                <div style="display: flex; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-soft);">
                                    <span style="font-weight: 600;">${row.n}</span>
                                    <span style="font-weight: 800; color: ${row.v.includes('✅') ? 'var(--system-green)' : row.v.includes('🔴') ? accent : 'var(--system-orange)'}">${row.v}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div> `;
            case 3: // Ingredients
                return `
    <div style="padding: 24px; font-family: var(--font-sans);">
        <div style="border: 3px solid var(--border-strong); padding: 24px; background: var(--bg-card); border-radius: 12px;">
            <div style="font-weight: 900; border-bottom: 4px solid var(--border-strong); margin-bottom: 16px; font-size: 24px; color: var(--text-primary);">INGREDIENTS:</div>
            ${slide.rules.map(rule => `<div style="margin-bottom: 12px; font-size: 15px; line-height: 1.5; font-weight: 600; color: var(--text-primary);">${rule}</div>`).join('')}
        </div>
                    </div> `;
            case 4: // Detective
                return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; width: 100%;">
        ${slide.comparisons.map(comp => `
                            <div style="background: var(--bg-component); border-radius: 12px; padding: 16px; border: 1px solid var(--border-soft);">
                                <div style="font-weight: 800; margin-bottom: 12px; font-size: 16px;">${comp.name}</div>
                                <div style="font-size: 14px; margin-bottom: 6px;">A: ${comp.a}</div>
                                <div style="font-size: 14px; margin-bottom: 6px;">B: ${comp.b}</div>
                                <div class="detective-win">WINNER: ${comp.win}</div>
                            </div>
                        `).join('')
                    }
                    </div> `;
            case 5: // Marketing
                return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; width: 100%;">
        ${slide.claims.map(claim => `
                            <div style="padding: 16px; background: var(--bg-card); border: 1px solid var(--border-soft); border-radius: 12px; box-shadow: var(--shadow-soft); cursor: help;">
                                <div style="color: ${accent}; font-weight: 800; font-size: 13px; margin-bottom: 6px;">${claim.c}</div>
                                <div style="font-size: 12px; line-height: 1.4;">${claim.t}</div>
                            </div>
                        `).join('')
                    }
                    </div> `;
            case 6: // Guide
                return `
    <div style="text-align: center; width: 100%;">
                        <div style="font-weight: 800; font-size: 18px; margin-bottom: 20px; color: ${accent};">${slide.flowchart ? slide.flowchart.split(' → ')[0] : 'Big 4 Reference'}</div>
                        <svg viewBox="0 0 200 150" width="100%">
                            <defs><marker id="arrow-metric" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--stroke-subtle)" /></marker></defs>
                            <circle cx="100" cy="30" r="25" fill="var(--bg-skeleton)" stroke="${accent}" stroke-width="2" />
                            <text x="100" y="32" text-anchor="middle" font-size="8" font-weight="bold" fill="var(--text-primary)">BIG 4</text>
                            <path d="M100 55 L100 80" stroke="var(--border-strong)" stroke-width="2" marker-end="url(#arrow-metric)" />
                            <rect x="60" y="80" width="80" height="30" rx="5" fill="var(--system-green)" />
                            <text x="100" y="100" text-anchor="middle" font-size="10" font-weight="bold" fill="var(--text-white)">BUY!</text>
                        </svg>
                        <div style="font-size: 11px; font-weight: 700; background: var(--bg-depth); padding: 8px; border-radius: 8px; margin-top: 10px; color: var(--text-secondary);">
                            ${t.labels.big3 || 'Healthy Choices Shield You'}
                        </div>
                    </div> `;
            default:
                return '';
        }
    },

    renderMedicationMap(mountId = 'med-map-mount') {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang] || this.translations['en'];
        const data = t.modules.medicationMap;

        if (!data || !data.categories) return;

        DOMUtils.safeSetHTML(mount, `
    <div class="med-categories-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 24px; padding: 10px;">
        ${data.categories.map(cat => `
                    <div class="soft-card interact-hover" data-action="renderMedicationCategory" data-args="'${cat.id}'" style="cursor: pointer; padding: 24px; text-align: left; transition: transform 0.2s;">
                        <h3 style="color: var(--accent-red); margin-top: 0; font-size: 20px;">${cat.name}</h3>
                        <p style="font-size: 15px; opacity: 0.8; margin-bottom: 0px; line-height: 1.5;">${cat.desc}</p>
                         <div style="margin-top: 12px; font-size: 13px; color: var(--text-tertiary); font-weight: 600;">Tap to explore detailed classes →</div>
                    </div>
                `).join('')
            }
            </div>
    <div id="med-category-detail-mount" style="scroll-margin-top: 80px;"></div>
`);
    },

    renderMedicationCategory(catId) {
        const mount = document.getElementById('med-category-detail-mount');
        if (!mount) return;

        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang] || this.translations['en'];
        const data = t.modules.medicationMap;
        const cat = data.categories.find(c => c.id === catId);

        if (!cat) return;

        // Custom Content Support
        if (cat.contentHTML) {
            DOMUtils.safeSetHTML(mount, `
    <div class="animate-fade-in" style="margin-top: 40px; border-top: 2px solid var(--border-soft); padding: 32px 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 28px; margin: 0;">${cat.name}</h2>
                    <button class="btn btn-secondary" data-action="clearMount" data-args="'med-category-detail-mount'" style="font-size: 14px;">Close</button>
                </div>
                <div style="font-size: 16px; line-height: 1.6;">${cat.contentHTML}</div>
            </div>
    `);
            setTimeout(() => mount.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            return;
        }

        DOMUtils.safeSetHTML(mount, `
    <div class="animate-fade-in" style="margin-top: 40px; border-top: 2px solid var(--border-soft); padding: 32px 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="font-size: 28px; margin: 0;">${cat.name} Classes</h2>
                    <button class="btn btn-secondary" data-action="clearMount" data-args="'med-category-detail-mount'" style="font-size: 14px;">Close Section</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${cat.classes && cat.classes.map ? cat.classes.map((cls, idx) => this.getMedicationClassCardHTML(cls, idx, catId)).join('') : '<p>No classes defined.</p>'}
                </div>
            </div>
    `);

        setTimeout(() => mount.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    },

    getMedicationClassCardHTML(cls, idx, categoryId = 'heart') {
        const cardId = `med-card-${idx}-${Math.floor(Math.random() * 1000)}`;
        const mechanism = cls.mechanism || "Mechanism details available in full version.";

        // Handle interactions whether it's an Array (old data) or Object (new data)
        let interactionsHTML = '';
        if (cls.interactions) {
            if (Array.isArray(cls.interactions)) {
                interactionsHTML = cls.interactions.map(interaction => `<li> ${interaction}</li>`).join('');
            } else {
                const dd = cls.interactions.drugDrug ? cls.interactions.drugDrug.map(i => `<li style="margin-bottom: 6px;"> ${i}</li>`).join('') : '';
                const df = cls.interactions.drugFood ? cls.interactions.drugFood.map(i => `<li style="margin-bottom: 6px;"> ${i}</li>`).join('') : '';
                interactionsHTML = dd + df;
            }
        }

        return `
    <div id="${cardId}" class="soft-card" style="padding: 0; overflow: visible; border: 1px solid var(--border-soft);">
                <div class="med-card-header" data-action="toggleMedicationCard" data-args="'${cardId}'" data-stop-propagation="true" style="padding: 24px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: var(--bg-card);">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${cls.name}</h3>
                        </div>
                        <div style="font-size: 15px; color: var(--text-secondary);">
                            Common: <span style="font-style: italic;">${cls.drugs ? cls.drugs.join(', ') : 'Various'}</span>
                        </div>
                    </div>
                    <div class="expand-icon" style="opacity: 0.5; font-size: 20px; transition: transform 0.3s;">▼</div>
                </div>
                
                <div class="med-card-content">
                    <div style="padding: 24px; background: var(--bg-depth); border-top: 1px solid var(--border-soft);">
                        
                        <!-- Add to My Medications Section -->
                        ${cls.drugs && cls.drugs.length > 0 ? `
                            <div style="margin-bottom: 24px; padding: 16px; background: var(--bg-gradient-info); border-radius: 12px; border: 1px solid var(--bg-tip-border);">
                                <h4 style="font-size: 13px; font-weight: 700; color: var(--text-info-strong); margin: 0 0 12px 0;">📋 Add to My Medications</h4>
                                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${cls.drugs.map(drug => {
            const isAdded = this.myMedications.some(m => m.name === drug);
            return `
                                            <button 
                                                class="btn ${isAdded ? 'btn-secondary' : 'btn-primary'}"
                                                data-action="toggleMyMedication" data-args="'${drug}'"
                                                data-med-name="${drug}"
                                                data-stop-propagation="true"
                                                style="font-size: 13px; padding: 6px 12px;">
                                                ${isAdded ? '✓ ' + drug : '+ ' + drug}
                                            </button>
                                        `;
        }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <!-- Sections -->
                        <div style="margin-bottom: 24px;">
                            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-tertiary); margin: 0 0 8px 0;">What This Medicine Does</h4>
                            <p style="font-size: 16px; line-height: 1.6; color: var(--text-primary); margin: 0;">${mechanism}</p>
                        </div>

                        ${cls.sideEffects ? `
                        <div style="margin-bottom: 24px;">
                            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-tertiary); margin: 0 0 8px 0;">Common Side Effects</h4>
                            <div style="background: var(--bg-depth); padding: 16px; border-radius: 8px; border: 1px solid var(--border-soft);">
                                ${cls.sideEffects.common ? `<div style="font-size: 15px; margin-bottom: 8px;"><strong>Common:</strong> ${cls.sideEffects.common.join(', ')}</div>` : ''}
                                ${cls.sideEffects.rare ? `<div style="font-size: 15px; color: var(--accent-red);"><strong>Rare/Important:</strong> ${cls.sideEffects.rare.join(', ')}</div>` : ''}
                            </div>
                        </div>
                        ` : ''}

                        ${interactionsHTML ? `
                        <div style="margin-bottom: 24px;">
                            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-tertiary); margin: 0 0 8px 0;">Important Interactions</h4>
                             <ul style="padding-left: 20px; margin: 0; font-size: 15px; line-height: 1.5;">
                                ${interactionsHTML}
                             </ul>
                        </div>
                        ` : ''}
                        
                         ${cls.cost ? `
                        <div style="background: var(--bg-success-subtle); padding: 16px; border-radius: 12px; display: flex; gap: 24px; align-items: center; border: 1px solid var(--border-success-subtle);">
                            <div style="font-size: 24px;">💰</div>
                            <div style="font-size: 14px; line-height: 1.4;">
                                <div style="font-weight: 700; color: var(--system-green); margin-bottom: 4px;">Affordability</div>
                                <div>Generic Available: <strong>${cls.cost.generic ? 'Yes' : 'No'}</strong></div>
                                <div>GoodRx Est: <strong>${cls.cost.goodRx || 'N/A'}</strong></div>
                            </div>
                        </div>
                        ` : ''}

                         <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-soft); font-size: 14px; color: var(--text-tertiary); font-style: italic;">
                            Disclaimer: This is for educational purposes only. Always consult your doctor for specific advice.
                         </div>
                    </div>
                </div>
            </div>
    `;
    },

    toggleMedicationCard(cardId) {
        // Safe toggle with simple error logging
        try {
            const card = document.getElementById(cardId);
            if (!card) {
                console.error('Medication card not found:', cardId);
                return;
            }
            const content = card.querySelector('.med-card-content');
            const icon = card.querySelector('.expand-icon');

            card.classList.toggle('expanded');
            const isExpanded = card.classList.contains('expanded');

            if (isExpanded) {
                content.classList.add('expanded');
                icon.style.transform = 'rotate(180deg)';
            } else {
                content.classList.remove('expanded');
                icon.style.transform = 'rotate(0deg)';
            }
        } catch (e) {
            console.error('Error toggling medication card:', e);
        }
    },

    // My Medications Methods
    addMyMedication(medicationName, categoryId, classIndex) {
        if (!this.myMedications.some(m => m.name === medicationName)) {
            this.myMedications.push({
                name: medicationName,
                categoryId: categoryId,
                classIndex: classIndex,
                addedDate: new Date().toISOString()
            });

            this.saveMyMedications();
            this.updateMedicationUI();

            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate(10);
        }
    },

    removeMyMedication(medicationName) {
        this.myMedications = this.myMedications.filter(m => m.name !== medicationName);
        this.saveMyMedications();
        this.updateMedicationUI();
    },

    async saveMyMedications() {
        await this.secureStorage.setItem('ckm_my_medications', this.myMedications);
        this.renderMedicationsManager(document.getElementById('med-manager-mount'));

        // Update counter if visible
        const countSpan = document.getElementById('my-med-count');
        if (countSpan) {
            countSpan.textContent = this.myMedications.length;
            countSpan.style.display = this.myMedications.length > 0 ? 'inline-block' : 'none';
        }
    },

    toggleMyMedication(name) {
        const idx = this.myMedications.findIndex(m => m.name === name);
        if (idx === -1) {
            // Add - Lookup metadata first
            const lang = this.currentLanguage || 'en';
            const t = this.translations[lang] || this.translations['en'];
            const data = t.modules.medicationMap;

            let foundDetails = {};

            // Search for drug metadata
            for (const cat of data.categories) {
                if (cat.classes) {
                    // Try to match by name in current language
                    // Note: This relies on button textual name matching the data name
                    // which should be true as buttons are generated from data
                    for (let i = 0; i < cat.classes.length; i++) {
                        const cls = cat.classes[i];
                        // Check examples or class name itself if needed (though usually we are toggling via class name context?)
                        // The UI buttons (line 5516, 5554) usually pass the drug/class name.
                        // But wait, line 5202 in renderMedicationMap passes 'drug' name from examples?
                        // "data-args="'${drug}'""

                        // FIX: Check 'drugs' array as strictly used in renderMedicationMap
                        const drugList = cls.drugs || cls.examples || [];
                        if (drugList.includes(name)) {
                            foundDetails = { categoryId: cat.id, classIndex: i, className: cls.name };
                            break;
                        }
                        // Also match class name itself just in case
                        if (cls.name === name) {
                            foundDetails = { categoryId: cat.id, classIndex: i, className: cls.name };
                            break;
                        }
                    }
                }
                if (foundDetails.categoryId) break;
            }

            this.myMedications.push({
                name: name,
                dose: '10mg',
                freq: 'daily',
                ...foundDetails
            });
            this.haptic(40);
        } else {
            // Remove
            this.myMedications.splice(idx, 1);
            this.haptic(20);
        }
        this.saveMyMedications();
        // Use non-destructive update to keep accordions open
        this.updateMedicationUI();
    },

    scrollToStaging() {
        const stageExplorer = document.getElementById('stage-explorer-intro');
        if (stageExplorer) {
            stageExplorer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollBy({ top: 600, behavior: 'smooth' });
        }
    },

    scrollToElement(id) {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    clearMount(id) {
        const mount = document.getElementById(id);
        if (mount) {
            DOMUtils.clearChildren(mount);
        }
    },

    closeMyMedications() {
        const modal = document.getElementById('my-meds-modal');
        if (modal) modal.remove();
    },

    renderMedicationsManager(mountPoint) {
        if (!mountPoint) return;
        this.renderMyMedicationsDashboard(mountPoint.id);
    },


    updateMedicationUI() {
        // Update any "Add to My Medications" buttons to show "Remove" if already added
        const buttons = document.querySelectorAll('[data-med-name]');
        buttons.forEach(btn => {
            const medName = btn.getAttribute('data-med-name');
            const isAdded = this.myMedications.some(m => m.name === medName);
            const isCurrentlyAdded = btn.classList.contains('btn-secondary');

            if (isAdded && !isCurrentlyAdded) {
                // Only update if state changed
                DOMUtils.safeSetHTML(btn, `<span style="margin-right:4px">✓</span> ${medName} `);
                btn.classList.add('btn-secondary');
                btn.classList.remove('btn-primary');
            } else if (!isAdded && isCurrentlyAdded) {
                // Only update if state changed
                DOMUtils.safeSetHTML(btn, `<span style="margin-right:4px"> +</span> ${medName} `);
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');
            }
            // If state matches, do nothing (saves layout calculation)
        });

        // Re-render modal content if open to ensure real-time updates when removing
        const modalContent = document.getElementById('my-meds-modal-content');
        if (modalContent) {
            // Use a flag to prevent recursion if renderMyMedicationsDashboard calls updateMedicationUI
            if (!this._isUpdatingModal) {
                this._isUpdatingModal = true;
                this.renderMyMedicationsDashboard('my-meds-modal-content');
                this._isUpdatingModal = false;
            }
        }

        // Update badge count if exists
        const badge = document.getElementById('my-med-count');
        if (badge) {
            badge.textContent = this.myMedications.length;
            badge.style.display = this.myMedications.length > 0 ? 'inline-block' : 'none';
        }
    },

    checkMedicationInteractions() {
        if (this.myMedications.length < 2) {
            return { hasInteractions: false, interactions: [] };
        }

        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang] || this.translations['en'];
        const data = t.modules.medicationMap;

        const interactions = [];

        // Build a list of all medication class objects
        // Check for interactions
        const medClasses = [];
        this.myMedications.forEach(myMed => {
            const cat = data.categories.find(c => c.id === myMed.categoryId);
            if (cat && cat.classes) {
                // Use classIndex if available (new format), fallback to name match (legacy)
                let cls;
                if (typeof myMed.classIndex === 'number') {
                    cls = cat.classes[myMed.classIndex];
                } else {
                    cls = cat.classes.find(c => c.name === myMed.className);
                }

                if (cls) {
                    medClasses.push({ ...cls, categoryId: myMed.categoryId, classIndex: myMed.classIndex !== undefined ? myMed.classIndex : -1 });
                }
            }
        });

        // Check for known interactions
        for (let i = 0; i < medClasses.length; i++) {
            for (let j = i + 1; j < medClasses.length; j++) {
                const med1 = medClasses[i];
                const med2 = medClasses[j];

                // Helper to check if med matches a specific class by ID/Index (Language Agnostic)
                // Heart: 0=BetaBlocker, 1=ACEi, 2=ARB, 3=ARNI, 4=CCB
                const isClass = (m, cat, idx) => m.categoryId === cat && m.classIndex === idx;

                // Specific interaction checks
                // Beta-Blocker + CCB
                if (isClass(med1, 'heart', 0) && isClass(med2, 'heart', 4)) {
                    interactions.push({
                        med1: med1.name,
                        med2: med2.name,
                        severity: 'moderate',
                        description: 'Combining beta-blockers with certain calcium channel blockers (diltiazem/verapamil) can slow heart rate too much. Monitor your heart rate regularly.'
                    });
                }

                // Check if meds are RAAS inhibitors (ACEi, ARB, ARNI)
                // ACEi=1, ARB=2, ARNI=3 (Heart category)
                const isRAAS = (m) => isClass(m, 'heart', 1) || isClass(m, 'heart', 2) || isClass(m, 'heart', 3);

                if (isRAAS(med1) && isRAAS(med2)) {
                    interactions.push({
                        med1: med1.name,
                        med2: med2.name,
                        severity: 'high',
                        description: 'IMPORTANT: ACE inhibitors, ARBs, and ARNI should NOT be combined. This can cause dangerous increases in potassium levels and kidney problems.'
                    });
                }
            }
        }

        return {
            hasInteractions: interactions.length > 0,
            interactions: interactions
        };
    },

    renderMyMedicationsDashboard(mountId = 'my-meds-mount') {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang] || this.translations['en'];
        const data = t.modules.medicationMap;

        if (this.myMedications.length === 0) {
            DOMUtils.safeSetHTML(mount, `
    <div class="soft-card" style="padding: 48px; text-align: center;">
                    <h2 style="font-size: 24px; margin-bottom: 16px;">📋 My Medications</h2>
                    <p style="font-size: 16px; opacity: 0.7; margin-bottom: 0px;">You haven't added any medications yet.</p>
                </div>
    `);
            return;
        }

        // Check for interactions
        const interactionCheck = this.checkMedicationInteractions();

        // Build medication details
        // Build medication details
        let medDetails = this.myMedications.map(myMed => {
            const cat = data.categories.find(c => c.id === myMed.categoryId);
            if (!cat || !cat.classes) return null;

            let cls;
            if (typeof myMed.classIndex === 'number') {
                cls = cat.classes[myMed.classIndex];
            } else {
                cls = cat.classes.find(c => c.name === myMed.className);
            }

            if (!cls) return null;

            return {
                ...myMed,
                classData: cls,
                categoryName: cat.name
            };
        }).filter(m => m !== null);

        DOMUtils.safeSetHTML(mount, `
    <div style="max-width: 900px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
            <h1 style="font-size: 32px; margin: 0;">📋 My Medications</h1>
            <button class="btn btn-secondary" data-action="navigateTo" data-args="'education'">+ Add Medication</button>
        </div>

                ${interactionCheck.hasInteractions ? `
                    <div class="soft-card" style="padding: 24px; margin-bottom: 24px; border-left: 4px solid var(--system-orange); background: var(--bg-depth);">
                        <h3 style="color: var(--system-orange); margin-top: 0; font-size: 18px;">⚠️ Potential Interactions Detected</h3>
                        ${interactionCheck.interactions.map(interaction => `
                            <div style="margin-bottom: 16px; padding: 12px; background: var(--bg-card); border-radius: 8px;">
                                <div style="font-weight: 600; margin-bottom: 8px;">
                                    ${interaction.med1} + ${interaction.med2}
                                    <span style="color: ${interaction.severity === 'high' ? 'var(--system-red)' : 'var(--system-orange)'}; font-size: 12px; text-transform: uppercase; margin-left: 8px;">
                                        ${interaction.severity} risk
                                    </span>
                                </div>
                                <div style="font-size: 14px; line-height: 1.6;">
                                    ${interaction.description}
                                </div>
                            </div>
                        `).join('')}
                        <div style="font-size: 14px; margin-top: 16px; padding: 12px; background: var(--bg-card); border-radius: 8px;">
                            <strong>What to do:</strong> Do NOT stop taking your medications. Call your doctor or pharmacist to discuss these potential interactions.
                        </div>
                    </div>
                ` : ''
            }

                <div style="display: grid; gap: 20px; padding: 10px;">
                    ${medDetails.map(med => `
                        <div class="soft-card" style="padding: 24px; border: 1px solid var(--border-soft);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                <div>
                                    <h3 style="font-size: 20px; margin: 0 0 4px 0; color: var(--accent-red);">
                                        ${med.name}
                                    </h3>
                                    <div style="font-size: 14px; opacity: 0.7;">
                                        ${med.className} • ${med.categoryName}
                                    </div>
                                </div>
                                <button class="btn btn-secondary" data-action="removeMyMedication" data-args="'${med.name}'" style="font-size: 13px;">
                                    Remove
                                </button>
                            </div>

                            <div style="border-top: 1px solid var(--border-soft); padding-top: 16px; margin-top: 16px;">
                                <h4 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-tertiary);">
                                    KEY INFORMATION
                                </h4>
                                <div style="font-size: 14px; line-height: 1.6;">
                                    ${med.classData.mechanism}
                                </div>
                            </div>

                            ${med.classData.sideEffects ? `
                                <div style="border-top: 1px solid var(--border-soft); padding-top: 16px; margin-top: 16px;">
                                    <h4 style="font-size: 14px; font-weight: 600; margin: 0 0 8px 0; color: var(--text-tertiary);">
                                        COMMON SIDE EFFECTS
                                    </h4>
                                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                                        ${med.classData.sideEffects.common ? med.classData.sideEffects.common.map(se => `<li>${se}</li>`).join('') : ''}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>

                <div class="soft-card" style="padding: 24px; margin-top: 32px; background: var(--bg-gradient-info); border: 1px solid var(--bg-tip-border);">
                    <h3 style="margin: 0 0 12px 0; font-size: 18px; color: var(--text-info-strong);">💡 Medication Management Tips</h3>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 2;">
                        <li>Take medications at the same time each day for best results</li>
                        <li>Never stop or adjust doses without talking to your doctor first</li>
                        <li>Keep an updated list of all your medications when visiting doctors</li>
                        <li>Ask your pharmacist about generic options to save money</li>
                    </ul>
                </div>
            </div>
    `);

        // After rendering, update UI states
        this.updateMedicationUI();
    },

    showMyMedications() {
        // Create a modal-like overlay for My Medications
        const existingModal = document.getElementById('my-meds-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'my-meds-modal';
        modal.style.cssText = `
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.5);
z-index: var(--z-modal);
display: flex;
align-items: center;
justify-content: center;
padding: 20px;
animation: fadeIn 0.2s ease;
`;

        DOMUtils.safeSetHTML(modal, `
    <div style="background: var(--bg-card); border-radius: 20px; max-width: 1000px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: var(--shadow-premium);">
            <div style="position: sticky; top: 0; background: var(--bg-card); padding: 24px; border-bottom: 1px solid var(--border-soft); display: flex; justify-content: space-between; align-items: center; border-radius: 20px 20px 0 0; z-index: 10;">
                <h2 style="margin: 0; font-size: 24px;">📋 My Medications</h2>
                <button data-action="closeMyMedications" data-args="" style="background: none; border: none; font-size: 28px; cursor: pointer; opacity: 0.7; transition: opacity 0.2s; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">×</button>
            </div>
            <div id="my-meds-modal-content" style="padding: 24px;">
            </div>
        </div>
    `);

        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeMyMedications();
        });

        this.renderMyMedicationsDashboard('my-meds-modal-content');
    },


    renderMetricsDashboard(activeCatId = 'bp') {
        const mount = document.getElementById('metrics-dashboard-mount');
        if (!mount) return;

        const lang = this.currentLanguage;
        const t = this.translations[lang].modules.metricsDashboard.categories;

        const iconMap = {
            bp: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"></path></svg>`,
            a1c: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5s-3 3.5-3 5.5a7 7 0 0 0 7 7Z"></path></svg>`,
            ldl: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
            bmi: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="10" rx="2"></rect><path d="M12 2v8"></path><path d="M10 2h4"></path><circle cx="12" cy="14" r="3"></circle></svg>`,
            kidney: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line></svg>`
        };

        const activeCat = t[activeCatId];
        if (!activeCat) return;

        let tableHtml = `<div class="metrics-table" style="display: flex; flex-direction: column; gap: 12px;">`;
        activeCat.levels.forEach(lvl => {
            tableHtml += `<div class="metric-row" style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-component); border: 1px solid var(--border-soft); border-radius: 8px;"><strong>${lvl.label}:</strong> <span>${lvl.value}</span></div>`;
        });
        tableHtml += `</div>`;

        if (activeCatId === 'kidney' || activeCatId === 'ldl') {
            const perspectiveTitle = lang === 'pt' ? "Visão do Médico" : (lang === 'es' ? "Perspectiva Médica" : "Physician's Perspective");
            tableHtml += `
            <div class="${activeCatId}-details" style="margin-top: 24px; border-top: 1px solid var(--border-soft); padding-top: 24px;">
                <div style="background: var(--bg-depth); padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                    <h5 style="margin-bottom: 12px; font-weight: 800; color: var(--accent-red);">${perspectiveTitle}</h5>
                    <p style="font-size: 14px; line-height: 1.5; color: var(--text-primary);">
                        ${activeCat.physicianNote || ""}
                    </p>
                </div>
            </div>
    `;
        } else if (activeCat.physicianNote) {
            tableHtml += `
            <div class="physician-note" style="margin-top: 24px; border-top: 1px solid var(--border-soft); padding-top: 24px;">
                <p style="font-size: 14px; opacity: 0.7;"><strong>Note:</strong> ${activeCat.physicianNote}</p>
            </div>
    `;
        }

        let html = `
            <div class="metrics-dashboard" style="display: flex; flex-direction: column; gap: 24px;">
                <div class="metrics-grid" style="display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px;">
                    ${Object.keys(t).map(key => `
                         <div class="metric-card ${key === activeCatId ? 'active' : ''}" 
                              style="flex: 1; min-width: 100px; padding: 16px; border-radius: 12px; border: 1px solid ${key === activeCatId ? 'var(--accent-red)' : 'var(--border-soft)'}; background: ${key === activeCatId ? 'var(--accent-red-light)' : 'var(--bg-card)'}; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; transition: all 0.2s;"
                              data-action="renderMetricsDashboard" data-args="'${key}'">
                            <div class="metric-icon">${iconMap[key] || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>'}</div>
                            <div class="metric-info">
                                <strong>${t[key].title}</strong>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="metric-detail-panel animate-fade-in">
                    <h4 style="color: var(--accent-red); margin-bottom: 8px; font-size: 24px; font-weight: 800;">${activeCat.title}</h4>
                    <p style="margin-bottom: 24px; font-size: 16px; opacity: 0.7; border-bottom: 1px solid var(--border-soft); padding-bottom: 24px;">${activeCat.desc}</p>
                    ${tableHtml}
                </div>
            </div>
    `;
        DOMUtils.safeSetHTML(mount, html);
    },

    renderStageExplorer(activeStageId = 1) {
        const mount = document.getElementById('stage-explorer-mount');
        if (!mount) return;

        const t = this.translations[this.currentLanguage].modules.stageExplorer;
        const stage = t.stages.find(s => s.id === activeStageId);

        let html = `
        <div class="stage-explorer" id="stage-explorer-intro">
                <div class="tab-switcher">
                    ${t.stages.map(s => `
                        <button class="tab-btn ${s.id === activeStageId ? 'active' : ''}" data-action="renderStageExplorer" data-args="${s.id}">
                            Stage ${s.id}
                        </button>
                    `).join('')}
                </div>
                <div class="stage-detail-panel animate-fade-in">
                    <h4 style="color: var(--accent-red); margin-bottom: 8px;">${stage.title}</h4>
                    <p style="margin-bottom: 16px; font-weight: 500;">${stage.desc}</p>
                    <div class="stage-factors-grid">
                        <div class="stage-factor-item">
                            <strong>Weight & Waist</strong>
                            <p>${stage.factors.weight}</p>
                        </div>
                        <div class="stage-factor-item">
                            <strong>Blood Sugar</strong>
                            <p>${stage.factors.sugar}</p>
                        </div>
                        <div class="stage-factor-item">
                            <strong>Kidney Health</strong>
                            <p>${stage.factors.kidneys}</p>
                        </div>
                        <div class="stage-factor-item">
                            <strong>Heart Health</strong>
                            <p>${stage.factors.heart}</p>
                        </div>
                    </div>
                </div>
            </div>
    `;
        DOMUtils.safeSetHTML(mount, html);
    },

    renderAnatomy(mountId) {
        const mount = document.getElementById(mountId);
        if (!mount) return;
        DOMUtils.safeSetHTML(mount, `
    <div class="interactive-container" style="margin: 0 auto;">
        ${this.getHouseAnalogySVG()}
<div id="svg-tooltip" class="svg-tooltip hidden"></div>
            </div>
    `);
    },

    renderAnalogyAnimation(mountId, slideIdx = 0) {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const direction = slideIdx > (this._prevAnalogyIdx || 0) ? 'next' : 'prev';
        const isInitial = this._prevAnalogyIdx === undefined;
        this._prevAnalogyIdx = slideIdx;

        const lang = this.currentLanguage;
        const t = this.translations[lang].modules.analogy;
        const slide = t.slides[slideIdx];

        this.slideTransition(mount, isInitial, direction, (slideClass) => {
            DOMUtils.safeSetHTML(mount, `
    <div class="module-fullwidth ${slideClass}">
        <div class="module-grid">
            <div class="module-visual">
                ${this.getAnalogySVGForSlide(slideIdx)}
                ${slideIdx === 7 ? `
                                                <div class="analogy-control-panel animate-slide-up" style="margin-top: 24px; background: var(--bg-depth); border-radius: 16px; padding: 24px;">
                                                    <h4 style="font-size: 14px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; opacity: 0.7;">Repair Control Center</h4>
                                                    <div style="display: flex; flex-direction: column; gap: 12px;">
                                                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-soft);">
                                                            <input type="checkbox" style="width: 20px; height: 20px; accent-color: var(--system-green);" data-action="toggleAnalogyControl" data-args="'foundation', '${mountId}'" ${this.analogyState?.foundation ? 'checked' : ''}>
                                                            <span style="font-weight: 600;">Repair Foundation (Metabolic)</span>
                                                        </label>
                                                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-soft);">
                                                            <input type="checkbox" style="width: 20px; height: 20px; accent-color: var(--system-green);" data-action="toggleAnalogyControl" data-args="'electrical', '${mountId}'" ${this.analogyState?.electrical ? 'checked' : ''}>
                                                            <span style="font-weight: 600;">Upgrade Electrical (Heart)</span>
                                                        </label>
                                                        <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 12px; border-radius: 10px; background: var(--bg-card); border: 1px solid var(--border-soft);">
                                                            <input type="checkbox" style="width: 20px; height: 20px; accent-color: var(--system-green);" data-action="toggleAnalogyControl" data-args="'filtration', '${mountId}'" ${this.analogyState?.filtration ? 'checked' : ''}>
                                                            <span style="font-weight: 600;">Clean Filtration (Kidney)</span>
                                                        </label>
                                                    </div>
                                                    <div id="analogy-calculator" style="margin-top: 20px; text-align: center; border-top: 1px solid var(--border-soft); padding-top: 20px;">
                                                        <div style="font-size: 12px; font-weight: 800; color: var(--system-green); text-transform: uppercase; letter-spacing: 1px;">Home Longevity Bonus</div>
                                                        <div style="font-size: 32px; font-weight: 800; color: var(--system-green); margin: 4px 0;">+${this.calculateAnalogyBonus()} Years</div>
                                                        <div style="font-size: 14px; opacity: 0.6;">of comfortable, solid living</div>
                                                    </div>
                                                </div>` : ''}
            </div>
            <div class="module-text">
                <div class="explorer-counter">Slide ${slideIdx + 1} of ${t.slides.length}</div>
                <h3 class="explorer-title">${slide.title}</h3>
                <p class="explorer-text">${slide.text}</p>

                <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                    <button class="btn btn-secondary" data-action="showMyth" data-args="${slideIdx}, 'analogy'" style="min-height: 48px; padding: 0 20px; font-size: 14px;">
                        <span>❓</span> ${t.ui.mythLabel}
                    </button>
                </div>

                <div class="explorer-insight">
                    <h4 class="insight-label">${t.ui.lessonLabel}</h4>
                    <p class="insight-text">${slide.lesson}</p>
                </div>

                <div class="explorer-navigation">
                    ${slideIdx > 0 ? `<button class="btn btn-secondary" data-action="renderAnalogyAnimation" data-args="'${mountId}', ${slideIdx - 1}">${t.ui.prev}</button>` : ''}
                    ${slideIdx < t.slides.length - 1 ? `<button class="btn btn-primary" data-action="renderAnalogyAnimation" data-args="'${mountId}', ${slideIdx + 1}">${t.ui.next}</button>` : ''}
                </div>

                ${slideIdx === t.slides.length - 1 ? `
                    <div class="scroll-prompt animate-fade-in" style="margin-top: 32px; text-align: center; border-top: 1px solid var(--border-soft); padding-top: 24px;">
                        <p style="font-size: 15px; opacity: 0.7; margin-bottom: 12px; font-weight: 600;">Explore Your CKM Stage</p>
                        <button class="btn btn-primary" data-action="scrollToStaging" data-args="" style="width: 100%; justify-content: center; box-shadow: 0 4px 12px rgba(193, 14, 33, 0.2);">
                            Why It Matters to You ↓
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
                </div>
    `);
        });
    },

    showMyth(idx, moduleKey = 'analogy') {
        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang] || this.translations['en'];
        const module = t.modules[moduleKey];
        if (!module || !module.slides[idx]) return;

        const slide = module.slides[idx];
        const mythLabel = (module.ui && module.ui.mythLabel) || (t.modules.analogy.ui.mythLabel) || 'Myth Cracker';

        DOMUtils.safeSetHTML(this.modalBody, `
            <div style="padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 24px;">❓</div>
                <h3 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">${mythLabel}</h3>
                <p style="font-size: 19px; line-height: 1.6; color: var(--text-secondary);">${slide.myth}</p>
            </div>
    `);
        this.modalOverlay.classList.remove('hidden');
    },

    renderEatingPlateAnimation(mountId, slideIdx = 0) {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const direction = slideIdx > (this._prevEatingPlateIdx || 0) ? 'next' : 'prev';
        const isInitial = this._prevEatingPlateIdx === undefined;
        this._prevEatingPlateIdx = slideIdx;

        const lang = this.currentLanguage || 'en';
        const t = this.translations[lang].modules.eatingPlate;
        const slide = t.slides[slideIdx];

        this.slideTransition(mount, isInitial, direction, (slideClass) => {
            DOMUtils.safeSetHTML(mount, `
            <div class="module-fullwidth ${slideClass}">
                <div class="module-grid">
                    <div class="module-visual">
                        ${this.getEatingPlateSVGForSlide(slideIdx)}
                    </div>
                    <div class="module-text">
                        <div class="explorer-counter">Slide ${slideIdx + 1} of ${t.slides.length}</div>
                        <h3 class="explorer-title">${slide.title}</h3>
                        <p class="explorer-text">${slide.text}</p>

                        ${slide.details ? `
                            <div class="eating-details-container" style="margin-bottom: 32px;">
                                <button class="btn btn-secondary" data-action="toggleEatingDetails" data-args="${slideIdx}" style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-radius: 16px;">
                                    <span style="font-weight: 700;">🌟 Best Choices for CKM Health</span>
                                    <span>↓</span>
                                </button>
                                <div id="eating-details-${slideIdx}" class="hidden animate-slide-up" style="margin-top: 12px; padding: 24px; background: var(--bg-card); border-radius: 20px; box-shadow: var(--shadow-soft); border: 1px solid var(--border-soft);">
                                    <div style="display: flex; flex-direction: column; gap: 20px;">
                                        ${Object.entries(slide.details).map(([key, value]) => `
                                            <div>
                                                <div style="text-transform: capitalize; font-weight: 800; font-size: 13px; color: ${key === 'excellent' ? 'var(--system-green)' : key === 'limit' ? 'var(--system-red)' : 'var(--text-secondary)'}; margin-bottom: 4px; letter-spacing: 0.5px;">${key}</div>
                                                <div style="font-size: 15px; line-height: 1.4; color: var(--text-secondary);">${value}</div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>` : ''}

                        <div style="display: flex; gap: 12px; margin-bottom: 24px;">
                            <button class="btn btn-secondary" data-action="showMyth" data-args="${slideIdx}, 'eatingPlate'" style="min-height: 48px; padding: 0 20px; font-size: 14px;">
                                <span>❓</span> Myth Cracker
                            </button>
                        </div>

                        <div class="explorer-insight">
                            <h4 class="insight-label">Survival Tip</h4>
                            <p class="insight-text">${slide.lesson}</p>
                        </div>

                        <div class="explorer-navigation">
                            ${slideIdx > 0 ? `<button class="btn btn-secondary" data-action="renderEatingPlateAnimation" data-args="'${mountId}', ${slideIdx - 1}">← Previous</button>` : ''}
                            ${slideIdx < t.slides.length - 1 ?
                    `<button class="btn btn-primary" data-action="renderEatingPlateAnimation" data-args="'${mountId}', ${slideIdx + 1}">Next →</button>` :
                    `<button class="btn btn-primary" data-action="scrollToElement" data-args="'food-label-mount'">Continue to Labels ↓</button>`
                }
                        </div>
                    </div>
                </div>
            </div>
    `);
        });
    },

    renderCulturalFoodExplorer(mountId, activeIdx = 0) {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const lang = this.currentLanguage;
        const t = this.translations[lang].modules.traditionalFoods;
        const food = t.foods[activeIdx];
        const labels = t.labels;

        DOMUtils.safeSetHTML(mount, `
            <div class="cultural-explorer-container animate-fade-in" style="display: grid; grid-template-columns: 1fr 2fr; gap: 40px; padding: 20px 0;">
                <!-- Navigation List -->
                <div class="food-nav-list" style="border-right: 1px solid var(--border-soft); padding-right: 20px;">
                    <h4 style="font-size: 14px; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 20px; letter-spacing: 0.5px;">${t.title}</h4>
                    <div class="food-nav-items-wrapper">
                        ${t.foods.map((item, idx) => `
                            <div class="food-nav-item ${idx === activeIdx ? 'active' : ''}" 
                                 data-action="renderCulturalFoodExplorer" data-args="'${mountId}', ${idx}"
                                 style="padding: 14px 16px; border-radius: 12px; cursor: pointer; margin-bottom: 10px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 600; display: flex; align-items: center; justify-content: space-between; font-size: 15px;">
                                <span>${item.name.split(' (')[0]}</span>
                                <span style="font-size: 12px; opacity: 0.5;">${idx === activeIdx ? '→' : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Food Detail -->
                <div class="food-detail-panel animate-slide-up">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px;">
                        <div>
                            <h3 style="font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">${food.name}</h3>
                            <div class="status-badge" style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; background: ${this.getFoodStatusColor(food.status)}; color: white; box-shadow: 0 4px 12px ${this.getFoodStatusColor(food.status)}44;">
                                ${food.status}
                            </div>
                        </div>
                    </div>

                    <div class="food-truth-summary" style="padding: 24px; background: var(--bg-depth); border-radius: 18px; margin-bottom: 32px; border-left: 4px solid var(--text-tertiary);">
                        <strong style="display: block; margin-bottom: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6;">${labels.truth}</strong>
                        <p style="font-size: 17px; margin: 0; line-height: 1.6; font-weight: 500; color: var(--text-primary);">${food.summary}</p>
                    </div>

                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 16px; letter-spacing: 0.5px;">${labels.status}</div>
                    <div class="ckm-scorecard-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 40px;">
                        <div class="score-card" style="padding: 20px; border-radius: 18px; border: 1px solid var(--border-soft); text-align: center; transition: all 0.3s; background: var(--bg-card);">
                            <div style="font-size: 24px; margin-bottom: 8px;">🧱</div>
                            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 4px;">${labels.metabolic}</div>
                            <div style="font-weight: 800; font-size: 15px; color: ${this.getImpactColor(food.scorecard.metabolic)};">${food.scorecard.metabolic}</div>
                        </div>
                        <div class="score-card" style="padding: 20px; border-radius: 18px; border: 1px solid var(--border-soft); text-align: center; transition: all 0.3s; background: var(--bg-card);">
                            <div style="font-size: 24px; margin-bottom: 8px;">❤️</div>
                            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 4px;">${labels.cardio}</div>
                            <div style="font-weight: 800; font-size: 15px; color: ${this.getImpactColor(food.scorecard.cardio)};">${food.scorecard.cardio}</div>
                        </div>
                        <div class="score-card" style="padding: 20px; border-radius: 18px; border: 1px solid var(--border-soft); text-align: center; transition: all 0.3s; background: var(--bg-card);">
                            <div style="font-size: 24px; margin-bottom: 8px;">🌊</div>
                            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); margin-bottom: 4px;">${labels.kidney}</div>
                            <div style="font-weight: 800; font-size: 15px; color: ${this.getImpactColor(food.scorecard.kidney)};">${food.scorecard.kidney}</div>
                        </div>
                    </div>

                    <div class="details-split-grid" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px;">
                        <div>
                            <h4 style="font-size: 14px; font-weight: 800; margin-bottom: 16px; color: var(--accent-red); text-transform: uppercase; letter-spacing: 0.5px;">${labels.optimization}</h4>
                            <ul style="list-style: none; padding: 0;">
                                ${food.optimizations.map(opt => `
                                                <li style="font-size: 15px; margin-bottom: 12px; padding-left: 28px; position: relative; line-height: 1.4;">
                                                    <span style="position: absolute; left: 0; top: 0; color: var(--system-green); font-weight: bold; font-size: 18px;">✓</span> ${opt}
                                                </li>
                                            `).join('')}
                            </ul>
                        </div>
                        <div style="background: rgba(193,14,33,0.03); padding: 24px; border-radius: 20px; border-left: 6px solid var(--accent-red); align-self: start;">
                            <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; opacity: 0.5; letter-spacing: 0.5px;">${labels.message}</h4>
                            <p style="font-size: 16px; font-style: italic; margin: 0; line-height: 1.6; color: var(--text-secondary); font-weight: 500;">"${food.message}"</p>
                        </div>
                    </div>

                    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border-soft); font-size: 14px; color: var(--text-tertiary); display: flex; align-items: flex-start; gap: 12px; line-height: 1.4;">
                        <span style="font-size: 18px;">💰</span>
                        <div>
                            <strong style="color: var(--text-primary);">${labels.budget}:</strong> ${food.budget}
                        </div>
                    </div>
                </div>

                <style>
                    .food-nav-item.active { background: var(--accent-red); color: white; transform: translateX(8px); box-shadow: 0 4px 12px rgba(193, 14, 33, 0.2); }
                    .food-nav-item:not(.active):hover { background: var(--bg-depth); transform: translateX(4px); }
                    .score-card:hover { border-color: var(--accent-red)!important; transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05); }
                    @media(max-width: 768px) {
                        .cultural-explorer-container { grid-template-columns: 1fr!important; padding: 24px!important; }
                        .food-nav-list { border-right: none!important; border-bottom: 1px solid var(--border-soft); padding-bottom: 24px; padding-right: 0!important; }
                        .ckm-scorecard-grid { grid-template-columns: 1fr!important; }
                        .details-split-grid { grid-template-columns: 1fr!important; }
                    }
                </style>
            </div>
    `);
    },

    getFoodStatusColor(status) {
        const s = status.toLowerCase();
        if (s.includes('excellent')) return 'var(--system-green)';
        if (s.includes('limit') || s.includes('avoid')) return 'var(--system-red)';
        return 'var(--system-orange)';
    },

    getImpactColor(impact) {
        const i = impact.toLowerCase();
        if (i.includes('protective') || i.includes('excellent') || i.includes('gentle') || i.includes('supportive') || i.includes('stable') || i.includes('suave') || i.includes('apoio') || i.includes('estável')) return 'var(--system-green)';
        if (i.includes('damaging') || i.includes('high stress') || i.includes('rapid spike') || i.includes('danger') || i.includes('danos') || i.includes('estresse') || i.includes('pico')) return 'var(--system-red)';
        return 'var(--system-orange)';
    },

    toggleEatingDetails(idx) {
        const el = document.getElementById(`eating-details-${idx}`);
        if (el) el.classList.toggle('hidden');
    },

    getEatingPlateSVGForSlide(idx) {
        const veggie = 'var(--system-green)';
        const protein = 'var(--system-purple)';
        const carbs = 'var(--system-orange)';
        const danger = 'var(--system-red)';
        const blue = 'var(--system-blue)';

        const icons = {
            veggie: `<g>
                <rect x="-4" y="6" width="8" height="12" rx="2" fill="currentColor" />
                <circle cx="0" cy="-6" r="10" fill="currentColor" />
                <circle cx="-8" cy="2" r="8" fill="currentColor" />
                <circle cx="8" cy="2" r="8" fill="currentColor" />
            </g>`,
            protein: `<g>
                <path d="M-18 0 C-18 -12 18 -12 18 0 C18 12 -18 12 -18 0" fill="currentColor" />
                <path d="M-10 -4 L10 6 M-10 6 L10 -4 M0 -6 L0 6" stroke="var(--text-white)" stroke-width="1.5" stroke-linecap="round" opacity="0.3" />
            </g>`,
            carbs: `<g>
                <path d="M-18 2 A18 16 0 0 0 18 2 L-18 2" fill="var(--bg-card)" stroke="currentColor" stroke-width="2" />
                <path d="M-16 2 C-16 -12 16 -12 16 2" fill="currentColor" />
                <circle cx="-6" cy="-4" r="2" fill="var(--bg-card)" opacity="0.2" />
                <circle cx="6" cy="-2" r="1.5" fill="var(--bg-card)" opacity="0.2" />
            </g>`
        };

        // Base Plate Template
        const basePlate = `
    <defs >
    <filter id="plateShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
        <feOffset dx="0" dy="8" result="offsetblur" />
        <feComponentTransfer><feFuncA type="linear" slope="0.1" /></feComponentTransfer>
        <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
            </defs>
            <circle cx="300" cy="225" r="185" fill="var(--bg-component)" />
            <circle cx="300" cy="225" r="180" fill="var(--bg-card)" filter="url(#plateShadow)" />
            <circle cx="300" cy="225" r="150" fill="none" stroke="var(--stroke-subtle)" stroke-width="1" stroke-dasharray="4,4" />
`;

        let content = '';

        switch (idx) {
            case 0: // Master Intro-The Complete Health Plate Pattern
                content = `
                    <!-- Background Sectors -->
                    <path d="M300 225 L300 45 A180 180 0 0 0 120 225 Z" fill="${veggie}" opacity="0.15" />
                    <path d="M300 225 L120 225 A180 180 0 0 0 300 405 Z" fill="${veggie}" opacity="0.15" />
                    <path d="M300 225 L300 45 A180 180 0 0 1 480 225 Z" fill="${protein}" opacity="0.15" />
                    <path d="M300 225 L480 225 A180 180 0 0 1 300 405 Z" fill="${carbs}" opacity="0.15" />
                    
                    <!-- Section Dividers -->
                    <line x1="120" y1="225" x2="480" y2="225" stroke="var(--stroke-subtle)" stroke-width="2" stroke-dasharray="8,4" />
                    <line x1="300" y1="45" x2="300" y2="405" stroke="var(--stroke-subtle)" stroke-width="2" stroke-dasharray="8,4" />

                    <!-- Section Labels & Icons -->
                    <g transform="translate(220, 225)" style="color: ${veggie}; fill: currentColor;">
                        <g transform="scale(1.4) translate(0, -25)">${icons.veggie}</g>
                        <text y="25" text-anchor="middle" font-size="20" font-weight="900">50% VEGGIES</text>
                    </g>
                    <g transform="translate(385, 155)" style="color: ${protein}; fill: currentColor;">
                        <g transform="scale(1.1) translate(0, -20)">${icons.protein}</g>
                        <text y="20" text-anchor="middle" font-size="18" font-weight="900">25% PROTEIN</text>
                    </g>
                    <g transform="translate(385, 295)" style="color: ${carbs}; fill: currentColor;">
                        <g transform="scale(1.1) translate(0, -20)">${icons.carbs}</g>
                        <text y="25" text-anchor="middle" font-size="18" font-weight="900">25% CARBS</text>
                    </g>
                `;
                break;

            case 1: // Focus on Veggies
                content = `
                    <path d="M300 225 L300 45 A180 180 0 0 0 300 405 Z" fill="${veggie}" opacity="0.2" />
                    <g transform="translate(300, 225) scale(2.5)" style="color: ${veggie}; fill: currentColor;">
                        <g class="animate-pulse">
                            ${icons.veggie}
                        </g>
                    </g>
                    <text x="300" y="440" text-anchor="middle" font-size="22" font-weight="900" fill="${veggie}">HALF THE PLATE: THE FOUNDATION</text>
                `;
                break;

            case 2: // Focus on Protein
                content = `
                    <path d="M300 225 L480 225 A180 180 0 0 0 300 45 Z" fill="${protein}" opacity="0.2" />
                    <g transform="translate(300, 225) scale(2.5)" style="color: ${protein}; fill: currentColor;">
                        <g class="animate-pulse">
                            ${icons.protein}
                        </g>
                    </g>
                    <text x="300" y="440" text-anchor="middle" font-size="22" font-weight="900" fill="${protein}">ONE QUARTER: THE REPAIR CREW</text>
                `;
                break;

            case 3: // Focus on Carbs
                content = `
                    <path d="M300 225 L300 405 A180 180 0 0 0 480 225 Z" fill="${carbs}" opacity="0.2" />
                    <g transform="translate(300, 225) scale(2.5)" style="color: ${carbs}; fill: currentColor;">
                        <g class="animate-pulse">
                            ${icons.carbs}
                        </g>
                    </g>
                    <text x="300" y="440" text-anchor="middle" font-size="22" font-weight="900" fill="${carbs}">ONE QUARTER: THE ENERGY</text>
                `;
                break;

            case 4: // Drinks
                content = `
                    <g transform="translate(150, 225)">
                        <path d="M-20 40 L20 40 L30 -40 L-30 -40 Z" fill="${blue}" opacity="0.8" />
                        <text y="70" text-anchor="middle" font-weight="900" fill="${blue}">CHOOSE WATER</text>
                    </g>
                    <g transform="translate(450, 225)">
                        <rect x="-25" y="-40" width="50" height="80" rx="10" fill="${danger}" opacity="0.3" />
                        <line x1="-30" y1="0" x2="30" y2="0" stroke="${danger}" stroke-width="4" transform="rotate(45)" />
                        <text y="70" text-anchor="middle" font-weight="900" fill="${danger}">SKIP SODA</text>
                    </g>
                `;
                break;

            case 5: // Putting it all together
                content = `
                    <circle cx="300" cy="225" r="160" fill="var(--bg-card)" stroke="${veggie}" stroke-width="4" />
                    <path d="M300 225 L300 65 A160 160 0 0 0 300 385 Z" fill="${veggie}" opacity="0.3" />
                    <path d="M300 225 L460 225 A160 160 0 0 0 300 65 Z" fill="${protein}" opacity="0.3" />
                    <path d="M300 225 L300 385 A160 160 0 0 0 460 225 Z" fill="${carbs}" opacity="0.3" />
                    <text x="300" y="235" text-anchor="middle" font-size="24" font-weight="900" fill="var(--text-primary)">50/25/25 RULE</text>
                `;
                break;

            case 6: // Fruits vs Juice
                content = `
                    <g transform="translate(200, 225)">
                        <circle r="40" fill="var(--system-orange)" />
                        <text y="70" text-anchor="middle" font-weight="900" fill="var(--system-orange)">WHOLE FRUIT</text>
                    </g>
                    <g transform="translate(400, 225)">
                        <path d="M-15 30 L15 30 L20 -20 L-20 -20 Z" fill="var(--system-orange)" opacity="0.3" />
                        <line x1="-25" y1="-10" x2="25" y2="-10" stroke="${danger}" stroke-width="3" />
                        <text y="70" text-anchor="middle" font-weight="900" fill="${danger}">JUICE=SUGAR</text>
                    </g>
                `;
                break;

            case 7: // Healthy Oils
                content = `
                    <path d="M300 120 L320 200 L280 200 Z" fill="var(--system-yellow)" class="animate-pulse" />
                    <circle cx="300" cy="300" r="50" fill="none" stroke="var(--system-yellow)" stroke-width="2" stroke-dasharray="5,5" />
                    <text x="300" y="380" text-anchor="middle" font-weight="900" fill="var(--system-yellow)">MEASURE OILS</text>
                `;
                break;

            case 8: // Weekly Framework
                content = `
                    <g transform="translate(150, 150)">
                        ${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${i * 45}" y="0" width="35" height="35" rx="8" fill="${i < 5 ? veggie : 'var(--stroke-subtle)'}" />`).join('')}
                        <text x="140" y="80" text-anchor="middle" font-weight="900" fill="${veggie}">CONSISTENCY > PERFECTION</text>
                    </g>
                `;
                break;

            case 9: // Action Plan
                content = `
                    <path d="M100 350 Q300 350 500 150" fill="none" stroke="${veggie}" stroke-width="6" marker-end="url(#arrow-plate)" />
                    <defs><marker id="arrow-plate" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${veggie}" /></marker></defs>
                    <text x="300" y="400" text-anchor="middle" font-weight="900" fill="${veggie}">START SMALL TODAY</text>
                `;
                break;

            default: // Generic Healthy Plate for other steps
                content = `
                    <path d="M300 225 L300 45 A180 180 0 0 0 120 225 Z" fill="${veggie}" opacity="0.1" />
                    <path d="M300 225 L120 225 A180 180 0 0 0 300 405 Z" fill="${veggie}" opacity="0.1" />
                    <path d="M300 225 L300 45 A180 180 0 0 1 480 225 Z" fill="${protein}" opacity="0.1" />
                    <path d="M300 225 L480 225 A180 180 0 0 1 300 405 Z" fill="${carbs}" opacity="0.1" />
                    <text x="300" y="440" text-anchor="middle" font-size="18" font-weight="bold" fill="var(--text-secondary)" opacity="0.5">THE CKM HEALTHY PLATE</text>
                `;
        }

        return `
            <svg viewBox="0 0 600 480" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto; max-height: 400px;" role="img" aria-label="Healthy Eating Plate Diagram">
                <style>
                    @keyframes pulse {0%, 100% { transform: scale(1); opacity: 0.8; } 50% {transform: scale(1.1); opacity: 1; }}
                    .animate-pulse {
                        animation: pulse 3s infinite ease-in-out;
                        transform-origin: center;
                        transform-box: fill-box;
                    }
                    text {font-family: -apple-system, system-ui, sans-serif; letter-spacing: -0.5px;}
                </style>
                ${basePlate}
                ${content}
            </svg>
        `;
    },

    getAnalogySVGForSlide(idx) {
        const accent = 'var(--accent-red)';
        const softAccent = 'var(--accent-red-light)';
        const success = 'var(--system-green)';

        let dynamicContent = '';

        // Base House Outline
        const houseBase = `
            <path d="M100 350 L500 350 L500 150 L300 50 L100 150 Z" fill="none" stroke="var(--stroke-subtle)" stroke-width="2" />
            <path d="M80 160 L300 30 L520 160" fill="none" stroke="var(--stroke-subtle)" stroke-width="2" />
        `;

        switch (idx) {
            case 0: // Intro
                dynamicContent = `
                    <rect x="100" y="320" width="400" height="30" fill="${softAccent}" class="animate-pulse" />
                    <circle cx="200" cy="220" r="40" fill="${softAccent}" class="animate-pulse" />
                    <circle cx="400" cy="220" r="40" fill="${softAccent}" class="animate-pulse" />
                    <text x="300" y="200" text-anchor="middle" font-weight="bold" fill="${accent}" font-size="24">Your Home</text>
                `;
                break;
            case 1: // Foundation
                dynamicContent = `
                    <rect x="100" y="320" width="400" height="40" fill="var(--system-red)" opacity="0.1" />
                    <path d="M150 320 L160 350 M250 320 L240 340 M400 320 L410 360" stroke="${accent}" stroke-width="3" stroke-linecap="round" class="animate-wiggle" />
                    <text x="300" y="380" text-anchor="middle" font-weight="bold" fill="${accent}">Cracked Foundation</text>
                `;
                break;
            case 2: // Electrical
                dynamicContent = `
                    <path d="M150 180 Q200 150 250 180 T350 180" fill="none" stroke="${accent}" stroke-width="4" stroke-dasharray="10 5" class="animate-flow" />
                    <circle cx="210" cy="215" r="30" fill="none" stroke="${accent}" stroke-width="2" class="animate-pulse" />
                    <text x="210" y="270" text-anchor="middle" font-weight="bold" fill="${accent}">High Voltage</text>
                `;
                break;
            case 3: // Filtration
                dynamicContent = `
                    <rect x="350" y="180" width="80" height="100" rx="10" fill="var(--bg-card)" stroke="${accent}" stroke-width="2" />
                    <line x1="350" y1="210" x2="430" y2="210" stroke="${accent}" stroke-width="1" />
                    <line x1="350" y1="230" x2="430" y2="230" stroke="${accent}" stroke-width="1" />
                    <circle cx="390" cy="220" r="15" fill="${accent}" opacity="0.4" class="animate-pulse" />
                    <text x="390" y="310" text-anchor="middle" font-weight="bold" fill="${accent}">Clogged Filter</text>
                `;
                break;
            case 4: // Cascade
                dynamicContent = `
                    <g class="animate-shake">
                        <path d="M150 320 L160 350" stroke="${accent}" stroke-width="3" />
                        <path d="M150 180 Q200 150 250 180" fill="none" stroke="${accent}" stroke-width="4" />
                        <rect x="350" y="180" width="80" height="100" fill="${accent}" opacity="0.2" />
                        <circle cx="300" cy="210" r="100" fill="none" stroke="${accent}" stroke-width="2" stroke-dasharray="5 5" class="animate-spin-slow" />
                    </g>
                `;
                break;
            case 5: // Breaking Cycle
                dynamicContent = `
                    <g class="animate-bounce">
                        <rect x="100" y="320" width="400" height="30" fill="${success}" opacity="0.3" />
                        <circle cx="210" cy="215" r="30" fill="none" stroke="${success}" stroke-width="3" />
                        <rect x="350" y="180" width="80" height="100" fill="${success}" opacity="0.3" />
                        <text x="300" y="100" text-anchor="middle" font-weight="bold" fill="${success}" font-size="20">Repairs in Progress</text>
                    </g>
                `;
                break;
            case 6: // Small Repairs
                dynamicContent = `
                    <circle cx="100" cy="350" r="10" fill="${accent}" class="animate-pulse" />
                    <line x1="100" y1="350" x2="300" y2="250" stroke="${accent}" stroke-width="2" stroke-dasharray="5 5" />
                    <text x="300" y="240" text-anchor="middle" font-weight="bold" fill="${accent}">Fix Now, Save Later</text>
                    <path d="M100 320 H500" stroke="${accent}" stroke-width="1" />
                `;
                break;
            case 7: // Control Panel
                const s = this.analogyState || { foundation: false, electrical: false, filtration: false };
                dynamicContent = `
                    <rect x="100" y="320" width="400" height="30" fill="${s.foundation ? success : 'var(--system-red)'}" opacity="0.3" />
                    <path d="M150 180 Q200 150 250 180 T350 180" fill="none" stroke="${s.electrical ? success : 'var(--system-red)'}" stroke-width="4" stroke-dasharray="10 5" class="${s.electrical ? '' : 'animate-flow'}" />
                    <rect x="350" y="180" width="80" height="100" rx="10" fill="var(--bg-card)" stroke="${s.filtration ? success : 'var(--system-red)'}" stroke-width="2" />
                    ${s.foundation && s.electrical && s.filtration ? `<path d="M50 200 L150 300 L350 100" fill="none" stroke="${success}" stroke-width="20" stroke-linecap="round" opacity="0.2" class="animate-slide-up" />` : ''}
                `;
                break;
        }

        return `
            <svg viewBox="0 0 600 450" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: auto;" role="img" aria-label="House Analogy Diagram">
                <style>
                    @keyframes pulse-house {0%, 100% { opacity: 0.3; } 50% {opacity: 0.6; }}
                    @keyframes flow {to {stroke-dashoffset: -20; }}
                    @keyframes wiggle {0%, 100% { transform: rotate(-1deg); } 50% {transform: rotate(1deg); }}
                    @keyframes shake {0%, 100% { transform: translateX(0); } 25% {transform: translateX(-2px); } 75% {transform: translateX(2px); }}
                    .animate-pulse {animation: pulse-house 2s infinite;}
                    .animate-flow {animation: flow 1s linear infinite;}
                    .animate-wiggle {animation: wiggle 0.5s ease-in-out infinite; transform-origin: center;}
                    .animate-shake {animation: shake 0.2s linear infinite;}
                    .animate-spin-slow {animation: spin 10s linear infinite; transform-origin: center;}
                    @keyframes spin {from {transform: rotate(0deg); } to {transform: rotate(360deg); }}
                </style>
                ${houseBase}
                ${dynamicContent}
            </svg>
        `;
    },

    toggleClinicalNote(idx) {
        const el = document.getElementById(`note-${idx}`);
        if (el) {
            el.classList.toggle('hidden');
        }
    },

    updateAnalogyControl(system, value, mountId) {
        this.analogyState = this.analogyState || { foundation: false, electrical: false, filtration: false };
        this.analogyState[system] = value;
        this.renderAnalogyAnimation(mountId, 7);
    },

    toggleAnalogyControl(system, mountId) {
        this.analogyState = this.analogyState || { foundation: false, electrical: false, filtration: false };
        this.analogyState[system] = !this.analogyState[system];
        this.renderAnalogyAnimation(mountId, 7);
    },

    calculateAnalogyBonus() {
        const s = this.analogyState || { foundation: false, electrical: false, filtration: false };
        let bonus = 0;
        if (s.foundation) bonus += 3;
        if (s.electrical) bonus += 3;
        if (s.filtration) bonus += 2;
        if (s.foundation && s.electrical && s.filtration) bonus += 2; // Synergy bonus
        return bonus;
    },

    // Sidebar Chat Logic
    async resetProgress() {
        const t = this.translations[this.currentLanguage].ui;
        this.showConfirm(t.confirmTitle, t.resetConfirm, t.confirmAction, () => {
            // Clear internal state
            this.completedModules = [];
            this.quizAnswers = [];
            this.currentQuizStep = 0;

            // Clear persistence
            this.secureStorage.removeItem('ckm_progress');
            this.secureStorage.removeItem('ckm_stage');

            this.haptic([50, 100, 50]);

            // Re-initialize based on fresh state
            this.updateUIContent();
            this.navigateTo('home');

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    showConfirm(title, message, actionText, onConfirm) {
        DOMUtils.safeSetHTML(this.modalBody, `
    <div style="text-align: center; padding: 24px;">
                <h3 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">${title}</h3>
                <p style="font-size: 17px; opacity: 0.7; margin-bottom: 32px; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button class="btn btn-primary" id="confirm-yes" style="flex: 1; max-width: 160px; background: var(--accent-red); color: white; border: none;">${actionText}</button>
                    <button class="btn btn-text" id="confirm-no" style="flex: 1; max-width: 160px;">${this.translations[this.currentLanguage].ui.cancelAction}</button>
                </div>
            </div>
    `);
        this.modalOverlay.classList.remove('hidden');

        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');

        // Use one-time event listeners
        yesBtn.addEventListener('click', () => {
            onConfirm();
            this.modalOverlay.classList.add('hidden');
        }, { once: true });

        noBtn.addEventListener('click', () => {
            this.modalOverlay.classList.add('hidden');
        }, { once: true });
    },

    toggleChat(open) {
        const sidebar = document.getElementById('chat-sidebar');
        if (!sidebar) return;
        // Update selector to find button with data-action or onclick
        const chatItem = Array.from(this.navItems || []).find(i =>
            i.getAttribute('onclick')?.includes('toggleChat') ||
            i.getAttribute('data-action') === 'toggleChat'
        );
        const chatIcon = document.querySelector('.chat-toggle-icon');

        const shouldOpen = open !== undefined ? open : !sidebar.classList.contains('open');

        if (shouldOpen) {
            sidebar.classList.remove('hidden');
            sidebar.classList.remove('minimized');
            sidebar.setAttribute('aria-hidden', 'false');

            if (sidebar.dataset.prevWidth) sidebar.style.width = sidebar.dataset.prevWidth;
            else sidebar.style.removeProperty('width');
            if (sidebar.dataset.prevHeight) sidebar.style.height = sidebar.dataset.prevHeight;
            else sidebar.style.removeProperty('height');

            // Use setTimeout to ensure display:flex is applied before transition
            setTimeout(() => {
                sidebar.classList.add('open');
                // Focus input for accessibility
                const input = sidebar.querySelector('input');
                if (input) input.focus();
            }, 10);

            if (!this._chatOpenedBefore) {
                sidebar.classList.add('first-open');
                this._chatOpenedBefore = true;
            }

            if (chatItem) {
                chatItem.classList.add('active');
                chatItem.setAttribute('aria-expanded', 'true');
            }
            if (chatIcon) chatIcon.classList.add('active');

            this.renderChatHistory();

            // Trap focus in chat sidebar
            this.trapFocus(sidebar);
            return;
        }

        sidebar.classList.remove('open');
        sidebar.setAttribute('aria-hidden', 'true');

        // Reset minimized state when closing explicitly
        sidebar.classList.remove('minimized');
        if (sidebar.dataset.prevWidth) sidebar.style.width = sidebar.dataset.prevWidth;
        else sidebar.style.removeProperty('width');
        if (sidebar.dataset.prevHeight) sidebar.style.height = sidebar.dataset.prevHeight;
        else sidebar.style.removeProperty('height');

        if (chatItem) {
            chatItem.classList.remove('active');
            chatItem.setAttribute('aria-expanded', 'false');
        }
        if (chatIcon) chatIcon.classList.remove('active');

        // Cleanup focus trap
        if (this._focusTrapHandler) {
            if (typeof this._focusTrapHandler === 'function') {
                this._focusTrapHandler(); // New pattern: call cleanup function
            } else {
                sidebar.removeEventListener('keydown', this._focusTrapHandler); // Old pattern
            }
            this._focusTrapHandler = null;
        }

        setTimeout(() => {
            if (!sidebar.classList.contains('open')) {
                sidebar.classList.add('hidden');
            }
        }, 400); // Wait for transition
    },

    renderChatHistory() {
        const container = document.getElementById('chat-messages-sidebar');
        if (!container) return;

        // Clear existing except welcome if needed, but usually we rebuild
        DOMUtils.clearChildren(container);

        if (this.chatHistory.length === 0) {
            // Add initial welcome if empty
            this.appendChatMessage('assistant', this.translations[this.currentLanguage].chat.welcome, true);
        } else {
            this.chatHistory.forEach(msg => {
                this.appendChatMessage(msg.role, msg.content, false);
            });
        }

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    },

    appendChatMessage(role, text, persist = true, result = null) {
        if (persist) {
            this.chatHistory.push({ role, content: text });
        }
        this.renderSidebarChatSnippet(role, text, result, false);
    },

    minimizeChat() {
        const sidebar = document.getElementById('chat-sidebar');
        if (!sidebar) return;

        const isMinimized = sidebar.classList.contains('minimized');

        if (isMinimized) {
            // Restore
            sidebar.classList.remove('minimized');

            // Restore previous dimensions if they exist, or default
            if (sidebar.dataset.prevWidth) sidebar.style.width = sidebar.dataset.prevWidth;
            else sidebar.style.width = ''; // Reset to CSS default

            if (sidebar.dataset.prevHeight) sidebar.style.height = sidebar.dataset.prevHeight;
            else sidebar.style.height = ''; // Reset to CSS default

            // IMPORTANT: Clear top/left to allow CSS to position it or restore drag position if needed
            // Ideally, we reset to default docked position or last known drag? 
            // For now, let's clear inline top/left/right/bottom so it respects CSS normal state (docked right)
            // Unless we want to restore drag position?
            // The prompt says "static at the right lower hand corner" for minimized.
            // For restored, let's just let it be standard docked or whatever inline styles were there?
            // Actually, if we clear inline styles, it snaps back to default CSS (docked right).
            // If the user had dragged it, we lose that. 
            // To be safe and simple: Let's NOT clear inline top/left for Restore, 
            // because CSS !important in .minimized overrides them anyway.
            // When we remove .minimized, the inline styles (dragged pos) come back into effect.
            // But wait, the previous code SAVED width/height but not pos?
            // The previous code had `sidebar.dataset.prevWidth = sidebar.style.width; `

            // Refined Restore Logic:
            // Just removing the class should let the inline styles take effect again 
            // (since .minimized had !important overrides).

        } else {
            // Minimize
            sidebar.dataset.prevWidth = sidebar.style.width;
            sidebar.dataset.prevHeight = sidebar.style.height;

            sidebar.classList.add('minimized');

            // We don't need to manually set width/height/top/left here because 
            // the CSS .minimized class uses !important to force 
            // width: 60px, height: 60px, bottom: 24px, right: 24px, position: fixed.
        }
    },


    handleSidebarChatKey(e) {
        if (e.key === 'Enter') this.sendSidebarChatMessage();
    },

    async sendSidebarChatMessage() {
        const input = document.getElementById('chat-input-sidebar');
        const text = input.value.trim();
        if (!text) return;

        this.haptic(40);
        this.appendChatMessage('user', text, true);
        input.value = '';

        const container = document.getElementById('chat-messages-sidebar');
        const loadingId = 'loading-' + Date.now();
        container.insertAdjacentHTML('beforeend', `
    <div id="${loadingId}" class="message assistant typing-indicator">
                <span></span><span></span><span></span>
            </div>
    `);
        container.scrollTop = container.scrollHeight;

        try {
            const result = await this.chatbot.processQuery(text);

            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();

            this.appendChatMessage('assistant', result.response, true, result);
        } catch (error) {
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();
            this.appendChatMessage('assistant', "I'm sorry, I'm having trouble connecting right now.", true);
        }
    },

    renderSidebarChatSnippet(role, text, result = null, persist = true) {
        const container = document.getElementById('chat-messages-sidebar');
        if (!container) return;

        if (persist) {
            this.chatHistory.push({ role, content: text });
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role} `;

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = text; // ✅ Secure text insertion
        messageDiv.appendChild(messageText);

        if (role === 'assistant' && result) {
            // Confidence Bar
            if (result.confidence > 0) {
                const confidenceHtml = `
    <div class="confidence-indicator" style="margin-top: 12px; font-size: 11px; opacity: 0.8;">
                        <div style="width: 100%; height: 4px; background: var(--bg-depth); border-radius: 2px; overflow: hidden; margin-bottom: 4px;">
                            <div style="width: ${result.confidence}%; height: 100%; background: var(--accent-red); transition: width 1s ease-out;"></div>
                        </div>
                        <span>Confidence: ${Math.round(result.confidence)}%</span>
                    </div>
    `;
                messageDiv.insertAdjacentHTML('beforeend', confidenceHtml);
            }

            // Sources
            if (result.sources && result.sources.length > 0) {
                let sourcesHtml = `<div class="message-sources" style="margin-top: 12px; border-top: 1px solid var(--border-soft); padding-top: 8px;"> `;
                sourcesHtml += `<div style="font-size: 10px; font-weight: 800; text-transform: uppercase; opacity: 0.5; margin-bottom: 6px;"> Sources:</div> `;
                sourcesHtml += `<div style="display: flex; flex-wrap: wrap; gap: 6px;"> `;
                result.sources.forEach((source, idx) => {
                    sourcesHtml += `
    <button class="source-pill" data-action="showSourcePreview" data-args="'${source.id}'"
style="font-size: 11px; padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border-soft); background: var(--bg-card); cursor: pointer;">
    [${idx + 1}] ${source.metadata.moduleName}
                        </button>
    `;
                });
                sourcesHtml += `</div></div> `;
                messageDiv.insertAdjacentHTML('beforeend', sourcesHtml);
            }
        }

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    },

    showSourcePreview(sourceId) {
        const chunk = this.searchEngine.chunks.find(c => c.id === sourceId);
        if (!chunk) return;

        this.haptic(30);
        DOMUtils.safeSetHTML(this.modalBody, `
    <div style="padding: 12px;">
                <div class="card-tag">${chunk.metadata.category}</div>
                <h3 style="margin-bottom: 16px;">${chunk.metadata.moduleName}</h3>
                <div style="background: var(--bg-component); padding: 24px; border-radius: 16px; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    ${chunk.content}
                </div>
                <div style="margin-top: 24px;">
                <button class="btn btn-primary" style="width: 100%;" data-action="closeModal" data-args="">
                    ${this.currentLanguage === 'es' ? 'Entendido' : (this.currentLanguage === 'pt' ? 'Entendido' : 'Got it')}
                </button>
            </div>
            </div>
    `);
        this.modalOverlay.classList.remove('hidden');
    },

    // Modal Logic
    showOrganDetail(organ) {
        // Pulse Logic
        document.querySelectorAll('.anatomy-zone').forEach(el => el.classList.remove('active-pulse'));

        const targets = {
            'heart': ['kidneys', 'metabolism'],
            'kidneys': ['heart'],
            'metabolism': ['heart', 'kidneys'] // Metabolism is the foundation, affects all
        };

        const related = targets[organ] || [];
        related.forEach(t => {
            const el = document.querySelector(`[data-args="'${t}'"]`);
            if (el) el.classList.add('active-pulse');
        });

        const t = this.translations[this.currentLanguage].anatomy;
        const d = t.details[organ];

        this.previouslyFocused = document.activeElement;

        const modalContent = `
    <h2 id="modal-title"> ${d.title}</h2>
            
            <div class="modal-section">
                <h4>${t.labels.role}</h4>
                <p>${d.role}</p>
            </div>
            
            <div class="modal-section">
                <h4>${t.labels.problem}</h4>
                <p>${d.problem}</p>
            </div>
            
            <div class="modal-section">
                <h4>${t.labels.connection}</h4>
                <p>${d.connection}</p>
            </div>
`;

        DOMUtils.safeSetHTML(this.modalBody, modalContent);
        this.modalOverlay.classList.remove('hidden');
        this.modalOverlay.removeAttribute('aria-hidden');

        // Focus management
        const content = this.modalOverlay.querySelector('.modal-content');
        content.setAttribute('tabindex', '-1');
        content.focus();

        this.trapFocus(this.modalOverlay);
    },

    closeModal(e) {
        // Close if called programmatically (e is undefined) or if click is on overlay/close btn
        const shouldClose = !e || e.target.id === 'modal-overlay' || e.target.closest('.close-btn');

        if (shouldClose) {
            this.modalOverlay.classList.add('hidden');
            this.modalOverlay.setAttribute('aria-hidden', 'true');

            // Cleanup Focus Trap
            if (this._focusTrapHandler) {
                if (typeof this._focusTrapHandler === 'function') {
                    this._focusTrapHandler(); // New pattern
                } else {
                    this.modalOverlay.removeEventListener('keydown', this._focusTrapHandler); // Old pattern
                }
                this._focusTrapHandler = null;
            }

            // Restore Focus
            if (this.previouslyFocused) {
                this.previouslyFocused.focus();
                this.previouslyFocused = null;
            }
        }
    },

    trapFocus(container) {
        // Cleanup previous trap if any (though logic usually handles this per container)
        if (this._focusTrapHandler) {
            // In case we switch contexts without closing fully (rare)
            // container.removeEventListener('keydown', this._focusTrapHandler); // Can't easily remove from unknown previous
        }

        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e) => {
            const isTab = e.key === 'Tab' || e.keyCode === 9;
            const isEsc = e.key === 'Escape' || e.keyCode === 27;

            if (isEsc) {
                // Determine if we are in chat or modal
                if (container.id === 'chat-sidebar') this.toggleChat(false);
                else this.closeModal();
                return;
            }

            if (!isTab) return;

            // Robust Focus Trap: If focus isn't in container, force it to first element
            if (!container.contains(document.activeElement)) {
                firstElement.focus();
                e.preventDefault();
                return;
            }

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        };

        // Add 'focusin' listener to catch clicks outside or programmatic focus escapes
        const handleFocusIn = (e) => {
            if (!container.contains(e.target)) {
                e.stopPropagation();
                firstElement.focus();
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        document.addEventListener('focusin', handleFocusIn); // Catch external focus

        // Store cleanup for both listeners
        this._focusTrapHandler = () => {
            container.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('focusin', handleFocusIn);
        };
    },
    // Fix existing cleanup in closeModal and toggleChat to use the function modification
    // Note: Since I can only replace a contiguous block, I will just make trapFocus return the cleanup function pattern 
    // or store it as an object/function as before but handle the double listener.
    // Wait, the current code stores `this._focusTrapHandler = handleKeyDown`.
    // My new code assigns a wrapper function to `this._focusTrapHandler`.
    // I need to make sure closeModal calls it correctly.
    // Existing closeModal: 
    // if (this._focusTrapHandler) {
    //    this.modalOverlay.removeEventListener('keydown', this._focusTrapHandler);
    //    this._focusTrapHandler = null;
    // }
    // This assumes _focusTrapHandler IS the event listener. 
    // I should probably just stick to the keydown improvement for now to minimize risk of breaking cleanup.
    // Complex cleanup changes requires modifying closeModal too. 
    // I will stick to just the keydown improvement which is the main keyboard issue.


    currentQuizStep: 0,
    quizAnswers: [],

    async startQuiz() {
        this.currentQuizStep = 0;
        this.quizAnswers = [];

        // Render Quiz Shell first
        const t = this.translations[this.currentLanguage].staging;
        await this.transitionView(`
    <div class="stage-result-card animate-slide-up" style="max-width: 800px; margin: 0 auto; min-height: 500px; display: flex; flex-direction: column; justify-content: center;">
                <h2 style="text-align: center; margin-bottom: 32px;">${t.title}</h2>
                <div id="quiz-mount"></div>
                <div style="margin-top: 32px; display: flex; justify-content: center; gap: 8px;">
                     ${t.questions.map((_, i) => `<div class="quiz-dot" id="dot-${i}" style="width: 10px; height: 10px; background: var(--stroke-subtle); border-radius: 50%; transition: all 0.3s;"></div>`).join('')}
                </div>
            </div>
    `);
        this.renderQuizStep(true);
    },

    renderQuizStep(isInitial = false) {
        const mount = document.getElementById('quiz-mount');
        if (!mount) return;

        const t = this.translations[this.currentLanguage].staging;
        const step = t.questions[this.currentQuizStep];

        // Update dots
        document.querySelectorAll('.quiz-dot').forEach((d, i) => {
            d.style.background = i === this.currentQuizStep ? 'var(--accent-red)' : (i < this.currentQuizStep ? 'var(--system-green)' : 'var(--stroke-subtle)');
            d.style.transform = i === this.currentQuizStep ? 'scale(1.3)' : 'scale(1)';
        });

        this.slideTransition(mount, isInitial, 'next', (slideClass) => {
            DOMUtils.safeSetHTML(mount, `
    <div class="quiz-question-container ${slideClass}">
        <div class="quiz-question">
            <div class="stage-badge" style="margin: 0 auto 24px;">${t.step} ${this.currentQuizStep + 1} ${t.of} ${t.questions.length}</div>
            <p class="stage-description" style="font-size: 24px; font-weight: 700;">${step.q}</p>
            <div class="quiz-options" style="display: grid; gap: 16px; margin-top: 32px;">
                ${step.options.map((opt, i) => `
                                <button class="option-btn" data-action="handleQuizAnswer" data-args="${i}" style="text-align: left; padding: 20px; font-size: 18px;">
                                    ${opt}
                                </button>
                            `).join('')}
            </div>
        </div>
                </div>
    `);
        });
    },

    handleQuizAnswer(index) {
        this.haptic(40);
        this.quizAnswers.push(index);
        this.currentQuizStep++;
        const t = this.translations[this.currentLanguage].staging;
        if (this.currentQuizStep < t.questions.length) {
            this.renderQuizStep();
        } else {
            // Slight delay for UX
            setTimeout(() => this.showQuizResult(), 300);
        }
    },

    async showQuizResult() {
        const t = this.translations[this.currentLanguage].staging;
        const answers = this.quizAnswers;

        // answers indices: 0:heart, 1:kidney, 2:a1c, 3:bp, 4:activity, 5:sodium, 6:smoker

        // Determine Stage
        let stage = 0;
        if (answers[0] === 1) stage = 4;
        else if (answers[1] === 1) stage = 3;
        else if (answers[2] === 1 || answers[3] === 1) stage = 2;
        else stage = 1;

        await this.secureStorage.setItem('ckm_stage', stage);
        this.haptic(70);

        // Build Personal Action Plan
        const clinicalActions = [];
        const lifestyleActions = [];
        const p = t.plan;

        // Clinical Logic
        if (stage === 4) clinicalActions.push(p.clinicalActions.stage4);
        if (stage >= 2) clinicalActions.push(p.clinicalActions.stage2plus);
        if (answers[1] === 1) clinicalActions.push(p.clinicalActions.kidney);
        if (answers[3] === 1 || answers[3] === 2) clinicalActions.push(p.clinicalActions.bp);

        // Lifestyle Logic
        if (answers[4] === 0) lifestyleActions.push(p.lifestyleActions.activityLow);
        if (answers[4] === 1) lifestyleActions.push(p.lifestyleActions.activityMid);

        if (answers[5] === 0 || answers[5] === 1) lifestyleActions.push(p.lifestyleActions.diet);

        if (answers[6] === 0) lifestyleActions.push(p.lifestyleActions.tobacco);

        this.transitionView(`
    <div class="stage-result-card animate-slide-up">
                <div class="result-header">
                    <div class="stage-badge" style="background: var(--accent-red); color: white;">ESTIMATED STAGE ${stage}</div>
                    <h2 style="font-size: 32px; font-weight: 800;">${p.title}</h2>
                    <p style="opacity: 0.7; margin-top: 12px;">${t.descriptions[stage]}</p>
                </div>

                <div class="roadmap-grid">
                    <div class="soft-card" style="border-left: 4px solid var(--accent-red); padding: 24px;">
                        <h4 style="margin-bottom: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                            <span>🏥</span> ${p.clinicalTitle}
                        </h4>
                        <ul style="list-style: none; padding: 0;">
                            ${clinicalActions.map(act => `<li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
                                <span style="position: absolute; left: 0; color: var(--accent-red);">•</span> ${act}
                            </li>`).join('')}
                        </ul>
                    </div>
                    <div class="soft-card" style="border-left: 4px solid var(--system-green); padding: 24px;">
                        <h4 style="margin-bottom: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px;">
                            <span>🥗</span> ${p.lifestyleTitle}
                        </h4>
                        <ul style="list-style: none; padding: 0;">
                            ${lifestyleActions.length > 0 ? lifestyleActions.map(act => `<li style="margin-bottom: 12px; padding-left: 20px; position: relative;">
                                <span style="position: absolute; left: 0; color: var(--system-green);">•</span> ${act}
                            </li>`).join('') : `<li style="opacity: 0.6;">${p.lifestyleActions.excellent}</li>`}
                        </ul>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn btn-primary" data-action="closeQuizAndGoBack" data-args="">${t.resultBtn}</button>
                </div>
            </div>
    `);
    },

    renderPassport(stage) {
        const t = this.translations[this.currentLanguage];
        const date = new Date().toLocaleDateString();

        // Count meds
        const medCount = this.myMedications.length;

        const content = `
            <div class="passport-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div class="passport-card animate-slide-up" style="background: white; border-radius: 20px; width: 100%; max-width: 400px; overflow: hidden; color: black;">
                    <div style="background: var(--accent-red); color: white; padding: 24px; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800;">EMPOWER-CKM PASSPORT</h2>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Patient Health Snapshot • ${date}</div>
                    </div>
                    
                    <div style="padding: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 16px;">
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700;">Stage Status</div>
                                <div style="font-size: 28px; font-weight: 900; color: var(--accent-red);">STAGE ${stage}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700;">Medications</div>
                                <div style="font-size: 28px; font-weight: 900;">${medCount}</div>
                            </div>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700; margin-bottom: 8px;">Clinical Priorities</div>
                            <ul style="padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.5;">
                                ${stage === 0 ? '<li>Maintain excellent preventative habits</li><li>Screen annually</li>' :
                stage >= 3 ? '<li>Strict BP & Lipid Control</li><li>Organ Protection (SGLT2/MRA)</li>' :
                    '<li>Lifestyle Optimization</li><li>Metabolic Screening</li>'
            }
                            </ul>
                        </div>

                        <div style="background: #f5f5f7; padding: 16px; border-radius: 12px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #666;">Show this screen to your doctor to start a conversation about your CKM health goals.</p>
                        </div>
                    </div>

                    <button class="btn" data-action="closePassport" style="width: 100%; padding: 20px; background: #eee; border: none; font-weight: 700; cursor: pointer;">Close</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', content);
    },

    closePassport() {
        const modal = document.querySelector('.passport-modal');
        if (modal) modal.remove();
    },

    async closeQuizAndGoBack() {
        // Mark module 6 complete
        const id = 6;
        if (!this.completedModules.includes(id)) {
            this.completedModules.push(id);
            await this.secureStorage.setItem('ckm_progress', this.completedModules);
            this.celebrate();
        }

        // Reset quiz state for next time
        this.currentQuizStep = 0;
        this.quizAnswers = [];

        // Navigate back and update progress
        this.updateUIContent();
        this.navigateTo('education');
    },

    getHouseAnalogySVG() {
        const t = this.translations[this.currentLanguage].anatomy;
        const color = 'var(--accent-red)';
        const accentSoft = 'var(--accent-red-light)';

        return `
    <svg viewBox="0 0 600 420" xmlns="http://www.w3.org/2000/svg" class="interactive-svg-container" style="width: 100%; height: auto;" aria-label="Interactive Anatomy Diagram">
                <style>
                    .anatomy-zone { cursor: pointer; }
                    .anatomy-zone:hover .anatomy-zone-bg { fill: ${accentSoft}; stroke: ${color}; stroke-width: 3; }
                    .anatomy-zone:hover text { fill: ${color}; }
                    .anatomy-zone:hover .anatomy-icon { 
                        transform: scale(1.1); 
                        transform-origin: center; 
                        transform-box: fill-box; 
                        filter: drop-shadow(0 4px 8px var(--accent-red)); 
                    }
                    .anatomy-zone-bg { fill: var(--bg-card); stroke: var(--stroke-subtle); stroke-width: 1.5; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                    .anatomy-icon { fill: ${color}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                    .house-outline { fill: none; stroke: var(--border-soft); stroke-width: 2; }
                    .interconnect { stroke: ${color}; stroke-width: 2; stroke-dasharray: 8,4; opacity: 0.4; pointer-events: none; }
                    
                    @media (prefers-reduced-motion: no-preference) {
                        @keyframes pulse-heart-anatomy {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.08); }
                        }
                        @keyframes pulse-metabolism-anatomy {
                            0%, 100% { opacity: 0.8; }
                            50% { opacity: 1; filter: drop-shadow(0 0 4px ${color}); }
                        }
                        .anatomy-heart-icon { animation: pulse-heart-anatomy 1.2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
                        .anatomy-metab-icon { animation: pulse-metabolism-anatomy 2s ease-in-out infinite; }
                    }
                </style>

                <!--House Shell-->
                <path d="M100 350 L500 350 L500 150 L300 50 L100 150 Z" class="house-outline" />
                <path d="M80 160 L300 30 L520 160" class="house-outline" />

                <!--Metabolism Zone-->
                <g class="anatomy-zone" data-action="showOrganDetail" data-args="'metabolism'" data-tooltip="metabolism">
                    <rect x="350" y="70" width="100" height="60" rx="4" class="anatomy-zone-bg" />
                    <path d="M390 80 L410 80 L400 100 L410 100 L390 125 L400 100 L390 100 Z" class="anatomy-icon anatomy-metab-icon" />
                    <text x="400" y="145" font-family="inherit" font-size="12" font-weight="bold" fill="var(--text-tertiary)" text-anchor="middle">${t.organs.metabolism}</text>
                </g>

                <!--Heart Zone-->
                <g class="anatomy-zone" data-action="showOrganDetail" data-args="'heart'" data-tooltip="heart">
                    <rect x="150" y="180" width="120" height="80" rx="4" class="anatomy-zone-bg" />
                    <path d="M210 200 C200 185, 175 195, 210 230 C245 195, 220 185, 210 200" class="anatomy-icon anatomy-heart-icon" />
                    <path d="M160 195 L180 195 M160 215 L180 215 M160 235 L180 235" stroke="var(--text-tertiary)" stroke-width="2" />
                    <text x="210" y="275" font-family="inherit" font-size="12" font-weight="bold" fill="var(--text-tertiary)" text-anchor="middle">${t.organs.heart}</text>
                </g>

                <!--Kidneys Zone-->
                <g class="anatomy-zone" data-action="showOrganDetail" data-args="'kidneys'" data-tooltip="kidneys">
                    <rect x="330" y="240" width="120" height="80" rx="4" class="anatomy-zone-bg" />
                    <path d="M390 255 Q405 275 405 290 A15 15 0 0 1 375 290 Q375 275 390 255 Z" class="anatomy-icon" />
                    <path d="M420 250 L420 310 M340 310 L440 310" stroke="var(--text-tertiary)" stroke-width="2" fill="none" />
                    <text x="390" y="335" font-family="inherit" font-size="12" font-weight="bold" fill="var(--text-tertiary)" text-anchor="middle">${t.organs.kidneys}</text>
                </g>

                <!--Interconnects -->
                <path d="M400 130 L400 240" class="interconnect" />
                <path d="M270 220 L330 280" class="interconnect" />
            </svg>
    `;
    },

    showTooltip(e, type) {
        const tooltip = document.getElementById('svg-tooltip');
        if (!tooltip) return;

        const t = this.translations[this.currentLanguage].anatomy.details[type];
        DOMUtils.safeSetHTML(tooltip, `<strong > ${t.title}</strong> <br>${t.role}`);
        tooltip.classList.remove('hidden');

        const target = e?.target?.closest?.('.anatomy-zone') || e?.target;
        if (!target || !target.getBoundingClientRect) return;
        const rect = target.getBoundingClientRect();
        const container = target.closest('.interactive-container');
        const containerRect = container ? container.getBoundingClientRect() : { left: 0, top: 0 };

        tooltip.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - containerRect.top - 10) + 'px';
    },

    hideTooltip() {
        const tooltip = document.getElementById('svg-tooltip');
        if (tooltip) tooltip.classList.add('hidden');
    },

    initChatInteraction() {
        const sidebar = document.getElementById('chat-sidebar');
        const header = sidebar.querySelector('.chat-sidebar-header');
        const resizer = sidebar.querySelector('.chat-resizer');

        if (!sidebar || !header || !resizer) return;

        // Clean up previous listeners
        if (this._chatCleanup) {
            this._chatCleanup();
        }

        let isDragging = false;
        let isResizing = false;

        let startX, startY;
        let startLeft, startTop;
        let startWidth, startHeight;
        let rafId = null;

        const getRect = () => sidebar.getBoundingClientRect();

        const onMouseDown = (e, mode) => {
            if (e.target.tagName === 'BUTTON') return;
            e.preventDefault();

            sidebar.classList.add('no-transition');

            startX = e.clientX;
            startY = e.clientY;

            const rect = getRect();
            startLeft = rect.left;
            startTop = rect.top;
            startWidth = rect.width;
            startHeight = rect.height;

            if (mode === 'drag') isDragging = true;
            if (mode === 'resize') isResizing = true;
        };

        const onMouseMove = (e) => {
            if (!isDragging && !isResizing) return;
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (isDragging) {
                    let newLeft = startLeft + deltaX;
                    let newTop = startTop + deltaY;

                    // Bounds Checking (Keep on screen)
                    newLeft = Math.max(0, Math.min(window.innerWidth - startWidth, newLeft));
                    newTop = Math.max(0, Math.min(window.innerHeight - startHeight, newTop));

                    sidebar.style.left = `${newLeft}px`;
                    sidebar.style.top = `${newTop}px`;
                    sidebar.style.right = 'auto'; // Detach from right
                    sidebar.style.bottom = 'auto';
                }

                if (isResizing) {
                    // Resizer is at TOP-LEFT.
                    // Dragging LEFT (negative delta) -> Width Increases.
                    // Dragging UP (negative delta) -> Height Increases.

                    // Check if floating (detached from right edge)
                    // If style.right is 'auto', it's floating/dragged.
                    // If style.right is not 'auto' (empty or set), it's likely docked (CSS default).
                    const isFloating = sidebar.style.right === 'auto';

                    // --- Width Logic ---
                    // Calculate desired width based on drag
                    let newWidth = startWidth - deltaX;
                    // Constraints: Min 300px, Max 90vw or 850px
                    const maxWidth = Math.min(window.innerWidth - 20, 850);
                    newWidth = Math.max(300, Math.min(maxWidth, newWidth));

                    sidebar.style.width = `${newWidth}px`;

                    if (isFloating) {
                        // If floating, increasing width must expand leftward by moving 'left' coordinate.
                        // Calculate effective change to keep right edge stable relative to box?
                        // No, handle is on LEFT. Mouse tracks Left Edge.
                        // So Left Edge should follow mouse (clamped by width).
                        // effectiveDeltaX = Change in width * -1.
                        const effectiveDeltaX = startWidth - newWidth;
                        sidebar.style.left = `${startLeft + effectiveDeltaX}px`;
                    }

                    // --- Height Logic ---
                    let newHeight = startHeight - deltaY;
                    // Constraints: Min 300px, Max Window Height
                    const maxHeight = window.innerHeight - 20;
                    newHeight = Math.max(300, Math.min(maxHeight, newHeight));

                    sidebar.style.height = `${newHeight}px`;

                    // Handle is at TOP. Mouse tracks Top Edge.
                    // Top coordinate must move.
                    const effectiveDeltaY = startHeight - newHeight;
                    sidebar.style.top = `${startTop + effectiveDeltaY}px`;
                }

                rafId = null;
            });
        };

        const onMouseUp = () => {
            if (isDragging || isResizing) {
                isDragging = false;
                isResizing = false;
                sidebar.classList.remove('no-transition');
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }
        };

        // Responsiveness: Ensure sidebar stays on screen if window resizes
        const onWindowResize = () => {
            const rect = getRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // Clamp Width/Height if window got smaller
            if (rect.width > winW) {
                sidebar.style.width = `${winW - 20}px`;
            }
            if (rect.height > winH) {
                sidebar.style.height = `${winH - 20}px`;
                sidebar.style.top = '10px';
            }

            // Clamp Position (Push back onto screen)
            if (sidebar.style.right === 'auto') {
                const currentRect = getRect(); // Re-measure
                if (currentRect.right > winW) {
                    sidebar.style.left = `${winW - currentRect.width - 10}px`;
                }
                if (currentRect.left < 0) {
                    sidebar.style.left = '10px';
                }
            }

            // Re-measure vertical
            const currentRect = getRect();
            if (currentRect.bottom > winH) {
                // Push up
                sidebar.style.top = `${Math.max(0, winH - currentRect.height)}px`;
            }
        };

        const dragStart = (e) => onMouseDown(e, 'drag');
        const resizeStart = (e) => onMouseDown(e, 'resize');

        header.addEventListener('mousedown', dragStart);
        resizer.addEventListener('mousedown', resizeStart);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        window.addEventListener('resize', onWindowResize);

        const onSidebarClick = (e) => {
            if (sidebar.classList.contains('minimized')) {
                // Prevent interfering with other interactions if any
                this.minimizeChat();
            }
        };
        sidebar.addEventListener('click', onSidebarClick);

        this._chatCleanup = () => {
            header.removeEventListener('mousedown', dragStart);
            resizer.removeEventListener('mousedown', resizeStart);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('resize', onWindowResize);
            sidebar.removeEventListener('click', onSidebarClick);
        };
    },

    snapToCorner(el) {
        const threshold = 150;
        const rect = el.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Determine snap targets
        const snapX = rect.left < (winW - rect.right) ? 'left' : 'right';
        const snapY = rect.top < (winH - rect.bottom) ? 'top' : 'bottom';

        el.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';

        if (snapX === 'left') {
            el.style.left = '32px';
            el.style.right = 'auto';
        } else {
            el.style.left = (winW - rect.width - 32) + 'px';
        }

        if (snapY === 'top') {
            el.style.top = '100px'; // Avoid header
        } else {
            el.style.top = (winH - rect.height - 32) + 'px';
        }

        setTimeout(() => { el.style.transition = ''; }, 400);
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
