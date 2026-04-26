import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStatus, updateStatusInContent, addItemToSection } from '../src/commons/fs-utils';

// ─── readStatus ───────────────────────────────────────────────────────────────

test('readStatus: reads value after ## Status', () => {
    const content = '# Title\n\n## Status\ndone\n';
    assert.equal(readStatus(content), 'done');
});

test('readStatus: skips blank lines between heading and value', () => {
    const content = '## Status\n\nin-progress\n';
    assert.equal(readStatus(content), 'in-progress');
});

test('readStatus: returns empty string when no Status section', () => {
    const content = '# Title\n\n## Goals\n- something\n';
    assert.equal(readStatus(content), '');
});

test('readStatus: stops at next heading', () => {
    const content = '## Status\n\n## Next Section\n';
    assert.equal(readStatus(content), '');
});

// ─── updateStatusInContent ────────────────────────────────────────────────────

test('updateStatusInContent: replaces existing status value', () => {
    const content = '# Title\n\n## Status\nplanned\n';
    const result = updateStatusInContent(content, 'done');
    assert.ok(result.includes('## Status\ndone'));
    assert.ok(!result.includes('planned'));
});

test('updateStatusInContent: replaces value when blank line present', () => {
    const content = '## Status\n\nplanned\n';
    const result = updateStatusInContent(content, 'in-progress');
    assert.ok(result.includes('in-progress'));
    assert.ok(!result.includes('planned'));
});

test('updateStatusInContent: inserts Status section when absent', () => {
    const content = '# Title\n\n## Goals\n- goal 1\n';
    const result = updateStatusInContent(content, 'planned');
    assert.ok(result.includes('## Status\nplanned'));
});

test('updateStatusInContent: inserts before next heading when no value line', () => {
    const content = '## Status\n## Results\n';
    const result = updateStatusInContent(content, 'done');
    assert.ok(result.includes('done'));
    const statusIdx = result.indexOf('## Status');
    const resultsIdx = result.indexOf('## Results');
    assert.ok(statusIdx < resultsIdx);
});

test('updateStatusInContent: preserves content after Status section', () => {
    const content = '## Status\nplanned\n\n## Results\n- r1\n';
    const result = updateStatusInContent(content, 'done');
    assert.ok(result.includes('## Results\n- r1'));
});

// ─── addItemToSection ─────────────────────────────────────────────────────────

test('addItemToSection: appends to existing section', () => {
    const content = '## Goals\n- existing goal\n\n## Status\ndone\n';
    const result = addItemToSection(content, 'Goals', 'new goal');
    assert.ok(result.includes('- existing goal\n- new goal'));
});

test('addItemToSection: creates section before ## Status when absent', () => {
    const content = '# Title\n\n## Status\ndone\n';
    const result = addItemToSection(content, 'Blockers', 'BLK_1: something');
    const blockersIdx = result.indexOf('## Blockers');
    const statusIdx = result.indexOf('## Status');
    assert.ok(blockersIdx !== -1, 'Blockers section should exist');
    assert.ok(blockersIdx < statusIdx, 'Blockers should appear before Status');
});

test('addItemToSection: formats linked item as [CODE](url): rest', () => {
    const content = '## Blockers\n\n## Status\ndone\n';
    const result = addItemToSection(content, 'Blockers', 'BLK_1: API not ready', 'https://example.com/1');
    assert.ok(result.includes('- [BLK_1](https://example.com/1): API not ready'));
});

test('addItemToSection: plain item (no link) uses simple bullet', () => {
    const content = '## Goals\n\n## Status\nplanned\n';
    const result = addItemToSection(content, 'Goals', 'achieve something');
    assert.ok(result.includes('- achieve something'));
});

test('addItemToSection: case-insensitive section match', () => {
    const content = '## goals\n- g1\n\n## Status\nplanned\n';
    const result = addItemToSection(content, 'Goals', 'g2');
    assert.ok(result.includes('- g1\n- g2'));
});

test('addItemToSection: appends to non-empty section at end', () => {
    const content = '## Tasks\n- task 1\n- task 2\n\n## Status\ndone\n';
    const result = addItemToSection(content, 'Tasks', '[task-3](task-3.md)');
    assert.ok(result.includes('- task 2\n- [task-3](task-3.md)'));
});
