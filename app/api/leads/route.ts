import { sendAvtomagistralLead, type AvtomagistralLead } from '@/lib/mail/send-avtomagistral-lead';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type LeadFormType = 'order' | 'cooperation' | 'callback';

type LeadPayload = AvtomagistralLead & {
  companyWebsite?: string;
  page?: string;
  pageUrl?: string;
};

const DELIVERY_TIMEOUT_MS = 8000;
const VALID_FORM_TYPES = new Set<LeadFormType>(['order', 'cooperation', 'callback']);

export async function POST(request: Request) {
  let payload: LeadPayload;

  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return validationError('Некорректный JSON.');
  }

  if (String(payload.companyWebsite || '').trim()) {
    return Response.json({ ok: true });
  }

  const lead = normalizeLead(payload);
  const validationMessage = validateLead(lead);

  if (validationMessage) {
    console.warn('Avtomagistral lead validation failed', {
      formType: lead.formType || 'missing',
      reason: validationMessage,
    });
    return validationError(validationMessage);
  }

  const formType = lead.formType as LeadFormType;
  const webhookUrl = process.env.AVTOMAGISTRAL_LEADS_WEBHOOK_URL?.trim();

  try {
    if (webhookUrl) {
      await sendLeadToWebhook(webhookUrl, lead);
      console.info('Avtomagistral lead delivered', { formType, delivery: 'webhook' });
      return Response.json({ ok: true });
    }

    if (!hasSmtpFallbackConfig()) {
      console.error('Avtomagistral lead delivery is not configured', {
        formType,
        missing: 'AVTOMAGISTRAL_LEADS_WEBHOOK_URL',
        fallback: 'smtp-not-configured',
      });
      return deliveryError();
    }

    console.warn('Avtomagistral lead webhook is not configured; using SMTP fallback', { formType });
    await sendAvtomagistralLead(lead, { timeoutMs: DELIVERY_TIMEOUT_MS });
    console.info('Avtomagistral lead delivered', { formType, delivery: 'smtp-fallback' });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Avtomagistral lead delivery failed', {
      formType,
      error: getSafeErrorMessage(error),
      status: error instanceof WebhookDeliveryError ? error.status : undefined,
      delivery: webhookUrl ? 'webhook' : 'smtp-fallback',
    });
    return deliveryError();
  }
}

async function sendLeadToWebhook(webhookUrl: string, lead: AvtomagistralLead) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(toWebhookPayload(lead)),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new WebhookDeliveryError(response.status);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function toWebhookPayload(lead: AvtomagistralLead) {
  return {
    formType: lead.formType,
    name: lead.name,
    phone: lead.phone,
    region: lead.region || '',
    address: lead.address || '',
    service: lead.service || '',
    comment: lead.comment || '',
    page: lead.page || '',
    source: lead.source || '',
    createdAt: lead.createdAt || '',
  };
}

function normalizeLead(payload: LeadPayload): AvtomagistralLead {
  return {
    formType: clean(payload.formType),
    name: clean(payload.name),
    phone: clean(payload.phone),
    region: clean(payload.region),
    address: clean(payload.address),
    service: clean(payload.service),
    transport: clean(payload.transport),
    equipment: clean(payload.equipment),
    quantity: clean(payload.quantity),
    workFormat: clean(payload.workFormat),
    cooperationType: clean(payload.cooperationType),
    comment: clean(payload.comment),
    page: clean(payload.page) || clean(payload.pageUrl),
    source: clean(payload.source),
    createdAt: clean(payload.createdAt) || new Date().toISOString(),
  };
}

function validateLead(lead: AvtomagistralLead) {
  if (!lead.name) {
    return 'Заполните имя.';
  }

  if (!lead.phone) {
    return 'Заполните телефон.';
  }

  if (!VALID_FORM_TYPES.has(lead.formType as LeadFormType)) {
    return 'Некорректный тип формы.';
  }

  if (lead.formType === 'order' && !lead.service && !lead.comment) {
    return 'Укажите, что нужно: услугу или задачу в комментарии.';
  }

  return '';
}

function validationError(error: string) {
  return Response.json({ ok: false, error }, { status: 400 });
}

function deliveryError() {
  return Response.json(
    { ok: false, error: 'Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.' },
    { status: 502 }
  );
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 4000) : '';
}

function hasSmtpFallbackConfig() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      (process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim()) &&
      process.env.AVTOMAGISTRAL_LEADS_TO?.trim()
  );
}

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.name || 'Error';
  }

  return 'UnknownError';
}

class WebhookDeliveryError extends Error {
  constructor(readonly status: number) {
    super('Webhook delivery failed');
    this.name = 'WebhookDeliveryError';
  }
}
