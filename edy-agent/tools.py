"""
EduPlatform API tools for the Edy voice agent.

Uses livekit-agents 1.7.0 @function_tool decorator.
"""

import os
import httpx
from typing import Optional

from livekit.agents import llm


API_URL = os.getenv("EDUPLATFORM_API_URL", "http://localhost:3000")
API_KEY = os.getenv("EDUPLATFORM_API_KEY", "dev-agent-key-change-in-production")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


@llm.function_tool
async def list_courses(
    category: Optional[str] = None,
    limit: int = 5,
) -> str:
    """Lista los cursos disponibles del catálogo de EduPlatform.

    Usa esta herramienta cuando el usuario quiera ver cursos disponibles
    o explorar el catálogo.

    Args:
        category: Filtrar por categoría (opcional). Categorías: Desarrollo Web,
            Ciencia de Datos, Diseño, Negocios, Marketing, Idiomas,
            Productividad, Fotografía y Video, Música, Desarrollo Personal.
        limit: Número máximo de cursos a retornar (default: 5).
    """
    params = {"pageSize": str(limit)}
    if category:
        params["category"] = category

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{API_URL}/api/agent/courses",
            headers=HEADERS,
            params=params,
        )
        data = resp.json()
        courses = data.get("courses", [])

        if not courses:
            return "No se encontraron cursos disponibles."

        lines = [f"Encontré {len(courses)} cursos:"]
        for i, c in enumerate(courses, 1):
            price = "Gratis" if (c.get("price") or 0) == 0 else f"${c.get('price', 0):.2f}"
            lines.append(
                f"{i}. {c['title']} - {c.get('category', '')} "
                f"({c.get('level', '')}) - {price}"
            )
        return "\n".join(lines)


@llm.function_tool
async def search_courses(query: str, limit: int = 5) -> str:
    """Busca cursos por similitud semántica usando embeddings.

    Usa esta herramienta cuando el usuario busque algo específico como
    'curso de Python', 'aprender a tocar guitarra', 'marketing digital', etc.

    Args:
        query: Texto libre para buscar cursos relacionados.
        limit: Número máximo de resultados (default: 5).
    """
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{API_URL}/api/agent/courses/search",
            headers=HEADERS,
            params={"q": query, "limit": str(limit)},
        )
        data = resp.json()
        courses = data.get("courses", [])

        if not courses:
            return f"No encontré cursos relacionados con '{query}'."

        lines = [f"Encontré {len(courses)} cursos relacionados con '{query}':"]
        for i, c in enumerate(courses, 1):
            price = "Gratis" if (c.get("price") or 0) == 0 else f"${c.get('price', 0):.2f}"
            lines.append(
                f"{i}. {c['title']} - {c.get('category', '')} "
                f"({c.get('level', '')}) - {price}"
            )
        return "\n".join(lines)


@llm.function_tool
async def get_course_detail(course_id: str) -> str:
    """Obtiene el detalle completo de un curso, incluyendo temario.

    Usa esta herramienta cuando el usuario quiera saber más de un curso
    específico.

    Args:
        course_id: UUID del curso.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{API_URL}/api/agent/courses/{course_id}",
            headers=HEADERS,
        )

        if resp.status_code == 404:
            return "No encontré ese curso. ¿Puedes verificar el ID?"

        data = resp.json()
        course = data.get("course", data)
        sections = data.get("sections", [])

        instructor = course.get("instructor", {})
        instructor_name = instructor.get("full_name", "Instructor no disponible") if instructor else "Instructor no disponible"

        price_val = course.get("price") or 0
        price_str = "Gratis" if price_val == 0 else f"${price_val:.2f}"

        lines = [
            f"📚 {course.get('title', 'Sin título')}",
            f"Categoría: {course.get('category', 'N/A')}",
            f"Nivel: {course.get('level', 'N/A')}",
            f"Precio: {price_str}",
            f"Instructor: {instructor_name}",
            f"Estudiantes: {course.get('student_count', 0)}",
            f"Rating: {course.get('rating_average', 0)}/5",
            "",
            f"Descripción: {course.get('description', 'Sin descripción')}",
            "",
            "Temario:"
        ]

        for section in sections:
            lines.append(f"  📁 {section.get('title', 'Sección')}")
            for lesson in section.get("lessons", []):
                lesson_type = {"video": "🎥", "text": "📝", "quiz": "❓"}.get(lesson.get("type", ""), "📄")
                lines.append(f"    {lesson_type} {lesson.get('title', 'Lección')}")

        return "\n".join(lines)


@llm.function_tool
async def get_lessons(course_id: str, student_id: Optional[str] = None) -> str:
    """Obtiene las lecciones de un curso con acceso según inscripción.

    Args:
        course_id: UUID del curso.
        student_id: UUID del estudiante (opcional, para verificar acceso).
    """
    params = {}
    if student_id:
        params["student_id"] = student_id

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{API_URL}/api/agent/courses/{course_id}/lessons",
            headers=HEADERS,
            params=params,
        )
        data = resp.json()
        sections = data.get("sections", [])
        is_enrolled = data.get("isEnrolled", False)
        is_free = data.get("isFree", False)

        if not sections:
            return "No pude obtener el temario de este curso."

        access_info = "Tienes acceso completo." if is_enrolled else ("Es un curso gratuito." if is_free else "Necesitas inscribirte para acceder al contenido.")

        lines = [f"Temario del curso ({access_info})", ""]
        for section in sections:
            lines.append(f"📁 {section.get('title', 'Sección')}")
            for lesson in section.get("lessons", []):
                lesson_type = {"video": "🎥", "text": "📝", "quiz": "❓"}.get(lesson.get("type", ""), "📄")
                has_access = is_enrolled or is_free or lesson.get("is_free_preview", False)
                lock = "" if has_access else " 🔒"
                lines.append(f"  {lesson_type} {lesson.get('title', 'Lección')}{lock}")

        return "\n".join(lines)


@llm.function_tool
async def enroll_course(course_id: str, student_id: str, confirmed: bool = False) -> str:
    """Inscribe a un estudiante en un curso.

    Para cursos gratis, inscripción directa.
    Para cursos de pago, genera un link de checkout simulado.
    SIEMPRE confirma con el usuario antes de inscribir.

    Args:
        course_id: UUID del curso a inscribir.
        student_id: UUID del estudiante.
        confirmed: Confirmación explícita del usuario (debe ser true para inscribir).
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{API_URL}/api/agent/enroll",
            headers=HEADERS,
            json={
                "courseId": course_id,
                "studentId": student_id,
                "confirmed": confirmed,
            },
        )
        data = resp.json()

        if data.get("alreadyEnrolled"):
            return "Ya estás inscrito en este curso. Puedes acceder a él desde tu dashboard."

        if data.get("enrolled"):
            return f"¡Inscripción exitosa! {data.get('message', 'Te has inscrito en el curso.')}"

        if data.get("requiresPayment"):
            price = data.get("price", 0)
            return (
                f"Este curso cuesta ${price:.2f}. "
                f"Te dejo el enlace de checkout: {data.get('checkoutUrl', '')}. "
                f"Nota: Los pagos aún no están integrados, este es un enlace simulado para practicar."
            )

        return data.get("error", "No pude procesar la inscripción. Intenta de nuevo.")


@llm.function_tool
async def get_student_dashboard(student_id: str) -> str:
    """Obtiene información del dashboard del estudiante.

    Args:
        student_id: UUID del estudiante.
    """
    return (
        "Para ver tu dashboard completo, visita http://localhost:3000/estudiante. "
        "Ahí puedes ver todos tus cursos inscritos y tu progreso."
    )
