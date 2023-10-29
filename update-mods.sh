#!/bin/bash

. config

APPID_Mods=440900
MODS_IDS_FILE="$SERVER_DIR/mods.txt"
MODS_MODLIST_FILE="$SERVER_DIR/ConanSandbox/Mods/modlist.txt"

INSTALL_MODS=""

while read modid; do
	INSTALL_MODS+="+workshop_download_item $APPID_Mods $modid "
done < "$MODS_IDS_FILE"

if [ "$INSTALL_MODS" == "" ]; then
	echo "No mods detected. Skip."
else
	echo "Installing mods with $INSTALL_MODS"
	INSTALL_COMMAND="steamcmd +@sSteamCmdForcePlatformType windows +force_install_dir "$SERVER_DIR" +login anonymous $INSTALL_MODS+quit"
	echo "$INSTALL_COMMAND"
	eval "$INSTALL_COMMAND"

	# clear modlist.txt
	rm $MODS_MODLIST_FILE

	# create modlist.txt
	while read modid; do
		if [ -d $SERVER_DIR/steamapps/workshop/content/$APPID_Mods/$modid ] 
        then
            for filename in $(cd $SERVER_DIR/steamapps/workshop/content/$APPID_Mods/$modid && find -name "*.pak")
            do

                filename="$(basename "$filename")"

                echo "Enabling Mod $modid. Adding pak-file for mod: '$filename'"
                # We need the Wine Path
                echo "$SERVER_DIR/steamapps/workshop/content/$APPID_Mods/$modid/$filename" >> $MODS_MODLIST_FILE

            done
        fi
	done < "$MODS_IDS_FILE"
fi

