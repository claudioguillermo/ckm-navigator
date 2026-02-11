(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.CurriculumRenderers = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    function getModulesList(t) {
        return (t && t.modules && Array.isArray(t.modules.list)) ? t.modules.list : [];
    }

    function renderProgressBar(t, completedModules) {
        const modules = getModulesList(t);
        const total = modules.length || 1;
        const count = Array.isArray(completedModules) ? completedModules.length : 0;
        const percent = (count / total) * 100;
        const ui = t.ui || {};

        return `
            <div class="soft-card progress-hero animate-slide-up" style="background: var(--bg-card); padding: 40px; border-left: 10px solid var(--accent-red); margin-bottom: 48px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
                    <div>
                        <div class="card-tag">${ui.learningProgress || 'Your Learning Progress'}</div>
                        <h3 style="font-size: 40px; font-weight: 800; margin: 8px 0 0;">${Math.round(percent)}%</h3>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 800; opacity: 0.5; font-size: 16px; margin-bottom: 12px;">
                            ${count} / ${modules.length} ${ui.modulesLabel || 'Modules'}
                        </div>
                        <button class="btn btn-text" data-action="resetProgress" data-args="" 
                                style="font-size: 12px; font-weight: 700; color: var(--accent-red); padding: 8px 12px; border: 1px solid var(--accent-red-light); border-radius: var(--radius-sm); min-height: 32px; height: 32px;">
                            ${ui.resetProgress || 'Reset Progress'}
                        </button>
                    </div>
                </div>
                
                <div class="progress-track" style="height: 16px; background: var(--bg-depth); border-radius: 8px; overflow: hidden;">
                    <div class="progress-bar" style="width: ${percent}%; height: 100%; background: var(--accent-red); border-radius: 8px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
                </div>
            </div>
        `;
    }

    function renderHomePage(t, completedModules) {
        const modules = getModulesList(t);
        const nextModule = modules.find(function (m) {
            return !completedModules.includes(m.id);
        }) || modules[0] || { id: 1, title: 'Start Learning' };
        const progressValue = modules.length > 0 ? (completedModules.length / modules.length) * 100 : 0;
        const ui = t.ui || {};
        const isFullyCompleted = completedModules.length === modules.length && modules.length > 0;

        return `
            <div class="dashboard-simple animate-slide-up">
                <div class="hero-header" style="margin-bottom: 48px; border-left: 6px solid var(--accent-red); padding-left: 24px;">
                    <h2 style="font-size: 40px; font-weight: 800;">${ui.welcomeBack || 'Welcome to'} <span class="logo-empower">EMPOWER</span>-<span class="logo-ckm">CKM</span></h2>
                    <p style="opacity: 0.6; font-size: 18px;">${ui.journeyDesc || ''}</p>
                </div>

                <div class="soft-card progress-hero" style="background: var(--bg-card); padding: 48px; border-left: 10px solid var(--accent-red); margin-bottom: 48px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
                        <div>
                            <div class="card-tag">${ui.learningProgress || 'Your Learning Progress'}</div>
                            <h3 style="font-size: 44px; font-weight: 800; margin: 8px 0 0;">${Math.round(progressValue)}%</h3>
                        </div>
                         <div style="font-weight: 800; opacity: 0.5; font-size: 18px; padding-bottom: 4px;">
                             ${completedModules.length} / ${modules.length} ${ui.modulesLabel || 'Modules'}
                         </div>
                    </div>
                    
                    <div class="progress-track" style="height: 16px; background: var(--bg-depth); border-radius: 8px; overflow: hidden; margin-bottom: 40px;">
                        <div class="progress-bar" style="width: ${progressValue}%; height: 100%; background: var(--accent-red); border-radius: 8px;"></div>
                    </div>

                    ${!isFullyCompleted ? `
                        <div style="background: var(--accent-red-light); padding: 24px; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; border: 1px solid rgba(193, 14, 33, 0.1);">
                            <div style="flex: 1; padding-right: 24px;">
                                <p style="font-size: 12px; font-weight: 800; color: var(--accent-red); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">${ui.nextStep || 'Next Step'}</p>
                                <h4 style="font-size: 20px; font-weight: 800; margin: 0;">${nextModule.title}</h4>
                            </div>
                            <button class="btn btn-primary" data-action="renderModuleDetail" data-args="${nextModule.id}">
                                ${completedModules.length > 0 ? (ui.continueLesson || 'Continue Lesson') : (ui.startLesson || 'Start Lesson')} →
                            </button>
                        </div>
                    ` : `
                         <div style="background: var(--bg-success-subtle); padding: 32px; border-radius: 20px; text-align: center; border: 1px solid var(--system-green);">
                             <h4 style="color: var(--system-green); font-weight: 800; font-size: 22px; margin: 0;">${ui.allCompleted || 'All Modules Completed!'}</h4>
                             <p style="opacity: 0.7; font-size: 15px; margin-top: 8px;">${ui.allCompletedDesc || ''}</p>
                         </div>
                    `}
                </div>

                <div style="margin-bottom: 64px;">
                    <h4 style="font-size: 20px; font-weight: 800; margin-bottom: 24px;">${ui.curriculumStatus || 'Curriculum Status'}</h4>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${modules.map(function (mod) {
            const isDone = completedModules.includes(mod.id);
            return `
                                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-radius: 12px; transition: all 0.2s; border: 1px solid transparent;" class="${isDone ? '' : 'pending-item'}">
                                    <div style="display: flex; align-items: center; gap: 16px;">
                                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${isDone ? 'var(--system-green)' : 'var(--text-tertiary)'}; box-shadow: ${isDone ? '0 0 8px var(--system-green)' : 'none'};"></div>
                                        <span style="font-weight: 600; font-size: 16px; color: ${isDone ? 'var(--text-primary)' : 'var(--text-tertiary)'}">${mod.title}</span>
                                    </div>
                                    <div class="status-pill ${isDone ? 'completed' : 'pending'}">
                                        ${isDone ? ((t.modules && t.modules.labels && t.modules.labels.completed) || 'Completed') : (ui.pending || 'Pending')}
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function renderClinicPage(t) {
        const c = t.clinic || {};
        return `
            <div class="page-intro animate-slide-up" style="margin-bottom: 48px; border-left: 6px solid var(--accent-red); padding-left: 24px;">
                <h2 style="font-size: 40px; font-weight: 800; margin: 0 0 8px;">${c.storyTitle || ''} <span class="logo-empower">EMPOWER</span>-<span class="logo-ckm">CKM</span></h2>
                <p style="font-size: 18px; color: var(--text-primary); opacity: 0.7;">${c.storyDesc || ''}</p>
            </div>

            <div class="clinic-simple animate-stagger" style="display: flex; flex-direction: column; gap: 48px;">
                <div class="soft-card" style="padding: 48px;">
                    <h3 style="color: var(--accent-red); margin-bottom: 24px; font-size: 24px; font-weight: 800;">${c.missionTitle || ''}</h3>
                    <p style="font-size: 18px; line-height: 1.8; color: var(--text-primary);">${c.missionText || ''}</p>
                </div>

                <div class="soft-card" style="padding: 48px;">
                    <h3 style="margin-bottom: 24px; font-size: 24px; font-weight: 800;">${c.teamTitle || ''}</h3>
                    <div style="display: flex; align-items: center; gap: 48px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 300px;">
                            <p style="font-size: 17px; line-height: 1.8; margin-bottom: 24px; color: var(--text-primary);">${c.teamText || ''}</p>
                            <a href="https://www.mwmc.com/health-professionals/internal-medicine-residency" target="_blank" class="btn btn-text">${c.teamLink || 'Learn more'} <span>→</span></a>
                        </div>
                        <div style="width: 100%; max-width: 250px; display: flex; align-items: center; justify-content: center;">
                            <img src="assets/images/metrowest-logo.jpg" alt="MetroWest Logo" style="width: 100%; height: auto; mix-blend-mode: multiply;">
                        </div>
                    </div>
                </div>

                <div class="soft-card" style="border: 2px solid var(--accent-red); text-align: center; padding: 64px;">
                    <h2 style="margin-bottom: 12px; font-size: 32px; font-weight: 800;">${c.appointmentTitle || ''}</h2>
                    <p style="font-size: 18px; opacity: 0.7; margin-bottom: 40px;">${c.appointmentDesc || ''}</p>
                    <a href="tel:5083831130" class="btn btn-primary" style="font-size: 24px; padding: 24px 80px;">(508) 383-1130</a>
                </div>
            </div>
        `;
    }

    function renderEducationPage(t, completedModules) {
        const modules = getModulesList(t);
        return `
            <div class="page-intro animate-slide-up" style="margin-bottom: 48px;">
                <h2 style="font-size: 40px; font-weight: 800; border-left: 6px solid var(--accent-red); padding-left: 24px;">${(t.modules && t.modules.subtitle) || ''}</h2>
            </div>

            ${renderProgressBar(t, completedModules)}

            <div class="module-grid animate-stagger" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 32px; margin-top: 48px; padding: 10px;">
                ${modules.map(function (mod) {
            const isCompleted = completedModules.includes(mod.id);
            return `
                         <div class="soft-card ${isCompleted ? 'completed' : ''}" data-action="renderModuleDetail" data-args="${mod.id}">
                             <div style="color: var(--accent-red); font-weight: 800; font-size: 14px; margin-bottom: 16px;">MOD 0${mod.id}</div>
                             <h3 style="font-size: 22px; font-weight: 800; margin-bottom: 12px;">${mod.title}</h3>
                             <p style="line-height: 1.6; opacity: 0.8;">${mod.description}</p>
                             ${isCompleted ? `<div style="margin-top: 24px; color: var(--system-green); font-weight: 700; display: flex; align-items: center; gap: 8px;"><span style="display: inline-flex; width: 24px; height: 24px; background: var(--bg-success-subtle); border-radius: 50%; align-items: center; justify-content: center; font-size: 12px;">✓</span>${(t.modules && t.modules.labels && t.modules.labels.completed) || 'Completed'}</div>` : ''}
                         </div>
                     `;
        }).join('')}
            </div>
        `;
    }

    function renderStagingPage(t) {
        const s = t.staging || {};
        return `
            <div class="page-intro animate-slide-up" style="margin-bottom: 48px; border-left: 6px solid var(--accent-red); padding-left: 24px;">
                <h2 style="font-size: 40px; font-weight: 800; margin: 0 0 8px;">${s.title || ''}</h2>
                <p style="font-size: 18px; opacity: 0.7;">${s.introText || ''}</p>
            </div>

            <div class="soft-card animate-slide-up" style="margin: 0 auto; text-align: center; padding: 64px;">
                <h2 style="margin-bottom: 24px; font-size: 32px; font-weight: 800;">${s.introTitle || ''}</h2>
                <p style="margin-bottom: 40px; font-size: 18px; line-height: 1.6; opacity: 0.8;">${s.introText || ''}</p>
                <button class="btn btn-primary" data-action="startQuiz" data-args="" style="width: 100%; font-size: 18px;">${s.startBtn || 'Start'}</button>
            </div>
        `;
    }

    function getPageContent(pageId, t, completedModules) {
        if (pageId === 'home') return renderHomePage(t, completedModules);
        if (pageId === 'clinic') return renderClinicPage(t);
        if (pageId === 'education') return renderEducationPage(t, completedModules);
        if (pageId === 'staging') return renderStagingPage(t);
        return '';
    }

    function renderModuleSections(content, ui) {
        const sections = Array.isArray(content.sections) ? content.sections : [];

        return sections.map(function (sec, idx) {
            let contentHtml = sec.content || '';
            let visualHtml = '';
            let hasVisual = false;

            const imgMatch = contentHtml.match(/<img[^>]+>/);
            if (imgMatch) {
                visualHtml = `<div class="visual-container">${imgMatch[0].replace(/style="[^"]*"/, '')}</div>`;
                contentHtml = contentHtml.replace(imgMatch[0], '');
                hasVisual = true;
            }

            // Enhance mounts with skeleton placeholder internally, but do not return early
            contentHtml = contentHtml.replace(/<div id="([^"]+-mount)"[^>]*><\/div>/g, (match, id) => {
                return `<div id="${id}" style="margin-bottom: 32px;"><div class="skeleton-visual" style="height: 400px; background: var(--bg-skeleton); border-radius: 20px;"></div></div>`;
            });

            return `
                <div class="module-intro-section">
                    <div class="module-section soft-card glass">
                        <div class="section-header-row">
                            <h3 style="margin: 0; line-height: 1.2;">${sec.heading || ''}</h3>
                            <div class="info-trigger" data-action="toggleClinicalNote" data-args="${idx}" title="${ui.clinicalInsight || 'Clinical Insight'}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                                <div class="info-tooltip">${ui.clinicalInsight || 'Clinical Insight'}</div>
                            </div>
                        </div>
                        <div class="section-content">
                            <div class="section-body-grid">
                                <div class="main-body" style="margin-bottom: ${hasVisual ? '32px' : '0'}">${contentHtml}</div>
                                ${hasVisual ? `<div class="visual-full-width">${visualHtml}</div>` : ''}
                            </div>
                            <div class="clinical-note hidden" id="note-${idx}">
                                <div class="note-label">${ui.clinicalInsight || 'Clinical Insight'}</div>
                                <p>${sec.expanded || ''}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderModuleDetailView(id, content, ui, myMedications, completedModules) {
        const sectionsHtml = renderModuleSections(content, ui);
        const medCount = Array.isArray(myMedications) ? myMedications.length : 0;

        const headerHtml = `
            <div class="module-intro animate-slide-up">
                <button class="btn btn-secondary" data-action="navigateTo" data-args="'education'" style="margin-bottom: 24px;">${ui.backToCurriculum || '← Back to Curriculum'}</button>
                ${id === 5 ? `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px; flex-wrap: wrap; gap: 16px;">
                        <div style="flex: 1;"><h2 style="margin: 0;">${content.title || ''}</h2></div>
                        <div style="position: relative; cursor: pointer;" data-action="showMyMedications" data-args="">
                            <button class="btn btn-primary" style="white-space: nowrap;">📋 My Medications</button>
                            <span id="my-med-count" style="display: ${medCount > 0 ? 'inline-block' : 'none'}; position: absolute; top: -8px; right: -8px; background: var(--accent-red); color: white; border-radius: 12px; padding: 2px 8px; font-size: 11px; font-weight: 700; min-width: 20px; text-align: center; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">${medCount}</span>
                        </div>
                    </div>
                    <p>${content.intro || ''}</p>
                ` : `
                    <h2>${content.title || ''}</h2>
                    <p>${content.intro || ''}</p>
                `}
            </div>
        `;

        return `
            ${headerHtml}
            <div class="module-sections-container animate-stagger" style="margin: 0 auto;">${sectionsHtml}</div>
            ${content.quiz ? '<div id="knowledge-check-mount" style="margin-top: 40px;"></div>' : ''}
            ${id === 6 ? '' : `
            <div class="module-footer animate-slide-up" style="margin-top: 40px; text-align: center; padding-bottom: 60px;">
                <button class="btn btn-primary ${(content.quiz && !completedModules.includes(id)) ? 'hidden' : ''}" data-action="markModuleComplete" data-args="${id}" id="complete-btn" style="min-width: 300px;">
                    ${completedModules.includes(id) ? `✓ ${ui.lessonCompleted || 'Lesson Completed'}` : (ui.finishLesson || 'Finish Lesson')}
                </button>
            </div>`}
        `;
    }

    function renderKnowledgeCheckView(quiz, moduleId, selectedIndex, showFeedback, isCompleted) {
        const isCorrect = selectedIndex === quiz.correctIndex;

        let feedbackHTML = '';
        if (showFeedback) {
            if (isCorrect || isCompleted) {
                feedbackHTML = `
                    <div class="animate-slide-up" style="background: var(--bg-success-subtle); padding: 24px; border-radius: 12px; margin-top: 24px; border: 1px solid var(--system-green);">
                        <div style="display: flex; gap: 12px; margin-bottom: 8px;"><div style="color: var(--system-green); font-weight: 800; font-size: 18px;">✓ Correct!</div></div>
                        <p style="margin: 0; color: var(--text-primary); font-size: 16px;">${quiz.explanation || ''}</p>
                    </div>
                `;
            } else {
                feedbackHTML = `
                    <div class="shake-animation" style="background: var(--bg-danger-subtle); padding: 16px; border-radius: 12px; margin-top: 24px; border: 1px solid var(--text-danger-strong); color: var(--text-danger-strong); font-weight: 600;">
                        Not quite. Give it another try!
                    </div>
                `;
            }
        }

        const optionsHTML = (quiz.options || []).map(function (opt, idx) {
            let stateClass = '';
            let icon = '';

            if (showFeedback) {
                if (idx === quiz.correctIndex && (isCorrect || isCompleted)) {
                    stateClass = 'correct';
                    icon = '✓ ';
                } else if (idx === selectedIndex && !isCorrect) {
                    stateClass = 'incorrect';
                    icon = '✕ ';
                } else if (isCompleted && idx === quiz.correctIndex) {
                    stateClass = 'correct';
                    icon = '✓ ';
                }
            }

            return `
                <button class="btn-quiz-option ${stateClass}" data-action="handleQuizOptionClick" data-args="${moduleId}, ${idx}" ${(showFeedback && isCorrect) || isCompleted ? 'disabled' : ''}>
                    <span style="flex: 1;">${opt}</span>
                    <span>${icon}</span>
                </button>
            `;
        }).join('');

        return `
            <div class="soft-card" style="padding: 32px; border-top: 4px solid var(--accent-red);">
                <h3 style="margin-top: 0; margin-bottom: 8px; color: var(--accent-red); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Checkpoint</h3>
                <h4 style="margin-top: 0; margin-bottom: 24px; font-size: 20px; font-weight: 800;">${quiz.question || ''}</h4>
                <div>${optionsHTML}</div>
                ${feedbackHTML}
            </div>
            <style>
                @keyframes headShake {
                    0% { transform: translateX(0); }
                    6.5% { transform: translateX(-6px) rotateY(-9deg); }
                    18.5% { transform: translateX(5px) rotateY(7deg); }
                    31.5% { transform: translateX(-3px) rotateY(-5deg); }
                    43.5% { transform: translateX(2px) rotateY(3deg); }
                    50% { transform: translateX(0); }
                }
                .shake-animation {
                    animation-name: headShake;
                    animation-duration: 1s;
                    animation-fill-mode: both;
                    animation-timing-function: ease-in-out;
                }
            </style>
        `;
    }

    return {
        getPageContent,
        renderProgressBar,
        renderModuleSections,
        renderModuleDetailView,
        renderKnowledgeCheckView
    };
});
