import net from 'node:net';
import tls from 'node:tls';

export type AvtomagistralLead = {
  formType: string;
  name: string;
  phone: string;
  region?: string;
  address?: string;
  service?: string;
  transport?: string;
  equipment?: string;
  quantity?: string;
  workFormat?: string;
  cooperationType?: string;
  comment?: string;
  page?: string;
  source?: string;
  pageUrl?: string;
  createdAt?: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
  to: string;
};

const DEFAULT_TIMEOUT_MS = 8000;

export async function sendAvtomagistralLead(
  lead: AvtomagistralLead,
  options: { timeoutMs?: number } = {}
) {
  const config = getSmtpConfig();
  const subject = getSubject(lead.formType);
  const { text, html } = renderLeadEmail(lead);

  await withTimeout(
    sendSmtpMail(config, {
      subject,
      text,
      html,
    }),
    options.timeoutMs || DEFAULT_TIMEOUT_MS
  );
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const from = process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim();
  const to = process.env.AVTOMAGISTRAL_LEADS_TO?.trim();

  if (!host || !Number.isFinite(port) || !from || !to) {
    throw new Error('SMTP is not configured');
  }

  return {
    host,
    port,
    user: process.env.SMTP_USER?.trim(),
    pass: process.env.SMTP_PASS,
    from,
    to,
  };
}

function getSubject(formType: string) {
  const normalized = formType.toLowerCase();

  if (normalized.includes('сотруд')) {
    return 'Новая заявка: сотрудничество';
  }

  if (normalized.includes('заказ') || normalized.includes('перевоз')) {
    return 'Новая заявка: заказ техники / перевозки';
  }

  return 'Новая заявка с лендинга ООО «АВТОМАГИСТРАЛЬ»';
}

