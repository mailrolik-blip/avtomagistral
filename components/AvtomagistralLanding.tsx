'use client';

import Image from 'next/image';
import { type CSSProperties, FormEvent, useState } from 'react';

import styles from './avtomagistral-landing.module.css';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';

type LeadFormProps = {
  kind: 'order' | 'partner' | 'callback';
};

type LandingImageKey = 'hero' | 'freight' | 'equipment' | 'materials' | 'about';

const landingImages: Record<LandingImageKey, string> = {
  hero: '/landings/avtomagistral/hero-alt-industrial-sunset.png',
  freight: '/landings/avtomagistral/logistics-yard.png',
  equipment: '/landings/avtomagistral/services-special-machinery.png',
  materials: '/landings/avtomagistral/materials-ground-logistics.png',
  about: '/landings/avtomagistral/about-company-engineer.png',
};

const brandAssets = {
  logoMark: '/landings/avtomagistral/brand/logo-mark.svg',
};

const brand = {
  short: 'Автомагистраль',
  legal: 'ООО «Автомагистраль»',
  subtitle: 'оператор грузоперевозок и услуг спецтехники',
  phone: '8 906 903-32-31',
  phoneHref: 'tel:+79069033231',
  director: 'Бердникова Ирина',
};

const serviceOptions = [
  'Грузовая перевозка',
  'Услуги спецтехники',
  'Доставка материалов',
  'Вывоз грунта / строительного мусора',
  'Погрузочно-разгрузочные работы',
  'Другое',
];

const workFormatOptions = ['ИП', 'ООО', 'Самозанятый', 'Частное лицо'];

function imageStyle(image: string) {
  return { '--am-bg-image': `url("${image}")` } as CSSProperties;
}

