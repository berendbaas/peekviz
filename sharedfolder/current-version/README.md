## Instructions to get it going:

All necessary files at: https://www.dropbox.com/sh/8wztipmvslaqpnq/AAChyAHoYz2g4la4Zdvi3StHa?dl=0

### Installation
On Minix virtual machine:
1. make sure root password is "root" (right now this is hardcoded for ssh access on the webserver)

On host machine:

1. Make sure you have python2.7 and pip installed
2. sudo pip install bottle paramiko
    - these are python packages for a simple http server (bottle) and ssh connections (paramiko)
3. Fire up Minix VM if not already running
4. ssh localhost -p 2222 (this port may need changing — that's the default for the image we received. Can be found/changed in VirtualBox -> Minix-PeekFS -> Settings -> Network -> Port Forwarding)
    - this gets you into the Minix VM for easy copy/pasting
5. Copy/paste the lines below:

        pkgin install wget libiconv
        cd
        mkdir tree
        cd tree
        curl ftp://ftp.netbsd.org/pub/pkgsrc/packages/NetBSD/i386/6.1_2015Q1/All/tree-1.7.0.tgz -o tree.tgz #(i386 build of "tree 1.7")
        tar -xvzf tree.tgz
        mv bin/tree /sbin/tree17

6. You should be all set for usage

### Usage
1. python working-server.py 8080
2. open peek.html
3. take it for a spin

#### A few notes
- The filter works by doing a regex match on the full path of the nodes in the tree.
- Watches only work on files right now, links and directories aren't supported because they're not stable yet.
- Treeing the entire /peek directory results into tree trying to go into the /peek/vm and /peek/inet directories, which crashes the VM right now. For now we ignore those two when treeing /peek.
- When the html file is opened / refreshed, it automatically tries to fetch /peek/hello right now. Fetching these results might take a while, so be prepared to wait ~15 seconds for the first data to be retrieved. This will probably be removed when the problem above is fixed.
