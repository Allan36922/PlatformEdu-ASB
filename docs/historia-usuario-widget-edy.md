# Historia de Usuario: Widget de chat/voz del agente Edy en iframe

**Como** estudiante navegando la plataforma
**Quiero** abrir un panel flotante con el agente Edy que me permita hablar por micrófono y resolver mis consultas
**Para** obtener ayuda inmediata sin salir de la página en la que estoy

## Criterios de aceptación

1. **Botón flotante siempre visible**
   En cualquier página bajo `(main)` aparece un botón circular fijo en la esquina inferior derecha (`EdyWidgetLauncher`). Al hacer clic, se abre/cierra un panel de 360×520px con el iframe de Edy; el ícono alterna entre "abrir" y "cerrar".

2. **Carga diferida (lazy) del iframe**
   El `<iframe src="/agente-edy">` solo se monta en el DOM cuando el usuario abre el panel — no se solicita permiso de micrófono ni se carga LiveKit en cada carga de página.

3. **Permiso de micrófono**
   El iframe declara `allow="microphone"` para que el navegador permita al widget interno pedir acceso al micrófono del usuario.

4. **Conexión de voz con Edy**
   Dentro del iframe, el web component `<edy-voice-widget>` (cargado desde `/edy-widget.js`):
   - Muestra un botón "Hablar con Edy" que, al pulsarse, resuelve un token de acceso vía `POST /api/agent/token` y conecta a una sala de LiveKit.
   - Habilita el micrófono automáticamente al conectar y expone un botón "Silenciar / Activar micrófono".
   - Muestra el estado de la conexión en todo momento (`desconectado`, `conectando...`, `conectado`, `error al conectar`).
   - Permite colgar la llamada, lo que libera el micrófono y vuelve al estado inicial.

5. **Resolución de consultas según su diseño**
   Una vez conectado, Edy (el agente que corre del lado de LiveKit) atiende la consulta hablada del estudiante usando las capacidades expuestas por la API del agente (`/api/agent/courses`, `/api/agent/courses/search`, `/api/agent/enroll`, etc.) para responder sobre cursos, inscripciones y contenido de la plataforma.

6. **Aislamiento y seguridad**
   - Ningún secreto de LiveKit (API key/secret) se expone en el cliente; el token se emite en el servidor (`/api/agent/token`) con vida corta.
   - `/agente-edy` es una página standalone sin `Navbar`/`Footer`, pensada exclusivamente para ser embebida en el iframe.

7. **Responsive / no intrusivo**
   El panel respeta `max-w-[calc(100vw-2rem)]` para no desbordar en pantallas pequeñas, y el botón flotante no bloquea contenido crítico de la página.

## Notas técnicas (implementación ya presente en el repo)

- `src/components/layout/edy-widget-launcher.tsx` — botón flotante + iframe lazy.
- `src/app/agente-edy/page.tsx` — página standalone que monta el web component.
- `public/edy-widget.js` — Web Component `<edy-voice-widget>` (conexión LiveKit, mute, estados).
- `src/app/api/agent/token/route.ts` — emisión de tokens LiveKit de corta duración.
- `src/lib/agent-auth.ts` y `src/app/api/agent/*` — endpoints que Edy usa para resolver consultas sobre cursos/inscripciones.

## Definition of Done

- [ ] Botón flotante visible en todas las rutas de `(main)`.
- [ ] Apertura/cierre del panel funcional en desktop y mobile.
- [ ] Conexión de voz exitosa end-to-end (token → LiveKit → micrófono activo).
- [ ] Manejo visible de error si falla la conexión o el token.
- [ ] Sin exposición de credenciales de LiveKit en el bundle del cliente.
