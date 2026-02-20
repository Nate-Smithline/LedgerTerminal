const MIN_LENGTH = 12;
const MIN_LENGTH_WITH_COMPLEXITY = 8;

export type PasswordStrength = "weak" | "fair" | "strong";

function hasLowercase(s: string) {
  return /[a-z]/.test(s);
}
function hasUppercase(s: string) {
  return /[A-Z]/.test(s);
}
function hasNumber(s: string) {
  return /\d/.test(s);
}
function hasSpecial(s: string) {
  return /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (typeof password !== "string") {
    return { valid: false, message: "Password is required" };
  }
  const p = password;
  if (p.length < MIN_LENGTH_WITH_COMPLEXITY) {
    return { valid: false, message: `Password must be at least ${MIN_LENGTH_WITH_COMPLEXITY} characters` };
  }
  const hasAll =
    hasLowercase(p) && hasUppercase(p) && hasNumber(p) && hasSpecial(p);
  if (p.length >= MIN_LENGTH) {
    if (!hasAll) {
      return {
        valid: false,
        message: "Password must include uppercase, lowercase, a number, and a special character",
      };
    }
    return { valid: true };
  }
  if (p.length >= MIN_LENGTH_WITH_COMPLEXITY && hasAll) {
    return { valid: true };
  }
  return {
    valid: false,
    message: `Password must be at least ${MIN_LENGTH} characters, or ${MIN_LENGTH_WITH_COMPLEXITY}+ with uppercase, lowercase, a number, and a special character`,
  };
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password.length) return "weak";
  let score = 0;
  if (password.length >= MIN_LENGTH) score += 1;
  if (hasLowercase(password)) score += 1;
  if (hasUppercase(password)) score += 1;
  if (hasNumber(password)) score += 1;
  if (hasSpecial(password)) score += 1;
  if (password.length >= 16) score += 1;
  if (score <= 2) return "weak";
  if (score <= 4) return "fair";
  return "strong";
}
