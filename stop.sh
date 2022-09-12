#!/bin/bash
echo "Stopping Conan-Exiles-Server..."

if screen -list | fgrep -q ".conanex"; then
  screen -X -S conanex kill

  if ! screen -list | fgrep -q ".conanex"; then
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
