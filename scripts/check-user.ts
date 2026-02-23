import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'estuarlito@gmail.com' },
    select: {
      email: true,
      password: true,
      role: true,
      createdAt: true
    }
  })
  
  console.log('User:', user?.email)
  console.log('Has password:', !!user?.password)
  console.log('Password length:', user?.password?.length)
  console.log('Password starts with \$2:', user?.password?.startsWith('$2'))
  console.log('Role:', user?.role)
  
  await prisma.$disconnect()
}

checkUser()
