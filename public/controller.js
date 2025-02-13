// const urlParams = new URLSearchParams(window.location.search);
// const name = urlParams.get("k"); // Get the value of "name"
const introText = document.querySelector(".text-intro");
introText.innerHTML = `Hi You! Pull the cord.`;
const engine = Matter.Engine.create();
const world = engine.world;

const render = Matter.Render.create({
  element: document.getElementById("canvas-container"),
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: "transparent",
  },
});

// Create a chain of points for the ribbon
const segments = 10;
const segmentHeight = 150 / segments;
const points = [];
const constraints = [];

// Get card position
const card = document.querySelector(".card");
const cardRect = card.getBoundingClientRect();
const startX = window.innerWidth / 2;
const startY = cardRect.top;

// Create points
for (let i = 0; i <= segments; i++) {
  const point = Matter.Bodies.circle(startX, startY + i * segmentHeight, 2, {
    friction: 0.5,
    restitution: 0.5,
    isStatic: i === 0,
    render: {
      visible: true,
      fillStyle: "#000000",
      strokeStyle: "#000000",
    },
  });
  points.push(point);
  Matter.World.add(world, point);
}

// Connect points with constraints
for (let i = 0; i < points.length - 1; i++) {
  const constraint = Matter.Constraint.create({
    bodyA: points[i],
    bodyB: points[i + 1],
    stiffness: 0.1,
    damping: 0.05,
    length: segmentHeight,
    render: {
      visible: true,
      strokeStyle: "#fe3a65",
      lineWidth: 1,
    },
  });
  constraints.push(constraint);
  Matter.World.add(world, constraint);
}

// Create and start the runner
const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);
Matter.Render.run(render);

// Drag functionality
let isDragging = false;
const cordWrapper = document.querySelector(".cord-wrapper");
const plug = document.querySelector(".plug");
const ribbon = document.querySelector(".ribbon");

plug.addEventListener("mousedown", startDrag);
plug.addEventListener("touchstart", startDrag);
document.addEventListener("mousemove", drag);
document.addEventListener("touchmove", drag);
document.addEventListener("mouseup", endDrag);
document.addEventListener("touchend", endDrag);

function startDrag(e) {
  e.preventDefault(); // Prevent default touch behavior
  isDragging = true;
  plug.style.cursor = "grabbing";
}

function drag(e) {
  if (!isDragging) return;

  // Get client coordinates for both mouse and touch events
  const clientX = e.clientX || e.touches[0].clientX;
  const clientY = e.clientY || e.touches[0].clientY;

  const lastPoint = points[points.length - 1];
  Matter.Body.setPosition(lastPoint, {
    x: clientX,
    y: clientY,
  });

  // Update ribbon visuals
  updateRibbon();

  // Check if pulled far enough to open
  if (clientY > cardRect.top + 300 && !card.classList.contains("open")) {
    openCard();
  }
}

function updateRibbon() {
  const segments = points.length;

  for (let i = 0; i < segments - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    const dx = next.position.x - current.position.x;
    const dy = next.position.y - current.position.y;
    const angle = Math.atan2(dy, dx);

    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    gsap.set(ribbon, {
      height: segmentLength,
      rotation: angle * (180 / Math.PI),
      x: current.position.x - startX,
      y: current.position.y - startY,
    });

    // Update plug position and rotation
    if (i === segments - 2) {
      gsap.set(plug, {
        x: next.position.x - startX, // Center the plug
        y: next.position.y - startY - 20, // Offset to align with ribbon
        rotation: angle * (180 / Math.PI) - 90, // Fix rotation
        transformOrigin: "50% 0%",
      });
    }
  }
}

function endDrag() {
  isDragging = false;
  plug.style.cursor = "grab";
}

