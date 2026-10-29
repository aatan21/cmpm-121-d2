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

//create stroke type
type Stroke = {
  points: Point[];
  width: number;
};

//list containing all of the past completed strokes
const strokes: Stroke[] = [];

//define the stroke activly being drawn
let active_stroke: Stroke | null = null;

//helper function to get a points x and y cordinates
function get_point(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * canvas_width / rect.width,
    y: (event.clientY - rect.top) * canvas_height / rect.height,
  };
}

//Draws a stroke from within the stroke list
function draw_stroke(stroke: Stroke): void {
  context.beginPath();
  context.lineWidth = stroke.width;
  context.lineCap = "round";
  context.lineJoin = "round";

  const first_point = stroke.points[0];

  if (!first_point) {
    return;
  }

  context.moveTo(first_point.x, first_point.y);

  for (const point of stroke.points.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  if (stroke.points.length == 1) {
    context.lineTo(first_point.x, first_point.y);
  }
  context.stroke();
}

//draws all strokes within the stroke list and any active strokes
function redraw(): void {
  context.clearRect(0, 0, canvas_width, canvas_height);

  for (const stroke of strokes) {
    draw_stroke(stroke);
  }

  if (active_stroke) {
    draw_stroke(active_stroke);
  }
}

canvas.addEventListener("pointerdown", (event) => {
  if (active_stroke) {
    return;
  }

  event.preventDefault();

  active_stroke = {
    points: [get_point(event)],
    width: line_width,
  };

  canvas.setPointerCapture(event.pointerId);
  redraw();
});

canvas.addEventListener("pointermove", (event) => {
  if (!active_stroke) {
    return;
  }

  active_stroke.points.push(get_point(event));
  redraw();
});

canvas.addEventListener("pointerup", () => {
  if (!active_stroke) {
    return;
  }

  strokes.push(active_stroke);
  active_stroke = null;
  redraw();
});
