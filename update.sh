#!/bin/bash

. config

steamcmd +@sSteamCmdForcePlatformType windows +login anonymous +force_install_dir $SERVER_DIR +app_update 443030 +exit
