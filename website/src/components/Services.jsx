import { Link } from 'react-router-dom';
import { Scissors, Clock } from 'lucide-react';
import useInView from '../hooks/useInView';
import './Services.css';

const SERVICES = [
  {
    name: 'Cabelo',
    price: '12€',
    desc: 'Buzzcut, mullet, burst fade, taper fade, fade ou corte à tesoura — escolhe o teu estilo.',
    duration: '15–45 min',
  },
  {
    name: 'Barba',
    price: '5€',
    desc: 'Aparar, alinhar e definir contornos. Acabamento limpo à navalha.',
    duration: '15 min',
  },
  {
    name: 'Cabelo & Barba',
    price: '17€',
    desc: 'O pack completo: corte ao teu gosto e barba tratada ao detalhe.',
    duration: '30–60 min',
    featured: true,
  },
];

export default function Services() {
  const [ref, inView] = useInView();

  return (
    <section id="servicos" className="section services">
      <div className={`section-inner ${inView ? 'visible' : ''}`} ref={ref}>
        <div className="services-header">
          <span className="section-eyebrow">Serviços & Preços</span>
          <h2 className="section-title">Tabela de Preços</h2>
          <p className="services-sub">
            Preço fixo, sem surpresas. A duração depende do corte escolhido.
          </p>
        </div>

        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <div key={s.name} className={`service-card ${s.featured ? 'featured' : ''}`} style={{ transitionDelay: `${i * 0.12}s` }}>
              {s.featured && <span className="service-badge">Mais Popular</span>}
              <Scissors size={26} className="service-icon" />
              <h3>{s.name}</h3>
              <span className="service-price">{s.price}</span>
              <p>{s.desc}</p>
              <span className="service-duration"><Clock size={14} /> {s.duration}</span>
              <Link to="/marcar" className="service-cta">Marcar →</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
