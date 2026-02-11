/**
 * ChatController - Manages the sidebar chat functionality
 * Extracted from main.js for better maintainability
 */
class ChatController {
    constructor(app) {
        this.app = app;
        // Use app's chatHistory for backward compatibility
        if (!this.app.chatHistory) {
            this.app.chatHistory = [];
        }
        this._chatOpenedBefore = this.app._chatOpenedBefore || false;
    }

    /**
     * Toggle chat sidebar open/closed
     */
    toggleChat(open) {
        const sidebar = document.getElementById('chat-sidebar');
        if (!sidebar) return;

        const chatItem = Array.from(this.app.navItems || []).find(i =>
            i.getAttribute('onclick')?.includes('toggleChat') ||
            i.getAttribute('data-action') === 'toggleChat'
        );
        const chatIcon = document.querySelector('.chat-toggle-icon');

        const shouldOpen = open !== undefined ? open : !sidebar.classList.contains('open');

        if (shouldOpen) {
            sidebar.classList.remove('hidden');
            sidebar.classList.remove('minimized');
            sidebar.setAttribute('aria-hidden', 'false');

            if (sidebar.dataset.prevWidth) sidebar.style.width = sidebar.dataset.prevWidth;
            else sidebar.style.removeProperty('width');
            if (sidebar.dataset.prevHeight) sidebar.style.height = sidebar.dataset.prevHeight;
            else sidebar.style.removeProperty('height');

            setTimeout(() => {
                sidebar.classList.add('open');
                const input = sidebar.querySelector('input');
                if (input) input.focus();
            }, 10);

            if (!this._chatOpenedBefore) {
                sidebar.classList.add('first-open');
                this._chatOpenedBefore = true;
            }

            if (chatItem) {
                chatItem.classList.add('active');
                chatItem.setAttribute('aria-expanded', 'true');
            }
            if (chatIcon) chatIcon.classList.add('active');

            this.renderChatHistory();
            this.app.trapFocus(sidebar);
            return;
        }

        sidebar.classList.remove('open');
        sidebar.setAttribute('aria-hidden', 'true');
        sidebar.classList.remove('minimized');

        if (sidebar.dataset.prevWidth) sidebar.style.width = sidebar.dataset.prevWidth;
        else sidebar.style.removeProperty('width');
        if (sidebar.dataset.prevHeight) sidebar.style.height = sidebar.dataset.prevHeight;
        else sidebar.style.removeProperty('height');

        if (chatItem) {
            chatItem.classList.remove('active');
            chatItem.setAttribute('aria-expanded', 'false');
        }
        if (chatIcon) chatIcon.classList.remove('active');

        if (this.app._focusTrapHandler) {
            if (typeof this.app._focusTrapHandler === 'function') {
                this.app._focusTrapHandler();
            }
            this.app._focusTrapHandler = null;
        }

        setTimeout(() => {
            if (!sidebar.classList.contains('open')) {
                sidebar.classList.add('hidden');
            }
        }, 400);
    }

    /**
     * Render chat history from stored messages
     */
    renderChatHistory() {
        const container = document.getElementById('chat-messages-sidebar');
        if (!container) return;

        DOMUtils.clearChildren(container);

        if (this.app.chatHistory.length === 0) {
            this.appendChatMessage('assistant', this.app.translations[this.app.currentLanguage].chat.welcome, true);
        } else {
            this.app.chatHistory.forEach(msg => {
                this.appendChatMessage(msg.role, msg.content, false);
            });
        }

        container.scrollTop = container.scrollHeight;
    }

    /**
     * Append a chat message to the UI
     */
    appendChatMessage(role, text, persist = true, result = null) {
        if (persist) {
            this.app.chatHistory.push({ role, content: text });
        }
        this.renderSidebarChatSnippet(role, text, result, false);
    }

    /**
     * Minimize/restore the chat sidebar
     */
    minimizeChat() {
        const sidebar = document.getElementById('chat-sidebar');
        if (!sidebar) return;

        const isMinimized = sidebar.classList.contains('minimized');

        if (isMinimized) {
            sidebar.classList.remove('minimized');

            if (sidebar.dataset.prevWidth) sidebar.style.width = sidebar.dataset.prevWidth;
            else sidebar.style.width = '';

            if (sidebar.dataset.prevHeight) sidebar.style.height = sidebar.dataset.prevHeight;
            else sidebar.style.height = '';
        } else {
            sidebar.dataset.prevWidth = sidebar.style.width;
            sidebar.dataset.prevHeight = sidebar.style.height;
            sidebar.classList.add('minimized');
        }
    }

    /**
     * Handle Enter key in chat input
     */
    handleSidebarChatKey(e) {
        if (e.key === 'Enter') this.sendSidebarChatMessage();
    }

