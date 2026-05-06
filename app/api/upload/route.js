import { NextResponse } from 'next/server'
import { uploadToDrive } from '@/lib/google'

export async function POST(request) {
  const formData = await request.formData()
  const file = formData.get('file')
  const interventionId = formData.get('interventionId')

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const filename = `intervention_${interventionId}_${Date.now()}_${file.name}`

  try {
    const driveFile = await uploadToDrive(buffer, filename, file.type)
    return NextResponse.json({ url: driveFile.webViewLink, driveId: driveFile.id })
  } catch (e) {
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`
    return NextResponse.json({ url: base64 })
  }
}
