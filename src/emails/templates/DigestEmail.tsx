import React from 'react';

interface DigestEmailProps {
  userName: string;
  period: 'daily' | 'weekly';
  stats: {
    tasksCompleted: number;
    tasksAssigned: number;
    upcomingEvents: number;
    newMessages: number;
    projectUpdates: number;
  };
  recentActivities: Array<{
    type: string;
    title: string;
    time: string;
  }>;
  upcomingDeadlines: Array<{
    title: string;
    dueDate: string;
    priority: string;
  }>;
  dashboardUrl: string;
}

export const DigestEmail = ({
  userName,
  period,
  stats,
  recentActivities,
  upcomingDeadlines,
  dashboardUrl
}: DigestEmailProps) => {
  return (
    <html>
      <head>
        <style>{`
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 650px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0; }
          .stat-card { background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
          .stat-number { font-size: 32px; font-weight: bold; color: #8b5cf6; margin: 10px 0; }
          .stat-label { font-size: 14px; color: #6b7280; }
          .activity-item { padding: 12px; margin: 8px 0; background: #f9fafb; border-left: 3px solid #8b5cf6; border-radius: 4px; }
          .deadline-item { padding: 12px; margin: 8px 0; background: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>📊 Your {period === 'daily' ? 'Daily' : 'Weekly'} Digest</h1>
            <p style={{ margin: '10px 0 0', opacity: 0.9 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="content">
            <h2>Hello {userName}! 👋</h2>
            <p>Here's your {period} summary of activities and updates.</p>
            
            <h3 style={{ marginTop: '30px' }}>📈 Your Stats</h3>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.tasksCompleted}</div>
                <div className="stat-label">Tasks Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.tasksAssigned}</div>
                <div className="stat-label">Tasks Assigned</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.upcomingEvents}</div>
                <div className="stat-label">Upcoming Events</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.newMessages}</div>
                <div className="stat-label">New Messages</div>
              </div>
            </div>

            {recentActivities.length > 0 && (
              <>
                <h3 style={{ marginTop: '30px' }}>🔔 Recent Activity</h3>
                {recentActivities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="activity-item">
                    <strong>{activity.type}:</strong> {activity.title}
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      {activity.time}
                    </div>
                  </div>
                ))}
              </>
            )}

            {upcomingDeadlines.length > 0 && (
              <>
                <h3 style={{ marginTop: '30px' }}>⚠️ Upcoming Deadlines</h3>
                {upcomingDeadlines.slice(0, 5).map((deadline, index) => (
                  <div key={index} className="deadline-item">
                    <strong>{deadline.title}</strong>
                    <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                      Due: {deadline.dueDate} | Priority: {deadline.priority}
                    </div>
                  </div>
                ))}
              </>
            )}

            <center>
              <a href={dashboardUrl} className="button">View Full Dashboard</a>
            </center>

            <div style={{ marginTop: '30px', padding: '15px', background: '#f0fdf4', borderRadius: '8px' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>
                💪 <strong>Keep it up!</strong> You're making great progress. Stay productive!
              </p>
            </div>
          </div>
          <div className="footer">
            <p>© 2025 BarangayLink. All rights reserved.</p>
            <p style={{ fontSize: '12px', marginTop: '10px' }}>
              <a href="#">Change digest frequency</a> | <a href="#">Unsubscribe from digests</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};
