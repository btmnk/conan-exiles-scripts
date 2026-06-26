#!/bin/bash
# ============================================================
#  update-server.sh – Conan Exiles Enhanced (UE5, native Linux)
# ============================================================
# Installiert oder aktualisiert den Server via SteamCMD.
# Kein Wine, kein Xvfb – nativer Linux-Binary (seit UE5/Enhanced).
#
# Verwendung:
#   ./update-server.sh          – Installieren / Update
#   ./update-server.sh --force  – Update auch wenn Server läuft
# ============================================================

# ── Konfiguration ────────────────────────────────────────────
SERVER_USER="steam"
SERVER_DIR="/home/${SERVER_USER}/exiles"
STEAMCMD_DIR="/home/${SERVER_USER}/steamcmd"
STEAM_APP_ID="443030"      # Conan Exiles Dedicated Server
TMUX_SESSION="conan"       # muss mit start-server.sh übereinstimmen
# ─────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

log()   { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $*"; }
warn()  { echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARN:${NC} $*"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $*" >&2; }
info()  { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $*"; }

FORCE=false
[[ "${1:-}" == "--force" ]] && FORCE=true

# ── Benutzer-Check ───────────────────────────────────────────
check_user() {
    if [[ "$(id -un)" != "${SERVER_USER}" ]]; then
        warn "Dieses Script sollte als '${SERVER_USER}' ausgeführt werden."
        warn "Starte erneut als ${SERVER_USER} …"
        exec sudo -u "${SERVER_USER}" bash "$0" "$@"
    fi
}

# ── Laufenden Server stoppen ─────────────────────────────────
stop_if_running() {
    if tmux has-session -t "${TMUX_SESSION}" 2>/dev/null; then
        if [[ "${FORCE}" == true ]]; then
            warn "Server läuft – wird für das Update gestoppt (--force)."
            tmux send-keys -t "${TMUX_SESSION}" C-c
            sleep 5
            tmux kill-session -t "${TMUX_SESSION}" 2>/dev/null || true
            log "Server gestoppt."
        else
            error "Server läuft noch (tmux-Session '${TMUX_SESSION}')."
            error "Bitte zuerst stoppen: ./start-server.sh stop"
            error "Oder Update erzwingen: ./update-server.sh --force"
            exit 1
        fi
    fi
}

# ── SteamCMD installieren (falls nicht vorhanden) ────────────
install_steamcmd() {
    if [[ -x "${STEAMCMD_DIR}/steamcmd.sh" ]]; then
        info "SteamCMD bereits vorhanden: ${STEAMCMD_DIR}"
        return
    fi

    log "Installiere SteamCMD …"
    mkdir -p "${STEAMCMD_DIR}"

    # 32-Bit-Libs prüfen
    if ! dpkg -l lib32gcc-s1 &>/dev/null 2>&1; then
        warn "lib32gcc-s1 fehlt – versuche zu installieren (benötigt sudo)."
        sudo dpkg --add-architecture i386
        sudo apt-get update -qq
        sudo apt-get install -y lib32gcc-s1 ca-certificates curl
    fi

    curl -sSL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" \
        | tar -xz -C "${STEAMCMD_DIR}"

    chmod +x "${STEAMCMD_DIR}/steamcmd.sh"
    log "SteamCMD installiert unter ${STEAMCMD_DIR}"
}

# ── Backup der Spielwelt ─────────────────────────────────────
backup_save() {
    local saved_dir="${SERVER_DIR}/ConanSandbox/Saved"
    if [[ ! -d "${saved_dir}" ]]; then
        return  # Noch keine Saves vorhanden (Erstinstallation)
    fi

    local backup_dir="${SERVER_DIR}/backups"
    local timestamp
    timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="${backup_dir}/save_${timestamp}"

    mkdir -p "${backup_dir}"
    log "Erstelle Backup: ${backup_path}"
    cp -r "${saved_dir}" "${backup_path}"

    # Behalte nur die letzten 5 Backups
    local backup_count
    backup_count=$(find "${backup_dir}" -maxdepth 1 -type d -name "save_*" | wc -l)
    if [[ ${backup_count} -gt 5 ]]; then
        find "${backup_dir}" -maxdepth 1 -type d -name "save_*" \
            | sort | head -n $((backup_count - 5)) \
            | xargs rm -rf
        log "Alte Backups bereinigt (max. 5 behalten)."
    fi
}

# ── Server installieren / updaten ────────────────────────────
update_server() {
    log "Starte SteamCMD Update für App-ID ${STEAM_APP_ID} …"
    log "Zielverzeichnis: ${SERVER_DIR}"
    mkdir -p "${SERVER_DIR}"

    "${STEAMCMD_DIR}/steamcmd.sh" \
        +force_install_dir "${SERVER_DIR}" \
        +login anonymous \
        +app_update "${STEAM_APP_ID}" validate \
        +quit

    log "Download abgeschlossen."
}

# ── Startskript ausführbar machen ────────────────────────────
fix_permissions() {
    local binary="${SERVER_DIR}/ConanSandboxServer.sh"
    if [[ -f "${binary}" ]]; then
        chmod +x "${binary}"
        log "Binary ausführbar gesetzt: ${binary}"
    else
        warn "ConanSandboxServer.sh nicht gefunden – evtl. anderer Binary-Name?"
        # Fallback: Alle .sh und native ELF-Binaries ausführbar machen
        find "${SERVER_DIR}" -maxdepth 2 \( -name "*.sh" -o -name "ConanSandbox*" \) \
            -exec chmod +x {} \;
    fi
}

# ── Zusammenfassung ──────────────────────────────────────────
print_summary() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Update erfolgreich abgeschlossen!     ${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    info "Konfiguration:  ${SERVER_DIR}/ConanSandbox/Saved/Config/LinuxServer/"
    info "Logs:           ${SERVER_DIR}/ConanSandbox/Saved/Logs/ConanSandbox.log"
    info "Backups:        ${SERVER_DIR}/backups/"
    echo ""
    info "Server starten: ./start-server.sh"
    echo ""
}

# ── Hauptablauf ──────────────────────────────────────────────
check_user "$@"
stop_if_running
install_steamcmd
backup_save
update_server
fix_permissions
print_summary