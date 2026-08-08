import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_1_29_2_2 } from './v1.29.2_2'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_1_29_2_2],
})
