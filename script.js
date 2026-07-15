const root = document.documentElement;
const body = document.body;
const loader = document.querySelector('#loader');
const enterSite = document.querySelector('#enterSite');
const menuToggle = document.querySelector('#menuToggle');
const menuPanel = document.querySelector('#menuPanel');
const ambientAudio = document.querySelector('#ambientAudio');
const audioToggle = document.querySelector('#audioToggle');
const audioLabel = document.querySelector('.audio-label');
const contactLink = document.querySelector('.contact-link');
const hero = document.querySelector('#hero');
const portraitsScene = document.querySelector('.portraits-scene');
const portraitSlides = [...document.querySelectorAll('.portrait-slide')];
const portraitCurrent = document.querySelector('#portraitCurrent');
const portraitPrev = document.querySelector('#portraitPrev');
const portraitNext = document.querySelector('#portraitNext');
const platesScene = document.querySelector('.plates-scene');
const plateSlides = [...document.querySelectorAll('.plate-slide')];
const plateCurrent = document.querySelector('#plateCurrent');
const platePrev = document.querySelector('#platePrev');
const plateNext = document.querySelector('#plateNext');
const drinksScene = document.querySelector('.drinks-scene');
const placesScene = document.querySelector('.places-scene');
const placeSlides = [...document.querySelectorAll('.place-slide')];
const placeCurrent = document.querySelector('#placeCurrent');
const drinkStage = document.querySelector('#drinkStage');
const drinkSlides = [...document.querySelectorAll('.drink-slide')];
const drinkCurrent = document.querySelector('#drinkCurrent');
const hospitalityLabel = document.querySelector('#hospitalityLabel');
const hospitalityOpen = document.querySelector('#hospitalityOpen');
const hospitalityClose = document.querySelector('#hospitalityClose');
const hospitalityDrawer = document.querySelector('#hospitalityDrawer');
const archiveOpen = document.querySelector('#archiveOpen');
const archiveClose = document.querySelector('#archiveClose');
const archiveLibrary = document.querySelector('#archiveLibrary');
const libraryGrid = document.querySelector('#libraryGrid');
const libraryFilters = [...document.querySelectorAll('.library-filters button')];
const archiveScene = document.querySelector('.archive-scene');
const aboutScene = document.querySelector('.about');
const spatialScenes = [...document.querySelectorAll('.spatial-gallery')];
const reel = document.querySelector('#reel');
const parallaxImages = [...document.querySelectorAll('[data-speed]')];

let plateIndex = 0;
let portraitIndex = 0;
let placeIndex = 0;
let drinkIndex = 0;
let ticking = false;
let manualPlateScrollY = null;
let manualPortraitScrollY = null;
let manualDrinkScrollY = null;
let heroTouchAnchored = false;
let smoothScroll = null;

function initSmoothScroll() {
  if (smoothScroll || !window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const nativeTouchScroll = window.matchMedia('(pointer: coarse)').matches;
  smoothScroll = new window.Lenis({
    autoRaf: true,
    lerp: .1,
    smoothWheel: true,
    syncTouch: !nativeTouchScroll,
    syncTouchLerp: .075,
    touchInertiaExponent: 1.7,
    touchMultiplier: 1,
    allowNestedScroll: true,
    stopInertiaOnNavigate: true
  });
  smoothScroll.on('scroll', requestPaint);
}

function syncSmoothScrollLock() {
  if (!smoothScroll) return;
  if (body.classList.contains('is-locked')) smoothScroll.stop();
  else smoothScroll.start();
}

function scrollPageTo(top, smooth = false) {
  if (smoothScroll) {
    smoothScroll.scrollTo(top, smooth ? { duration: 1.05 } : { immediate: true });
    return;
  }
  window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
}

function savePreference(key, value) {
  try { window.localStorage?.setItem(key, value); } catch (_) {}
}

function closeLoader() {
  loader.classList.add('is-gone');
  body.classList.remove('is-locked');
  initSmoothScroll();
  syncSmoothScrollLock();
  savePreference('nour-audio', 'on');
  ambientAudio.muted = false;
  playAudio();
}

body.classList.add('is-locked');
enterSite.addEventListener('click', closeLoader);

function setMenu(open) {
  menuPanel.classList.toggle('is-open', open);
  menuPanel.setAttribute('aria-hidden', String(!open));
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  body.classList.toggle('is-locked', open);
  syncSmoothScrollLock();
}

function targetScrollTop(target, hash) {
  if (hash === '#contact') {
    return aboutScene.offsetTop + (aboutScene.offsetHeight - window.innerHeight) * .73;
  }
  return target.getBoundingClientRect().top + window.scrollY;
}

menuToggle.addEventListener('click', () => setMenu(!menuPanel.classList.contains('is-open')));
menuPanel.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
  const target = document.querySelector(link.hash);
  setMenu(false);
  if (!target) return;
  event.preventDefault();
  scrollPageTo(targetScrollTop(target, link.hash));
  history.replaceState(null, '', link.hash);
}));
contactLink.addEventListener('click', event => {
  event.preventDefault();
  const target = document.querySelector('#contact');
  scrollPageTo(targetScrollTop(target, '#contact'), true);
  history.replaceState(null, '', '#contact');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    setMenu(false);
    if (hospitalityDrawer?.classList.contains('is-open')) setHospitality(false);
    if (archiveLibrary?.classList.contains('is-open')) setArchive(false);
  }
});

