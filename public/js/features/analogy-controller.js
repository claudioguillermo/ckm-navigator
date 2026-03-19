/**
 * AnalogyController - Manages anatomy, analogy animations, and house analogy functionality.
 *
 * Extracted from main.js during Phase 4 modernization.
 */
class AnalogyController {
    constructor(app) {
        this.app = app;
        this.analogyState = { foundation: false, electrical: false, filtration: false };
        this._prevAnalogyIdx = undefined;
    }

    // ========================================
    // ANATOMY
    // ========================================

    renderAnatomy(mountId) {
        const mount = document.getElementById(mountId);
        if (!mount) return;
        DOMUtils.safeSetHTML(mount, `
    <div class="interactive-container" style="margin: 0 auto;">
        ${this.getHouseAnalogySVG()}
<div id="svg-tooltip" class="svg-tooltip hidden"></div>
            </div>
    `);
    }

    getHouseAnalogySVG() {
        const t = this.app.translations[this.app.currentLanguage].anatomy;
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
    }

    // ========================================
    // ANALOGY ANIMATION
    // ========================================

    renderAnalogyAnimation(mountId, slideIdx = 0) {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const direction = slideIdx > (this._prevAnalogyIdx || 0) ? 'next' : 'prev';
        const isInitial = this._prevAnalogyIdx === undefined;
        this._prevAnalogyIdx = slideIdx;

        const lang = this.app.currentLanguage;
        const t = this.app.translations[lang].modules.analogy;
        const slide = t.slides[slideIdx];

        this.app.slideTransition(mount, isInitial, direction, (slideClass) => {
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
    }

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
    }

    // ========================================
    // MYTH CRACKER (Shared)
    // ========================================

    showMyth(idx, moduleKey = 'analogy') {
        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang] || this.app.translations['en'];
        const module = t.modules[moduleKey];
        if (!module || !module.slides[idx]) return;

        const slide = module.slides[idx];
        const mythLabel = (module.ui && module.ui.mythLabel) || (t.modules.analogy.ui.mythLabel) || 'Myth Cracker';

        DOMUtils.safeSetHTML(this.app.modalBody, `
            <div style="padding: 32px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 24px;">❓</div>
                <h3 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">${mythLabel}</h3>
                <p style="font-size: 19px; line-height: 1.6; color: var(--text-secondary);">${slide.myth}</p>
            </div>
    `);
        this.app.modalOverlay.classList.remove('hidden');
    }

    // ========================================
    // LOGIC & CONTROLS
    // ========================================

    toggleClinicalNote(idx) {
        const el = document.getElementById(`note-${idx}`);
        if (el) {
            el.classList.toggle('hidden');
        }
    }

    updateAnalogyControl(system, value, mountId) {
        this.analogyState = this.analogyState || { foundation: false, electrical: false, filtration: false };
        this.analogyState[system] = value;
        this.renderAnalogyAnimation(mountId, 7);
    }

    toggleAnalogyControl(system, mountId) {
        this.analogyState = this.analogyState || { foundation: false, electrical: false, filtration: false };
        this.analogyState[system] = !this.analogyState[system];
        this.renderAnalogyAnimation(mountId, 7);
    }

    calculateAnalogyBonus() {
        const s = this.analogyState || { foundation: false, electrical: false, filtration: false };
        let bonus = 0;
        if (s.foundation) bonus += 3;
        if (s.electrical) bonus += 3;
        if (s.filtration) bonus += 2;
        if (s.foundation && s.electrical && s.filtration) bonus += 2; // Synergy bonus
        return bonus;
    }
}

// Make available globally
window.AnalogyController = AnalogyController;
