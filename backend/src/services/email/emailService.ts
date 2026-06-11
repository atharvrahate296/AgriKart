import nodemailer from 'nodemailer'

const otpStore = new Map<string, { code: string, expiresAt: Date }>()

export const emailService = {
  transporter: nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  }),

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  },

  async sendOTP(email: string): Promise<void> {
    const otp = this.generateOTP()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

    // Save the OTP in memory
    otpStore.set(email, { code: otp, expiresAt })

    // Send the email
    const mailOptions = {
      from: process.env.SMTP_FROM || `"AgriKart" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'AgriKart Password Reset Verification Code',
      text: `Your password reset verification code is: ${otp}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #16a34a; text-align: center;">AgriKart Password Reset</h2>
          <p style="color: #475569; font-size: 16px;">We received a request to reset your password. Use the following 6-digit verification code to proceed:</p>
          <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e293b;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">This code will expire in 5 minutes.</p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 32px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
    } catch (err) {
      console.error('Failed to send email:', err)
      throw new Error('Failed to send verification email')
    }
  },

  async verifyOTP(email: string, code: string): Promise<boolean> {
    const storedOtp = otpStore.get(email)

    if (!storedOtp) {
      return false
    }

    if (storedOtp.code !== code) {
      return false
    }

    if (new Date() > storedOtp.expiresAt) {
      otpStore.delete(email)
      return false
    }

    return true
  },

  async clearOTP(email: string): Promise<void> {
    otpStore.delete(email)
  }
}

