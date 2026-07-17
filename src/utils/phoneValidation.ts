export const PHONE_NUMBER_PATTERN = /^\+[1-9]\d{7,14}$/;
export const PHONE_NUMBER_ERROR = "Enter a phone number in international format, for example +255700000001.";

export function validateInternationalPhoneNumber(value: string) {
  const phoneNumber = value.trim();
  return !phoneNumber || PHONE_NUMBER_PATTERN.test(phoneNumber);
}
