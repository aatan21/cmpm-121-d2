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

// list containing undone strokes
const undone_strokes: Stroke[] = [];

//define the stroke activly being drawn
let active_stroke: Stroke | null = null;

// track the pointer responsible for the active stroke
let active_pointer_id: number | null = null;

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

// create undo/redo buttons
const undo_button = document.createElement("button");
undo_button.textContent = "Undo";
app.appendChild(undo_button);

const redo_button = document.createElement("button");
redo_button.textContent = "Redo";
app.appendChild(redo_button);

// disable buttons when no actions are available
function update_history_buttons(): void {
  undo_button.disabled = strokes.length === 0;
  redo_button.disabled = undone_strokes.length === 0;
}

// undo the most recent completed stroke
undo_button.addEventListener("click", () => {
  const last_stroke = strokes.pop();

  if (last_stroke) {
    undone_strokes.push(last_stroke);
    redraw();
    update_history_buttons();
  }
});

// redo the most recent undone stroke
redo_button.addEventListener("click", () => {
  const last_undone = undone_strokes.pop();

  if (last_undone) {
    strokes.push(last_undone);
    redraw();
    update_history_buttons();
  }
});

canvas.addEventListener("pointerdown", (event) => {
  if (active_stroke) {
    return;
  }

  event.preventDefault();

  active_stroke = {
    points: [get_point(event)],
    width: line_width,
  };

  active_pointer_id = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  redraw();
});

canvas.addEventListener("pointermove", (event) => {
  if (!active_stroke || event.pointerId !== active_pointer_id) {
    return;
  }

  active_stroke.points.push(get_point(event));
  redraw();
});

canvas.addEventListener("pointerup", (event) => {
  if (!active_stroke || event.pointerId !== active_pointer_id) {
    return;
  }

  strokes.push(active_stroke);
  active_stroke = null;
  active_pointer_id = null;

  // new committed drawing clears redo history
  undone_strokes.length = 0;

  redraw();
  update_history_buttons();
});

// discard cancelled strokes without changing history
canvas.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== active_pointer_id) {
    return;
  }

  active_stroke = null;
  active_pointer_id = null;
  redraw();
});

// handle unexpected loss of pointer capture
canvas.addEventListener("lostpointercapture", (event) => {
  if (event.pointerId !== active_pointer_id) {
    return;
  }

  active_stroke = null;
  active_pointer_id = null;
  redraw();
});

update_history_buttons();
