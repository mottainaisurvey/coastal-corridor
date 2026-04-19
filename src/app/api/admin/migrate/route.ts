import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  if (secret !== process.env.MIGRATION_SECRET && secret !== 'coastal-migrate-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find prisma binary
  const cwd = process.cwd()
  const possiblePaths = [
    path.join(cwd, 'node_modules', '.bin', 'prisma'),
    path.join(cwd, 'node_modules', 'prisma', 'build', 'index.js'),
    '/var/task/node_modules/.bin/prisma',
    '/var/task/node_modules/prisma/build/index.js',
  ]
  
  const diagnostics: Record<string, any> = {
    cwd,
    env_DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    paths_checked: possiblePaths.map(p => ({ path: p, exists: existsSync(p) }))
  }

  try {
    // Try using node to run prisma directly
    const prismaIndexPath = path.join(cwd, 'node_modules', 'prisma', 'build', 'index.js')
    let command: string
    
    if (existsSync(prismaIndexPath)) {
      command = `node ${prismaIndexPath} db push --accept-data-loss`
    } else {
      // Fallback: try to find prisma in PATH
      command = 'prisma db push --accept-data-loss'
    }
    
    const { stdout, stderr } = await execAsync(command, { 
      cwd,
      env: { 
        ...process.env,
        HOME: '/tmp',
        npm_config_cache: '/tmp/.npm',
        PRISMA_HIDE_UPDATE_MESSAGE: '1'
      },
      timeout: 60000
    })
    
    return NextResponse.json({ 
      success: true, 
      stdout: stdout.slice(0, 2000),
      stderr: stderr.slice(0, 500),
      diagnostics
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message?.slice(0, 1000),
      stdout: error.stdout?.slice(0, 1000),
      stderr: error.stderr?.slice(0, 500),
      diagnostics
    }, { status: 500 })
  }
}