ambientAudio.volume = .38;
ambientAudio.muted = true;

function renderAudioState(playing) {
  if (playing) delete audioToggle.dataset.audioError;
  audioToggle.classList.toggle('is-playing', playing);
  audioToggle.setAttribute('aria-pressed', String(playing));
  audioToggle.setAttribute('aria-label', playing ? 'Pause background audio' : 'Play background audio');
  audioLabel.textContent = playing ? 'Sound on' : 'Sound off';
}

async function playAudio() {
  try {
    ambientAudio.muted = false;
    await ambientAudio.play();
    savePreference('nour-audio', 'on');
    renderAudioState(true);
  } catch (error) {
    if (error?.name !== 'NotAllowedError') {
      console.warn('Audio playback failed:', error?.name, error?.message);
    }
    renderAudioState(false);
    audioToggle.dataset.audioError = error?.name || 'PlaybackError';
    audioLabel.textContent = 'Tap sound';
  }
}

function pauseAudio() {
  ambientAudio.pause();
  ambientAudio.muted = true;
  savePreference('nour-audio', 'off');
  renderAudioState(false);
}

audioToggle.addEventListener('click', () => {
  if (ambientAudio.paused) playAudio();
  else pauseAudio();
});
ambientAudio.addEventListener('play', () => renderAudioState(true));
ambientAudio.addEventListener('pause', () => renderAudioState(false));
ambientAudio.addEventListener('error', () => {
  renderAudioState(false);
  audioLabel.textContent = 'Tap sound';
});
renderAudioState(false);

function sceneProgress(element) {
  const rect = element.getBoundingClientRect();
  const distance = Math.max(1, element.offsetHeight - window.innerHeight);
  return Math.max(0, Math.min(1, -rect.top / distance));
}

function smoothStep(start, end, value) {
  const progress = Math.max(0, Math.min(1, (value - start) / Math.max(.0001, end - start)));
  return progress * progress * (3 - 2 * progress);
}

function showPlate(index, manual = false) {
  plateIndex = (index + plateSlides.length) % plateSlides.length;
  plateSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === plateIndex));
  plateCurrent.textContent = String(plateIndex + 1).padStart(2, '0');
  if (manual) manualPlateScrollY = window.scrollY;
}

function showPortrait(index, manual = false) {
  portraitIndex = (index + portraitSlides.length) % portraitSlides.length;
  portraitSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === portraitIndex));
  portraitCurrent.textContent = String(portraitIndex + 1).padStart(2, '0');
  if (manual) manualPortraitScrollY = window.scrollY;
}

function showPlace(index) {
  placeIndex = (index + placeSlides.length) % placeSlides.length;
  placeSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === placeIndex));
  placeCurrent.textContent = String(placeIndex + 1).padStart(2, '0');
}

function showDrink(index, manual = false) {
  drinkIndex = (index + drinkSlides.length) % drinkSlides.length;
  drinkSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === drinkIndex));
  drinkCurrent.textContent = String(drinkIndex + 1).padStart(2, '0');
  hospitalityLabel.textContent = drinkSlides[drinkIndex].dataset.label || 'Hospitality';
  if (manual) manualDrinkScrollY = window.scrollY;
}

platePrev.addEventListener('click', () => showPlate(plateIndex - 1, true));
plateNext.addEventListener('click', () => showPlate(plateIndex + 1, true));
portraitPrev.addEventListener('click', () => showPortrait(portraitIndex - 1, true));
portraitNext.addEventListener('click', () => showPortrait(portraitIndex + 1, true));
drinkStage.addEventListener('pointerdown', event => {
  event.preventDefault();
  showDrink(drinkIndex + 1, true);
});

