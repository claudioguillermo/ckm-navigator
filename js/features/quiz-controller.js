/**
 * QuizController - Manages the CKM staging quiz and passport feature
 * Extracted from main.js for better maintainability
 */
class QuizController {
    constructor(app) {
        this.app = app;
        // Use app's quiz state for backward compatibility
        if (typeof this.app.currentQuizStep === 'undefined') {
            this.app.currentQuizStep = 0;
        }
        if (!this.app.quizAnswers) {
            this.app.quizAnswers = [];
        }
    }

    /**
     * Start the CKM staging quiz
     */
    async startQuiz() {
        this.app.currentQuizStep = 0;
        this.app.quizAnswers = [];

        const t = this.app.translations[this.app.currentLanguage].staging;
        await this.app.transitionView(`
            <div class="stage-result-card animate-slide-up" style="max-width: 800px; margin: 0 auto; min-height: 500px; display: flex; flex-direction: column; justify-content: center;">
                <h2 style="text-align: center; margin-bottom: 32px;">${t.title}</h2>
                <div id="quiz-mount"></div>
                <div style="margin-top: 32px; display: flex; justify-content: center; gap: 8px;">
                     ${t.questions.map((_, i) => `<div class="quiz-dot" id="dot-${i}" style="width: 10px; height: 10px; background: var(--stroke-subtle); border-radius: 50%; transition: all 0.3s;"></div>`).join('')}
                </div>
            </div>
        `);
        this.renderQuizStep(true);
    }

    /**
     * Render current quiz step
     */
    renderQuizStep(isInitial = false) {
        const mount = document.getElementById('quiz-mount');
        if (!mount) return;

        const t = this.app.translations[this.app.currentLanguage].staging;
        const step = t.questions[this.app.currentQuizStep];

        // Update dots
        document.querySelectorAll('.quiz-dot').forEach((d, i) => {
            d.style.background = i === this.app.currentQuizStep ? 'var(--accent-red)' : (i < this.app.currentQuizStep ? 'var(--system-green)' : 'var(--stroke-subtle)');
            d.style.transform = i === this.app.currentQuizStep ? 'scale(1.3)' : 'scale(1)';
        });

        this.app.slideTransition(mount, isInitial, 'next', (slideClass) => {
            DOMUtils.safeSetHTML(mount, `
                <div class="quiz-question-container ${slideClass}">
                    <div class="quiz-question">
                        <div class="stage-badge" style="margin: 0 auto 24px;">${t.step} ${this.app.currentQuizStep + 1} ${t.of} ${t.questions.length}</div>
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
    }

    /**
     * Handle quiz answer selection
     */
    handleQuizAnswer(index) {
        this.app.haptic(40);
        this.app.quizAnswers.push(index);
        this.app.currentQuizStep++;

        const t = this.app.translations[this.app.currentLanguage].staging;
        if (this.app.currentQuizStep < t.questions.length) {
            this.renderQuizStep();
        } else {
            setTimeout(() => this.showQuizResult(), 300);
        }
    }

    /**
     * Calculate and display quiz results
     */
    async showQuizResult() {
        const t = this.app.translations[this.app.currentLanguage].staging;
        const answers = this.app.quizAnswers;

        // Determine Stage
        let stage = 0;
        if (answers[0] === 1) stage = 4;
        else if (answers[1] === 1) stage = 3;
        else if (answers[2] === 1 || answers[3] === 1) stage = 2;
        else stage = 1;

        await this.app.secureStorage.setItem('ckm_stage', stage);
        this.app.haptic(70);

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

        this.app.transitionView(`
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

                <div style="text-align: center; margin-top: 40px; display: flex; flex-direction: column; gap: 12px; align-items: center;">
                    <button class="btn btn-primary" data-action="renderPassport" data-args="${stage}" style="min-width: 280px;">${t.passportBtn || '📋 View Doctor Passport'}</button>
                    <button class="btn btn-secondary" data-action="closeQuizAndGoBack" data-args="" style="min-width: 280px;">${t.resultBtn}</button>
                </div>
            </div>
        `);
    }

    /**
     * Render patient passport for clinical conversations
     */
    renderPassport(stage) {
        const lang = this.app.currentLanguage || 'en';
        const translations = this.app.translations[lang] || this.app.translations['en'];
        const pp = translations.staging?.passport || {};
        const date = new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : lang === 'pt' ? 'pt-BR' : 'en-US');
        const medCount = this.app.myMedications ? this.app.myMedications.length : 0;

        const container = document.createElement('div');
        const safeMedCount = parseInt(medCount, 10) || 0;
        const safeStage = parseInt(stage, 10) || 0;

        // Select priorities based on stage
        const priorities = pp.priorities || {};
        let priorityItems;
        if (safeStage === 0) {
            priorityItems = priorities.stage0 || ['Maintain excellent preventative habits', 'Screen annually'];
        } else if (safeStage >= 3) {
            priorityItems = priorities.stage3plus || ['Strict BP & Lipid Control', 'Organ Protection (SGLT2/MRA)'];
        } else {
            priorityItems = priorities.default || ['Lifestyle Optimization', 'Metabolic Screening'];
        }

        DOMUtils.safeSetHTML(container, `
            <div class="passport-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
                <div class="passport-card animate-slide-up" style="background: white; border-radius: 20px; width: 100%; max-width: 400px; overflow: hidden; color: black;">
                    <div style="background: var(--accent-red); color: white; padding: 24px; text-align: center;">
                        <h2 style="margin: 0; font-size: 20px; font-weight: 800;">${pp.title || 'EMPOWER-CKM PASSPORT'}</h2>
                        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">${pp.subtitle || 'Patient Health Snapshot'} • ${date}</div>
                    </div>
                    
                    <div style="padding: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 16px; margin-bottom: 16px;">
                            <div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700;">${pp.stageStatus || 'Stage Status'}</div>
                                <div style="font-size: 28px; font-weight: 900; color: var(--accent-red);">${(translations.staging?.stageLabel || 'STAGE').toUpperCase()} ${safeStage}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700;">${pp.medications || 'Medications'}</div>
                                <div style="font-size: 28px; font-weight: 900;">${safeMedCount}</div>
                            </div>
                        </div>

                        <div style="margin-bottom: 24px;">
                            <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: 700; margin-bottom: 8px;">${pp.clinicalPriorities || 'Clinical Priorities'}</div>
                            <ul style="padding-left: 20px; margin: 0; font-size: 14px; line-height: 1.5;">
                                ${priorityItems.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>

                        <div style="background: #f5f5f7; padding: 16px; border-radius: 12px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #666;">${pp.footerText || 'Show this screen to your doctor to start a conversation about your CKM health goals.'}</p>
                        </div>
                    </div>

                    <button class="btn" data-action="closePassport" style="width: 100%; padding: 20px; background: #eee; border: none; font-weight: 700; cursor: pointer;">${pp.closeBtn || 'Close'}</button>
                </div>
            </div>
        `);
        document.body.appendChild(container);
    }

    /**
     * Close passport modal
     */
    closePassport() {
        const modal = document.querySelector('.passport-modal');
        if (modal) modal.remove();
    }

    /**
     * Close quiz and mark module complete
     */
    async closeQuizAndGoBack() {
        const id = 6;
        if (!this.app.completedModules.includes(id)) {
            this.app.completedModules.push(id);
            await this.app.secureStorage.setItem('ckm_progress', this.app.completedModules);
            this.app.celebrate();
        }

        this.app.currentQuizStep = 0;
        this.app.quizAnswers = [];
        this.app.navigateTo('education');
    }
}
