(function (root, factory) {
    const api = factory(root.CurriculumRenderers);
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.CurriculumController = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (CurriculumRenderers) {
    function getPageContent(app, pageId, t) {
        return CurriculumRenderers.getPageContent(pageId, t, app.completedModules || []);
    }

    async function renderModuleDetail(app, id) {
        const lang = app.currentLanguage;
        const languagePack = app.translations[lang] || app.translations.en || {};
        const t = languagePack.modules || {};
        const ui = languagePack.ui || {};
        const content = t.content && t.content[id];

        if (!content) {
            alert('Content coming soon!');
            return;
        }

        const viewHtml = CurriculumRenderers.renderModuleDetailView(
            id,
            content,
            ui,
            app.myMedications || [],
            app.completedModules || []
        );

        await app.transitionView(viewHtml);

        if (id === 1) {
            app.tasks.setTimeout(function () { app.renderAnalogyAnimation('analogy-mount'); }, 50);
            app.tasks.setTimeout(function () { app.renderStageExplorer(); }, 100);
        }
        if (id === 2) {
            app.tasks.setTimeout(function () { app.renderEatingPlateAnimation('eating-plate-mount'); }, 50);
            app.tasks.setTimeout(function () { app.renderCulturalFoodExplorer('cultural-food-mount'); }, 100);
            app.tasks.setTimeout(function () { app.renderFoodLabel(); }, 150);
        }
        if (id === 3) {
            app.tasks.setTimeout(function () { app.renderMovementExplorer(); }, 50);
        }
        if (id === 4) {
            app.tasks.setTimeout(function () { app.renderMetricsDashboard(); }, 50);
        }
        if (id === 5) {
            app.tasks.setTimeout(function () { app.renderMedicationMap(); }, 50);
        }
        if (id === 6) {
            app.quizAnswers = [];
            app.currentQuizStep = 0;
            app.tasks.setTimeout(function () { app.renderQuizStep(true); }, 50);
        }

        if (content.quiz) {
            const isDone = (app.completedModules || []).includes(id);
            app.tasks.setTimeout(function () {
                app.renderKnowledgeCheck(id, null, isDone);
            }, 150);
        }
    }

    function renderKnowledgeCheck(app, moduleId, selectedIndex, showFeedback) {
        const mount = document.getElementById('knowledge-check-mount');
        if (!mount) return;

        const lang = app.currentLanguage;
        const languagePack = app.translations[lang] || app.translations.en || {};
        const quiz = languagePack.modules && languagePack.modules.content && languagePack.modules.content[moduleId] && languagePack.modules.content[moduleId].quiz;
        if (!quiz) return;

        const html = CurriculumRenderers.renderKnowledgeCheckView(
            quiz,
            moduleId,
            selectedIndex,
            !!showFeedback,
            (app.completedModules || []).includes(moduleId)
        );
        DOMUtils.safeSetHTML(mount, html);
    }

    function handleQuizOptionClick(app, moduleId, selectedIdx) {
        const lang = app.currentLanguage;
        const languagePack = app.translations[lang] || app.translations.en || {};
        const quiz = languagePack.modules && languagePack.modules.content && languagePack.modules.content[moduleId] && languagePack.modules.content[moduleId].quiz;
        if (!quiz) return;

        app.renderKnowledgeCheck(moduleId, selectedIdx, true);

        if (selectedIdx === quiz.correctIndex) {
            app.celebrate();
            app.haptic(50);

            const btn = document.getElementById('complete-btn');
            if (btn) {
                btn.classList.remove('hidden');
                btn.classList.add('animate-slide-up');
            }
        } else {
            app.haptic(100);
        }
    }

    async function markModuleComplete(app, id) {
        const ui = ((app.translations[app.currentLanguage] || app.translations.en || {}).ui) || {};

        if (!(app.completedModules || []).includes(id)) {
            app.completedModules.push(id);
            await app.secureStorage.setItem('ckm_progress', app.completedModules);

            const btn = document.getElementById('complete-btn');
            if (btn) {
                btn.textContent = `✓ ${ui.lessonCompleted || 'Lesson Completed'}`;
                btn.classList.add('pulse-once');
            }

            app.celebrate();
            app.haptic(50);
            setTimeout(function () { app.navigateTo('education'); }, 1200);
            return;
        }

        app.haptic(30);
        app.navigateTo('education');
    }

    function renderProgressBar(app) {
        const t = app.translations[app.currentLanguage] || app.translations.en || {};
        return CurriculumRenderers.renderProgressBar(t, app.completedModules || []);
    }

    return {
        getPageContent,
        renderModuleDetail,
        renderKnowledgeCheck,
        handleQuizOptionClick,
        markModuleComplete,
        renderProgressBar
    };
});
