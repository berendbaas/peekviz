import paramiko
import random

VM_IP = "127.0.0.1"
VM_SSH_PORT = 2022
VM_USERNAME = "root"
VM_PASSWORD = "root"
INITIAL_CONNECTION_TIMEOUT_VAL = 1

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
#ssh.connect(VM_IP, port=VM_SSH_PORT, username=VM_USERNAME, password=VM_PASSWORD, timeout=INITIAL_CONNECTION_TIMEOUT_VAL)
print "connected"

# <editor-fold SSHFUNCS>
###############
# SSH FUNCTIONS
###############

def do_command(command, connection = ssh, timeout = None):
    print "sending command:", command
    stdin, stdout, stderr = connection.exec_command(command, timeout = timeout)
    result = (stdout.read(), stderr.read())
    return result
# </editor-fold>


# <editor-fold BITFLIP FUNCS>
########################
# BIT FLIPPING FUNCTIONS
########################
get_random_position_in_byte = lambda: random.randrange(8)
binary_string_to_int        = lambda x : int(x, 2)
int_to_hex_string           = lambda x : '{:02x}'.format(x)
hex_string_to_byte_array    = lambda x : bytearray.fromhex(x)
def flip_bit(bytes_in, byte_pos, bit_pos):
    bytes_out = bytes_in
    mask = 1 << bit_pos
    bytes_out[byte_pos] ^= mask
    return bytes_out
# </editor-fold>


# <editor-fold MEMFUNCS>
#############################
# MEMORY READ/WRITE FUNCTIONS
#############################
is_not_empty_string = lambda x : x != ""

def normal_chars_to_hex_string(normal_chars):
    result = ""
    for char in normal_chars:
        if ord(char) <= 0x10:
            result += "0"
        result += "%x" % ord(char)
    return result

def get_escaped_hex(hex_string):
    return "\\x" + "\\x".join([hex_string[i:i+2] for i in range(0,len(hex_string), 2)])

def split_back_into_words(string):
    return " ".join([string[i:i+4] for i in range(0, len(string), 4)])

def flip_endianness_of_string(string):
    new_string = ""
    for i in range(0, len(string), 4):
        new_string += flip_endianness_of_word(string[i:i+4])
    return new_string

def flip_endianness_of_word(word):
    return word[2:] + word[:2]

def write_into_file(path, hex_string):
    command = 'printf "' + get_escaped_hex(hex_string) + '" > ' + path
    do_command(command)

def hex_dump_to_byte_string(hexdump):
    lines = [line for line in hexdump.split("\n") if line != ""]
    for i in range(len(lines)):
        line = lines[i]
        line = line.split()[1:]
        line = " ".join(line)
        lines[i] = line
    hexdump_sans_counter_column = " ".join(lines)
    return hexdump_sans_counter_column
# </editor-fold>




##########
# SHOWTIME
##########

#x = hex_dump_to_byte_string(do_command("hexdump /peek/peter1/.dynamic/292~main~my_message#~0/.raw")[0])
x = hex_dump_to_byte_string("0000000 654c 2774 2073 6165 2c74 4720 6172 646e\n0000010 616d 0021")
print x
x = hex_string_to_byte_array(flip_endianness_of_string("".join(x.split())))
#print x, bin(x[9])
z=flip_bit(x, 9, 2)
#print z, bin(z[9])
z=flip_bit(z, 9, 3)
#print z, bin(z[9])


y = normal_chars_to_hex_string(str(z))
print split_back_into_words(y)
write_into_file("/peek/peter1/.dynamic/292~main~my_message#~0/.raw", y)

ssh.close()
