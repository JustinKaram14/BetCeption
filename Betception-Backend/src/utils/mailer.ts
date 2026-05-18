import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function createTransporter() {
  if (!env.smtp) return null;
  return nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });
}

const transporter = createTransporter();

if (transporter) {
  transporter.verify().then(() => {
    console.log('[SMTP] Connection verified successfully');
  }).catch((err: unknown) => {
    console.error('[SMTP] Connection verification FAILED:', err);
  });
} else {
  console.warn('[SMTP] No SMTP config found — emails will be logged to console only');
}

function buildVerificationEmail(username: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Mail bestätigen – BetCeption</title>
</head>
<body style="margin:0;padding:0;background-color:#07090f;font-family:Arial,Helvetica,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:linear-gradient(160deg,#0d1b2a 0%,#090e1a 100%);border-radius:16px;border:1px solid rgba(0,255,255,0.18);overflow:hidden;">

          <!-- Header glow bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#7c3aed,#00c8ff,#7c3aed);height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Logo / Brand -->
          <tr>
            <td align="center" style="padding:40px 40px 0;">
              <div style="display:inline-block;">
                <span style="font-size:28px;font-weight:900;letter-spacing:0.08em;color:#fff;text-transform:uppercase;">
                  Bet<span style="color:#00e5ff;text-shadow:0 0 16px rgba(0,229,255,0.7);">Ception</span>
                </span>
              </div>
            </td>
          </tr>

          <!-- Icon -->
          <tr>
            <td align="center" style="padding:32px 40px 0;">
              <div style="width:72px;height:72px;border-radius:50%;background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.25);display:inline-flex;align-items:center;justify-content:center;font-size:34px;line-height:72px;text-align:center;">
                ✉
              </div>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td align="center" style="padding:24px 40px 0;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:0.02em;">
                Willkommen, ${username}!
              </h1>
            </td>
          </tr>

          <!-- Body text -->
          <tr>
            <td align="center" style="padding:16px 48px 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#8ba8c4;text-align:center;">
                Danke für deine Registrierung bei BetCeption.<br>
                Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren und loszulegen.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:36px 40px;">
              <a href="${verifyUrl}"
                 style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#7c3aed,#00c8ff);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 0 24px rgba(0,200,255,0.3);">
                E-Mail bestätigen
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
            </td>
          </tr>

          <!-- Expiry notice -->
          <tr>
            <td align="center" style="padding:20px 48px 0;">
              <p style="margin:0;font-size:13px;color:#4a6070;text-align:center;line-height:1.6;">
                ⏱ Dieser Link ist <strong style="color:#6a8090;">24 Stunden</strong> gültig.<br>
                Falls du dich nicht bei BetCeption registriert hast, ignoriere diese Mail.
              </p>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td align="center" style="padding:16px 40px 36px;">
              <p style="margin:0;font-size:11px;color:#2e4050;text-align:center;line-height:1.6;">
                Button funktioniert nicht? Kopiere diesen Link in deinen Browser:<br>
                <a href="${verifyUrl}" style="color:#00a0b4;word-break:break-all;font-size:11px;">${verifyUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer glow bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#7c3aed,#00c8ff,#7c3aed);height:2px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

        </table>

        <!-- Footer text -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:24px 0;">
              <p style="margin:0;font-size:11px;color:#2a3a4a;">
                &copy; ${new Date().getFullYear()} BetCeption &nbsp;·&nbsp; Nur für Unterhaltungszwecke
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function buildPasswordChangeEmail(username: string, changeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passwort ändern – BetCeption</title>
</head>
<body style="margin:0;padding:0;background-color:#07090f;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:linear-gradient(160deg,#0d1b2a 0%,#090e1a 100%);border-radius:16px;border:1px solid rgba(150,80,255,0.22);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#7c3aed,#a855f7,#7c3aed);height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:40px 40px 0;">
              <span style="font-size:28px;font-weight:900;letter-spacing:0.08em;color:#fff;text-transform:uppercase;">
                Bet<span style="color:#00e5ff;text-shadow:0 0 16px rgba(0,229,255,0.7);">Ception</span>
              </span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 40px 0;">
              <div style="width:72px;height:72px;border-radius:50%;background:rgba(150,80,255,0.1);border:1px solid rgba(150,80,255,0.3);display:inline-flex;align-items:center;justify-content:center;font-size:34px;line-height:72px;text-align:center;">
                🔑
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 40px 0;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:0.02em;">
                Passwort ändern
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 48px 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#8ba8c4;text-align:center;">
                Hallo ${username},<br>
                du hast eine Passwortänderung angefordert. Klicke auf den Button und gib dein aktuelles sowie neues Passwort ein.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:36px 40px;">
              <a href="${changeUrl}"
                 style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 0 24px rgba(168,85,247,0.35);">
                Passwort jetzt ändern
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 48px 0;">
              <p style="margin:0;font-size:13px;color:#4a6070;text-align:center;line-height:1.6;">
                ⏱ Dieser Link ist <strong style="color:#6a8090;">15 Minuten</strong> gültig.<br>
                Falls du keine Passwortänderung angefordert hast, ignoriere diese Mail.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 40px 36px;">
              <p style="margin:0;font-size:11px;color:#2e4050;text-align:center;line-height:1.6;">
                Button funktioniert nicht? Kopiere diesen Link in deinen Browser:<br>
                <a href="${changeUrl}" style="color:#9060cc;word-break:break-all;font-size:11px;">${changeUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(90deg,#7c3aed,#a855f7,#7c3aed);height:2px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:24px 0;">
              <p style="margin:0;font-size:11px;color:#2a3a4a;">
                &copy; ${new Date().getFullYear()} BetCeption &nbsp;·&nbsp; Nur für Unterhaltungszwecke
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetEmail(username: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passwort zurücksetzen – BetCeption</title>
</head>
<body style="margin:0;padding:0;background-color:#07090f;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:linear-gradient(160deg,#0d1b2a 0%,#090e1a 100%);border-radius:16px;border:1px solid rgba(0,200,255,0.18);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#0891b2,#00c8ff,#0891b2);height:3px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td align="center" style="padding:40px 40px 0;">
              <span style="font-size:28px;font-weight:900;letter-spacing:0.08em;color:#fff;text-transform:uppercase;">
                Bet<span style="color:#00e5ff;text-shadow:0 0 16px rgba(0,229,255,0.7);">Ception</span>
              </span>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 40px 0;">
              <div style="width:72px;height:72px;border-radius:50%;background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.25);display:inline-flex;align-items:center;justify-content:center;font-size:34px;line-height:72px;text-align:center;">
                🔐
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 40px 0;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:0.02em;">
                Passwort zurücksetzen
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 48px 0;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#8ba8c4;text-align:center;">
                Hallo ${username},<br>
                du hast das Zurücksetzen deines Passworts angefordert. Klicke auf den Button, um ein neues Passwort festzulegen.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:36px 40px;">
              <a href="${resetUrl}"
                 style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#0891b2,#00c8ff);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 0 24px rgba(0,200,255,0.3);">
                Neues Passwort festlegen
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 48px 0;">
              <p style="margin:0;font-size:13px;color:#4a6070;text-align:center;line-height:1.6;">
                ⏱ Dieser Link ist <strong style="color:#6a8090;">15 Minuten</strong> gültig.<br>
                Falls du kein Zurücksetzen angefordert hast, ignoriere diese Mail.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 40px 36px;">
              <p style="margin:0;font-size:11px;color:#2e4050;text-align:center;line-height:1.6;">
                Button funktioniert nicht? Kopiere diesen Link in deinen Browser:<br>
                <a href="${resetUrl}" style="color:#00a0b4;word-break:break-all;font-size:11px;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(90deg,#0891b2,#00c8ff,#0891b2);height:2px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:24px 0;">
              <p style="margin:0;font-size:11px;color:#2a3a4a;">
                &copy; ${new Date().getFullYear()} BetCeption &nbsp;·&nbsp; Nur für Unterhaltungszwecke
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendPasswordChangeEmail(
  to: string,
  username: string,
  token: string,
): Promise<void> {
  const changeUrl = `${env.appBaseUrl}/change-password#token=${token}`;

  if (!transporter || !env.smtp) {
    console.log(`[DEV] Password change link for ${to}: ${changeUrl}`);
    return;
  }

  await transporter.sendMail({
    from: `"BetCeption" <${env.smtp.user}>`,
    to,
    subject: '🔑 Passwort ändern – BetCeption',
    html: buildPasswordChangeEmail(username, changeUrl),
  });
}

export async function sendPasswordResetEmail(
  to: string,
  username: string,
  token: string,
): Promise<void> {
  const resetUrl = `${env.appBaseUrl}/reset-password#token=${token}`;

  if (!transporter || !env.smtp) {
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: `"BetCeption" <${env.smtp.user}>`,
    to,
    subject: '🔐 Passwort zurücksetzen – BetCeption',
    html: buildPasswordResetEmail(username, resetUrl),
  });
}

export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${env.appBaseUrl}/verify-email?token=${token}`;

  if (!transporter || !env.smtp) {
    console.log(`[DEV] Verification link for ${to}: ${verifyUrl}`);
    return;
  }

  await transporter.sendMail({
    from: `"BetCeption" <${env.smtp.user}>`,
    to,
    subject: '✉ Bestätige deine E-Mail – BetCeption',
    html: buildVerificationEmail(username, verifyUrl),
  });
}
