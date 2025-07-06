const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const Club = require("../models/Club");

// Register User
exports.registerUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { 
            name, 
            email, 
            password, 
            role = "member",
            chapterId,
            academicInfo,
            professionalInfo,
            contactInfo,
            profile
        } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        // Validate role assignment
        if (role === "super_admin") {
            return res.status(403).json({ 
                message: "Super admin accounts cannot be created through registration" 
            });
        }

        // Validate chapter assignment for non-industry partners
        if (role !== "industry_partner" && !chapterId) {
            return res.status(400).json({ 
                message: "Chapter ID is required for non-industry partner registrations" 
            });
        }

        // Verify chapter exists if provided
        if (chapterId) {
            const chapter = await Club.findById(chapterId);
            if (!chapter) {
                return res.status(400).json({ message: "Invalid chapter ID" });
            }
        }

        // Create user object
        const userData = {
            name,
            email,
            password,
            role,
            academicInfo,
            professionalInfo,
            contactInfo,
            profile
        };

        // Only assign chapter if not industry partner
        if (role !== "industry_partner" && chapterId) {
            userData.chapter = chapterId;
        }

        user = new User(userData);
        await user.save();

        // Populate chapter info for response
        await user.populate("chapter", "name university location");

        res.status(201).json({ 
            success: true,
            message: "User registered successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                chapter: user.chapter,
                membershipStatus: user.membershipStatus
            }
        });
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};

// Register Industry Partner
exports.registerIndustryPartner = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { 
            name, 
            email, 
            password, 
            professionalInfo,
            contactInfo,
            profile
        } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        // Validate required professional info
        if (!professionalInfo || !professionalInfo.company) {
            return res.status(400).json({ 
                message: "Company information is required for industry partners" 
            });
        }

        const userData = {
            name,
            email,
            password,
            role: "industry_partner",
            professionalInfo,
            contactInfo,
            profile,
            membershipStatus: "pending" // Industry partners need approval
        };

        user = new User(userData);
        await user.save();

        res.status(201).json({ 
            success: true,
            message: "Industry partner registration submitted successfully. Pending approval.",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                membershipStatus: user.membershipStatus
            }
        });
    } catch (error) {
        console.error("Error in registerIndustryPartner:", error);
        res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
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
        if (!user) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Check if user is active
        if (user.membershipStatus !== "active" && user.role !== "super_admin") {
            return res.status(403).json({ 
                message: "Account is not active. Please contact your chapter admin or wait for approval." 
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
