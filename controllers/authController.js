const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const User = require("../models/User");
const Club = require("../models/Club");
const { 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  sendWelcomeEmail,
  sendAccountActivationEmail,
  sendAccountSuspensionEmail,
  generateVerificationToken,
  generatePasswordResetToken
} = require("../utils/emailService");
const { logAuthAttempt, logSecurityEvent } = require("../middleware/auditMiddleware");
const AuditLog = require("../models/AuditLog");
const crypto = require("crypto");

// Simple audit logging function
const logAuditEvent = async (eventData) => {
  try {
    await AuditLog.logAction({
      ...eventData,
      resource: "AUTHENTICATION",
      riskLevel: "MEDIUM",
      requiresReview: false,
    });
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
};

// Register a new user (simplified for Threat Combat)
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      university,
      department,
      level,
      gpa,
      dfirStatement,
      phone,
      location
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !university || !dfirStatement) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, university, and DFIR statement are required"
      });
    }

    // Validate DFIR statement length (200 words max)
    const wordCount = dfirStatement.trim().split(/\s+/).length;
    if (wordCount > 200) {
      return res.status(400).json({
        success: false,
        message: "DFIR statement must be 200 words or less"
      });
    }

    // Validate GPA/CWA requirements
    if (gpa && (gpa < 2.5)) {
      return res.status(400).json({
        success: false,
        message: "GPA must be 2.5 or higher for eligibility"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    // Find or create chapter based on university
    let chapter = await Club.findOne({ 
      university: { $regex: new RegExp(university, 'i') },
      status: 'active'
    });

    if (!chapter) {
      // Create new chapter if it doesn't exist
      chapter = new Club({
        name: `${university} Threat Combat Chapter`,
        university: university,
        location: location || 'Ghana',
        description: `Threat Combat Chapter at ${university}`,
        status: 'active',
        facultyAdvisor: {
          name: 'To be assigned',
          email: 'advisor@threatcombatgh.com',
          department: 'Computer Science'
        }
      });
      await chapter.save();
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_IN) || 86400000);

    // Create user with member role by default
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: 'member', // Default role
      chapter: chapter._id,
      academicInfo: {
        university,
        department,
        yearOfStudy: level === 'undergraduate' ? 1 : 1,
        degree: level,
        gpa,
        studentId: null // Will be assigned by chapter admin
      },
      contactInfo: {
        phone,
        city: location
      },
      membershipStatus: 'pending', // Pending executive team approval
      emailVerificationToken,
      passwordResetExpires: emailVerificationExpires,
      emailVerified: false
    };

    console.log('📝 Creating user with data:', JSON.stringify(userData, null, 2));
    console.log('🗄️  User model collection name:', User.collection.name);
    console.log('🗄️  User model database name:', User.db.name);
    
    const user = new User(userData);

    try {
      await user.save();
      console.log('✅ User saved successfully:', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        chapter: user.chapter,
        membershipStatus: user.membershipStatus
      });
    } catch (saveError) {
      console.error('❌ User save error:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: Object.values(saveError.errors).map(e => e.message)
        });
      }
      throw saveError;
    }

    // Send email verification
    const emailResult = await sendEmailVerification(email, emailVerificationToken, name);
    
    if (!emailResult.success) {
      console.error('Email verification failed:', emailResult.error);
    }

    // Log the registration
    await logAuditEvent({
      userId: user._id,
      userRole: user.role,
      action: 'REGISTER',
      details: {
        email,
        university,
        chapterId: chapter._id,
        role: 'member'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      message: "Registration successful! Please check your email for verification and await executive team approval.",
              data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          university,
          chapter: chapter.name,
          membershipStatus: 'pending'
        }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Register Industry Partner
exports.registerIndustryPartner = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            professionalInfo,
            contactInfo,
            profile
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !professionalInfo) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password, and professional information are required"
            });
        }

        // Validate company information
        if (!professionalInfo.company) {
            return res.status(400).json({
                success: false,
                message: "Company information is required for industry partner registration"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const emailVerificationExpires = new Date(Date.now() + parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_IN) || 86400000);

        // Create industry partner user (no chapter assignment - global role)
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'industry_partner', // Global role, no chapter assignment
            professionalInfo,
            contactInfo,
            profile,
            emailVerificationToken,
            passwordResetExpires: emailVerificationExpires,
            emailVerified: false,
            membershipStatus: 'pending'
        });

        try {
          await user.save();
          console.log('✅ Industry Partner saved successfully:', {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            company: professionalInfo.company,
            membershipStatus: user.membershipStatus
          });
        } catch (saveError) {
          console.error('❌ Industry Partner save error:', saveError);
          if (saveError.name === 'ValidationError') {
            return res.status(400).json({
              success: false,
              message: "Validation error",
              errors: Object.values(saveError.errors).map(e => e.message)
            });
          }
          throw saveError;
        }

        // Send email verification
        const emailResult = await sendEmailVerification(email, emailVerificationToken, name);
        
        if (!emailResult.success) {
            console.error('Email verification failed:', emailResult.error);
        }

        // Log the registration
        await logAuditEvent({
            userId: user._id,
            userRole: user.role,
            action: 'REGISTER',
            details: {
                email,
                company: professionalInfo.company,
                role: 'industry_partner'
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({ 
            success: true,
            message: "Industry partner registration submitted successfully. Please check your email for verification and await approval.",
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                company: professionalInfo.company,
                role: 'industry_partner',
                membershipStatus: 'pending'
            }
        });
    } catch (error) {
        console.error('Industry partner registration error:', error);
        res.status(500).json({ 
            success: false,
            message: "Industry partner registration failed",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Login User
exports.authLogin = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password } = req.body;

        const user = await User.findOne({ email }).populate("chapter", "name university location");
        if (!user) {
            // Log failed login attempt
            await logAuthAttempt(req, false, "User not found");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Log failed login attempt
            await logAuthAttempt(req, false, "Invalid password");
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if email is verified
        if (!user.emailVerified && user.role !== "super_admin") {
            await logAuthAttempt(req, false, "Email not verified");
            return res.status(403).json({ 
                message: "Please verify your email address before logging in. Check your inbox for the verification link." 
            });
        }

        // Check if user is active
        if (user.membershipStatus !== "active" && user.role !== "super_admin") {
            await logAuthAttempt(req, false, "Account not active");
            return res.status(403).json({ 
                message: "Account is not active. Please contact your chapter admin or wait for approval." 
            });
        }

        // Check for account lockout
        const failedAttempts = await AuditLog.getFailedLoginAttempts(req.ip || req.connection.remoteAddress, 1);
        if (failedAttempts >= 5) {
            await logSecurityEvent({
                userId: user._id,
                userRole: user.role,
                userChapter: user.chapter,
                action: "ACCOUNT_LOCKOUT",
                details: {
                    reason: "Too many failed login attempts",
                    ipAddress: req.ip || req.connection.remoteAddress,
                    failedAttempts
                },
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.get("User-Agent"),
                method: req.method,
                url: req.originalUrl,
                statusCode: 429,
                success: false,
                errorMessage: "Account temporarily locked due to too many failed attempts",
                riskLevel: "HIGH",
                requiresReview: true,
            });
            
            return res.status(429).json({ 
                message: "Too many failed login attempts. Please try again later." 
            });
        }

        // Update activity
        await user.updateActivity();

        const token = jwt.sign(
            { 
                id: user._id,
                role: user.role,
                chapter: user.chapter?._id
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", 
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Log successful login
        await logAuthAttempt(req, true);

        res.json({ 
            success: true,
            message: "Login successful", 
            data: {
                id: user._id, 
                name: user.name, 
                email: user.email,
                role: user.role,
                chapter: user.chapter,
                membershipStatus: user.membershipStatus,
                permissions: user.permissions
            },
            token
        });
    } catch (error) {
        console.error("Error in authLogin:", error);
        await logAuthAttempt(req, false, error.message);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

// Get User Profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate("chapter", "name university location")
            .select("-password");
            
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error("Error in getUserProfile:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

// Logout User
exports.logoutUser = async (req, res) => {
    try {
        res.clearCookie("token");
        res.json({ 
            success: true,
            message: "Logout successful" 
        });
    } catch (error) {
        console.error("Error in logoutUser:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false,
                message: "Current password and new password are required" 
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: "Current password is incorrect" 
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({ 
            success: true,
            message: "Password changed successfully" 
        });
    } catch (error) {
        console.error("Error in changePassword:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Generate reset token
        const resetToken = require("crypto").randomBytes(32).toString("hex");
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // TODO: Send email with reset link
        // For now, just return the token (in production, send via email)
        res.json({ 
            success: true,
            message: "Password reset link sent to your email",
            resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined
        });
    } catch (error) {
        console.error("Error in requestPasswordReset:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ 
                success: false,
                message: "Token and new password are required" 
            });
        }

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid or expired reset token" 
            });
        }

        // Update password and clear reset token
        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.json({ 
            success: true,
            message: "Password reset successfully" 
        });
    } catch (error) {
        console.error("Error in resetPassword:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ emailVerificationToken: token });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid verification token" 
            });
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        await user.save();

        res.json({ 
            success: true,
            message: "Email verified successfully" 
        });
    } catch (error) {
        console.error("Error in verifyEmail:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

// Assign admin role (Super Admin or Chapter Admin)
exports.assignAdminRole = async (req, res) => {
  try {
    const { email, newRole, chapterId } = req.body;
    const adminUser = req.user; // Current user making the request

    // Validate required fields
    if (!email || !newRole) {
      return res.status(400).json({
        success: false,
        message: "Email and new role are required"
      });
    }

    // Check if current user has admin privileges
    if (!['super_admin', 'chapter_admin'].includes(adminUser.role)) {
      return res.status(403).json({
        success: false,
        message: "Only super admins and chapter admins can assign roles"
      });
    }

    // Validate role assignment based on admin type
    let allowedRoles = [];
    if (adminUser.role === 'super_admin') {
      allowedRoles = ['chapter_admin', 'super_admin', 'executive'];
    } else if (adminUser.role === 'chapter_admin') {
      allowedRoles = ['executive']; // Chapter admins can only assign executive roles
    }

    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: adminUser.role === 'super_admin' 
          ? "Invalid role. Can only assign chapter_admin, super_admin, or executive"
          : "Invalid role. Chapter admins can only assign executive roles"
      });
    }

    // Find the user to be promoted
    const userToPromote = await User.findOne({ email });
    if (!userToPromote) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Validate role assignment restrictions
    if (newRole === 'super_admin') {
      // Only industry partners can be promoted to super admin
      if (userToPromote.role !== 'industry_partner') {
        return res.status(400).json({
          success: false,
          message: "Only industry partners can be promoted to super admin"
        });
      }
    }

    // Validate chapter assignment and permissions
    let targetChapter = null;
    
    if (newRole === 'chapter_admin') {
      if (!chapterId) {
        return res.status(400).json({
          success: false,
          message: "Chapter ID is required for chapter admin assignment"
        });
      }

      targetChapter = await Club.findById(chapterId);
      if (!targetChapter) {
        return res.status(400).json({
          success: false,
          message: "Invalid chapter ID"
        });
      }

      // Check if user is already a member of this chapter
      if (userToPromote.chapter.toString() !== chapterId) {
        return res.status(400).json({
          success: false,
          message: "User must be a member of the chapter to be assigned as chapter admin"
        });
      }
    } else if (newRole === 'executive') {
      // For executive role, use the target user's chapter
      targetChapter = await Club.findById(userToPromote.chapter);
      if (!targetChapter) {
        return res.status(400).json({
          success: false,
          message: "Target user's chapter not found"
        });
      }

      // Chapter admins can only assign executive roles within their own chapter
      if (adminUser.role === 'chapter_admin') {
        if (adminUser.chapter.toString() !== userToPromote.chapter.toString()) {
          return res.status(403).json({
            success: false,
            message: "You can only assign executive roles within your own chapter"
          });
        }
      }
    }

    // Prevent self-demotion
    if (userToPromote._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot modify your own role"
      });
    }

    // Update user role
    const oldRole = userToPromote.role;
    userToPromote.role = newRole;
    
    // For admin roles, ensure they're active and email verified
    if (['chapter_admin', 'executive', 'super_admin'].includes(newRole)) {
      userToPromote.membershipStatus = 'active';
      userToPromote.emailVerified = true;
    }

    await userToPromote.save();

    // Log the role assignment
    await logAuditEvent({
      userId: adminUser._id,
      userRole: adminUser.role,
      action: 'ROLE_ASSIGNMENT',
      details: {
        targetUserId: userToPromote._id,
        targetEmail: email,
        oldRole,
        newRole,
        chapterId: newRole === 'super_admin' ? null : (targetChapter ? targetChapter._id : userToPromote.chapter),
        assignedBy: adminUser.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Send notification email to the promoted user
    const emailResult = await sendRoleAssignmentNotification(
      userToPromote.email,
      userToPromote.name,
      newRole,
      targetChapter ? targetChapter.name : null
    );

    if (!emailResult.success) {
      console.error('Role assignment notification failed:', emailResult.error);
    }

    res.json({
      success: true,
      message: `Successfully assigned ${newRole} role to ${email}`,
      data: {
        userId: userToPromote._id,
        email: userToPromote.email,
        name: userToPromote.name,
        oldRole,
        newRole,
        chapter: targetChapter ? targetChapter.name : null,
        assignedBy: adminUser.role
      }
    });

  } catch (error) {
    console.error('Role assignment error:', error);
    res.status(500).json({
      success: false,
      message: "Role assignment failed",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get available chapters for registration
exports.getAvailableChapters = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not connected. Please try again later.",
        error: "Database connection required for this operation"
      });
    }

    const chapters = await Club.find({ 
      status: 'active'
    }).select('name university location description memberCount stats');

    res.json({
      success: true,
      data: chapters || []
    });

  } catch (error) {
    console.error('Get chapters error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chapters",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Assign executive role (Chapter Admin only - within their chapter)
exports.assignExecutiveRole = async (req, res) => {
  try {
    const { email } = req.body;
    const adminUser = req.user; // Current user making the request

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if current user is chapter admin
    if (adminUser.role !== 'chapter_admin') {
      return res.status(403).json({
        success: false,
        message: "Only chapter admins can assign executive roles"
      });
    }

    // Find the user to be promoted
    const userToPromote = await User.findOne({ email });
    if (!userToPromote) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is in the same chapter as the admin
    if (userToPromote.chapter.toString() !== adminUser.chapter.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only assign executive roles to users in your chapter"
      });
    }

    // Check if user is already an executive or higher
    if (['executive', 'chapter_admin', 'super_admin'].includes(userToPromote.role)) {
      return res.status(400).json({
        success: false,
        message: "User already has executive or higher privileges"
      });
    }

    // Prevent self-promotion
    if (userToPromote._id.toString() === adminUser._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot promote yourself"
      });
    }

    // Get chapter info
    const chapter = await Club.findById(adminUser.chapter);
    if (!chapter) {
      return res.status(400).json({
        success: false,
        message: "Chapter not found"
      });
    }

    // Update user role
    const oldRole = userToPromote.role;
    userToPromote.role = 'executive';
    userToPromote.membershipStatus = 'active';
    userToPromote.emailVerified = true;

    await userToPromote.save();

    // Log the role assignment
    await logAuditEvent({
      userId: adminUser._id,
      userRole: adminUser.role,
      action: 'EXECUTIVE_ASSIGNMENT',
      details: {
        targetUserId: userToPromote._id,
        targetEmail: email,
        oldRole,
        newRole: 'executive',
        chapterId: adminUser.chapterId,
        assignedBy: adminUser.email
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Send notification email to the promoted user
    const emailResult = await sendRoleAssignmentNotification(
      userToPromote.email,
      userToPromote.name,
      'executive',
      chapter.name
    );

    if (!emailResult.success) {
      console.error('Executive assignment notification failed:', emailResult.error);
    }

    res.json({
      success: true,
      message: `Successfully assigned executive role to ${email}`,
      data: {
        userId: userToPromote._id,
        email: userToPromote.email,
        name: userToPromote.name,
        oldRole,
        newRole: 'executive',
        chapter: chapter.name,
        assignedBy: 'chapter_admin'
      }
    });

  } catch (error) {
    console.error('Executive assignment error:', error);
    res.status(500).json({
      success: false,
      message: "Executive assignment failed",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Securely verify email by verification token (not email)
exports.verifyEmailByToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid verification token is required.'
      });
    }

    // Sanitize token input
    const sanitizedToken = token.trim();

    // Find user by verification token
    const user = await User.findOne({ emailVerificationToken: sanitizedToken });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired verification token.'
      });
    }

    if (user.emailVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified.'
      });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    // Log the verification event
    await logAuditEvent({
      userId: user._id,
      userRole: user.role,
      action: 'EMAIL_VERIFIED',
      details: { email: user.email },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Email verified successfully.'
    });
  } catch (error) {
    console.error('Error in verifyEmailByToken:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
