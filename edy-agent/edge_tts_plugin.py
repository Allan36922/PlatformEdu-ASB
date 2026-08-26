"""
Custom EdgeTTS plugin for LiveKit Agents.
Uses Microsoft Edge's free TTS service for speech synthesis.
"""

import asyncio
import io
import logging
from dataclasses import dataclass

import edge_tts
from livekit.agents import tts
from livekit.agents.types import APIConnectOptions

logger = logging.getLogger("edge-tts-plugin")

# Available Spanish voices (edge-tts --list-voices)
DEFAULT_VOICE = "es-ES-ElviraNeural"


@dataclass
class EdgeTTSOptions:
    voice: str = DEFAULT_VOICE
    rate: str = "+0%"
    volume: str = "+0%"
    pitch: str = "+0Hz"


class EdgeTTS(tts.TTS):
    """EdgeTTS - Free TTS using Microsoft Edge voices."""

    def __init__(self, *, options: EdgeTTSOptions | None = None):
        super().__init__(
            capabilities=tts.TTSCapabilities(streaming=False),
            sample_rate=24000,
            num_channels=1,
        )
        self._options = options or EdgeTTSOptions()

    def synthesize(self, text: str, *, conn_options: APIConnectOptions | None = None) -> "EdgeTTSChunkedStream":
        return EdgeTTSChunkedStream(
            tts=self,
            input_text=text,
            conn_options=conn_options or APIConnectOptions(),
            options=self._options,
        )


class EdgeTTSChunkedStream(tts.ChunkedStream):
    """Chunked audio stream from EdgeTTS."""

    def __init__(
        self,
        tts: EdgeTTS,
        input_text: str,
        conn_options: APIConnectOptions,
        options: EdgeTTSOptions,
    ):
        super().__init__(tts=tts, input_text=input_text, conn_options=conn_options)
        self._text = input_text
        self._options = options

    async def __aiter__(self):
        """Yield audio frames from EdgeTTS."""
        try:
            communicate = edge_tts.Communicate(
                text=self._text,
                voice=self._options.voice,
                rate=self._options.rate,
                volume=self._options.volume,
                pitch=self._options.pitch,
            )

            mp3_buffer = bytearray()

            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    mp3_buffer.extend(chunk["data"])

            if not mp3_buffer:
                logger.warning("EdgeTTS returned empty audio")
                return

            # Decode MP3 to raw PCM using ffmpeg subprocess
            pcm_data = await self._decode_mp3_to_pcm(bytes(mp3_buffer))

            if pcm_data:
                yield self._create_audio_frame(pcm_data)

        except Exception as e:
            logger.error(f"EdgeTTS synthesis error: {e}")
            raise

    async def _decode_mp3_to_pcm(self, mp3_data: bytes) -> bytes | None:
        """Decode MP3 bytes to raw PCM (16-bit, mono, 24kHz) using ffmpeg."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "ffmpeg",
                "-i", "pipe:0",
                "-f", "s16le",
                "-acodec", "pcm_s16le",
                "-ar", "24000",
                "-ac", "1",
                "-loglevel", "error",
                "pipe:1",
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await proc.communicate(input=mp3_data)

            if proc.returncode != 0:
                logger.error(f"ffmpeg error: {stderr.decode()}")
                return None

            return stdout

        except FileNotFoundError:
            logger.error("ffmpeg not found - install ffmpeg for EdgeTTS support")
            return None
        except Exception as e:
            logger.error(f"ffmpeg decode error: {e}")
            return None

    def _create_audio_frame(self, pcm_data: bytes):
        """Create a LiveKit AudioFrame from raw PCM bytes."""
        from livekit import rtc

        return rtc.AudioFrame(
            data=pcm_data,
            sample_rate=24000,
            num_channels=1,
            samples_per_channel=len(pcm_data) // (2 * 1),  # 16-bit mono
        )
