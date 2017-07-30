#!/usr/bin/python

import hashlib, json, sys, re, os, collections, time, threading, select, subprocess
from bottle import route, run, debug, template, request, static_file, get, error, hook, response, app
import paramiko
#from paramiko import SSHException #TODO: remove before submission
from debug import *
import random

VM_IP = "127.0.0.1"
VM_SSH_PORT = 2022
#VM_SSH_PORT = 2222
VM_USERNAME = "root"
VM_PASSWORD = "root"
INITIAL_CONNECTION_TIMEOUT_VAL = 2

NEW_VM_INSTANCE_COMMAND = "VBoxManage startvm \"Minix-PeekFS\""
KILL_VM_INSTANCE_COMMAND = "VBoxManage controlvm \"Minix-PeekFS\" poweroff"
#NEW_VM_INSTANCE_COMMAND = "qemu-system-i386 -kernel kernel -append  rootdevname=c0d0p1 console=tty00 -localtime -net user,hostfwd=tcp::2222-:22 -net nic -m 512 -hda /home/peter/llvmapps-minix/apps/minix/minix/minix_x86.img -nographic -initrd mod01_ds,mod02_rs,mod03_pm,mod04_sched,mod05_vfs,mod06_memory,mod07_tty,mod08_mfs,mod09_vm,mod10_pfs,mod11_init"
#KILL_VM_INSTANCE_COMMAND = "kill $(ps aux | grep qemu | grep -v grep | awk '{print $2}')"
CONNECTION_ALIVE = False
COMMAND_PREFIX = "cd /peek; "
COMMAND_PREFIX_TEMP = ""

HASH_TRACKER = 0
MAX_DEPTH = 1

ssh = None
connection_tester = None

REBOOTING = False

qemu_mode = True

TEST_CONNECTION_AFTER_REQUEST = False

#################################
# SHELL SCRIPTS FOR MINIX MACHINE
#################################

memleaks_command = """list_memleaks()
{
find DEVICEPLACEHOLDER -path "*.strings" -prune -o -path "*msgtable*" -prune -o -name '*' -type l -print | xargs -n1 stat -f %Y | sort | uniq | grep "\.dynamic" | egrep -o "[0-9][0-9]+[^/]*" > /root/temp_memleak_pointed_to
ls -1 DEVICEPLACEHOLDER/.dynamic > /root/temp_memleak_allocd
diff /root/temp_memleak_allocd /root/temp_memleak_pointed_to | grep "<"
}
list_memleaks
rm /root/temp_memleak_allocd /root/temp_memleak_pointed_to"""


# TODO - be aware of exlusion of .strings and msgtable in qemu VM - these directories are massive and slow things down tremendously. This is different than the VBOX image's /peek
dangling_pointers_command = """get_all_pointers()
{
for f in `find DEVICEPLACEHOLDER -path "*.strings" -prune -o -path "*msgtable*" -prune -o -name '*' -type l -print`; do
    link=$(readlink $f)
    echo $f $link
done
}
get_all_pointers | grep invalid"""

