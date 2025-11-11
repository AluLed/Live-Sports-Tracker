// This is a "real" Socket.IO server implementation that runs in the browser.
// It acts as a central message broker, decoupling the real-time communication
// from the React component lifecycle, which solves the update issues.
// In a production environment, this exact logic would move to a Node.js server.

type EventHandler = (data: any) => void;

export class SocketServer {
    private listeners: Record<string, EventHandler[]>;

    constructor() {
        this.listeners = {};
        console.log("Socket Server Initialized (Client-side)");
    }

    // Method for clients to subscribe to events
    on(event: string, handler: EventHandler): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
    }

    // Method for clients to unsubscribe from events
    off(event: string, handler: EventHandler): void {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(h => h !== handler);
        }
    }

    // Method for clients to send events to the server
    emit(event: string, data: any): void {
        console.log(`[Socket Server] Received event "${event}":`, data);
        // The server immediately broadcasts the event to all listening clients
        if (this.listeners[event]) {
            this.listeners[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in handler for event "${event}":`, error);
                }
            });
        }
    }
}

// Create a single, global instance of the server to be used throughout the app
export const socketServer = new SocketServer();
