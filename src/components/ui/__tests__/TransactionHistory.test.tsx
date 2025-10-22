import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TransactionHistory } from '../TransactionHistory';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('TransactionHistory', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  const mockTransactions = [
    {
      id: 'tx1',
      senderFid: '12345',
      recipientFid: '67890',
      amount: '0.05',
      platformFee: '0.0005',
      recipientAmount: '0.0495',
      token: 'ETH',
      txHash: '0xabc123',
      status: 'confirmed',
      createdAt: '2024-01-01T12:00:00Z',
      direction: 'sent',
      counterparty: '67890',
    },
    {
      id: 'tx2',
      senderFid: '67890',
      recipientFid: '12345',
      amount: '0.01',
      platformFee: '0.0001',
      recipientAmount: '0.0099',
      token: 'ETH',
      txHash: '0xdef456',
      status: 'pending',
      createdAt: '2024-01-02T12:00:00Z',
      direction: 'received',
      counterparty: '67890',
    },
  ];

  it('should render loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<TransactionHistory userFid="12345" />);

    // Check for loading skeleton
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(1);
  });

  it('should render transactions after loading', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        pagination: { hasMore: false },
      }),
    } as Response);

    render(<TransactionHistory userFid="12345" />);

    await waitFor(() => {
      expect(screen.getByText('Sent to')).toBeInTheDocument();
      expect(screen.getByText('Received from')).toBeInTheDocument();
    });

    expect(screen.getAllByText('user 67890')).toHaveLength(2);
    expect(screen.getByText('-0.0500 ETH')).toBeInTheDocument();
    expect(screen.getByText('+0.0099 ETH')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<TransactionHistory userFid="12345" />);

    await waitFor(() => {
      expect(screen.getByText(/Error loading transactions/)).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should render empty state when no transactions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        transactions: [],
        pagination: { hasMore: false },
      }),
    } as Response);

    render(<TransactionHistory userFid="12345" />);

    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
    });

    expect(screen.getByText('Your transaction history will appear here')).toBeInTheDocument();
  });

  it('should filter transactions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        pagination: { hasMore: false },
      }),
    } as Response);

    render(<TransactionHistory userFid="12345" />);

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    // Click on "Sent" filter
    fireEvent.click(screen.getByText('Sent'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=sent')
      );
    });
  });

  it('should load more transactions', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transactions: [mockTransactions[0]],
          pagination: { hasMore: true },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          transactions: [mockTransactions[1]],
          pagination: { hasMore: false },
        }),
      } as Response);

    render(<TransactionHistory userFid="12345" />);

    await waitFor(() => {
      expect(screen.getByText('Load More')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Load More'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  it('should display transaction status correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        pagination: { hasMore: false },
      }),
    } as Response);

    render(<TransactionHistory userFid="12345" />);

    await waitFor(() => {
      expect(screen.getByText('confirmed')).toBeInTheDocument();
      expect(screen.getByText('pending')).toBeInTheDocument();
    });
  });

  it('should display transaction hashes as links', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        pagination: { hasMore: false },
      }),
    } as Response);

    render(<TransactionHistory userFid="12345" />);

    await waitFor(() => {
      const txLinks = screen.getAllByRole('link');
      const txLink = txLinks.find(link => link.getAttribute('href')?.includes('0xabc123'));
      expect(txLink).toBeInTheDocument();
      expect(txLink?.getAttribute('href')).toBe('https://basescan.org/tx/0xabc123');
    });
  });
});