"use client";

import type { WorkflowDefinition } from "@rezaru/workflow-schema";
import {
  Background, Controls, Handle, MarkerType, Position, ReactFlow, type Edge, type Node, type NodeProps
} from "@xyflow/react";
import { BadgeCheck, Bot, Braces, Clock3, GitBranch, Play, Plug, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { useLang, useT } from "@/components/i18n";
import { uiCopy, type UiCopyKey } from "@/components/ui-copy";
import type { Lang } from "@/components/landing-copy";

const icons = {
  trigger: Play,
  action: Plug,
  condition: GitBranch,
  transform: Braces,
  delay: Clock3,
  approval: ShieldCheck,
  ai_task: Bot
};

function WorkflowNode({ data }: NodeProps<Node<{ label: string; description: string; type: string; status?: string }>>) {
  const t = useT();
  const Icon = icons[data.type as keyof typeof icons] ?? BadgeCheck;
  // Step kinds come from the workflow schema, so the key is built rather than
  // written out; an unknown kind falls back to its readable raw form.
  const kindKey = `flow.${data.type}` as UiCopyKey;
  const kind = kindKey in uiCopy.ru ? t(kindKey) : data.type.replace("_", " ");
  return <div className={`flow-node ${data.status ? `flow-${data.status.toLowerCase()}` : ""}`}>
    <Handle type="target" position={Position.Left} />
    <div className="flow-icon"><Icon size={15} /></div>
    <div><span>{kind}</span><b>{data.label}</b><small>{data.description}</small></div>
    <Handle type="source" position={Position.Right} />
  </div>;
}

function buildGraph(workflow: WorkflowDefinition, statuses: Record<string, string>, lang: Lang): { nodes: Node[]; edges: Edge[] } {
  const yes = uiCopy[lang]["flow.yes"];
  const no = uiCopy[lang]["flow.no"];
  const triggerNode: Node = {
    id: "trigger",
    type: "workflow",
    position: { x: 0, y: 40 },
    data: { label: `${uiCopy[lang]["flow.startNode"]}: ${workflow.trigger.type}`, description: workflow.trigger.operationKey, type: "trigger" }
  };
  const depth = new Map<string, number>();
  const incoming = new Map<string, number>();
  for (const step of workflow.steps) incoming.set(step.id, 0);
  for (const step of workflow.steps) {
    for (const next of [...step.next, ...(step.condition?.trueNext ?? []), ...(step.condition?.falseNext ?? [])]) {
      incoming.set(next, (incoming.get(next) ?? 0) + 1);
    }
  }
  const roots = workflow.steps.filter((step) => (incoming.get(step.id) ?? 0) === 0);
  roots.forEach((step) => depth.set(step.id, 1));
  for (let round = 0; round < workflow.steps.length; round += 1) {
    for (const step of workflow.steps) {
      const currentDepth = depth.get(step.id);
      if (currentDepth === undefined) continue;
      for (const next of [...step.next, ...(step.condition?.trueNext ?? []), ...(step.condition?.falseNext ?? [])]) {
        depth.set(next, Math.max(depth.get(next) ?? 0, currentDepth + 1));
      }
    }
  }
  const rows = new Map<number, number>();
  const nodes = [triggerNode, ...workflow.steps.map((step) => {
    const column = depth.get(step.id) ?? 1;
    const row = rows.get(column) ?? 0;
    rows.set(column, row + 1);
    return {
      id: step.id,
      type: "workflow",
      position: { x: column * 275, y: row * 135 + 20 },
      data: { label: step.name, description: step.description, type: step.type, status: statuses[step.id] }
    } satisfies Node;
  })];
  const edges: Edge[] = [];
  roots.forEach((step) => edges.push({
    id: `trigger-${step.id}`,
    source: "trigger",
    target: step.id,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: "#a9aaa3" }
  }));
  for (const step of workflow.steps) {
    const append = (target: string, label?: string) => edges.push({
      id: `${step.id}-${target}-${label ?? ""}`,
      source: step.id,
      target,
      label,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: label === yes ? "#18865d" : label === no ? "#a9670d" : "#a9aaa3" },
      labelStyle: { fontSize: 9, fontWeight: 650 }
    });
    step.next.forEach((next) => append(next));
    step.condition?.trueNext.forEach((next) => append(next, yes));
    step.condition?.falseNext.forEach((next) => append(next, no));
  }
  return { nodes, edges };
}

export function TechnicalWorkflowView({ workflow, statuses = {} }: { workflow: WorkflowDefinition; statuses?: Record<string, string> }) {
  const t = useT();
  const { lang } = useLang();
  const graph = useMemo(() => buildGraph(workflow, statuses, lang), [workflow, statuses, lang]);
  return <div className="technical-flow" aria-label={t("flow.aria")}>
    <ReactFlow nodes={graph.nodes} edges={graph.edges} nodeTypes={{ workflow: WorkflowNode }} fitView nodesDraggable={false} nodesConnectable={false} elementsSelectable minZoom={0.35} maxZoom={1.5}>
      <Background color="#deded6" gap={18} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  </div>;
}
