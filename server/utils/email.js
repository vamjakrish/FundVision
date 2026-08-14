const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const templates = {
  emailVerification: ({ name, verifyUrl }) => ({
    subject: 'Verify Your FundVision Account',
    html: `
      <div style="font-family:Poppins,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
        <div style="background:linear-gradient(135deg,#2563EB,#10B981);padding:40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">FundVision</h1>
          <p style="color:rgba(255,255,255,0.85);margin-top:8px">Transparent Fundraising Platform</p>
        </div>
        <div style="padding:40px">
          <h2 style="color:#1e293b">Hello, ${name}! 👋</h2>
          <p style="color:#475569;line-height:1.6">Welcome to FundVision! Please verify your email address to get started.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}" style="background:linear-gradient(135deg,#2563EB,#10B981);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Verify Email Address</a>
          </div>
          <p style="color:#94a3b8;font-size:14px">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
        <div style="background:#f8fafc;padding:20px;text-align:center">
          <p style="color:#94a3b8;font-size:12px;margin:0">© 2024 FundVision. Making giving transparent.</p>
        </div>
      </div>
    `
  }),
  passwordReset: ({ name, resetUrl }) => ({
    subject: 'Reset Your FundVision Password',
    html: `
      <div style="font-family:Poppins,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
        <div style="background:linear-gradient(135deg,#2563EB,#10B981);padding:40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">FundVision</h1>
        </div>
        <div style="padding:40px">
          <h2 style="color:#1e293b">Password Reset Request</h2>
          <p style="color:#475569">Hi ${name}, click below to reset your password. This link expires in 1 hour.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}" style="background:#EF4444;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
          </div>
          <p style="color:#94a3b8;font-size:14px">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `
  }),
  organizationStatus: ({ name, orgName, status, note }) => ({
    subject: `FundVision - Organization ${status === 'verified' ? 'Verified!' : 'Update'}`,
    html: `
      <div style="font-family:Poppins,sans-serif;max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
        <div style="background:linear-gradient(135deg,#2563EB,#10B981);padding:40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">FundVision</h1>
        </div>
        <div style="padding:40px">
          <h2 style="color:#1e293b">${status === 'verified' ? '🎉 Congratulations!' : '📋 Verification Update'}</h2>
          <p style="color:#475569">Hi ${name},</p>
          <p style="color:#475569">${status === 'verified'
            ? `Your organization <strong>${orgName}</strong> has been verified! You can now create campaigns and start receiving donations.`
            : `Your organization <strong>${orgName}</strong> verification status: <strong>${status}</strong>.${note ? ` Note: ${note}` : ''}`
          }</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${process.env.CLIENT_URL}/dashboard" style="background:linear-gradient(135deg,#2563EB,#10B981);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600">Go to Dashboard</a>
          </div>
        </div>
      </div>
    `
  })
};

const sendEmail = async ({ to, subject, template, data, html }) => {
  try {
    let emailContent = { subject, html };
    if (template && templates[template]) {
      emailContent = templates[template](data);
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'FundVision <noreply@fundvision.com>',
      to,
      subject: emailContent.subject,
      html: emailContent.html
    });

    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Email error:', error.message);
    throw error;
  }
};

module.exports = { sendEmail };
