import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollupStatuses, isValidStatus, VALID_STATUSES } from '../src/commons/status';

test('rollupStatuses: empty array returns planned', () => {
    assert.equal(rollupStatuses([]), 'planned');
});

test('rollupStatuses: all done returns done', () => {
    assert.equal(rollupStatuses(['done', 'done', 'done']), 'done');
});

test('rollupStatuses: any blocked returns blocked', () => {
    assert.equal(rollupStatuses(['done', 'blocked', 'in-progress']), 'blocked');
});

test('rollupStatuses: blocked takes priority over in-progress', () => {
    assert.equal(rollupStatuses(['in-progress', 'blocked']), 'blocked');
});

test('rollupStatuses: any in-progress (no blocked) returns in-progress', () => {
    assert.equal(rollupStatuses(['done', 'in-progress', 'planned']), 'in-progress');
});

test('rollupStatuses: mix of planned and done returns planned', () => {
    assert.equal(rollupStatuses(['planned', 'done']), 'planned');
});

test('rollupStatuses: single planned returns planned', () => {
    assert.equal(rollupStatuses(['planned']), 'planned');
});

test('rollupStatuses: single in-progress returns in-progress', () => {
    assert.equal(rollupStatuses(['in-progress']), 'in-progress');
});

test('rollupStatuses: single blocked returns blocked', () => {
    assert.equal(rollupStatuses(['blocked']), 'blocked');
});

test('rollupStatuses: single done returns done', () => {
    assert.equal(rollupStatuses(['done']), 'done');
});

test('rollupStatuses: empty string treated as planned', () => {
    assert.equal(rollupStatuses(['done', '']), 'planned');
});

test('isValidStatus: accepts all valid statuses', () => {
    for (const s of VALID_STATUSES) {
        assert.ok(isValidStatus(s), `expected ${s} to be valid`);
    }
});

test('isValidStatus: rejects unknown values', () => {
    assert.equal(isValidStatus('unknown'), false);
    assert.equal(isValidStatus(''), false);
    assert.equal(isValidStatus('Done'), false);
    assert.equal(isValidStatus('IN-PROGRESS'), false);
});
