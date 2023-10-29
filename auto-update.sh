#!/usr/bin/env bash

. config

address="0.0.0.0:$RCON_PORT"

if [ -z "$RCON_PW" ]; then
	echo "Rcon password not set in config!"
	exit 1
fi

rcon_prefix="rcon -a $address -p $RCON_PW"

app_update_script="$SERVER_DIR/update.sh"
mod_update_script="$SERVER_DIR/update-mods.sh"
stop_script="$SERVER_DIR/stop.sh"
start_script="$SERVER_DIR/start.sh"

send_webhook() {
  if [ -z "$WEBHOOK" ]; then
    eval "discordsh --webhook-url='$WEBHOOK' --text '$1'"
  fi
}

send_message() {
  send_webhook "$1"
  eval "$rcon_prefix 'server $1'"
}

check_error() {
  if [ $? -ne 0 ]; then
    send_webhook ":fire: <@376760136217264128> $1"
    exit
  fi
}

send_message "In 10 Sekunden wird der Server neugestartet"
sleep 5

send_message "In 5 Sekunden wird der Server neugestartet"
sleep 5

send_message "Server wird gestoppt..."

"$stop_script"
check_error "Server stop ist fehlgeschlagen"
send_webhook ":zzz: Server ist offline"

"$app_update_script"
check_error "App update ist fehlgeschlagen"
send_webhook ":white_check_mark: Conan Exiles geupdated"

"$mod_update_script"
check_error "Mod update ist fehlgeschlagen"
send_webhook ":white_check_mark: Mods geupdated"

send_webhook ":white_check_mark: Server wird gestartet..."
"$start_script"
check_error "Server konnte nicht gestartet werden..."
