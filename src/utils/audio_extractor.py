"""
Audio extraction utility for extracting audio from video files.
Uses ffmpeg to extract audio tracks from videos.
"""
import os
import subprocess
import logging
from typing import Optional
from .system_check import get_ffmpeg_path

logger = logging.getLogger(__name__)


class AudioExtractor:
    """Extract audio from video files using ffmpeg"""
    
    @staticmethod
    def check_ffmpeg() -> bool:
        """Check if ffmpeg is available"""
        ffmpeg_path = get_ffmpeg_path()
        if not ffmpeg_path:
            return False
        try:
            subprocess.run(
                [ffmpeg_path, '-version'],
                capture_output=True,
                check=True
            )
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
    
    @staticmethod
    def extract_audio(
        video_path: str,
        output_path: Optional[str] = None,
        audio_format: str = 'mp3',
        audio_bitrate: str = '192k'
    ) -> str:
        """
        Extract audio from video file
        
        Args:
            video_path: Path to input video file
            output_path: Path to output audio file. If None, will use same directory as video
            audio_format: Output audio format (mp3, wav, aac, etc.)
            audio_bitrate: Audio bitrate (e.g., '192k', '320k')
            
        Returns:
            str: Path to extracted audio file
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")
        
        ffmpeg_path = get_ffmpeg_path()
        if not ffmpeg_path:
            raise RuntimeError(
                "ffmpeg not found. Please install ffmpeg:\n"
                "  macOS: brew install ffmpeg\n"
                "  Ubuntu: sudo apt-get install ffmpeg\n"
                "  Windows: Download from https://ffmpeg.org/"
            )
        
        # Generate output path if not provided
        if output_path is None:
            video_dir = os.path.dirname(video_path)
            video_name = os.path.splitext(os.path.basename(video_path))[0]
            output_path = os.path.join(video_dir, f"{video_name}.{audio_format}")
        
        logger.info(f"Extracting audio from: {video_path}")
        logger.info(f"Output: {output_path}")
        logger.info(f"Format: {audio_format}, Bitrate: {audio_bitrate}")
        
        # Build ffmpeg command
        cmd = [
            ffmpeg_path,
            '-i', video_path,           # Input file
            '-vn',                       # No video
            '-acodec', 'libmp3lame' if audio_format == 'mp3' else 'copy',  # Audio codec
            '-ab', audio_bitrate,        # Audio bitrate
            '-y',                        # Overwrite output file
            output_path
        ]
        
        # Run ffmpeg
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"✅ Audio extracted successfully: {output_path}")
            return output_path
            
        except subprocess.CalledProcessError as e:
            logger.error(f"ffmpeg error: {e.stderr}")
            raise RuntimeError(f"Failed to extract audio: {e.stderr}")
    
    @staticmethod
    def batch_extract(
        video_paths: list,
        audio_format: str = 'mp3',
        audio_bitrate: str = '192k'
    ) -> list:
        """
        Extract audio from multiple video files
        
        Args:
            video_paths: List of video file paths
            audio_format: Output audio format
            audio_bitrate: Audio bitrate
            
        Returns:
            list: List of extracted audio file paths
        """
        results = []
        
        for i, video_path in enumerate(video_paths, 1):
            logger.info(f"\n[{i}/{len(video_paths)}] Processing: {os.path.basename(video_path)}")
            
            try:
                audio_path = AudioExtractor.extract_audio(
                    video_path=video_path,
                    audio_format=audio_format,
                    audio_bitrate=audio_bitrate
                )
                results.append({
                    'video': video_path,
                    'audio': audio_path,
                    'status': 'success'
                })
            except Exception as e:
                logger.error(f"❌ Failed: {e}")
                results.append({
                    'video': video_path,
                    'audio': None,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return results
