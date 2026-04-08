import { GetUsersQueryDTO, CSVExportData } from '../types/dto/admin.dto';
import { Parser } from 'json2csv';
import fs from "fs";
import path from "path";
import AdminRepository from '../repositories/admin.repository'
import { formatDate } from '../utils/dateFormatter';
import ExcelJS from "exceljs";
export class AdminService {
  private static instance: AdminService;

  private constructor() { }

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
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

    const result = await AdminRepository.getAllUsers({
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

  // ✅ Define columns (Excel headers)
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

  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filename = `users_export_${Date.now()}.xlsx`;
  const filePath = path.join(uploadDir, filename);

  await workbook.xlsx.writeFile(filePath);

  return { filePath, filename };
}

  // async exportUsersToCSV(query: GetUsersQueryDTO): Promise<{ filePath: string; filename: string }> {
  //   const result = await this.getAllUsers({ ...query, limit: 1000 });

  //   const csvData = result.user.map((user: any) => ({
  //     userId: user.id,
  //     username: user.username || '',
  //     fullName: user.fullName || '',
  //     email: user.email || '',
  //     phone: user.phone || '',
  //     bio: user.bio || '',
  //     status: user.status,
  //     isVerified: user.isVerified,
  //     isPrivate: user.isPrivate ?? false,
  //     postsCount: user.stats?.postsCount || 0,
  //     // commentsCount: user.stats?.commentsCount || 0,
  //     // totalLikesReceived: user.stats?.likesReceived || 0,
  //     // totalLikesGiven: user.stats?.likesGiven || 0,
  //     followersCount: user.stats?.followersCount || 0,
  //     followingCount: user.stats?.followingCount || 0,
  //     totalEngagement: user.stats?.totalEngagement || 0,
  //     accountCreated: formatDate(user.createdAt),
  //     lastLogin: formatDate(user.lastLoginAt) || '',
  //     accountDeleted: user.deletedAt || '',
  //     postsData: user.posts?.map((p: any) =>
  //       `${p.id}: ${p.caption || 'No caption'} (${p.likesCount || 0} likes, ${p.commentsCount || 0} comments)`
  //     ).join('; ') || '',
  //     commentsData: user.posts?.flatMap((p: any) =>
  //       p.comments?.map((c: any) => `Post ${p.id}: ${c.content?.substring(0, 100)}`) || []
  //     ).join('; ') || '',
  //   }));

  //   const fields = [
  //     { label: 'User ID', value: 'userId' },
  //     { label: 'Username', value: 'username' },
  //     { label: 'Full Name', value: 'fullName' },
  //     { label: 'Email', value: 'email' },
  //     { label: 'Phone', value: 'phone' },
  //     { label: 'Bio', value: 'bio' },
  //     { label: 'Status', value: 'status' },
  //     { label: 'Verified', value: 'isVerified' },
  //     { label: 'Private Account', value: 'isPrivate' },
  //     { label: 'Total Posts', value: 'postsCount' },
  //     // { label: 'Total Comments', value: 'commentsCount' },
  //     // { label: 'Likes Received', value: 'totalLikesReceived' },
  //     // { label: 'Likes Given', value: 'totalLikesGiven' },
  //     { label: 'Followers', value: 'followersCount' },
  //     { label: 'Following', value: 'followingCount' },
  //     { label: 'Total Engagement', value: 'totalEngagement' },
  //     { label: 'Account Created', value: 'accountCreated' },
  //     { label: 'Last Login', value: 'lastLogin' },
  //     { label: 'Account Deleted', value: 'accountDeleted' },
  //     // { label: 'Posts Summary', value: 'postsData' },
  //     { label: 'Comments Summary', value: 'commentsData' },
  //   ];
  //   const json2csvParser = new Parser({ fields });
  //   const csv = json2csvParser.parse(csvData);

  //   const uploadDir = path.join(__dirname, "../../uploads");
  //   if (!fs.existsSync(uploadDir)) {
  //     fs.mkdirSync(uploadDir, { recursive: true });
  //   }

  //   // ✅ Create filename
  //   const filename = `users_export_${Date.now()}.csv`;
  //   const filePath = path.join(uploadDir, filename);

  //   // ✅ Write file
  //   fs.writeFileSync(filePath,"\uFEFF" + csv, "utf8");

  //   return { filePath, filename };
  // }

  async getAdminStats() {
    return await AdminRepository.getAdminStats();
  }

  async updateUserRole(userId: number, newRole: 'USER' | 'ADMIN', currentUserId: number) {
    if (userId === currentUserId) {
      throw new Error('You cannot change your own role');
    }

    return await AdminRepository.updateUserRole(userId, newRole);
  }

  async deleteUserPermanently(userId: number, currentUserId: number) {
    if (userId === currentUserId) {
      throw new Error('You cannot delete your own account');
    }

    return await AdminRepository.deleteUserPermanently(userId);
  }

  async getUserById(userId: number) {
    const result = await AdminRepository.getAllUsers({ page: 1, limit: 1, search: String(userId) });
    
    if (!result.users || result.users.length === 0) {
      throw new Error('User not found');
    }
    
    return result.users[0];
  }

  async getAdminUsers() {
    return await AdminRepository.getAdminUsers();
  }
}

export default AdminService.getInstance();