function LeadForm({ kind }: LeadFormProps) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  const isOrder = kind === 'order';
  const isPartner = kind === 'partner';
  const isCallback = kind === 'callback';
  const formType = isOrder ? 'заказ техники / перевозки' : isPartner ? 'сотрудничество' : 'обратный звонок';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      formType,
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      service: String(data.get('service') || '').trim(),
      address: String(data.get('address') || '').trim(),
      region: String(data.get('region') || '').trim(),
      equipment: String(data.get('equipment') || '').trim(),
      quantity: String(data.get('quantity') || '').trim(),
      workFormat: String(data.get('workFormat') || '').trim(),
      comment: String(data.get('comment') || '').trim(),
      companyWebsite: String(data.get('companyWebsite') || '').trim(),
      source: 'avtomagistral-landing',
      pageUrl: window.location.href,
      createdAt: new Date().toISOString(),
    };

    if (!payload.name || !payload.phone || !payload.formType) {
      setStatus('error');
      setMessage('Заполните имя и телефон, чтобы отправить заявку.');
      return;
    }

    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || 'Не удалось отправить заявку.');
      }

      form.reset();
      setStatus('success');
      setMessage('Заявка отправлена. Мы свяжемся с вами для уточнения деталей.');
    } catch {
      setStatus('error');
      setMessage(`Не удалось отправить заявку. Попробуйте еще раз или позвоните по телефону ${brand.phone}.`);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input className={styles.honeypot} name="companyWebsite" tabIndex={-1} autoComplete="off" />
      <div className={styles.formRow}>
        <label className={styles.field}>
          <input type="text" name="name" placeholder="Ваше имя*" required />
        </label>
        <label className={styles.field}>
          <input type="tel" name="phone" placeholder="Телефон*" required />
        </label>
      </div>

      {isOrder ? (
        <>
          <label className={styles.field}>
            <select name="service" required defaultValue="">
              <option value="">Что вам нужно?*</option>
              {serviceOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <input type="text" name="address" placeholder="Город / адрес объекта" />
          </label>
          <label className={styles.field}>
            <textarea
              name="comment"
              placeholder="Комментарий: что нужно перевезти, какая техника нужна, сроки, объем работ"
            />
          </label>
        </>
      ) : isPartner ? (
        <>
          <label className={styles.field}>
            <input type="text" name="region" placeholder="Город / регион работы" />
          </label>
          <label className={styles.field}>
            <input type="text" name="equipment" placeholder="Какая техника или транспорт есть?" />
          </label>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <input type="text" name="quantity" placeholder="Количество единиц" />
            </label>
            <label className={styles.field}>
              <select name="workFormat" defaultValue="">
                <option value="">Форма работы</option>
                {workFormatOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
          <label className={styles.field}>
            <textarea name="comment" placeholder="Комментарий: условия, свободная техника, формат сотрудничества" />
          </label>
        </>
      ) : (
        <label className={styles.field}>
          <textarea name="comment" placeholder="Когда удобно перезвонить и какой вопрос нужно обсудить" />
        </label>
      )}

      <button className={`${styles.btn} ${styles.btnGold}`} type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Отправка...' : isCallback ? 'Заказать обратный звонок' : 'Отправить заявку'}
        <span aria-hidden="true">→</span>
      </button>
      <div className={styles.privacy}>
        {isCallback
          ? 'Оставьте телефон - мы перезвоним, чтобы уточнить детали.'
          : isOrder
          ? 'Нажимая кнопку, вы соглашаетесь на обработку персональных данных.'
          : 'Мы свяжемся с вами для обсуждения условий сотрудничества.'}
      </div>
      {message ? (
        <div className={status === 'success' ? styles.success : styles.error} role="status">
          {message}
        </div>
      ) : null}
    </form>
  );
}

export function AvtomagistralLanding() {
  return (
    <div className={styles.shell}>
      <header className={styles.siteHeader}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <a href="#top" className={styles.brand} aria-label={brand.short}>
            <span className={styles.brandSymbol}>
              <Image src={brandAssets.logoMark} alt="" width={44} height={44} priority />
            </span>
            <span>
              <span className={styles.brandTitle}>{brand.short}</span>
              <span className={styles.brandSubtitle}>{brand.subtitle}</span>
            </span>
          </a>
          <nav className={styles.nav} aria-label="Навигация">
            <a href="#services">Услуги</a>
            <a href="#about">О компании</a>
            <a href="#process">Как работаем</a>
            <a href="#request">Заявка</a>
            <a href="#partner">Сотрудничество</a>
          </nav>
          <a className={styles.phoneTop} href={brand.phoneHref}>
            <span aria-hidden="true">☎</span>
            <span>
              <span>Телефон для заявок</span>
              <strong>{brand.phone}</strong>
            </span>
          </a>
        </div>
      </header>

      <main id="top">
        <section className={styles.hero} style={imageStyle(landingImages.hero)}>
          <div className={`${styles.container} ${styles.heroContent}`}>
            <div>
              <div className={styles.eyebrow}>{brand.short}</div>
              <h1>Грузоперевозки и услуги спецтехники</h1>
              <p className={styles.heroLead}>
                Оператор грузоперевозок и услуг спецтехники для бизнеса, строительных объектов, подрядчиков и
                частных задач. Оставьте заявку - мы свяжемся с вами для уточнения деталей.
              </p>
              <div className={styles.heroActions}>
                <a className={`${styles.btn} ${styles.btnGold}`} href="#request">
                  Оставить заявку <span aria-hidden="true">→</span>
                </a>
                <a className={`${styles.btn} ${styles.btnOutline}`} href="#partner">
                  Предложить сотрудничество
                </a>
              </div>
            </div>
            <aside className={styles.heroMeta}>
              <div className={styles.metaItem}>
                <span>Генеральный директор</span>
                <strong>{brand.director}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Телефон</span>
                <strong>{brand.phone}</strong>
              </div>
              <div className={styles.metaItem}>
                <span>Направления</span>
                <strong>Перевозки · спецтехника · партнерство</strong>
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.ticker} aria-hidden="true">
          <div className={styles.tickerTrack}>
            {[
              'грузоперевозки',
              'услуги спецтехники',
              'доставка материалов',
              'вывоз грунта и мусора',
              'погрузочные работы',
              'заявки на сотрудничество',
              'грузоперевозки',
              'услуги спецтехники',
              'доставка материалов',
              'вывоз грунта и мусора',
              'погрузочные работы',
              'заявки на сотрудничество',
            ].map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </section>

        <section className={styles.intro}>
          <div className={`${styles.container} ${styles.introGrid}`}>
            <div>
              <div className={styles.sectionLabel}>Позиционирование</div>
              <h2>Не просто аренда техники</h2>
            </div>
            <div>
              <p className={styles.leadLarge}>
                {brand.short} - единая точка обращения для задач, где нужен транспорт, техника и понятная организация
                работ.
              </p>
              <p className={styles.introText}>
                Клиенту не нужно разбираться в десятках карточек и калькуляторов. Он оставляет заявку, описывает
                задачу, а компания связывается с ним и подбирает подходящее решение.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.servicesFlow} id="services">
          <article className={styles.serviceRow}>
            <div
              className={`${styles.servicePhoto} ${styles.photoFromVariable}`}
              style={imageStyle(landingImages.freight)}
              aria-label="Грузовой транспорт"
            />
            <ServiceCopy
              number="01"
              icon="▰"
              title="Грузоперевозки"
              text="Организация перевозки строительных, коммерческих и других грузов с подбором транспорта под задачу."
              items={[
                'перевозка грузов по городу и области;',
                'доставка строительных и коммерческих материалов;',
                'подбор транспорта под объем, вес и маршрут.',
              ]}
            />
          </article>
          <article className={styles.serviceRow}>
            <ServiceCopy
              number="02"
              icon="▲"
              title="Услуги спецтехники"
              text="Подбор спецтехники для строительных, дорожных, земляных, погрузочных и демонтажных работ."
              items={[
                'техника под условия объекта;',
                'работа с частными и корпоративными клиентами;',
                'заявки на разовые и длительные задачи.',
              ]}
            />
            <div
              className={`${styles.servicePhoto} ${styles.photoFromVariable}`}
              style={imageStyle(landingImages.equipment)}
              aria-label="Спецтехника на объекте"
            />
          </article>
          <article className={styles.serviceRow}>
            <div
              className={`${styles.servicePhoto} ${styles.photoFromVariable}`}
              style={imageStyle(landingImages.materials)}
              aria-label="Доставка материалов"
            />
            <ServiceCopy
              number="03"
              icon="◆"
              title="Материалы, грунт и объектные задачи"
              text="Доставка материалов, вывоз грунта и мусора, погрузочно-разгрузочные работы и сопутствующая логистика."
              items={[
                'доставка песка, щебня, грунта и материалов;',
                'вывоз строительного мусора и грунта;',
                'организация техники для работ на площадке.',
              ]}
            />
          </article>
        </section>

        <section className={styles.aboutPhotoSection} id="about" style={imageStyle(landingImages.about)}>
          <div className={styles.container}>
            <div className={styles.aboutContent}>
              <div className={styles.sectionLabel}>О компании</div>
              <h2>{brand.legal}</h2>
              <p>
                Компания работает как оператор: принимает заявки, уточняет задачу, помогает подобрать транспорт или
                спецтехнику и организовать дальнейшее выполнение работ.
              </p>
              <div className={styles.signature}>
                <div>
                  <span>Генеральный директор</span>
                  <strong>{brand.director}</strong>
                </div>
                <div>
                  <span>Контактный телефон</span>
                  <a href={brand.phoneHref}>{brand.phone}</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.process} id="process">
          <div className={styles.container}>
            <div className={styles.sectionLabel}>Как мы работаем</div>
            <h2>Простой путь от заявки до решения</h2>
            <div className={styles.processLine}>
              <ProcessStep number="1" title="Оставляете заявку" text="Выбираете направление: перевозка, спецтехника или сотрудничество." />
              <ProcessStep number="2" title="Уточняем детали" text="Связываемся с вами, уточняем адрес, сроки, груз, объем и условия." />
              <ProcessStep number="3" title="Подбираем вариант" text="Предлагаем транспорт, технику или формат партнерства под задачу." />
              <ProcessStep number="4" title="Согласовываем работу" text="Фиксируем условия и переходим к организации выполнения." />
            </div>
          </div>
        </section>

        <section className={styles.formsZone} id="request">
          <div className={styles.container}>
            <div className={styles.formsHead}>
              <div>
                <div className={styles.sectionLabel}>Заявки</div>
                <h2>Три формы для разных сценариев</h2>
              </div>
              <p>
                Заказ техники, сотрудничество и быстрый обратный звонок отправляются в единый API нового проекта.
              </p>
            </div>
            <div className={styles.formsGrid}>
              <article className={styles.formArea}>
                <div className={styles.formTopline}>
                  <span>Заказ техники / перевозки</span>
                  <span aria-hidden="true">▣</span>
                </div>
                <h3>Заявка на заказ техники</h3>
                <p>Опишите задачу: перевозка, спецтехника, адрес объекта, сроки и объем работ.</p>
                <LeadForm kind="order" />
              </article>
              <article className={styles.formArea} id="partner">
                <div className={styles.formTopline}>
                  <span>Сотрудничество</span>
                  <span aria-hidden="true">◇</span>
                </div>
                <h3>Заявка на сотрудничество</h3>
                <p>Оставьте контакты, если хотите предложить транспорт, технику или партнерство.</p>
                <LeadForm kind="partner" />
              </article>
              <article className={styles.formArea} id="callback">
                <div className={styles.formTopline}>
                  <span>Обратный звонок</span>
                  <span aria-hidden="true">☎</span>
                </div>
                <h3>Заказать обратный звонок</h3>
                <p>Оставьте имя и телефон - мы перезвоним и поможем определить следующий шаг.</p>
                <LeadForm kind="callback" />
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerGrid}`}>
          <div>
            <a href="#top" className={styles.brand}>
              <span className={styles.brandSymbol}>
                <Image src={brandAssets.logoMark} alt="" width={44} height={44} />
              </span>
              <span>
                <span className={styles.brandTitle}>{brand.short}</span>
                <span className={styles.brandSubtitle}>{brand.subtitle}</span>
              </span>
            </a>
            <p>{brand.legal}. Перевозки, услуги спецтехники, заявки на сотрудничество и обратный звонок.</p>
          </div>
          <div className={styles.footerContact}>
            <span>Телефон</span>
            <a href={brand.phoneHref}>{brand.phone}</a>
          </div>
          <div className={styles.footerContact}>
            <span>Генеральный директор</span>
            <strong>{brand.director}</strong>
          </div>
          <div className={styles.footerAction}>
            <a className={`${styles.btn} ${styles.btnGold}`} href="#request">
              Оставить заявку <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ServiceCopy({
  number,
  icon,
  title,
  text,
  items,
}: {
  number: string;
  icon: string;
  title: string;
  text: string;
  items: string[];
}) {
  return (
    <div className={styles.serviceCopy}>
      <div className={styles.serviceNumber}>{number}</div>
      <div className={styles.serviceIcon}>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <ul className={styles.serviceList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ProcessStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className={styles.processStep}>
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
