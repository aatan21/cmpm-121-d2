const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 project";
app.append(heading);

//define global variables
const canvas_width = 800;
const canvas_height = 600;
const line_width = 3;

//create and append canvas
const canvas = document.createElement("canvas");
canvas.width = canvas_width;
canvas.height = canvas_height;
canvas.style.border = "2px solid black";
canvas.style.backgroundColor = "white";
canvas.style.display = "block";
app.appendChild(canvas);

const context = canvas.getContext("2d")!;

//create point type
type Point = {
  x: number;
  y: number;
};

let is_drawing = false;
let current_stroke: Point[] = [];

canvas.addEventListener("pointerdown", (event) => {
  is_drawing = true;

  const rect = canvas.getBoundingClientRect();

  const point = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  current_stroke = [point];

  context.beginPath();
  context.moveTo(point.x, point.y);

  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!is_drawing) return;

  const rect = canvas.getBoundingClientRect();

  const point = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  current_stroke.push(point);

  context.lineWidth = line_width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineTo(point.x, point.y);
  context.stroke();
});

canvas.addEventListener("pointerup", () => {
  is_drawing = false;
});
