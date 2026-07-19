import prisma from '@/lib/prisma';
import { hashPassword, comparePassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import { generateVerificationToken } from '@/lib/utils';

export class AuthService {
  static async register({ name, email, password }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await hashPassword(password);
    
    // Get default viewer role
    const defaultRole = await prisma.role.findFirst({
      where: { name: 'VIEWER' },
    });

    if (!defaultRole) {
      throw new Error('Default role not found');
    }

    const verificationToken = generateVerificationToken();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: defaultRole.id,
        verificationToken,
      },
      include: { role: true },
    });

    const token = signToken({ userId: user.id, roleId: user.roleId });
    
    // Remove sensitive data
    const { password: _, verificationToken: __, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  static async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.deletedAt) {
      throw new Error('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = user.role.permissions.map((p) => p.name);

    const token = signToken({
      userId: user.id,
      roleId: user.roleId,
      role: user.role.name,
    });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: {
        ...userWithoutPassword,
        permissions,
      },
      token,
    };
  }

  static async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const permissions = user.role.permissions.map((p) => p.name);
    const { password: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      permissions,
    };
  }

  static async generateResetToken(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If an account exists, a reset link has been sent' };
    }

    const resetToken = generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    return {
      message: 'If an account exists, a reset link has been sent',
    };
  }

  static async resetPassword({ token, password }) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password reset successful' };
  }

  static async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }
}
