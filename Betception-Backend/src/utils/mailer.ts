import { Resend } from 'resend';
import { env } from '../config/env.js';

const client = env.resend ? new Resend(env.resend.apiKey) : null;
const FROM = env.resend?.from ?? 'noreply@betception.de';

if (client) {
  console.log(`[MAIL] Resend client initialized (from: ${FROM})`);
} else {
  console.warn('[MAIL] No RESEND_API_KEY — emails will be logged to console only');
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
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090f;min-height:100vh;">
    <tr><td align="center" style="padding:48px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:linear-gradient(160deg,#0d1b2a 0%,#090e1a 100%);border-radius:16px;border:1px solid rgba(0,255,255,0.18);overflow:hidden;">
        <tr><td style="background:linear-gradient(90deg,#7c3aed,#00c8ff,#7c3aed);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 40px 0;">
          <span style="font-size:28px;font-weight:900;letter-spacing:0.08em;color:#fff;text-transform:uppercase;">Bet<span style="color:#00e5ff;text-shadow:0 0 16px rgba(0,229,255,0.7);">Ception</span></span>
        </td></tr>
        <tr><td align="center" style="padding:32px 40px 0;">
          <div style="width:72px;height:72px;border-radius:50%;background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.25);font-size:34px;line-height:72px;text-align:center;">✉</div>
        </td></tr>
        <tr><td align="center" style="padding:24px 40px 0;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Willkommen, ${username}!</h1>
        </td></tr>
        <tr><td align="center" style="padding:16px 48px 0;">
          <p style="margin:0;font-size:15px;line-height:1.7;color:#8ba8c4;text-align:center;">
            Danke für deine Registrierung bei BetCeption.<br>
            Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:36px 40px;">
          <a href="${verifyUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#7c3aed,#00c8ff);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;">E-Mail bestätigen</a>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.07);"></div></td></tr>
        <tr><td align="center" style="padding:20px 48px 0;">
          <p style="margin:0;font-size:13px;color:#4a6070;text-align:center;line-height:1.6;">
            ⏱ Dieser Link ist <strong style="color:#6a8090;">24 Stunden</strong> gültig.<br>
            Falls du dich nicht bei BetCeption registriert hast, ignoriere diese Mail.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:16px 40px 36px;">
          <p style="margin:0;font-size:11px;color:#2e4050;text-align:center;">
            Button funktioniert nicht? <a href="${verifyUrl}" style="color:#00a0b4;word-break:break-all;">${verifyUrl}</a>
          </p>
        </td></tr>
        <tr><td style="background:linear-gradient(90deg,#7c3aed,#00c8ff,#7c3aed);height:2px;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
        <tr><td align="center" style="padding:24px 0;">
          <p style="margin:0;font-size:11px;color:#2a3a4a;">&copy; ${new Date().getFullYear()} BetCeption &nbsp;·&nbsp; Nur für Unterhaltungszwecke</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPasswordChangeEmail(username: string, changeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Passwort ändern – BetCeption</title></head>
<body style="margin:0;padding:0;background-color:#07090f;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090f;min-height:100vh;">
    <tr><td align="center" style="padding:48px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:linear-gradient(160deg,#0d1b2a 0%,#090e1a 100%);border-radius:16px;border:1px solid rgba(150,80,255,0.22);overflow:hidden;">
        <tr><td style="background:linear-gradient(90deg,#7c3aed,#a855f7,#7c3aed);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 40px 0;"><span style="font-size:28px;font-weight:900;letter-spacing:0.08em;color:#fff;text-transform:uppercase;">Bet<span style="color:#00e5ff;">Ception</span></span></td></tr>
        <tr><td align="center" style="padding:32px 40px 0;"><div style="width:72px;height:72px;border-radius:50%;background:rgba(150,80,255,0.1);border:1px solid rgba(150,80,255,0.3);font-size:34px;line-height:72px;text-align:center;">🔑</div></td></tr>
        <tr><td align="center" style="padding:24px 40px 0;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Passwort ändern</h1></td></tr>
        <tr><td align="center" style="padding:16px 48px 0;">
          <p style="margin:0;font-size:15px;line-height:1.7;color:#8ba8c4;text-align:center;">
            Hallo ${username},<br>du hast eine Passwortänderung angefordert. Klicke auf den Button und gib dein aktuelles sowie neues Passwort ein.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:36px 40px;">
          <a href="${changeUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;">Passwort jetzt ändern</a>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.07);"></div></td></tr>
        <tr><td align="center" style="padding:20px 48px 0;">
          <p style="margin:0;font-size:13px;color:#4a6070;text-align:center;line-height:1.6;">
            ⏱ Dieser Link ist <strong style="color:#6a8090;">15 Minuten</strong> gültig.<br>
            Falls du keine Passwortänderung angefordert hast, ignoriere diese Mail.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:16px 40px 36px;"><p style="margin:0;font-size:11px;color:#2e4050;text-align:center;">Button funktioniert nicht? <a href="${changeUrl}" style="color:#9060cc;word-break:break-all;">${changeUrl}</a></p></td></tr>
        <tr><td style="background:linear-gradient(90deg,#7c3aed,#a855f7,#7c3aed);height:2px;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetEmail(username: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Passwort zurücksetzen – BetCeption</title></head>
