#!/bin/sh

# from: https://blog.frd.mn/how-to-set-up-proper-startstop-services-ubuntu-debian-mac-windows/

### BEGIN INIT INFO
# Provides:          autotest
# Required-Start:    $local_fs $network $syslog
# Required-Stop:     $local_fs $network $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: autotest
# Description:       autotest start-stop-daemon - Debian
### END INIT INFO

NAME="autotest"
PATH="/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin"
APPDIR="/home/nickbradley/autotest/"
APPBIN="./restart.sh"
APPARGS="" #find its easiest if you have a restart.sh script that can either start the service or restart it (essentially by killing it if it already exists)
USER="nickbradley"
GROUP="nickbradley"
