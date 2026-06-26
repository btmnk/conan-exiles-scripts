#!/bin/bash
# ============================================================
#  start-server.sh – Conan Exiles Enhanced (UE5, native Linux)
# ============================================================
# Startet den Server in einer tmux-Session.
# Verwendung:
#   ./start-server.sh          – Server starten
#   ./start-server.sh attach   – An laufende Session anhängen
#   ./start-server.sh stop     – Server sauber stoppen
#   ./start-server.sh status   – Session-Status anzeigen
# ============================================================

# ── Konfiguration ────────────────────────────────────────────
SERVER_USER="steam"
SERVER_DIR="/home/${SERVER_USER}/exiles"
BINARY="${SERVER_DIR}/ConanSandboxServer.sh"   # nativer Linux-Starter

SESSION="conan"

# Server-Parameter
MAP="ConanSandbox"        # Standard-Map (oder z. B. "ConanSandbox_DLC_Siptah")
SERVER_NAME="Mein Conan Server"
MAX_PLAYERS=40
SERVER_PORT=7777
QUERY_PORT=27015
RCON_PORT=25575
RCON_ENABLED=true
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# Farb-Codes
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()    { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn()   { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARN:${NC} $*"; }
error()  { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $*" >&2; }

# ── Voraussetzungen prüfen ───────────────────────────────────
check_deps() {
    command -v tmux >/dev/null 2>&1 || { error "tmux nicht gefunden. Bitte installieren: apt install tmux"; exit 1; }

    if [[ ! -f "${BINARY}" ]]; then
        error "Server-Binary nicht gefunden: ${BINARY}"
        error "Bitte zuerst update-server.sh ausführen."
        exit 1
    fi

    if [[ ! -x "${BINARY}" ]]; then
        warn "Binary ist nicht ausführbar – setze chmod +x"
        chmod +x "${BINARY}"
    fi
}

# ── game.db Dateiname sicherstellen (Linux: case-sensitive!) ──
fix_db_case() {
    local saved_dir="${SERVER_DIR}/ConanSandbox/Saved"
    if [[ -d "${saved_dir}" ]]; then
        # Umbenennen, falls Großbuchstaben im Dateinamen
        find "${saved_dir}" -maxdepth 1 -iname "game.db" ! -name "game.db" \
            -exec bash -c 'mv "$1" "$(dirname "$1")/game.db"' _ {} \;
    fi
}

# ── Server starten ───────────────────────────────────────────
start_server() {
    if tmux has-session -t "${SESSION}" 2>/dev/null; then
        warn "tmux-Session '${SESSION}' läuft bereits."
        warn "Mit './start-server.sh attach' anhängen oder './start-server.sh stop' stoppen."
        exit 0
    fi

    check_deps
    fix_db_case

    log "Starte Conan Exiles Enhanced Server …"
    log "Session:  ${SESSION}"
    log "Binary:   ${BINARY}"
    log "Port:     ${SERVER_PORT} (Query: ${QUERY_PORT})"

    local LAUNCH_CMD="${BINARY} ${MAP}"
    LAUNCH_CMD+=" -port=${SERVER_PORT}"
    LAUNCH_CMD+=" -QueryPort=${QUERY_PORT}"
    LAUNCH_CMD+=" -RCONPort=${RCON_PORT}"
    LAUNCH_CMD+=" -RCONEnabled=${RCON_ENABLED}"
    LAUNCH_CMD+=" -MaxPlayers=${MAX_PLAYERS}"
    LAUNCH_CMD+=" -ServerName=\"${SERVER_NAME}\""
    LAUNCH_CMD+=" -log"
    LAUNCH_CMD+=" -userdir=${SERVER_DIR}/ConanSandbox"

    tmux new-session -d -s "${SESSION}" -x 220 -y 50
    tmux send-keys -t "${SESSION}" "cd ${SERVER_DIR} && ${LAUNCH_CMD}" Enter

    log "Server gestartet. Logs beobachten:"
    log "  tmux attach -t ${SESSION}"
    log "  tail -f ${SERVER_DIR}/ConanSandbox/Saved/Logs/ConanSandbox.log"
}

# ── Server stoppen ───────────────────────────────────────────
stop_server() {
    if ! tmux has-session -t "${SESSION}" 2>/dev/null; then
        warn "Session '${SESSION}' läuft nicht."
        exit 0
    fi

    log "Sende Ctrl-C an Session '${SESSION}' …"
    tmux send-keys -t "${SESSION}" C-c
    sleep 5

    if tmux has-session -t "${SESSION}" 2>/dev/null; then
        log "Session wird beendet …"
        tmux kill-session -t "${SESSION}"
    fi

    log "Server gestoppt."
}

# ── Session-Status ───────────────────────────────────────────
show_status() {
    if tmux has-session -t "${SESSION}" 2>/dev/null; then
        echo -e "${GREEN}✔ Server läuft${NC} (tmux-Session: ${SESSION})"
        tmux list-sessions -f "#{==:#{session_name},${SESSION}}"
    else
        echo -e "${RED}✘ Server läuft nicht${NC}"
    fi
}

# ── Hauptlogik ───────────────────────────────────────────────
case "${1:-start}" in
    start)   start_server  ;;
    stop)    stop_server   ;;
    restart) stop_server; sleep 2; start_server ;;
    attach)  tmux attach -t "${SESSION}" ;;
    status)  show_status   ;;
    *)
        echo "Verwendung: $0 {start|stop|restart|attach|status}"
        exit 1
        ;;
esac