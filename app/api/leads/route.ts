import { sendAvtomagistralLead, type AvtomagistralLead } from '@/lib/mail/send-avtomagistral-lead';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type LeadPayload = AvtomagistralLead & {
  companyWebsite?: string;
  page?: string;
  pageUrl?: string;
};

const DELIVERY_TIMEOUT_MS = 8000;

const allowedFields = [
  'formType',
  'name',
  'phone',
  'region',
  'address',
  'service',
  'transport',
  'equipment',
  'quantity',
  'workFormat',
  'cooperationType',
  'comment',
  'page',
  'source',
  'createdAt',
] as const;

export async function POST(request: Request) {
  let payload: LeadPayload;

  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return Response.json({ ok: false, error: 'Некорректный JSON.' }, { status: 400 });
  }

  if (String(payload.companyWebsite || '').trim()) {
    return Response.json({ ok: true });
  }

  const lead = normalizeLead(payload);

  if (!lead.formType || !lead.name || !lead.phone) {
    return Response.json(
      { ok: false, error: 'Заполните имя, телефон и тип формы.' },
      { status: 400 }
    );
  }

  const hasMeaningfulContent = allowedFields.some((field) => Boolean(String(lead[field] || '').trim()));

  if (!hasMeaningfulContent) {
    return Response.json({ ok: false, error: 'Пустая заявка не отправлена.' }, { status: 400 });
  }

  const webhookUrl = process.env.AVTOMAGISTRAL_LEADS_WEBHOOK_URL?.trim();

  try {
    if (webhookUrl) {
      await sendLeadToWebhook(webhookUrl, lead);
      return Response.json({ ok: true });
    }

    await sendAvtomagistralLead(lead, { timeoutMs: DELIVERY_TIMEOUT_MS });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Failed to deliver avtomagistral lead', error);
    return Response.json(
      { ok: false, error: 'Не удалось отправить заявку. Попробуйте позже или позвоните нам.' },
      { status: 502 }
    );
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
      throw new Error(`Webhook responded with ${response.status}`);
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
    transport: lead.transport || '',
    equipment: lead.equipment || '',
    quantity: lead.quantity || '',
    workFormat: lead.workFormat || '',
    cooperationType: lead.cooperationType || '',
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

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, 4000) : '';
}
