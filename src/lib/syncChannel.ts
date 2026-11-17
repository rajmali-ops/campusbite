import { BroadcastMessage } from '@/types';

const CHANNEL_NAME = 'campusbite_sync_channel';

class SyncBus {
  private channel: BroadcastChannel | null = null;
  private listeners: ((msg: BroadcastMessage) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
        this.notify(event.data);
      };
    }
  }

  public publish(type: BroadcastMessage['type'], payload: any = {}) {
    const msg: BroadcastMessage = {
      type,
      payload,
      timestamp: Date.now()
    };

    // Broadcast to other windows / tabs / HDMI display
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.error('Failed to broadcast message:', e);
      }
    }

    // Also notify same-tab listeners
    this.notify(msg);
  }

  public subscribe(callback: (msg: BroadcastMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(msg: BroadcastMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }
}

export const syncBus = new SyncBus();
