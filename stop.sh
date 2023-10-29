#!/bin/bash

. config

if [ -z "$SCREEN_NAME" ]; then
  echo "SCREEN_NAME config was not set!"
fi

echo "Stopping Conan-Exiles-Server..."

if screen -list | fgrep -q ".$SCREEN_NAME"; then
  screen -X -S $SCREEN_NAME kill

  if ! screen -list | fgrep -q ".$SCREEN_NAME"; then
    echo -e "\E[0;32mServer stopped.."
    tput sgr0
    exit 0
  fi
else
  echo -e "\E[0;31mServer is not running!"
  tput sgr0
  exit 0
fi

exit 1
