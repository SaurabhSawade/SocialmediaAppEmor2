import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  USERS_COUNT: 10,
  POSTS_PER_USER: 3,
  COMMENTS_PER_POST: 5,
  REPLIES_RATIO: 0.4,
  LIKES_RATIO: 0.6,
  FOLLOWS_RATIO: 0.4,
  SAVED_RATIO: 0.3,
};

// Helper Functions
const randomDate = (daysBack: number = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
};

const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Seed Data
const AVATARS = [
  'https://randomuser.me/api/portraits/men/1.jpg',
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/women/2.jpg',
  'https://ui-avatars.com/api/?background=random&name=User&size=200',
];

const BIOS = [
  "✨ Living my best life | Travel enthusiast | Food lover 🍜",
  "Software Engineer | Tech enthusiast | Coffee addict ☕",
  "Photography | Nature | Adventure 🌿",
  "Fitness freak | Gym lover 💪 | Healthy lifestyle",
  "Music lover | Guitar player | Concert goer 🎸",
  "Fashion | Beauty | Lifestyle 💄",
  "Digital nomad | Remote worker | World traveler 🌍",
  "Art lover | Painter | Creative soul 🎨",
  "Book worm | Reader | Knowledge seeker 📚",
  "Foodie | Chef | Restaurant explorer 🍽️",
];

const CAPTIONS = [
  "Beautiful day! 🌞",
  "Living my best life ✨",
  "Adventure awaits! 🌍",
  "Making memories 📸",
  "Grateful for this moment 🙏",
  "Chasing dreams 💫",
  "Good vibes only ✌️",
  "Blessed and thankful 🙌",
  "New beginnings 🌱",
  "Smile and shine 😊",
  "Creating magic ✨",
  "Embracing the journey 🚀",
  "Stay positive 🌈",
  "Dream big 💭",
  "Keep shining ✨",
];

const COMMENTS = [
  "Amazing! 🔥",
  "Love this! ❤️",
  "So beautiful! 😍",
  "Great shot! 📸",
  "Inspiring! ✨",
  "Wow! Just wow! 👏",
  "Absolutely stunning! 🌟",
  "Can't get enough of this! 🙌",
  "This is incredible! 🎯",
  "You're killing it! 💪",
  "Keep up the great work! 🚀",
  "So talented! 🎨",
  "Perfect! 💯",
  "Goals! 🎯",
  "So cool! 😎",
];

const REPLIES = [
  "Thanks! 🙏",
  "I agree! 👍",
  "So true! 💯",
  "Love this! ❤️",
  "Couldn't agree more! ✨",
  "Exactly! 🎯",
  "Well said! 👏",
  "Right back at you! 🔥",
];

const LOCATIONS = [
  "New York, USA",
  "Los Angeles, USA",
  "London, UK",
  "Paris, France",
  "Tokyo, Japan",
  "Sydney, Australia",
  "Dubai, UAE",
  "Singapore",
  "Bali, Indonesia",
  "Barcelona, Spain",
];

const IMAGE_URLS = [
  'https://picsum.photos/id/100/1080/1080', // Camera
  'https://picsum.photos/id/101/1080/1080', // Landscape
  'https://picsum.photos/id/102/1080/1080', // Bench
  'https://picsum.photos/id/103/1080/1080', // River
  'https://picsum.photos/id/104/1080/1080', // Dog
  'https://picsum.photos/id/105/1080/1080', // Flower
  'https://picsum.photos/id/106/1080/1080', // Mountain
  'https://picsum.photos/id/107/1080/1080', // Grass
  'https://picsum.photos/id/108/1080/1080', // Cat
  'https://picsum.photos/id/109/1080/1080', // Valley
];

const generateMedia = (count: number = 1) => {
  const media = [];
  for (let i = 0; i < count; i++) {
    media.push({
      url: randomItem(IMAGE_URLS),
      type: 'IMAGE',
      order: i,
      fileSize: Math.floor(Math.random() * 5000000) + 100000,
      mimeType: 'image/jpeg',
    });
  }
  return media;
};

