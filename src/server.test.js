const request = require('supertest');
const { test } = require('node:test');
const assert = require('node:assert');

process.env.WEBHOOK_SECRET = 'test-webhook-secret';

const app = require('../server');

test('Rejects requests without a webhook secret', async () => {
  const response = await request(app)
    .post('/webhook')
    .send({ message: 'test message' });

  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.body.error, 'Unauthorized request');
});

test('Rejects requests with an incorrect webhook secret', async () => {
  const response = await request(app)
    .post('/webhook')
    .set('x-webhook-secret', 'wrong-secret')
    .send({ message: 'test message' });

  assert.strictEqual(response.status, 401);
  assert.strictEqual(response.body.error, 'Unauthorized request');
});

test('Allows requests with the correct secret to reach the parser', async () => {
  const response = await request(app)
    .post('/webhook')
    .set('x-webhook-secret', 'test-webhook-secret')
    .send({ message: 'test message' });

  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.error, 'Could not parse M-PESA message');
});