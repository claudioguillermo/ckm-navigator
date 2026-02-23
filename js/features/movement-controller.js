/**
 * MovementController - Manages the Movement Explorer module,
 * including slide navigation, SVG visuals, and the tailored plan generator.
 *
 * Extracted from main.js during Phase 2 modularization.
 */
class MovementController {
    constructor(app) {
        this.app = app;
        this._prevMovementIdx = undefined;
    }

    renderMovementExplorer(activeIdx = 0, level = null, barrier = null) {
        const mount = document.getElementById('zone2-guide-mount') || document.getElementById('movement-explorer-mount');
        if (!mount) {
            console.warn('[MovementController] Mount point not found. Module may be rendering incorrectly.');
            return;
        }

        const direction = activeIdx > (this._prevMovementIdx || 0) ? 'next' : 'prev';
        const isInitial = this._prevMovementIdx === undefined;
        this._prevMovementIdx = activeIdx;

        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang].modules.movementExplorer;
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

        this.app.slideTransition(mount, isInitial, direction, (slideClass) => {
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
    }

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
    }

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
    }
}
