import { NextRequest, NextResponse } from 'next/server';

const SUBJECT_LABELS: Record<string, string> = {
  enterprise: 'Enterprise 도입 문의',
  pro:        'Team Pro 출시 알림 신청',
  partnership:'파트너십 / 제휴',
  feature:    '기능 요청',
  bug:        '버그 제보',
  other:      '기타 문의',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; phone?: string; subject?: string; message?: string };
    const { email, phone, subject, message } = body;

    if (!email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: 'Message too short' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const payload = {
      text: '📬 Tika 문의가 접수되었습니다',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: '📬 Tika 도입 문의', emoji: true },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*이메일*\n${email}` },
            { type: 'mrkdwn', text: `*연락처*\n${phone || '미입력'}` },
            { type: 'mrkdwn', text: `*문의 유형*\n${SUBJECT_LABELS[subject] ?? subject}` },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*내용*\n${message}` },
        },
        { type: 'divider' },
      ],
    };

    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!slackRes.ok) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
