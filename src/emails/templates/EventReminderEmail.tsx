import React from 'react';

interface EventReminderEmailProps {
  userName: string;
  eventTitle: string;
  eventDescription?: string;
  eventDate: string;
  eventTime: string;
  location?: string;
  eventUrl: string;
  hoursUntil: number;
}

export const EventReminderEmail = ({
  userName,
  eventTitle,
  eventDescription,
  eventDate,
  eventTime,
  location,
  eventUrl,
  hoursUntil
}: EventReminderEmailProps) => {
  return (
    <html>
      <head>
        <style>{`
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .event-card { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .countdown { background: #fee2e2; color: #991b1b; padding: 15px; text-align: center; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          .detail-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>📅 Event Reminder</h1>
          </div>
          <div className="content">
            <h2>Hi {userName},</h2>
            
            {hoursUntil <= 24 ? (
              <div className="countdown">
                ⏰ Event starting in {hoursUntil} hours!
              </div>
            ) : (
              <p>This is a reminder about your upcoming event:</p>
            )}
            
            <div className="event-card">
              <h3 style={{ marginTop: 0, color: '#1e40af' }}>{eventTitle}</h3>
              {eventDescription && <p>{eventDescription}</p>}
              
              <div style={{ marginTop: '20px' }}>
                <div className="detail-row">
                  <strong>📅 Date:</strong> {eventDate}
                </div>
                <div className="detail-row">
                  <strong>🕐 Time:</strong> {eventTime}
                </div>
                {location && (
                  <div className="detail-row">
                    <strong>📍 Location:</strong> {location}
                  </div>
                )}
              </div>
            </div>

            <center>
              <a href={eventUrl} className="button">View Event Details</a>
            </center>

            <div style={{ marginTop: '30px', padding: '15px', background: '#f0f9ff', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                💡 <strong>Pro Tip:</strong> Add this event to your calendar to get notified on your device!
              </p>
            </div>
          </div>
          <div className="footer">
            <p>© 2025 BarangayLink. All rights reserved.</p>
            <p style={{ fontSize: '12px', marginTop: '10px' }}>
              Don't want reminders? <a href="#">Manage notification preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
