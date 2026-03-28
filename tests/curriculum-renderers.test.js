const test = require('node:test');
const assert = require('node:assert/strict');

const Renderers = require('../public/js/features/curriculum-renderers.js');

function mockTranslations() {
    return {
        ui: {
            learningProgress: 'Your Learning Progress',
            modulesLabel: 'Modules',
            resetProgress: 'Reset Progress',
            welcomeBack: 'Welcome to',
            journeyDesc: 'Journey',
            nextStep: 'Next Step',
            continueLesson: 'Continue Lesson',
            startLesson: 'Start Lesson',
            allCompleted: 'All done',
            allCompletedDesc: 'Done',
            curriculumStatus: 'Status',
            pending: 'Pending'
        },
        modules: {
            subtitle: 'Your Journey',
            labels: { completed: 'Completed' },
            list: [
                { id: 1, title: 'One', description: 'First' },
                { id: 2, title: 'Two', description: 'Second' }
            ]
        },
        clinic: {},
        staging: { title: 'Staging', introText: 'Intro', introTitle: 'Where', startBtn: 'Start' }
    };
}

test('renderProgressBar includes correct completion ratio and reset action', () => {
    const html = Renderers.renderProgressBar(mockTranslations(), [1]);
    assert.match(html, /50%/);
    assert.match(html, /1 \/ 2 Modules/);
    assert.match(html, /data-action="resetProgress"/);
});

test('getPageContent education includes module cards and completed marker', () => {
    const html = Renderers.getPageContent('education', mockTranslations(), [1]);
    assert.match(html, /data-action="renderModuleDetail" data-args="1"/);
    assert.match(html, /Completed/);
});

test('renderKnowledgeCheckView reflects correct/incorrect state deterministically', () => {
    const quiz = {
        question: 'Question?',
        options: ['A', 'B'],
        correctIndex: 1,
        explanation: 'Because B'
    };

    const first = Renderers.renderKnowledgeCheckView(quiz, 6, 0, true, false);
    const second = Renderers.renderKnowledgeCheckView(quiz, 6, 0, true, false);

    assert.equal(first, second);
    assert.match(first, /incorrect/);
    assert.match(first, /Not quite\. Give it another try!/);
});
