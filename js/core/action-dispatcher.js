(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
    root.ActionDispatcher = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    function parseToken(rawToken) {
        const token = rawToken.trim();
        if (!token) return '';

        if ((token.startsWith("'") && token.endsWith("'")) ||
            (token.startsWith('"') && token.endsWith('"'))) {
            return token.slice(1, -1);
        }

        if (token === 'true') return true;
        if (token === 'false') return false;

        if (!Number.isNaN(Number(token)) && token !== '') {
            return Number(token);
        }

        return token;
    }

    function splitArgs(argsRaw) {
        if (!argsRaw || !argsRaw.trim()) return [];
        const parts = argsRaw.match(/(".*?"|'.*?'|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!parts) return [argsRaw];
        return parts.map(parseToken);
    }

    function dispatchAction(context, action, args, logger) {
        if (!context || typeof context[action] !== 'function') {
            logger.warn('[ActionDispatcher] Missing action handler', {
                action,
                args,
                reason: 'handler_not_found'
            });
            return;
        }

        try {
            context[action].apply(context, args);
        } catch (error) {
            logger.error('[ActionDispatcher] Handler execution failed', {
                action,
                args,
                reason: 'handler_exception',
                message: error && error.message ? error.message : String(error)
            });
        }
    }

    function attach(rootNode, getContext, options) {
        const logger = (options && options.logger) || console;
        const eventName = (options && options.eventName) || 'click';

        const onAction = function (e) {
            const trigger = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
            if (!trigger) return;

            const action = trigger.dataset.action;
            const argsRaw = trigger.dataset.args || '';
            const args = splitArgs(argsRaw);

            const context = typeof getContext === 'function' ? getContext() : null;
            dispatchAction(context, action, args, logger);
        };

        rootNode.addEventListener(eventName, onAction);

        return function cleanup() {
            rootNode.removeEventListener(eventName, onAction);
        };
    }

    return {
        splitArgs,
        parseToken,
        dispatchAction,
        attach
    };
});