function openCard() {
  card.classList.add("open");

  // Shock effect (vibration)
  gsap.to(card, {
    y: "+=30",
    yoyo: true,
    repeat: 5,
    duration: 0.05,
    onComplete: () => {
      gsap.set(card, { x: 0 }); // Reset position after vibration
    },
  });

  // Confetti effect
  confetti({
    particleCount: 300,
    spread: 100,
    origin: { y: 0.6 },
  });

  // Morph plug
  gsap.to(".plug path", {
    duration: 0.5,
    attr: { d: "M30,0 L70,0 L85,30 L85,120 L15,120 L15,30 Z" },
    ease: "power2.inOut",
  });

  // Show content
  gsap.to(".card-content", {
    opacity: 1,
    duration: 0.5,
    delay: 0.3,
  });

  // Show valentine text and buttons
  gsap.to(".valentine-text, .buttons", {
    display: "block",
    opacity: 1,
    duration: 0.5,
    delay: 0.5,
  });

  // Hide ribbon and cord
  gsap.to([cordWrapper, ribbon], {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      cordWrapper.style.display = "none";
      ribbon.style.display = "none";
    },
  });

  const tl = new gsap.timeline();
  tl.to(".card", { rotateX: -10, duration: 0.2 })
    .to(".card", { rotateX: 0, duration: 0.1 })
    .to(".card", { rotateX: 10, duration: 0.14 })
    .to(".card", { rotateX: 0, duration: 0.05 })
    .repeat(2);

  gsap.to(".text-intro", {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      introText.style.display = "none";
    },
  });

  // Hide Matter.js points and constraints
  points.forEach((point) => {
    point.render.visible = false;
  });
  constraints.forEach((constraint) => {
    constraint.render.visible = false;
  });
}

// Add event listeners for buttons
const yesButton = document.querySelector(".buttons .yes");
const noButton = document.querySelector(".buttons .no");

yesButton.addEventListener("click", () => {
  const tl = new gsap.timeline();
  gsap.to(".valentine-text, .buttons", {
    display: "none",
    opacity: 0,
    duration: 0.5,
  });
  gsap.to(".valentine-congrats", {
    display: "block",
    opacity: 1,
    duration: 0.5,
    delay: 0.5,
  });
  tl.to(".card", {
    width: window.innerWidth < 420 ? window.innerWidth : 800,
    height: 540,
    duration: 1,
    ease: "power2.in",
  }).to(".congrats, .valentine-congrats", {
    width: "100%",
    height: "100%",
    duration: 1,
  });

  confetti({
    particleCount: 500,
    spread: 150,
    origin: { y: 0.6 },
  });
  setInterval(() => {
    confetti({
      particleCount: 500,
      spread: 150,
      origin: { y: 0.6 },
    });
  }, 5000);
});

noButton.addEventListener("click", () => {
  const tl = new gsap.timeline();
  gsap.to(".valentine-text, .buttons", {
    display: "none",
    opacity: 0,
    duration: 0.5,
  });
  gsap.to(".valentine-sad", {
    display: "block",
    opacity: 1,
    duration: 0.5,
    delay: 0.5,
  });
  tl.to(".card", {
    width: window.innerWidth < 420 ? window.innerWidth : 800,
    height: 540,
    duration: 1,
    ease: "power2.in",
  });
  tl.to(".valentine-sad", {
    width: "100%",
    height: "100%",
    duration: 0.3,
  });
  tl.to(".sad", {
    width: "90%",
    height: "100%",
    duration: 0.7,
  });

  // confetti({
  //     particleCount: 500,
  //     spread: 150,
  //     origin: { y: 0.6 },
  // });
  // setInterval(() => {
  //     confetti({
  //         particleCount: 500,
  //         spread: 150,
  //         origin: { y: 0.6 },
  //     });
  // }, 5000);
});

