import { ArtifactGraph } from 'lang/std/artifactGraph'
import { Selections } from 'lib/selections'
import { Expr } from 'wasm-lib/kcl/bindings/Expr'
import { Program } from 'wasm-lib/kcl/bindings/Program'
import { Node } from 'wasm-lib/kcl/bindings/Node'
import { PathToNode, VariableDeclarator } from 'lang/wasm'
import {
  getPathToExtrudeForSegmentSelection,
  mutateAstWithTagForSketchSegment,
} from './addEdgeTreatment'
import { getNodeFromPath } from 'lang/queryAst'
import { err } from 'lib/trap'
import {
  createLiteral,
  createIdentifier,
  findUniqueName,
  createCallExpressionStdLib,
  createObjectExpression,
  createArrayExpression,
  createVariableDeclaration,
} from 'lang/modifyAst'
import { KCL_DEFAULT_CONSTANT_PREFIXES } from 'lib/constants'

export function addShell({
  node,
  selection,
  artifactGraph,
  thickness,
}: {
  node: Node<Program>
  selection: Selections
  artifactGraph: ArtifactGraph
  thickness: Expr
}): Error | { modifiedAst: Node<Program>; pathToNode: PathToNode } {
  const modifiedAst = structuredClone(node)

  // Look up the corresponding extrude
  const clonedAstForGetExtrude = structuredClone(modifiedAst)

  const expressions: Expr[] = []
  let pathToExtrudeNode: PathToNode | undefined = undefined
  for (const graphSelection of selection.graphSelections) {
    const extrudeLookupResult = getPathToExtrudeForSegmentSelection(
      clonedAstForGetExtrude,
      graphSelection,
      artifactGraph
    )
    if (err(extrudeLookupResult)) {
      return new Error("Couldn't find extrude")
    }

    // TODO: this assumes the segment is piped directly from the sketch, with no intermediate `VariableDeclarator` between.
    // We must find a technique for these situations that is robust to intermediate declarations
    const extrudeNode = getNodeFromPath<VariableDeclarator>(
      modifiedAst,
      extrudeLookupResult.pathToExtrudeNode,
      'VariableDeclarator'
    )
    const segmentNode = getNodeFromPath<VariableDeclarator>(
      modifiedAst,
      extrudeLookupResult.pathToSegmentNode,
      'VariableDeclarator'
    )
    if (err(extrudeNode) || err(segmentNode)) {
      return new Error("Couldn't find extrude")
    }
    if (extrudeNode.node.init.type === 'CallExpression') {
      pathToExtrudeNode = extrudeLookupResult.pathToExtrudeNode
    } else if (segmentNode.node.init.type === 'PipeExpression') {
      pathToExtrudeNode = extrudeLookupResult.pathToSegmentNode
    } else {
      return new Error("Couldn't find extrude")
    }

    const selectedArtifact = graphSelection.artifact
    if (!selectedArtifact) {
      return new Error('Bad artifact')
    }

    // Check on the selection, and handle the wall vs cap casees
    let expr: Expr
    if (selectedArtifact.type === 'cap') {
      expr = createLiteral(selectedArtifact.subType)
    } else if (selectedArtifact.type === 'wall') {
      const tagResult = mutateAstWithTagForSketchSegment(
        modifiedAst,
        extrudeLookupResult.pathToSegmentNode
      )
      if (err(tagResult)) return tagResult
      const { tag } = tagResult
      expr = createIdentifier(tag)
    } else {
      continue
    }
    expressions.push(expr)
  }

  if (!pathToExtrudeNode) return new Error('No extrude found')

  const extrudeNode = getNodeFromPath<VariableDeclarator>(
    modifiedAst,
    pathToExtrudeNode,
    'VariableDeclarator'
  )
  if (err(extrudeNode)) {
    return extrudeNode
  }

  const name = findUniqueName(node, KCL_DEFAULT_CONSTANT_PREFIXES.SHELL)
  const shell = createCallExpressionStdLib('shell', [
    createObjectExpression({
      faces: createArrayExpression(expressions),
      thickness,
    }),
    createIdentifier(extrudeNode.node.id.name),
  ])
  const declaration = createVariableDeclaration(name, shell)

  // TODO: check if we should append at the end like here or right after the extrude
  modifiedAst.body.push(declaration)
  const pathToNode: PathToNode = [
    ['body', ''],
    [modifiedAst.body.length - 1, 'index'],
    ['declaration', 'VariableDeclaration'],
    ['init', 'VariableDeclarator'],
    ['arguments', 'CallExpression'],
    [0, 'index'],
  ]
  return {
    modifiedAst,
    pathToNode,
  }
}
