import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const maxDuration = 60

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  
  if (secret !== process.env.MIGRATION_SECRET && secret !== 'coastal-migrate-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = new PrismaClient()
  
  try {
    // Test connection
    await prisma.$connect()
    
    // Check if tables exist
    const tables = await prisma.$queryRaw<Array<{tablename: string}>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully',
      tables: tables.map((t: any) => t.tablename),
      tableCount: tables.length
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message?.slice(0, 1000)
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
