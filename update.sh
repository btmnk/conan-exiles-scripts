#!/bin/bash

steamcmd +@sSteamCmdForcePlatformType windows +login anonymous +force_install_dir /home/steam/games/conanex +app_update 443030 +exit

if [ $? -ne 0 ]; then
  exit 1
fi
