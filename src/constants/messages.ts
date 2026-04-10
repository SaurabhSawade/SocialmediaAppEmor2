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
  ACCOUNT_ALREADY_VERIFIED: "Account already verified",
  NO_EMAIL_ASSOCIATED: "No email associated with this account",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
  NEW_EMAIL_SAME_AS_CURRENT: "New email is the same as current email",
  MISSING_REQUIRED_FIELDS: "Missing required fields: identifier, otp, and newPassword are required",

  // User Errors
  USER_NOT_FOUND: "User not found",
  NOT_FOUND: "Resource not found",
  EMAIL_EXISTS: "Email already registered",
  PHONE_EXISTS: "Phone number already registered",
  USERNAME_EXISTS: "Username already taken",
  PROFILE_NOT_FOUND: "Profile not found",

  // Post Errors
  POST_NOT_FOUND: "Post not found",

  // Comment Errors
  COMMENT_NOT_FOUND: "Comment not found",
  COMMENT_UNAUTHORIZED: "Comment not found or unauthorized",

  // Follow Errors
  FOLLOW_NOT_FOUND: "Follow relationship not found",
  ALREADY_FOLLOWING: "Already following this user",
  CANNOT_FOLLOW_SELF: "Cannot follow yourself",
  FOLLOW_SUCCESS: "Started following successfully",
  UNFOLLOW_SUCCESS: "Unfollowed successfully",

  // Like Errors
  LIKE_NOT_FOUND: "Like not found",

  // Post Errors
  POST_UNAUTHORIZED: "Unauthorized to update this post",
  MAX_MEDIA_FILES: "Maximum 10 media files per post",

  // Image Processing Errors
  AVATAR_UPLOAD_FAILED: "Failed to upload avatar",
  POST_IMAGE_PROCESS_FAILED: "Failed to process post image",

  // Email Errors
  EMAIL_SEND_FAILED: "Failed to send email. Please try again later.",
  OTP_EMAIL_SEND_FAILED: "Failed to send OTP email. Please try again later.",

  // Validation Errors
  VALIDATION_ERROR: "Validation error",
  WEAK_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, number, and special character",
  INVALID_EMAIL_FORMAT: "Invalid email format",
  INVALID_PHONE_FORMAT: "Invalid phone format",
  PASSWORDS_DO_NOT_MATCH: "Passwords do not match",
  INVALID_USERNAME_FORMAT: "Invalid username format",
  COMMENT_CONTENT_EMPTY: "Comment content cannot be empty",
  COMMENT_TOO_LONG: "Comment cannot exceed 500 characters",
  POST_MEDIA_REQUIRED: "At least one media file is required",

  // Server Errors
  INTERNAL_ERROR: "Internal server error",
  DATABASE_ERROR: "Database operation failed",
  EMAIL_SERVICE_NOT_CONFIGURED: "Email service is not configured. Please check SMTP settings in .env",

  // Rate Limit
  TOO_MANY_REQUESTS: "Too many requests, please try again later",

  // Notifications
  NOTIFICATIONS_RETRIEVED: "Notifications retrieved successfully",
  NOTIFICATION_MARKED_READ: "Notification marked as read",
  NOTIFICATIONS_MARKED_READ: "All notifications marked as read",
  NOTIFICATION_DELETED: "Notification deleted successfully",
  NOTIFICATIONS_CLEARED: "All notifications cleared",
} as const;
