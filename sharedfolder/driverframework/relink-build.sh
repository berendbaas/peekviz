ROOT_DIR="$HOME/llvmapps-minix"
echo "ROOT_DIR SET TO $ROOT_DIR"

/media/sf_sharedfolder/driverframework/copy.sh

#cd $ROOT_DIR/apps/minix
#./clientctl builddisk
#DISK_MNT=/mnt/tmp ./clientctl mountdisk
#echo "Hello I am custom code" >> /mnt/tmp/etc/rc

cd $ROOT_DIR/apps/minix
MODULES_LIST=""
MROOT=$ROOT_DIR/apps/minix scripts/gen_peekfs_rc.sh
#C=$MODULES_LIST,$1 ./relink.llvm magic
#C=$MODULES_LIST,$1 ./build.llvm magic
C=$1 ./relink.llvm magic
C=$1 ./build.llvm magic



USR_SIZE=8388608 ROOT_SIZE=1048576 ./clientctl buildimage

echo "COPY PASTE THIS:
RUNARGS=\" -localtime -net user,hostfwd=tcp::2022-:22 -net nic \" $ROOT_DIR/apps/minix/clientctl run
"
