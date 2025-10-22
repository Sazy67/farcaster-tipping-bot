import { FrameStateManager, TippingFrameState } from '../state';

describe('FrameStateManager', () => {
  beforeEach(() => {
    // Clear all states before each test
    (FrameStateManager as any).states.clear();
  });

  describe('generateStateKey', () => {
    it('should generate unique state key', async () => {
      const key1 = FrameStateManager.generateStateKey('123', '456');
      
      // Wait a small amount to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const key2 = FrameStateManager.generateStateKey('123', '456');

      expect(key1).toMatch(/^123-456-\d+$/);
      expect(key2).toMatch(/^123-456-\d+$/);
      expect(key1).not.toBe(key2); // Should be different due to timestamp
    });
  });

  describe('setState and getState', () => {
    it('should set and get state correctly', () => {
      const key = 'test-key';
      const state: TippingFrameState = {
        state: 'initial',
        senderFid: '123',
        recipientFid: '456',
        timestamp: Date.now(),
      };

      FrameStateManager.setState(key, state);
      const retrievedState = FrameStateManager.getState(key);

      expect(retrievedState).toEqual(expect.objectContaining({
        state: 'initial',
        senderFid: '123',
        recipientFid: '456',
      }));
      expect(retrievedState?.timestamp).toBeGreaterThan(0);
    });

    it('should return null for non-existent key', () => {
      const state = FrameStateManager.getState('non-existent');
      expect(state).toBeNull();
    });

    it('should return null for expired state', () => {
      const key = 'test-key';
      const expiredState: TippingFrameState = {
        state: 'initial',
        senderFid: '123',
        recipientFid: '456',
        timestamp: Date.now() - (11 * 60 * 1000), // 11 minutes ago
      };

      // Manually set expired state
      (FrameStateManager as any).states.set(key, expiredState);

      const retrievedState = FrameStateManager.getState(key);
      expect(retrievedState).toBeNull();
    });
  });

  describe('updateState', () => {
    it('should update existing state', () => {
      const key = 'test-key';
      const initialState: TippingFrameState = {
        state: 'initial',
        senderFid: '123',
        recipientFid: '456',
        timestamp: Date.now(),
      };

      FrameStateManager.setState(key, initialState);

      const updatedState = FrameStateManager.updateState(key, {
        state: 'wallet_check',
        amount: '0.05',
      });

      expect(updatedState).toEqual(expect.objectContaining({
        state: 'wallet_check',
        senderFid: '123',
        recipientFid: '456',
        amount: '0.05',
      }));
    });

    it('should return null for non-existent state', () => {
      const updatedState = FrameStateManager.updateState('non-existent', {
        state: 'wallet_check',
      });

      expect(updatedState).toBeNull();
    });
  });

  describe('deleteState', () => {
    it('should delete state', () => {
      const key = 'test-key';
      const state: TippingFrameState = {
        state: 'initial',
        senderFid: '123',
        recipientFid: '456',
        timestamp: Date.now(),
      };

      FrameStateManager.setState(key, state);
      expect(FrameStateManager.getState(key)).not.toBeNull();

      FrameStateManager.deleteState(key);
      expect(FrameStateManager.getState(key)).toBeNull();
    });
  });

  describe('getNextState', () => {
    it('should return correct next state for valid transitions', () => {
      expect(FrameStateManager.getNextState('initial', 'amount_selected')).toBe('wallet_check');
      expect(FrameStateManager.getNextState('wallet_check', 'wallet_connected')).toBe('confirmation');
      expect(FrameStateManager.getNextState('confirmation', 'confirmed')).toBe('processing');
      expect(FrameStateManager.getNextState('processing', 'transaction_completed')).toBe('success');
    });

    it('should return current state for invalid transitions', () => {
      expect(FrameStateManager.getNextState('initial', 'confirmed')).toBe('initial');
      expect(FrameStateManager.getNextState('success', 'amount_selected')).toBe('success');
    });

    it('should handle error transitions', () => {
      expect(FrameStateManager.getNextState('wallet_check', 'error')).toBe('error');
      expect(FrameStateManager.getNextState('confirmation', 'error')).toBe('error');
      expect(FrameStateManager.getNextState('processing', 'error')).toBe('error');
    });
  });

  describe('isValidTransition', () => {
    it('should validate correct transitions', () => {
      expect(FrameStateManager.isValidTransition('initial', 'amount_selection')).toBe(true);
      expect(FrameStateManager.isValidTransition('initial', 'wallet_check')).toBe(true);
      expect(FrameStateManager.isValidTransition('wallet_check', 'confirmation')).toBe(true);
      expect(FrameStateManager.isValidTransition('confirmation', 'processing')).toBe(true);
      expect(FrameStateManager.isValidTransition('processing', 'success')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(FrameStateManager.isValidTransition('initial', 'success')).toBe(false);
      expect(FrameStateManager.isValidTransition('success', 'initial')).toBe(false);
      expect(FrameStateManager.isValidTransition('wallet_check', 'processing')).toBe(false);
    });

    it('should allow error recovery', () => {
      expect(FrameStateManager.isValidTransition('error', 'initial')).toBe(true);
    });

    it('should allow error transitions from most states', () => {
      expect(FrameStateManager.isValidTransition('wallet_check', 'error')).toBe(true);
      expect(FrameStateManager.isValidTransition('confirmation', 'error')).toBe(true);
      expect(FrameStateManager.isValidTransition('processing', 'error')).toBe(true);
    });
  });
});