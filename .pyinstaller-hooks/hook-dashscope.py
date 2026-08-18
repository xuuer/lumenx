# PyInstaller hook for dashscope

from PyInstaller.utils.hooks import collect_all

datas, binaries, hiddenimports = collect_all('dashscope')
