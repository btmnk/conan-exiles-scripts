#!/usr/bin/env bash

address="0.0.0.0:25575"
password=$1

if [ -z "$password" ]; then
	echo "Password not provided!"
	exit 1
fi

webhookurl="https://discord.com/api/webhooks/1001523731975389225/sDV1l1SKFDvUH1sTXtQc81mbbKNZKN55KcmiXaWOxT0roli-tl0txwlyUnw4TLTvLD81"

rcon_prefix="rcon -a $address -p $password"

root_dir="/home/steam/games/conanex"
app_update_script="$root_dir/update.sh"
mod_update_script="$root_dir/update-mods.sh"
stop_script="$root_dir/stop.sh"
start_script="$root_dir/start.sh"

send_message() {
  send_webhook "$1"
  eval "$rcon_prefix 'server $1'"
}

send_webhook() {
  eval "discordsh --webhook-url='$webhookurl' --text '$1'"
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
