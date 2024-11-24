import { CoreDumpManager } from 'lib/coredump'
import { codeManager, engineCommandManager } from 'lib/singletons'
import { useSettingsAuthContext } from 'hooks/useSettingsAuthContext'
import useHotkeyWrapper from 'lib/hotkeyWrapper'
import toast from 'react-hot-toast'
import { coreDump } from 'lang/wasm'
import { useMemo } from 'react'
import { reportRejection } from 'lib/trap'

export default function CoreDump() {
  const { auth } = useSettingsAuthContext()
  const token = auth?.context?.token
  const coreDumpManager = useMemo(
    () => new CoreDumpManager(engineCommandManager, codeManager, token),
    []
  )
  useHotkeyWrapper(['mod + shift + .'], () => {
    toast
      .promise(
        coreDump(coreDumpManager, true),
        {
          loading: 'Starting core dump...',
          success: 'Core dump completed successfully',
          error: 'Error while exporting core dump',
        },
        {
          success: {
            // Note: this extended duration is especially important for Playwright e2e testing
            // default duration is 2000 - https://react-hot-toast.com/docs/toast#default-durations
            duration: 6000,
          },
        }
      )
      .catch(reportRejection)
  })
  return null
}
