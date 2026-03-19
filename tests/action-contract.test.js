const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test('action contract smoke check passes', () => {
    const scriptPath = path.join(__dirname, '..', 'scripts', 'smoke-actions.js');
    const result = spawnSync(process.execPath, [scriptPath], {
        encoding: 'utf8'
    });

    assert.equal(
        result.status,
        0,
        `smoke-actions failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
});
