# PyInstaller hook for oss2

from PyInstaller.utils.hooks import collect_all

datas, binaries, hiddenimports = collect_all('oss2')
