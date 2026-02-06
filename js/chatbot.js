/**
 * Medical chatbot with RAG (Retrieval-Augmented Generation)
 * Includes safety guardrails and citation support
 *
 * SECURITY FIX: API calls now go through secure backend proxy
 */
const CHAT_API_BASE = '/api'; // Relative base path for production
// const CHAT_API_BASE = 'http://localhost:3001/api'; // Dev fallback

class MedicalChatbot {
    constructor(searchEngine, config = {}) {
        this.searchEngine = searchEngine;
        this.backendUrl = config.backendUrl || CHAT_API_BASE;
        this.conversationHistory = [];
        this.currentLanguage = 'en';
        this.sessionInitialized = false;
    }

    setLanguage(lang) {
        this.currentLanguage = lang;
    }

    /**
     * Initialize session with backend
     */
    async initSession() {
        if (this.sessionInitialized) return;

        try {
            const response = await fetch(`${this.backendUrl}/session/init`, {
                method: 'POST',
                credentials: 'include', // Include session cookie
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.sessionInitialized = true;
            }
        } catch (error) {
            console.warn('Could not initialize session with backend:', error);
            // Continue without backend - fallback mode
        }
    }

    async processQuery(userQuery) {
        // Safety check: block inappropriate queries
        const safetyMessage = this.getSafetyMessage(userQuery);
        if (safetyMessage) {
            return {
                response: safetyMessage,
                sources: [],
                confidence: 0,
                isSafetyBlock: true
            };
        }

        // Retrieve relevant context
        const retrievedChunks = this.searchEngine.searchWithLanguage(
            userQuery,
            this.currentLanguage,
            3 // Top 3 chunks for context
        );

        if (retrievedChunks.length === 0) {
            return {
                response: this.getNoResultsMessage(),
                sources: [],
                confidence: 0
            };
        }

        // Calculate confidence based on retrieval scores (simplified)
        const avgScore = retrievedChunks.reduce((sum, r) => sum + r.score, 0) / retrievedChunks.length;
        const confidence = Math.min(avgScore * 1000, 100);

        // Refuse to answer if confidence too low
        if (confidence < 40) {
            return {
                response: this.getLowConfidenceMessage(),
                sources: retrievedChunks.map(r => r.chunk),
                confidence: confidence
            };
        }

        try {
            // Context for RAG
            const context = this.buildContext(retrievedChunks);

            // Call secure backend API
            const response = await this.generateResponse(userQuery, context);

            const result = {
                response: response,
                sources: retrievedChunks.map(r => r.chunk),
                confidence: confidence
            };

            this.conversationHistory.push({
                query: userQuery,
                ...result,
                timestamp: new Date().toISOString()
            });

            return result;
        } catch (error) {
            console.error('Chat error:', error);
            return {
                response: this.getErrorMessage(),
                sources: [],
                confidence: 0
            };
        }
    }

    buildContext(chunks) {
        let context = 'Relevant educational content:\n\n';
        chunks.forEach((result, idx) => {
            const chunk = result.chunk;
            context += `[Source ${idx + 1}: ${chunk.metadata.moduleName}]\n`;
            context += chunk.content + '\n\n';
        });
        return context;
    }

    /**
     * Generate response using secure backend proxy
     * SECURITY FIX: No API key in client code
     */
    async generateResponse(query, context) {
        // Ensure session initialized
        await this.initSession();

        try {
            const response = await fetch(`${this.backendUrl}/chat`, {
                method: 'POST',
                credentials: 'include', // Include session cookie
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    context: context,
                    language: this.currentLanguage
                })
            });

            // Handle errors
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // If backend not available or API key not configured, use fallback
                if (response.status === 503 || errorData.fallback) {
                    return this.getFallbackMessage();
                }

                throw new Error(`Backend error: ${response.status}`);
            }

            const data = await response.json();

            // Validate response structure
            if (!data?.response) {
                throw new Error('Invalid response from backend');
            }

