export interface IGatewayOptions {
  version: 10 | 9;
  encoding: 'json' | 'etf';
  compress?: 'zlib-stream';
}