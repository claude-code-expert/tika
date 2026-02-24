'use client';

import { useState, useCallback } from 'react';
import type { Label } from '@/types/index';

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLabels = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/labels');
      if (!res.ok) throw new Error('라벨을 불러오지 못했습니다');
      const data = await res.json();
      setLabels(data.labels);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLabel = useCallback(async (data: { name: string; color: string }) => {
    const res = await fetch('/api/labels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message ?? '라벨 생성에 실패했습니다');
    }
    const { label } = await res.json();
    setLabels((prev) => [...prev, label]);
    return label as Label;
  }, []);

  const updateLabel = useCallback(async (id: number, data: { name?: string; color?: string }) => {
    const res = await fetch(`/api/labels/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message ?? '라벨 수정에 실패했습니다');
    }
    const { label } = await res.json();
    setLabels((prev) => prev.map((l) => (l.id === id ? label : l)));
    return label as Label;
  }, []);

  const deleteLabel = useCallback(async (id: number) => {
    await fetch(`/api/labels/${id}`, { method: 'DELETE' });
    setLabels((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { labels, isLoading, fetchLabels, createLabel, updateLabel, deleteLabel };
}
