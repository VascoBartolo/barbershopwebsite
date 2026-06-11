import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Euro, Scissors, CheckCircle } from 'lucide-react';
import './BookingPage.css';

// ---- Catálogo (espelha backend/catalog.py) ----

const SERVICOS = [
  { id: 'cabelo', label: 'Cabelo', price: 12, desc: 'Corte ao teu estilo' },
  { id: 'barba', label: 'Barba', price: 5, desc: 'Aparar e definir' },
  { id: 'cabelo_barba', label: 'Cabelo & Barba', price: 17, desc: 'O pack completo' },
];

const CORTES = [
  { id: 'buzzcut', label: 'Buzzcut', duration: 30 },
  { id: 'mullet', label: 'Mullet', duration: 45 },
  { id: 'burst_fade', label: 'Burst Fade / Moicano', duration: 45 },
  { id: 'taper_fade', label: 'Taper Fade', duration: 45 },
  { id: 'fade', label: 'Fade', duration: 45 },
  { id: 'tesoura', label: 'Tesoura', duration: 15, note: 'Corte simples/social' },
  { id: 'outros', label: 'Outros', duration: 45 },
];

const BARBA_DURATION = 15;
const SEM_CIMA_DURATION = 30;

function getPrice(servico) {
  const s = SERVICOS.find(x => x.id === servico);
  return s ? s.price : null;
}

function getDuration(servico, corte, semCima) {
  if (servico === 'barba') return BARBA_DURATION;
  const c = CORTES.find(x => x.id === corte);
  if (!c) return null;
  let base = c.duration;
  if (semCima) base = Math.min(base, SEM_CIMA_DURATION);
  if (servico === 'cabelo_barba') base += BARBA_DURATION;
  return base;
}

function fmtDuration(min) {
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h${String(m).padStart(2, '0')}`;
  if (h) return `${h}h`;
  return `${m} min`;
}

function servicoLabel(id) {
  return SERVICOS.find(s => s.id === id)?.label || id;
}

function corteLabel(id) {
  return CORTES.find(c => c.id === id)?.label || id;
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_NAMES_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const WEEKDAY_NAMES = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTH_NAMES[d.getMonth()].toLowerCase()} de ${d.getFullYear()}`;
}

// ---- Calendar Component ----

