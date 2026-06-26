#!/bin/bash

. config

steamcmd +@sSteamCmdForcePlatformType windows +force_install_dir $SERVER_DIR +login anonymous +app_update 443030 +exit
