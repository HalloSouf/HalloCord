export interface IEvent<T = {}> {
  op: number;
  d: T;
}

export interface IHeartbeatPayload {
  heartbeat_interval: number;
}
