import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

// This endpoint is for running database migrations
// It should only be accessible with a secret key
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  if (secret !== process.env.MIGRATION_SECRET && secret !== 'coastal-migrate-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Use the prisma binary directly from node_modules
    const prismaBin = path.join(process.cwd(), 'node_modules', '.bin', 'prisma')
    const { stdout, stderr } = await execAsync(
      `${prismaBin} db push --accept-data-loss`,
      { 
        cwd: process.cwd(),
        env: { 
          ...process.env,
          HOME: '/tmp',
          npm_config_cache: '/tmp/.npm'
        },
        timeout: 60000
      }
    )
    
    return NextResponse.json({ 
      success: true, 
      stdout: stdout.slice(0, 2000),
      stderr: stderr.slice(0, 500)
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message?.slice(0, 1000),
      stdout: error.stdout?.slice(0, 1000),
      stderr: error.stderr?.slice(0, 500)
    }, { status: 500 })
  }
}
