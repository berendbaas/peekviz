# peekviz
UI for peekFS state visualization and components for educational use.

### FROM A FRESH UBUNTU 15.10 INSTALL

  * Set up a shared folder that mounts in Ubuntu VM at /media/sf_sharedfolder (for VirtualBox this happens automatically with with settings pictured below (directory on host must be called "sharedfolder"))

    * ![sharedfolder-pic](sharedfolder.png)
  * Forward port 2022 from host to guest in Ubuntu VM (see pics below)
    * ![portforward-pic1](portforward-pic1.png)
    * ![portforward-pic2](portforward-pic2.png)
  * Add yourself to vboxsf group on Ubuntu VM:
    * ```sh
      sudo adduser $USER vboxsf
      ```

```sh
BITBUCKET_USERNAME=pistoletpierre # CHANGE TO YOUR BITBUCKET USERNAME
ROOT_DIR=$HOME/llvmapps-minix

sudo apt-get install bison curl flex g++ gcc gettext git make pkg-config python ssh subversion zlib1g-dev

cd $HOME
git clone https://$BITBUCKET_USERNAME@bitbucket.org/vusec/llvmapps-minix
cd llvmapps-minix
./autosetup-minix.sh
```
#### This will take a while. After it finishes...

#### TODO: copy custom drivers with script in driverframework/drivers/copy/sh
```sh
cd $HOME/llvmapps-minix
./autosetup-minix.sh
```

#### After...

```sh
sudo apt-get install clang # IF YOU EVER NEED TO ./autosetup-minix.sh AGAIN, MAKE SURE TO UNINSTALL CLANG (not tested yet but hypothesized by process of elimination)
cd $ROOT_DIR/llvm/static/magic
make install
cd $ROOT_DIR/llvm/passes/magic
make install
```

#### Then add your custom drivers to relevant files...TODO (fill in files)

#### Then... (TODO change if $1 = "peter" check)
```sh
CUSTOM_DRIVERS="driver1,driver2,etc"
/media/sharedfolder/driverframework/relink-build.sh $CUSTOM_DRIVERS
```

#### Then...
 * In llvmapps-minix/apps/minix/minix/minix/llvm/clientctl, change MEMSIZE from 512 to 2048

```sh
cd $HOME/llvmapps-minix/apps/minix
RUNARGS=" -net user -net nic " ./clientctl run
```
#### IN MINIX...
```sh
netconf # select default values
shutdown -pD now
```


#### THEN...
```sh
cd $HOME/llvmapps-minix/apps/minix
RUNARGS=" -net user -net nic " ./clientctl run

## IN MINIX
passwd # set root password
ftp http://www.minix3.org/pkgsrc/packages/3.3.0/i386/All/pkg_install-20130902nb1.tgz
tar -zxf pkg_install-20130902nb1.tgz -C/
pkg_add http://www.minix3.org/pkgsrc/packages/3.3.0/i386/All/pkgin-0.6.4nb5.tgz

yes | pkgin update
yes | pkgin install openssh curl

# 'install' tree 1.7
mkdir tree
cd tree
curl ftp://ftp.netbsd.org/pub/pkgsrc/packages/NetBSD/i386/6.1_2016Q2/All/tree-1.7.0.tgz -o tree.tgz
tar -xvzf tree.tgz
mv bin/tree /sbin/tree17

# shut down
shutdown -pD now
```

#### THEN...
```sh
cd $HOME/llvmapps-minix/apps/minix
RUNARGS=" -localtime -net user,hostfwd=tcp::2222-:22 -net nic " ./clientctl run
```
