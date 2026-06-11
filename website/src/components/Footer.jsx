import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-stripe" aria-hidden="true" />
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/images/icon.png" alt="Johny Cutz" />
          <span>Johny Cutz</span>
        </div>
        <p className="footer-tag">Barbershop · Ilha Terceira, Açores · Est. 2022</p>
        <nav className="footer-links">
          <a href="#sobre">Sobre</a>
          <a href="#servicos">Serviços</a>
          <a href="#trabalhos">Trabalhos</a>
          <a href="#contacto">Contacto</a>
          <Link to="/marcar">Marcar</Link>
        </nav>
        <p className="footer-copy">© {new Date().getFullYear()} Johny Cutz. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
