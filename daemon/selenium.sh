#!/bin/bash
# chkconfig: 345 96 49
# description: Starts xvfb on display 99
# Note that this script requires you to have
# an X window running on Display :99
# This can be done by running: /usr/bin/Xvfb :99 -ac -screen 0 1024x768x8 &
# You can save this script as /etc/init.d/selenium to start and stop selenium

PORT=4444

DESC="Selenium server"
RUN_AS=selenium
JAVA_BIN=/usr/bin/java

PID_FILE="/var/run/selenium.pid"
JAR_FILE="/var/lib/selenium-server-standalone-2.53.0.jar"
LOG_FILE="/var/log/selenium"
CHROME_DRIVER="/usr/bin/chromedriver"

DAEMON_OPTS=" -jar $JAR_FILE -Dwebdriver.chrome.driver=$CHROME_DRIVER -log $LOG_FILE -port $PORT"

NAME=selenium

export DISPLAY=:99

case "$1" in
    start)
        echo -n "Starting $DESC: "
        start-stop-daemon --make-pidfile --pidfile /var/run/selenium.pid --start --background --exec /usr/bin/java -- -jar /var/lib/selenium/selenium-server-standalone-2.53.0.jar -Dwebdriver.chrome.driver=/usr/bin/chromedriver
        echo "$NAME."
        ;;

    stop)
        echo -n "Stopping $DESC: "
        start-stop-daemon --stop --pidfile $PID_FILE
        echo "$NAME."
        ;;

    restart|force-reload)
        echo -n "Restarting $DESC: "
        start-stop-daemon --stop --pidfile $PID_FILE
        sleep 1
        start-stop-daemon --make-pidfile --pidfile /var/run/selenium.pid --start --background --exec /usr/bin/java -- -jar /var/lib/selenium/selenium-server-standalone-2.53.0.jar -Dwebdriver.chrome.driver=/usr/bin/chromedriver
        echo "$NAME."
        ;;

    *)
        N=/etc/init.d/$NAME
        echo "Usage: $N {start|stop|restart|force-reload}" >&2
        exit 1
        ;;
esac