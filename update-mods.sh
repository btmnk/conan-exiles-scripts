#!/bin/bash

. config

APPID_MODS=440900
MODS_IDS_FILE="./mods.txt"
MODS_MODLIST_FILE="$SERVER_DIR/ConanSandbox/Mods/modlist.txt"

INSTALL_MODS=""

while read modid; do
	INSTALL_MODS+="+workshop_download_item $APPID_MODS $modid "
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
	touch $MODS_MODLIST_FILE

	# create modlist.txt
	while read modid; do
		if [ -d $SERVER_DIR/steamapps/workshop/content/$APPID_MODS/$modid ] 
        then
            for filename in $(cd $SERVER_DIR/steamapps/workshop/content/$APPID_MODS/$modid && find -name "*.pak")
            do

                filename="$(basename "$filename")"

                echo "Enabling Mod $modid. Adding pak-file for mod: '$filename'"
                echo "$SERVER_DIR/steamapps/workshop/content/$APPID_MODS/$modid/$filename" >> $MODS_MODLIST_FILE

            done
        fi
	done < "$MODS_IDS_FILE"
fi

