import { UserModel } from '../user';
import { prisma } from '../../db';

// Mock Prisma
jest.mock('../../db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('UserModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByFid', () => {
    it('should find user by fid', async () => {
      const mockUser = {
        id: 'user1',
        fid: '12345',
        walletAddress: '0x123',
        notificationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserModel.findByFid('12345');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { fid: '12345' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await UserModel.findByFid('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        fid: '12345',
        walletAddress: '0x123',
        notificationEnabled: true,
      };

      const mockCreatedUser = {
        id: 'user1',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await UserModel.create(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: userData,
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create user with default notification enabled', async () => {
      const userData = {
        fid: '12345',
      };

      const mockCreatedUser = {
        id: 'user1',
        fid: '12345',
        walletAddress: null,
        notificationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      await UserModel.create(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          fid: '12345',
          walletAddress: undefined,
          notificationEnabled: true,
        },
      });
    });
  });

  describe('updateWalletAddress', () => {
    it('should update wallet address', async () => {
      const mockUpdatedUser = {
        id: 'user1',
        fid: '12345',
        walletAddress: '0x456',
        notificationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await UserModel.updateWalletAddress('12345', '0x456');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { fid: '12345' },
        data: { walletAddress: '0x456' },
      });
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('findOrCreate', () => {
    it('should return existing user if found', async () => {
      const mockUser = {
        id: 'user1',
        fid: '12345',
        walletAddress: '0x123',
        notificationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await UserModel.findOrCreate('12345');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { fid: '12345' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should create new user if not found', async () => {
      const mockCreatedUser = {
        id: 'user1',
        fid: '12345',
        walletAddress: '0x123',
        notificationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await UserModel.findOrCreate('12345', '0x123');

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          fid: '12345',
          walletAddress: '0x123',
          notificationEnabled: true,
        },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should update wallet address if user exists with different address', async () => {
      const existingUser = {
        id: 'user1',
        fid: '12345',
        walletAddress: '0x123',
        notificationEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        walletAddress: '0x456',
      };

      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await UserModel.findOrCreate('12345', '0x456');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { fid: '12345' },
        data: { walletAddress: '0x456' },
      });
      expect(result).toEqual(updatedUser);
    });
  });
});