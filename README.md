# conan-exiles-dedicated
Utility bash files for an easy setup &amp; maintenance of a conan exiles server

## Setup

### SteamCMD

```
sudo apt install lib32gcc1 software-properties-common steamcmd
```

### Wine

```
sudo apt-add-repository 'deb https://dl.winehq.org/wine-builds/ubuntu/ focal main'
sudo apt update
sudo apt install --install-recommends winehq-stable
sudo apt install screen xvfb winetricks
winetricks
```
