import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const formData = await request.formData()
  const file = formData.get('file')
  const interventionId = formData.get('interventionId') || 'general'

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${interventionId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('photos')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabase.storage.from('photos').getPublicUrl(filename)
  return NextResponse.json({ url: data.publicUrl })
}
