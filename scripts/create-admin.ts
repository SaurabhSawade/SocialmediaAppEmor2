import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@socialmedia.com';
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    
    if (existingAdmin) {
      // Update existing user to admin role
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' },
      });
      console.log(' Updated existing user to ADMIN role');
      console.log(`   Email: ${adminEmail}`);
      return;
    }
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        // username: 'admin',
        // fullName: 'Super Admin',
        role: 'ADMIN',
        isVerified: true,
        isActive: true,
        // bio: 'Platform Administrator',
      },
    });
    
    console.log(' Admin user created successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: Admin@123456`);
    console.log(`   Role: ${admin.role}`);
  } catch (error) {
    console.error(' Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();