<body style="margin:0;padding:0;background-color:#07090f;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07090f;min-height:100vh;">
    <tr><td align="center" style="padding:48px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:linear-gradient(160deg,#0d1b2a 0%,#090e1a 100%);border-radius:16px;border:1px solid rgba(0,200,255,0.18);overflow:hidden;">
        <tr><td style="background:linear-gradient(90deg,#0891b2,#00c8ff,#0891b2);height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:40px 40px 0;"><span style="font-size:28px;font-weight:900;letter-spacing:0.08em;color:#fff;text-transform:uppercase;">Bet<span style="color:#00e5ff;">Ception</span></span></td></tr>
        <tr><td align="center" style="padding:32px 40px 0;"><div style="width:72px;height:72px;border-radius:50%;background:rgba(0,200,255,0.08);border:1px solid rgba(0,200,255,0.25);font-size:34px;line-height:72px;text-align:center;">🔐</div></td></tr>
        <tr><td align="center" style="padding:24px 40px 0;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Passwort zurücksetzen</h1></td></tr>
        <tr><td align="center" style="padding:16px 48px 0;">
          <p style="margin:0;font-size:15px;line-height:1.7;color:#8ba8c4;text-align:center;">
            Hallo ${username},<br>du hast das Zurücksetzen deines Passworts angefordert. Klicke auf den Button, um ein neues Passwort festzulegen.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:36px 40px;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#0891b2,#00c8ff);color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.06em;text-transform:uppercase;">Neues Passwort festlegen</a>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.07);"></div></td></tr>
        <tr><td align="center" style="padding:20px 48px 0;">
          <p style="margin:0;font-size:13px;color:#4a6070;text-align:center;line-height:1.6;">
            ⏱ Dieser Link ist <strong style="color:#6a8090;">15 Minuten</strong> gültig.<br>
            Falls du kein Zurücksetzen angefordert hast, ignoriere diese Mail.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:16px 40px 36px;"><p style="margin:0;font-size:11px;color:#2e4050;text-align:center;">Button funktioniert nicht? <a href="${resetUrl}" style="color:#00a0b4;word-break:break-all;">${resetUrl}</a></p></td></tr>
        <tr><td style="background:linear-gradient(90deg,#0891b2,#00c8ff,#0891b2);height:2px;font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (!client) {
    console.log(`[DEV] Mail to ${to} | ${subject}`);
    return;
  }
  const { error } = await client.emails.send({ from: `BetCeption <${FROM}>`, to, subject, html });
  if (error) throw new Error(error.message);
}

export async function sendVerificationEmail(to: string, username: string, token: string): Promise<void> {
  const verifyUrl = `${env.appBaseUrl}/verify-email?token=${token}`;
  await sendMail(to, '✉ Bestätige deine E-Mail – BetCeption', buildVerificationEmail(username, verifyUrl));
}

export async function sendPasswordChangeEmail(to: string, username: string, token: string): Promise<void> {
  const changeUrl = `${env.appBaseUrl}/change-password#token=${token}`;
  await sendMail(to, '🔑 Passwort ändern – BetCeption', buildPasswordChangeEmail(username, changeUrl));
}

export async function sendPasswordResetEmail(to: string, username: string, token: string): Promise<void> {
  const resetUrl = `${env.appBaseUrl}/reset-password#token=${token}`;
  await sendMail(to, '🔐 Passwort zurücksetzen – BetCeption', buildPasswordResetEmail(username, resetUrl));
}
