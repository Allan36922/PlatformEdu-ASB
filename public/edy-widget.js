/**
 * <edy-voice-widget>
 *
 * Web Component embebible que conecta a una sala de LiveKit donde corre el
 * agente Edy. Ver CLAUDE.md, seccion 10.
 *
 * Atributos:
 *   livekit-url      wss://... de tu proyecto LiveKit (obligatorio)
 *   room              nombre de la sala (obligatorio)
 *   student-id        opcional: id del estudiante con sesion iniciada
 *   token-endpoint    opcional: URL que EduPlatform expone para mintar un
 *                     token de acceso a la sala (POST { room, studentId }).
 *                     El agente Edy (este repo) NO mintea tokens: eso vive
 *                     del lado de EduPlatform, que es quien tiene
 *                     LIVEKIT_API_KEY/SECRET.
 *   token             opcional, solo para pruebas locales (ver
 *                     widget-demo.html): un token ya generado a mano.
 *
 * Ningun secreto (API key/secret de LiveKit ni credenciales de AWS) vive en
 * este archivo: siempre se resuelve un token de corta duracion en el
 * servidor.
 */

const LIVEKIT_CLIENT_UMD_URL = "https://cdn.jsdelivr.net/npm/livekit-client@2/dist/livekit-client.umd.min.js";

let livekitClientPromise = null;

function loadLivekitClient() {
  if (window.LivekitClient) {
    return Promise.resolve(window.LivekitClient);
  }
  if (!livekitClientPromise) {
    livekitClientPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = LIVEKIT_CLIENT_UMD_URL;
      script.async = true;
      script.onload = () => resolve(window.LivekitClient);
      script.onerror = () => reject(new Error("No se pudo cargar livekit-client"));
      document.head.appendChild(script);
    });
  }
  return livekitClientPromise;
}

class EdyVoiceWidget extends HTMLElement {
  constructor() {
    super();
    this._room = null;
    this._micEnabled = false;
    this._status = "desconectado";

    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: inline-block; font-family: system-ui, sans-serif; }
        .panel { border: 1px solid #d0d0d0; border-radius: 12px; padding: 12px 16px; min-width: 220px; }
        .status { font-size: 0.85em; color: #555; margin-bottom: 8px; }
        button { cursor: pointer; border-radius: 8px; border: none; padding: 8px 14px; margin-right: 8px; font-size: 0.9em; }
        .connect { background: #1a73e8; color: white; }
        .mute { background: #eee; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
      </style>
      <div class="panel">
        <div class="status" part="status">Edy: desconectado</div>
        <button class="connect" part="connect-button">Hablar con Edy</button>
        <button class="mute" part="mute-button" disabled>Silenciar</button>
      </div>
      <div class="audio-sink"></div>
    `;

    this._statusEl = this.shadowRoot.querySelector(".status");
    this._connectBtn = this.shadowRoot.querySelector(".connect");
    this._muteBtn = this.shadowRoot.querySelector(".mute");
    this._audioSink = this.shadowRoot.querySelector(".audio-sink");

    this._connectBtn.addEventListener("click", () => {
      if (this._room) {
        this._disconnect();
      } else {
        this._connect();
      }
    });
    this._muteBtn.addEventListener("click", () => this._toggleMute());
  }

  static get observedAttributes() {
    return ["livekit-url", "room", "student-id", "token-endpoint", "token"];
  }

  _setStatus(status) {
    this._status = status;
    this._statusEl.textContent = `Edy: ${status}`;
  }

  async _resolveToken() {
    const explicitToken = this.getAttribute("token");
    if (explicitToken) {
      return explicitToken;
    }

    const tokenEndpoint = this.getAttribute("token-endpoint");
    if (!tokenEndpoint) {
      throw new Error("Falta 'token' o 'token-endpoint' en <edy-voice-widget>");
    }

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: this.getAttribute("room"),
        studentId: this.getAttribute("student-id") || null,
      }),
    });
    if (!response.ok) {
      throw new Error(`token-endpoint respondio ${response.status}`);
    }
    const data = await response.json();
    return data.token;
  }

  async _connect() {
    const livekitUrl = this.getAttribute("livekit-url");
    const roomName = this.getAttribute("room");
    if (!livekitUrl || !roomName) {
      this._setStatus("faltan atributos livekit-url/room");
      return;
    }

    this._connectBtn.disabled = true;
    this._setStatus("conectando...");

    try {
      const { Room, RoomEvent } = await loadLivekitClient();
      const token = await this._resolveToken();

      const room = new Room({ adaptiveStream: true, dynacast: true });
      room.on(RoomEvent.Disconnected, () => this._onDisconnected());

      // Sin esto la voz de Edy llega al navegador pero no suena: hay que
      // adjuntar cada track remoto a un elemento de audio del DOM.
      room.on(RoomEvent.TrackSubscribed, (track) => {
        console.log("[edy-voice-widget] track suscrito:", track.kind);
        if (track.kind !== "audio") return;
        const element = track.attach();
        element.autoplay = true;
        this._audioSink.appendChild(element);
        console.log("[edy-voice-widget] audio de Edy adjuntado al DOM");
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
      });

      await room.connect(livekitUrl, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      // El clic que dispara _connect() cuenta como gesto del usuario, así que
      // aquí el navegador ya permite reproducir audio.
      await room.startAudio();

      this._room = room;
      this._micEnabled = true;
      this._connectBtn.textContent = "Colgar";
      this._muteBtn.disabled = false;
      this._setStatus("conectado");
    } catch (err) {
      console.error("[edy-voice-widget] error al conectar:", err);
      this._setStatus("error al conectar");
    } finally {
      this._connectBtn.disabled = false;
    }
  }

  async _disconnect() {
    if (this._room) {
      await this._room.disconnect();
    }
    this._onDisconnected();
  }

  _onDisconnected() {
    this._room = null;
    this._micEnabled = false;
    this._connectBtn.textContent = "Hablar con Edy";
    this._muteBtn.disabled = true;
    this._setStatus("desconectado");
  }

  async _toggleMute() {
    if (!this._room) return;
    this._micEnabled = !this._micEnabled;
    await this._room.localParticipant.setMicrophoneEnabled(this._micEnabled);
    this._muteBtn.textContent = this._micEnabled ? "Silenciar" : "Activar microfono";
  }

  disconnectedCallback() {
    // React puede desmontar y volver a montar el elemento (Strict Mode, Fast
    // Refresh) sin que el usuario haya colgado. Desconectar de inmediato mata
    // una sesión válida y deja al agente sin participante, así que se espera a
    // confirmar que el elemento sigue fuera del DOM.
    setTimeout(() => {
      if (this._room && !this.isConnected) {
        this._room.disconnect();
      }
    }, 0);
  }
}

customElements.define("edy-voice-widget", EdyVoiceWidget);
