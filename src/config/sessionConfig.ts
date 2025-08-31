export const EXTENDED_SESSION_CONFIG = {
  // ===== EXTENDED SESSION INTERVALS =====
  // Validate session before API requests - every 30 minutes instead of 2 minutes
  VALIDATION_BEFORE_REQUEST_INTERVAL: 30 * 60 * 1000, // 30 minutes
  
  // Background session checks - every 15 minutes instead of 1 minute
  PERIODIC_CHECK_INTERVAL: 15 * 60 * 1000, // 15 minutes
  
  // ===== LONGER API TIMEOUTS =====
  AUTH_REQUEST_TIMEOUT: 30000, // 30 seconds (was 10 seconds)
  CHAT_REQUEST_TIMEOUT: 120000, // 2 minutes (was 30 seconds)
  STATUS_REQUEST_TIMEOUT: 15000, // 15 seconds for status polling
  
  // ===== SESSION MANAGEMENT =====
  // How long to keep session valid on client side
  CLIENT_SESSION_DURATION: 8 * 60 * 60 * 1000, // 8 hours
  
  // When to refresh tokens (refresh 1 hour before expiry)
  REFRESH_TOKEN_BEFORE_EXPIRY: 60 * 60 * 1000, // 1 hour
  
  // Session warning settings
  WARN_BEFORE_EXPIRY: 30 * 60 * 1000, // Warn 30 minutes before expiry
  
  // ===== RETRY AND RECOVERY =====
  MAX_SESSION_VALIDATION_RETRIES: 3,
  RETRY_DELAY_MS: 5000, // 5 seconds between retries
  
  // ===== ACTIVITY TRACKING =====
  USER_ACTIVITY_TIMEOUT: 4 * 60 * 60 * 1000, // 4 hours of inactivity before logout
  ACTIVITY_CHECK_INTERVAL: 10 * 60 * 1000, // Check activity every 10 minutes
};