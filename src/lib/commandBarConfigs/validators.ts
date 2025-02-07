import { Models } from '@kittycad/lib'
import { engineCommandManager } from 'lib/singletons'
import { uuidv4 } from 'lib/utils'
import { CommandBarContext } from 'machines/commandBarMachine'
import { Selections } from 'lib/selections'

export const disableDryRunWithRetry = async (numberOfRetries = 3) => {
  for (let tries = 0; tries < numberOfRetries; tries++) {
    try {
      await engineCommandManager.sendSceneCommand({
        type: 'modeling_cmd_req',
        cmd_id: uuidv4(),
        cmd: { type: 'disable_dry_run' },
      })
      // Exit out since the command was successful
      return
    } catch (e) {
      console.error(e)
      console.error('disable_dry_run failed. This is bad!')
    }
  }
}

// Takes a callback function and wraps it around enable_dry_run and disable_dry_run
export const dryRunWrapper = async (callback: () => Promise<any>) => {
  // Gotcha: What about race conditions?
  try {
    await engineCommandManager.sendSceneCommand({
      type: 'modeling_cmd_req',
      cmd_id: uuidv4(),
      cmd: { type: 'enable_dry_run' },
    })
    const result = await callback()
    return result
  } catch (e) {
    console.error(e)
  } finally {
    await disableDryRunWithRetry(5)
  }
}

function isSelections(selections: unknown): selections is Selections {
  return (
    (selections as Selections).graphSelections !== undefined &&
    (selections as Selections).otherSelections !== undefined
  )
}

export const revolveAxisValidator = async ({
  data,
  context,
}: {
  data: { [key: string]: Selections }
  context: CommandBarContext
}): Promise<boolean | string> => {
  if (!isSelections(context.argumentsToSubmit.selection)) {
    return 'Unable to revolve, selections are missing'
  }
  const artifact =
    context.argumentsToSubmit.selection.graphSelections[0].artifact

  if (!artifact) {
    return 'Unable to revolve, sketch not found'
  }

  if (!('pathId' in artifact)) {
    return 'Unable to revolve, sketch has no path'
  }

  const sketchSelection = artifact.pathId
  let edgeSelection = data.edge.graphSelections[0].artifact?.id

  if (!sketchSelection) {
    return 'Unable to revolve, sketch is missing'
  }

  if (!edgeSelection) {
    return 'Unable to revolve, edge is missing'
  }

  const angleInDegrees: Models['Angle_type'] = {
    unit: 'degrees',
    value: 360,
  }

  const revolveAboutEdgeCommand = async () => {
    return await engineCommandManager.sendSceneCommand({
      type: 'modeling_cmd_req',
      cmd_id: uuidv4(),
      cmd: {
        type: 'revolve_about_edge',
        angle: angleInDegrees,
        edge_id: edgeSelection,
        target: sketchSelection,
        tolerance: 0.0001,
      },
    })
  }
  const attemptRevolve = await dryRunWrapper(revolveAboutEdgeCommand)
  if (attemptRevolve?.success) {
    return true
  } else {
    // return error message for the toast
    return 'Unable to revolve with selected edge'
  }
}

export const loftValidator = async ({
  data,
}: {
  data: { [key: string]: Selections }
  context: CommandBarContext
}): Promise<boolean | string> => {
  if (!isSelections(data.selection)) {
    return 'Unable to loft, selections are missing'
  }
  const { selection } = data

  if (selection.graphSelections.some((s) => s.artifact?.type !== 'solid2D')) {
    return 'Unable to loft, some selection are not solid2Ds'
  }

  const sectionIds = data.selection.graphSelections.flatMap((s) =>
    s.artifact?.type === 'solid2D' ? s.artifact.pathId : []
  )

  if (sectionIds.length < 2) {
    return 'Unable to loft, selection contains less than two solid2Ds'
  }

  const loftCommand = async () => {
    // TODO: check what to do with these
    const DEFAULT_V_DEGREE = 2
    const DEFAULT_TOLERANCE = 2
    const DEFAULT_BEZ_APPROXIMATE_RATIONAL = false
    return await engineCommandManager.sendSceneCommand({
      type: 'modeling_cmd_req',
      cmd_id: uuidv4(),
      cmd: {
        section_ids: sectionIds,
        type: 'loft',
        bez_approximate_rational: DEFAULT_BEZ_APPROXIMATE_RATIONAL,
        tolerance: DEFAULT_TOLERANCE,
        v_degree: DEFAULT_V_DEGREE,
      },
    })
  }
  const attempt = await dryRunWrapper(loftCommand)
  if (attempt?.success) {
    return true
  } else {
    // return error message for the toast
    return 'Unable to loft with selected sketches'
  }
}
