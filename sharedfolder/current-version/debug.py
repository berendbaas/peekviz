from bottle import route

class bcolors:
    # taken from -> http://stackoverflow.com/questions/287871/print-in-terminal-with-colors-using-python
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    HIGHLIGHTGREEN = "\033[1;42m"
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    HIGHLIGHTRED = '\033[1;41m'
    HIGHLIGHTBLUE = '\033[1;37;44m'

def colourPrint(string, colour):
    print(colour + string + bcolors.ENDC)
