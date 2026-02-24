'use client';

import type { Issue } from '@/types/index';

const TYPE_PREFIX: Record<string, string> = {
  GOAL: 'G',
  STORY: 'S',
  FEATURE: 'F',
};

const TYPE_COLORS: Record<string, string> = {
  GOAL: 'text-purple-600',
  STORY: 'text-blue-600',
  FEATURE: 'text-teal-600',
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
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {chain.map((item, idx) => (
        <span key={item.id} className="flex items-center gap-1">
          {idx > 0 && <span className="text-gray-300">›</span>}
          <span className={`font-medium ${TYPE_COLORS[item.type] ?? 'text-gray-600'}`}>
            [{TYPE_PREFIX[item.type] ?? '?'}]
          </span>
          <span className="text-gray-600">{item.name}</span>
        </span>
      ))}
    </div>
  );
}
