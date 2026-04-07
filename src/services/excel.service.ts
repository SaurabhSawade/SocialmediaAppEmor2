import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma/client';
import bcrypt from 'bcryptjs';
import logger from '../config/logger';
import { BulkImportResultDTO, GetUsersQueryDTO } from '../types/dto/admin.dto';

export class ExcelService {
  private static instance: ExcelService;
  
  private constructor() {}
  
  static getInstance(): ExcelService {
    if (!ExcelService.instance) {
      ExcelService.instance = new ExcelService();
    }
    return ExcelService.instance;
  }
  
  private formatDate(date: Date | string | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }
  
  async exportUsersToExcel(query: GetUsersQueryDTO): Promise<{ filePath: string; filename: string }> {
    const AdminService = (await import('./admin.service')).default;
    const result = await AdminService.getAllUsers({ ...query, limit: 1000 });
    
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Admin Panel';
    workbook.created = new Date();
    
    // Main Users Sheet
    const userSheet = workbook.addWorksheet('Users');
    
    // Define columns
    userSheet.columns = [
      { header: 'User ID', key: 'userId', width: 15 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Bio', key: 'bio', width: 40 },
      { header: 'Role', key: 'role', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Verified', key: 'isVerified', width: 12 },
      { header: 'Private', key: 'isPrivate', width: 10 },
      { header: 'Followers', key: 'followersCount', width: 12 },
      { header: 'Following', key: 'followingCount', width: 12 },
      { header: 'Posts', key: 'postsCount', width: 10 },
      { header: 'Comments', key: 'commentsCount', width: 12 },
      { header: 'Likes Received', key: 'likesReceived', width: 15 },
      { header: 'Likes Given', key: 'likesGiven', width: 15 },
      { header: 'Total Engagement', key: 'totalEngagement', width: 15 },
      { header: 'Created At', key: 'accountCreated', width: 20 },
      { header: 'Last Login', key: 'lastLogin', width: 20 },
      { header: 'Deleted At', key: 'accountDeleted', width: 20 },
    ];
    
    // Style header row
    userSheet.getRow(1).font = { bold: true };
    userSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
    userSheet.getRow(1).alignment = { horizontal: 'center' };
    
    // Add data rows
    result.user.forEach((user: any) => {
      userSheet.addRow({
        userId: user.id,
        username: user.username || '',
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        role: user.role || 'USER',
        status: user.status,
        isVerified: user.isVerified ? 'Yes' : 'No',
        isPrivate: user.isPrivate ? 'Yes' : 'No',
        followersCount: user.stats?.followersCount || 0,
        followingCount: user.stats?.followingCount || 0,
        postsCount: user.stats?.postsCount || 0,
        commentsCount: user.stats?.commentsCount || 0,
        likesReceived: user.stats?.likesReceived || 0,
        likesGiven: user.stats?.likesGiven || 0,
        totalEngagement: user.stats?.totalEngagement || 0,
        accountCreated: this.formatDate(user.createdAt),
        lastLogin: this.formatDate(user.lastLoginAt),
        accountDeleted: this.formatDate(user.deletedAt),
      });
    });
    
    // Add Instructions Sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.addRow(['📋 IMPORT INSTRUCTIONS']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['To import/update users:']);
    instructionsSheet.addRow(['1. Do NOT modify the "User ID" column for existing users']);
    instructionsSheet.addRow(['2. For NEW users: Leave "User ID" empty']);
    instructionsSheet.addRow(['3. For UPDATE users: Keep "User ID" as is']);
    instructionsSheet.addRow(['4. Required fields for new users: Username']);
    instructionsSheet.addRow(['5. Optional fields: Email, Phone, Full Name, Bio, Role, etc.']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['📝 Role Options: USER, ADMIN']);
    instructionsSheet.addRow(['📝 Status Options: active, deleted']);
    instructionsSheet.addRow(['📝 Verified Options: Yes, No']);
    instructionsSheet.addRow(['📝 Private Options: Yes, No']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['⚠️ WARNING:']);
    instructionsSheet.addRow(['- Updating role to ADMIN gives user admin access']);
    instructionsSheet.addRow(['- Setting status to "deleted" will soft delete the user']);
    instructionsSheet.addRow(['- Email and Username must be unique']);
    
    // Style instructions sheet
    instructionsSheet.getRow(1).font = { bold: true, size: 14 };
    
    // Create uploads directory if not exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filename = `users_export_${Date.now()}.xlsx`;
    const filePath = path.join(uploadDir, filename);
    
    await workbook.xlsx.writeFile(filePath);
    
    return { filePath, filename };
  }
  
  async importUsersFromExcel(filePath: string): Promise<BulkImportResultDTO> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const worksheet = workbook.getWorksheet('Users');
    if (!worksheet) {
      throw new Error('Invalid Excel file. Please use the exported template with "Users" sheet.');
    }
    
    const results: BulkImportResultDTO = {
      total: 0,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      fileUrl: '',
      filename: path.basename(filePath),
    };
    
    // Get the actual row count (excluding empty rows)
    let actualRowCount = 0;
    for (let i = 1; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      let hasContent = false;
      row.eachCell({ includeEmpty: false }, () => {
        hasContent = true;
      });
      if (hasContent) {
        actualRowCount++;
      } else {
        break;
      }
    }
    
    if (actualRowCount <= 1) {
      throw new Error('No data found in the Excel file. Please add data rows.');
    }
    
    // Get headers from first row (using actual cells, not column count)
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    
    // Get all non-empty cells in header row
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const headerText = cell.text?.toString().trim();
      if (headerText) {
        headers[colNumber] = headerText;
      }
    });
    
