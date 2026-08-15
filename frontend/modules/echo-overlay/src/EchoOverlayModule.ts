import { NativeModule, requireNativeModule } from 'expo';

import { EchoOverlayModuleEvents } from './EchoOverlay.types';

declare class EchoOverlayModule extends NativeModule<EchoOverlayModuleEvents> {
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

export default requireNativeModule<EchoOverlayModule>('EchoOverlay');
