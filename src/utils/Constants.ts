export const Status = {
  Ready: 'Ready',
  Connecting: 'Connecting',
  Reconnecting: 'Reconnecting',
  Idle: 'Idle',
  Disconnected: 'Disconnected'
};

export const Opcodes = {
  Dispatch: 0,
  Heartbeat: 1,
  Identify: 2,
  PresenceUpdate: 3,
  VoiceStateUpdate: 4,
  Resume: 5,
  Reconnect: 7,
  RequestGuildMembers: 8,
  InvalidSession: 9,
  Hello: 10,
  HeartbeatACK: 11
};
