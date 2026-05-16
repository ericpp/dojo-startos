#!/bin/bash
set -ea

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

if [ ! -d  /var/lib/mysql/mysql ]; then
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
else
	echo "[i] MySQL data directory already initialized, skipping initial DB creation."
fi

# Migrate database tables
echo "[i] Running database migration..."
for f in /docker-entrypoint-initdb.d/*; do
	case "$f" in
		*.sql)    echo "$0: running $f"; sed "1iUSE \`$MYSQL_DATABASE\`;" "$f" | /usr/bin/mysqld --user=mysql --bootstrap --verbose=0 --skip-name-resolve --skip-networking=0; echo ;;
		*)        echo "$0: ignoring or entrypoint initdb empty $f" ;;
	esac
	echo
done

# Start mysql
exec /usr/bin/mysqld_safe --user=mysql --datadir='/var/lib/mysql'