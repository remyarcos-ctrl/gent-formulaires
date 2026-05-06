import { NextResponse } from 'next/server'
import { getFormStructure } from '@/lib/jotform'

export async function GET() {
  const structure = await getFormStructure()
  return NextResponse.json(structure)
}
