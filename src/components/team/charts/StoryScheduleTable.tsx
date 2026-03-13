import type { TicketWithMeta } from '@/types/index';

interface StoryScheduleTableProps {
  stories: TicketWithMeta[];
  allTickets: TicketWithMeta[];
}

function daysRemaining(dueDate?: string | null): number | null {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function StoryScheduleTable({ stories, allTickets }: StoryScheduleTableProps) {
  if (stories.length === 0) {
    return <div style={{ fontSize: 13, color: '#9BA8B4', textAlign: 'center', padding: '20px 0' }}>Story 티켓이 없습니다</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #DFE1E6' }}>
            {['Story', '상태', '완료율', '하위 티켓', '마감일', '남은 일수'].map((h) => (
              <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#5A6B7F', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stories.map((story) => {
            const children = allTickets.filter((t) => t.parentId === story.id);
            const done = children.filter((t) => t.status === 'DONE').length;
            const total = children.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const days = daysRemaining(story.dueDate);
            const isOverdue = days !== null && days < 0;

            return (
              <tr key={story.id} style={{ borderBottom: '1px solid #F1F3F6' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2C3E50', maxWidth: 200 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.title}</div>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                    background: story.status === 'DONE' ? '#D1FAE5' : story.status === 'IN_PROGRESS' ? '#FEF3C7' : '#EEF2FF',
                    color: story.status === 'DONE' ? '#065F46' : story.status === 'IN_PROGRESS' ? '#92400E' : '#3730A3',
                  }}>{story.status}</span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#E8EDF2', borderRadius: 3, minWidth: 60 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#629584', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#5A6B7F', whiteSpace: 'nowrap' }}>{pct}%</span>
                  </div>
                </td>
                <td style={{ padding: '10px 12px', color: '#5A6B7F', textAlign: 'center' }}>
                  {done}/{total}
                </td>
                <td style={{ padding: '10px 12px', color: '#5A6B7F', whiteSpace: 'nowrap' }}>
                  {story.dueDate ?? '—'}
                </td>
                <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                  {days === null ? (
                    <span style={{ color: '#9BA8B4' }}>—</span>
                  ) : isOverdue ? (
                    <span style={{ color: '#DC2626', fontWeight: 700 }}>D+{Math.abs(days)}</span>
                  ) : (
                    <span style={{ color: days <= 3 ? '#D97706' : '#629584', fontWeight: 600 }}>D-{days}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
