/**
 * Client-Side Input Validation Utilities & Consistent Character Limits
 * Mirrors backend and Neon database validation constraints
 */

export const NAME_PATTERN = /^[\p{L}\p{M}\s.'’\-]+$/u;
export const HAS_LETTER = /\p{L}/u;
export const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
export const PHONE_CHAR_PATTERN = /^[+]?[\d\s\-().]{7,25}$/;
export const URL_PATTERN = /^https?:\/\/[^\s$.?#].[^\s]*$/i;

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  normalized?: string;
}

export const validateName = (name: string, fieldName = 'Full name'): ValidationResult => {
  if (!name || !name.trim()) {
    return { isValid: false, message: `${fieldName} is required.` };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100) {
    return { isValid: false, message: `${fieldName} must contain between 2 and 100 characters.` };
  }
  if (/[\u0000-\u001F\u007F<>]/.test(name)) {
    return { isValid: false, message: `${fieldName} cannot contain HTML or control characters.` };
  }
  if (!NAME_PATTERN.test(trimmed) || !HAS_LETTER.test(trimmed)) {
    return { isValid: false, message: `${fieldName} must contain valid letters and punctuation.` };
  }
  return { isValid: true, normalized: trimmed };
};

export const validateEmail = (email: string): ValidationResult => {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'Email address is required.' };
  }
  const trimmed = email.trim();
  if (trimmed.length > 254) {
    return { isValid: false, message: 'Email address cannot exceed 254 characters.' };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }
  return { isValid: true, normalized: trimmed.toLowerCase() };
};

export const validatePassword = (password: string, isNew = true): ValidationResult => {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  if (isNew) {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must contain between 8 and 128 characters.' };
    }
    if (password.length > 128) {
      return { isValid: false, message: 'Password cannot exceed 128 characters.' };
    }
  } else {
    if (password.length > 128) {
      return { isValid: false, message: 'Password cannot exceed 128 characters.' };
    }
  }
  return { isValid: true };
};

export const validatePhone = (phone: string, required = false): ValidationResult => {
  if (!phone || !phone.trim()) {
    if (required) return { isValid: false, message: 'Mobile number is required.' };
    return { isValid: true, normalized: '' };
  }
  const raw = phone.trim();
  if (!PHONE_CHAR_PATTERN.test(raw)) {
    return { isValid: false, message: 'Enter a valid mobile number.' };
  }
  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return { isValid: false, message: 'Mobile number must contain between 10 and 15 digits.' };
  }
  if (raw.startsWith('+91') || (digits.length === 12 && digits.startsWith('91'))) {
    const mobileDigits = digits.length === 12 ? digits.slice(2) : digits;
    if (!/^[6-9]/.test(mobileDigits)) {
      return { isValid: false, message: 'Indian mobile numbers (+91) must be 10 digits starting with 6, 7, 8, or 9.' };
    }
  } else if (digits.length === 10 && !raw.includes('(') && !raw.includes(')')) {
    if (!/^[6-9]/.test(digits)) {
      return { isValid: false, message: '10-digit Indian mobile numbers must start with 6, 7, 8, or 9.' };
    }
  }
  return { isValid: true, normalized: hasPlus ? `+${digits}` : digits };
};

export const validateText = (
  text: string,
  fieldName: string,
  minLen = 0,
  maxLen = 255,
  required = false
): ValidationResult => {
  if (!text || !text.trim()) {
    if (required) return { isValid: false, message: `${fieldName} is required.` };
    return { isValid: true, normalized: '' };
  }
  const trimmed = text.trim();
  if (minLen > 0 && trimmed.length < minLen) {
    return { isValid: false, message: `${fieldName} must be at least ${minLen} characters long.` };
  }
  if (trimmed.length > maxLen) {
    return { isValid: false, message: `${fieldName} cannot exceed ${maxLen} characters.` };
  }
  return { isValid: true, normalized: trimmed };
};

export const validateUrl = (url: string, fieldName = 'URL', required = false): ValidationResult => {
  if (!url || !url.trim()) {
    if (required) return { isValid: false, message: `${fieldName} is required.` };
    return { isValid: true, normalized: '' };
  }
  const trimmed = url.trim();
  if (trimmed.length > 2048) {
    return { isValid: false, message: `${fieldName} cannot exceed 2,048 characters.` };
  }
  if (!URL_PATTERN.test(trimmed)) {
    return { isValid: false, message: `Please enter a valid http:// or https:// ${fieldName}.` };
  }
  return { isValid: true, normalized: trimmed };
};
