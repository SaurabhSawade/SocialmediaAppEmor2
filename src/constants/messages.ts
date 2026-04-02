export const Messages = {
  // Success Messages
  SUCCESS: "Operation completed successfully",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",

  // Auth Success
  LOGIN_SUCCESS: "Login successful",
  REGISTER_SUCCESS: "Registration successful. Please verify your email",
  EMAIL_VERIFIED: "Email verified successfully",
  OTP_SENT: "OTP sent successfully",
  PASSWORD_RESET_SENT: "Password reset instructions sent to your email",
  PASSWORD_RESET_SUCCESS: "Password reset successful",
  PASSWORD_CHANGED: "Password changed successfully",
  LOGOUT_SUCCESS: "Logout successful",

  // Auth Errors
  INVALID_CREDENTIALS: "Invalid email/phone or password",
  UNAUTHORIZED: "Unauthorized access",
  INVALID_TOKEN: "Invalid or expired token",
  INVALID_OTP: "Invalid or expired OTP",
  EMAIL_NOT_VERIFIED: "Please verify your email first",
  ACCOUNT_DELETED: "Account has been deleted",

  // User Errors
  USER_NOT_FOUND: "User not found",
  NOT_FOUND: "routes not found",
  EMAIL_EXISTS: "Email already registered",
  PHONE_EXISTS: "Phone number already registered",
  USERNAME_EXISTS: "Username already taken",
  PROFILE_NOT_FOUND: "Profile not found",

  // Validation Errors
  VALIDATION_ERROR: "Validation error",
  WEAK_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, number, and special character",

  // Server Errors
  INTERNAL_ERROR: "Internal server error",
  DATABASE_ERROR: "Database operation failed",

  // Rate Limit
  TOO_MANY_REQUESTS: "Too many requests, please try again later",
} as const;
