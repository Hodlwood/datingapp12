interface EmailNotification {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmailNotification({ to, subject, html }: EmailNotification) {
  try {
    const response = await fetch('/api/notifications/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email notification:', error);
    throw error;
  }
}

export function generateMatchEmailTemplate(matchName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Match on Entrepreneur Match!</h2>
      <p>Congratulations! You have a new match with ${matchName}.</p>
      <p>Log in to your account to start chatting and explore potential business opportunities together.</p>
      <div style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/matches/mutual" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Match
        </a>
      </div>
    </div>
  `;
}

export function generateMessageEmailTemplate(senderName: string, messagePreview: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Message from ${senderName}</h2>
      <p>${messagePreview}</p>
      <div style="margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/chat" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Message
        </a>
      </div>
    </div>
  `;
} 