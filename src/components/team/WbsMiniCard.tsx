'use client';

import type { Ticket } from '@/types/index';

const TYPE_COLORS: Record<string, { bg: string; label: string }> = {
  GOAL: { bg: '#8B5CF6', label: 'G' },
  STORY: { bg: '#3B82F6', label: 'S' },
  FEATURE: { bg: '#10B981', label: 'F' },
};

interface WbsMiniCardProps {
  issues: Ticket[];
}

interface TreeNode extends Ticket {
  children: TreeNode[];
}

function buildTree(tickets: Ticket[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  for (const ticket of tickets) {
    map.set(ticket.id, { ...ticket, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentId) {
      map.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function IssueRow({ node, depth }: { node: TreeNode; depth: number }) {
  const style = TYPE_COLORS[node.type] ?? TYPE_COLORS.GOAL;
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          paddingLeft: depth * 16,
          borderBottom: '1px solid #F9FAFB',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            borderRadius: 3,
            fontSize: 8,
            fontWeight: 700,
            color: '#fff',
            background: style.bg,
            flexShrink: 0,
          }}
        >
          {style.label}
        </span>
        <span
          style={{
            fontSize: 12,
            color: '#374151',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {node.title}
        </span>
      </div>
      {node.children.map((child) => (
        <IssueRow key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export function WbsMiniCard({ issues }: WbsMiniCardProps) {
  if (issues.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '16px 0' }}>
        이슈 계층 없음
      </div>
    );
  }

  const tree = buildTree(issues);

  return (
    <div style={{ maxHeight: 220, overflowY: 'auto' }}>
      {tree.slice(0, 10).map((node) => (
        <IssueRow key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}
