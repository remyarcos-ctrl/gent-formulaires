import { google } from 'googleapis'

function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })

  return oauth2Client
}

export async function uploadToDrive(buffer, filename, mimeType = 'application/pdf') {
  const auth = getOAuthClient()
  const drive = google.drive({ version: 'v3', auth })
  const { Readable } = await import('stream')

  const response = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      mimeType,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink',
  })

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return response.data
}

export async function createCalendarEvent({ title, description, start, end, location }) {
  const auth = getOAuthClient()
  const calendar = google.calendar({ version: 'v3', auth })

  const event = {
    summary: title,
    description,
    location,
    start: { dateTime: start, timeZone: 'Europe/Paris' },
    end: { dateTime: end, timeZone: 'Europe/Paris' },
  }

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    requestBody: event,
  })

  return response.data
}

export async function sendEmail({ to, subject, body }) {
  const auth = getOAuthClient()
  const gmail = google.gmail({ version: 'v1', auth })

  const message = [
    `From: Happy Confort <remy.arcos@orchidee-innovation.fr>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    '',
    body,
  ].join('\r\n')

  const encoded = Buffer.from(message).toString('base64url')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })
}
