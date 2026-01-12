// script.js
// Lógica del sitio: animaciones, carga de video/audio/galería y modales bio

// Configurazione Cloudinary per i video
const CLOUDINARY_VIDEOS = {
  heroVideo: "https://res.cloudinary.com/dq33ayw5c/video/upload/v1768243515/Video_Sfondo_Home.mp4", // AGGIORNA QUESTO URL dopo aver caricato il video su Cloudinary
  mashupVideo: "https://res.cloudinary.com/dq33ayw5c/video/upload/v1768243515/Mashup_kxdrlp.mp4"
};

// Funzione helper per generare URL corretti dei file multimediali
// Su GitHub Pages, i file LFS potrebbero non essere accessibili direttamente
// Quindi usiamo gli URL raw di GitHub per i file multimediali
function getMediaUrl(relativePath) {
  // Rimuovi eventuali "./" iniziali per normalizzare
  let path = relativePath.replace(/^\.\//, '');
  
  // Su GitHub Pages, usa gli URL raw di GitHub per i file multimediali
  // perché i file LFS potrebbero non essere serviti correttamente da GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  if (isGitHubPages) {
    // Estrai username e repository dall'URL corrente
    // Formato GitHub Pages: https://username.github.io/repository/
    const hostnameParts = window.location.hostname.split('.');
    const username = hostnameParts[0]; // La prima parte dell'hostname è l'username
    
    // Estrai il nome del repository dal pathname
    // Se il pathname è "/repository/" o "/repository/index.html", il repo è "repository"
    const pathnameParts = window.location.pathname.split('/').filter(p => p);
    const repoName = pathnameParts[0] || 'LetiFra'; // Fallback al nome della cartella locale
    
    // Prova prima con 'main', poi con 'master' come fallback
    const branch = 'main';
    
    // Costruisci l'URL raw di GitHub per il file
    // Formato: https://raw.githubusercontent.com/username/repo/branch/path
    const rawUrl = `https://raw.githubusercontent.com/${username}/${repoName}/${branch}/${path}`;
    
    return rawUrl;
  } else {
    // In locale, usa percorsi relativi (rimuovi "/" iniziale se presente)
    return path.replace(/^\//, '');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Aggiorna il percorso del video hero (usa Cloudinary)
  const heroVideo = document.querySelector('.hero-video source');
  if (heroVideo) {
    // Usa Cloudinary per il video hero invece del file locale
    heroVideo.src = CLOUDINARY_VIDEOS.heroVideo;
    // Ricarica il video con il nuovo percorso
    const videoElement = heroVideo.parentElement;
    videoElement.load();
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

    const playIcon = document.createElement("button");
    playIcon.className = "track-play";
    playIcon.innerHTML = "&#9658;";

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
    if (currentIndex === -1) {
      loadTrack(0);
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

  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
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

  if (progressBar) {
    progressBar.addEventListener("click", (e) => {
      if (!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * audio.duration;
    });
  }

  if (volumeSlider) {
    audio.volume = parseFloat(volumeSlider.value || "0.8");
    volumeSlider.addEventListener("input", () => {
      audio.volume = parseFloat(volumeSlider.value || "0.8");
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

  // Click sulla barra di progresso del banner minimizzato
  if (miniProgressBar) {
    miniProgressBar.addEventListener("click", (e) => {
      if (!audio.duration) return;
      const rect = miniProgressBar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      audio.currentTime = ratio * audio.duration;
    });
  }

  // Nascondi il banner quando l'audio finisce (opzionale)
  audio.addEventListener("ended", () => {
    // Il banner rimane visibile anche quando finisce, così l'utente può riprodurre facilmente
    // Se vuoi nasconderlo, decommenta la riga seguente:
    // hideMiniPlayer();
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



