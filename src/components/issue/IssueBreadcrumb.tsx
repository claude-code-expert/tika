'use client';

import type { Issue } from '@/types/index';

const TYPE_PREFIX: Record<string, string> = {
  GOAL: 'G',
  STORY: 'S',
  FEATURE: 'F',
};

const TYPE_COLORS: Record<string, string> = {
  GOAL: '#8B5CF6',
  STORY: '#3B82F6',
  FEATURE: '#10B981',
};

interface IssueBreadcrumbProps {
  issue: Issue;
  allIssues?: Issue[];
}

function buildChain(issue: Issue, allIssues: Issue[]): Issue[] {
  const chain: Issue[] = [issue];
  let current = issue;
  while (current.parentId) {
    const parent = allIssues.find((i) => i.id === current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export function IssueBreadcrumb({ issue, allIssues = [] }: IssueBreadcrumbProps) {
  if (!issue) return null;

  const chain = buildChain(issue, allIssues);

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
      }}
    >
      {chain.map((item, idx) => (
        <span key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {idx > 0 && (
            <span style={{ color: 'var(--color-border-hover)', fontWeight: 500 }}>›</span>
          )}
          <span
            style={{
              fontWeight: 600,
              color: TYPE_COLORS[item.type] ?? 'var(--color-text-muted)',
            }}
          >
            [{TYPE_PREFIX[item.type] ?? '?'}]
          </span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{item.name}</span>
        </span>
      ))}
    </div>
  );
}
