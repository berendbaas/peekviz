SHARED_FOLDER_PATH="/media/sf_sharedfolder"
DRIVER_FRAMEWORK=$SHARED_FOLDER_PATH/driverframework


ROOT_DIR="$HOME/llvmapps-minix"
echo "ROOT_DIR SET TO $ROOT_DIR"

MI_FILE=$ROOT_DIR/apps/minix/minix/distrib/sets/lists/minix/mi
MINIX_MODS_MAP=$ROOT_DIR/apps/minix/minix/minix.mods.map
SYSTEM_CONF_PATH=$ROOT_DIR/apps/minix/obj.i386/destdir.i386/etc/system.conf
MINIX_ROOT_DIR=$ROOT_DIR/apps/minix/obj.i386/destdir.i386/root
DRIVERS_PATH=$ROOT_DIR/apps/minix/minix/minix/drivers/examples
MAKEFILE_PATH=$ROOT_DIR/apps/minix/minix/minix/drivers/examples/Makefile




for driver in `ls $DRIVER_FRAMEWORK/drivers`
do
  #echo "yes | cp -rf $DRIVER_FRAMEWORK/drivers/$driver $DRIVERS_PATH"
  rm -rfv $DRIVERS_PATH/$driver
  yes | cp -Rfv $DRIVER_FRAMEWORK/drivers/$driver $DRIVERS_PATH
done


# MAKEFILE
#echo "cp $DRIVER_FRAMEWORK/Makefile $MAKEFILE_PATH
#"
yes | cp -Rfv $DRIVER_FRAMEWORK/Makefile $MAKEFILE_PATH

# MI FILE
#echo "cp $DRIVER_FRAMEWORK/mi $MI_FILE
#"
yes | cp -Rfv $DRIVER_FRAMEWORK/mi $MI_FILE

# MINIX_MODS_MAP
#echo "cp $DRIVER_FRAMEWORK/minix.mods.map $MINIX_MODS_MAP
#"
yes | cp -Rfv $DRIVER_FRAMEWORK/minix.mods.map $MINIX_MODS_MAP

# SYSTEM_CONF_PATH
#echo "cp $DRIVER_FRAMEWORK/system.conf $SYSTEM_CONF_PATH
#"
yes | cp -Rfv $DRIVER_FRAMEWORK/system.conf $SYSTEM_CONF_PATH


# setup and notes copy
#echo "cp $DRIVER_FRAMEWORK/setup.sh $MINIX_ROOT_DIR/setup.sh
#"
yes | cp -Rfv $DRIVER_FRAMEWORK/setup.sh $MINIX_ROOT_DIR/setup.sh
#echo "cp $DRIVER_FRAMEWORK/notes.txt $MINIX_ROOT_DIR/notes.txt
#"
yes | cp -Rfv $DRIVER_FRAMEWORK/notes.txt $MINIX_ROOT_DIR/notes.txt