            return data.response;

        } catch (error) {
            console.error('Backend API Error:', error);

            // Graceful fallback if backend unavailable
            return this.getFallbackMessage();
        }
    }

    /**
     * Fallback message when backend is unavailable
     */
    getFallbackMessage() {
        const messages = {
            en: "I have found relevant information in our curriculum about this, but the AI connection is currently being configured. Please consult your physician at the clinic for specific details.\n\n" + this.getMedicalDisclaimer(),
            pt: "Encontrei informações relevantes em nosso currículo sobre isso, mas a conexão com a IA está sendo configurada. Por favor, consulte seu médico na clínica para detalhes específicos.\n\n" + this.getMedicalDisclaimer(),
            es: "He encontrado información relevante en nuestro currículo sobre esto, pero la conexión de IA se está configurando actualmente. Consulte a su médico en la clínica para obtener detalles específicos.\n\n" + this.getMedicalDisclaimer()
        };
        return messages[this.currentLanguage] || messages.en;
    }

    getSafetyMessage(query) {
        const unsafePatterns = [
            /do i have/i, /am i (having|dying)/i, /emergency/i,
            /how much.*take/i, /dosage/i, /replace.*doctor/i,
            /estou tendo/i, /emergência/i, /dosagem/i,
            /tengo/i, /estoy muriendo/i, /dosis/i
        ];

        if (unsafePatterns.some(p => p.test(query))) {
            const messages = {
                en: "I cannot provide medical diagnoses or emergency advice. Please consult your healthcare provider immediately or call emergency services if you are experiencing a medical emergency.",
                pt: "Não posso fornecer diagnósticos médicos ou conselhos de emergência. Por favor, consulte seu médico imediatamente ou ligue para os serviços de emergência se estiver passando por uma emergência médica.",
                es: "No puedo proporcionar diagnósticos médicos o consejos de emergencia. Por favor, consulte a su proveedor de atención médica de inmediato o llame a los servicios de emergencia si tiene una emergencia médica."
            };
            return messages[this.currentLanguage];
        }
        return null;
    }

    getNoResultsMessage() {
        const messages = {
            en: "I couldn't find information about that in our educational materials. Could you rephrase your question?",
            pt: "Não encontrei informações sobre isso em nossos materiais educacionais. Você poderia reformular sua pergunta?",
            es: "No pude encontrar información sobre eso en nuestros materiales educativos. ¿Podrías reformular tu pregunta?"
        };
        return messages[this.currentLanguage];
    }

    getLowConfidenceMessage() {
        const messages = {
            en: "I'm not confident I have the right information to answer that question from our curriculum. Please ask your doctor at the clinic.",
            pt: "Não tenho certeza se tenho as informações corretas para responder a essa pergunta a partir do nosso currículo. Por favor, pergunte ao seu médico na clínica.",
            es: "No estoy seguro de tener la información correcta para responder esa pregunta según nuestro currículo. Por favor, pregunte a su médico en la clínica."
        };
        return messages[this.currentLanguage];
    }

    getMedicalDisclaimer() {
        const disclaimers = {
            en: "⚕️ This information is for educational purposes only. Always consult your healthcare provider for medical advice.",
            pt: "⚕️ Esta informação é apenas para fins educacionais. Sempre consulte seu médico para aconselhamento médico.",
            es: "⚕️ Esta información es solo con fines educativos. Siempre consulte a su proveedor de atención médica para obtener asesoramiento médico."
        };
        return disclaimers[this.currentLanguage];
    }

    getErrorMessage() {
        const messages = {
            en: "Sorry, I'm having technical difficulties. Please try again soon.",
            pt: "Desculpe, estou com dificuldades técnicas. Por favor, tente novamente em breve.",
            es: "Lo siento, estoy teniendo dificultades técnicas. Por favor, inténtalo de nuevo pronto."
        };
        return messages[this.currentLanguage];
    }
}
