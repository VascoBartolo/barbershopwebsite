import { Scissors, MapPin, Award } from 'lucide-react';
import useInView from '../hooks/useInView';
import './About.css';

export default function About() {
  const [ref, inView] = useInView();

  return (
    <section id="sobre" className="section about">
      <div className={`section-inner about-grid ${inView ? 'visible' : ''}`} ref={ref}>
        <div className="about-images">
          <div className="about-img-main">
            <img src="/images/barber1.jpeg" alt="Johny a trabalhar na barbearia" />
          </div>
          <div className="about-img-accent">
            <img src="/images/barber2.jpeg" alt="As ferramentas do ofício" />
          </div>
        </div>

        <div className="about-text">
          <span className="section-eyebrow">Sobre Mim</span>
          <h2 className="section-title">O Barbeiro<br />Por Trás da Tesoura</h2>
          <p>
            Nascido e criado na <strong>Ilha Terceira, Açores</strong>, comecei a cortar
            cabelo por paixão e fiz dela profissão. Desde 2022 que a Johny Cutz é o
            ponto de encontro de quem procura um corte com personalidade — do fade
            mais limpo ao mullet mais ousado.
          </p>
          <p>
            Cada cliente que se senta na minha cadeira recebe mais do que um corte:
            recebe atenção ao detalhe, conversa boa e um resultado pensado para o
            seu estilo. Aqui não há cortes em série — há cortes à tua medida.
          </p>

          <div className="about-features">
            <div className="about-feature">
              <Scissors size={22} />
              <div>
                <h4>Técnica & Detalhe</h4>
                <p>Especializado em fades, tapers, mullets e cortes à tesoura.</p>
              </div>
            </div>
            <div className="about-feature">
              <MapPin size={22} />
              <div>
                <h4>Raízes Açorianas</h4>
                <p>Orgulhosamente terceirense, a servir a comunidade local.</p>
              </div>
            </div>
            <div className="about-feature">
              <Award size={22} />
              <div>
                <h4>Est. 2022</h4>
                <p>Uma barbearia jovem com clientes que voltam sempre.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
