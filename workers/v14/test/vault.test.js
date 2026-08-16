import test from 'node:test';
import assert from 'node:assert/strict';
import {createVault} from '../src/vault.js';

const key = Buffer.alloc(32, 7).toString('base64');

test('encrypts and decrypts with context-bound AES-GCM', async () => {
  const vault=createVault(key);
  const ciphertext=await vault.seal('sensitive-token','connection:tenant:owner:mail');
  assert.notEqual(ciphertext.includes('sensitive-token'),true);
  assert.equal(await vault.open(ciphertext,'connection:tenant:owner:mail'),'sensitive-token');
  await assert.rejects(vault.open(ciphertext,'connection:tenant:assistant:mail'));
});

test('produces stable non-reversible hashes', async () => {
  const vault=createVault(key);
  const first=await vault.hash('tenant:provider:id');
  const second=await vault.hash('tenant:provider:id');
  assert.equal(first,second);
  assert.notEqual(first,'tenant:provider:id');
});
