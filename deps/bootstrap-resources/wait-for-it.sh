#!/bin/sh
echo "Waiting for $1 (This may take a few moments)";

clean=${1//http:\/\//}
hostport=${clean//:/ }

set -f; IFS=' '
set -- $hostport
second=$2; fourth=$4
set +f; unset IFS

HOST=$1
PORT=$2

while ! nc -w 1 -z $HOST $PORT; do sleep 1 && echo -n .; done;

#while true
#do
#    echo "pre poll";
#  STATUS=$(curl -s -o /dev/null -w '%{http_code}' $1)
#  echo $STATUS
#  if [ $STATUS -eq 404 ]; then
#    echo "ready"
#    break
#  else
#    echo -n "."
#  fi
#  sleep 1
#done


#--output /dev/null --silent --head
