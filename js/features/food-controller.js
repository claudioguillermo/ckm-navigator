/**
 * FoodController - Manages the Food Label Explorer, Eating Plate Animation,
 * and Cultural Food Explorer modules.
 *
 * Extracted from main.js during Phase 2 modularization.
 */
class FoodController {
    constructor(app) {
        this.app = app;
        this._prevFoodLabelIdx = undefined;
        this._prevFoodLabelHotspot = undefined;
        this._prevEatingPlateIdx = undefined;
    }

    renderFoodLabel(activeIdx = 0, activeHotspot = null) {
        const mount = document.getElementById('food-label-mount');
        if (!mount) return;

        const direction = activeIdx > (this._prevFoodLabelIdx || 0) ? 'next' : 'prev';
        const isInitial = this._prevFoodLabelIdx === undefined;
        this._prevFoodLabelIdx = activeIdx;

        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang].modules.foodLabel;
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
            this.app.slideTransition(mount, isInitial, direction, renderContent);
        }
    }

    getFoodLabelSVGForSlide(idx, activeHotspot) {
        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang].modules.foodLabel;
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
    }

    renderEatingPlateAnimation(mountId, slideIdx = 0) {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const direction = slideIdx > (this._prevEatingPlateIdx || 0) ? 'next' : 'prev';
        const isInitial = this._prevEatingPlateIdx === undefined;
        this._prevEatingPlateIdx = slideIdx;

        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang].modules.eatingPlate;
        const slide = t.slides[slideIdx];

        this.app.slideTransition(mount, isInitial, direction, (slideClass) => {
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
    }

    renderCulturalFoodExplorer(mountId, activeIdx = 0) {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const lang = this.app.currentLanguage;
        const t = this.app.translations[lang].modules.traditionalFoods;
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
    }

    getFoodStatusColor(status) {
        const s = status.toLowerCase();
        if (s.includes('excellent')) return 'var(--system-green)';
        if (s.includes('limit') || s.includes('avoid')) return 'var(--system-red)';
        return 'var(--system-orange)';
    }

    getImpactColor(impact) {
        const i = impact.toLowerCase();
        if (i.includes('protective') || i.includes('excellent') || i.includes('gentle') || i.includes('supportive') || i.includes('stable') || i.includes('suave') || i.includes('apoio') || i.includes('estável')) return 'var(--system-green)';
        if (i.includes('damaging') || i.includes('high stress') || i.includes('rapid spike') || i.includes('danger') || i.includes('danos') || i.includes('estresse') || i.includes('pico')) return 'var(--system-red)';
        return 'var(--system-orange)';
    }

    toggleEatingDetails(idx) {
        const el = document.getElementById(`eating-details-${idx}`);
        if (el) el.classList.toggle('hidden');
    }

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
    }
}
