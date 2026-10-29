
const test = require('node:test');
const assert = require('node:assert/strict');

const { parseReceivedMessage, parseSentMessage } = require('./parser');

test('parses a valid received-money message', () => {
  const message =
    'QHK7AB12CD Confirmed. You have received Ksh1,500.00 from JOHN DOE. on 27/10/26 at 2:30 PM.';

  const result = parseReceivedMessage(message);

  assert.equal(result.transactionDate.getFullYear(),2026);
  assert.equal(result.reference, 'QHK7AB12CD');
  assert.equal(result.type, 'received');
  assert.equal(result.amount, 1500);
  assert.equal(result.sender, 'JOHN DOE');
  assert.equal(result.recipient, undefined);
});

test('returns null for an unrelated message', () => {
  const result = parseReceivedMessage('Hello, how are you?');

  assert.equal(result, null);
});

test('parses an amount with commas and decimals', () => {
  const message =
    'QHK7AB12EF Confirmed. You have received Ksh25,000.50 from JANE DOE. on 27/10/26 at 3:00 PM.';

  const result = parseReceivedMessage(message);

  assert.equal(result.amount, 25000.5);
});

test("parses an outgoing M-PESA transfer", () => {
  const message =
    "UJQ3I0DPT9 Confirmed. Ksh600.00 sent to SAMWEL MATUTHU 0722943735 on 26/10/26 at 12:32 PM.";

  const result = parseSentMessage(message);

  assert.equal(result.reference, "UJQ3I0DPT9");
  assert.equal(result.type, "sent");
  assert.equal(result.amount, 600);
  assert.equal(result.recipient, "SAMWEL MATUTHU");
  assert.equal(result.sender, undefined);
  assert.equal(result.transactionDate.getDate(), 26);
});

test("converts Kenyan transaction time to UTC", () => {
  const message =
    "UJQ3I0DPT9 Confirmed. Ksh600.00 sent to SAMWEL MATUTHU 0722943735 on 26/10/26 at 12:32 PM.";

  const result = parseSentMessage(message);

  assert.equal(
    result.transactionDate.toISOString(),
    "2026-10-26T09:32:00.000Z"
  );
});


test("rejects an outgoing transfer with an impossible date", () => {
  const message =
    "UJQ3I0DPT9 Confirmed. Ksh600.00 sent to SAMWEL MATUTHU 0722943735 on 31/02/26 at 12:32 PM.";

  const result = parseSentMessage(message);

  assert.equal(result, null);
});


test("rejects an outgoing transfer with an invalid time", () => {
  const message =
    "UJQ3I0DPT9 Confirmed. Ksh600.00 sent to SAMWEL MATUTHU 0722943735 on 26/10/26 at 13:75 PM.";

  const result = parseSentMessage(message);

  assert.equal(result, null);
});

test("rejects an hour outside the 12-hour clock range", () => {
  const message =
    "UJQ3I0DPT9 Confirmed. Ksh600.00 sent to SAMWEL MATUTHU 0722943735 on 26/10/26 at 13:15 PM.";

  assert.equal(parseSentMessage(message), null);
});


test("rejects an outgoing transfer with a malformed amount", () => {
  const message =
    "UJQ3I0DPT9 Confirmed. KshABC.00 sent to SAMWEL MATUTHU 0722943735 on 26/10/26 at 12:32 PM.";

  assert.equal(parseSentMessage(message), null);
});


test("rejects an outgoing transfer with a zero amount", () => {
  const message =
    "UJQ3I0DPT9 Confirmed. Ksh0.00 sent to SAMWEL MATUTHU 0722943735 on 26/10/26 at 12:32 PM.";

  assert.equal(parseSentMessage(message), null);
});

test("rejects received money with a zero amount", () => {
  const message =
    "QHK7AB12CD Confirmed. You have received Ksh0.00 from JOHN DOE. on 27/10/26 at 2:30 PM.";

  assert.equal(parseReceivedMessage(message), null);
});