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

            // Add suggested questions
            const suggestions = [
                this.app.currentLanguage === 'es' ? '¿Qué es CKM?' : (this.app.currentLanguage === 'pt' ? 'O que é CKM?' : 'What is CKM?'),
                this.app.currentLanguage === 'es' ? '¿Cómo afecta la comida a mis riñones?' : (this.app.currentLanguage === 'pt' ? 'Como a comida afeta meus rins?' : 'How does food affect my kidneys?'),
                this.app.currentLanguage === 'es' ? '¿Con qué frecuencia debo revisar mi presión?' : (this.app.currentLanguage === 'pt' ? 'Com que frequência devo verificar minha pressão?' : 'How often should I check my blood pressure?')
            ];

            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'chat-suggestions';
            suggestionsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin-top: 12px; max-width: 85%; align-self: flex-start;';

            suggestions.forEach(text => {
                const btn = document.createElement('button');
                btn.className = 'suggestion-pill';
                btn.textContent = text;
                btn.style.cssText = 'text-align: left; background: var(--bg-card); border: 1px solid var(--accent-red); color: var(--accent-red); padding: 10px 16px; border-radius: 16px; font-size: 14px; cursor: pointer; transition: all 0.2s;';

                // Add hover effect
                btn.onmouseover = () => { btn.style.background = 'var(--accent-red-light)'; };
                btn.onmouseout = () => { btn.style.background = 'var(--bg-card)'; };

                // On click, formulate the question and send immediately
                btn.onclick = () => {
                    const input = document.getElementById('chat-input-sidebar');
                    if (input) {
                        input.value = text;
                        this.sendSidebarChatMessage();
                    }
                };

                suggestionsDiv.appendChild(btn);
            });

            container.appendChild(suggestionsDiv);

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
     * Clear Chat History
     */
    clearChat() {
        this.app.haptic(30);
        this.app.chatHistory = [];
        this.renderChatHistory();

        // Announce reset for screen readers
        const container = document.getElementById('chat-messages-sidebar');
        if (container) {
            container.setAttribute('aria-live', 'polite');
            const msg = document.createElement('div');
            msg.className = 'sr-only';
            msg.textContent = 'Chat history cleared. Starting a new conversation.';
            container.appendChild(msg);
        }
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

        // Custom Markdown & Source Parsing Function
        let formattedText = text;
        if (role === 'assistant') {
            // Escape HTML first to prevent XSS before parsing markdown
            formattedText = formattedText.replace(/</g, "&lt;").replace(/>/g, "&gt;");

            // Bold: **text**
            formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // Italic: *text*
            formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');

            // Links: [text](url)
            formattedText = formattedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

            // Unordered Lists: - item or * item
            formattedText = formattedText.replace(/^[\s]*[-*]\s+(.*)/gm, '<li>$1</li>');
            formattedText = formattedText.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

            // Line Breaks -> <br>
            formattedText = formattedText.replace(/\n\n/g, '<br><br>').replace(/\n(?!(<\/li>|<\/ul>))/g, '<br>');

            // Inline Citation Injection: [Source X]
            if (result && result.sources) {
                formattedText = formattedText.replace(/\[Source\s+(\d+)\]/g, (match, num) => {
                    const sourceIndex = parseInt(num) - 1;
                    if (result.sources[sourceIndex]) {
                        const sourceId = result.sources[sourceIndex].id;
                        return `<sup class="inline-citation" data-action="showSourcePreview" data-args="'${sourceId}'" style="color: var(--accent-red); cursor: pointer; font-weight: bold; background: var(--bg-card); padding: 1px 4px; border-radius: 4px; border: 1px solid var(--border-soft); margin: 0 2px;">${num}</sup>`;
                    }
                    return match;
                });
            }
        } else {
            // Basic HTML escaping for user messages
            formattedText = formattedText.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>');
        }

        // Use safeSetHTML instead of textContent to allow our parsed HTML
        DOMUtils.safeSetHTML(messageText, formattedText);
        messageDiv.appendChild(messageText);

        if (role === 'assistant' && result) {


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

    initChatInteraction() {
        const sidebar = document.getElementById('chat-sidebar');
        if (!sidebar) return;

        const header = sidebar.querySelector('.chat-sidebar-header');
        const resizer = sidebar.querySelector('.chat-resizer');
        if (!header || !resizer) return;

        // Clean up previous listeners
        if (this._chatCleanup) {
            this._chatCleanup();
        }

        let isDragging = false;
        let isResizing = false;

        let startX, startY;
        let startLeft, startTop;
        let startWidth, startHeight;
        let rafId = null;

        const getRect = () => sidebar.getBoundingClientRect();

        const onMouseDown = (e, mode) => {
            if (e.target.tagName === 'BUTTON') return;
            e.preventDefault();

            sidebar.classList.add('no-transition');

            startX = e.clientX;
            startY = e.clientY;

            const rect = getRect();
            startLeft = rect.left;
            startTop = rect.top;
            startWidth = rect.width;
            startHeight = rect.height;

            if (mode === 'drag') isDragging = true;
            if (mode === 'resize') isResizing = true;
        };

        const onMouseMove = (e) => {
            if (!isDragging && !isResizing) return;
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (isDragging) {
                    let newLeft = startLeft + deltaX;
                    let newTop = startTop + deltaY;

                    // Bounds Checking (Keep on screen)
                    newLeft = Math.max(0, Math.min(window.innerWidth - startWidth, newLeft));
                    newTop = Math.max(0, Math.min(window.innerHeight - startHeight, newTop));

                    sidebar.style.left = `${newLeft}px`;
                    sidebar.style.top = `${newTop}px`;
                    sidebar.style.right = 'auto'; // Detach from right
                    sidebar.style.bottom = 'auto';
                }

                if (isResizing) {
                    // Resizer is at TOP-LEFT.
                    // Dragging LEFT (negative delta) -> Width Increases.
                    // Dragging UP (negative delta) -> Height Increases.

                    // Check if floating (detached from right edge)
                    // If style.right is 'auto', it's floating/dragged.
                    // If style.right is not 'auto' (empty or set), it's likely docked (CSS default).
                    const isFloating = sidebar.style.right === 'auto';

                    // --- Width Logic ---
                    // Calculate desired width based on drag
                    let newWidth = startWidth - deltaX;
                    // Constraints: Min 300px, Max 90vw or 850px
                    const maxWidth = Math.min(window.innerWidth - 20, 850);
                    newWidth = Math.max(300, Math.min(maxWidth, newWidth));

                    sidebar.style.width = `${newWidth}px`;

                    if (isFloating) {
                        // If floating, increasing width must expand leftward by moving 'left' coordinate.
                        // Calculate effective change to keep right edge stable relative to box?
                        // No, handle is on LEFT. Mouse tracks Left Edge.
                        // So Left Edge should follow mouse (clamped by width).
                        // effectiveDeltaX = Change in width * -1.
                        const effectiveDeltaX = startWidth - newWidth;
                        sidebar.style.left = `${startLeft + effectiveDeltaX}px`;
                    }

                    // --- Height Logic ---
                    let newHeight = startHeight - deltaY;
                    // Constraints: Min 300px, Max Window Height
                    const maxHeight = window.innerHeight - 20;
                    newHeight = Math.max(300, Math.min(maxHeight, newHeight));

                    sidebar.style.height = `${newHeight}px`;

                    // Handle is at TOP. Mouse tracks Top Edge.
                    // Top coordinate must move.
                    const effectiveDeltaY = startHeight - newHeight;
                    sidebar.style.top = `${startTop + effectiveDeltaY}px`;
                }

                rafId = null;
            });
        };

        const onMouseUp = () => {
            if (isDragging || isResizing) {
                isDragging = false;
                isResizing = false;
                sidebar.classList.remove('no-transition');
                if (rafId) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            }
        };

        // Responsiveness: Ensure sidebar stays on screen if window resizes
        const onWindowResize = () => {
            const rect = getRect();
            const winW = window.innerWidth;
            const winH = window.innerHeight;

            // Clamp Width/Height if window got smaller
            if (rect.width > winW) {
                sidebar.style.width = `${winW - 20}px`;
            }
            if (rect.height > winH) {
                sidebar.style.height = `${winH - 20}px`;
                sidebar.style.top = '10px';
            }

            // Clamp Position (Push back onto screen)
            if (sidebar.style.right === 'auto') {
                const currentRect = getRect(); // Re-measure
                if (currentRect.right > winW) {
                    sidebar.style.left = `${winW - currentRect.width - 10}px`;
                }
                if (currentRect.left < 0) {
                    sidebar.style.left = '10px';
                }
            }

            // Re-measure vertical
            const currentRect = getRect();
            if (currentRect.bottom > winH) {
                // Push up
                sidebar.style.top = `${Math.max(0, winH - currentRect.height)}px`;
            }
        };

        const dragStart = (e) => onMouseDown(e, 'drag');
        const resizeStart = (e) => onMouseDown(e, 'resize');

        header.addEventListener('mousedown', dragStart);
        resizer.addEventListener('mousedown', resizeStart);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        window.addEventListener('resize', onWindowResize);

        const onSidebarClick = (e) => {
            if (sidebar.classList.contains('minimized')) {
                // Prevent interfering with other interactions if any
                this.minimizeChat();
            }
        };
        sidebar.addEventListener('click', onSidebarClick);

        this._chatCleanup = () => {
            header.removeEventListener('mousedown', dragStart);
            resizer.removeEventListener('mousedown', resizeStart);
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('resize', onWindowResize);
            sidebar.removeEventListener('click', onSidebarClick);
        };
    }

    snapToCorner(el) {
        const threshold = 150;
        const rect = el.getBoundingClientRect();
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        // Determine snap targets
        const snapX = rect.left < (winW - rect.right) ? 'left' : 'right';
        const snapY = rect.top < (winH - rect.bottom) ? 'top' : 'bottom';

        el.style.transition = 'all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';

        if (snapX === 'left') {
            el.style.left = '32px';
            el.style.right = 'auto';
        } else {
            el.style.left = (winW - rect.width - 32) + 'px';
        }

        if (snapY === 'top') {
            el.style.top = '100px'; // Avoid header
        } else {
            el.style.top = (winH - rect.height - 32) + 'px';
        }

        setTimeout(() => { el.style.transition = ''; }, 400);
    }
}
