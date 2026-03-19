const test = require('node:test');
const assert = require('node:assert/strict');

const ActionDispatcher = require('../js/core/action-dispatcher.js');

test('splitArgs parses strings, numbers, booleans and quoted values', () => {
    const args = ActionDispatcher.splitArgs("'education', 3, true, false, \"hello world\"");
    assert.deepEqual(args, ['education', 3, true, false, 'hello world']);
});

test('splitArgs handles empty and malformed input safely', () => {
    assert.deepEqual(ActionDispatcher.splitArgs(''), []);
    assert.deepEqual(ActionDispatcher.splitArgs('   '), []);
    assert.deepEqual(ActionDispatcher.splitArgs('abc,,def'), ['abc', 'def']);
});

test('dispatchAction ignores missing handlers and executes existing handler', () => {
    const calls = [];
    const context = {
        foo(a, b) {
            calls.push([a, b]);
        }
    };

    const warnings = [];
    const logger = {
        warn(msg, payload) {
            warnings.push({ msg, payload });
        },
        error() {}
    };

    ActionDispatcher.dispatchAction(context, 'foo', [1, 2], logger);
    assert.deepEqual(calls, [[1, 2]]);

    ActionDispatcher.dispatchAction(context, 'missingHandler', [], logger);
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0].payload.reason, 'handler_not_found');
});
