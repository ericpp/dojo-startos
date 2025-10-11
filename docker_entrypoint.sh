#!/bin/bash
set -ea

_term() {
  echo "Caught SIGTERM signal!"
  kill -TERM "$backend_process" 2>/dev/null
  kill -TERM "$db_process" 2>/dev/null
  kill -TERM "$frontend_process" 2>/dev/null
  kill -TERM "$soroban_process" 2>/dev/null
}

source /usr/local/bin/config.env

# DATABASE SETUP
if [ -d "/run/mysqld" ]; then
	# mysqld run directory already present, no need to create
	chown -R mysql:mysql /run/mysqld
else
	echo "[i] MySQL run directory not found, creating...."
	mkdir -p /run/mysqld
	chown -R mysql:mysql /run/mysqld
fi

MYSQL_DATABASE=${MYSQL_DATABASE:-"samourai-main"}
MYSQL_USER=${MYSQL_USER:-"samourai"}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-"samourai"}

if [ ! -f /var/lib/mysql/.dojo_db_initialized ]; then
    echo "[i] MySQL data directory not found or not initialized, creating initial DBs"

    mkdir -p /var/lib/mysql
    chown -R mysql:mysql /var/lib/mysql
    touch /var/lib/mysql/.dojo_db_initialized

    mysql_install_db --user=mysql --ldata=/var/lib/mysql > /dev/null

    if [ "$MYSQL_ROOT_PASSWORD" = "" ]; then
        MYSQL_ROOT_PASSWORD=$(pwgen 16 1)
        echo "[i] MySQL root Password: $MYSQL_ROOT_PASSWORD"
        export MYSQL_ROOT_PASSWORD
    fi

    tfile=$(mktemp)
    if [ ! -f "$tfile" ]; then
        return 1
    fi

    cat << EOF > "$tfile"
