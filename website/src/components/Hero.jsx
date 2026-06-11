import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <motion.div
          className="hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="hero-location">
            <MapPin size={14} /> Ilha Terceira · Açores
          </span>
          <h1 className="hero-title">
            Johny <span className="hero-title-accent">Cutz</span>
          </h1>
          <p className="hero-tagline">Barbershop · Est. 2022</p>
          <p className="hero-sub">
            Fades afiados, mullets com atitude e barbas tratadas ao detalhe.
            Estilo clássico, técnica moderna — tudo numa cadeira.
          </p>
          <div className="hero-actions">
            <Link to="/marcar" className="btn btn-red">
              <Calendar size={18} /> Marcar Corte
            </Link>
            <a href="#trabalhos" className="btn btn-ghost">Ver Trabalhos</a>
          </div>
        </motion.div>

        <motion.div
          className="hero-portrait"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <div className="hero-portrait-frame">
            <img src="/images/hero.jpeg" alt="Johny, o barbeiro, no seu espaço de trabalho" />
          </div>
          <span className="hero-portrait-badge">Est. 2022</span>
        </motion.div>
      </div>

      <div className="hero-stripe" aria-hidden="true" />
    </section>
  );
}
