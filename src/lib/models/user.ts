import { prisma } from '../db';
import { User } from '@/types';

export class UserModel {
  static async findByFid(fid: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { fid },
    });
    
    return user ? {
      ...user,
      walletAddress: user.walletAddress || undefined
    } : null;
  }

  static async create(data: {
    fid: string;
    walletAddress?: string;
    notificationEnabled?: boolean;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        fid: data.fid,
        walletAddress: data.walletAddress,
        notificationEnabled: data.notificationEnabled ?? true,
      },
    });
    
    return {
      ...user,
      walletAddress: user.walletAddress || undefined
    };
  }

  static async updateWalletAddress(fid: string, walletAddress: string): Promise<User> {
    const user = await prisma.user.update({
      where: { fid },
      data: { walletAddress },
    });
    
    return {
      ...user,
      walletAddress: user.walletAddress || undefined
    };
  }

  static async updateNotificationPreferences(
    fid: string, 
    notificationEnabled: boolean
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { fid },
      data: { notificationEnabled },
    });
    
    return {
      ...user,
      walletAddress: user.walletAddress || undefined
    };
  }

  static async findOrCreate(fid: string, walletAddress?: string): Promise<User> {
    const existingUser = await this.findByFid(fid);
    
    if (existingUser) {
      if (walletAddress && existingUser.walletAddress !== walletAddress) {
        return this.updateWalletAddress(fid, walletAddress);
      }
      return existingUser;
    }
    
    return this.create({ fid, walletAddress });
  }
}