function setHospitality(open) {
  if (open) showDrink(0, true);
  hospitalityDrawer.classList.toggle('is-open', open);
  hospitalityDrawer.setAttribute('aria-hidden', String(!open));
  body.classList.toggle('is-locked', open);
  syncSmoothScrollLock();
  if (open) hospitalityClose.focus();
  else hospitalityOpen.focus();
}

hospitalityOpen.addEventListener('click', () => setHospitality(true));
hospitalityClose.addEventListener('click', () => setHospitality(false));

function imageCategory(src) {
  if (src.includes('portrait-') || src.includes('/shoreline/') || src.includes('/afterlight/')) return 'portrait';
  if (src.includes('place-') || src.includes('architecture')) return 'place';
  if (src.includes('food-') || src.includes('drink-') || src.includes('hospitality-')) return 'hospitality';
  return 'nour';
}

function buildLibrary() {
  if (libraryGrid.childElementCount) return;
  const seen = new Set();
  const images = [...document.querySelectorAll('img[src^="assets/"]')].filter(image => {
    if (image.closest('.tide-ambient')) return false;
    if (seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });

  images.forEach((image, index) => {
    const figure = document.createElement('figure');
    const clone = document.createElement('img');
    const caption = document.createElement('figcaption');
    const category = imageCategory(image.getAttribute('src') || '');
    figure.className = 'library-card';
    figure.dataset.category = category;
    figure.style.animationDelay = `${Math.min(index, 18) * 35}ms`;
    clone.src = image.getAttribute('src');
    clone.alt = image.alt || `Nour Maarouf archive frame ${index + 1}`;
    clone.loading = 'lazy';
    caption.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><span>${category}</span>`;
    figure.append(clone, caption);
    libraryGrid.append(figure);
  });

  const count = archiveOpen.querySelector('span');
  if (count) count.textContent = `${images.length} frames ↗`;
}

function setArchive(open) {
  if (open) buildLibrary();
  archiveLibrary.classList.toggle('is-open', open);
  archiveLibrary.setAttribute('aria-hidden', String(!open));
  body.classList.toggle('is-locked', open);
  syncSmoothScrollLock();
  if (open) {
    archiveLibrary.scrollTop = 0;
    archiveClose.focus();
  } else {
    archiveOpen.focus();
  }
}

archiveOpen.addEventListener('click', () => setArchive(true));
archiveClose.addEventListener('click', () => setArchive(false));
libraryFilters.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  libraryFilters.forEach(item => item.classList.toggle('is-active', item === button));
  [...libraryGrid.children].forEach(card => {
    card.hidden = filter !== 'all' && card.dataset.category !== filter;
  });
  archiveLibrary.scrollTo({ top: document.querySelector('.library-filters').offsetTop, behavior: 'smooth' });
}));

function paint() {
  const heroProgress = sceneProgress(hero);
  const portraitProgress = sceneProgress(portraitsScene);
  const plateProgress = sceneProgress(platesScene);
  const placeProgress = sceneProgress(placesScene);
  const drinkProgress = sceneProgress(drinksScene);
  const archiveProgress = sceneProgress(archiveScene);
  const aboutProgress = sceneProgress(aboutScene);
  const portraitExit = smoothStep(.79, .88, portraitProgress);
  const portraitHandoffEntry = smoothStep(.84, .915, portraitProgress);
  const portraitHandoffSettle = smoothStep(.9, .985, portraitProgress);
  const aboutBlur = smoothStep(.3, .58, aboutProgress);
  const aboutCopyOpacity = 1 - smoothStep(.34, .56, aboutProgress);
  const aboutContactOpacity = smoothStep(.5, .72, aboutProgress);
  const aboutSunRise = smoothStep(.3, .5, aboutProgress);
  const aboutSunFall = 1 - smoothStep(.58, .82, aboutProgress);
  root.style.setProperty('--hero-progress', heroProgress.toFixed(4));
  root.style.setProperty('--plate-progress', plateProgress.toFixed(4));
  root.style.setProperty('--portrait-progress', portraitProgress.toFixed(4));
  root.style.setProperty('--place-progress', placeProgress.toFixed(4));
  root.style.setProperty('--drink-progress', drinkProgress.toFixed(4));
  root.style.setProperty('--archive-progress', archiveProgress.toFixed(4));
  root.style.setProperty('--about-progress', aboutProgress.toFixed(4));
  root.style.setProperty('--about-fade', Math.max(.08, 1 - aboutProgress * .92).toFixed(4));
  root.style.setProperty('--hospitality-progress', drinkProgress.toFixed(4));
  root.style.setProperty('--portrait-exit', portraitExit.toFixed(4));
  root.style.setProperty('--portrait-handoff-entry', portraitHandoffEntry.toFixed(4));
  root.style.setProperty('--portrait-handoff-settle', portraitHandoffSettle.toFixed(4));
  root.style.setProperty('--about-image-blur', (aboutBlur * 8).toFixed(3));
  root.style.setProperty('--about-copy-opacity', aboutCopyOpacity.toFixed(4));
  root.style.setProperty('--about-contact-opacity', aboutContactOpacity.toFixed(4));
  root.style.setProperty('--about-sun', (aboutSunRise * aboutSunFall).toFixed(4));

  if (manualPlateScrollY !== null && Math.abs(window.scrollY - manualPlateScrollY) > 8) manualPlateScrollY = null;
  if (manualPortraitScrollY !== null && Math.abs(window.scrollY - manualPortraitScrollY) > 8) manualPortraitScrollY = null;
  if (manualDrinkScrollY !== null && Math.abs(window.scrollY - manualDrinkScrollY) > 8) manualDrinkScrollY = null;
  if (manualPlateScrollY === null) {
    showPlate(Math.min(plateSlides.length - 1, Math.floor(plateProgress * plateSlides.length)));
  }
  if (manualPortraitScrollY === null) {
    const portraitGalleryProgress = Math.min(1, portraitProgress / .84);
    showPortrait(Math.min(portraitSlides.length - 1, Math.floor(portraitGalleryProgress * portraitSlides.length)));
  }
  showPlace(Math.min(placeSlides.length - 1, Math.floor(placeProgress * placeSlides.length)));
  if (manualDrinkScrollY === null) {
    showDrink(Math.min(drinkSlides.length - 1, Math.floor(drinkProgress * drinkSlides.length)));
  }

  parallaxImages.forEach(image => {
    const rect = image.getBoundingClientRect();
    const offset = (rect.top - window.innerHeight / 2) * Number(image.dataset.speed || 0);
    image.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  });
  const headerProbe = 72;
  const headerNeedsSpace = [portraitsScene, placesScene, ...spatialScenes, drinksScene, archiveScene].some(scene => {
    const rect = scene.getBoundingClientRect();
    return rect.top <= headerProbe && rect.bottom >= headerProbe;
  });
  body.classList.toggle('header-needs-space', headerNeedsSpace);
  ticking = false;
}

function requestPaint() {
  if (!ticking) {
    window.requestAnimationFrame(paint);
    ticking = true;
  }
}

function setHeroFocus(event) {
  const rect = hero.getBoundingClientRect();
  const x = Math.max(12, Math.min(88, (event.clientX - rect.left) / rect.width * 100));
  const y = Math.max(18, Math.min(82, event.clientY / window.innerHeight * 100));
  root.style.setProperty('--mx', `${x.toFixed(1)}%`);
  root.style.setProperty('--my', `${y.toFixed(1)}%`);
}

hero.addEventListener('pointerdown', event => {
  if (event.pointerType === 'mouse' || heroTouchAnchored) return;
  setHeroFocus(event);
  heroTouchAnchored = true;
}, { passive: true });

hero.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse') return;
  setHeroFocus(event);
});

let reelDragging = false;
let reelStartX = 0;
let reelStartScroll = 0;
reel.addEventListener('pointerdown', event => {
  reelDragging = true;
  reelStartX = event.clientX;
  reelStartScroll = reel.scrollLeft;
  reel.classList.add('is-dragging');
  reel.setPointerCapture(event.pointerId);
});
reel.addEventListener('pointermove', event => {
  if (!reelDragging) return;
  reel.scrollLeft = reelStartScroll - (event.clientX - reelStartX);
});
function endReelDrag() {
  reelDragging = false;
  reel.classList.remove('is-dragging');
}
reel.addEventListener('pointerup', endReelDrag);
reel.addEventListener('pointercancel', endReelDrag);
reel.addEventListener('wheel', event => {
  if (event.shiftKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    reel.scrollLeft += event.deltaY;
    event.preventDefault();
  }
}, { passive: false });

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: .16 });
document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));

const chapterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.classList.contains('chapter-arrived')) {
      entry.target.classList.add('chapter-arrived');
    }
  });
}, { threshold: .52 });
[portraitsScene, ...spatialScenes, drinksScene, archiveScene, aboutScene].forEach(scene => chapterObserver.observe(scene));

window.addEventListener('scroll', requestPaint, { passive: true });
window.addEventListener('resize', requestPaint);
showPlate(0);
showPortrait(0);
showPlace(0);
showDrink(0);
paint();
