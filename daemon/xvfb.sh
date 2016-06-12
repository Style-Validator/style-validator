#!/usr/bin/env bash
# chkconfig: 345 95 50
# description: Starts xvfb on display 99
# processname: xvfb

XVFB=/usr/bin/Xvfb
XVFBARGS=":99 -screen 0, 1366x768x24 -nolisten tcp"
PIDFILE=/var/run/xvfb.pid

case "$1" in

  start)
    echo -n "Starting virtual X frame buffer: Xvfb"
    start-stop-daemon --start --quiet --pidfile $PIDFILE --make-pidfile --background --exec $XVFB -- $XVFBARGS
    echo "."
    ;;

  stop)
    echo -n "Stopping virtual X frame buffer: Xvfb"
    read pid <$PIDFILE
    pkill -TERM -P $pid
    echo "."
    ;;

  restart)
    $0 stop
    $0 start
    ;;

  *)
        echo "Usage: /etc/init.d/xvfb {start|stop|restart}"
        exit 1
esac

exit 0