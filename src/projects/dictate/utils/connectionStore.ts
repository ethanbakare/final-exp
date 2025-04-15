// src/projects/dictate/utils/connectionStore.ts
import { NextApiResponse } from 'next';

type SSEConnection = {
  res: NextApiResponse;
  clientId: string;
};

class ConnectionStore {
  private static instance: ConnectionStore;
  private connections: Map<string, SSEConnection> = new Map();

  private constructor() {}

  static getInstance(): ConnectionStore {
    if (!ConnectionStore.instance) {
      ConnectionStore.instance = new ConnectionStore();
    }
    return ConnectionStore.instance;
  }

  addConnection(clientId: string, res: NextApiResponse): void {
    this.connections.set(clientId, { res, clientId });
    
    // Remove connection when client disconnects
    res.on('close', () => {
      this.removeConnection(clientId);
    });
  }

  removeConnection(clientId: string): void {
    this.connections.delete(clientId);
  }

  broadcast(data: unknown): void {
    this.connections.forEach(({ res }) => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    });
  }
}

// Export a singleton instance
export const connectionStore = ConnectionStore.getInstance();