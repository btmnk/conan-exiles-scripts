#!/bin/bash

/home/steam/sfw/mcrcon-0.7.1-linux-x86-64/mcrcon -c -p UtopischerMist! "broadcast Server wird in 15 Minuten neugestartet!"
sleep 900
/home/steam/sfw/mcrcon-0.7.1-linux-x86-64/mcrcon -c -p UtopischerMist! "broadcast Server wird in 5 Minuten neugestartet!"
sleep 300
screen -X -S conanex kill
sleep 30
sh /home/steam/games/conanex/start.sh
