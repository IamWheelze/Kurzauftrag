// Email validation
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Phone validation (international format)
function isValidPhone(phone) {
  const regex = /^\+?[1-9]\d{1,14}$/;
  return regex.test(phone.replace(/[\s-]/g, ''));
}

// Password strength validation
function isStrongPassword(password) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

// Credit amount validation
function isValidCreditAmount(amount) {
  return Number.isInteger(amount) && amount > 0 && amount <= 1000;
}

// Date validation (not in past)
function isFutureDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

// Postal code validation (flexible format)
function isValidPostalCode(postalCode, country = 'DE') {
  const patterns = {
    DE: /^\d{5}$/,
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i
  };

  const pattern = patterns[country] || /^.+$/;
  return pattern.test(postalCode);
}

// Rating validation
function isValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// Sanitize input (basic XSS prevention)
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '')
    .trim();
}

// Validate latitude/longitude
function isValidCoordinate(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

module.exports = {
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidCreditAmount,
  isFutureDate,
  isValidPostalCode,
  isValidRating,
  sanitizeInput,
  isValidCoordinate
};
