import { Endpoints } from '../utils/Constants';
import type { IGatewayOptions } from '../typings/rest.interface';

class RestManager {
  public gateway(options: IGatewayOptions): string {
    return `${Endpoints.gateway}/?v=${options.version}&encoding=${options.encoding || 'json'}`;
  }
}

export default RestManager;