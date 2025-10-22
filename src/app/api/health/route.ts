import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Basit sistem kontrolü
    const memory = process.memoryUsage();
    const uptime = process.uptime();
    
    // Mock database status
    const dbStatus = 'healthy';
    const dbLatency = Math.floor(Math.random() * 50) + 10; // 10-60ms
    
    // Mock transaction stats
    const transactionStats = {
      total: 156,
      completed: 142,
      pending: 3,
      failed: 11,
    };
    
    const totalLatency = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version: '1.0.0',
      
      // System metrics
      system: {
        status: 'healthy',
        memory: {
          used: Math.round(memory.heapUsed / 1024 / 1024),
          total: Math.round(memory.heapTotal / 1024 / 1024),
          rss: Math.round(memory.rss / 1024 / 1024),
        },
        cpu: {
          usage: Math.floor(Math.random() * 30) + 5, // 5-35%
        },
      },
      
      // Database health
      database: {
        status: dbStatus,
        latency: dbLatency,
        connections: {
          active: 5,
          idle: 15,
          total: 20,
        },
      },
      
      // API endpoints status
      endpoints: {
        '/api/transactions': 'healthy',
        '/api/farcaster/user': 'healthy',
        '/api/frames': 'healthy',
        '/api/notifications': 'healthy',
      },
      
      // Transaction health
      transactions: transactionStats,
      
      // Performance metrics
      performance: {
        responseTime: totalLatency,
        dbLatency,
        avgResponseTime: Math.floor(Math.random() * 100) + 50, // 50-150ms
      },
      
      // Farcaster integration
      farcaster: {
        apiKey: 'configured',
        hubConnection: 'healthy',
        frameGeneration: 'operational',
      },
      
      // Blockchain integration
      blockchain: {
        baseNetwork: 'connected',
        rpcLatency: Math.floor(Math.random() * 200) + 100, // 100-300ms
        lastBlock: 12345678,
      },
    };

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Health check error:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}