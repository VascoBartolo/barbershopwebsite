"""
Service catalogue for Johny Cutz — single source of truth for
labels, durations and prices used by the API, calendar and emails.

Duration rules:
  Corte simples/social (tesoura): 15 min
  Buzz cut:                       30 min
  Qualquer outro corte:           45 min
  Barba:                          15 min
  Qualquer corte sem cortar em cima: 30 min (cap applied via 'sem_cima')
"""

SERVICOS = {
    "cabelo": {"label": "Cabelo", "price": 12.0},
    "barba": {"label": "Barba", "price": 5.0},
    "cabelo_barba": {"label": "Cabelo & Barba", "price": 17.0},
}

CORTES = {
    "buzzcut": {"label": "Buzzcut", "duration": 30},
    "mullet": {"label": "Mullet", "duration": 45},
    "burst_fade": {"label": "Burst Fade / Moicano", "duration": 45},
    "taper_fade": {"label": "Taper Fade", "duration": 45},
    "fade": {"label": "Fade", "duration": 45},
    "tesoura": {"label": "Tesoura (corte simples/social)", "duration": 15},
    "outros": {"label": "Outros", "duration": 45},
}

BARBA_DURATION = 15
SEM_CIMA_DURATION = 30  # any cut that doesn't touch the top caps at 30 min


def compute_price(servico: str) -> float:
    return SERVICOS[servico]["price"]


def compute_duration(servico: str, corte: str | None, sem_cima: bool) -> int:
    if servico == "barba":
        return BARBA_DURATION
    base = CORTES[corte]["duration"]
    if sem_cima:
        base = min(base, SEM_CIMA_DURATION)
    if servico == "cabelo_barba":
        base += BARBA_DURATION
    return base


def servico_label(servico: str) -> str:
    return SERVICOS.get(servico, {}).get("label", servico)


def corte_label(corte: str | None) -> str | None:
    if not corte:
        return None
    return CORTES.get(corte, {}).get("label", corte)