homemade_diff = """
FIND_PRUNING="-path \"*.strings\" -prune -o -path \"*msgtable*\" -prune -o -name '*'"

dirs()
{
  find $1 $FIND_PRUNING -type d -print | cut -sd / -f 4- | sort | uniq > /root/left_dirs &
  find $2 $FIND_PRUNING -type d -print | cut -sd / -f 4- | sort | uniq > /root/right_dirs &
  wait
  diff /root/left_dirs /root/right_dirs > /root/dirdifflr
  cat /root/dirdifflr | grep "\<" |  cut -f 2 -d" " > /root/dirdiffl &
  cat /root/dirdifflr | grep "\>" |  cut -f 2 -d" " > /root/dirdiffr &
  wait
}


files() {
  find $1 $FIND_PRUNING -type f -print | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-) "; md5 -n $stuff; done | sort > /root/left_files &
  find $2 $FIND_PRUNING -type f -print | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-) "; md5 -n $stuff; done | sort > /root/right_files &
  wait

  sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' /root/left_files > /root/left_files1 &
  sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' /root/right_files > /root/right_files1 &
  wait

  diff /root/left_files1 /root/right_files1 > /root/filedifflr
  cat /root/filedifflr | grep "\<" | sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' |  cut -f 2 -d" " > /root/filediffl &
  cat /root/filedifflr | grep "\>" | sed -r 's/[[:space:]]*[^[:space:]]+[[:space:]]*$//' |  cut -f 2 -d" " > /root/filediffr &
  wait
}

symlinks () {
  #find $1 -type l | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-)  -> "; readlink "$stuff"; done | sort | uniq > /root/left_links
  #ind $2 -type l | while read stuff; do echo -n "$(echo $stuff | cut -sd / -f 4-)  -> "; readlink "$stuff"; done | sort | uniq > /root/right_links
  find $1 $FIND_PRUNING -type l -print | cut -sd / -f 4- | sort | uniq > /root/left_links &
  find $2 $FIND_PRUNING -type l -print | cut -sd / -f 4- | sort | uniq > /root/right_links &
  wait

  diff /root/left_links /root/right_links > /root/linkdifflr
  cat /root/linkdifflr | grep "\<" |  cut -f 2 -d" " > /root/linkdiffl &
  cat /root/linkdifflr | grep "\>" |  cut -f 2 -d" " > /root/linkdiffr &
  wait
}

files $1 $2 &
dirs $1 $2 &
symlinks $1 $2 &

wait


echo
cat /root/dirdiffl /root/filediffl /root/linkdiffl > /root/alldiffsl &
cat /root/dirdiffr /root/filediffr /root/linkdiffr > /root/alldiffsr &

wait

cat /root/alldiffsl
echo "THIS IS THE LTR RTL SEPARATOR"
cat /root/alldiffsr"""


diff_simulation = """echo "LtR d"
cat /root/dirdiffl
echo "LtR f"
cat /root/filediffl
echo "LtR l"
cat /root/linkdiffl

echo "RtL d"
cat /root/dirdiffr
echo "RtL f"
cat /root/filediffr
echo "RtL l"
cat /root/linkdiffr"""

diff_simulation = """cat /root/alldiffsl
echo "THIS IS THE LTR RTL SEPARATOR"
cat /root/alldiffsr"""


##########################
# SSH CONNECTION FUNCTIONS
##########################

def establish_connections():
    global ssh
    global connection_tester
    global CONNECTION_ALIVE
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    connection_tester = paramiko.SSHClient()
    connection_tester.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    wait_between_attempts = 5
    tick = time.time()
    while not CONNECTION_ALIVE:
        try:
            connection_tester.connect(VM_IP, port=VM_SSH_PORT, username=VM_USERNAME, password=VM_PASSWORD, timeout=INITIAL_CONNECTION_TIMEOUT_VAL)
            ssh.connect(VM_IP, port=VM_SSH_PORT, username=VM_USERNAME, password=VM_PASSWORD, timeout=INITIAL_CONNECTION_TIMEOUT_VAL)
            CONNECTION_ALIVE = True
            tock = time.time()
            colourPrint("Connection established. Took " + str(tock - tick) + " seconds to get from zero to ssh-connected.\n", bcolors.HIGHLIGHTGREEN)
        except Exception as e:
            print e
            print "Failed to connect - VM may still be booting. Trying again in", wait_between_attempts + INITIAL_CONNECTION_TIMEOUT_VAL, "seconds"
            time.sleep(wait_between_attempts)

def test_connection():
    try:
        test_connect = paramiko.SSHClient()
        test_connect.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        test_connect.connect(VM_IP, port=VM_SSH_PORT, username=VM_USERNAME, password=VM_PASSWORD, timeout=INITIAL_CONNECTION_TIMEOUT_VAL)
        test_connect.close()
        return True
    except:
        try:
            test_connect.close()
        except:
            pass
        return False


def start_vm():
    print "THIS IS START VM"
    if not test_connection():
        colourPrint("VM not responding. Starting a new one...\n", bcolors.HIGHLIGHTRED)
        try:
            os.system(KILL_VM_INSTANCE_COMMAND)
            time.sleep(5)
        except:
            pass
        os.system(NEW_VM_INSTANCE_COMMAND)
    else:
        print "VM already running. Establishing connection...\n"
    establish_connections()

def restart_vm():
    global CONNECTION_ALIVE
    global REBOOTING
    if not REBOOTING:
        CONNECTION_ALIVE = False
        REBOOTING = True
        os.system(KILL_VM_INSTANCE_COMMAND)
        start_vm()
        REBOOTING = False
    else:
        print "Already rebooting?", REBOOTING

