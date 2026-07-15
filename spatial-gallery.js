(() => {
  const root = document.documentElement;
  const tideScene = document.querySelector('.tide-scene');
  const tideStage = document.querySelector('.tide-sticky');
  const tideFrames = [...document.querySelectorAll('.tide-frame')];
  const tideAmbient = [...document.querySelectorAll('.tide-ambient img')];
  const tideRing = document.querySelector('.tide-aperture-ring');
  const tideCurrent = document.querySelector('#tideCurrent');
  const afterlightScene = document.querySelector('.afterlight-scene');
  const afterlightStage = document.querySelector('.afterlight-sticky');
  const afterlightWorld = document.querySelector('.afterlight-world');
  const afterlightTableaux = [...document.querySelectorAll('.after-tableau')];
  const afterlightCurrent = document.querySelector('#afterlightCurrent');

  if (!tideScene || !tideStage || !tideRing || !afterlightScene || !afterlightStage || !afterlightWorld || !tideFrames.length || !afterlightTableaux.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const ease = value => {
    const progress = clamp(value);
    return progress * progress * (3 - 2 * progress);
  };
  const range = (start, end, value) => ease((value - start) / Math.max(.0001, end - start));
  const progressFor = (scene, stage) => {
    const rect = scene.getBoundingClientRect();
    const distance = Math.max(1, scene.offsetHeight - stage.clientHeight);
    return clamp(-rect.top / distance);
  };
  const isCompactSpatial = () => coarsePointer.matches || window.innerWidth <= 760;

  let tideActive = 0;
  let afterlightActive = 0;
  let lastAfterlightProgress = 0;
  let afterlightBank = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let lightX = 0;
  let lightY = 0;
  let lastSpatialTime = 0;
  let spatialTicking = false;

  function primeImages(container) {
    container.querySelectorAll('img[loading="lazy"]').forEach(image => {
      image.loading = 'eager';
      image.decode?.().catch(() => {});
    });
  }

  function renderTide(progress) {
    const travel = progress * (tideFrames.length - 1);
    const currentIndex = Math.min(tideFrames.length - 1, Math.floor(travel + .00001));
    const nextIndex = Math.min(tideFrames.length - 1, currentIndex + 1);
    const local = currentIndex === tideFrames.length - 1 ? 0 : travel - currentIndex;
    const reveal = ease(local);
    const captionIndex = Math.min(tideFrames.length - 1, Math.round(travel));
    const maximumRadius = Math.hypot(window.innerWidth, window.innerHeight) * 1.08;
    const aperture = maximumRadius * reveal;

    tideFrames.forEach((frame, index) => {
      const isCurrent = index === currentIndex;
      const isNext = index === nextIndex && nextIndex !== currentIndex;
      frame.classList.toggle('is-current', isCurrent);
      frame.classList.toggle('is-next', isNext);
      frame.classList.toggle('is-captioned', index === captionIndex);
      frame.setAttribute('aria-hidden', index === captionIndex ? 'false' : 'true');

      if (isCurrent) {
        frame.style.setProperty('--aperture-radius', `${maximumRadius.toFixed(1)}px`);
        frame.style.setProperty('--tide-media-scale', (1 + reveal * .085).toFixed(4));
      } else if (isNext) {
        const depthScale = 1100 / (1100 - (1 - reveal) * 75);
        frame.style.setProperty('--aperture-radius', `${aperture.toFixed(1)}px`);
        frame.style.setProperty('--tide-media-scale', ((1.055 - reveal * .055) * depthScale).toFixed(4));
        if (reveal > .06) primeImages(frame);
      } else {
        frame.style.setProperty('--aperture-radius', '0px');
        frame.style.setProperty('--tide-media-scale', '1.055');
      }
    });

    const ringFrame = tideFrames[nextIndex];
    tideRing.style.setProperty('--focus-x', ringFrame.style.getPropertyValue('--focus-x') || '50%');
    tideRing.style.setProperty('--focus-y', ringFrame.style.getPropertyValue('--focus-y') || '50%');
    tideRing.style.setProperty('--aperture-px', aperture.toFixed(1));
    tideRing.style.setProperty('--aperture-edge', nextIndex === currentIndex ? '0' : Math.sin(reveal * Math.PI).toFixed(3));

    if (captionIndex !== tideActive) {
      tideActive = captionIndex;
      tideAmbient.forEach((image, index) => image.classList.toggle('is-active', index === tideActive));
      tideCurrent.textContent = String(tideActive + 1).padStart(2, '0');
    }

    root.style.setProperty('--tide-progress', progress.toFixed(4));
    root.style.setProperty('--tide-transition', Math.sin(local * Math.PI).toFixed(4));
    root.style.setProperty('--tide-title-opacity', (1 - range(.035, .15, progress)).toFixed(4));
  }

  function renderAfterlight(progress, deltaSeconds) {
    const compact = isCompactSpatial();
    const rawTravel = progress * (afterlightTableaux.length - 1);
    const beat = Math.min(afterlightTableaux.length - 1, Math.floor(rawTravel + .00001));
    const local = beat === afterlightTableaux.length - 1 ? 0 : rawTravel - beat;
    const passageStart = beat === 4 ? .2 : .08;
    const passageEnd = beat === 3 ? .82 : .92;
    const passage = beat === afterlightTableaux.length - 1 ? 0 : range(passageStart, passageEnd, local);
    const travel = beat + passage;
    const activeIndex = Math.min(afterlightTableaux.length - 1, Math.round(travel));
    const red = range(4.15, 5.25, travel);
    const velocity = (progress - lastAfterlightProgress) / Math.max(.008, deltaSeconds);
    const bankTarget = clamp(velocity * 22, -1.45, 1.45);
    const motionEase = 1 - Math.exp(-deltaSeconds * 12);
    const pointerEase = 1 - Math.exp(-deltaSeconds * 8.5);
    const lightEase = 1 - Math.exp(-deltaSeconds * 5.5);
    afterlightBank += (bankTarget - afterlightBank) * motionEase;
    pointerX += (pointerTargetX - pointerX) * pointerEase;
    pointerY += (pointerTargetY - pointerY) * pointerEase;
    lightX += (pointerTargetX - lightX) * lightEase;
    lightY += (pointerTargetY - lightY) * lightEase;
    lastAfterlightProgress = progress;

    const corridor = Math.sin(passage * Math.PI);
    const corridorDirection = beat % 2 ? 1 : -1;
    const corridorX = corridorDirection * corridor * (compact ? 2.35 : 5.4);
    const corridorY = -corridor * (compact ? .55 : 1.25);
    const corridorZ = corridor * (compact ? 22 : 68);
    const corridorYaw = corridorDirection * corridor * (compact ? .72 : 1.75);

    afterlightTableaux.forEach((tableau, index) => {
      const delta = index - travel;
      const distance = Math.abs(delta);
      const isNear = compact ? delta > -1.08 && delta < 1.08 : distance < 1.42;
      const z = delta >= 0
        ? -delta * (compact ? 430 : 720)
        : Math.min(compact ? 140 : 260, -delta * (compact ? 300 : 520));
      const x = delta * (compact ? -1.75 : -3.4);
      const y = Math.sin(delta * 1.7) * (compact ? 1.25 : 2.4);
      const rotateY = delta * (compact ? -4.2 : -8.5);
      const rotateZ = delta * (compact ? .55 : 1.1);
      const scale = delta < 0 ? 1 + Math.min(distance, 1) * (compact ? .075 : .17) : 1;
      const opacity = delta < 0 ? clamp(1 - distance * 1.08) : clamp(1 - distance * .54);
      const depthBlur = compact ? 0 : Math.min(2.2, distance * 1.75);

      tableau.classList.toggle('is-near', isNear);
      tableau.classList.toggle('is-current', index === activeIndex);
      tableau.setAttribute('aria-hidden', index === activeIndex ? 'false' : 'true');
      tableau.style.opacity = isNear ? opacity.toFixed(4) : '0';
      tableau.style.transform = `translate3d(${x.toFixed(2)}vw, ${y.toFixed(2)}vh, ${z.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      tableau.style.setProperty('--depth-blur', `${depthBlur.toFixed(2)}px`);

      if (distance < (compact ? 1.12 : 2.1)) primeImages(tableau);
      if (!isNear) return;

      const frames = [...tableau.querySelectorAll('.after-frame')];
      frames.forEach((frame, frameIndex) => {
        const centerDistance = Math.abs(frameIndex - (frames.length - 1) / 2);
        const depthWeight = .72 + centerDistance * .22;
        const direction = frameIndex % 2 ? -1 : 1;
        const frameX = compact ? 0 : pointerX * direction * depthWeight * 10;
        const frameY = compact ? 0 : pointerY * direction * depthWeight * 7;
        frame.style.setProperty('--frame-parallax-x', `${frameX.toFixed(2)}px`);
        frame.style.setProperty('--frame-parallax-y', `${frameY.toFixed(2)}px`);
        frame.style.setProperty('--image-parallax-x', `${(-frameX * .28).toFixed(2)}px`);
        frame.style.setProperty('--image-parallax-y', `${(-frameY * .28).toFixed(2)}px`);
      });
    });

    if (activeIndex !== afterlightActive) {
      afterlightActive = activeIndex;
      afterlightCurrent.textContent = afterlightTableaux[activeIndex].dataset.range || '01';
    }

    root.style.setProperty('--afterlight-progress', progress.toFixed(4));
    root.style.setProperty('--afterlight-red', red.toFixed(4));
    root.style.setProperty('--afterlight-title-opacity', (1 - range(.03, .15, progress)).toFixed(4));
    root.style.setProperty('--afterlight-bank', `${afterlightBank.toFixed(3)}deg`);
    root.style.setProperty('--afterlight-tilt-x', `${(-pointerY * (compact ? .45 : 1.05)).toFixed(3)}deg`);
    root.style.setProperty('--afterlight-tilt-y', `${(pointerX * (compact ? .55 : 1.35)).toFixed(3)}deg`);
    root.style.setProperty('--afterlight-drift-x', `${(-pointerX * (compact ? 0 : 8)).toFixed(2)}px`);
    root.style.setProperty('--afterlight-drift-y', `${(-pointerY * (compact ? 0 : 5)).toFixed(2)}px`);
    root.style.setProperty('--afterlight-corridor-x', `${corridorX.toFixed(3)}vw`);
    root.style.setProperty('--afterlight-corridor-y', `${corridorY.toFixed(3)}vh`);
    root.style.setProperty('--afterlight-corridor-z', `${corridorZ.toFixed(2)}px`);
    root.style.setProperty('--afterlight-corridor-yaw', `${corridorYaw.toFixed(3)}deg`);
    root.style.setProperty('--afterlight-light-x', `${(50 + lightX * (compact ? 0 : 9)).toFixed(2)}%`);
    root.style.setProperty('--afterlight-light-y', `${(45 + lightY * (compact ? 0 : 7)).toFixed(2)}%`);
  }

  function paintSpatial(timestamp = performance.now()) {
    spatialTicking = false;
    if (reducedMotion.matches) return;
    const deltaSeconds = lastSpatialTime ? clamp((timestamp - lastSpatialTime) / 1000, .008, .064) : 1 / 60;
    lastSpatialTime = timestamp;
    renderTide(progressFor(tideScene, tideStage));
    renderAfterlight(progressFor(afterlightScene, afterlightStage), deltaSeconds);
    const pointerMoving = Math.abs(pointerTargetX - pointerX) > .001 || Math.abs(pointerTargetY - pointerY) > .001 || Math.abs(pointerTargetX - lightX) > .001 || Math.abs(pointerTargetY - lightY) > .001;
    if (Math.abs(afterlightBank) > .01 || pointerMoving) requestSpatialPaint();
  }

  function requestSpatialPaint() {
    if (spatialTicking) return;
    spatialTicking = true;
    window.requestAnimationFrame(paintSpatial);
  }

  function scrollToBeat(scene, stage, beat, beatCount) {
    const targetBeat = clamp(beat, 0, beatCount - 1);
    const distance = Math.max(1, scene.offsetHeight - stage.clientHeight);
    const sceneTop = scene.getBoundingClientRect().top + window.scrollY;
    const target = sceneTop + distance * (targetBeat / Math.max(1, beatCount - 1));
    if (typeof scrollPageTo === 'function') scrollPageTo(target, true);
    else window.scrollTo({ top: target, behavior: 'smooth' });
  }

  function attachSpatialControls(stage, scene, beatCount, getActive) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let moved = false;

    stage.addEventListener('pointerdown', event => {
      if (event.button !== 0 || reducedMotion.matches) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      moved = false;
      stage.setPointerCapture?.(event.pointerId);
    }, { passive: true });

    stage.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      moved = moved || Math.abs(dx) > 8 || Math.abs(dy) > 8;
      stage.classList.toggle('is-dragging', moved && Math.abs(dx) > Math.abs(dy));
    }, { passive: true });

    const finishPointer = event => {
      if (event.pointerId !== pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      stage.classList.remove('is-dragging');
      pointerId = null;
      if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      scrollToBeat(scene, stage, getActive() + (dx < 0 ? 1 : -1), beatCount);
    };

    stage.addEventListener('pointerup', finishPointer);
    stage.addEventListener('pointercancel', event => {
      if (event.pointerId === pointerId) {
        if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
        pointerId = null;
        stage.classList.remove('is-dragging');
      }
    });
    stage.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        scrollToBeat(scene, stage, getActive() + 1, beatCount);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        scrollToBeat(scene, stage, getActive() - 1, beatCount);
      } else if (event.key === 'Home') {
        event.preventDefault();
        scrollToBeat(scene, stage, 0, beatCount);
      } else if (event.key === 'End') {
        event.preventDefault();
        scrollToBeat(scene, stage, beatCount - 1, beatCount);
      }
    });
  }

  attachSpatialControls(tideStage, tideScene, tideFrames.length, () => tideActive);
  attachSpatialControls(afterlightStage, afterlightScene, afterlightTableaux.length, () => afterlightActive);

  afterlightStage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const rect = afterlightStage.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1) * 2 - 1;
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1) * 2 - 1;
    pointerTargetX = x;
    pointerTargetY = y;
    requestSpatialPaint();
  }, { passive: true });
  afterlightStage.addEventListener('pointerleave', () => {
    pointerTargetX = 0;
    pointerTargetY = 0;
    requestSpatialPaint();
  });

  window.addEventListener('scroll', requestSpatialPaint, { passive: true });
  window.addEventListener('resize', requestSpatialPaint);
  reducedMotion.addEventListener?.('change', requestSpatialPaint);
  coarsePointer.addEventListener?.('change', requestSpatialPaint);
  requestSpatialPaint();
})();
