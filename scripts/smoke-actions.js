#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MAIN_JS_PATH = path.join(ROOT, 'main.js');

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function walkFiles(dirPath, out = []) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const nextPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            walkFiles(nextPath, out);
            continue;
        }
        out.push(nextPath);
    }
    return out;
}

function parseAllowlist(mainSource) {
    const match = mainSource.match(/const\s+REFACTOR_ACTION_ALLOWLIST\s*=\s*\[([\s\S]*?)\];/);
    if (!match) {
        throw new Error('Could not parse REFACTOR_ACTION_ALLOWLIST from main.js');
    }
    const entries = [];
    const regex = /'([^']+)'/g;
    let m;
    while ((m = regex.exec(match[1])) !== null) {
        entries.push(m[1]);
    }
    return new Set(entries);
}

function parseAppMethods(mainSource) {
    const objectStart = mainSource.indexOf('const app = {');
    const objectEnd = mainSource.lastIndexOf('document.addEventListener(');

    if (objectStart === -1 || objectEnd === -1 || objectEnd <= objectStart) {
        throw new Error('Could not locate app object boundaries in main.js');
    }

    const appObjectSource = mainSource.slice(objectStart, objectEnd);
    const methods = new Set();
    const methodRegex = /(?:^|\n)\s*(?:async\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*\{/g;
    let match;

    while ((match = methodRegex.exec(appObjectSource)) !== null) {
        methods.add(match[1]);
    }

    return methods;
}

function parseActionsFromSource(source) {
    const actions = new Set();
    const actionRegex = /data-action="([^"]+)"/g;
    let match;

    while ((match = actionRegex.exec(source)) !== null) {
        const raw = match[1];
        if (!raw) continue;

        if (raw.includes('${')) {
            const literalRegex = /'([A-Za-z_$][A-Za-z0-9_$]*)'/g;
            let literalMatch;
            while ((literalMatch = literalRegex.exec(raw)) !== null) {
                actions.add(literalMatch[1]);
            }
            continue;
        }

        actions.add(raw);
    }

    return actions;
}

function hasMalformedMarkup(source) {
    const malformedTagRegex = /<\s+(div|h[1-6]|strong)\b/;
    const malformedDataAttrRegex = /data\s*-\s*args/;
    return malformedTagRegex.test(source) || malformedDataAttrRegex.test(source);
}

function setDifference(a, b) {
    const diff = [];
    for (const value of a) {
        if (!b.has(value)) {
            diff.push(value);
        }
    }
    return diff.sort();
}

function collectActionFiles() {
    const files = [];
    files.push(path.join(ROOT, 'index.html'));
    files.push(path.join(ROOT, 'main.js'));

    const jsRoot = path.join(ROOT, 'js');
    for (const filePath of walkFiles(jsRoot)) {
        if (filePath.endsWith('.js')) {
            files.push(filePath);
        }
    }
    return files;
}

function run() {
    const mainSource = readFile(MAIN_JS_PATH);
    const allowlist = parseAllowlist(mainSource);
    const appMethods = parseAppMethods(mainSource);

    const actionFiles = collectActionFiles();
    const referencedActions = new Set();
    for (const filePath of actionFiles) {
        const source = readFile(filePath);
        const actions = parseActionsFromSource(source);
        for (const action of actions) {
            referencedActions.add(action);
        }
    }

    const missingAllowlistHandlers = setDifference(allowlist, appMethods);
    const missingReferencedHandlers = setDifference(referencedActions, appMethods);

    const malformedMainMarkup = hasMalformedMarkup(mainSource);

    if (missingAllowlistHandlers.length === 0 &&
        missingReferencedHandlers.length === 0 &&
        !malformedMainMarkup) {
        console.log('smoke-actions: PASS');
        console.log(`checked allowlist actions: ${allowlist.size}`);
        console.log(`checked referenced actions: ${referencedActions.size}`);
        return 0;
    }

    console.error('smoke-actions: FAIL');
    if (missingAllowlistHandlers.length > 0) {
        console.error('missing handlers for allowlist actions:', missingAllowlistHandlers.join(', '));
    }
    if (missingReferencedHandlers.length > 0) {
        console.error('missing handlers for referenced actions:', missingReferencedHandlers.join(', '));
    }
    if (malformedMainMarkup) {
        console.error('malformed tag/attribute spacing detected in main.js');
    }
    return 1;
}

process.exitCode = run();
