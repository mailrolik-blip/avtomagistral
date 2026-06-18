'use client';

import Image from 'next/image';
import { type CSSProperties, FormEvent, useEffect, useState } from 'react';

import styles from './avtomagistral-landing.module.css';

type FormStatus = 'idle' | 'sending' | 'success' | 'error';
type LeadKind = 'order' | 'cooperation' | 'callback';
type ModalKind = Exclude<LeadKind, 'order'> | null;
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

function imageStyle(image: string) {
  return { '--am-bg-image': `url("${image}")` } as CSSProperties;
}

function LeadForm({ kind, onSuccess }: { kind: LeadKind; onSuccess?: () => void }) {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  const isOrder = kind === 'order';
  const isCooperation = kind === 'cooperation';
  const submitText = kind === 'callback' ? 'Заказать обратный звонок' : 'Отправить заявку';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      formType: kind,
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      service: String(data.get('service') || '').trim(),
      address: String(data.get('address') || '').trim(),
      region: String(data.get('region') || '').trim(),
      comment: String(data.get('comment') || '').trim(),
      companyWebsite: String(data.get('companyWebsite') || '').trim(),
      source: 'avtomagistral-landing',
      pageUrl: window.location.href,
      createdAt: new Date().toISOString(),
    };

    if (!payload.name || !payload.phone) {
      setStatus('error');
      setMessage('Заполните имя и телефон, чтобы отправить заявку.');
      return;
    }

    if (isOrder && !payload.service && !payload.comment) {
      setStatus('error');
      setMessage('Укажите, что нужно: технику, перевозку или задачу в комментарии.');
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
        throw new Error('Submit failed');
      }

      form.reset();
      setStatus('success');
      setMessage('Заявка отправлена');
      onSuccess?.();
    } catch {
      setStatus('error');
      setMessage(`Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам: ${brand.phone}.`);
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
            <textarea name="comment" placeholder="Комментарий: что нужно перевезти, какая техника нужна, сроки, объём работ" />
          </label>
        </>
      ) : isCooperation ? (
        <>
          <label className={styles.field}>
            <input type="text" name="region" placeholder="Город" />
          </label>
          <label className={styles.field}>
            <textarea name="comment" placeholder="Что предлагаете / комментарий" />
          </label>
        </>
      ) : (
        <label className={styles.field}>
          <textarea name="comment" placeholder="Удобное время / комментарий" />
        </label>
      )}

      <button className={`${styles.btn} ${styles.btnGold}`} type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Отправка...' : submitText}
        <span aria-hidden="true">-&gt;</span>
      </button>
      <div className={styles.privacy}>Нажимая кнопку, вы соглашаетесь на обработку персональных данных.</div>
      {message ? (
        <div className={status === 'success' ? styles.success : styles.error} role="status">
          {message}
        </div>
      ) : null}
    </form>
  );
}

function LeadModal({ kind, onClose }: { kind: Exclude<LeadKind, 'order'>; onClose: () => void }) {
  const title = kind === 'cooperation' ? 'Предложить сотрудничество' : 'Заказать обратный звонок';
  const text =
    kind === 'cooperation'
      ? 'Оставьте контакты и коротко опишите, какую технику, транспорт или формат работы предлагаете.'
      : 'Оставьте имя, телефон и удобное время для звонка.';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.modalOverlay} role="presentation" onMouseDown={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <button className={styles.modalClose} type="button" aria-label="Закрыть" onClick={onClose}>
          ×
        </button>
        <div className={styles.formTopline}>
          <span>{title}</span>
          <span aria-hidden="true">{kind === 'cooperation' ? '◇' : '☎'}</span>
        </div>
        <h3>{title}</h3>
        <p>{text}</p>
        <LeadForm kind={kind} />
      </div>
    </div>
  );
}