    // Define column mapping (based on header names)
    const getColumnIndex = (headerName: string): number => {
      return headers.findIndex(h => h === headerName);
    };
    
    const userIdCol = getColumnIndex('User ID');
    const usernameCol = getColumnIndex('Username');
    const emailCol = getColumnIndex('Email');
    const phoneCol = getColumnIndex('Phone');
    const fullNameCol = getColumnIndex('Full Name');
    const bioCol = getColumnIndex('Bio');
    const roleCol = getColumnIndex('Role');
    const statusCol = getColumnIndex('Status');
    const verifiedCol = getColumnIndex('Verified');
    const privateCol = getColumnIndex('Private');
    
    // Process each row (skip header row)
    for (let rowNumber = 2; rowNumber <= actualRowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      
      // Helper function to safely get cell value
      const getCellValue = (colIndex: number): string => {
        if (colIndex === -1) return '';
        const cell = row.getCell(colIndex);
        const value = cell.value;
        if (!value) return '';
        return value.toString().trim();
      };
      
      const userId = getCellValue(userIdCol);
      const username = getCellValue(usernameCol);
      const email = getCellValue(emailCol);
      const phone = getCellValue(phoneCol);
      const fullName = getCellValue(fullNameCol);
      const bio = getCellValue(bioCol);
      const role = getCellValue(roleCol).toUpperCase();
      const status = getCellValue(statusCol).toLowerCase();
      const verifiedValue = getCellValue(verifiedCol).toLowerCase();
      const privateValue = getCellValue(privateCol).toLowerCase();
      
      const isVerified = verifiedValue === 'yes' || verifiedValue === 'true';
      const isPrivate = privateValue === 'yes' || privateValue === 'true';
      const userIdNum = userId ? parseInt(userId) : null;
      
      results.total++;
      
      try {
        // Skip empty rows (no username, email, or user ID)
        if (!username && !email && !phone && !userIdNum) {
          continue;
        }
        
        // Check if user exists (by ID)
        let existingUser = null;
        if (userIdNum && !isNaN(userIdNum)) {
          existingUser = await prisma.user.findUnique({
            where: { id: userIdNum, deletedAt: null },
            include: { profile: true },
          });
        }
        
        // If not found by ID, check by email
        if (!existingUser && email) {
          existingUser = await prisma.user.findUnique({
            where: { email },
            include: { profile: true },
          });
        }
        
        if (existingUser) {
          // UPDATE existing user
          const updateUserData: any = {};
          const updateProfileData: any = {};
          
          // Update User table fields
          if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findFirst({
              where: { email, id: { not: existingUser.id } },
            });
            if (emailExists) {
              throw new Error(`Email "${email}" is already taken`);
            }
            updateUserData.email = email;
          }
          
          if (phone) updateUserData.phone = phone;
          if (role && ['USER', 'ADMIN'].includes(role)) updateUserData.role = role;
          if (isVerified !== undefined) updateUserData.isVerified = isVerified;
          
          // Handle soft delete
          if (status === 'deleted' && !existingUser.deletedAt) {
            updateUserData.deletedAt = new Date();
            updateUserData.isActive = false;
          } else if (status === 'active' && existingUser.deletedAt) {
            updateUserData.deletedAt = null;
            updateUserData.isActive = true;
          }
          
          // Update Profile table fields
          if (username && (!existingUser.profile || username !== existingUser.profile.username)) {
            const profileExists = await prisma.profile.findFirst({
              where: { username, userId: { not: existingUser.id } },
            });
            if (profileExists) {
              throw new Error(`Username "${username}" is already taken`);
            }
            updateProfileData.username = username;
          }
          
          if (fullName !== undefined) updateProfileData.fullName = fullName;
          if (bio !== undefined) updateProfileData.bio = bio;
          if (isPrivate !== undefined) updateProfileData.isPrivate = isPrivate;
          
          // Execute updates
          if (Object.keys(updateUserData).length > 0) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: updateUserData,
            });
          }
          
          if (Object.keys(updateProfileData).length > 0) {
            if (existingUser.profile) {
              await prisma.profile.update({
                where: { userId: existingUser.id },
                data: updateProfileData,
              });
            } else {
              // Create profile if it doesn't exist
              await prisma.profile.create({
                data: {
                  userId: existingUser.id,
                  username: username || `user_${existingUser.id}`,
                  fullName: fullName,
                  bio: bio,
                  isPrivate: isPrivate || false,
                },
              });
            }
          }
          
          results.updated++;
        } else {
          // CREATE new user
          if (!username) {
            throw new Error('Username is required for new users');
          }
          
          // Check if username exists in profile
          const profileExists = await prisma.profile.findFirst({
            where: { username },
          });
          if (profileExists) {
            throw new Error(`Username "${username}" is already taken`);
          }
          
          // Check if email exists
          if (email) {
            const emailExists = await prisma.user.findFirst({
              where: { email },
            });
            if (emailExists) {
              throw new Error(`Email "${email}" is already taken`);
            }
          }
          
          // Check if phone exists
          if (phone) {
            const phoneExists = await prisma.user.findFirst({
              where: { phone },
            });
            if (phoneExists) {
              throw new Error(`Phone "${phone}" is already taken`);
            }
          }
          
          // Generate random password for new users
          const randomPassword = Math.random().toString(36).slice(-8) + 'A1!';
          const hashedPassword = await bcrypt.hash(randomPassword, 10);
          
          // Create user and profile in transaction
          await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: {
                email: email || null,
                phone: phone || null,
                password: hashedPassword,
                role: role === 'ADMIN' ? 'ADMIN' : 'USER',
                isVerified: isVerified || false,
                isActive: status !== 'deleted',
                deletedAt: status === 'deleted' ? new Date() : null,
              },
            });
            
            await tx.profile.create({
              data: {
                userId: newUser.id,
                username: username,
                fullName: fullName || null,
                bio: bio || null,
                isPrivate: isPrivate || false,
              },
            });
          });
          
          results.created++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          email: email,
          username: username,
          error: error.message,
        });
      }
    }
    
    // Move processed file to processed folder
    const processedDir = path.join(path.dirname(filePath), 'processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }
    const processedPath = path.join(processedDir, path.basename(filePath));
    fs.renameSync(filePath, processedPath);
    
    results.fileUrl = `/uploads/imports/processed/${path.basename(filePath)}`;
    
    return results;
  }
  
  async downloadImportTemplate(): Promise<{ filePath: string; filename: string }> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Users');
    
    // Define columns for template
    sheet.columns = [
      { header: 'User ID', key: 'userId', width: 15 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Full Name', key: 'fullName', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Bio', key: 'bio', width: 40 },
      { header: 'Role', key: 'role', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Verified', key: 'isVerified', width: 12 },
      { header: 'Private', key: 'isPrivate', width: 10 },
    ];
    
    // Add example rows
    sheet.addRow({
      userId: '',
      username: 'newuser',
      fullName: 'New User',
      email: 'newuser@example.com',
      phone: '1234567890',
      bio: 'This is a new user',
      role: 'USER',
      status: 'active',
      isVerified: 'Yes',
      isPrivate: 'No',
    });
    
    sheet.addRow({
      userId: '1',
      username: 'existinguser',
      fullName: 'Existing User Updated',
      email: 'existing@example.com',
      phone: '0987654321',
      bio: 'Updated bio',
      role: 'ADMIN',
      status: 'active',
      isVerified: 'Yes',
      isPrivate: 'Yes',
    });
    
    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' },
    };
    headerRow.alignment = { horizontal: 'center' };
    
    // Add instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    instructionsSheet.addRow(['📋 HOW TO USE THIS TEMPLATE']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['To ADD a new user:']);
    instructionsSheet.addRow(['  - Leave "User ID" empty']);
    instructionsSheet.addRow(['  - Fill in "Username" (required)']);
    instructionsSheet.addRow(['  - Fill in other optional fields']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['To UPDATE an existing user:']);
    instructionsSheet.addRow(['  - Keep the "User ID" as is']);
    instructionsSheet.addRow(['  - Modify any fields you want to update']);
    instructionsSheet.addRow([]);
    instructionsSheet.addRow(['Field Options:']);
    instructionsSheet.addRow(['  - Role: USER, ADMIN']);
    instructionsSheet.addRow(['  - Status: active, deleted']);
    instructionsSheet.addRow(['  - Verified: Yes, No']);
    instructionsSheet.addRow(['  - Private: Yes, No']);
    
    // Style instructions header
    instructionsSheet.getRow(1).font = { bold: true, size: 14 };
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'templates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filename = `user_import_template.xlsx`;
    const filePath = path.join(uploadDir, filename);
    
    await workbook.xlsx.writeFile(filePath);
    
    return { filePath, filename };
  }
}

export default ExcelService.getInstance();