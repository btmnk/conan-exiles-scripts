#!/bin/bash

. config

src="$SERVER_DIR/ConanSandbox"

# Create archive filename.
day=$(date +%-Y%-m%-d)
time=$(date +%-T)
archive_file="Saved-$day-$time.tgz"

# Backup the files using tar.
tar -C $src -czf $BACKUP_DIR/$archive_file Saved

# CLEANUP
cd $BACKUP_DIR && ls -1t | tail -n +25 | xargs rm -rf

exit