    /**
     * Send a chat message to the backend
     */
    async sendSidebarChatMessage() {
        const input = document.getElementById('chat-input-sidebar');
        const text = input.value.trim();
        if (!text) return;

        this.app.haptic(40);
        this.appendChatMessage('user', text, true);
        input.value = '';

        const container = document.getElementById('chat-messages-sidebar');
        const loadingId = 'loading-' + Date.now();
        container.insertAdjacentHTML('beforeend', `
            <div id="${loadingId}" class="message assistant typing-indicator">
                <span></span><span></span><span></span>
            </div>
        `);
        container.scrollTop = container.scrollHeight;

        try {
            const result = await this.app.chatbot.processQuery(text);

            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();

            this.appendChatMessage('assistant', result.response, true, result);
        } catch (error) {
            const loader = document.getElementById(loadingId);
            if (loader) loader.remove();
            this.appendChatMessage('assistant', "I'm sorry, I'm having trouble connecting right now.", true);
        }
    }

    /**
     * Render individual chat message snippet
     */
    renderSidebarChatSnippet(role, text, result = null, persist = true) {
        const container = document.getElementById('chat-messages-sidebar');
        if (!container) return;

        if (persist) {
            this.app.chatHistory.push({ role, content: text });
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = text;
        messageDiv.appendChild(messageText);

        if (role === 'assistant' && result) {
            // Confidence Bar
            if (result.confidence > 0) {
                const confidenceContainer = document.createElement('div');
                confidenceContainer.className = 'confidence-indicator';
                confidenceContainer.style.cssText = 'margin-top: 12px; font-size: 11px; opacity: 0.8;';

                const barBg = document.createElement('div');
                barBg.style.cssText = 'width: 100%; height: 4px; background: var(--bg-depth); border-radius: 2px; overflow: hidden; margin-bottom: 4px;';

                const barFill = document.createElement('div');
                barFill.style.cssText = `width: ${result.confidence}%; height: 100%; background: var(--accent-red); transition: width 1s ease-out;`;

                barBg.appendChild(barFill);
                confidenceContainer.appendChild(barBg);

                const label = document.createElement('span');
                label.textContent = `Confidence: ${Math.round(result.confidence)}%`;
                confidenceContainer.appendChild(label);

                messageDiv.appendChild(confidenceContainer);
            }

            // Sources
            if (result.sources && result.sources.length > 0) {
                const sourcesContainer = document.createElement('div');
                sourcesContainer.className = 'message-sources';
                sourcesContainer.style.cssText = 'margin-top: 12px; border-top: 1px solid var(--border-soft); padding-top: 8px;';

                const title = document.createElement('div');
                title.style.cssText = 'font-size: 10px; font-weight: 800; text-transform: uppercase; opacity: 0.5; margin-bottom: 6px;';
                title.textContent = 'Sources:';
                sourcesContainer.appendChild(title);

                const pillsContainer = document.createElement('div');
                pillsContainer.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px;';

                result.sources.forEach((source, idx) => {
                    const btn = document.createElement('button');
                    btn.className = 'source-pill';
                    btn.setAttribute('data-action', 'showSourcePreview');
                    btn.setAttribute('data-args', `'${source.id}'`);
                    btn.style.cssText = 'font-size: 11px; padding: 4px 10px; border-radius: 12px; border: 1px solid var(--border-soft); background: var(--bg-card); cursor: pointer;';
                    btn.textContent = `[${idx + 1}] ${source.metadata.moduleName}`;
                    pillsContainer.appendChild(btn);
                });

                sourcesContainer.appendChild(pillsContainer);
                messageDiv.appendChild(sourcesContainer);
            }
        }

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }

    /**
     * Show source preview modal
     */
    showSourcePreview(sourceId) {
        const chunk = this.app.searchEngine.chunks.find(c => c.id === sourceId);
        if (!chunk) return;

        this.app.haptic(30);
        DOMUtils.safeSetHTML(this.app.modalBody, `
            <div style="padding: 12px;">
                <div class="card-tag">${chunk.metadata.category}</div>
                <h3 style="margin-bottom: 16px;">${chunk.metadata.moduleName}</h3>
                <div style="background: var(--bg-component); padding: 24px; border-radius: 16px; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                    ${chunk.content}
                </div>
                <div style="margin-top: 24px;">
                <button class="btn btn-primary" style="width: 100%;" data-action="closeModal" data-args="">
                    ${this.app.currentLanguage === 'es' ? 'Entendido' : (this.app.currentLanguage === 'pt' ? 'Entendido' : 'Got it')}
                </button>
            </div>
            </div>
        `);
        this.app.modalOverlay.classList.remove('hidden');
    }
}
