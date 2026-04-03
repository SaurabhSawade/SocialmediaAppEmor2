import { GetUsersQueryDTO, CSVExportData } from '../types/dto/admin.dto';
import { Parser } from 'json2csv';
import fs from "fs";
import path from "path";
import AdminRepository from '../repositories/admin.repository'

export class AdminService {
  private static instance: AdminService;
  
  private constructor() {}
  
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
      users: result.users,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: result.page < result.totalPages,
        hasPrev: result.page > 1,
      },
      filters: {
        search,
        status,
        dateRange: startDate || endDate ? { startDate, endDate } : undefined,
      },
    };
  }

async exportUsersToCSV(query: GetUsersQueryDTO): Promise<{ filePath: string; filename: string }> {
  const result = await this.getAllUsers({ ...query, limit: 1000 });

  const csvData = result.users.map((user: any) => ({
    userId: user.id,
    username: user.username || '',
    fullName: user.fullName || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    status: user.status,
    isVerified: user.isVerified,
    isPrivate: user.isPrivate ?? false,
    postsCount: user.stats?.postsCount || 0,
    commentsCount: user.stats?.commentsCount || 0,
    totalLikesReceived: user.stats?.likesReceived || 0,
    totalLikesGiven: user.stats?.likesGiven || 0,
    followersCount: user.stats?.followersCount || 0,
    followingCount: user.stats?.followingCount || 0,
    totalEngagement: user.stats?.totalEngagement || 0,
    accountCreated: user.createdAt,
    lastLogin: user.lastLoginAt || '',
    accountDeleted: user.deletedAt || '',
    postsData: user.posts?.map((p: any) => 
      `${p.id}: ${p.caption || 'No caption'} (${p.likesCount || 0} likes, ${p.commentsCount || 0} comments)`
    ).join('; ') || '',
    commentsData: user.posts?.flatMap((p: any) => 
      p.comments?.map((c: any) => `Post ${p.id}: ${c.content?.substring(0, 100)}`) || []
    ).join('; ') || '',
  }));

  const fields = [
    { label: 'User ID', value: 'userId' },
    { label: 'Username', value: 'username' },
    { label: 'Full Name', value: 'fullName' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Bio', value: 'bio' },
    { label: 'Status', value: 'status' },
    { label: 'Verified', value: 'isVerified' },
    { label: 'Private Account', value: 'isPrivate' },
    { label: 'Total Posts', value: 'postsCount' },
    { label: 'Total Comments', value: 'commentsCount' },
    { label: 'Likes Received', value: 'totalLikesReceived' },
    { label: 'Likes Given', value: 'totalLikesGiven' },
    { label: 'Followers', value: 'followersCount' },
    { label: 'Following', value: 'followingCount' },
    { label: 'Total Engagement', value: 'totalEngagement' },
    { label: 'Account Created', value: 'accountCreated' },
    { label: 'Last Login', value: 'lastLogin' },
    { label: 'Account Deleted', value: 'accountDeleted' },
    { label: 'Posts Summary', value: 'postsData' },
    { label: 'Comments Summary', value: 'commentsData' },
  ];
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(csvData);

  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // ✅ Create filename
  const filename = `users_export_${Date.now()}.csv`;
  const filePath = path.join(uploadDir, filename);

  // ✅ Write file
  fs.writeFileSync(filePath, csv, "utf8");

  return { filePath, filename };
}
  
  // async exportUsersToCSV(query: GetUsersQueryDTO): Promise<{ csv: string; filename: string }> {
  //   const result = await this.getAllUsers({ ...query, limit: 1000 });
    
  //   const csvData: CSVExportData[] = result.users.map((user: any) => ({
  //     userId: user.id,
  //     username: user.username || '',
  //     fullName: user.fullName || '',
  //     email: user.email || '',
  //     phone: user.phone || '',
  //     bio: user.bio || '',
  //     status: user.status,
  //     isVerified: user.isVerified,
  //     isPrivate: user.isPrivate,
  //     postsCount: user.stats?.postsCount || 0,
  //     commentsCount: user.stats?.commentsCount || 0,
  //     totalLikesReceived: user.stats?.likesReceived || 0,
  //     totalLikesGiven: user.stats?.likesGiven || 0,
  //     followersCount: user.stats?.followersCount || 0,
  //     followingCount: user.stats?.followingCount || 0,
  //     totalEngagement: user.stats?.totalEngagement || 0,
  //     accountCreated: user.createdAt,
  //     lastLogin: user.lastLoginAt || 'Never',
  //     accountDeleted: user.deletedAt || 'Active',
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
  //     { label: 'Total Comments', value: 'commentsCount' },
  //     { label: 'Likes Received', value: 'totalLikesReceived' },
  //     { label: 'Likes Given', value: 'totalLikesGiven' },
  //     { label: 'Followers', value: 'followersCount' },
  //     { label: 'Following', value: 'followingCount' },
  //     { label: 'Total Engagement', value: 'totalEngagement' },
  //     { label: 'Account Created', value: 'accountCreated' },
  //     { label: 'Last Login', value: 'lastLogin' },
  //     { label: 'Account Deleted', value: 'accountDeleted' },
  //     { label: 'Posts Summary', value: 'postsData' },
  //     { label: 'Comments Summary', value: 'commentsData' },
  //   ];
    
  //   const json2csvParser = new Parser({ fields });
  //   const csv = json2csvParser.parse(csvData);
    
  //   const filename = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    
  //   return { csv, filename };
  // }
  
  async getAdminStats() {
    const AdminRepository = (await import('../repositories/admin.repository')).default;
    return await AdminRepository.getAdminStats();
  }
}

export default AdminService.getInstance();