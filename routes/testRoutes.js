const express = require('express');
const router = express.Router();
const { testEmail, testConfig } = require('../controllers/testController');

// Test email configuration
router.post('/email', testEmail);

// Test environment variables
router.get('/config', testConfig);

module.exports = router; 