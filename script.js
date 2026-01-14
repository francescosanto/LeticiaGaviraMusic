// script.js
// Lógica del sitio: animaciones, carga de video/audio/galería y modales bio

// Configurazione Cloudinary per i video
const CLOUDINARY_VIDEOS = {
  mashupVideo: "https://res.cloudinary.com/dq33ayw5c/video/upload/v1768243515/Mashup_kxdrlp.mp4"
};

// Funzione helper per generare URL corretti dei file multimediali
// Nota: su GitHub Pages è meglio usare percorsi relativi al sito (non raw.githubusercontent.com).
// Se un file è tracciato con Git LFS, GitHub Pages potrebbe NON servirlo come contenuto binario reale.
function getMediaUrl(relativePath) {
  // Rimuovi eventuali "./" iniziali per normalizzare
  let path = relativePath.replace(/^\.\//, '');

  // Codifica spazi e caratteri speciali (es. "Video Home.mp4" -> "Video%20Home.mp4")
  const encodedPath = encodeURI(path).replace(/#/g, '%23');

  // Sempre percorso relativo (funziona sia in locale che su GitHub Pages)
  return encodedPath.replace(/^\//, '');
}

// Variabile globale per il video hero (per gestire la mutua esclusione con l'audio)
let heroVideoElement = null;

// Sistema di lock globale per garantire mutua esclusione tra audio e video
let currentPlayingMedia = null; // 'audio', 'hero-video', o 'section-video'

document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Aggiorna il percorso del video hero
  heroVideoElement = document.querySelector('.hero-video');
  const heroVideoSource = document.querySelector('.hero-video source');
  
  if (heroVideoElement) {
    // Video hero: usa il file del sito (percorso relativo).
    // Importante: se l'.mp4 è in Git LFS, GitHub Pages potrebbe non servirlo correttamente.
    const videoUrl = getMediaUrl("Video/Video Home.mp4");
    
    // Aggiorna il source se esiste, altrimenti imposta direttamente il src del video
    if (heroVideoSource) {
      heroVideoSource.src = videoUrl;
      heroVideoSource.type = "video/mp4";
    } else {
      // Se non c'è il tag <source>, impostiamo direttamente il src del <video>
      heroVideoElement.src = videoUrl;
    }
    
    // Ricarica il video con il nuovo percorso
    heroVideoElement.load();
    
    // Gestisci errori di caricamento
    heroVideoElement.addEventListener("error", (e) => {
      console.error("Errore nel caricamento del video hero:", e);
      // Fallback: prova il percorso locale diretto (non encoded) nel caso il browser lo gestisca
      const fallbackUrl = "Video/Video Home.mp4";
      if (heroVideoSource) {
        heroVideoSource.src = fallbackUrl;
      } else {
        heroVideoElement.src = fallbackUrl;
      }
      heroVideoElement.load();
    });
    
    // Verifica che il video sia caricato correttamente
    heroVideoElement.addEventListener("loadeddata", () => {
      console.log("Video hero caricato correttamente");
    });
    
    // Aggiungi anche un listener per canplay per assicurarsi che il video sia pronto
    heroVideoElement.addEventListener("canplay", () => {
      console.log("Video hero pronto per la riproduzione");
    });
    
    // Assicurati che il video riparta in loop quando finisce
    heroVideoElement.addEventListener("ended", () => {
      // Se il loop non funziona per qualche motivo, riavvia manualmente
      heroVideoElement.currentTime = 0;
      heroVideoElement.play().catch(() => {
        // Ignora errori di autoplay
      });
    });
    
    // Imposta esplicitamente il loop per sicurezza
    heroVideoElement.loop = true;
    
    // Gestisci la mutua esclusione: quando il video hero inizia a riprodursi, ferma l'audio
    heroVideoElement.addEventListener("play", () => {
      // Ferma l'audio se sta riproducendo
      const audioPlayer = document.querySelector("audio");
      if (audioPlayer && !audioPlayer.paused) {
        audioPlayer.pause();
        // Aggiorna anche i bottoni play/pause dell'audio
        const playPauseBtn = document.getElementById("play-pause");
        const miniPlayPauseBtn = document.getElementById("mini-play-pause-btn");
        if (playPauseBtn) playPauseBtn.innerHTML = "&#9658;";
        if (miniPlayPauseBtn) miniPlayPauseBtn.innerHTML = "&#9658;";
      }
      
      // Ferma anche il video nella sezione video se sta riproducendo
      const sectionVideo = document.querySelector('.video-player');
      if (sectionVideo && !sectionVideo.paused) {
        sectionVideo.pause();
      }
      
      // Imposta il lock su 'hero-video'
      currentPlayingMedia = 'hero-video';
    });
    
    // Gestisci anche quando il video hero viene messo in pausa
    heroVideoElement.addEventListener("pause", () => {
      if (currentPlayingMedia === 'hero-video') {
        currentPlayingMedia = null;
      }
    });
  }

  // Aggiorna i percorsi delle immagini nelle bio
  const bioImages = document.querySelectorAll('.bio-item-image img');
  bioImages.forEach(img => {
    const currentSrc = img.getAttribute('src');
    if (currentSrc && !currentSrc.startsWith('http')) {
      img.src = getMediaUrl(currentSrc);
    }
  });

  initScrollAnimations();
  initVideoCarousel();
  initAudioPlayer();
  initBioModal();
  initGallery();
  initRepertorioExpandible();
});

// -----------------------------
// ANIMACIONES EN SCROLL
// -----------------------------

function initScrollAnimations() {
  const elements = document.querySelectorAll("[data-animate]");
  if (!("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  elements.forEach((el) => observer.observe(el));
}

// -----------------------------
// VIDEO: SINGOLO VIDEO
// -----------------------------

function initVideoCarousel() {
  const container = document.getElementById("video-container");
  
  if (!container) return;

  const videoData = {
    file: CLOUDINARY_VIDEOS.mashupVideo,
    title: "Mashup"
  };

  // Creare il video
  const video = document.createElement("video");
  video.src = videoData.file;
  video.controls = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.className = "video-player";
  video.muted = true; // Muta temporaneamente per evitare audio durante la cattura del frame
  video.crossOrigin = "anonymous"; // Necessario per alcuni video esterni (Cloudinary)
  
  // Gestisci la mutua esclusione con l'audio player
  video.addEventListener("play", () => {
    // Ferma l'audio se sta riproducendo
    const audioPlayer = document.querySelector("audio");
    if (audioPlayer && !audioPlayer.paused) {
      audioPlayer.pause();
      // Aggiorna anche i bottoni play/pause dell'audio
      const playPauseBtn = document.getElementById("play-pause");
      const miniPlayPauseBtn = document.getElementById("mini-play-pause-btn");
      if (playPauseBtn) playPauseBtn.innerHTML = "&#9658;";
      if (miniPlayPauseBtn) miniPlayPauseBtn.innerHTML = "&#9658;";
    }
    
    // Ferma anche il video hero se sta riproducendo
    if (heroVideoElement && !heroVideoElement.paused) {
      heroVideoElement.pause();
    }
    
    // Imposta il lock su 'section-video'
    currentPlayingMedia = 'section-video';
  });
  
  // Gestisci anche quando il video viene messo in pausa
  video.addEventListener("pause", () => {
    if (currentPlayingMedia === 'section-video') {
      currentPlayingMedia = null;
    }
  });
  
  let frameCaptured = false;
  
  // Funzione per catturare il primo frame e usarlo come poster
  function captureFirstFrame() {
    if (frameCaptured) return; // Evita di catturare più volte
    
    try {
      // Verifica che il video abbia dimensioni valide
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return; // Le dimensioni non sono ancora disponibili
      }
      
      // Crea un canvas per catturare il frame
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Imposta le dimensioni del canvas alle dimensioni del video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Disegna il frame corrente del video sul canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Converti il canvas in un'immagine data URL
      const dataURL = canvas.toDataURL("image/jpeg", 0.85);
      
      // Usa l'immagine generata come poster
      video.poster = dataURL;
      frameCaptured = true;
      
      // Rimuovi il muto dopo aver catturato il frame (il video ha i controlli, l'utente può controllare l'audio)
      video.muted = false;
    } catch (error) {
      console.warn("Impossibile catturare il primo frame del video:", error);
      // Fallback: usa uno sfondo scuro se la cattura fallisce
      video.style.backgroundColor = "#0a0a0f";
    }
  }
  
  // Quando i metadati sono caricati, vai al primo frame e catturalo
  video.addEventListener("loadedmetadata", () => {
    // Vai al primo frame (0.1 secondi per assicurarsi che ci sia un frame valido)
    if (video.duration > 0) {
      video.currentTime = Math.min(0.1, video.duration * 0.01);
    }
  });
  
  // Quando il frame è caricato dopo il seek, catturalo
  video.addEventListener("seeked", () => {
    if (video.readyState >= 2 && !frameCaptured) { // HAVE_CURRENT_DATA o superiore
      captureFirstFrame();
    }
  });
  
  // Fallback: se il seeked non funziona, prova quando il video può essere riprodotto
  video.addEventListener("loadeddata", () => {
    if (!frameCaptured && video.readyState >= 2) {
      if (video.currentTime === 0) {
        video.currentTime = 0.1;
      }
      // Usa un piccolo timeout per assicurarsi che il frame sia caricato
      setTimeout(() => {
        if (!frameCaptured && video.readyState >= 2) {
          captureFirstFrame();
        }
      }, 200);
    }
  });

  container.appendChild(video);
}

// -----------------------------
// AUDIO: PLAYER TIPO SPOTIFY
// -----------------------------

function initAudioPlayer() {
  const trackListContainer = document.getElementById("track-list");
  if (!trackListContainer) return;

  // Usamos los archivos MP3 de la carpeta "Songs MP3" que pesan menos
  const tracks = [
    { file: getMediaUrl("Songs MP3/Golden-Hour.mp3"), title: "Golden Hour", info: "Live session" },
    { file: getMediaUrl("Songs MP3/If-I-Ain_t-Got-You.mp3"), title: "If I Ain't Got You", info: "Versión acústica" },
    { file: getMediaUrl("Songs MP3/La-Bachata-Tusa.mp3"), title: "La Bachata - Tusa", info: "En directo" },
    { file: getMediaUrl("Songs MP3/Viva-La-Vida.mp3"), title: "Viva La Vida", info: "Balada" },
    { file: getMediaUrl("Songs MP3/La-vida-es-un-carnival.mp3"), title: "La vida es un carnaval", info: "En directo" },
    { file: getMediaUrl("Songs MP3/Leave-the-door-open.mp3"), title: "Leave The Door Open", info: "Live session" },
    { file: getMediaUrl("Songs MP3/Sweet-caroline.mp3"), title: "Sweet Caroline", info: "En directo" },
    { file: getMediaUrl("Songs MP3/Te-quiero-mucho.mp3"), title: "Te quiero mucho", info: "Versión acústica" },
    { file: getMediaUrl("Songs MP3/Tears-dry-on-their-own.mp3"), title: "Tears Dry On Their Own", info: "Live session" },
    { file: getMediaUrl("Songs MP3/Virtual-Insanity.mp3"), title: "Virtual Insanity", info: "En directo" },
  ];

  const audio = new Audio();
  let currentIndex = -1;
  let isPlaying = false;

  const nowPlayingTitle = document.getElementById("now-playing-title");
  const playPauseBtn = document.getElementById("play-pause");
  const prevBtn = document.getElementById("prev-track");
  const nextBtn = document.getElementById("next-track");
  const currentTimeSpan = document.getElementById("current-time");
  const totalTimeSpan = document.getElementById("total-time");
  const progressBar = document.querySelector(".progress-bar");
  const progressFill = document.getElementById("progress-fill");
  const volumeSlider = document.getElementById("volume-slider");

  // Elementi del banner minimizzato
  const miniPlayerBar = document.getElementById("mini-player-bar");
  const miniPlayerTitle = document.getElementById("mini-player-title");
  const miniPlayerTime = document.getElementById("mini-player-time");
  const miniPlayPauseBtn = document.getElementById("mini-play-pause-btn");
  const miniPrevBtn = document.getElementById("mini-prev-btn");
  const miniNextBtn = document.getElementById("mini-next-btn");
  const miniProgressFill = document.getElementById("mini-progress-fill");
  const miniProgressBar = document.querySelector(".mini-player-progress");

  // Crear lista de pistas
  tracks.forEach((track, index) => {
    const item = document.createElement("div");
    item.className = "track-item";
    item.dataset.index = String(index);

    const infoWrapper = document.createElement("div");
    const titleEl = document.createElement("div");
    titleEl.className = "track-title";
    titleEl.textContent = track.title;
    const metaEl = document.createElement("div");
    metaEl.className = "track-meta";
    metaEl.textContent = track.info;
    infoWrapper.appendChild(titleEl);
    infoWrapper.appendChild(metaEl);

    const playIcon = document.createElement("div");
    playIcon.className = "track-play";

    item.appendChild(infoWrapper);
    item.appendChild(playIcon);

    item.addEventListener("click", () => {
      if (currentIndex === index && isPlaying) {
        pauseAudio();
      } else {
        loadTrack(index);
        playAudio();
      }
    });

    trackListContainer.appendChild(item);
  });

  function loadTrack(index) {
    const track = tracks[index];
    if (!track) return;
    currentIndex = index;
    audio.src = track.file;
    audio.load();
    nowPlayingTitle.textContent = track.title;
    if (miniPlayerTitle) miniPlayerTitle.textContent = track.title;
    updateActiveTrack();
  }

  function playAudio() {
    // Ferma tutti i video se stanno riproducendo
    if (heroVideoElement && !heroVideoElement.paused) {
      heroVideoElement.pause();
    }
    
    const sectionVideo = document.querySelector('.video-player');
    if (sectionVideo && !sectionVideo.paused) {
      sectionVideo.pause();
    }
    
    // Imposta il lock su 'audio'
    currentPlayingMedia = 'audio';
    
    if (currentIndex === -1) {
      loadTrack(0);
      // Aspetta che il track sia caricato prima di riprodurlo
      audio.addEventListener("canplay", function playWhenReady() {
        audio.removeEventListener("canplay", playWhenReady);
        audio.play()
          .then(() => {
            isPlaying = true;
            if (playPauseBtn) playPauseBtn.innerHTML = "&#10074;&#10074;";
            if (miniPlayPauseBtn) miniPlayPauseBtn.innerHTML = "&#10074;&#10074;";
            showMiniPlayer();
          })
          .catch(() => {
            // En caso de error (autoplay bloqueado, etc.), no hacemos nada especial
          });
      }, { once: true });
      return;
    }
    audio
      .play()
      .then(() => {
        isPlaying = true;
        if (playPauseBtn) playPauseBtn.innerHTML = "&#10074;&#10074;";
        if (miniPlayPauseBtn) miniPlayPauseBtn.innerHTML = "&#10074;&#10074;";
        showMiniPlayer();
      })
      .catch(() => {
        // En caso de error (autoplay bloqueado, etc.), no hacemos nada especial
      });
  }

  function pauseAudio() {
    audio.pause();
    isPlaying = false;
    if (playPauseBtn) playPauseBtn.innerHTML = "&#9658;";
    if (miniPlayPauseBtn) miniPlayPauseBtn.innerHTML = "&#9658;";
    
    // Rimuovi il lock se l'audio viene fermato
    if (currentPlayingMedia === 'audio') {
      currentPlayingMedia = null;
    }
    
    // Riprendi il video hero quando l'audio viene fermato
    if (heroVideoElement && heroVideoElement.paused && currentPlayingMedia === null) {
      // Assicurati che il loop sia attivo
      heroVideoElement.loop = true;
      heroVideoElement.play().catch(() => {
        // Ignora errori di autoplay
      });
    }
  }

  function playNext() {
    const nextIndex = (currentIndex + 1) % tracks.length;
    loadTrack(nextIndex);
    playAudio();
  }

  function playPrev() {
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    loadTrack(prevIndex);
    playAudio();
  }

  function updateActiveTrack() {
    const items = trackListContainer.querySelectorAll(".track-item");
    items.forEach((item) => item.classList.remove("active"));
    const active = trackListContainer.querySelector(
      `.track-item[data-index="${currentIndex}"]`
    );
    if (active) active.classList.add("active");
  }

  // Controles del player principale
  if (playPauseBtn) playPauseBtn.addEventListener("click", () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  });

  if (nextBtn) nextBtn.addEventListener("click", playNext);
  if (prevBtn) prevBtn.addEventListener("click", playPrev);

  audio.addEventListener("ended", playNext);

  // Variabile per tracciare se stiamo facendo drag (per evitare conflitti con timeupdate)
  let isUserDragging = false;

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration || isUserDragging) return; // Non aggiornare durante il drag
    const progress = (audio.currentTime / audio.duration) * 100;
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (miniProgressFill) miniProgressFill.style.width = `${progress}%`;
    if (currentTimeSpan) currentTimeSpan.textContent = formatTime(audio.currentTime);
    if (miniPlayerTime) {
      miniPlayerTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    if (totalTimeSpan) totalTimeSpan.textContent = formatTime(audio.duration);
    if (miniPlayerTime && audio.duration) {
      miniPlayerTime.textContent = `0:00 / ${formatTime(audio.duration)}`;
    }
  });

  // Funzione per aggiornare la posizione dell'audio basata sulla posizione del mouse/touch
  function updateProgressFromEvent(e, progressBarElement) {
    if (!audio.duration) return;
    isUserDragging = true;
    const rect = progressBarElement.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : e.changedTouches[0].clientX);
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    
    // Aggiorna manualmente la visualizzazione durante il drag
    const progress = ratio * 100;
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (miniProgressFill) miniProgressFill.style.width = `${progress}%`;
    if (currentTimeSpan) currentTimeSpan.textContent = formatTime(audio.currentTime);
    if (miniPlayerTime) {
      miniPlayerTime.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    }
  }

  // Gestione drag per il progress bar principale
  if (progressBar) {
    let isDragging = false;
    
    // Click semplice sulla barra
    progressBar.addEventListener("click", (e) => {
      if (isDragging) return; // Evita conflitti durante il drag
      updateProgressFromEvent(e, progressBar);
    });

    // Mouse events per drag
    const handleMouseDown = (e) => {
      if (!audio.duration) return;
      isDragging = true;
      progressBar.classList.add("dragging");
      updateProgressFromEvent(e, progressBar);
      
      const handleMouseMove = (e) => {
        if (isDragging) {
          updateProgressFromEvent(e, progressBar);
        }
      };
      
      const handleMouseUp = () => {
        isDragging = false;
        isUserDragging = false;
        progressBar.classList.remove("dragging");
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    // Touch events per drag su mobile
    const handleTouchStart = (e) => {
      if (!audio.duration) return;
      isDragging = true;
      progressBar.classList.add("dragging");
      updateProgressFromEvent(e, progressBar);
      
      const handleTouchMove = (e) => {
        if (isDragging) {
          e.preventDefault(); // Previeni lo scroll durante il drag
          updateProgressFromEvent(e, progressBar);
        }
      };
      
      const handleTouchEnd = () => {
        isDragging = false;
        isUserDragging = false;
        progressBar.classList.remove("dragging");
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
      
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
    };

    // Aggiungi listener al pallino (attraverso il fill)
    progressBar.addEventListener("mousedown", handleMouseDown);
    progressBar.addEventListener("touchstart", handleTouchStart, { passive: true });
  }

  if (volumeSlider) {
    // Imposta il volume iniziale
    const initialVolume = parseFloat(volumeSlider.value || "0.8");
    audio.volume = initialVolume;
    
    // Aggiorna il volume quando lo slider cambia
    volumeSlider.addEventListener("input", (e) => {
      const newVolume = parseFloat(e.target.value);
      audio.volume = newVolume;
    });
    
    // Assicurati che il volume sia sincronizzato anche quando cambia il valore dello slider
    volumeSlider.addEventListener("change", (e) => {
      const newVolume = parseFloat(e.target.value);
      audio.volume = newVolume;
    });
  }

  // Funzioni per il banner minimizzato
  function showMiniPlayer() {
    if (miniPlayerBar) {
      miniPlayerBar.classList.add("is-visible");
      miniPlayerBar.classList.remove("is-hidden");
      document.body.classList.add("has-mini-player");
    }
  }

  function hideMiniPlayer() {
    if (miniPlayerBar) {
      miniPlayerBar.classList.remove("is-visible");
      miniPlayerBar.classList.add("is-hidden");
      document.body.classList.remove("has-mini-player");
    }
  }

  // Controlli del banner minimizzato
  if (miniPlayPauseBtn) {
    miniPlayPauseBtn.addEventListener("click", () => {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    });
  }

  if (miniNextBtn) {
    miniNextBtn.addEventListener("click", playNext);
  }

  if (miniPrevBtn) {
    miniPrevBtn.addEventListener("click", playPrev);
  }

  // Gestione drag per il progress bar del banner minimizzato
  if (miniProgressBar) {
    let isDraggingMini = false;
    
    // Click semplice sulla barra
    miniProgressBar.addEventListener("click", (e) => {
      if (isDraggingMini) return; // Evita conflitti durante il drag
      updateProgressFromEvent(e, miniProgressBar);
    });

    // Mouse events per drag
    const handleMouseDownMini = (e) => {
      if (!audio.duration) return;
      isDraggingMini = true;
      miniProgressBar.classList.add("dragging");
      updateProgressFromEvent(e, miniProgressBar);
      
      const handleMouseMoveMini = (e) => {
        if (isDraggingMini) {
          updateProgressFromEvent(e, miniProgressBar);
        }
      };
      
      const handleMouseUpMini = () => {
        isDraggingMini = false;
        isUserDragging = false;
        miniProgressBar.classList.remove("dragging");
        document.removeEventListener("mousemove", handleMouseMoveMini);
        document.removeEventListener("mouseup", handleMouseUpMini);
      };
      
      document.addEventListener("mousemove", handleMouseMoveMini);
      document.addEventListener("mouseup", handleMouseUpMini);
    };

    // Touch events per drag su mobile
    const handleTouchStartMini = (e) => {
      if (!audio.duration) return;
      isDraggingMini = true;
      miniProgressBar.classList.add("dragging");
      updateProgressFromEvent(e, miniProgressBar);
      
      const handleTouchMoveMini = (e) => {
        if (isDraggingMini) {
          e.preventDefault(); // Previeni lo scroll durante il drag
          updateProgressFromEvent(e, miniProgressBar);
        }
      };
      
      const handleTouchEndMini = () => {
        isDraggingMini = false;
        isUserDragging = false;
        miniProgressBar.classList.remove("dragging");
        document.removeEventListener("touchmove", handleTouchMoveMini);
        document.removeEventListener("touchend", handleTouchEndMini);
      };
      
      document.addEventListener("touchmove", handleTouchMoveMini, { passive: false });
      document.addEventListener("touchend", handleTouchEndMini);
    };

    // Aggiungi listener al pallino (attraverso il fill)
    miniProgressBar.addEventListener("mousedown", handleMouseDownMini);
    miniProgressBar.addEventListener("touchstart", handleTouchStartMini, { passive: true });
  }

  // Nascondi il banner quando l'audio finisce (opzionale)
  audio.addEventListener("ended", () => {
    // Il banner rimane visibile anche quando finisce, così l'utente può riprodurre facilmente
    // Se vuoi nasconderlo, decommenta la riga seguente:
    // hideMiniPlayer();
    
    // Rimuovi il lock quando l'audio finisce
    if (currentPlayingMedia === 'audio') {
      currentPlayingMedia = null;
    }
    
    // Riprendi il video hero quando l'audio finisce (solo se nessun altro media sta riproducendo)
    if (heroVideoElement && heroVideoElement.paused && currentPlayingMedia === null) {
      // Assicurati che il loop sia attivo
      heroVideoElement.loop = true;
      heroVideoElement.play().catch(() => {
        // Ignora errori di autoplay
      });
    }
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// -----------------------------
// BIO MODAL
// -----------------------------

function initBioModal() {
  // Funzione disabilitata - le bio sono ora fisse e non cliccabili
}

// -----------------------------
// GALERÍA (CAROUSEL)
// -----------------------------

function initGallery() {
  const container = document.getElementById("gallery-carousel");
  const indicatorsContainer = document.getElementById("gallery-indicators");
  const prevBtn = document.getElementById("gallery-prev");
  const nextBtn = document.getElementById("gallery-next");
  
  if (!container) return;

  const galleryImages = [
    getMediaUrl("Foto/Leti/IMG_3467.jpeg"),
    getMediaUrl("Foto/Fra/6019103366778574392.jpg"),
    getMediaUrl("Foto/LetiEFra/DSC02576.jpeg"),
    getMediaUrl("Foto/LetiEFra/IMG_3469.jpeg"),
  ];

  let currentIndex = 0;

  // Crear le immagini nel carosello
  galleryImages.forEach((src, index) => {
    const slide = document.createElement("div");
    slide.className = "gallery-carousel-slide";
    if (index === 0) slide.classList.add("active");

    const img = document.createElement("img");
    img.src = src;
    img.alt = "Leticia Gavira Music - momento en directo";
    img.loading = "lazy";

    slide.appendChild(img);
    container.appendChild(slide);

    // Creare indicatori
    const indicator = document.createElement("button");
    indicator.className = "gallery-indicator";
    if (index === 0) indicator.classList.add("active");
    indicator.setAttribute("aria-label", `Foto ${index + 1}`);
    indicator.addEventListener("click", () => goToSlide(index));
    if (indicatorsContainer) indicatorsContainer.appendChild(indicator);
  });

  function goToSlide(index) {
    if (index < 0 || index >= galleryImages.length) return;
    
    const slides = container.querySelectorAll(".gallery-carousel-slide");
    const indicators = indicatorsContainer?.querySelectorAll(".gallery-indicator");
    
    // Rimuovere active dalla slide corrente
    slides[currentIndex]?.classList.remove("active");
    indicators?.[currentIndex]?.classList.remove("active");

    currentIndex = index;

    // Aggiungere active alla nuova slide
    slides[currentIndex]?.classList.add("active");
    indicators?.[currentIndex]?.classList.add("active");
  }

  function nextSlide() {
    const nextIndex = (currentIndex + 1) % galleryImages.length;
    goToSlide(nextIndex);
  }

  function prevSlide() {
    const prevIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    goToSlide(prevIndex);
  }

  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
}

// -----------------------------
// REPERTORIO ESPANDIBLE
// -----------------------------

function initRepertorioExpandible() {
  const toggle = document.getElementById("repertorio-toggle");
  const content = document.getElementById("repertorio-content");
  
  if (!toggle || !content) return;

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    
    toggle.setAttribute("aria-expanded", !isExpanded);
    
    if (!isExpanded) {
      content.classList.add("is-open");
    } else {
      content.classList.remove("is-open");
    }
  });
}



