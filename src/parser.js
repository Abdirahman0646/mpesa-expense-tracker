
function parseKenyanDate(dateString, timeString) {
  const [day, month, year] = dateString.split("/").map(Number);
  const [time, period] = timeString.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
  return null;
}

  if (period.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  }

  if (period.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  const fullYear = 2000 + year;

  // Validate the original Kenyan calendar date.
  const calendarCheck = new Date(
    Date.UTC(fullYear, month - 1, day)
  );

  if (
    month < 1 ||
    month > 12 ||
    calendarCheck.getUTCFullYear() !== fullYear ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day
  ) {
    return null;
  }

  // Kenya is UTC+3. Convert Kenyan local time to UTC.
  return new Date(
    Date.UTC(fullYear, month - 1, day, hours - 3, minutes)
  );
}

function parseReceivedMessage(message) {
  const amountMatch = message.match(/received Ksh([\d,]+\.\d{2})/i);
  const referenceMatch = message.match(/^([A-Z0-9]+)/);
  const senderMatch = message.match(/from (.*?)\./i);
  const dateMatch = message.match(
    /on (\d{2}\/\d{2}\/\d{2}) at (\d{1,2}:\d{2} [AP]M)/i
  );

  if (!amountMatch || !referenceMatch || !senderMatch || !dateMatch) {
    return null;
  }

  const amount = Number(amountMatch[1].replace(/,/g, ""));

if (amount <= 0) {
  return null;
}

  const transactionDate = parseKenyanDate(
    dateMatch[1],
    dateMatch[2]
  );

  if (!transactionDate) {
    return null;
  }

  return {
    reference: referenceMatch[1],
    type: "received",
    amount: amount,
    sender: senderMatch[1],
    transactionDate,
  };
}

function parseSentMessage(message) {
  const amountMatch = message.match(/Ksh([\d,]+\.\d{2}) sent to/i);
  const referenceMatch = message.match(/^([A-Z0-9]+)/);
  const recipientMatch = message.match(
    /sent to (.*?)\s+0\d{9}\s+on/i
  );
  const dateMatch = message.match(
    /on (\d{2}\/\d{2}\/\d{2}) at (\d{1,2}:\d{2} [AP]M)/i
  );

  if (!amountMatch || !referenceMatch || !recipientMatch || !dateMatch) {
    return null;
  }

  const amount = Number(amountMatch[1].replace(/,/g, ""));

if (amount <= 0) {
  return null;
}

  const transactionDate = parseKenyanDate(
    dateMatch[1],
    dateMatch[2]
  );

  if (!transactionDate) {
    return null;
  }

  return {
  reference: referenceMatch[1],
  type: "sent",
  amount,
  recipient: recipientMatch[1].trim(),
  transactionDate,
};
}

module.exports = {
  parseReceivedMessage,
  parseSentMessage,
};