USE mysql;
FLUSH PRIVILEGES ;
GRANT ALL ON *.* TO 'root'@'%' identified by '$MYSQL_ROOT_PASSWORD' WITH GRANT OPTION ;
GRANT ALL ON *.* TO 'root'@'localhost' identified by '$MYSQL_ROOT_PASSWORD' WITH GRANT OPTION ;
SET PASSWORD FOR 'root'@'localhost'=PASSWORD('${MYSQL_ROOT_PASSWORD}') ;
DROP DATABASE IF EXISTS test ;
FLUSH PRIVILEGES ;
EOF

    if [ "$MYSQL_DATABASE" != "" ]; then
        echo "[i] Creating database: $MYSQL_DATABASE"
        echo "[i] with character set: 'utf8' and collation: 'utf8_general_ci'"
        echo "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` CHARACTER SET utf8 COLLATE utf8_general_ci;" >> "$tfile"

        if [ "$MYSQL_USER" != "" ]; then
            echo "[i] Creating user: $MYSQL_USER with password $MYSQL_PASSWORD"

            {
                echo "GRANT ALL ON \`$MYSQL_DATABASE\`.* to '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD';"
                echo "GRANT ALL ON \`$MYSQL_DATABASE\`.* to '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';"
                echo "FLUSH PRIVILEGES;"
            } >> "$tfile"
        fi
    fi

    /usr/bin/mysqld --user=mysql --bootstrap --verbose=0 --skip-name-resolve --skip-networking=0 < "$tfile"

    rm -f "$tfile"
    echo
    echo 'MySQL init process done. Starting mysqld...'
    echo

    # Run initial SQL scripts
    sed "1iUSE \`$MYSQL_DATABASE\`;" /docker-entrypoint-initdb.d/2_update.sql | /usr/bin/mysqld --user=mysql --bootstrap --verbose=0 --skip-name-resolve --skip-networking=0

    for f in /docker-entrypoint-initdb.d/*; do
        case "$f" in
            *.sql)    echo "$0: running $f"; sed "1iUSE \`$MYSQL_DATABASE\`;" "$f" | /usr/bin/mysqld --user=mysql --bootstrap --verbose=0 --skip-name-resolve --skip-networking=0; echo ;;
            *)        echo "$0: ignoring or entrypoint initdb empty $f" ;;
        esac
        echo
    done

    touch /var/lib/mysql/.dojo_db_initialized
else
    echo "[i] MySQL data directory already initialized, skipping initial DB creation."
fi

# Start mysql
/usr/bin/mysqld_safe --user=mysql --datadir='/var/lib/mysql' &
db_process=$!

# Config tor and explorer
echo "[i] Reading Dojo Tor address from config..."
TOR_ADDRESS=$(yq e '.tor-address' /root/start9/config.yaml)
echo "[i] Dojo Tor address: $TOR_ADDRESS"
mkdir -p /var/lib/tor/hsv3dojo
echo "$TOR_ADDRESS" > /var/lib/tor/hsv3dojo/hostname

if [ "$COMMON_BTC_NETWORK" = "testnet" ]; then
	PAIRING_URL="http://$TOR_ADDRESS/test/v2"
	EXPLORER_ENDPOINT="mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion/testnet4"
	echo "[i] Running on TESTNET"
else
	PAIRING_URL="http://$TOR_ADDRESS/v2"
	EXPLORER_ENDPOINT="mempoolhqx4isw62xs7abwphsq7ldayuidyx2v2oethdhhj6mlo2r6ad.onion"
	echo "[i] Running on MAINNET"
fi

echo "[i] Pairing URL: $PAIRING_URL"

# Set dojo config corresponding to current network
if [ "$COMMON_BTC_NETWORK" = "testnet" ]; then
	cp /home/node/app/static/admin/conf/index-testnet.js /home/node/app/static/admin/conf/index.js
	ln -sf /etc/nginx/sites-available/testnet.conf /etc/nginx/sites-enabled/dojo.conf
else
	cp /home/node/app/static/admin/conf/index-mainnet.js /home/node/app/static/admin/conf/index.js
	ln -sf /etc/nginx/sites-available/mainnet.conf /etc/nginx/sites-enabled/dojo.conf
fi

mkdir -p /var/lib/tor/hsv3explorer
echo -n "$EXPLORER_ENDPOINT" > /var/lib/tor/hsv3explorer/hostname

# Export service properties
cat << EOF > /root/start9/stats.yaml
---
version: 2
data:
  Pairing Code:
    type: string
    value: '{"pairing":{"type":"dojo.api","version":"$DOJO_VERSION_TAG","apikey":"$NODE_API_KEY","url":"$PAIRING_URL"},"explorer":{"type":"explorer.btc_rpc_explorer","url":"http://$EXPLORER_ENDPOINT"}}'
    description: Code for pairing your wallet with this Dojo
    copyable: true
    qr: true
    masked: true
  Admin Key:
    type: string
    value: $(yq e '.admin-key' /root/start9/config.yaml)
    description: Key for accessing the admin/maintenance
    copyable: true
    qr: false
    masked: true
EOF

# Start node services
/home/node/app/wait-for-it.sh 127.0.0.1:3306 --timeout=720 --strict -- pm2-runtime -u node --raw /home/node/app/pm2.config.cjs &
backend_process=$!

# Start nginx
/home/node/app/wait-for-it.sh 127.0.0.1:8080 --timeout=720 --strict -- nginx &
frontend_process=$!

# Start Soroban if enabled
echo "[i] Checking Soroban configuration..."
echo "[i] SOROBAN_INSTALL=$SOROBAN_INSTALL"
echo "[i] SOROBAN_ANNOUNCE=$SOROBAN_ANNOUNCE"

if [ "$SOROBAN_INSTALL" == "on" ]; then
    echo "[i] Starting Soroban service..."
    
    # Setup Soroban onion address if announce is enabled
    if [ "$SOROBAN_ANNOUNCE" == "on" ]; then
        echo "[i] Soroban announce mode is ENABLED"
        echo "[i] Attempting to read Soroban Tor address from config..."
        
        # Try different possible config paths
        SOROBAN_TOR_ADDRESS=$(yq e '.interfaces.soroban.tor-address' /root/start9/config.yaml 2>/dev/null)
        echo "[i] Tried .interfaces.soroban.tor-address: $SOROBAN_TOR_ADDRESS"
        
        if [ -z "$SOROBAN_TOR_ADDRESS" ] || [ "$SOROBAN_TOR_ADDRESS" == "null" ]; then
            SOROBAN_TOR_ADDRESS=$(yq e '.soroban-tor-address' /root/start9/config.yaml 2>/dev/null)
            echo "[i] Tried .soroban-tor-address: $SOROBAN_TOR_ADDRESS"
        fi
        
        if [ -z "$SOROBAN_TOR_ADDRESS" ] || [ "$SOROBAN_TOR_ADDRESS" == "null" ]; then
            echo "[!] WARNING: Could not find Soroban Tor address in config!"
            echo "[!] Dumping config structure for debugging:"
            yq e '.' /root/start9/config.yaml | head -n 50
        else
            echo "[i] Soroban Tor address found: $SOROBAN_TOR_ADDRESS"
        fi
        
        # Create the onion directory and file
        echo "[i] Creating Soroban onion directory..."
        mkdir -p /var/lib/tor/hsv3soroban
        echo "$SOROBAN_TOR_ADDRESS" > "$SOROBAN_ONION_FILE"
        chown -R soroban:soroban /var/lib/tor/hsv3soroban
        echo "[i] Soroban onion file written to: $SOROBAN_ONION_FILE"
        
        echo "[i] Soroban will announce with onion address: $SOROBAN_TOR_ADDRESS"
    else
        echo "[i] Soroban announce mode is DISABLED"
    fi
    
    echo "[i] Starting Soroban process as soroban user..."
    # Start Soroban as the soroban user
    runuser -u soroban -- /usr/local/bin/start-soroban.sh >> /var/log/soroban_startup.log 2>&1 &
    soroban_process=$!
    echo "[i] Soroban started with PID: $soroban_process"
else
    echo "[i] Soroban is disabled (SOROBAN_INSTALL=$SOROBAN_INSTALL)"
    soroban_process=""
fi

echo '[i] All processes initialized'

# SIGTERM HANDLING
trap _term SIGTERM

if [ -n "$soroban_process" ]; then
    wait -n $db_process $backend_process $frontend_process $soroban_process
else
    wait -n $db_process $backend_process $frontend_process
fi