def do_command(command, connection, timeout = None):
    print "sending command:", command
    stdin, stdout, stderr = connection.exec_command(command, timeout = timeout)
    result = stdout.read()
    print "COMMAND result preview:", result[:50], type(result)
    return result


##########################
# WEB REQUEST FUNCTIONS
##########################

@hook('after_request')
def enable_cors():
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token'
"""
@hook('after_request')
def check_all_good():
    if TEST_CONNECTION_AFTER_REQUEST:
        print "\nAnother happy customer. Checking that connection is still good..."
        connection_fine = True
        for i in range(3):
            if not test_connection():
                connection_fine = False
                colourPrint("Attempt " + str(i+1) + ": failed to connect.", bcolors.HIGHLIGHTRED)
                time.sleep(random.choice([3,4,5]))
            else:
                print "Connection still good\n"
                connection_fine = True
                break
        if not connection_fine:
            print "Cannot connect. Restarting vm"
            restart_vm()
"""


@route('/', method='GET')
def home():
    with open("index.html", "r") as f:
        return f.read()


@get("<filepath:re:.*\..*>")
def serve_file(filepath):
    print "Serving file:", filepath
    return static_file(filepath, root="./")



@route('/restart', method='GET')
def restart():
    global REBOOTING
    print "REBOOTING?", REBOOTING
    if not REBOOTING:
        print "RESTARTING VM"
        restart_vm()
    return json.dumps({"rebooting": REBOOTING, "alive": CONNECTION_ALIVE})


@route('/hard_restart', method='GET')
def hard_restart():
    restart_vm()
    return "restarting"


@route('/connection_status', method='GET')
def good_connection():
    return json.dumps({"alive": test_connection()})


@route('/tree', method='GET')
def tree():
    command_suffix = ""
    if request.query.maxdepth:
        command_suffix = " -L " + request.query.maxdepth
    if qemu_mode:
        command_suffix += " -I '\.strings|msgtable*'"
    command = "/sbin/tree17 " + request.query.path + " -iaJ" + command_suffix
    # i for no indentation lines (useful in conjunction with -f)
    # a for all files (hidden ones too)
    # f for full path
    # p for permissions and file type
    # s for size
    # u for owner/UID
    # g for group name/GID
    # D for for last moDification time
    # J for JSON
    # --inodes for inode numbers
    # --device for device numbers
    # -F for appending useful stuff to hint at filetype ('/' for dirs, '=' for socket files, '*' for executables, '|' for FIFOs like ls -F)
    print "command:", command
    result = do_command(command, ssh)
    return result

@route('/arbitrary_command', method='GET')
def arbitrary_command():
    command = request.query.command
    return_result = request.query.return_result
    result = do_command(command, ssh)
    if return_result:
        return result
    else:
        return "done"

@route('/cat', method='GET')
def cat():
    filepath = request.query.path
    command = "cat " + filepath
    result = do_command(command, ssh)
    return result

@route('/hexdump', method='GET')
def hexdump():
    filepath = request.query.path
    command = "hexdump " + filepath
    result = do_command(command, ssh)
    return result



def process_filter(filter_string, LtR_prefix, RtL_prefix):
    result = {
        "LtR": [],
        "RtL": []
    }
    prefixes = {
        "LtR": LtR_prefix,
        "RtL": RtL_prefix
    }
    keys = sorted(result.keys())
    directions = filter_string.split("THIS IS THE LTR RTL SEPARATOR")
    for i in range(len(directions)):
        dict_key = keys[i]
        prefix = ""#prefixes[dict_key] # TODO: why was it important to prefix the paths? Maybe it wasn't. Remove once confident it can go
        lines = directions[i].split("\n")
        for line in lines:
            if line != "":
                result[dict_key].append(prefix + line)
    return result


def process_diff(diff_string):
    result = {
        "LtR": [],
        "RtL": []
    }
    direction_key = ""
    file_type = ""
    for line in diff_string.split("\n"):
        if "LtR" in line or "RtL" in line:
            info = line.split()
            direction_key = info[0]
            file_type = info[1]
        else:
            result[direction_key].append([line, file_type])
    return result


