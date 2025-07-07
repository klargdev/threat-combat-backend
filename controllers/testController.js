const { sendEmailVerification } = require("../utils/emailService");

// Test email configuration
exports.testEmail = async (req, res) => {
    try {
        const { email, name } = req.body;
        
        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: "Email and name are required"
            });
        }

        // Test email sending
        const result = await sendEmailVerification(
            email, 
            "test-verification-token-123", 
            name
        );

        if (result.success) {
            res.json({
                success: true,
                message: "Test email sent successfully!",
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                success: false,
                message: "Failed to send test email",
                error: result.error
            });
        }
    } catch (error) {
        console.error("Email test error:", error);
        res.status(500).json({
            success: false,
            message: "Email test failed",
            error: error.message
        });
    }
};

// Test environment variables
exports.testConfig = async (req, res) => {
    try {
        const config = {
            emailHost: process.env.EMAIL_HOST,
            emailPort: process.env.EMAIL_PORT,
            emailUser: process.env.EMAIL_USER ? "Set" : "Not Set",
            emailPass: process.env.EMAIL_PASS ? "Set" : "Not Set",
            frontendUrl: process.env.FRONTEND_URL,
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT
        };

        res.json({
            success: true,
            message: "Configuration test",
            config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Configuration test failed",
            error: error.message
        });
    }
}; 