noButton.addEventListener("mouseover", () => {
  const minDisplacement = 100; // Minimum move distance
  const maxDisplacement = 500; // Maximum move distance

  const getRandomDisplacement = (min, max) => {
    let displacement = Math.random() * (max - min) + min;
    return Math.random() < 0.5 ? -displacement : displacement;
  };

  const buttonRect = noButton.getBoundingClientRect();
  const viewportWidth = window.innerWidth - buttonRect.width;
  const viewportHeight = window.innerHeight - buttonRect.height;

  let x = getRandomDisplacement(minDisplacement, maxDisplacement);
  let y = getRandomDisplacement(minDisplacement, maxDisplacement);

  // Ensure button stays within screen boundaries
  if (buttonRect.left + x < 0) x = Math.abs(x); // Prevent moving past left boundary
  if (buttonRect.right + x > viewportWidth) x = -Math.abs(x); // Prevent moving past right boundary
  if (buttonRect.top + y < 0) y = Math.abs(y); // Prevent moving past top boundary
  if (buttonRect.bottom + y > viewportHeight) y = -Math.abs(y); // Prevent moving past bottom boundary

  gsap.to(noButton, {
    x: `+=${x}`, // Move relative to current position
    y: `+=${y}`,
    duration: 0.1,
    delay: 0.2,
    ease: "power2.out",
  });
});

// Update ribbon on animation frame
function animate() {
  updateRibbon();
  requestAnimationFrame(animate);
}
animate();

// Initial card setup
gsap.set(".card", {
  rotateX: 0,
  transformPerspective: 1000,
});
function createCongratsFireworks() {
  const canvas = document.getElementById('congratsCanvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size
  function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let fireworks = [];
  let text = "❤️"; // Text để vẽ

  function createTextFirework(x, y, color) {
      const particles = [];
      const fontSize = 20;
      ctx.font = `${fontSize}px Arial`;
      
      // Tạo particles từ text
      for(let i = 0; i < 50; i++) {
          const angle = (Math.PI * 2 * i) / 50;
          const velocity = 3 + Math.random() * 3;
          particles.push({
              x,
              y,
              vx: Math.cos(angle) * velocity,
              vy: Math.sin(angle) * velocity,
              text: text,
              color,
              alpha: 1,
              size: fontSize
          });
      }
      return particles;
  }

  function animate() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      fireworks.forEach((particles, fireworkIndex) => {
          particles.forEach((particle, i) => {
              particle.x += particle.vx;
              particle.y += particle.vy;
              particle.vy += 0.1;
              particle.alpha -= 0.008;

              ctx.save();
              ctx.globalAlpha = particle.alpha;
              ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
              ctx.font = `${particle.size}px Arial`;
              ctx.fillText(particle.text, particle.x, particle.y);
              ctx.restore();

              if (particle.alpha <= 0) {
                  particles.splice(i, 1);
              }
          });

          if (particles.length === 0) {
              fireworks.splice(fireworkIndex, 1);
          }
      });

      requestAnimationFrame(animate);
  }

  const colors = [
      '255, 0, 0',     // Red
      '255, 192, 203', // Pink
      '255, 20, 147',  // Deep pink
      '255, 105, 180', // Hot pink
      '255, 182, 193', // Light pink
      '255, 127, 80'   // Coral
  ];

  function launchFireworks() {
      const x = Math.random() * canvas.width;
      const y = canvas.height / 2 + Math.random() * (canvas.height / 3);
      const color = colors[Math.floor(Math.random() * colors.length)];
      fireworks.push(createTextFirework(x, y, color));
  }

  // Start animation
  animate();

  // Launch fireworks continuously
  return setInterval(launchFireworks, 300);
}

// Sửa lại event listener của nút Yes
yesButton.addEventListener('click', () => {
  const tl = new gsap.timeline();
  gsap.to(".valentine-text, .buttons", {
      display: "none",
      opacity: 0,
      duration: 0.5,
  });
  gsap.to(".valentine-congrats", {
      display: "block",
      opacity: 1,
      duration: 0.5,
      delay: 0.5,
      onComplete: () => {
          const fireworksInterval = createCongratsFireworks();
          // Tự động dừng pháo hoa sau 15 giây
          setTimeout(() => {
              clearInterval(fireworksInterval);
          }, 15000);
      }
  });
  tl.to(".card", {
      width: window.innerWidth < 420 ? window.innerWidth : 800,
      height: 540,
      duration: 1,
      ease: "power2.in",
  });
});