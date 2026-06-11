import os
import secrets
import string
from datetime import datetime, date, timedelta
from datetime import time as dt_time

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from models import db, Booking
from catalog import SERVICOS, CORTES, compute_price, compute_duration, servico_label, corte_label
import calendar_service
import email_service

load_dotenv()

app = Flask(__name__)

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.environ.get("FRONTEND_URL", ""),
]
CORS(app, origins=[o for o in allowed_origins if o])

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL",
    "postgresql://johnycutz:johnycutz@localhost:5432/johnycutz",
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# ---- Helpers ----


def generate_reference() -> str:
    chars = string.ascii_uppercase + string.digits
    token = "".join(secrets.choice(chars) for _ in range(8))
    return f"JC-{token}"


def db_busy_intervals(query_date):
    """Returns confirmed DB bookings as busy intervals for the slot engine."""
    bookings = Booking.query.filter(
        Booking.slot_date == query_date,
        Booking.status == "confirmado",
    ).all()
    result = []
    for b in bookings:
        start = datetime.combine(query_date, b.slot_time)
        end = start + timedelta(minutes=int(b.duration_minutes))
        result.append({"start_dt": start, "end_dt": end})
    return result


def parse_booking_params(data):
    """Validates servico/corte/sem_cima and returns (servico, corte, sem_cima) or raises ValueError."""
    servico = (data.get("servico") or "").strip().lower()
    if servico not in SERVICOS:
        raise ValueError("servico inválido")

    sem_cima = bool(data.get("sem_cima", False))

    corte = (data.get("corte") or "").strip().lower() or None
    if servico == "barba":
        corte = None
        sem_cima = False
    else:
        if corte not in CORTES:
            raise ValueError("corte inválido")
    return servico, corte, sem_cima


# ---- Routes ----

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/services")
def services():
    """Catalogue endpoint so the frontend stays in sync with prices/durations."""
    return jsonify({
        "servicos": [{"id": k, **v} for k, v in SERVICOS.items()],
        "cortes": [{"id": k, **v} for k, v in CORTES.items()],
    })


@app.route("/api/availability")
def availability():
    date_str = request.args.get("date", "").strip()

    try:
        servico, corte, sem_cima = parse_booking_params({
            "servico": request.args.get("servico", ""),
            "corte": request.args.get("corte", ""),
            "sem_cima": request.args.get("sem_cima", "").lower() in ("1", "true"),
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    if not date_str:
        return jsonify({"error": "date required"}), 400

    try:
        query_date = date.fromisoformat(date_str)
    except ValueError:
        return jsonify({"error": "invalid date"}), 400

    if query_date < date.today():
        return jsonify({"slots": [], "date": date_str})

    duration = compute_duration(servico, corte, sem_cima)
    all_events = db_busy_intervals(query_date) + calendar_service.get_gcal_events(query_date)
    slots = calendar_service.get_available_slots(query_date, duration, all_events)
    return jsonify({"slots": slots, "date": date_str, "duration": duration})


@app.route("/api/bookings", methods=["POST"])
def create_booking():
    data = request.get_json(force=True) or {}

    required = ["servico", "nome", "email", "telemovel", "slot_date", "slot_time"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"missing fields: {', '.join(missing)}"}), 400

    try:
        servico, corte, sem_cima = parse_booking_params(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    try:
        slot_date = date.fromisoformat(data["slot_date"])
        h, m = data["slot_time"].split(":")
        slot_time = dt_time(int(h), int(m))
    except (ValueError, AttributeError):
        return jsonify({"error": "invalid slot_date or slot_time"}), 400

    price = compute_price(servico)
    duration = compute_duration(servico, corte, sem_cima)

    # Confirm slot still available
    all_events = db_busy_intervals(slot_date) + calendar_service.get_gcal_events(slot_date)
    available = calendar_service.get_available_slots(slot_date, duration, all_events)
    if data["slot_time"] not in available:
        return jsonify({"error": "slot_unavailable", "message": "Este horário já não está disponível. Por favor escolha outro."}), 409

    # Unique reference
    reference = generate_reference()
    while Booking.query.filter_by(reference=reference).first():
        reference = generate_reference()

    booking = Booking(
        reference=reference,
        servico=servico,
        corte=corte,
        sem_cima=sem_cima,
        nome=data["nome"].strip(),
        email=data["email"].strip().lower(),
        telemovel=data["telemovel"].strip(),
        slot_date=slot_date,
        slot_time=slot_time,
        duration_minutes=duration,
        price=price,
        status="confirmado",
    )

    db.session.add(booking)
    db.session.commit()

    # Google Calendar event
    event_id = calendar_service.create_event(booking, servico_label(servico), corte_label(corte))
    if event_id:
        booking.google_event_id = event_id
        db.session.commit()

    # Email notifications
    email_service.send_booking_confirmation(booking)
    email_service.send_barber_new_booking(booking)

    return jsonify({"booking": booking.to_dict()}), 201


@app.route("/api/contact", methods=["POST"])
def contact():
    data = request.get_json(force=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    subject = (data.get("subject") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not email or not subject or not message:
        return jsonify({"error": "missing fields"}), 400

    phone = (data.get("phone") or "").strip()
    email_service.send_contact_message(name, email, phone, subject, message)
    return jsonify({"message": "sent"}), 200


@app.route("/api/bookings/lookup")
def lookup():
    reference = request.args.get("reference", "").strip().upper()
    email = request.args.get("email", "").strip().lower()

    if not reference or not email:
        return jsonify({"error": "reference and email required"}), 400

    booking = Booking.query.filter(
        Booking.reference == reference,
        db.func.lower(Booking.email) == email,
    ).first()

    if not booking:
        return jsonify({"error": "not_found", "message": "Marcação não encontrada."}), 404

    return jsonify({"booking": booking.to_dict()})


@app.route("/api/bookings/<reference>/cancel", methods=["PUT"])
def cancel_booking(reference):
    data = request.get_json(force=True) or {}
    email = data.get("email", "").strip().lower()

    booking = Booking.query.filter(
        Booking.reference == reference.upper(),
        db.func.lower(Booking.email) == email,
    ).first()

    if not booking:
        return jsonify({"error": "not_found"}), 404
    if booking.status == "cancelado":
        return jsonify({"error": "already_cancelled"}), 400

    slot_dt = datetime.combine(booking.slot_date, booking.slot_time)
    if slot_dt < datetime.utcnow():
        return jsonify({"error": "past_booking", "message": "Não é possível cancelar uma marcação passada."}), 400

    booking.status = "cancelado"
    booking.updated_at = datetime.utcnow()
    db.session.commit()

    if booking.google_event_id:
        calendar_service.delete_event(booking.google_event_id)

    email_service.send_booking_cancelled_client(booking)
    email_service.send_barber_cancellation(booking)

    return jsonify({"message": "cancelled", "booking": booking.to_dict()})


@app.route("/api/bookings/<reference>/edit-request", methods=["PUT"])
def edit_request(reference):
    data = request.get_json(force=True) or {}
    email = data.get("email", "").strip().lower()
    message = (data.get("message") or "").strip()

    if not message:
        return jsonify({"error": "message required"}), 400

    booking = Booking.query.filter(
        Booking.reference == reference.upper(),
        db.func.lower(Booking.email) == email,
    ).first()

    if not booking:
        return jsonify({"error": "not_found"}), 404
    if booking.status == "cancelado":
        return jsonify({"error": "booking_cancelled"}), 400

    email_service.send_barber_edit_request(booking, message)
    return jsonify({"message": "edit_request_sent"})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
