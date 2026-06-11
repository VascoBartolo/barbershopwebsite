import { useState } from 'react';
import { MapPin, Clock, Mail, AtSign } from 'lucide-react';
import useInView from '../hooks/useInView';
import './Contact.css';

export default function Contact() {
  const [ref, inView] = useInView();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('sent');
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <section id="contacto" className="section contact">
      <div className={`section-inner contact-grid ${inView ? 'visible' : ''}`} ref={ref}>
        <div className="contact-info">
          <span className="section-eyebrow">Contacto</span>
          <h2 className="section-title">Passa Pela<br />Barbearia</h2>

          <div className="contact-items">
            <div className="contact-item">
              <MapPin size={20} />
              <div>
                <h4>Localização</h4>
                <p>Ilha Terceira, Açores</p>
              </div>
            </div>
            <div className="contact-item">
              <Clock size={20} />
              <div>
                <h4>Horário</h4>
                <p>Segunda a Sábado · 09h00 – 19h00<br />Domingo · Encerrado</p>
              </div>
            </div>
            <div className="contact-item">
              <Mail size={20} />
              <div>
                <h4>Email</h4>
                <p><a href="mailto:johnycutz@gmail.com">johnycutz@gmail.com</a></p>
              </div>
            </div>
            <div className="contact-item">
              <AtSign size={20} />
              <div>
                <h4>Instagram</h4>
                <p><a href="https://instagram.com/johnycutz" target="_blank" rel="noreferrer">@johnycutz</a></p>
              </div>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h3>Envia uma Mensagem</h3>
          <div className="contact-form-row">
            <input
              type="text" placeholder="Nome *" required
              value={form.name} onChange={e => setField('name', e.target.value)}
            />
            <input
              type="email" placeholder="Email *" required
              value={form.email} onChange={e => setField('email', e.target.value)}
            />
          </div>
          <div className="contact-form-row">
            <input
              type="tel" placeholder="Telemóvel"
              value={form.phone} onChange={e => setField('phone', e.target.value)}
            />
            <input
              type="text" placeholder="Assunto *" required
              value={form.subject} onChange={e => setField('subject', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Mensagem *" rows={5} required
            value={form.message} onChange={e => setField('message', e.target.value)}
          />
          {status === 'sent' && <p className="contact-feedback ok">Mensagem enviada! Respondo assim que possível.</p>}
          {status === 'error' && <p className="contact-feedback err">Erro ao enviar. Tenta novamente.</p>}
          <button type="submit" className="btn btn-red" disabled={status === 'sending'}>
            {status === 'sending' ? 'A enviar...' : 'Enviar Mensagem'}
          </button>
        </form>
      </div>
    </section>
  );
}
