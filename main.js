import { Ludo } from './ludo/Ludo.js';

const ludo = new Ludo();

const diceFace = document.querySelector(".dice-face");
const diceValueBox = document.querySelector(".dice-value");

// faces visuais do dado
const faces = {
  1: ["center"],
  2: ["top-left", "bottom-right"],
  3: ["top-left", "center", "bottom-right"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]
};

// OBSERVA quando o Ludo muda o valor do dado
const observer = new MutationObserver(() => {
  const roll = Number(diceValueBox.textContent);
  if (!roll) return;

  // limpa a face antiga
  diceFace.innerHTML = "";

  // desenha a nova face
  faces[roll].forEach(pos => {
    const pip = document.createElement("span");
    pip.classList.add("pip", pos);
    diceFace.appendChild(pip);
  });
});

observer.observe(diceValueBox, { childList: true });
