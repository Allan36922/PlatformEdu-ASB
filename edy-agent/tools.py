"""
EduPlatform API tools for the Edy voice agent.

These tools allow Edy to interact with the EduPlatform catalog,
search courses, get details, and handle enrollment.
"""

import os
import httpx
from typing import Optional


API_URL = os.getenv("EDUPLATFORM_API_URL", "http://localhost:3000")
API_KEY = os.getenv("EDUPLATFORM_API_KEY", "dev-agent-key-change-in-production")

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}


async def list_courses(category: Optional[str] = None, limit: int = 5) -> str:
    """Lista los cursos disponibles del catálogo.
    
    Args:
        category: Filtrar por categoría (opcional). Categorías: Desarrollo Web, Ciencia de Datos, Diseño, Negocios, Marketing, Idiomas, Productividad, Fotografía y Video, Música, Desarrollo Personal.
        limit: Número máximo de cursos a retornar (default: 5).
    
    Returns:
        Lista de cursos con título, categoría, nivel y precio.
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


async def search_courses(query: str, limit: int = 5) -> str:
    """Busca cursos por similitud semántica usando embeddings de NVIDIA NIM.
    
    Args:
        query: Texto libre para buscar cursos relacionados.
        limit: Número máximo de resultados (default: 5).
    
    Returns:
        Lista de cursos más relevantes para la consulta.
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


async def get_course_detail(course_id: str) -> str:
    """Obtiene el detalle completo de un curso, incluyendo temario.
    
    Args:
        course_id: UUID del curso.
    
    Returns:
        Detalle del curso con descripción, instructor y temario.
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
        
        lines = [
            f"📚 {course.get('title', 'Sin título')}",
            f"Categoría: {course.get('category', 'N/A')}",
            f"Nivel: {course.get('level', 'N/A')}",
            f"Precio: {'Gratis' if (course.get('price') or 0) == 0 else f'${course.get(\"price\", 0):.2f}'}",
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


async def get_lessons(course_id: str, student_id: Optional[str] = None) -> str:
    """Obtiene las lecciones de un curso con acceso según inscripción.
    
    Args:
        course_id: UUID del curso.
        student_id: UUID del estudiante (opcional, para verificar acceso).
    
    Returns:
        Lista de secciones y lecciones del curso.
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


async def enroll_course(course_id: str, student_id: str, confirmed: bool = False) -> str:
    """Inscribe a un estudiante en un curso.
    
    Para cursos gratis, inscripción directa.
    Para cursos de pago, genera un link de checkout simulado.
    
    Args:
        course_id: UUID del curso a inscribir.
        student_id: UUID del estudiante.
        confirmed: Confirmación explícita del usuario (debe ser true para inscribir).
    
    Returns:
        Resultado de la inscripción (éxito, link de pago, o error).
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


async def get_student_dashboard(student_id: str) -> str:
    """Obtiene el dashboard del estudiante con sus cursos inscritos.
    
    Args:
        student_id: UUID del estudiante.
    
    Returns:
        Resumen de cursos inscritos y progreso.
    """
    # Este endpoint podría no existir aún, manejar gracefully
    return (
        "Para ver tu dashboard completo, visita http://localhost:3000/estudiante. "
        "Ahí puedes ver todos tus cursos inscritos y tu progreso."
    )


# Tool definitions for the LLM function calling
EDY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_courses",
            "description": "Lista los cursos disponibles del catálogo de EduPlatform. Usa esta herramienta cuando el usuario quiera ver cursos disponibles o explorar el catálogo.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Filtrar por categoría. Opciones: Desarrollo Web, Ciencia de Datos, Diseño, Negocios, Marketing, Idiomas, Productividad, Fotografía y Video, Música, Desarrollo Personal",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Número máximo de cursos a retornar",
                        "default": 5,
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_courses",
            "description": "Busca cursos por similitud semántica. Usa esta herramienta cuando el usuario busque algo específico como 'curso de Python', 'aprender a tocar guitarra', 'marketing digital', etc.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Texto libre para buscar cursos relacionados",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Número máximo de resultados",
                        "default": 3,
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_course_detail",
            "description": "Obtiene el detalle completo de un curso incluyendo temario, instructor y descripción. Usa esta herramienta cuando el usuario quiera saber más de un curso específico.",
            "parameters": {
                "type": "object",
                "properties": {
                    "course_id": {
                        "type": "string",
                        "description": "UUID del curso",
                    },
                },
                "required": ["course_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_lessons",
            "description": "Obtiene las lecciones de un curso. Usa esta herramienta cuando el usuario quiera ver el contenido o temario detallado de un curso.",
            "parameters": {
                "type": "object",
                "properties": {
                    "course_id": {
                        "type": "string",
                        "description": "UUID del curso",
                    },
                    "student_id": {
                        "type": "string",
                        "description": "UUID del estudiante (opcional, para verificar acceso)",
                    },
                },
                "required": ["course_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "enroll_course",
            "description": "Inscribe a un estudiante en un curso. Para cursos gratis inscripción directa. Para cursos de pago genera un link de checkout simulado. SIEMPRE confirma con el usuario antes de inscribir.",
            "parameters": {
                "type": "object",
                "properties": {
                    "course_id": {
                        "type": "string",
                        "description": "UUID del curso a inscribir",
                    },
                    "student_id": {
                        "type": "string",
                        "description": "UUID del estudiante",
                    },
                    "confirmed": {
                        "type": "boolean",
                        "description": "Confirmación explícita del usuario (debe ser true)",
                    },
                },
                "required": ["course_id", "student_id", "confirmed"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_student_dashboard",
            "description": "Obtiene información del dashboard del estudiante.",
            "parameters": {
                "type": "object",
                "properties": {
                    "student_id": {
                        "type": "string",
                        "description": "UUID del estudiante",
                    },
                },
                "required": ["student_id"],
            },
        },
    },
]

# Map tool names to functions
TOOL_FUNCTIONS = {
    "list_courses": list_courses,
    "search_courses": search_courses,
    "get_course_detail": get_course_detail,
    "get_lessons": get_lessons,
    "enroll_course": enroll_course,
    "get_student_dashboard": get_student_dashboard,
}
