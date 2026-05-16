#!/bin/bash
set -ea

source /usr/local/bin/config.env

# Start Soroban if enabled
echo "[i] Checking Soroban configuration..."
echo "[i] SOROBAN_INSTALL=$SOROBAN_INSTALL"
echo "[i] SOROBAN_ANNOUNCE=$SOROBAN_ANNOUNCE"

echo "[i] Starting Soroban process as soroban user..."
mkdir -p $(dirname $SOROBAN_ONION_FILE)
chown -R soroban:soroban $(dirname $SOROBAN_ONION_FILE)

exec runuser -u soroban -- /usr/local/bin/soroban-restart.sh