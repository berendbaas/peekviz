mknod /dev/berend1 c 21 0
mknod /dev/berend2 c 22 0
mknod /dev/berend3 c 23 0
mknod /dev/berend4 c 24 0
mknod /dev/berend5 c 25 0
mknod /dev/peter1 c 26 0
mknod /dev/peter2 c 27 0
mknod /dev/peter3 c 28 0
mknod /dev/peter4 c 29 0
mknod /dev/peter5 c 30 0
mknod /dev/placeholder1 c 31 0
mknod /dev/mydriver c 32 0
mknod /dev/secondtest c 33 0

service up /service/berend1 -label berend1 -dev /dev/berend1
service up /service/berend2 -label berend2 -dev /dev/berend2
service up /service/berend3 -label berend3 -dev /dev/berend3
service up /service/berend4 -label berend4 -dev /dev/berend4
service up /service/berend5 -label berend5 -dev /dev/berend5
service up /service/peter1 -label peter1 -dev /dev/peter1
service up /service/peter2 -label peter2 -dev /dev/peter2
service up /service/peter3 -label peter3 -dev /dev/peter3
service up /service/peter4 -label peter4 -dev /dev/peter4
service up /service/peter5 -label peter5 -dev /dev/peter5
service up /service/mydriver -label mydriver -dev /dev/mydriver
service up /service/secondtest -label secondtest -dev /dev/secondtest
service up /service/placeholder1 -label placeholder1 -dev /dev/placeholder1