function renderLeadEmail(lead: AvtomagistralLead) {
  const rows = [
    ['Тип формы', lead.formType],
    ['Имя', lead.name],
    ['Телефон', lead.phone],
    ['Регион', lead.region],
    ['Адрес', lead.address],
    ['Выбранная услуга', lead.service],
    ['Транспорт', lead.transport],
    ['Техника / транспорт', lead.equipment],
    ['Количество', lead.quantity],
    ['Форма работы', lead.workFormat],
    ['Тип сотрудничества', lead.cooperationType],
    ['Комментарий', lead.comment],
    ['Дата заявки', formatDate(lead.createdAt)],
    ['Страница-источник', lead.page || lead.pageUrl || lead.source],
  ].filter(([, value]) => Boolean(String(value || '').trim()));

  const text = [
    'Новая заявка с лендинга ООО «АВТОМАГИСТРАЛЬ»',
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join('\n');

  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #ece7dc;color:#7c7468;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">${escapeHtml(label)}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #ece7dc;color:#161616;font-size:16px;font-weight:700;">${escapeHtml(value)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <!doctype html>
    <html lang="ru">
      <head><meta charset="utf-8" /></head>
      <body style="margin:0;background:#f6f3ed;font-family:Arial,Helvetica,sans-serif;color:#161616;">
        <div style="max-width:720px;margin:0 auto;padding:28px 16px;">
          <div style="background:#070707;color:#f6f3ed;padding:28px;border-radius:18px 18px 0 0;">
            <div style="color:#ffcc3d;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;">ООО «АВТОМАГИСТРАЛЬ»</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.05;">Новая заявка с лендинга</h1>
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #ece7dc;border-top:0;">
            ${htmlRows}
          </table>
          <div style="background:#fff;border:1px solid #ece7dc;border-top:0;border-radius:0 0 18px 18px;padding:18px 24px;color:#7c7468;font-size:13px;">
            Получатель задается переменной AVTOMAGISTRAL_LEADS_TO.
          </div>
        </div>
      </body>
    </html>`;

  return { text, html };
}

async function sendSmtpMail(config: SmtpConfig, message: { subject: string; text: string; html: string }) {
  const boundary = `avtomagistral-${Date.now().toString(36)}`;
  const raw = [
    `From: ${formatAddress(config.from)}`,
    `To: ${formatAddress(config.to)}`,
    `Subject: ${encodeMimeWord(message.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.text,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.html,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const client = new SmtpClient(config);
  await client.connect();

  try {
    await client.sendMail(raw);
  } finally {
    await client.close();
  }
}

class SmtpClient {
  private socket: net.Socket | tls.TLSSocket | null = null;
  private buffer = '';

  constructor(private readonly config: SmtpConfig) {}

  async connect() {
    this.socket = await new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
      const socket =
        this.config.port === 465
          ? tls.connect(
              { host: this.config.host, port: this.config.port, servername: this.config.host },
              () => resolve(socket)
            )
          : net.connect({ host: this.config.host, port: this.config.port }, () => resolve(socket));

      socket.setTimeout(DEFAULT_TIMEOUT_MS);
      socket.once('error', reject);
      socket.once('timeout', () => reject(new Error('SMTP timeout')));
    });

    await this.readResponse(220);
    const capabilities = await this.command(`EHLO ${this.config.host}`, 250);

    if (this.config.port !== 465 && capabilities.includes('STARTTLS')) {
      await this.command('STARTTLS', 220);
      this.socket = tls.connect({ socket: this.socket, servername: this.config.host });
      this.socket.setTimeout(DEFAULT_TIMEOUT_MS);
      await this.command(`EHLO ${this.config.host}`, 250);
    }
  }

  async sendMail(raw: string) {
    if (this.config.user && this.config.pass) {
      await this.command('AUTH LOGIN', 334);
      await this.command(Buffer.from(this.config.user).toString('base64'), 334);
      await this.command(Buffer.from(this.config.pass).toString('base64'), 235);
    }

    await this.command(`MAIL FROM:<${extractEmail(this.config.from)}>`, 250);
    await this.command(`RCPT TO:<${extractEmail(this.config.to)}>`, [250, 251]);
    await this.command('DATA', 354);
    await this.command(`${escapeSmtpData(raw)}\r\n.`, 250);
  }

  async close() {
    if (!this.socket || this.socket.destroyed) {
      return;
    }

    try {
      await this.command('QUIT', 221);
    } catch {
      this.socket.destroy();
    }
  }

  private async command(command: string, expected: number | number[]) {
    this.socket?.write(`${command}\r\n`);
    return this.readResponse(expected);
  }

  private async readResponse(expected: number | number[]) {
    const expectedCodes = Array.isArray(expected) ? expected : [expected];
    let fullResponse = '';

    while (true) {
      const lineEnd = this.buffer.indexOf('\n');

      if (lineEnd !== -1) {
        const chunk = this.buffer.slice(0, lineEnd + 1);
        this.buffer = this.buffer.slice(lineEnd + 1);
        const response = chunk.trimEnd();
        const code = Number(response.slice(0, 3));
        fullResponse += `${response}\n`;

        if (/^\d{3} /.test(response)) {
          if (!expectedCodes.includes(code)) {
            throw new Error(`SMTP command failed: ${fullResponse.trimEnd()}`);
          }

          return fullResponse.trimEnd();
        }

        continue;
      }

      await new Promise<void>((resolve, reject) => {
        const socket = this.socket;

        if (!socket) {
          reject(new Error('SMTP socket is not connected'));
          return;
        }

        const onData = (data: Buffer) => {
          cleanup();
          this.buffer += data.toString('utf8');
          resolve();
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const onClose = () => {
          cleanup();
          reject(new Error('SMTP socket closed'));
        };
        const onTimeout = () => {
          cleanup();
          reject(new Error('SMTP timeout'));
        };
        const cleanup = () => {
          socket.off('data', onData);
          socket.off('error', onError);
          socket.off('close', onClose);
          socket.off('timeout', onTimeout);
        };

        socket.once('data', onData);
        socket.once('error', onError);
        socket.once('close', onClose);
        socket.once('timeout', onTimeout);
      });
    }
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Delivery timeout')), timeoutMs);
    }),
  ]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  }

  return date.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
}

function escapeHtml(value: unknown) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function encodeMimeWord(value: string) {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function formatAddress(address: string) {
  return address.includes('<') ? address : `<${address}>`;
}

function extractEmail(address: string) {
  const match = address.match(/<([^>]+)>/);
  return (match?.[1] || address).trim();
}

function escapeSmtpData(value: string) {
  return value.replace(/\r?\n\./g, '\r\n..');
}
