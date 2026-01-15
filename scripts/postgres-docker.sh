#!/bin/bash

set -e

# ------------------------------
# PostgreSQL settings
# ------------------------------
DB_USER="postgres"
DB_PASSWORD="mysecretpassword"
DB_NAME="mydatabase"
DB_PORT="6032"
CONTAINER_NAME="postgres-container"



case "$1" in
  up)
    echo "****************** Configuration **************************"
  
    echo "DB_USER=$DB_USER"
    echo "DB_PASSWORD=$DB_PASSWORD"
    echo "DB_NAME=$DB_NAME"
    echo "DB_PORT=$DB_PORT"

    echo "***********************************************************"

    HOST_IP="localhost"
    echo "Detected host IP: $HOST_IP"

    echo "Starting PostgreSQL Docker container..."

    docker run -d \
      --name $CONTAINER_NAME \
      -e POSTGRES_USER=$DB_USER \
      -e POSTGRES_PASSWORD=$DB_PASSWORD \
      -e POSTGRES_DB=$DB_NAME \
      -p $DB_PORT:5432 \
      --restart always \
      postgres:latest

    echo ">>>>> [ UP ] :: PostgreSQL container started."

    echo "Waiting for PostgreSQL to initialize..."
    until docker exec $CONTAINER_NAME pg_isready -U $DB_USER &>/dev/null; do
      echo "Waiting for PostgreSQL to become available..."
      sleep 5
    done

    echo ">>>>> [ UP ] :: PostgreSQL is ready to accept connections."

    echo ">>>>> [ UP ] :: Full DATABASE_URL:"
    echo ">>>>> [ UP ] :: DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${HOST_IP}:${DB_PORT}/${DB_NAME}"
    ;;

  down)
    echo "Stopping and removing PostgreSQL Docker container..."
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
    echo ">>>>> [ DOWN ] :: PostgreSQL container removed."
    ;;

  restart)
    echo ">>>>> [ RESTART ] :: Restarting PostgreSQL container..."
    $0 down
    $0 up
    ;;

  stats)
    echo ">>>>> [ STATS ] :: Showing resource usage for PostgreSQL container..."
    docker stats $CONTAINER_NAME --no-stream
    ;;

  *)
    echo "Usage: $0 {up|down|restart|stats}"
    exit 1
    ;;
esac
