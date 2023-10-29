#!/bin/bash

. config

src="$SERVER_DIR/ConanSandbox"
dest="/home/steam/games/conanex/Backup"

# Create archive filename.
day=$(date +%-Y%-m%-d)
time=$(date +%-T)
archive_file="Saved-$day-$time.tgz"

# Backup the files using tar.
tar -C $src -czf $dest/$archive_file Saved

# CLEANUP
cd $dest && ls -1t | tail -n +25 | xargs rm -rf

exit