export function AvtomagistralLanding() {
  const [modal, setModal] = useState<ModalKind>(null);

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
                Оператор грузоперевозок и услуг спецтехники для бизнеса, строительных объектов, подрядчиков и частных задач. Оставьте заявку - мы свяжемся с вами для уточнения деталей.
              </p>
              <div className={styles.heroActions}>
                <a className={`${styles.btn} ${styles.btnGold}`} href="#request">
                  Оставить заявку <span aria-hidden="true">-&gt;</span>
                </a>
                <button className={`${styles.btn} ${styles.btnOutline}`} type="button" onClick={() => setModal('callback')}>
                  Заказать звонок
                </button>
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
                <strong>Перевозки · спецтехника · партнёрство</strong>
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
                {brand.short} - единая точка обращения для задач, где нужен транспорт, техника и понятная организация работ.
              </p>
              <p className={styles.introText}>
                Клиенту не нужно разбираться в десятках карточек и калькуляторов. Он оставляет заявку, описывает задачу, а компания связывается с ним и подбирает подходящее решение.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.servicesFlow} id="services">
          <article className={styles.serviceRow}>
            <div className={`${styles.servicePhoto} ${styles.photoFromVariable}`} style={imageStyle(landingImages.freight)} aria-label="Грузовой транспорт" />
            <ServiceCopy
              number="01"
              icon="▰"
              title="Грузоперевозки"
              text="Организация перевозки строительных, коммерческих и других грузов с подбором транспорта под задачу."
              items={['перевозка грузов по городу и области;', 'доставка строительных и коммерческих материалов;', 'подбор транспорта под объём, вес и маршрут.']}
            />
          </article>
          <article className={styles.serviceRow}>
            <ServiceCopy
              number="02"
              icon="▴"
              title="Услуги спецтехники"
              text="Подбор спецтехники для строительных, дорожных, земляных, погрузочных и демонтажных работ."
              items={['техника под условия объекта;', 'работа с частными и корпоративными клиентами;', 'заявки на разовые и длительные задачи.']}
            />
            <div className={`${styles.servicePhoto} ${styles.photoFromVariable}`} style={imageStyle(landingImages.equipment)} aria-label="Спецтехника на объекте" />
          </article>
          <article className={styles.serviceRow}>
            <div className={`${styles.servicePhoto} ${styles.photoFromVariable}`} style={imageStyle(landingImages.materials)} aria-label="Доставка материалов" />
            <ServiceCopy
              number="03"
              icon="◆"
              title="Материалы, грунт и объектные задачи"
              text="Доставка материалов, вывоз грунта и мусора, погрузочно-разгрузочные работы и сопутствующая логистика."
              items={['доставка песка, щебня, грунта и материалов;', 'вывоз строительного мусора и грунта;', 'организация техники для работ на площадке.']}
            />
          </article>
        </section>

        <section className={styles.aboutPhotoSection} id="about" style={imageStyle(landingImages.about)}>
          <div className={styles.container}>
            <div className={styles.aboutContent}>
              <div className={styles.sectionLabel}>О компании</div>
              <h2>{brand.legal}</h2>
              <p>
                Компания работает как оператор: принимает заявки, уточняет задачу, помогает подобрать транспорт или спецтехнику и организовать дальнейшее выполнение работ.
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
              <ProcessStep number="1" title="Оставляете заявку" text="Описываете задачу: перевозка, спецтехника, адрес объекта или сроки." />
              <ProcessStep number="2" title="Уточняем детали" text="Связываемся с вами, уточняем адрес, сроки, груз, объём и условия." />
              <ProcessStep number="3" title="Подбираем вариант" text="Предлагаем транспорт, технику или формат партнёрства под задачу." />
              <ProcessStep number="4" title="Согласовываем работу" text="Фиксируем условия и переходим к организации выполнения." />
            </div>
          </div>
        </section>

        <section className={styles.formsZone} id="request">
          <div className={styles.container}>
            <div className={styles.formsHead}>
              <div>
                <div className={styles.sectionLabel}>Заявка</div>
                <h2>Заказ техники или перевозки</h2>
              </div>
              <p>
                Основная форма на странице - для заказа техники, транспорта и объектных работ. Сотрудничество и обратный звонок вынесены в короткие сценарии.
              </p>
            </div>
            <div className={styles.formsGrid}>
              <article className={styles.formArea}>
                <div className={styles.formTopline}>
                  <span>Заявка на заказ техники / перевозки</span>
                  <span aria-hidden="true">▣</span>
                </div>
                <h3>Опишите задачу</h3>
                <p>Укажите, что нужно, город или адрес объекта и любые детали по срокам, объёму или типу техники.</p>
                <LeadForm kind="order" />
              </article>
              <div className={styles.secondaryCards}>
                <CtaCard
                  title="Сотрудничество"
                  text="Предложите транспорт, спецтехнику или другой формат партнёрства."
                  button="Предложить сотрудничество"
                  onClick={() => setModal('cooperation')}
                />
                <CtaCard
                  title="Обратный звонок"
                  text="Оставьте контакты, если удобнее сначала обсудить задачу по телефону."
                  button="Заказать обратный звонок"
                  onClick={() => setModal('callback')}
                />
              </div>
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
              Оставить заявку <span aria-hidden="true">-&gt;</span>
            </a>
          </div>
        </div>
      </footer>

      {modal ? <LeadModal kind={modal} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

function CtaCard({ title, text, button, onClick }: { title: string; text: string; button: string; onClick: () => void }) {
  return (
    <article className={styles.ctaCard}>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <button className={`${styles.btn} ${styles.btnOutline}`} type="button" onClick={onClick}>
        {button}
      </button>
    </article>
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
