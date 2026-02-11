/**
 * MedicationController - Manages medication map, My Medications,
 * metrics dashboard, and stage explorer functionality.
 *
 * Extracted from main.js during Phase 4 modernization.
 */
class MedicationController {
    constructor(app) {
        this.app = app;
        this._isUpdatingModal = false;
    }

    // ========================================
    // MEDICATION MAP
    // ========================================

    renderMedicationMap(mountId = 'med-map-mount') {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang] || this.app.translations['en'];
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
    }

    renderMedicationCategory(catId) {
        const mount = document.getElementById('med-category-detail-mount');
        if (!mount) return;

        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang] || this.app.translations['en'];
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
    }

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
            const isAdded = this.app.myMedications.some(m => m.name === drug);
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
    }

    // ========================================
    // CARD TOGGLE
    // ========================================

    toggleMedicationCard(cardId) {
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
    }

    // ========================================
    // MY MEDICATIONS CRUD
    // ========================================

    addMyMedication(medicationName, categoryId, classIndex) {
        if (!this.app.myMedications.some(m => m.name === medicationName)) {
            this.app.myMedications.push({
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
    }

    removeMyMedication(medicationName) {
        this.app.myMedications = this.app.myMedications.filter(m => m.name !== medicationName);
        this.saveMyMedications();
        this.updateMedicationUI();
    }

    async saveMyMedications() {
        await this.app.secureStorage.setItem('ckm_my_medications', this.app.myMedications);
        this.renderMedicationsManager(document.getElementById('med-manager-mount'));

        // Update counter if visible
        const countSpan = document.getElementById('my-med-count');
        if (countSpan) {
            countSpan.textContent = this.app.myMedications.length;
            countSpan.style.display = this.app.myMedications.length > 0 ? 'inline-block' : 'none';
        }
    }

    toggleMyMedication(name) {
        const idx = this.app.myMedications.findIndex(m => m.name === name);
        if (idx === -1) {
            // Add - Lookup metadata first
            const lang = this.app.currentLanguage || 'en';
            const t = this.app.translations[lang] || this.app.translations['en'];
            const data = t.modules.medicationMap;

            let foundDetails = {};

            // Search for drug metadata
            for (const cat of data.categories) {
                if (cat.classes) {
                    for (let i = 0; i < cat.classes.length; i++) {
                        const cls = cat.classes[i];
                        const drugList = cls.drugs || cls.examples || [];
                        if (drugList.includes(name)) {
                            foundDetails = { categoryId: cat.id, classIndex: i, className: cls.name };
                            break;
                        }
                        if (cls.name === name) {
                            foundDetails = { categoryId: cat.id, classIndex: i, className: cls.name };
                            break;
                        }
                    }
                }
                if (foundDetails.categoryId) break;
            }

            this.app.myMedications.push({
                name: name,
                dose: '10mg',
                freq: 'daily',
                ...foundDetails
            });
            this.app.haptic(40);
        } else {
            // Remove
            this.app.myMedications.splice(idx, 1);
            this.app.haptic(20);
        }
        this.saveMyMedications();
        // Use non-destructive update to keep accordions open
        this.updateMedicationUI();
    }

    closeMyMedications() {
        const modal = document.getElementById('my-meds-modal');
        if (modal) modal.remove();
    }

    renderMedicationsManager(mountPoint) {
        if (!mountPoint) return;
        this.renderMyMedicationsDashboard(mountPoint.id);
    }

    updateMedicationUI() {
        // Update any "Add to My Medications" buttons to show "Remove" if already added
        const buttons = document.querySelectorAll('[data-med-name]');
        buttons.forEach(btn => {
            const medName = btn.getAttribute('data-med-name');
            const isAdded = this.app.myMedications.some(m => m.name === medName);
            const isCurrentlyAdded = btn.classList.contains('btn-secondary');

            if (isAdded && !isCurrentlyAdded) {
                DOMUtils.safeSetHTML(btn, `<span style="margin-right:4px">✓</span> ${medName} `);
                btn.classList.add('btn-secondary');
                btn.classList.remove('btn-primary');
            } else if (!isAdded && isCurrentlyAdded) {
                DOMUtils.safeSetHTML(btn, `<span style="margin-right:4px"> +</span> ${medName} `);
                btn.classList.add('btn-primary');
                btn.classList.remove('btn-secondary');
            }
        });

        // Re-render modal content if open to ensure real-time updates when removing
        const modalContent = document.getElementById('my-meds-modal-content');
        if (modalContent) {
            if (!this._isUpdatingModal) {
                this._isUpdatingModal = true;
                this.renderMyMedicationsDashboard('my-meds-modal-content');
                this._isUpdatingModal = false;
            }
        }

        // Update badge count if exists
        const badge = document.getElementById('my-med-count');
        if (badge) {
            badge.textContent = this.app.myMedications.length;
            badge.style.display = this.app.myMedications.length > 0 ? 'inline-block' : 'none';
        }
    }

    // ========================================
    // INTERACTION CHECKER
    // ========================================

    checkMedicationInteractions() {
        if (this.app.myMedications.length < 2) {
            return { hasInteractions: false, interactions: [] };
        }

        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang] || this.app.translations['en'];
        const data = t.modules.medicationMap;

        const interactions = [];

        const medClasses = [];
        this.app.myMedications.forEach(myMed => {
            const cat = data.categories.find(c => c.id === myMed.categoryId);
            if (cat && cat.classes) {
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

                const isClass = (m, cat, idx) => m.categoryId === cat && m.classIndex === idx;

                // Beta-Blocker + CCB
                if (isClass(med1, 'heart', 0) && isClass(med2, 'heart', 4)) {
                    interactions.push({
                        med1: med1.name,
                        med2: med2.name,
                        severity: 'moderate',
                        description: 'Combining beta-blockers with certain calcium channel blockers (diltiazem/verapamil) can slow heart rate too much. Monitor your heart rate regularly.'
                    });
                }

                // RAAS inhibitors check
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
    }

    // ========================================
    // MY MEDICATIONS DASHBOARD
    // ========================================

    renderMyMedicationsDashboard(mountId = 'my-meds-mount') {
        const mount = document.getElementById(mountId);
        if (!mount) return;

        const lang = this.app.currentLanguage || 'en';
        const t = this.app.translations[lang] || this.app.translations['en'];
        const data = t.modules.medicationMap;

        if (this.app.myMedications.length === 0) {
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
        let medDetails = this.app.myMedications.map(myMed => {
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
    }

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
    }

    // ========================================
    // METRICS DASHBOARD
    // ========================================

    renderMetricsDashboard(activeCatId = 'bp') {
        const mount = document.getElementById('metrics-dashboard-mount');
        if (!mount) return;

        const lang = this.app.currentLanguage;
        const t = this.app.translations[lang].modules.metricsDashboard.categories;

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
    }

    // ========================================
    // STAGE EXPLORER
    // ========================================

    renderStageExplorer(activeStageId = 1) {
        const mount = document.getElementById('stage-explorer-mount');
        if (!mount) return;

        const t = this.app.translations[this.app.currentLanguage].modules.stageExplorer;
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
    }
}

// Make available globally
window.MedicationController = MedicationController;
