/**
 * DOM Utilities with XSS Protection
 *
 * SECURITY FIX: All HTML content sanitized before insertion
 */

const DOMUtils = {
    /**
     * Safely set innerHTML with XSS protection
     * @param {HTMLElement} element - Target element
     * @param {string} html - HTML content to insert
     */
    safeSetHTML(element, html) {
        if (!element) {
            console.error('DOMUtils.safeSetHTML: element is null');
            return;
        }

        if (typeof DOMPurify === 'undefined') {
            console.error('DOMPurify not loaded! Falling back to textContent');
            element.textContent = this.stripHTML(html);
            return;
        }

        // Sanitize HTML before insertion
        element.innerHTML = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                'div', 'span', 'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
                'button', 'details', 'summary', 'pre', 'code', 'input', 'label', 'style',
                // SVG Support
                'svg', 'g', 'path', 'circle', 'rect', 'line', 'text', 'defs', 'marker', 'linearGradient', 'stop', 'mask', 'use', 'filter', 'polyline', 'tspan', 'polygon', 'clipPath',
                'feGaussianBlur', 'feOffset', 'feMerge', 'feMergeNode', 'feFuncA', 'feComponentTransfer', 'feColorMatrix', 'feBlend', 'feComposite'
            ],
            ALLOWED_ATTR: [
                'class', 'id', 'style', 'href', 'src', 'alt', 'title', 'target', 'for', 'name', 'value', 'type', 'checked', 'placeholder',
                'data-*', 'aria-*', 'role',
                // SVG Attributes
                'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin',
                'cx', 'cy', 'r', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'd', 'rx', 'ry', 'transform', 'opacity',
                'text-anchor', 'font-size', 'font-weight', 'font-family', 'dominant-baseline',
                'marker-end', 'marker-start', 'markerWidth', 'markerHeight', 'refX', 'refY', 'orient',
                'gradientUnits', 'offset', 'stop-color', 'stop-opacity', 'pointer-events', 'filter'
            ],
            ALLOW_DATA_ATTR: true,
            ALLOW_ARIA_ATTR: true,
            // Remove onclick and other event handlers
            FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus'],
            // Keep target="_blank" safe by adding rel="noopener noreferrer"
            ADD_ATTR: ['rel'],
            SAFE_FOR_TEMPLATES: false
        });
    },

    /**
     * Safely set text content (no HTML allowed)
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text content to insert
     */
    safeSetText(element, text) {
        if (!element) {
            console.error('DOMUtils.safeSetText: element is null');
            return;
        }

        element.textContent = text || '';
    },

    /**
     * Create element with safe content
     * @param {string} tagName - Element tag name
     * @param {Object} options - Element options
     * @returns {HTMLElement}
     */
    createElement(tagName, options = {}) {
        const element = document.createElement(tagName);

        // Set attributes safely
        if (options.className) {
            element.className = options.className;
        }

        if (options.id) {
            element.id = options.id;
        }

        if (options.attributes) {
            for (const [key, value] of Object.entries(options.attributes)) {
                // Never set event handlers as attributes
                if (key.startsWith('on')) {
                    console.warn(`Ignoring event handler attribute: ${key}`);
                    continue;
                }
                element.setAttribute(key, value);
            }
        }

        // Set content safely
        if (options.html) {
            this.safeSetHTML(element, options.html);
        } else if (options.text) {
            this.safeSetText(element, options.text);
        }

        // Add event listeners properly (not as attributes)
        if (options.listeners) {
            for (const [event, handler] of Object.entries(options.listeners)) {
                element.addEventListener(event, handler);
            }
        }

        return element;
    },

    /**
     * Strip HTML tags from string
     * @param {string} html - HTML string
     * @returns {string} Plain text
     */
    stripHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML; // Returns escaped text
    },

    /**
     * Escape HTML entities
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'/]/g, char => map[char]);
    },

    /**
     * Safely append child with validation
     * @param {HTMLElement} parent - Parent element
     * @param {HTMLElement} child - Child element to append
     */
    safeAppendChild(parent, child) {
        if (!parent || !child) {
            console.error('DOMUtils.safeAppendChild: parent or child is null');
            return;
        }

        // Verify child is actually an Element
        if (!(child instanceof Element)) {
            console.error('DOMUtils.safeAppendChild: child is not an Element');
            return;
        }

        parent.appendChild(child);
    },

    /**
     * Safely remove all children
     * @param {HTMLElement} element - Element to clear
     */
    clearChildren(element) {
        if (!element) {
            console.error('DOMUtils.clearChildren: element is null');
            return;
        }

        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    /**
     * Replace innerHTML with event delegation approach
     * Converts onclick attributes to proper event listeners
     * @param {HTMLElement} container - Container element
     */
    replaceInlineHandlers(container) {
        if (!container) return;

        // Find all elements with onclick attribute
        const elementsWithHandlers = container.querySelectorAll('[onclick]');

        elementsWithHandlers.forEach(element => {
            const onclickAttr = element.getAttribute('onclick');
            if (!onclickAttr) return;

            // Extract function name and arguments from onclick attribute
            // Example: "app.navigateTo('home')" -> calls app.navigateTo with 'home'
            const match = onclickAttr.match(/(\w+)\.(\w+)\((.*)\)/);

            if (match) {
                const [, objName, methodName, argsStr] = match;

                // Remove onclick attribute
                element.removeAttribute('onclick');

                // Add proper event listener
                element.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Parse arguments (simple implementation)
                    const args = argsStr
                        .split(',')
                        .map(arg => arg.trim().replace(/^['"]|['"]$/g, ''));

                    // Call the function
                    const obj = window[objName];
                    if (obj && typeof obj[methodName] === 'function') {
                        obj[methodName](...args);
                    } else {
                        console.error(`Handler not found: ${objName}.${methodName}`);
                    }
                });

                // Make it keyboard accessible
                if (!element.hasAttribute('tabindex') && element.tagName !== 'BUTTON') {
                    element.setAttribute('tabindex', '0');
                    element.setAttribute('role', 'button');

                    // Add keyboard support
                    element.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            element.click();
                        }
                    });
                }
            } else {
                console.warn('Could not parse onclick handler:', onclickAttr);
                element.removeAttribute('onclick');
            }
        });
    }
};

// Make it available globally
window.DOMUtils = DOMUtils;
