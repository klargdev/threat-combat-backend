const AuditLog = require("../models/AuditLog");

// Audit logging middleware
const auditLog = (action, resource, options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    // Override res.send to capture response data
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      // Parse response data
      let responseData;
      try {
        responseData = typeof data === "string" ? JSON.parse(data) : data;
      } catch (error) {
        responseData = { message: data };
      }
      
      // Log the action
      logAction({
        userId: req.user?.id || null,
        userRole: req.user?.role || "anonymous",
        userChapter: req.user?.chapter || null,
        action,
        resource,
        resourceId: options.resourceId || req.params.id || null,
        details: {
          method: req.method,
          url: req.originalUrl,
          body: sanitizeRequestBody(req.body),
          params: req.params,
          query: req.query,
          response: sanitizeResponseData(responseData),
          ...options.details
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent"),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        success: res.statusCode < 400,
        errorMessage: res.statusCode >= 400 ? responseData.message || responseData.error : null,
        duration,
        riskLevel: determineRiskLevel(action, req.user?.role, res.statusCode),
        requiresReview: shouldRequireReview(action, req.user?.role, res.statusCode),
      });
      
      // Call original send
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Log action to database
const logAction = async (logData) => {
  try {
    await AuditLog.logAction(logData);
  } catch (error) {
    console.error("Error logging audit action:", error);
    // Don't throw error to avoid breaking the request
  }
};

// Sanitize request body for logging
const sanitizeRequestBody = (body) => {
  if (!body) return {};
  
  const sanitized = { ...body };
  const sensitiveFields = ["password", "token", "secret", "key", "authorization"];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });
  
  return sanitized;
};

// Sanitize response data for logging
const sanitizeResponseData = (data) => {
  if (!data) return {};
  
  const sanitized = { ...data };
  const sensitiveFields = ["token", "password", "secret", "key"];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });
  
  return sanitized;
};

// Determine risk level based on action and context
const determineRiskLevel = (action, userRole, statusCode) => {
  // Critical actions
  if (["USER_DELETE", "CHAPTER_DELETE", "ACCOUNT_LOCKOUT", "SUSPICIOUS_ACTIVITY"].includes(action)) {
    return "CRITICAL";
  }
  
  // High risk actions
  if (["USER_SUSPEND", "USER_PROMOTE", "USER_DEMOTE", "ROLE_CHANGE", "PASSWORD_RESET_COMPLETE"].includes(action)) {
    return "HIGH";
  }
  
  // Medium risk actions
  if (["USER_CREATE", "USER_UPDATE", "PASSWORD_CHANGE", "LOGIN_ATTEMPT_FAILED"].includes(action)) {
    return "MEDIUM";
  }
  
  // Failed requests
  if (statusCode >= 400) {
    return "MEDIUM";
  }
  
  return "LOW";
};

// Determine if action requires review
const shouldRequireReview = (action, userRole, statusCode) => {
  // Critical actions always require review
  if (["USER_DELETE", "CHAPTER_DELETE", "ACCOUNT_LOCKOUT"].includes(action)) {
    return true;
  }
  
  // High risk actions by non-admin users require review
  if (["USER_SUSPEND", "USER_PROMOTE", "USER_DEMOTE", "ROLE_CHANGE"].includes(action) && 
      !["super_admin", "chapter_admin"].includes(userRole)) {
    return true;
  }
  
  // Failed authentication attempts
  if (action === "LOGIN_ATTEMPT_FAILED" && statusCode >= 400) {
    return true;
  }
  
  return false;
};

// Log authentication attempts
const logAuthAttempt = async (req, success, errorMessage = null) => {
  try {
    const action = success ? "LOGIN" : "LOGIN_ATTEMPT_FAILED";
    const riskLevel = success ? "LOW" : "MEDIUM";

    // Build log data, only include userId/userRole if present
    const logData = {
      action,
      resource: "AUTHENTICATION",
      details: {
        email: req.body.email,
        success,
        errorMessage,
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      method: req.method,
      url: req.originalUrl,
      statusCode: success ? 200 : 401,
      success,
      errorMessage,
      riskLevel,
      requiresReview: !success,
    };
    if (req.user?.id) logData.userId = req.user.id;
    if (req.user?.role) logData.userRole = req.user.role;
    if (req.user?.chapter) logData.userChapter = req.user.chapter;

    await AuditLog.logAction(logData);
  } catch (error) {
    console.error("Error logging auth attempt:", error);
  }
};

// Log security events
const logSecurityEvent = async (eventData) => {
  try {
    await AuditLog.logAction({
      ...eventData,
      resource: "SYSTEM",
      riskLevel: eventData.riskLevel || "HIGH",
      requiresReview: true,
    });
  } catch (error) {
    console.error("Error logging security event:", error);
  }
};

// Get user activity
const getUserActivity = async (userId, limit = 50) => {
  try {
    return await AuditLog.getUserActivity(userId, limit);
  } catch (error) {
    console.error("Error getting user activity:", error);
    return [];
  }
};

// Get suspicious activity
const getSuspiciousActivity = async (days = 7) => {
  try {
    return await AuditLog.getSuspiciousActivity(days);
  } catch (error) {
    console.error("Error getting suspicious activity:", error);
    return [];
  }
};

// Get activity summary
const getActivitySummary = async (days = 30) => {
  try {
    return await AuditLog.getActivitySummary(days);
  } catch (error) {
    console.error("Error getting activity summary:", error);
    return [];
  }
};

module.exports = {
  auditLog,
  logAuthAttempt,
  logSecurityEvent,
  getUserActivity,
  getSuspiciousActivity,
  getActivitySummary,
}; 