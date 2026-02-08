import { Ludo } from './ludo/Ludo.js';

const ludo = new Ludo();

const diceBtn = document.getElementById("dice-btn");
const diceFace = document.querySelector(".dice-face");

// posições dos pontinhos para cada número do dado
const faces = {
  1: ["center"],
  2: ["top-left", "bottom-right"],
  3: ["top-left", "center", "bottom-right"],
  4: ["top-left", "top-right", "bottom-left", "bottom-right"],
  5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
  6: ["top-left", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-right"]
};

diceBtn.addEventListener("click", () => {
  const roll = Math.floor(Math.random() * 6) + 1;

  // limpa face anterior
  diceFace.innerHTML = "";

  // cria os pontinhos certos
  faces[roll].forEach(pos => {
    const pip = document.createElement("span");
    pip.classList.add("pip", pos);
    diceFace.appendChild(pip);
  });

  // mostra número também (opcional)
  document.querySelector(".dice-value").textContent = roll;
});
