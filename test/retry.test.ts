import test from 'node:test';
import assert from 'node:assert';
import { retry } from '../src/lib/utils/retry';

test('retry returns the first successful result', async () => {
  let calls = 0;
  const result = await retry(async () => {
    calls++;
    if (calls < 3) throw new Error('fail');
    return 'ok';
  }, { delayMs: 1 });

  assert.strictEqual(result, 'ok');
  assert.strictEqual(calls, 3);
});

test('retry gives up after maxAttempts', async () => {
  let calls = 0;
  await assert.rejects(
    retry(async () => {
      calls++;
      throw new Error('always fails');
    }, { maxAttempts: 2, delayMs: 1 }),
    /always fails/
  );
  assert.strictEqual(calls, 2);
});

test('retry stops early when shouldRetry returns false', async () => {
  let calls = 0;
  await assert.rejects(
    retry(async () => {
      calls++;
      throw new Error('403');
    }, { delayMs: 1, shouldRetry: () => false })
  );
  assert.strictEqual(calls, 1);
});