async function main() {
  console.log('\n🌱 STARTING SEED DATA GENERATION\n');
  console.log('=================================');
  
  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.$transaction([
    prisma.like.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.media.deleteMany(),
    prisma.post.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.savedPost.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.session.deleteMany(),
    prisma.token.deleteMany(),
    prisma.oTP.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('✅ Existing data cleared\n');
  
  const users: any[] = [];
  const password = await bcrypt.hash('Test@123456', 10);
  
  // Create users
  console.log('👥 Creating users...');
  
  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@instagram.com',
      password,
      isVerified: true,
      lastLoginAt: new Date(),
      profile: {
        create: {
          username: 'admin',
          fullName: 'Admin User',
          bio: 'Official Instagram Clone Admin',
          avatarUrl: 'https://ui-avatars.com/api/?background=6366f1&color=fff&name=Admin',
          website: 'https://instagram.com',
          gender: 'other',
          isPrivate: false,
          emailNotifications: true,
          pushNotifications: true,
        },
      },
    },
    include: { profile: true },
  });
  users.push(admin);
  console.log(`  ✓ Admin user created: ${admin.email}`);
  
  // Regular users
  for (let i = 1; i <= CONFIG.USERS_COUNT; i++) {
    const username = `user_${i}`;
    const user = await prisma.user.create({
      data: {
        email: `${username}@example.com`,
        password,
        isVerified: true,
        lastLoginAt: randomDate(30),
        profile: {
          create: {
            username,
            fullName: `User ${i}`,
            bio: randomItem(BIOS),
            avatarUrl: randomItem(AVATARS),
            website: `https://${username}.com`,
            gender: randomItem(['male', 'female', 'other', 'prefer_not_to_say']),
            isPrivate: Math.random() > 0.8,
            emailNotifications: Math.random() > 0.3,
            pushNotifications: Math.random() > 0.3,
          },
        },
      },
      include: { profile: true },
    });
    users.push(user);
    
    if (i % 5 === 0) {
      console.log(`  ✓ Created ${i}/${CONFIG.USERS_COUNT} users`);
    }
  }
  console.log(`✅ Total users: ${users.length}\n`);
  
  // Create posts
  console.log('📝 Creating posts...');
  const allPosts: any[] = [];
  
  for (const user of users) {
    const postCount = user.id === admin.id ? 5 : CONFIG.POSTS_PER_USER;
    
    for (let i = 0; i < postCount; i++) {
      const mediaCount = Math.floor(Math.random() * 3) + 1;
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          caption: randomItem(CAPTIONS),
          location: Math.random() > 0.5 ? randomItem(LOCATIONS) : null,
          createdAt: randomDate(20),
          media: {
            create: generateMedia(mediaCount),
          },
        },
        include: { media: true },
      });
      allPosts.push(post);
    }
  }
  console.log(`✅ Total posts: ${allPosts.length}\n`);
  
  // Create comments and replies
  console.log('💬 Creating comments and replies...');
  let commentCount = 0;
  const allComments: any[] = [];
  
  for (const post of allPosts) {
    const commentCountPerPost = Math.floor(Math.random() * CONFIG.COMMENTS_PER_POST) + 2;
    
    for (let i = 0; i < commentCountPerPost; i++) {
      const randomUser = randomItem(users);
      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          userId: randomUser.id,
          content: randomItem(COMMENTS),
          createdAt: randomDate(15),
        },
      });
      allComments.push(comment);
      commentCount++;
      
      // Add replies
      if (Math.random() < CONFIG.REPLIES_RATIO && i < commentCountPerPost - 1) {
        const replyCount = Math.floor(Math.random() * 2) + 1;
        for (let j = 0; j < replyCount; j++) {
          const replyUser = randomItem(users);
          await prisma.comment.create({
            data: {
              postId: post.id,
              userId: replyUser.id,
              content: randomItem(REPLIES),
              parentId: comment.id,
              createdAt: randomDate(10),
            },
          });
          commentCount++;
        }
      }
    }
  }
  console.log(`✅ Total comments (including replies): ${commentCount}\n`);
  
  // Create likes
  console.log('❤️ Creating likes...');
  let likeCount = 0;
  
  // Like posts
  for (const post of allPosts) {
    const likeTarget = Math.floor(users.length * CONFIG.LIKES_RATIO);
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const usersToLike = shuffledUsers.slice(0, likeTarget);
    
    for (const user of usersToLike) {
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: post.id,
          createdAt: randomDate(10),
        },
      });
      likeCount++;
    }
  }
  
  // Like comments
  for (const comment of allComments) {
    if (Math.random() > 0.7) {
      const likeTarget = Math.floor(users.length * 0.3);
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      const usersToLike = shuffledUsers.slice(0, likeTarget);
      
      for (const user of usersToLike) {
        await prisma.like.create({
          data: {
            userId: user.id,
            commentId: comment.id,
            createdAt: randomDate(8),
          },
        });
        likeCount++;
      }
    }
  }
  console.log(`✅ Total likes: ${likeCount}\n`);
  
  // Create follows
  console.log('👥 Creating follows...');
  let followCount = 0;
  
  for (const user of users) {
    const followTarget = Math.floor(users.length * CONFIG.FOLLOWS_RATIO);
    const shuffledUsers = [...users].filter(u => u.id !== user.id).sort(() => 0.5 - Math.random());
    const usersToFollow = shuffledUsers.slice(0, followTarget);
    
    for (const userToFollow of usersToFollow) {
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: userToFollow.id,
          createdAt: randomDate(25),
        },
      });
      followCount++;
    }
  }
  console.log(`✅ Total follows: ${followCount}\n`);
  
  // Create saved posts
  console.log('💾 Creating saved posts...');
  let savedCount = 0;
  
  for (const user of users) {
    const saveTarget = Math.floor(allPosts.length * CONFIG.SAVED_RATIO);
    const shuffledPosts = [...allPosts].sort(() => 0.5 - Math.random());
    const postsToSave = shuffledPosts.slice(0, saveTarget);
    
    for (const post of postsToSave) {
      await prisma.savedPost.create({
        data: {
          userId: user.id,
          postId: post.id,
          createdAt: randomDate(15),
        },
      });
      savedCount++;
    }
  }
  console.log(`✅ Total saved posts: ${savedCount}\n`);
  
  // Print summary
  console.log('📊 SEED COMPLETED! Summary:');
  console.log('=================================');
  console.log(`👥 Users: ${users.length}`);
  console.log(`📝 Posts: ${allPosts.length}`);
  console.log(`💬 Comments: ${commentCount}`);
  console.log(`❤️ Likes: ${likeCount}`);
  console.log(`👥 Follows: ${followCount}`);
  console.log(`💾 Saved Posts: ${savedCount}`);
  console.log('=================================\n');
  
  // Display test credentials
  console.log('🔐 TEST CREDENTIALS:');
  console.log('=================================');
  console.log('Admin Account:');
  console.log('  Email: admin@instagram.com');
  console.log('  Password: Test@123456\n');
  console.log('Regular Users (first 5):');
  for (let i = 1; i <= Math.min(5, CONFIG.USERS_COUNT); i++) {
    console.log(`  user_${i}@example.com / Test@123456`);
  }
  console.log('=================================\n');
  
  // Display sample posts for testing
  console.log('📸 SAMPLE POSTS FOR TESTING:');
  console.log('=================================');
  const samplePosts = allPosts.slice(0, 5);
  for (const post of samplePosts) {
    const author = users.find(u => u.id === post.authorId);
    console.log(`Post ID: ${post.id}`);
    console.log(`  Author: ${author?.profile?.username}`);
    console.log(`  Caption: ${post.caption}`);
    console.log(`  Media: ${post.media?.length || 0} files`);
    console.log('');
  }
  console.log('=================================\n');
  
  console.log('✅ Seed completed successfully!');
  console.log('🚀 You can now start the server with: npm run dev\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });