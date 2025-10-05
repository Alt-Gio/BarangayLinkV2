import React from 'react';

interface WelcomeEmailProps {
  userName: string;
  userEmail: string;
  department?: string;
  dashboardUrl: string;
}

export const WelcomeEmail = ({ userName, userEmail, department, dashboardUrl }: WelcomeEmailProps) => {
  return (
    <html>
      <head>
        <style>{`
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .feature { margin: 15px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #10b981; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Welcome to BarangayLink! 🎉</h1>
          </div>
          <div className="content">
            <h2>Hello {userName}!</h2>
            <p>We're excited to have you join the BarangayLink community. Your account has been successfully created!</p>
            
            <div style={{ margin: '20px 0', padding: '15px', background: '#f0fdf4', borderRadius: '8px' }}>
              <p><strong>Account Details:</strong></p>
              <p>📧 Email: {userEmail}</p>
              {department && <p>🏢 Department: {department}</p>}
            </div>

            <div className="feature">
              <h3>🚀 Get Started</h3>
              <p>Access your dashboard to start managing projects, tasks, and collaborate with your team.</p>
            </div>

            <div className="feature">
              <h3>✨ Key Features</h3>
              <ul>
                <li>📊 Project Management & Tracking</li>
                <li>✅ Gamified Task System</li>
                <li>📅 Event Calendar</li>
                <li>💬 Real-time Messaging</li>
                <li>📁 Document Management</li>
              </ul>
            </div>

            <center>
              <a href={dashboardUrl} className="button">Go to Dashboard</a>
            </center>

            <p style={{ marginTop: '30px', fontSize: '14px', color: '#6b7280' }}>
              Need help? Contact us at <a href="mailto:barangaylink@gmail.com">barangaylink@gmail.com</a>
            </p>
          </div>
          <div className="footer">
            <p>© 2025 BarangayLink. All rights reserved.</p>
            <p>barangaylink.com</p>
          </div>
        </div>
      </body>
    </html>
  );
};
