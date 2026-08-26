"""
Edy - Voice Agent for EduPlatform

A LiveKit voice agent that helps students discover and enroll in courses.
Uses NVIDIA NIM (OpenAI-compatible) for LLM/STT and EdgeTTS for free speech output.

Usage:
    python agent.py

Environment variables (see .env):
    LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
    EDUPLATFORM_API_URL, EDUPLATFORM_API_KEY
    OPENAI_API_KEY, OPENAI_BASE_URL, LLM_MODEL
    STT_API_KEY, STT_BASE_URL, STT_MODEL
"""

import logging
import os

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
)
from livekit.plugins import openai as openai_plugin
from livekit.plugins import silero

from edge_tts_plugin import EdgeTTS, EdgeTTSOptions
from tools import (
    list_courses,
    search_courses,
    get_course_detail,
    get_lessons,
    enroll_course,
    get_student_dashboard,
)

load_dotenv()

logger = logging.getLogger("edy-agent")
logger.setLevel(logging.INFO)

# System prompt for Edy
EDY_SYSTEM_PROMPT = """Eres Edy, el asistente virtual de EduPlatform, una plataforma de cursos online en español.

Tu rol:
- Ayudar a los estudiantes a descubrir cursos del catálogo
- Recomendar cursos relevantes según sus intereses
- Explicar detalles de cursos (descripción, temario, precio, instructor)
- Guiar el proceso de inscripción
- Resolver dudas sobre la plataforma

Reglas importantes:
1. SIEMPRE responde en español
2. Sé cálido, amigable y profesional
3. Máximo 3 recomendaciones por sesión
4. Cuando un curso sea de pago, ACLARA que el link de checkout es SIMULADO (no hay cobro real aún)
5. Antes de inscribir, confirma SIEMPRE con el usuario
6. Si no sabes algo, sé honesto y ofrece escalar a soporte
7. No compartas información de otros estudiantes
8. Usa las herramientas disponibles para buscar y listar cursos reales del catálogo
9. Cuando te pidan detalles de un curso, usa get_course_detail para obtener la información real
10. Para inscribir, necesitas el student_id del usuario

Saluda al usuario cuando se conecte y preséntate como Edy.
"""


class EdyAgent(Agent):
    """Edy voice agent for EduPlatform."""

    def __init__(self) -> None:
        super().__init__(
            instructions=EDY_SYSTEM_PROMPT,
        )

    async def on_enter(self) -> None:
        """Called when the agent joins a room."""
        self.session.say(
            "¡Hola! Soy Edy, tu asistente de EduPlatform. "
            "¿En qué te puedo ayudar hoy? "
            "Puedo ayudarte a encontrar cursos, ver detalles o inscribirte."
        )

    async def on_exit(self) -> None:
        """Called when the agent leaves a room."""
        logger.info("Edy leaving room")


def prewarm(proc: JobProcess) -> None:
    """Prewarm function - loads models before accepting jobs."""
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext) -> None:
    """Main entrypoint for each job."""
    logger.info(f"Connecting to room: {ctx.room.name}")

    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    # Wait for a participant to join
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # Create LLM plugin (OpenAI-compatible via NVIDIA NIM)
    llm = openai_plugin.LLM(
        model=os.getenv("LLM_MODEL", "nvidia/nemotron-3-ultra-550b-a55b"),
        base_url=os.getenv("OPENAI_BASE_URL", "https://integrate.api.nvidia.com/v1"),
        api_key=os.getenv("OPENAI_API_KEY"),
    )

    # Create STT plugin (OpenAI-compatible Whisper via NVIDIA NIM)
    stt_api_key = os.getenv("STT_API_KEY") or os.getenv("OPENAI_API_KEY")
    stt_base_url = os.getenv("STT_BASE_URL", "https://integrate.api.nvidia.com/v1")
    stt_model = os.getenv("STT_MODEL", "nvidia/whisper-large-v3")

    stt = openai_plugin.STT(
        model=stt_model,
        base_url=stt_base_url,
        api_key=stt_api_key,
    )
    logger.info(f"STT configured: {stt_model} @ {stt_base_url}")

    # Create TTS plugin (EdgeTTS - free Microsoft voices)
    tts_voice = os.getenv("EDY_TTS_VOICE", "es-ES-ElviraNeural")
    tts = EdgeTTS(
        options=EdgeTTSOptions(voice=tts_voice)
    )
    logger.info(f"TTS configured: EdgeTTS voice={tts_voice}")

    # Create agent and session with @function_tool tools
    agent = EdyAgent()

    session = AgentSession(
        llm=llm,
        stt=stt,
        tts=tts,
        vad=ctx.proc.userdata["vad"],
        tools=[
            list_courses,
            search_courses,
            get_course_detail,
            get_lessons,
            enroll_course,
            get_student_dashboard,
        ],
    )

    await session.start(agent=agent, room=ctx.room)


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
