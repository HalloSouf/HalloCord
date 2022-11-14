import EventEmitter from 'node:events';
import { inflateSync } from 'node:zlib';
import { Buffer } from 'buffer';
import WebSocket, { CloseEvent, ErrorEvent, type Event, type MessageEvent } from 'ws';
import { Status, Opcodes } from '../../utils/Constants';
import Intents from '../../utils/Intents';
import type { IEvent, IHeartbeatPayload } from '../../typings/events.interface';
import type WebSocketManager from './WebSocketManager';

class WebSocketConnection extends EventEmitter {
  private ws: WebSocket | null;
  private sequence: number;
  private manager: WebSocketManager;
  private heartbeatInterval?: NodeJS.Timeout;
  public lastPing: number;
  public gateway: string;
  public status: string;

  constructor(manager: WebSocketManager, gateway: string) {
    super();

    this.ws = null;

    this.manager = manager;

    this.gateway = gateway;

    this.lastPing = 0;
    
    this.sequence = -1;

    this.status = Status.Idle;

    this.connect();
  }

  private connect(): boolean {
    if (this.ws) {
      this.manager.debug('There is already a connection established which exists.');
      return false;
    }

    if (!this.gateway) {
      this.manager.debug(`Could not connect to gateway ${this.gateway}`);
      return false;
    }

    this.manager.debug(`Connecting to gateway ${this.gateway}`);

    this.ws = new WebSocket(this.gateway);
    this.ws.onopen = this.onOpen.bind(this);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onerror = this.onError.bind(this);
    this.ws.onclose = this.onClose.bind(this);
    this.status = Status.Connecting;

    return true;
  }

  private onError(event: ErrorEvent): void {
    this.manager.debug(`Error occurred while connected with gateway ${event.target.url}: ${event.error}`);
  }

  private onOpen(event: Event): void {
    this.manager.debug(`Connection established with gateway ${event.target.url}`);
    this.identify();
  }

  private onClose(event: CloseEvent): void {
    this.manager.debug(`Connection closed with gateway ${event.target.url} (${event.code} ${event.reason})`);
  }

  private onMessage(event: MessageEvent): void {
    let data;
    if (event.data instanceof ArrayBuffer) {
      data = Buffer.from(new Uint8Array(event.data as ArrayBuffer));
    } else if (event.data instanceof Buffer) {
      data = inflateSync(event.data as Buffer).toString();
    } else {
      data = JSON.parse(event.data as string);
    }

    return this.destructPacket(data);
  }

  private destructPacket(packet: IEvent) {
    this.manager.debug(`Received opcode ${packet.op}`);
    switch (packet.op) {
    case Opcodes.Hello:
      this.heartbeat((packet as IEvent<IHeartbeatPayload>).d.heartbeat_interval);
      break;
    case Opcodes.HeartbeatACK:
      this.acknowledgeHeartbeat();
      break;
    case Opcodes.Heartbeat:
      this.heartbeat();
      break;
    }
  }

  private send(data: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) 
      return this.manager.debug('There is no connection available.');

    this.manager.debug(`Sending data over websocket: ${JSON.stringify(data)}`);
    return this.ws.send(JSON.stringify(data));
  }

  private heartbeat(interval?: number): void {
    if (interval && !isNaN(interval)) {
      if (interval === -1 && this.heartbeatInterval) {
        this.manager.client.removeInterval(this.heartbeatInterval);
        this.heartbeatInterval = undefined;
        return;
      }

      this.heartbeatInterval = this.manager.client.addInterval(() => this.heartbeat(), interval);
      return;
    }

    this.manager.debug(`Sending heartbeat with sequence ${this.sequence}`);
    this.lastPing = Date.now();
    return this.send({ op: 1, d: this.sequence });
  }

  private acknowledgeHeartbeat(): void {
    this.manager.debug(`Last heartbeat acknowledged: ${this.manager.heartbeatAck ? 'Yes' : 'No'}`);
    this.manager.pong(this.lastPing);
  }

  private identify(): void {
    return this.send({
      op: 2,
      d: {
        token: this.manager.client.token,
        properties: {
          os: 'linux',
          browser: 'hallocord',
          device: 'hallocord'
        },
        intents: new Intents(this.manager.client.options.intents).bits
      }
    });
  }
}

export default WebSocketConnection;