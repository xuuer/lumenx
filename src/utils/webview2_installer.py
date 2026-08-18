"""
WebView2 Runtime 检测和安装工具
用于确保 Windows 系统上安装了 Edge WebView2 Runtime
"""
import os
import sys
import subprocess
import winreg
import tempfile
import urllib.request
import logging

logger = logging.getLogger(__name__)


def is_webview2_installed():
    """
    检测 WebView2 Runtime 是否已安装
    通过检查注册表来判断
    """
    try:
        # WebView2 Runtime 的注册表路径
        registry_paths = [
            r"SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}",
            r"SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
        ]

        for reg_path in registry_paths:
            try:
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, reg_path)
                version, _ = winreg.QueryValueEx(key, "pv")
                winreg.CloseKey(key)
                if version:
                    logger.info(f"检测到 WebView2 Runtime 版本: {version}")
                    return True
            except FileNotFoundError:
                continue
            except Exception as e:
                logger.debug(f"检查注册表路径 {reg_path} 时出错: {e}")
                continue

        return False
    except Exception as e:
        logger.error(f"检测 WebView2 安装状态时出错: {e}")
        return False


def download_webview2_installer(download_path):
    """
    下载 WebView2 Runtime 安装程序
    使用 Microsoft 官方的 Evergreen Bootstrapper
    """
    url = "https://go.microsoft.com/fwlink/p/?LinkId=2124703"

    logger.info("开始下载 WebView2 Runtime 安装程序...")
    try:
        # 添加进度回调
        def report_progress(block_num, block_size, total_size):
            downloaded = block_num * block_size
            if total_size > 0:
                percent = min(100, (downloaded * 100) // total_size)
                if block_num % 10 == 0:  # 每10个块显示一次
                    logger.info(f"下载进度: {percent}%")

        urllib.request.urlretrieve(url, download_path, reporthook=report_progress)
        logger.info("WebView2 Runtime 安装程序下载完成")
        return True
    except Exception as e:
        logger.error(f"下载 WebView2 Runtime 安装程序失败: {e}")
        return False


def install_webview2():
    """
    安装 WebView2 Runtime
    返回 True 表示安装成功或已安装，False 表示失败
    """
    # 首先检查是否已安装
    if is_webview2_installed():
        logger.info("WebView2 Runtime 已安装")
        return True

    logger.info("未检测到 WebView2 Runtime，开始安装...")

    # 创建临时目录存放安装程序
    temp_dir = tempfile.gettempdir()
    installer_path = os.path.join(temp_dir, "MicrosoftEdgeWebview2Setup.exe")

    try:
        # 下载安装程序
        if not download_webview2_installer(installer_path):
            logger.error("下载安装程序失败")
            return False

        # 静默安装 WebView2 Runtime
        logger.info("开始安装 WebView2 Runtime（静默模式）...")
        result = subprocess.run(
            [installer_path, "/silent", "/install"],
            capture_output=True,
            timeout=300  # 5分钟超时
        )

        if result.returncode == 0:
            logger.info("WebView2 Runtime 安装成功")
            # 验证安装
            if is_webview2_installed():
                logger.info("WebView2 Runtime 安装验证成功")
                return True
            else:
                logger.warning("安装程序返回成功，但验证失败")
                return False
        else:
            logger.error(f"WebView2 Runtime 安装失败，返回代码: {result.returncode}")
            if result.stderr:
                logger.error(f"错误信息: {result.stderr.decode('utf-8', errors='ignore')}")
            return False

    except subprocess.TimeoutExpired:
        logger.error("安装 WebView2 Runtime 超时")
        return False
    except Exception as e:
        logger.error(f"安装 WebView2 Runtime 时出错: {e}")
        return False
    finally:
        # 清理临时文件
        try:
            if os.path.exists(installer_path):
                os.remove(installer_path)
                logger.debug("已清理临时安装文件")
        except Exception as e:
            logger.debug(f"清理临时文件时出错: {e}")


def ensure_webview2_runtime():
    """
    确保 WebView2 Runtime 已安装
    这是主要的入口函数
    """
    if sys.platform != 'win32':
        logger.info("非 Windows 平台，跳过 WebView2 检查")
        return True

    logger.info("正在检查 WebView2 Runtime...")

    if is_webview2_installed():
        return True

    # 尝试安装
    logger.info("未检测到 WebView2 Runtime，将自动安装")
    success = install_webview2()

    if not success:
        logger.warning("自动安装 WebView2 Runtime 失败")
        logger.warning("您可以手动从以下地址下载安装:")
        logger.warning("https://developer.microsoft.com/microsoft-edge/webview2/")
        return False

    return True
