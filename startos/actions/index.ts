import { sdk } from '../sdk'
import { configureDojoAction } from './configureDojo'
import { selectBitcoinNodeAction } from './selectBitcoinNode'
import { selectIndexerAction } from './selectIndexer'
import { viewPairingCodeAction } from './viewPairingCode'


export const actions = sdk.Actions.of()
  .addAction(selectBitcoinNodeAction)
  .addAction(selectIndexerAction)
  .addAction(configureDojoAction)
  .addAction(viewPairingCodeAction)