function CalendarPicker({ selectedDate, onSelect }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startOffset = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));

  // Barbearia fecha ao domingo (mantém em sincronia com CLOSED_WEEKDAYS no backend)
  const isClosed = d => d.getDay() === 0;
  const isPast = d => d < today;
  const isSel = d => selectedDate && d.toISOString().split('T')[0] === selectedDate;
  const isTdy = d => d.getTime() === today.getTime();

  const canGoPrev = () => {
    const cur = new Date(viewYear, viewMonth, 1);
    const now = new Date(today.getFullYear(), today.getMonth(), 1);
    return cur > now;
  };

  return (
    <div className="cal-picker">
      <div className="cal-header">
        <button className="cal-nav" onClick={prevMonth} type="button" disabled={!canGoPrev()}>‹</button>
        <span className="cal-month-label">{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button className="cal-nav" onClick={nextMonth} type="button">›</button>
      </div>
      <div className="cal-grid">
        {DAY_NAMES_SHORT.map(d => <div key={d} className="cal-day-header">{d}</div>)}
        {cells.map((d, i) => {
          const disabled = !d || isClosed(d) || isPast(d);
          return (
            <div
              key={i}
              className={[
                'cal-cell',
                !d ? 'cal-empty' : '',
                disabled ? 'cal-disabled' : 'cal-available',
                d && isSel(d) ? 'cal-selected' : '',
                d && isTdy(d) && !isSel(d) ? 'cal-today' : '',
              ].join(' ').trim()}
              onClick={() => !disabled && d && onSelect(d.toISOString().split('T')[0])}
            >
              {d ? d.getDate() : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Step Indicator ----

const STEP_LABELS = ['Serviço', 'Dia & Hora', 'Dados Pessoais'];

function StepIndicator({ current, total }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: total }, (_, i) => i + 1).map(s => (
        <div key={s} className="step-item">
          <div className={`step-circle ${s < current ? 'done' : ''} ${s === current ? 'active' : ''}`}>
            {s < current ? <CheckCircle size={16} /> : s}
          </div>
          <span className={`step-label ${s === current ? 'active' : ''}`}>{STEP_LABELS[s - 1]}</span>
          {s < total && <div className={`step-line ${s < current ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}

// ---- Booking Summary Bar ----

function SummaryBar({ form }) {
  const price = getPrice(form.servico);
  const duration = getDuration(form.servico, form.corte, form.semCima);
  return (
    <div className="summary-bar">
      <span className="summary-item">{servicoLabel(form.servico)}</span>
      {form.servico !== 'barba' && form.corte && (
        <><span className="summary-sep">·</span><span className="summary-item">{corteLabel(form.corte)}{form.semCima ? ' (sem cortar em cima)' : ''}</span></>
      )}
      {form.slotDate && (
        <><span className="summary-sep">·</span><span className="summary-item">{fmtDate(form.slotDate)}{form.slotTime ? ` às ${form.slotTime}` : ''}</span></>
      )}
      {price != null && <span className="summary-price">{price}€ · {fmtDuration(duration)}</span>}
    </div>
  );
}

// ---- Main Component ----

const TOTAL_STEPS = 3;

const emptyForm = {
  servico: '',
  corte: '',
  semCima: false,
  slotDate: '',
  slotTime: '',
  nome: '',
  email: '',
  telemovel: '',
};

export default function BookingPage() {
  const [activeTab, setActiveTab] = useState('nova');

  // Booking form state
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [formError, setFormError] = useState('');

  // Lookup state
  const [lookupRef, setLookupRef] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editSent, setEditSent] = useState(false);

  const price = getPrice(form.servico);
  const duration = getDuration(form.servico, form.corte, form.semCima);
  const needsCorte = form.servico && form.servico !== 'barba';
  const corteObj = CORTES.find(c => c.id === form.corte);
  // 'sem cortar em cima' só faz sentido para cortes que demorariam mais de 30 min
  const semCimaApplies = needsCorte && corteObj && corteObj.duration > SEM_CIMA_DURATION;

  useEffect(() => {
    if (form.slotDate && form.servico && (form.servico === 'barba' || form.corte)) {
      fetchSlots(form.slotDate, form.servico, form.corte, form.semCima);
    }
  }, [form.slotDate, form.servico, form.corte, form.semCima]);

  async function fetchSlots(dateStr, servico, corte, semCima) {
    setLoadingSlots(true);
    setAvailableSlots([]);
    setForm(prev => ({ ...prev, slotTime: '' }));
    try {
      const params = new URLSearchParams({ date: dateStr, servico });
      if (corte) params.set('corte', corte);
      if (semCima) params.set('sem_cima', 'true');
      const res = await fetch(`/api/availability?${params}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function canProceed() {
    if (step === 1) return !!(form.servico && (form.servico === 'barba' || form.corte));
    if (step === 2) return !!(form.slotDate && form.slotTime);
    if (step === 3) return !!(form.nome && form.email && form.telemovel);
    return false;
  }

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servico: form.servico,
          corte: form.servico === 'barba' ? undefined : form.corte,
          sem_cima: form.semCima,
          slot_date: form.slotDate,
          slot_time: form.slotTime,
          nome: form.nome,
          email: form.email,
          telemovel: form.telemovel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'slot_unavailable') {
          setFormError('Este horário já não está disponível. Por favor escolhe outro.');
          setStep(2);
          fetchSlots(form.slotDate, form.servico, form.corte, form.semCima);
        } else {
          setFormError(data.message || 'Erro ao processar a marcação. Tenta novamente.');
        }
      } else {
        setConfirmedBooking(data.booking);
      }
    } catch {
      setFormError('Erro de ligação. Verifica a tua conexão e tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLookup(e) {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);
    setLookupLoading(true);
    setCancelConfirm(false);
    setEditMode(false);
    setEditSent(false);
    try {
      const res = await fetch(`/api/bookings/lookup?reference=${encodeURIComponent(lookupRef)}&email=${encodeURIComponent(lookupEmail)}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError('Marcação não encontrada. Verifica a referência e o email.');
      } else {
        setLookupResult(data.booking);
      }
    } catch {
      setLookupError('Erro de ligação. Tenta novamente.');
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/bookings/${lookupResult.reference}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setLookupResult(data.booking);
        setCancelConfirm(false);
      } else {
        setLookupError(data.message || 'Erro ao cancelar.');
      }
    } catch {
      setLookupError('Erro de ligação.');
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleEditRequest(e) {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await fetch(`/api/bookings/${lookupResult.reference}/edit-request`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lookupEmail, message: editMessage }),
      });
      if (res.ok) {
        setEditSent(true);
        setEditMode(false);
      } else {
        setLookupError('Erro ao enviar pedido.');
      }
    } catch {
      setLookupError('Erro de ligação.');
    } finally {
      setEditLoading(false);
    }
  }

  function lookupServiceDetail(b) {
    let detail = servicoLabel(b.servico);
    if (b.corte) {
      detail = `${corteLabel(b.corte)} · ${detail}`;
      if (b.sem_cima) detail += ' (sem cortar em cima)';
    }
    return detail;
  }

  // ---- Success Screen ----

  if (confirmedBooking) {
    return (
      <div className="booking-page">
        <div className="booking-header">
          <div className="booking-header-inner">
            <Link to="/" className="back-link"><ArrowLeft size={16} /> Voltar ao início</Link>
            <img src="/images/icon.png" alt="Johny Cutz" className="booking-logo" />
          </div>
        </div>
        <div className="booking-container">
          <motion.div
            className="success-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="success-check">✓</div>
            <h2 className="success-title">Marcação Confirmada!</h2>
            <p className="success-subtitle">Vais receber uma confirmação no teu email em breve.</p>

            <div className="success-ref-box">
              <span className="success-ref-label">Referência da marcação</span>
              <span className="success-ref">{confirmedBooking.reference}</span>
            </div>

            <div className="success-details">
              <div className="success-row"><span>Serviço</span><strong>{lookupServiceDetail(confirmedBooking)}</strong></div>
              <div className="success-row"><span>Data</span><strong>{fmtDate(confirmedBooking.slot_date)}</strong></div>
              <div className="success-row"><span>Hora</span><strong>{confirmedBooking.slot_time}</strong></div>
              <div className="success-row"><span>Duração</span><strong>{fmtDuration(confirmedBooking.duration_minutes)}</strong></div>
              <div className="success-row"><span>Preço</span><strong>{confirmedBooking.price}€</strong></div>
            </div>

            <p className="success-note">
              Guarda a referência <strong>{confirmedBooking.reference}</strong> — é necessária para consultar ou alterar a tua marcação.
            </p>

            <div className="success-actions">
              <button
                className="btn-secondary"
                onClick={() => { setActiveTab('verificar'); setConfirmedBooking(null); setLookupRef(confirmedBooking.reference); setLookupEmail(confirmedBooking.email); }}
              >
                Ver detalhes da marcação
              </button>
              <Link to="/" className="btn-primary">Voltar ao início</Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ---- Main Page ----

  return (
    <div className="booking-page">
      <div className="booking-header">
        <div className="booking-header-inner">
          <Link to="/" className="back-link"><ArrowLeft size={16} /> Voltar ao início</Link>
          <img src="/images/icon.png" alt="Johny Cutz" className="booking-logo" />
        </div>
      </div>

      <div className="booking-hero">
        <span className="booking-eyebrow">Johny Cutz · Barbershop</span>
        <h1 className="booking-title">Marcar Corte</h1>
        <p className="booking-subtitle">Escolhe o serviço, o corte e a hora — o resto é connosco. Ilha Terceira, Açores.</p>
      </div>

      <div className="booking-container">
        <div className="booking-tabs">
          <button className={`booking-tab ${activeTab === 'nova' ? 'active' : ''}`} onClick={() => setActiveTab('nova')}>
            Nova Marcação
          </button>
          <button className={`booking-tab ${activeTab === 'verificar' ? 'active' : ''}`} onClick={() => setActiveTab('verificar')}>
            Verificar / Cancelar
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'nova' ? (

            // ======= BOOKING FORM =======
            <motion.div key="nova" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StepIndicator current={step} total={TOTAL_STEPS} />

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.28 }}
                  className="form-card"
                >

                  {/* ---- STEP 1: Serviço & Corte ---- */}
                  {step === 1 && (
                    <>
                      <h2 className="form-step-title">Serviço & Corte</h2>

                      <div className="form-section">
                        <p className="field-label">Que serviço pretendes?</p>
                        <div className="choice-cards">
                          {SERVICOS.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              className={`choice-card ${form.servico === s.id ? 'selected' : ''}`}
                              onClick={() => setForm(prev => ({
                                ...prev,
                                servico: s.id,
                                corte: s.id === 'barba' ? '' : prev.corte,
                                semCima: s.id === 'barba' ? false : prev.semCima,
                              }))}
                            >
                              <Scissors size={26} strokeWidth={1.5} />
                              <span className="choice-label">{s.label}</span>
                              <span className="choice-sub">{s.price}€ · {s.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {needsCorte && (
                        <motion.div className="form-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="field-label">Escolhe o corte</p>
                          <div className="radio-list">
                            {CORTES.map(c => (
                              <label key={c.id} className={`radio-item ${form.corte === c.id ? 'selected' : ''}`}>
                                <input
                                  type="radio"
                                  name="corte"
                                  value={c.id}
                                  checked={form.corte === c.id}
                                  onChange={() => setField('corte', c.id)}
                                />
                                <span className="radio-label">
                                  {c.label}
                                  {c.note && <span className="radio-note"> — {c.note}</span>}
                                </span>
                                <span className="radio-duration">{fmtDuration(c.duration)}</span>
                              </label>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {semCimaApplies && (
                        <motion.div className="form-section" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <label className={`check-item ${form.semCima ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={form.semCima}
                              onChange={e => setField('semCima', e.target.checked)}
                            />
                            <span className="radio-label">Sem cortar em cima <span className="radio-note">— apenas laterais e contornos (30 min)</span></span>
                          </label>
                        </motion.div>
                      )}

                      {form.servico && (form.servico === 'barba' || form.corte) && (
                        <motion.div className="price-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                          <div className="price-card-row">
                            <div className="price-card-item">
                              <Euro size={18} />
                              <span>Preço</span>
                              <strong>{price}€</strong>
                            </div>
                            <div className="price-card-divider" />
                            <div className="price-card-item">
                              <Clock size={18} />
                              <span>Duração</span>
                              <strong>{fmtDuration(duration)}</strong>
                            </div>
                          </div>
                          <div className="price-card-note">
                            <span>Cabelo 12€</span>
                            <span>·</span>
                            <span>Barba 5€</span>
                            <span>·</span>
                            <span>Cabelo & Barba 17€</span>
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}

                  {/* ---- STEP 2: Dia & Hora ---- */}
                  {step === 2 && (
                    <>
                      <h2 className="form-step-title">Dia & Hora</h2>
                      <p className="form-step-sub">Disponibilidade: segunda a sábado, das 09h00 às 19h00</p>

                      <div className="date-time-layout">
                        <div className="form-section">
                          <p className="field-label">Escolhe um dia</p>
                          <CalendarPicker
                            selectedDate={form.slotDate}
                            onSelect={d => setField('slotDate', d)}
                          />
                        </div>

                        <div className="form-section slots-section">
                          <p className="field-label">
                            {form.slotDate ? `Horários — ${fmtDate(form.slotDate)}` : 'Seleciona um dia para ver os horários'}
                          </p>
                          {!form.slotDate && (
                            <div className="slots-placeholder">
                              <Clock size={32} strokeWidth={1.2} />
                              <span>Escolhe um dia à esquerda</span>
                            </div>
                          )}
                          {form.slotDate && loadingSlots && (
                            <div className="slots-loading">A verificar disponibilidade...</div>
                          )}
                          {form.slotDate && !loadingSlots && availableSlots.length === 0 && (
                            <div className="slots-empty">
                              Sem horários disponíveis para este dia.<br />Por favor escolhe outro.
                            </div>
                          )}
                          {form.slotDate && !loadingSlots && availableSlots.length > 0 && (
                            <div className="slots-grid">
                              {availableSlots.map(slot => (
                                <button
                                  key={slot}
                                  type="button"
                                  className={`slot-btn ${form.slotTime === slot ? 'selected' : ''}`}
                                  onClick={() => setField('slotTime', slot)}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          )}
                          {form.slotDate && !loadingSlots && (
                            <p className="slots-note">
                              Duração do serviço: <strong>{fmtDuration(duration)}</strong>
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ---- STEP 3: Dados Pessoais ---- */}
                  {step === 3 && (
                    <>
                      <h2 className="form-step-title">Dados Pessoais</h2>
                      <SummaryBar form={form} />

                      <div className="personal-grid">
                        <div className="p-field">
                          <label>Nome completo <span className="req">*</span></label>
                          <input
                            type="text"
                            value={form.nome}
                            onChange={e => setField('nome', e.target.value)}
                            placeholder="Nome e apelido"
                          />
                        </div>
                        <div className="p-field">
                          <label>Telemóvel <span className="req">*</span></label>
                          <input
                            type="tel"
                            value={form.telemovel}
                            onChange={e => setField('telemovel', e.target.value)}
                            placeholder="+351 9XX XXX XXX"
                          />
                        </div>
                        <div className="p-field full-width">
                          <label>Email <span className="req">*</span></label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={e => setField('email', e.target.value)}
                            placeholder="O teu email"
                          />
                        </div>
                      </div>

                      {formError && <div className="form-error-msg">{formError}</div>}
                    </>
                  )}

                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="form-nav">
                {step > 1 && (
                  <button type="button" className="btn-secondary" onClick={() => setStep(s => s - 1)}>
                    ← Anterior
                  </button>
                )}
                {step < TOTAL_STEPS ? (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!canProceed()}
                    onClick={() => { setFormError(''); setStep(s => s + 1); }}
                  >
                    Seguinte →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!canProceed() || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'A processar...' : 'Confirmar Marcação'}
                  </button>
                )}
              </div>
            </motion.div>

          ) : (

            // ======= LOOKUP TAB =======
            <motion.div key="verificar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="lookup-wrapper">
                <h2 className="lookup-title">Verificar Marcação</h2>
                <p className="lookup-sub">Introduz a referência (ex: JC-XXXXXXXX) e o email utilizado na marcação.</p>

                <form className="lookup-form" onSubmit={handleLookup}>
                  <div className="p-field">
                    <label>Referência</label>
                    <input
                      type="text"
                      value={lookupRef}
                      onChange={e => setLookupRef(e.target.value.toUpperCase())}
                      placeholder="JC-XXXXXXXX"
                      required
                    />
                  </div>
                  <div className="p-field">
                    <label>Email</label>
                    <input
                      type="email"
                      value={lookupEmail}
                      onChange={e => setLookupEmail(e.target.value)}
                      placeholder="O email usado na marcação"
                      required
                    />
                  </div>
                  {lookupError && <div className="form-error-msg">{lookupError}</div>}
                  <button type="submit" className="btn-primary" disabled={lookupLoading}>
                    {lookupLoading ? 'A procurar...' : 'Verificar'}
                  </button>
                </form>

                {lookupResult && (
                  <motion.div
                    className="lookup-result"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="lr-header">
                      <span className="lr-ref">{lookupResult.reference}</span>
                      <span className={`lr-status ${lookupResult.status}`}>
                        {lookupResult.status === 'confirmado' ? 'Confirmado' : 'Cancelado'}
                      </span>
                    </div>

                    <div className="lr-grid">
                      <div className="lr-row"><span>Nome</span><strong>{lookupResult.nome}</strong></div>
                      <div className="lr-row"><span>Serviço</span><strong>{lookupServiceDetail(lookupResult)}</strong></div>
                      <div className="lr-row"><span>Data</span><strong>{fmtDate(lookupResult.slot_date)}</strong></div>
                      <div className="lr-row"><span>Hora</span><strong>{lookupResult.slot_time}</strong></div>
                      <div className="lr-row"><span>Duração</span><strong>{fmtDuration(lookupResult.duration_minutes)}</strong></div>
                      <div className="lr-row"><span>Preço</span><strong>{lookupResult.price}€</strong></div>
                    </div>

                    {lookupResult.status === 'confirmado' && !cancelConfirm && !editMode && !editSent && (
                      <div className="lr-actions">
                        <button className="btn-outline" onClick={() => setEditMode(true)}>
                          Pedir Alteração
                        </button>
                        <button className="btn-danger" onClick={() => setCancelConfirm(true)}>
                          Cancelar Marcação
                        </button>
                      </div>
                    )}

                    {cancelConfirm && (
                      <div className="confirm-box">
                        <p>Tens a certeza que queres cancelar a marcação de <strong>{lookupResult.nome}</strong> a <strong>{fmtDate(lookupResult.slot_date)}</strong> às <strong>{lookupResult.slot_time}</strong>?</p>
                        <div className="confirm-actions">
                          <button className="btn-danger" onClick={handleCancel} disabled={cancelLoading}>
                            {cancelLoading ? 'A cancelar...' : 'Confirmar cancelamento'}
                          </button>
                          <button className="btn-outline" onClick={() => setCancelConfirm(false)}>
                            Voltar
                          </button>
                        </div>
                      </div>
                    )}

                    {editMode && (
                      <form className="edit-form" onSubmit={handleEditRequest}>
                        <p className="edit-intro">Descreve a alteração pretendida. O barbeiro entrará em contacto para confirmar.</p>
                        <div className="p-field">
                          <label>Mensagem</label>
                          <textarea
                            value={editMessage}
                            onChange={e => setEditMessage(e.target.value)}
                            placeholder="Ex: Gostava de mudar para sábado de manhã, se possível..."
                            rows={3}
                            required
                          />
                        </div>
                        <div className="confirm-actions">
                          <button type="submit" className="btn-primary" disabled={editLoading || !editMessage.trim()}>
                            {editLoading ? 'A enviar...' : 'Enviar Pedido'}
                          </button>
                          <button type="button" className="btn-outline" onClick={() => setEditMode(false)}>
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}

                    {editSent && (
                      <div className="edit-sent">
                        Pedido de alteração enviado. Serás contactado em breve pelo barbeiro.
                      </div>
                    )}

                    {lookupResult.status === 'cancelado' && (
                      <div className="cancelled-notice">
                        <p>Esta marcação foi cancelada.</p>
                        <button className="btn-outline" onClick={() => setActiveTab('nova')}>
                          Fazer nova marcação
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>

          )}
        </AnimatePresence>
      </div>

      <footer className="booking-footer">
        <p>Johny Cutz · Barbershop · Est. 2022</p>
        <p>Ilha Terceira, Açores · <a href="mailto:johnycutz@gmail.com">johnycutz@gmail.com</a></p>
      </footer>
    </div>
  );
}
