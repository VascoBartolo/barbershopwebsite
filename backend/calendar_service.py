import os
import pytz
from datetime import datetime, time, timedelta

TIMEZONE = "Atlantic/Azores"
CALENDAR_ID = os.environ.get("GOOGLE_CALENDAR_ID", "primary")
CREDENTIALS_FILE = os.environ.get("GOOGLE_CREDENTIALS_FILE", "/app/credentials.json")

# Working hours (all services happen at the shop — no travel buffers needed).
WORK_START = time(*[int(x) for x in os.environ.get("WORK_START", "09:00").split(":")])
WORK_END = time(*[int(x) for x in os.environ.get("WORK_END", "19:00").split(":")])
SLOT_INTERVAL_MINUTES = 15
# Closed days: Python weekday numbers, 0=Monday .. 6=Sunday. Default: closed on Sunday.
CLOSED_WEEKDAYS = {int(d) for d in os.environ.get("CLOSED_WEEKDAYS", "6").split(",") if d.strip()}


def _get_service():
    if not os.path.exists(CREDENTIALS_FILE):
        return None
    try:
        from google.oauth2.service_account import Credentials
        from googleapiclient.discovery import build

        creds = Credentials.from_service_account_file(
            CREDENTIALS_FILE, scopes=["https://www.googleapis.com/auth/calendar"]
        )
        return build("calendar", "v3", credentials=creds)
    except Exception as e:
        print(f"[Calendar] Failed to build service: {e}")
        return None


def get_gcal_events(query_date):
    """
    Returns Google Calendar events for the given date as a list of dicts:
      {start_dt: datetime, end_dt: datetime}
    Any event on the barber's calendar blocks that time window.
    """
    service = _get_service()
    if not service:
        return []

    tz = pytz.timezone(TIMEZONE)
    day_start = tz.localize(datetime.combine(query_date, time(0, 0)))
    day_end = tz.localize(datetime.combine(query_date, time(23, 59, 59)))

    try:
        result = (
            service.events()
            .list(
                calendarId=CALENDAR_ID,
                timeMin=day_start.isoformat(),
                timeMax=day_end.isoformat(),
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )
    except Exception as e:
        print(f"[Calendar] API error: {e}")
        return []

    events = []
    for event in result.get("items", []):
        start_str = event["start"].get("dateTime")
        end_str = event["end"].get("dateTime")
        if not start_str or not end_str:
            continue
        try:
            start_dt = datetime.fromisoformat(start_str).astimezone(tz).replace(tzinfo=None)
            end_dt = datetime.fromisoformat(end_str).astimezone(tz).replace(tzinfo=None)
            events.append({"start_dt": start_dt, "end_dt": end_dt})
        except Exception:
            continue

    return events


def get_available_slots(query_date, duration_minutes, all_events):
    """
    Returns list of available 'HH:MM' slot strings.

    all_events: list of {start_dt, end_dt} dicts (DB + GCal combined).
    A slot is available when the full service duration fits inside working
    hours without overlapping any existing event.
    """
    if query_date.weekday() in CLOSED_WEEKDAYS:
        return []

    window_start = datetime.combine(query_date, WORK_START)
    window_end = datetime.combine(query_date, WORK_END)

    candidates = []
    current = window_start
    while current + timedelta(minutes=duration_minutes) <= window_end:
        candidates.append(current)
        current += timedelta(minutes=SLOT_INTERVAL_MINUTES)

    available = []
    for slot_start in candidates:
        slot_end = slot_start + timedelta(minutes=duration_minutes)
        if any(slot_start < ev["end_dt"] and slot_end > ev["start_dt"] for ev in all_events):
            continue
        available.append(slot_start.strftime("%H:%M"))

    return available


def create_event(booking, servico_label, corte_label):
    service = _get_service()
    if not service:
        return None

    tz = pytz.timezone(TIMEZONE)
    start_dt = tz.localize(datetime.combine(booking.slot_date, booking.slot_time))
    end_dt = start_dt + timedelta(minutes=int(booking.duration_minutes))

    detail = servico_label
    if corte_label:
        detail = f"{corte_label} · {servico_label}"
        if booking.sem_cima:
            detail += " (sem cortar em cima)"

    event = {
        "summary": f"[JC] {booking.nome} — {detail}",
        "description": (
            f"Referência: {booking.reference}\n"
            f"Serviço: {servico_label}\n"
            f"Corte: {corte_label or '—'}\n"
            f"Email: {booking.email}\n"
            f"Telemóvel: {booking.telemovel}\n"
            f"Preço: {float(booking.price):.0f}€\n"
            f"Duração: {booking.duration_minutes} min"
        ),
        "start": {"dateTime": start_dt.isoformat(), "timeZone": TIMEZONE},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": TIMEZONE},
    }

    try:
        result = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
        return result.get("id")
    except Exception as e:
        print(f"[Calendar] Create event error: {e}")
        return None


def delete_event(event_id):
    service = _get_service()
    if not service or not event_id:
        return
    try:
        service.events().delete(calendarId=CALENDAR_ID, eventId=event_id).execute()
    except Exception as e:
        print(f"[Calendar] Delete event error: {e}")
