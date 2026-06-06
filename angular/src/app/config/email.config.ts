// EmailJS Configuration
// Update these settings with your EmailJS credentials

export const EMAIL_CONFIG = {
  // EmailJS Settings
  publicKey: 'E1bIXkDQ5IGNCIzVs', // Incomplete - need full key
  serviceId: 'service_pn6f6uq', // Your EmailJS service ID
  templateId: 'template_3qoyj83' // Your EmailJS template ID
};

// Development fallback - set to false when EmailJS is configured
export const DEVELOPMENT_MODE = true; // Enable development mode - OTP auto-generates for all users

export const EMAIL_TEMPLATES = {
  OTP_SUBJECT: 'Your OTP Code - Barangay Management System',
  FROM_NAME: 'Barangay Management System',
  OTP_EXPIRY_MINUTES: 10
};

// Instructions for setting up EmailJS:
// 1. Go to https://www.emailjs.com/
// 2. Create a free account
// 3. Create a new service (Gmail, Outlook, etc.)
// 4. Create an email template with the following variables:
//    - {{to_email}} - Recipient email
//    - {{to_name}} - Recipient name
//    - {{otp_code}} - The OTP code
//    - {{expiry_minutes}} - OTP expiry time
// 5. Get your Public Key, Service ID, and Template ID
// 6. Update the values above
// 7. Test the email service

// Sample EmailJS Template HTML:
/*
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Code - Barangay Management System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            background: linear-gradient(135deg, #10b981 0%, #ea580c 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .otp-code {
            background-color: #f8f9fa;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            letter-spacing: 5px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Barangay Management System</div>
            <h2>Your One-Time Password (OTP)</h2>
        </div>
        
        <p>Hello {{to_name}},</p>
        
        <p>You have requested to log in to the Barangay Management System. Please use the following One-Time Password (OTP) to complete your login:</p>
        
        <div class="otp-code">{{otp_code}}</div>
        
        <div class="warning">
            <strong>Important Security Information:</strong>
            <ul>
                <li>This OTP is valid for {{expiry_minutes}} minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you did not request this OTP, please ignore this email</li>
            </ul>
        </div>
        
        <p>If you have any questions or concerns, please contact the barangay administration office.</p>
        
        <div class="footer">
            <p>This is an automated message from the Barangay Management System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
*/
