import React from 'react';

interface TaskAssignedEmailProps {
  userName: string;
  taskTitle: string;
  taskDescription?: string;
  projectName?: string;
  dueDate?: string;
  priority: string;
  assignedBy: string;
  taskUrl: string;
}

export const TaskAssignedEmail = ({
  userName,
  taskTitle,
  taskDescription,
  projectName,
  dueDate,
  priority,
  assignedBy,
  taskUrl
}: TaskAssignedEmailProps) => {
  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#10b981'
  };

  const priorityColor = priorityColors[priority.toLowerCase()] || '#6b7280';

  return (
    <html>
      <head>
        <style>{`
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .task-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; color: white; font-weight: bold; font-size: 12px; text-transform: uppercase; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>📋 New Task Assigned</h1>
          </div>
          <div className="content">
            <h2>Hi {userName},</h2>
            <p>You have been assigned a new task by <strong>{assignedBy}</strong>.</p>
            
            <div className="task-card">
              <h3 style={{ marginTop: 0 }}>{taskTitle}</h3>
              {taskDescription && <p>{taskDescription}</p>}
              
              <div style={{ marginTop: '15px' }}>
                {projectName && (
                  <p><strong>📁 Project:</strong> {projectName}</p>
                )}
                {dueDate && (
                  <p><strong>📅 Due Date:</strong> {new Date(dueDate).toLocaleDateString()}</p>
                )}
                <p>
                  <strong>⚡ Priority:</strong> 
                  <span className="priority-badge" style={{ backgroundColor: priorityColor, marginLeft: '8px' }}>
                    {priority}
                  </span>
                </p>
              </div>
            </div>

            <center>
              <a href={taskUrl} className="button">View Task Details</a>
            </center>

            <p style={{ marginTop: '20px', fontSize: '14px', color: #6b7280' }}>
              💡 Tip: Complete tasks to earn XP and level up your profile!
            </p>
          </div>
          <div className="footer">
            <p>© 2025 BarangayLink. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  );
};
