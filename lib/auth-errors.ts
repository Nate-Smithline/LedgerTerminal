/**
 * Map Supabase Auth error codes and messages to user-friendly text.
 * Covers connection issues, signup, and login.
 */
export function getAuthErrorMessage(
  error: { message?: string; status?: number; code?: string } | null,
  context: "signup" | "login" | "connection" = "login"
): string {
  if (!error) return "Something went wrong.";

  const msg = (error.message ?? "").toLowerCase();
  const code = (error as { code?: string }).code;
  const status = (error as { status?: number }).status;

  // Connection / network
  if (
    status === 0 ||
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror")
  ) {
    return "Cannot reach the server. Check your internet connection and that the app URL is correct.";
  }

  if (msg.includes("invalid api key") || msg.includes("api key")) {
    return "Server configuration error (invalid Supabase key). Please contact support.";
  }

  if (msg.includes("supabase") && msg.includes("url")) {
    return "Server configuration error (invalid Supabase URL). Please contact support.";
  }

  // Auth error codes (Supabase returns these in error.message or error.code)
  switch (code) {
    case "invalid_credentials":
    case "invalid_grant":
      return "Invalid email or password.";
    case "user_not_found":
      return "No account found with this email.";
    case "email_not_confirmed":
      return "Please confirm your email using the link we sent you, then sign in.";
    case "signup_disabled":
      return "Sign up is currently disabled.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try signing in.";
    default:
      break;
  }

  // Message-based fallbacks
  if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
    return "Invalid email or password.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please confirm your email using the link we sent you, then sign in.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (msg.includes("password") && (msg.includes("short") || msg.includes("least"))) {
    return "Password is too short. Use at least 6 characters.";
  }
  if (msg.includes("signup") && msg.includes("disabled")) {
    return "Sign up is currently disabled.";
  }
  if (msg.includes("rate limit") || msg.includes("ratelimit") || msg.includes("too many")) {
    return "Too many signup attempts. Please wait a few minutes and try again, or use a different email.";
  }

  return error.message ?? "Something went wrong. Please try again.";
}
