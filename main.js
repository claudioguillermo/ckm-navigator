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
                version: '8',
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

        // Initialize Controllers (Phase 3 modernization)
        this.chatController = new ChatController(this);
        this.quizController = new QuizController(this);
        this.medicationController = new MedicationController(this);
        this.analogyController = new AnalogyController(this);
        this.movementController = new MovementController(this);
        this.foodController = new FoodController(this);

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
        await this.initTheme();

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
                    version: '8',
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
            // Always cleanup the specific loader for this request
            this.hideLoadingIndicator(loader);
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

        if (this.chatbot) {
            this.chatbot.setLanguage(lang);
            // Re-index content for the new language context
            const chunks = extractModuleKnowledge(this.translations);
            this.searchEngine = new HybridSearchEngine(chunks);
            this.chatbot.searchEngine = this.searchEngine;
        }
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
    async initTheme() {
        const storedTheme = await this.secureStorage.getItem('ckm_theme', null);

        // If user has a stored preference, use it; otherwise follow system preference
        if (storedTheme) {
            this.applyTheme(storedTheme);
        } else {
            // No stored preference - follow system
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        }

        // Listen for system preference changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
            // Only auto-follow if user hasn't set an explicit preference
            const saved = await this.secureStorage.getItem('ckm_theme', null);
            if (!saved) {
                this.applyTheme(e.matches ? 'dark' : 'light', false);
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

    applyTheme(theme, persist = true) {
        document.documentElement.setAttribute('data-theme', theme);

        // Persist to SecureStorage (fire-and-forget to keep UI responsive)
        if (persist) {
            this.secureStorage.setItem('ckm_theme', theme).catch(err =>
                console.error('Failed to persist theme:', err)
            );
        }

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

    // ========================================
    // MOVEMENT METHODS (Delegated to MovementController)
    // ========================================
    renderMovementExplorer(activeIdx = 0, level = null, barrier = null) {
        return this.movementController.renderMovementExplorer(activeIdx, level, barrier);
    },

    getMovementVisual(idx) {
        return this.movementController.getMovementVisual(idx);
    },

    generateTailoredPlan(quiz) {
        return this.movementController.generateTailoredPlan(quiz);
    },

    // ========================================
    // FOOD METHODS (Delegated to FoodController)
    // ========================================
    renderFoodLabel(activeIdx = 0, activeHotspot = null) {
        return this.foodController.renderFoodLabel(activeIdx, activeHotspot);
    },

    getFoodLabelSVGForSlide(idx, activeHotspot) {
        return this.foodController.getFoodLabelSVGForSlide(idx, activeHotspot);
    },

    renderEatingPlateAnimation(mountId, slideIdx = 0) {
        return this.foodController.renderEatingPlateAnimation(mountId, slideIdx);
    },

    renderCulturalFoodExplorer(mountId, activeIdx = 0) {
        return this.foodController.renderCulturalFoodExplorer(mountId, activeIdx);
    },

    getFoodStatusColor(status) {
        return this.foodController.getFoodStatusColor(status);
    },

    getImpactColor(impact) {
        return this.foodController.getImpactColor(impact);
    },

    toggleEatingDetails(idx) {
        return this.foodController.toggleEatingDetails(idx);
    },

    getEatingPlateSVGForSlide(idx) {
        return this.foodController.getEatingPlateSVGForSlide(idx);
    },


toggleClinicalNote(idx) {
    return this.analogyController.toggleClinicalNote(idx);
},

updateAnalogyControl(system, value, mountId) {
    return this.analogyController.updateAnalogyControl(system, value, mountId);
},

toggleAnalogyControl(system, mountId) {
    return this.analogyController.toggleAnalogyControl(system, mountId);
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
    < div style = "text-align: center; padding: 24px;" >
                <h3 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">${title}</h3>
                <p style="font-size: 17px; opacity: 0.7; margin-bottom: 32px; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 16px; justify-content: center;">
                    <button class="btn btn-primary" id="confirm-yes" style="flex: 1; max-width: 160px; background: var(--accent-red); color: white; border: none;">${actionText}</button>
                    <button class="btn btn-text" id="confirm-no" style="flex: 1; max-width: 160px;">${this.translations[this.currentLanguage].ui.cancelAction}</button>
                </div>
            </div >
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

// ========================================
// CHAT METHODS (Delegated to ChatController)
// ========================================
toggleChat(open) {
    return this.chatController.toggleChat(open);
},

renderChatHistory() {
    return this.chatController.renderChatHistory();
},



appendChatMessage(role, text, persist = true, result = null) {
    return this.chatController.appendChatMessage(role, text, persist, result);
},



minimizeChat() {
    return this.chatController.minimizeChat();
},



handleSidebarChatKey(e) {
    if (e.key === 'Enter') this.sendSidebarChatMessage();
},

    async sendSidebarChatMessage() {
    return await this.chatController.sendSidebarChatMessage();
},



renderSidebarChatSnippet(role, text, result = null, persist = true) {
    return this.chatController.renderSidebarChatSnippet(role, text, result, persist);
},



showSourcePreview(sourceId) {
    return this.chatController.showSourcePreview(sourceId);
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
        const el = document.querySelector(`[data - args="'${t}'"]`);
        if (el) el.classList.add('active-pulse');
    });

    const t = this.translations[this.currentLanguage].anatomy;
    const d = t.details[organ];

    this.previouslyFocused = document.activeElement;

    const modalContent = `
    < h2 id = "modal-title" > ${ d.title }</h2 >
            
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
                this._focusTrapHandler();
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

        // ========================================
        // QUIZ METHODS (Delegated to QuizController)
        // ========================================
        async startQuiz() {
    return await this.quizController.startQuiz();
},



renderQuizStep(isInitial = false) {
    return this.quizController.renderQuizStep(isInitial);
},



handleQuizAnswer(index) {
    return this.quizController.handleQuizAnswer(index);
},



    async showQuizResult() {
    return await this.quizController.showQuizResult();
},



renderPassport(stage) {
    return this.quizController.renderPassport(stage);
},



closePassport() {
    return this.quizController.closePassport();
},



    async closeQuizAndGoBack() {
    return await this.quizController.closeQuizAndGoBack();
},





showTooltip(e, type) {
    const tooltip = document.getElementById('svg-tooltip');
    if (!tooltip) return;

    const t = this.translations[this.currentLanguage].anatomy.details[type];
    DOMUtils.safeSetHTML(tooltip, `< strong > ${ t.title }</strong > <br>${t.role}`);
    tooltip.classList.remove('hidden');

    const target = e?.target?.closest?.('.anatomy-zone') || e?.target;
    if (!target || !target.getBoundingClientRect) return;
    const rect = target.getBoundingClientRect();
    const container = target.closest('.interactive-container');
    const containerRect = container ? container.getBoundingClientRect() : {left: 0, top: 0 };

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

    setTimeout(() => {el.style.transition = ''; }, 400);
}
};

document.addEventListener('DOMContentLoaded', () => app.init());
