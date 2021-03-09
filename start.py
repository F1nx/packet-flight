import platform
import os
import webbrowser

unixProcess = 'cat '
linuxOpen = 'xdg-open '
darwinOpen = 'open '

windowsProcess = 'type '
windowsOpen = 'cmd /c start '
def packetTimer(process, open):
    i = 1
    while bool(1):
        os.system('tcpdump -n -i wlo1 -tt -c 1000 > docs/data.dump')
        os.system(process + 'docs/data.dump | python docs/process-dump.py > docs/js/packets/data' + str(i) + '.js')
        if i == 1:
            os.system(open + 'docs/index.html')
            pass
        i += 1
    pass

if platform.system() == 'Linux':
    os.system('rm -r docs/js/packets')
    os.system('mkdir docs/js/packets')
    os.system(packetTimer(unixProcess, linuxOpen))
elif platform.system() == 'Darwin':
    os.system('rm -r docs/js/packets')
    os.system('mkdir docs/js/packets')
    os.system(packetTimer(unixProcess, darwinOpen))
elif platform.system() == 'Windows':
    os.system('rmdir /s docs/js/packets')
    os.system('mkdir docs/js/packets')
    os.system(packetTimer(windowsProcess, windowsOpen))
