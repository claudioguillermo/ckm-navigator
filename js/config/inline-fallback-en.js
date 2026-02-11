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
            lessonCompleted: '✓ Lesson Completed',
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
            resetConfirm: 'Are you sure you want to reset your progress? This will clear all completed lessons and your staging results.',
            confirmTitle: 'Reset All Progress?',
            confirmAction: 'Reset',
            confirmActionClass: 'btn btn-danger',
            cancelAction: 'Cancel',
            pending: 'Pending',
            modulesLabel: 'Modules',
            allCompletedDesc: 'You\'ve mastered the essential CKM curriculum.'
        },
        clinic: {
            title: 'Our Clinic',
            subtitle: 'MetroWest Medical Center',
            storyTitle: 'The Story of',
            storyDesc: 'Designed and developed by the Internal Medicine resident physicians at MetroWest Medical Center.',
            missionTitle: 'Our Mission',
            missionText: 'EMPOWER-CKM is more than just a tool—it\'s a patient-centered initiative created by your doctors. We recognized that understanding the connection between the Heart, Kidneys, and Metabolism can be overwhelming. This project was developed to provide you with the same evidence-based insights we use in the clinic, translated into a guide you can use anywhere.<br><br>This application is the central component of a quality improvement project, titled EMPOWER-CKM: Educating and Motivating Patients On Wellness through Effective Resident-led CKM-guidance.<br><br>Our specific aims are to bridge the educational gap in cardiometabolic care by providing standardized, culturally competent, and multilingual resources. We aim to empower both patients and resident physicians to better manage the complex intersections of heart, kidney, and metabolic health.',
            teamTitle: 'Meet Your Resident Physicians',
            teamText: 'At MetroWest Medical Center, our Resident Physicians are at the heart of our ambulatory clinic. These dedicated doctors are specialized in Internal Medicine and are committed to delivering thorough, compassionate, and state-of-the-art care.',
            teamLink: 'Learn more about our residency program',
            appointmentTitle: 'Schedule an Appointment',
            appointmentDesc: 'Speak with our team to discuss your cardiometabolic health.'
        },
        home: {
            title: 'Welcome to EMPOWER-CKM',
            subtitle: 'Track your journey to better heart, kidney, and metabolic health.',
            heroTitle: 'Everything is Connected',
            heroText: 'Think of your body like a house: your Kidneys are the plumbing, your Heart is the electrical system, and your Metabolism is the energy supply. When the plumbing backs up, it shorts out the electricity. If the energy supply is unstable, everything works harder. EMPOWER-CKM helps you keep your house in order.',
            heroBtn: 'Start Exploring'
        },
        modules: {
            title: 'Learning Modules',
            subtitle: 'Your Journey to Better Health',
            labels: {
                learnMore: 'Learn More',
                showLess: 'Show Less'
            },
            list: [
                { id: 1, title: 'What is CKM Health?', description: 'Use EMPOWER-CKM to understand how your heart, kidneys, and metabolism work together' },
                { id: 2, title: 'Your Plate & Your Health', description: 'Practical dietary changes for better health' },
                { id: 3, title: 'Move More, Live Better', description: 'Physical activity guidelines that work for you' },
                { id: 4, title: 'Understanding Your Numbers', description: 'What your health metrics actually mean' },
                { id: 5, title: 'Your Treatment Options', description: 'Medications and lifestyle changes that can help' },
                { id: 6, title: 'Personalized Assessment', description: 'Discover your CKM stage and receive a tailored plan' }
            ],
            content: {
                "1": {
                    title: "What is CKM Health?",
                    intro: "Your heart, kidneys, and metabolism are deeply connected—like a team where every player affects the others. When one system is stressed, it puts pressure on the others. This connection is called Cardio-Kidney-Metabolic (CKM) health.",
                    sections: [
                        {
                            heading: "The Connection Explained",
                            content: "<div id=\"analogy-mount\"></div>",
                            expanded: "The American Heart Association introduced CKM syndrome in 2023 to help doctors and patients better understand these connections. Research shows that treating these conditions together, rather than separately, leads to much better outcomes. (Note: While the house analogy helps visualize these systems, the human body is more complex and dynamic.)"
                        },
                        {
                            heading: "Why It Matters to You",
                            content: "Understanding CKM health helps you see the big picture. Small changes—like reducing salt, moving more, or taking medications correctly—can protect multiple systems at once.",
                            expanded: "Studies show that people who understand how their conditions connect are more likely to stay on track with treatment plans and achieve better health outcomes. You aren't just treating diabetes OR heart disease OR kidney disease—you are protecting your entire system."
                        },
                        {
                            heading: "The Five Stages of CKM (0-4)",
                            content: "<p>CKM syndrome is categorized into five stages. Click through each stage below to see how it affects your heart, kidneys, and metabolism.</p><div id=\"stage-explorer-mount\"></div>",
                            expanded: "The staging system helps your medical team determine the intensity of treatment. Stage 0 is the goal for everyone, while Stage 4 requires intensive management of clinical disease. Even if you are in Stage 2 or 3, evidence shows that aggressive management can prevent you from reaching Stage 4."
                        }
                    ],
                    quiz: {
                        question: "Which analogy best describes how the Heart, Kidneys, and Metabolism work together?",
                        options: ["Three separate, unrelated systems", "A house with plumbing, electrical, and foundation systems", "A car that needs new tires"],
                        correctIndex: 1,
                        explanation: "Correct! The systems are interconnected. Problems in the foundation (metabolism) can damage the wiring (heart) and plumbing (kidneys)."
                    }
                },
                "2": {
                    title: "Your Plate & Your Health",
                    intro: "What you eat is one of the most powerful tools for CKM health. You don't need a complicated diet-just a balanced plate.",
                    sections: [
                        {
                            heading: "The Healthy Eating Plate",
                            content: "<div id=\"eating-plate-mount\"></div><div id=\"cultural-food-mount\" style=\"margin-top: 40px; border-top: 1px solid var(--border-soft); padding-top: 40px;\"></div>",
                            expanded: "This simple visual guide helps control blood sugar and weight without counting calories. Traditional Brazilian and Latin American foods like rice, beans, and corn tortillas are incredibly healthy when balanced correctly. Use the explorer above to see how your favorite foods can act as medicine for your heart and kidneys."
                        },
                        {
                            heading: "Sodium: The Silent Stressor",
                            content: "Salt (sodium) acts like a water magnet. Too much salt makes your body hold onto fluid, raising blood pressure and forcing your heart and kidneys to work overtime.",
                            expanded: "Most studies show that approximately 70% of the sodium we eat comes from processed and restaurant foods, not the salt shaker (CDC, 2023). Reading labels is your best defense. Aim for less than 2,300mg per day—though your doctor may recommend <1,500mg if you have Stage 2+ CKM."
                        },
                        {
                            heading: "Interactive Food Label Decoder",
                            content: "<p>Learn to spot the hidden metrics that affect your Heart and Kidneys. Click on different parts of the label below.</p><div id=\"food-label-mount\"></div>",
                            expanded: "When reading a label for CKM health, look at three key things: Sodium (for blood pressure), Saturated Fat (for cholesterol), and Added Sugars (for metabolism). If a food is high in all three, it is a metabolic \"short circuit\"."
                        }
                    ],
                    quiz: {
                        question: "According to the 'Healthy Plate' method, half of your plate should be filled with:",
                        options: ["Protein (Chicken/Meat)", "Carbohydrates (Rice/Pasta)", "Vegetables"],
                        correctIndex: 2,
                        explanation: "Correct! Vegetables are the foundation. They provide fiber and nutrients that protect all three systems."
                    }
                },
                "3": {
                    title: "Move More, Live Better",
                    intro: "Movement is medicine for CKM health. This isn't about becoming an athlete or losing weight (though that may happen). This is about using your muscles as a repair crew for your heart, kidneys, and metabolism.",
                    sections: [
                        {
                            heading: "Interactive movement roadmap",
                            content: "<div id=\"movement-explorer-mount\"></div>",
                            expanded: "The 2023 AHA guidelines emphasize that movement improves CKM health through multiple pathways: increasing glucose uptake via GLUT4, lowering blood pressure via vasodilation, and protecting kidneys by reducing systemic inflammation. Starting small—even 5 or 10 minutes—is the most important step for long-term health in Massachusetts, where seasonal variety requires indoor and outdoor strategies."
                        }
                    ],
                    quiz: {
                        question: "What is the 'Talk Test' for Zone 2 exercise?",
                        options: ["You can't talk at all (too breathless)", "You can speak in full sentences but can't sing", "You can sing a whole song easily"],
                        correctIndex: 1,
                        explanation: "Correct! Zone 2 is the 'sweet spot' where you are working hard enough to breathe faster, but not so hard you have to stop talking."
                    }
                },
                "4": {
                    title: "Understanding Your Numbers",
                    intro: "To manage CKM health, you need to know your \"dashboard\" metrics. These numbers tell you how your systems are operating. Click each category below to explore the ranges.",
                    sections: [
                        {
                            heading: "Interactive Metrics Dashboard",
                            content: "<div id=\"metrics-dashboard-mount\"></div>",
                            expanded: "Keeping these numbers within target ranges is the key to preventing the progression of CKM syndrome. Modern medicine is shifting its focus from LDL-C to <strong>ApoB</strong> (<80 mg/dL) to better understand your true plaque burden. Additionally, while blood tests check filtration (<strong>eGFR</strong>), we also test urine (<strong>UACR</strong>) to find early \"leaks\" that simple tests miss."
                        }
                    ],
                    quiz: {
                        question: "Why is 'ApoB' considered a better metric than just LDL cholesterol?",
                        options: ["It is cheaper to test", "It measures the total number of plaque-causing particles", "It is only for kidney disease"],
                        correctIndex: 1,
                        explanation: "Correct! ApoB counts the actual number of particles that can get stuck in your artery walls, giving a truer picture of your risk."
                    }
                },
                "5": {
                    title: "Your Treatment Options",
                    intro: "Lifestyle is the foundation, but modern medications are powerful tools that can protect your heart, kidneys, and metabolism simultaneously.",
                    sections: [
                        {
                            heading: "The CKM Medication Landscape",
                            content: "<p>CKM health management often requires multiple medications working together. Click the categories below to explore common treatments.</p><div id=\"med-map-mount\"></div>",
                            expanded: "The beauty of modern CKM treatment is \"pleiotropy\"—the ability of one medicine to help multiple organs. For example, SGLT2 inhibitors were invented for diabetes (metabolism) but are now standard treatments for heart failure and kidney disease. Your doctor selects a unique combination of these \"pillars\" based on your specific CKM stage."
                        },
                        {
                            heading: "Partnering with Your Team",
                            content: "Managing CKM requires a team approach. You are the captain, but your doctors, pharmacists, and dietitians are your crew.",
                            expanded: "Don't be afraid to ask basic questions: \"What does this pill do?\" \"Why am I taking this?\" Understanding your treatment is the key to staying with it. Always report side effects early; there is almost always an alternative option."
                        }
                    ],
                    quiz: {
                        question: "What is 'Pleiotropy' in CKM medication?",
                        options: ["A side effect causing dizziness", "Taking multiple pills for one condition", "One medication that benefits multiple organ systems at once"],
                        correctIndex: 2,
                        explanation: "Correct! Modern CKM medications are powerful because they can protect your heart, kidneys, and metabolism simultaneously."
                    }
                },
                "6": {
                    title: "Personalized Assessment",
                    intro: "Now that you understand how your heart, kidneys, and metabolism work together, discover where you are on the CKM health spectrum.",
                    sections: [
                        {
                            heading: "Risk Assessment",
                            content: "<p>Answer 4 quick health questions to estimate your CKM risk stages. This education helps tailor your medical discussions.</p><div id=\"quiz-mount\" style=\"text-align: center; margin-top: 24px;\"><button class=\"btn btn-primary\" data-action=\"renderQuizStep\" data-args=\"true\">Start Assessment</button></div>",
                            expanded: "<strong>IMPORTANT:</strong> This assessment is for EDUCATIONAL PURPOSES ONLY and is NOT a medical diagnosis. Your actual CKM stage can only be determined by your healthcare provider with proper blood and urine testing."
                        }
                    ]
                }
            }
        },
        anatomy: {
            title: 'Interactive Anatomy',
            subtitle: 'The CKM Connection',
            text: 'Tap on an organ to see how CKM syndrome affects it.',
            organs: { heart: 'Heart', kidneys: 'Kidneys', metabolism: 'Metabolism' },
            labels: { role: 'Natural Role', problem: 'The Problem in CKM', connection: 'The Connection' },
            details: {
                heart: { title: 'The Heart (Electrical)', role: 'The heart is the pump of the body...', problem: 'Excess body fat damages blood vessels...', connection: 'When the heart struggles, it can\'t pump enough blood...' },
                kidneys: { title: 'The Kidneys (Plumbing)', role: 'Your kidneys act as the body\'s filter...', problem: 'High blood pressure damages filters...', connection: 'Damaged kidneys cannot filter blood properly...' },
                metabolism: { title: 'Metabolism (Energy)', role: 'Metabolism helps you convert food...', problem: 'Excess adipose tissue releases inflammation...', connection: 'This metabolic dysfunction acts as the spark...' }
            }
        },
        staging: {
            title: "Risk Assessment",
            subtitle: "Assess Your Risks",
            introTitle: "Where do you stand?",
            questions: [] // Populated dynamically in real app, simplified here
        },
        chat: {
            welcome: "Hello! I'm your EMPOWER-CKM assistant. I can help explain medical concepts or guide you through the curriculum. How can I help you today?",
            placeholder: "Ask a question about your health...",
            disclaimer: "I am an AI assistant. This is for educational purposes only. Always consult your doctor.",
            suggested: ["What is CKM syndrome?", "How do I lower my blood pressure?", "What foods are good for kidneys?"]
        }
    };
});
