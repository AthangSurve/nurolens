const normalizeDoctorName = (name = '') =>
  name.toLowerCase()
    .replace(/^dr\.?\s*/, '')
    .replace(/,?\s*(md|phd|do|m\.d\.|m\.d|ph\.d\.?).*$/i, '')
    .replace(/[^a-z]/g, '');

module.exports = { normalizeDoctorName };
