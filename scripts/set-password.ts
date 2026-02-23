import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function setPassword() {
  const email = 'estuarlito@gmail.com'
  const password = 'LOXAliberis9713'

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update the user with the hashed password
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    console.log(`✅ Password updated for user: ${updatedUser.email}`)
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
  } catch (error) {
    console.error('❌ Error setting password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setPassword()
