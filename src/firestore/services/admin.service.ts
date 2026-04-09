import { GetUsersQueryDTO } from '../../types/dto/admin.dto';
import FirestoreAdminRepository from '../repositories/admin.repository';
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { formatDate } from '../../utils/dateFormatter';

export class FirestoreAdminService {
  private static instance: FirestoreAdminService;

  private constructor() {}

  static getInstance(): FirestoreAdminService {
    if (!FirestoreAdminService.instance) {
      FirestoreAdminService.instance = new FirestoreAdminService();
    }
    return FirestoreAdminService.instance;
  }

  async getAllUsers(query: GetUsersQueryDTO) {
    const {
      page = 1,
      limit = 10,
      search,
      status = 'active',
      startDate,
      endDate,
      orderBy = 'createdAt',
      orderType = 'desc',
    } = query;

    const result = await FirestoreAdminRepository.getAllUsers({
      page,
      limit,
      search,
      status,
      startDate,
      endDate,
      orderBy,
      orderType,
    });

    return {
      user: result.users,
      page: result.page,
      total: result.total,
      totalPages: result.totalPages,
    };
  }

  async exportUsersToExcel(query: GetUsersQueryDTO): Promise<{ filePath: string; filename: string }> {
    const result = await this.getAllUsers({ ...query, limit: 1000 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Users");

    sheet.columns = [
      { header: "User ID", key: "userId", width: 15 },
      { header: "Username", key: "username", width: 20 },
      { header: "Full Name", key: "fullName", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Status", key: "status", width: 12 },
      { header: "Verified", key: "isVerified", width: 12 },
      { header: "Followers", key: "followersCount", width: 12 },
      { header: "Following", key: "followingCount", width: 12 },
      { header: "Engagement", key: "totalEngagement", width: 15 },
      { header: "Created At", key: "accountCreated", width: 20 },
      { header: "Last Login", key: "lastLogin", width: 20 },
      { header: "Deleted At", key: "accountDeleted", width: 20 },
    ];

    result.user.forEach((user: any) => {
      sheet.addRow({
        userId: user.id,
        username: user.username || "",
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
        status: user.status,
        isVerified: user.isVerified,
        followersCount: user.stats?.followersCount || 0,
        followingCount: user.stats?.followingCount || 0,
        totalEngagement: user.stats?.totalEngagement || 0,
        accountCreated: user.createdAt ? formatDate(user.createdAt) : "",
        lastLogin: user.lastLoginAt ? formatDate(user.lastLoginAt) : "",
        accountDeleted: user.deletedAt ? formatDate(user.deletedAt) : "",
      });
    });

    sheet.getRow(1).font = { bold: true };

    const uploadDir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `users_export_${Date.now()}.xlsx`;
    const filePath = path.join(uploadDir, filename);

    await workbook.xlsx.writeFile(filePath);

    return { filePath, filename };
  }

  async getAdminStats() {
    return await FirestoreAdminRepository.getAdminStats();
  }

  async updateUserRole(userId: number, newRole: 'USER' | 'ADMIN', currentUserId: number) {
    if (userId === currentUserId) {
      throw new Error('You cannot change your own role');
    }

    return await FirestoreAdminRepository.updateUserRole(userId, newRole);
  }

  async deleteUserPermanently(userId: number, currentUserId: number) {
    if (userId === currentUserId) {
      throw new Error('You cannot delete your own account');
    }

    return await FirestoreAdminRepository.deleteUserPermanently(userId);
  }

  async getUserById(userId: number) {
    const result = await FirestoreAdminRepository.getAllUsers({ page: 1, limit: 1, search: String(userId) });
    
    if (!result.users || result.users.length === 0) {
      throw new Error('User not found');
    }
    
    return result.users[0];
  }

  async getAdminUsers() {
    return await FirestoreAdminRepository.getAdminUsers();
  }
}

export default FirestoreAdminService.getInstance();
