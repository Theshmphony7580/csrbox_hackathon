import { useState, useEffect } from 'react';
import { submitCognitiveEvent, getCognitiveProfile } from '../api';
import { useStore } from '../store';

interface Question {
    id: string;
    subject: string;
    question: string;
    options: string[];
    correctAnswer: number;
}

const SAMPLE_QUESTIONS: Question[] = [
    {
        id: 'math_1',
        subject: 'Mathematics',
        question: 'What is the derivative of x²?',
        options: ['x', '2x', 'x²', '2'],
        correctAnswer: 1
    },
    {
        id: 'math_2',
        subject: 'Mathematics',
        question: 'Solve: 3x + 5 = 20',
        options: ['x = 3', 'x = 5', 'x = 7', 'x = 15'],
        correctAnswer: 1
    },
    {
        id: 'physics_1',
        subject: 'Physics',
        question: 'What is the SI unit of force?',
        options: ['Joule', 'Newton', 'Watt', 'Pascal'],
        correctAnswer: 1
    },
    {
        id: 'physics_2',
        subject: 'Physics',
        question: 'Speed of light in vacuum is approximately:',
        options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10⁵ m/s', '3 × 10⁷ m/s'],
        correctAnswer: 0
    },
    {
        id: 'chem_1',
        subject: 'Chemistry',
        question: 'What is the chemical symbol for Gold?',
        options: ['Go', 'Gd', 'Au', 'Ag'],
        correctAnswer: 2
    }
];

export default function CognitiveForm() {
    const { cognitiveProfile, setCognitiveProfile } = useStore();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [confidence, setConfidence] = useState(50);
    const [startTime, setStartTime] = useState(Date.now());
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const currentQuestion = SAMPLE_QUESTIONS[currentQuestionIndex];

    useEffect(() => {
        setStartTime(Date.now());
    }, [currentQuestionIndex]);

    const handleSubmit = async () => {
        if (selectedAnswer === null) return;

        const timeTaken = (Date.now() - startTime) / 1000;
        const correct = selectedAnswer === currentQuestion.correctAnswer;
        setIsCorrect(correct);
        setShowResult(true);

        setLoading(true);
        try {
            await submitCognitiveEvent({
                question_id: currentQuestion.id,
                subject: currentQuestion.subject,
                time_taken: timeTaken,
                correct,
                confidence: confidence / 100
            });

            setQuestionsAnswered(prev => prev + 1);

            // Refresh cognitive profile after every 3 questions
            if ((questionsAnswered + 1) % 3 === 0) {
                const profile = await getCognitiveProfile();
                setCognitiveProfile(profile);
            }
        } catch (err) {
            console.error('Failed to submit cognitive event:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        setShowResult(false);
        setSelectedAnswer(null);
        setConfidence(50);

        if (currentQuestionIndex < SAMPLE_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setCurrentQuestionIndex(0); // Loop back to start
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8 animate-slide-up">
                <h1 className="text-4xl font-bold gradient-text mb-2">
                    Cognitive Assessment
                </h1>
                <p className="text-gray-400">
                    Answer questions to help us understand your learning style
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Question Card */}
                <div className="lg:col-span-2">
                    <div className="glass rounded-xl p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {/* Progress */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">
                                    Question {currentQuestionIndex + 1} of {SAMPLE_QUESTIONS.length}
                                </span>
                                <span className="text-sm text-sky-400">
                                    {questionsAnswered} answered
                                </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                                <div
                                    className="bg-gradient-to-r from-sky-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${((currentQuestionIndex + 1) / SAMPLE_QUESTIONS.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Subject Badge */}
                        <div className="mb-4">
                            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-sm">
                                {currentQuestion.subject}
                            </span>
                        </div>

                        {/* Question */}
                        <h2 className="text-2xl font-semibold text-white mb-6">
                            {currentQuestion.question}
                        </h2>

                        {/* Options */}
                        <div className="space-y-3 mb-6">
                            {currentQuestion.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => !showResult && setSelectedAnswer(index)}
                                    disabled={showResult}
                                    className={`w-full p-4 rounded-lg text-left transition-all ${showResult
                                        ? index === currentQuestion.correctAnswer
                                            ? 'bg-green-500/30 border-2 border-green-400'
                                            : index === selectedAnswer
                                                ? 'bg-red-500/30 border-2 border-red-400'
                                                : 'bg-white/5 border border-white/10'
                                        : selectedAnswer === index
                                            ? 'bg-sky-500/30 border-2 border-sky-400 text-white'
                                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                                        }`}
                                >
                                    <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                                </button>
                            ))}
                        </div>

                        {/* Confidence Slider */}
                        {!showResult && (
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    How confident are you? {confidence}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={confidence}
                                    onChange={(e) => setConfidence(Number(e.target.value))}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: `linear-gradient(to right, #0ea5e9 0%, #0ea5e9 ${confidence}%, rgba(255,255,255,0.1) ${confidence}%, rgba(255,255,255,0.1) 100%)`
                                    }}
                                />
                            </div>
                        )}

                        {/* Result Message */}
                        {showResult && (
                            <div className={`mb-6 p-4 rounded-lg ${isCorrect
                                ? 'bg-green-500/20 border border-green-500/50 text-green-200'
                                : 'bg-red-500/20 border border-red-500/50 text-red-200'
                                }`}>
                                <p className="font-semibold">
                                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                                </p>
                                <p className="text-sm mt-1">
                                    Time taken: {((Date.now() - startTime) / 1000).toFixed(1)}s
                                </p>
                            </div>
                        )}

                        {/* Action Button */}
                        {!showResult ? (
                            <button
                                onClick={handleSubmit}
                                disabled={selectedAnswer === null || loading}
                                className="btn btn-primary w-full"
                            >
                                {loading ? 'Submitting...' : 'Submit Answer'}
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="btn btn-primary w-full"
                            >
                                Next Question →
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar - Cognitive Profile */}
                <div className="lg:col-span-1">
                    <div className="glass rounded-xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <h3 className="text-lg font-semibold text-white mb-4">
                            🧠 Your Profile
                        </h3>

                        {cognitiveProfile ? (
                            <div>
                                <div className="mb-4">
                                    <p className="text-2xl font-bold text-sky-400 mb-1">
                                        {cognitiveProfile.type}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Confidence: {(cognitiveProfile.confidence * 100).toFixed(0)}%
                                    </p>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-gray-400 mb-1">Accuracy Rate</p>
                                        <p className="text-white font-semibold">
                                            {(cognitiveProfile.features.accuracy_rate * 100).toFixed(0)}%
                                        </p>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-gray-400 mb-1">Avg Response Time</p>
                                        <p className="text-white font-semibold">
                                            {cognitiveProfile.features.avg_response_time.toFixed(1)}s
                                        </p>
                                    </div>

                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-gray-400 mb-1">Speed Consistency</p>
                                        <p className="text-white font-semibold">
                                            {(cognitiveProfile.features.speed_consistency * 100).toFixed(0)}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400">
                                <p className="mb-3">
                                    Answer at least 3 questions to see your cognitive profile.
                                </p>
                                <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-3 text-sm text-sky-200">
                                    Progress: {questionsAnswered}/3
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="glass rounded-xl p-6 mt-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <h3 className="text-lg font-semibold text-white mb-3">💡 Tips</h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li>• Answer honestly</li>
                            <li>• Don't overthink</li>
                            <li>• Set confidence accurately</li>
                            <li>• More data = better profile</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
