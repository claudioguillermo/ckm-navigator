(function (root, factory) {
    const data = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = data;
    }
    root.INLINE_FALLBACK_EN = data;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    return {
        nav: {
            home: 'Home',
            education: 'Learn More',
            chat: 'Chat',
            clinic: 'Clinic'
        },
        ui: {
            backToCurriculum: '← Back to Curriculum',
            clinicalInsight: 'Clinical Insight',
            finishLesson: 'Finish Lesson',
            lessonCompleted: 'Lesson Completed',
            learningProgress: 'Your Learning Progress',
            stepProgress: 'Step {count} of {total} Complete',
            startLesson: 'Start Lesson',
            continueLesson: 'Continue Lesson',
            allCompleted: 'All Modules Completed!',
            curriculumStatus: 'Curriculum Status',
            welcomeBack: 'Welcome to',
            nextStep: 'Next Step',
            journeyDesc: 'Track your journey to better heart, kidney, and metabolic health.',
            resetProgress: 'Reset Progress',
            resetConfirm: 'Are you sure you want to reset your progress?',
            confirmTitle: 'Reset All Progress?',
            confirmAction: 'Reset',
            cancelAction: 'Cancel',
            pending: 'Pending',
            modulesLabel: 'Modules',
            allCompletedDesc: "You've mastered the essential CKM curriculum."
        },
        home: {
            title: 'Welcome to EMPOWER-CKM',
            subtitle: 'Track your journey to better heart, kidney, and metabolic health.',
            heroTitle: 'Everything is Connected',
            heroText: 'EMPOWER-CKM helps you understand how your systems work together.',
            heroBtn: 'Start Exploring'
        },
        clinic: {
            title: 'Our Clinic',
            subtitle: 'MetroWest Medical Center',
            storyTitle: 'The Story of',
            storyDesc: 'Designed and developed by resident physicians.',
            missionTitle: 'Our Mission',
            missionText: 'Patient-centered CKM education.',
            teamTitle: 'Meet Your Resident Physicians',
            teamText: 'Our team provides compassionate and evidence-based care.',
            teamLink: 'Learn more about our residency program',
            appointmentTitle: 'Schedule an Appointment',
            appointmentDesc: 'Speak with our team about your cardiometabolic health.'
        },
        staging: {
            title: 'Staging Quiz',
            introTitle: 'Where do you stand?',
            introText: 'Educational only and not medical diagnosis.',
            startBtn: 'Take the Quiz',
            step: 'Step',
            of: 'of',
            resultTitle: 'Your CKM Assessment',
            stageLabel: 'Stage',
            resultBtn: 'Back to Curriculum',
            questions: [],
            descriptions: {
                1: 'Discuss early risk factors with your doctor.',
                2: 'Discuss metabolic and kidney risk factors with your doctor.',
                3: 'Discuss cardiovascular prevention with your doctor.',
                4: 'Discuss intensive CKM management with your doctor.'
            },
            plan: {
                title: 'Your CKM Roadmap',
                clinicalTitle: 'Clinical Priorities',
                lifestyleTitle: 'Lifestyle Changes',
                clinicalActions: {},
                lifestyleActions: {}
            }
        },
        education: {
            title: 'Education',
            subtitle: 'Learning Curriculum'
        },
        modules: {
            title: 'Learning Modules',
            subtitle: 'Your Journey to Better Health',
            labels: {
                completed: 'Completed',
                learnMore: 'Learn More',
                showLess: 'Show Less'
            },
            list: [
                { id: 1, title: 'What is CKM Health?', description: 'Understand core CKM concepts.' },
                { id: 2, title: 'Your Plate & Your Health', description: 'Practical nutrition changes.' },
                { id: 3, title: 'Move More, Live Better', description: 'Activity guidance.' },
                { id: 4, title: 'Understanding Your Numbers', description: 'Interpret health metrics.' },
                { id: 5, title: 'Your Treatment Options', description: 'Medication and lifestyle options.' },
                { id: 6, title: 'Personalized Assessment', description: 'Discover your CKM stage.' }
            ],
            content: {
                1: { title: 'What is CKM Health?', intro: 'Content loading...', sections: [] },
                2: { title: 'Your Plate & Your Health', intro: 'Content loading...', sections: [] },
                3: { title: 'Move More, Live Better', intro: 'Content loading...', sections: [] },
                4: { title: 'Understanding Your Numbers', intro: 'Content loading...', sections: [] },
                5: { title: 'Your Treatment Options', intro: 'Content loading...', sections: [] },
                6: { title: 'Personalized Assessment', intro: 'Content loading...', sections: [] }
            }
        },
        chat: {
            welcome: 'Hello! I am your AI Health Assistant.',
            title: 'Ask a Question',
            subtitle: 'AI Health Assistant',
            placeholder: 'Type your question...',
            send: 'Send',
            disclaimer: 'For educational purposes only. Not medical advice.',
            thinking: 'Thinking...'
        }
    };
});
