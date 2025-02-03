export const getVerificationEmailTemplate = (
  firstName: string,
  verificationLink: string,
) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your ProtonMedicare Account</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 40px 0; text-align: center; background-color: #ffffff;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px;">Welcome to ProtonMedicare!</h1>
                    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">Hello ${firstName},</p>
                    <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Thank you for joining ProtonMedicare. To get started, please verify your email address by clicking the button below:</p>
                    <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
                    <p style="color: #666666; font-size: 14px; margin-top: 30px;">If you didn't create an account with ProtonMedicare, please ignore this email.</p>
                    <p style="color: #666666; font-size: 14px;">Button not working? Copy and paste this link into your browser:</p>
                    <p style="color: #666666; font-size: 14px; word-break: break-all;">${verificationLink}</p>
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;
