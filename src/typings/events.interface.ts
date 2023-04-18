export interface IDispatchEvent {
  name: string;
}

export interface IEvent<T> {
  op: number;
  t: string | null;
  s: number | null;
  d: T;
}

export interface IHeartbeatPayload {
  heartbeat_interval: number;
}