def process_diff(diff_string):
    result = {
        "LtR": [],
        "RtL": []
    }
    direction_key = ""
    file_type = ""
    keys = sorted(result.keys())
    directions = diff_string.split("THIS IS THE LTR RTL SEPARATOR")
    for i in range(len(directions)):
        dict_key = keys[i]
        prefix = ""#prefixes[dict_key] # TODO: why was it important to prefix the paths? Maybe it wasn't. Remove once confident it can go
        lines = directions[i].split("\n")
        for line in lines:
            if line != "":
                result[dict_key].append(prefix + line)

    return result

@route('/filter', method='GET')
def filter():
    return "Not implemented yet"

def ensure_trailing_slash(dir_name):
    if dir_name is None:
        return dir_name
    if dir_name[-1] != "/":
        dir_name += "/"
    return dir_name

@route('/diff', method='GET')
def diff():
    dev_path1 = request.query.dev_path1
    dev_path2 = request.query.dev_path2
    print ("DEVPATH1", dev_path1, "DEVPATH2", dev_path2)
    #dev_path1 = "/root/level1a/"
    #dev_path2 = "/root/level1b/"
    #dev_path1 = "/peek/hello"
    #dev_path2 = "/peek/1.hello"
    dev_path1 = ensure_trailing_slash(dev_path1)
    dev_path2 = ensure_trailing_slash(dev_path2)
    tick = time.time()
    command_result = do_command("sh /root/diffs2.sh " + dev_path1 + " " + dev_path2, ssh)
    #command_result = do_command(homemade_diff.replace("$1", dev_path1).replace("$2", dev_path2), ssh)
    #command_result = do_command(diff_simulation, ssh)
    tock = time.time()
    result = process_diff(command_result)
    result["time_taken"] = tock-tick
    return json.dumps(result)


@route('/memleaks', method='GET')
def memleaks():
    dev_path = request.query.dev_path
    if not dev_path:
        dev_path = "/peek/hello"
    command = memleaks_command.replace("DEVICEPLACEHOLDER", dev_path)
    result = do_command(command, ssh)
    result = [dev_path + "/.dynamic/" + line[2:] for line in result.split("\n") if line != ""]
    result = {
        "LtR": result,
        "RtL": []
    }
    return json.dumps(result)


@route('/dangling_pointers', method='GET')
def dangling_pointers():
    dev_path = request.query.dev_path
    if not dev_path:
        dev_path = "/peek/hello"
    command = dangling_pointers_command.replace("DEVICEPLACEHOLDER", dev_path)
    result = do_command(command, ssh)
    result = [entry.split()[0] for entry in result.split("\n") if entry != ""]
    result = {
        "LtR": result,
        "RtL": []
    }
    return json.dumps(result)


@route('/snapshot', method="GET")
def snapshot():
    dev_name = request.query.dev_name
    if not dev_name:
        dev_name = "hello"
    command = "service -e update self -label " + dev_name + "; echo -n $?"
    exit_status = do_command(command, ssh)
    response = {"success": True}
    if exit_status != "0":
        response = {"success": False}
    return json.dumps(response)



####################
# DEBUG ROUTES
####################
@route('/immediateresponse', method='GET')
def immediateresponse(): # returns a response immediately
    response = "YO!"
    return response

@route('/sleep_test/<sleep_secs:int>', method='GET')
def sleep_test(sleep_secs): # sleeps for  secs and then re
    sleep_secs = str(sleep_secs)
    return do_command('sleep ' + sleep_secs + '; echo SLEPT ' + sleep_secs + ' secs', ssh)

@route('/crash_server', method='GET')
def crash_server(): # crashes server and returns crash_confirmation
    crash_confirmation = "crashed"
    try:
        do_command("tree /peek/vm", ssh, timeout = 1)
    except:
        return crash_confirmation

@route('/kill_running_trees', method='GET')
def kill_running_trees(): # returns string of killed PIDs
    command = 'for p in `ps ax | grep -ve "grep" | grep tree | awk \'{print $1}\'`\ndo\necho $p; kill $p\ndone'
    return do_command(command, ssh)





####################
# START THE IGNITION
####################

SERVER = ['auto', 'paste'][1]

start_vm()
if not os.path.dirname(__file__) == "":
    os.chdir(os.path.dirname(__file__))

debug(True)
run(host='0.0.0.0', reloader=False, port=sys.argv[1], server=SERVER)
# remember to remove reloader=True and debug(True) when you move your
# application from development to a productive environment
