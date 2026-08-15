import { registerWebModule, NativeModule } from 'expo';

import { EchoOverlayModuleEvents } from './EchoOverlay.types';

// EchoOverlayModule is not available on the web platform.
class EchoOverlayModule extends NativeModule<EchoOverlayModuleEvents> {}

export default registerWebModule(EchoOverlayModule, 'EchoOverlayModule');
