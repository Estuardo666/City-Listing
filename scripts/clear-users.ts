import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearUsers() {
  try {
    // Delete all users
    const result = await prisma.user.deleteMany({})
    console.log(`✅ Deleted ${result.count} users`)
    
    // Reset the database sequence
    await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'User'`
    console.log('✅ Reset user ID sequence')
  } catch (error) {
    console.error('❌ Error clearing users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearUsers()
