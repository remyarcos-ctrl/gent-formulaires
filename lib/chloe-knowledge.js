import fs from 'fs'
import path from 'path'

export function getKnowledge() {
  try {
    const filePath = path.join(process.cwd(), 'lib', 'knowledge.md')
    return fs.readFileSync(filePath, 'utf-8')
  } catch (e) {
    return ''
  }
}
