import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = process.env.RESEND_FROM ?? 'Tika <onboarding@resend.dev>';
const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

export async function sendInviteEmail(params: {
  toEmail: string;
  inviterName: string;
  workspaceName: string;
  role: 'MEMBER' | 'VIEWER';
  token: string;
  expiresAt: Date;
}): Promise<{ success: boolean; error?: string }> {
  const { toEmail, inviterName, workspaceName, role, token, expiresAt } = params;

  const inviteUrl = `${BASE_URL}/invite/${token}`;
  const roleLabel = role === 'MEMBER' ? '멤버' : '뷰어';
  const expiresLabel = expiresAt.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tika 팀 초대</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:'Noto Sans KR',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#629584;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,.2);border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-weight:700;font-size:18px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">T</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="color:#fff;font-weight:700;font-size:20px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">tika</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2C3E50;">팀에 초대받았습니다</p>
              <p style="margin:0 0 24px;font-size:14px;color:#8993A4;line-height:1.6;">
                <strong style="color:#2C3E50;">${inviterName}</strong>님이
                <strong style="color:#2C3E50;">${workspaceName}</strong> 워크스페이스에
                <strong style="color:#629584;">${roleLabel}</strong>로 초대했습니다.
              </p>

              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;border-radius:10px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table width="100%" cellpadding="4" cellspacing="0">
                      <tr>
                        <td style="font-size:12px;color:#8993A4;width:90px;">워크스페이스</td>
                        <td style="font-size:13px;color:#2C3E50;font-weight:500;">${workspaceName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#8993A4;">초대자</td>
                        <td style="font-size:13px;color:#2C3E50;font-weight:500;">${inviterName}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#8993A4;">역할</td>
                        <td style="font-size:13px;color:#2C3E50;font-weight:500;">${roleLabel}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#8993A4;">만료일</td>
                        <td style="font-size:13px;color:#2C3E50;font-weight:500;">${expiresLabel}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}"
                       style="display:inline-block;padding:14px 40px;background:#629584;color:#fff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">
                      초대 수락하기
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="margin:20px 0 0;font-size:11px;color:#9CA3AF;text-align:center;word-break:break-all;">
                버튼이 작동하지 않으면 아래 링크를 복사해 주세요.<br/>
                <a href="${inviteUrl}" style="color:#629584;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #F3F4F6;">
              <p style="margin:0;font-size:11px;color:#C0C7D0;text-align:center;">
                이 이메일은 tika에서 자동 발송되었습니다. 초대를 요청하지 않았다면 무시하세요.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: `[tika] ${inviterName}님이 ${workspaceName}에 초대했습니다`,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('sendInviteEmail error:', err);
    return { success: false, error: String(err) };
  }
}
