from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Booking(db.Model):
    __tablename__ = "bookings"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(30), unique=True, nullable=False)
    servico = db.Column(db.String(30), nullable=False)       # cabelo | barba | cabelo_barba
    corte = db.Column(db.String(50))                          # null when servico == barba
    sem_cima = db.Column(db.Boolean, default=False, nullable=False)  # corte sem cortar em cima
    nome = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), nullable=False)
    telemovel = db.Column(db.String(50), nullable=False)
    slot_date = db.Column(db.Date, nullable=False)
    slot_time = db.Column(db.Time, nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    status = db.Column(db.String(20), default="confirmado", nullable=False)
    google_event_id = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "reference": self.reference,
            "servico": self.servico,
            "corte": self.corte,
            "sem_cima": self.sem_cima,
            "nome": self.nome,
            "email": self.email,
            "telemovel": self.telemovel,
            "slot_date": self.slot_date.isoformat(),
            "slot_time": self.slot_time.strftime("%H:%M"),
            "duration_minutes": self.duration_minutes,
            "price": float(self.price),
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
