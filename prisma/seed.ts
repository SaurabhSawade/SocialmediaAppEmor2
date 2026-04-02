import process from 'process';
import { PrismaClient, MediaType, MessageType } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding started...');

  // 🔴 साफ DB (optional)
  await prisma.revokedAccessToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.token.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.savedPost.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.media.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // =========================
  // 👤 USERS + PROFILE
  // =========================
  const users = [];

  for (let i = 1; i <= 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `user${i}@example.com`,
        phone: `99999999${i.toString().padStart(2, '0')}`,
        password: passwordHash,
        isVerified: true,
        profile: {
          create: {
            username: `user${i}`,
            fullName: `User ${i}`,
            bio: `I am user ${i}`,
            avatarUrl: `https://i.pravatar.cc/150?img=${i}`,
          },
        },
      },
    });
    users.push(user);
  }

  // =========================
  // 🤝 FOLLOW SYSTEM
  // =========================
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      if (Math.random() > 0.7) {
        await prisma.follow.create({
          data: {
            followerId: users[i].id,
            followingId: users[j].id,
          },
        });
      }
    }
  }

  // =========================
  // 📝 POSTS + MEDIA
  // =========================
  const posts = [];

  for (const user of users) {
    for (let i = 0; i < 2; i++) {
      const post = await prisma.post.create({
        data: {
          authorId: user.id,
          caption: `Post by user ${user.id}`,
          media: {
            create: [
              {
                url: `https://picsum.photos/500/500?random=${Math.random()}`,
                type: MediaType.IMAGE,
              },
            ],
          },
        },
      });
      posts.push(post);
    }
  }

  // =========================
  // 💬 COMMENTS + REPLIES
  // =========================
  const comments = [];

  for (const post of posts) {
    for (let i = 0; i < 3; i++) {
      const user = users[Math.floor(Math.random() * users.length)];

      const comment = await prisma.comment.create({
        data: {
          postId: post.id,
          userId: user.id,
          content: `Comment on post ${post.id}`,
        },
      });

      comments.push(comment);

      // reply
      if (Math.random() > 0.5) {
        await prisma.comment.create({
          data: {
            postId: post.id,
            userId: user.id,
            content: `Reply to comment ${comment.id}`,
            parentId: comment.id,
          },
        });
      }
    }
  }

  // =========================
  // ❤️ LIKES (POST + COMMENT)
  // =========================
  for (const user of users) {
    for (const post of posts) {
      if (Math.random() > 0.7) {
        await prisma.like.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        });
      }
    }

    for (const comment of comments) {
      if (Math.random() > 0.8) {
        await prisma.like.create({
          data: {
            userId: user.id,
            commentId: comment.id,
          },
        });
      }
    }
  }

  // =========================
  // 🔖 SAVED POSTS
  // =========================
  for (const user of users) {
    for (const post of posts) {
      if (Math.random() > 0.85) {
        await prisma.savedPost.create({
          data: {
            userId: user.id,
            postId: post.id,
          },
        });
      }
    }
  }

  // =========================
  // 💬 CONVERSATIONS + MESSAGES
  // =========================
  for (let i = 0; i < users.length - 1; i++) {
    const convo = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: users[i].id },
            { userId: users[i + 1].id },
          ],
        },
      },
    });

    for (let m = 0; m < 3; m++) {
      await prisma.message.create({
        data: {
          conversationId: convo.id,
          senderId: users[i].id,
          content: `Message ${m} in convo ${convo.id}`,
          type: MessageType.TEXT,
        },
      });
    }
  }

  // =========================
  // 🔐 TOKENS + SESSIONS
  // =========================
  for (const user of users) {
    await prisma.token.create({
      data: {
        userId: user.id,
        token: `refresh-token-${user.id}`,
        type: 'REFRESH',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token: `session-token-${user.id}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✅ FULL DATABASE SEEDED SUCCESSFULLY 🚀');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 