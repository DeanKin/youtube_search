const axios = require('axios');

async function sendEmail(emailData) {
    const VALID_LANGUAGES = ['en', 'zh','zh-hk'];
    const MAX_CC_RECIPIENTS = 10;
    
    try {
        // 1. Validate core parameters
        const requiredFields = {
            receiverEmail: emailData.receiverEmail,
            templateId: emailData.templateId,
            systemId: emailData.systemId,
            substitutionVars: emailData.substitutionVars
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) throw new Error(`Missing required field: ${field}`);
        }

        // 2. Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailData.receiverEmail)) {
            throw new Error('Invalid receiver email format');
        }

        // 3. Validate template ID format (7-digit number)
        if (!/^\d{7}$/.test(emailData.templateId)) {
            throw new Error('Template ID must be a 7-digit number');
        }

        // 4. Validate substitution variables
        if (typeof emailData.substitutionVars !== 'object' || 
            Array.isArray(emailData.substitutionVars)) {
            throw new Error('substitutionVars must be a key-value object');
        }

        // 5. Prepare and validate CC list
        const cc = Array.isArray(emailData.cc) 
            ? emailData.cc.map(e => e.trim()).filter(e => emailRegex.test(e))
            : [];

        if (cc.length > MAX_CC_RECIPIENTS) {
            throw new Error(`Exceeded maximum CC recipients (${MAX_CC_RECIPIENTS})`);
        }

        // 6. Validate language
        const language = VALID_LANGUAGES.includes(emailData.language?.toLowerCase())
            ? emailData.language.toLowerCase()
            : 'en';

        // 7. Construct payload
        const payload = {
            receiverEmail: emailData.receiverEmail.trim(),
            templateId: emailData.templateId,
            systemId: emailData.systemId.toUpperCase(),
            substitutionVars: emailData.substitutionVars,
            cc,
            language
        };

        console.debug('Sending email payload:', JSON.stringify(payload, null, 2));

        // 8. Send request with timeout and retry config
        const response = await axios.post(
            'http://192.168.231.13:3001/api/post/singleMail',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': `email-${Date.now()}`
                },
                timeout: 30000,
                validateStatus: (status) => status < 500
            }
        );

        console.log(`Email sent successfully to ${payload.receiverEmail}`);
        return response.data;

    } catch (error) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            request: {
                receiverEmail: emailData?.receiverEmail,
                templateId: emailData?.templateId,
                systemId: emailData?.systemId,
                ccCount: emailData?.cc?.length || 0
            }
        };

        if (error.response) {
            errorInfo.response = {
                status: error.response.status,
                data: error.response.data
            };
        }

        console.error('Email Delivery Failure:', JSON.stringify(errorInfo, null, 2));
        throw new Error(`Email delivery failed: ${error.message}`);
    }
}

module.exports = sendEmail;