import { useState } from 'react';
import { Link } from 'react-router-dom';
import useInView from '../hooks/useInView';
import './Gallery.css';

const CUTS = [
  { src: '/images/burst_fade1.jpeg', label: 'Burst Fade / Moicano' },
  { src: '/images/fade.jpeg', label: 'Fade' },
  { src: '/images/mullet.jpeg', label: 'Mullet' },
  { src: '/images/taper.jpeg', label: 'Taper Fade' },
  { src: '/images/burst_fade2.jpeg', label: 'Burst Fade / Moicano' },
  { src: '/images/fade2.jpeg', label: 'Fade' },
  { src: '/images/mullet2.jpeg', label: 'Mullet' },
  { src: '/images/taper2.jpeg', label: 'Taper Fade' },
];

const FILTERS = ['Todos', 'Burst Fade / Moicano', 'Fade', 'Mullet', 'Taper Fade'];

export default function Gallery() {
  const [ref, inView] = useInView();
  const [filter, setFilter] = useState('Todos');

  const visible = filter === 'Todos' ? CUTS : CUTS.filter(c => c.label === filter);

  return (
    <section id="trabalhos" className="section gallery">
      <div className={`section-inner ${inView ? 'visible' : ''}`} ref={ref}>
        <div className="gallery-header">
          <span className="section-eyebrow">Portfólio</span>
          <h2 className="section-title">Trabalhos Recentes</h2>
          <p className="gallery-sub">
            Exemplos reais de cortes feitos na cadeira da Johny Cutz.
            Escolhe o teu na hora de marcar.
          </p>
        </div>

        <div className="gallery-filters">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`gallery-filter ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="gallery-grid">
          {visible.map((cut, i) => (
            <figure key={cut.src} className="gallery-item" style={{ transitionDelay: `${i * 0.06}s` }}>
              <img src={cut.src} alt={`Corte ${cut.label}`} loading="lazy" />
              <figcaption>{cut.label}</figcaption>
            </figure>
          ))}
        </div>

        <div className="gallery-cta">
          <p>Gostaste do que viste?</p>
          <Link to="/marcar" className="btn btn-red">Marca o Teu Corte</Link>
        </div>
      </div>
    </section>
  );
}
