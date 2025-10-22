export type FrameState = 
  | 'initial'
  | 'amount_selection'
  | 'wallet_check'
  | 'confirmation'
  | 'processing'
  | 'success'
  | 'error';

export interface TippingFrameState {
  state: FrameState;
  senderFid?: string;
  recipientFid?: string;
  amount?: string;
  platformFee?: string;
  recipientAmount?: string;
  transactionId?: string;
  txHash?: string;
  error?: string;
  timestamp: number;
}

export class FrameStateManager {
  private static states = new Map<string, TippingFrameState>();

  /**
   * Generate a unique state key for a frame session
   */
  static generateStateKey(senderFid: string, recipientFid: string): string {
    return `${senderFid}-${recipientFid}-${Date.now()}`;
  }

  /**
   * Set frame state
   */
  static setState(key: string, state: TippingFrameState): void {
    this.states.set(key, {
      ...state,
      timestamp: Date.now(),
    });

    // Clean up old states (older than 10 minutes)
    this.cleanupOldStates();
  }

  /**
   * Get frame state
   */
  static getState(key: string): TippingFrameState | null {
    const state = this.states.get(key);
    
    if (!state) {
      return null;
    }

    // Check if state is expired (10 minutes)
    if (Date.now() - state.timestamp > 10 * 60 * 1000) {
      this.states.delete(key);
      return null;
    }

    return state;
  }

  /**
   * Update frame state
   */
  static updateState(key: string, updates: Partial<TippingFrameState>): TippingFrameState | null {
    const currentState = this.getState(key);
    
    if (!currentState) {
      return null;
    }

    const newState = {
      ...currentState,
      ...updates,
      timestamp: Date.now(),
    };

    this.setState(key, newState);
    return newState;
  }

  /**
   * Delete frame state
   */
  static deleteState(key: string): void {
    this.states.delete(key);
  }

  /**
   * Clean up old states
   */
  private static cleanupOldStates(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, state] of this.states.entries()) {
      if (now - state.timestamp > 10 * 60 * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.states.delete(key));
  }

  /**
   * Get next state based on current state and action
   */
  static getNextState(
    currentState: FrameState,
    action: 'amount_selected' | 'wallet_connected' | 'confirmed' | 'transaction_sent' | 'transaction_completed' | 'error'
  ): FrameState {
    const stateTransitions: Record<FrameState, Record<string, FrameState>> = {
      initial: {
        amount_selected: 'wallet_check',
      },
      amount_selection: {
        amount_selected: 'wallet_check',
      },
      wallet_check: {
        wallet_connected: 'confirmation',
        error: 'error',
      },
      confirmation: {
        confirmed: 'processing',
        error: 'error',
      },
      processing: {
        transaction_sent: 'processing',
        transaction_completed: 'success',
        error: 'error',
      },
      success: {},
      error: {},
    };

    return stateTransitions[currentState]?.[action] || currentState;
  }

  /**
   * Check if state transition is valid
   */
  static isValidTransition(from: FrameState, to: FrameState): boolean {
    const validTransitions: Record<FrameState, FrameState[]> = {
      initial: ['amount_selection', 'wallet_check'],
      amount_selection: ['wallet_check', 'error'],
      wallet_check: ['confirmation', 'error'],
      confirmation: ['processing', 'error'],
      processing: ['success', 'error'],
      success: [],
      error: ['initial'], // Allow restart from error
    };

    return validTransitions[from]?.includes(to) || false;
  }
}