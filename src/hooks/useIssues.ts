'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Issue, IssueType } from '@/types/index';

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/issues');
      if (!res.ok) throw new Error('이슈를 불러오지 못했습니다');
      const data = await res.json();
      setIssues(data.issues);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goals = useMemo(() => issues.filter((i) => i.type === 'GOAL'), [issues]);
  const stories = useMemo(
    () => issues.filter((i) => i.type === 'STORY' && i.parentId === selectedGoalId),
    [issues, selectedGoalId],
  );
  const features = useMemo(
    () => issues.filter((i) => i.type === 'FEATURE' && i.parentId === selectedStoryId),
    [issues, selectedStoryId],
  );

  const createIssue = useCallback(
    async (data: { name: string; type: IssueType; parentId?: number | null }) => {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? '이슈 생성에 실패했습니다');
      }
      const { issue } = await res.json();
      setIssues((prev) => [...prev, issue]);
      return issue as Issue;
    },
    [],
  );

  const updateIssue = useCallback(
    async (id: number, data: { name?: string; parentId?: number | null }) => {
      const res = await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? '이슈 수정에 실패했습니다');
      }
      const { issue } = await res.json();
      setIssues((prev) => prev.map((i) => (i.id === id ? issue : i)));
      return issue as Issue;
    },
    [],
  );

  const deleteIssue = useCallback(async (id: number) => {
    await fetch(`/api/issues/${id}`, { method: 'DELETE' });
    setIssues((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return {
    issues,
    goals,
    stories,
    features,
    isLoading,
    selectedGoalId,
    selectedStoryId,
    setSelectedGoalId,
    setSelectedStoryId,
    fetchIssues,
    createIssue,
    updateIssue,
    deleteIssue,
  };
}
