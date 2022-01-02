export function XAxis() {
  const { element } = createDOM();

  return { element };
}

function createDOM() {
  const container = document.createElement("div");

  const shiftingContainer = document.createElement("div");
  shiftingContainer.style.position = "relative";
  shiftingContainer.style.display = "flex";

  container.appendChild(shiftingContainer);

  for (let i = 0; i < 10; i++) {
    const label = createLabel(i);
    shiftingContainer.appendChild(label);
  }

  return { element: container };
}

function createLabel(index: number) {
  const element = document.createElement("div");
  element.innerText = `${index}`;
  element.style.color = "rgba(128, 130, 129, 0.67)";
  element.style.position = "absolute";
  element.style.left = `${index * 100}px`;
  element.style.transform = "translateY(-100%)";

  return element;
}
