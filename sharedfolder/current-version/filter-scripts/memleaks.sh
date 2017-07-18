
find $1 -type l | xargs -n1 stat -f %Y | sort | uniq | grep "\.dynamic" | egrep -o "[0-9][0-9]+[^/]*" > /root/temp_memleak_pointed_to
ls -1 $1/.dynamic > /root/temp_memleak_allocd
diff /root/temp_memleak_allocd /root/temp_memleak_pointed_to | grep "<"


rm /root/temp_memleak_allocd /root/temp_memleak_pointed_to
