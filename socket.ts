// This has been updated from a mock server to a real WebSocket client.
// It connects to a public service to allow for real-time, multi-device
// communication, which is necessary for a collaborative app.
// NOTE: This uses a public demo server. For a production app, you would
// use your own secure, private WebSocket server.

type EventHandler = (data: any) => void;

// FIX: Export the SocketClient class to allow it to be used as a type elsewhere in the application.
export class SocketClient {
    private ws: WebSocket | null = null;
    private listeners: Record<string, EventHandler[]> = {};
    private isConnected: boolean = false;
    private messageQueue: string[] = [];
    private reconnectInterval: number = 1000; // Start with 1 second
    private maxReconnectInterval: number = 30000; // Max 30 seconds


    constructor() {
        this.connect();
    }
    
    private scheduleReconnect() {
        const timeout = Math.min(this.maxReconnectInterval, this.reconnectInterval * 2);
        this.reconnectInterval = timeout;
        
        console.log(`Will attempt to reconnect in ${timeout / 1000} seconds.`);
        
        setTimeout(() => this.connect(), timeout);
    }

    private connect() {
        // A public WebSocket for demo purposes.
        // Messages are public and not persisted.
        const wsUrl = 'wss://socketsbay.com/wss/v2/1/demo/';
        
        // Avoid creating duplicate connections
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.ws = new WebSocket(wsUrl);
        console.log("Attempting to connect to WebSocket server...");

        this.ws.onopen = () => {
            console.log("WebSocket Connection Established.");
            this.isConnected = true;
            this.reconnectInterval = 1000; // Reset interval on successful connection
            // Send any queued messages
            this.messageQueue.forEach(msg => this.ws?.send(msg));
            this.messageQueue = [];
        };

        this.ws.onmessage = (event) => {
            try {
                // The demo server might send extraneous messages, so we parse carefully.
                const message = JSON.parse(event.data);
                
                if (message.event && this.listeners[message.event]) {
                    console.log(`[Socket Client] Received event "${message.event}":`, message.data);
                    this.listeners[message.event].forEach(handler => handler(message.data));
                }
            } catch (error) {
                // Ignore messages that aren't in our expected JSON format
            }
        };

        this.ws.onerror = () => {
            // The error event itself is not descriptive. The 'onclose' event provides more details.
            // We log a warning instead of an error because the application is designed
            // to handle this by automatically reconnecting.
            console.warn("WebSocket connection issue detected. See 'onclose' event for details. Reconnection is in progress.");
        };

        this.ws.onclose = (event: CloseEvent) => {
            console.log(
                `WebSocket Connection Closed. Clean close: ${event.wasClean}, Code: ${event.code}, Reason: "${event.reason || 'No reason given'}".`
            );
            this.isConnected = false;
            this.ws = null;
            this.scheduleReconnect(); // Use exponential backoff to reconnect
        };
    }

    // Method for components to subscribe to events
    on(event: string, handler: EventHandler): void {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
    }

    // Method for components to unsubscribe from events
    off(event: string, handler: EventHandler): void {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(h => h !== handler);
        }
    }

    // Method for components to send events
    emit(event: string, data: any): void {
        const message = JSON.stringify({ event, data });
        if (this.isConnected && this.ws) {
            this.ws.send(message);
        } else {
            // Queue the message if not connected yet
            this.messageQueue.push(message);
            console.log(`[Socket Client] Connection not ready. Queued event "${event}".`);
        }
    }
}

// Create a single, global instance to be used throughout the app.
// The variable name is kept as `socketServer` for compatibility with existing code.
export const socketServer = new SocketClient();