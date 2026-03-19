/**
 * Task Manager for CKM Navigator
 * Handles cancelable timeouts and task groups to prevent race conditions.
 */
class TaskManager {
    constructor() {
        this.timers = new Set();
        this.abortController = new AbortController();
    }

    /**
     * Set a timeout that is automatically tracked and can be cancelled.
     * @param {Function} callback 
     * @param {number} delay 
     * @returns {number} Timer ID
     */
    setTimeout(callback, delay) {
        if (this.abortController.signal.aborted) return null;

        const id = setTimeout(() => {
            if (!this.abortController.signal.aborted) {
                callback();
            }
            this.timers.delete(id);
        }, delay);

        this.timers.add(id);
        return id;
    }

    /**
     * Cancel all pending timers and signal abortion.
     */
    abortAll() {
        this.abortController.abort();

        // Clear all native timeouts
        for (const id of this.timers) {
            clearTimeout(id);
        }
        this.timers.clear();

        // Reset controller for next batch
        this.abortController = new AbortController();
    }

    /**
     * Get the current signal to pass to fetch requests
     */
    get signal() {
        return this.abortController.signal;
    }
}

// Export for global usage or module usage
window.TaskManager = TaskManager;
