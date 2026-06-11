import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from catalog import servico_label, corte_label

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
BARBER_EMAIL = os.environ.get("BARBER_EMAIL", "johnycutz@gmail.com")
SITE_URL = os.environ.get("SITE_URL", "https://johnycutz.pt")

_WEEKDAYS = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"]
_MONTHS = ["", "janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]


def _fmt_date(d):
    return f"{_WEEKDAYS[d.weekday()]}, {d.day} de {_MONTHS[d.month]} de {d.year}"


def _fmt_duration(minutes):
    h, m = divmod(int(minutes), 60)
    if h and m:
        return f"{h}h{m:02d}"
    if h:
        return f"{h}h"
    return f"{m} min"


def _service_detail(booking):
    detail = servico_label(booking.servico)
    c = corte_label(booking.corte)
    if c:
        detail = f"{c} · {detail}"
        if booking.sem_cima:
            detail += " (sem cortar em cima)"
    return detail


def _send(to, subject, html):
    if not SMTP_USER or not SMTP_PASS:
        print(f"[Email] (no SMTP configured) Would send to {to}: {subject}")
        return
    msg = MIMEMultipart("alternative")
    msg["From"] = f"Johny Cutz <{SMTP_USER}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to, msg.as_string())
    except Exception as e:
        print(f"[Email] Send error: {e}")


def _base_style():
    return """
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#EDEDED;max-width:600px;margin:auto;background:#111111;border-radius:12px;padding:32px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-family:Georgia,serif;font-size:1.6rem;color:#FFFFFF;letter-spacing:0.18em;text-transform:uppercase;">Johny Cutz</span><br>
      <span style="font-size:0.75rem;color:#9A9A9A;letter-spacing:0.3em;text-transform:uppercase;">Barbershop · Ilha Terceira</span>
    </div>
    """


def _booking_detail_block(booking):
    return f"""
    <div style="background:#1C1C1C;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #C8102E;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;width:120px;">Referência</td>
            <td style="padding:5px 0;font-weight:600;font-size:1.1rem;color:#FFFFFF;">{booking.reference}</td></tr>
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Serviço</td>
            <td style="padding:5px 0;color:#EDEDED;">{_service_detail(booking)}</td></tr>
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Data</td>
            <td style="padding:5px 0;color:#EDEDED;">{_fmt_date(booking.slot_date)}</td></tr>
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Hora</td>
            <td style="padding:5px 0;color:#EDEDED;">{booking.slot_time.strftime('%H:%M')}</td></tr>
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Duração</td>
            <td style="padding:5px 0;color:#EDEDED;">{_fmt_duration(booking.duration_minutes)}</td></tr>
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Preço</td>
            <td style="padding:5px 0;font-weight:600;color:#FFFFFF;">{float(booking.price):.0f}€</td></tr>
      </table>
    </div>
    """


def send_booking_confirmation(booking):
    html = _base_style() + f"""
    <h2 style="font-family:Georgia,serif;font-weight:400;color:#FFFFFF;">Marcação Confirmada</h2>
    <p>Olá <strong>{booking.nome}</strong>,</p>
    <p>A tua marcação foi efetuada com sucesso. Guarda os detalhes abaixo.</p>
    {_booking_detail_block(booking)}
    <p>Para verificar, alterar ou cancelar a tua marcação, acede a
       <a href="{SITE_URL}/marcar" style="color:#4A90D9;">{SITE_URL}/marcar</a>
       e usa a referência <strong>{booking.reference}</strong> com este email.</p>
    <p style="color:#9A9A9A;font-size:0.85rem;">Pedimos que eventuais cancelamentos sejam feitos com pelo menos 24 horas de antecedência.</p>
    <p>Até já,<br><strong>Johny Cutz</strong><br>
       <span style="color:#9A9A9A;font-size:0.85rem;">Barbershop · Ilha Terceira, Açores</span></p>
    </div>
    """
    _send(booking.email, f"Marcação Confirmada — {booking.reference}", html)


def send_barber_new_booking(booking):
    html = _base_style() + f"""
    <h2 style="font-family:Georgia,serif;font-weight:400;color:#C8102E;">Nova Marcação Recebida</h2>
    {_booking_detail_block(booking)}
    <div style="background:#1C1C1C;border-radius:8px;padding:20px;margin:16px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;width:120px;">Nome</td>
            <td style="padding:5px 0;font-weight:600;color:#FFFFFF;">{booking.nome}</td></tr>
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Email</td>
            <td style="padding:5px 0;color:#EDEDED;">{booking.email}</td></tr>
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Telemóvel</td>
            <td style="padding:5px 0;color:#EDEDED;">{booking.telemovel}</td></tr>
      </table>
    </div>
    </div>
    """
    _send(BARBER_EMAIL, f"Nova Marcação — {booking.reference} — {booking.nome}", html)


def send_booking_cancelled_client(booking):
    html = _base_style() + f"""
    <h2 style="font-family:Georgia,serif;font-weight:400;color:#FFFFFF;">Marcação Cancelada</h2>
    <p>Olá <strong>{booking.nome}</strong>,</p>
    <p>A tua marcação <strong style="color:#C8102E;">{booking.reference}</strong> foi cancelada com sucesso.</p>
    <p>Para fazer uma nova marcação, visita
       <a href="{SITE_URL}/marcar" style="color:#4A90D9;">{SITE_URL}/marcar</a>.</p>
    <p>Até à próxima,<br><strong>Johny Cutz</strong></p>
    </div>
    """
    _send(booking.email, f"Marcação Cancelada — {booking.reference}", html)


def send_barber_cancellation(booking):
    html = _base_style() + f"""
    <h2 style="font-family:Georgia,serif;font-weight:400;color:#C8102E;">Cancelamento de Marcação</h2>
    <p>A seguinte marcação foi cancelada pelo cliente:</p>
    {_booking_detail_block(booking)}
    <p><strong>Nome:</strong> {booking.nome} &nbsp;|&nbsp; <strong>Email:</strong> {booking.email} &nbsp;|&nbsp; <strong>Telemóvel:</strong> {booking.telemovel}</p>
    </div>
    """
    _send(BARBER_EMAIL, f"Cancelamento — {booking.reference} — {booking.nome}", html)


def send_contact_message(name, email, phone, subject, message):
    phone_row = f"<tr><td style='padding:5px 0;color:#9A9A9A;font-size:0.85rem;width:100px;'>Telemóvel</td><td style='padding:5px 0;color:#EDEDED;'>{phone}</td></tr>" if phone else ""
    html = _base_style() + f"""
    <h2 style="font-family:Georgia,serif;font-weight:400;color:#C8102E;">Nova Mensagem de Contacto</h2>
    <div style="background:#1C1C1C;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #C8102E;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;width:100px;">Nome</td>
            <td style="padding:5px 0;font-weight:600;color:#FFFFFF;">{name}</td></tr>
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Email</td>
            <td style="padding:5px 0;color:#EDEDED;">{email}</td></tr>
        {phone_row}
        <tr><td style="padding:5px 0;color:#9A9A9A;font-size:0.85rem;">Assunto</td>
            <td style="padding:5px 0;color:#EDEDED;">{subject}</td></tr>
      </table>
    </div>
    <div style="background:#1C1C1C;border-radius:8px;padding:20px;margin:16px 0;">
      <p style="color:#9A9A9A;font-size:0.85rem;margin-bottom:8px;">Mensagem:</p>
      <p style="white-space:pre-wrap;line-height:1.6;color:#EDEDED;">{message}</p>
    </div>
    <p style="color:#9A9A9A;font-size:0.85rem;">Para responder, escreve diretamente para <a href="mailto:{email}" style="color:#4A90D9;">{email}</a>.</p>
    </div>
    """
    _send(BARBER_EMAIL, f"Contacto — {name} — {subject}", html)


def send_barber_edit_request(booking, edit_message):
    html = _base_style() + f"""
    <h2 style="font-family:Georgia,serif;font-weight:400;color:#C8102E;">Pedido de Alteração</h2>
    <p>O cliente com a referência <strong>{booking.reference}</strong> solicitou uma alteração à sua marcação.</p>
    {_booking_detail_block(booking)}
    <div style="background:#1C1C1C;border-radius:8px;padding:20px;margin:16px 0;border-left:4px solid #4A90D9;">
      <p style="color:#9A9A9A;font-size:0.85rem;margin-bottom:8px;">Mensagem do cliente:</p>
      <p style="font-style:italic;color:#EDEDED;">{edit_message}</p>
    </div>
    <p><strong>Contacto:</strong> {booking.email} / {booking.telemovel}</p>
    <p>Por favor entra em contacto com o cliente para confirmar a alteração.</p>
    </div>
    """
    _send(BARBER_EMAIL, f"Pedido de Alteração — {booking.reference} — {booking.nome}", html)
