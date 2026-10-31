const app = document.querySelector<HTMLElement>("#app")!;

const heading = document.createElement("h1");
heading.textContent = "D2 project";
app.append(heading);

//define global variables
const canvas_width = 800;
const canvas_height = 600;

//create and append canvas
const canvas = document.createElement("canvas");
canvas.width = canvas_width;
canvas.height = canvas_height;
canvas.style.border = "2px solid black";
canvas.style.backgroundColor = "white";
canvas.style.display = "block";
canvas.style.touchAction = "none";
canvas.style.width = "min(100%, 700px)";
canvas.style.height = "auto";
app.appendChild(canvas);

const context = canvas.getContext("2d")!;

//create point type
type Point = {
  x: number;
  y: number;
};

//create stroke type
type Stroke = {
  type: "stroke";
  points: Point[];
  width: number;
};

//create sticker type
type Sticker = {
  type: "sticker";
  x: number;
  y: number;
  symbol: string;
  size: number;
};

type draw_command = Stroke | Sticker;

//create marker type
type Marker = {
  type: "marker";
  name: string;
  width: number;
};

//create type to hold differnt stickers
type Sticker_tool = {
  type: "sticker";
  name: string;
  symbol: string;
  size: number;
};

//create tool defintion
type tool = Marker | Sticker_tool;

//create different markers and stickers
const tools: tool[] = [
  {
    type: "marker",
    name: "Thin Marker",
    width: 2,
  },
  {
    type: "marker",
    name: "Medium Marker",
    width: 4,
  },
  {
    type: "marker",
    name: "Thick Marker",
    width: 10,
  },
  {
    type: "sticker",
    name: "heart",
    symbol: "❤️",
    size: 30,
  },
  {
    type: "sticker",
    name: "smile",
    symbol: "😀",
    size: 30,
  },
  {
    type: "sticker",
    name: "star",
    symbol: "🌟",
    size: 30,
  },
];

//create tracker for the current selected marker, starting by default with the first marker
let selected_tool: tool = tools[0]!;

//create tool select
const tool_select = document.createElement("div");
tool_select.style.display = "flex";
tool_select.style.display = "8px";
tool_select.style.marginBottom = "10px";
app.insertBefore(tool_select, canvas);

//create tool button
function add_tool_button(tool: tool): void {
  const button = document.createElement("button");

  button.textContent = tool.name;

  button.addEventListener("click", () => {
    selected_tool = tool;
    update_tools();
  });

  tool_select.appendChild(button);
}

//add pre-fab tool buttons
for (const tool of tools) {
  add_tool_button(tool);
}

//highlight button selected
function update_tools(): void {
  const buttons = tool_select.querySelectorAll("button");

  buttons.forEach((button, index) => {
    button.style.backgroundColor = tools[index] === selected_tool
      ? "#bde0fe"
      : "white";
  });
}

//create UI for custom made user tools
const tool_name_input = document.createElement("input");
tool_name_input.placeholder = "Tool name";

const tool_symbol_input = document.createElement("input");
tool_symbol_input.placeholder = "Emoji/Text";

const create_tool_button = document.createElement("button");
create_tool_button.textContent = "Create Tool";

app.insertBefore(tool_name_input, canvas);
app.insertBefore(tool_symbol_input, canvas);
app.insertBefore(create_tool_button, canvas);

function create_tool(): void {
  const name = tool_name_input.value.trim();
  const symbol = tool_symbol_input.value.trim();

  if (name === "" || symbol == "") {
    return;
  }

  const new_tool: Sticker_tool = {
    type: "sticker",
    name: name,
    symbol: symbol,
    size: 30,
  };

  tools.push(new_tool);

  tool_name_input.value = "";
  tool_symbol_input.value = "";

  add_tool_button(new_tool);
}

create_tool_button.addEventListener("click", create_tool);

//list containing all of the past completed strokes
const document_commands: draw_command[] = [];
// list containing undone strokes
const undo_commands: draw_command[] = [];

//define the stroke activly being drawn
let active_stroke: Stroke | null = null;

// track the pointer responsible for the active stroke
let active_pointer_id: number | null = null;

//helper function to get a points x and y cordinates
function get_point(event: PointerEvent): Point {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left - canvas.clientLeft) *
      canvas_width / canvas.clientWidth,
    y: (event.clientY - rect.top - canvas.clientTop) *
      canvas_height / canvas.clientHeight,
  };
}

// Draw a command onto a supplied canvas context
function draw_command(
  ctx: CanvasRenderingContext2D,
  command: draw_command,
): void {
  // Save the context's current drawing settings
  ctx.save();

  if (command.type == "stroke") {
    const first_point = command.points[0];

    if (first_point) {
      ctx.beginPath();
      ctx.strokeStyle = "black";
      ctx.lineWidth = command.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(first_point.x, first_point.y);

      for (const point of command.points.slice(1)) {
        ctx.lineTo(point.x, point.y);
      }

      if (command.points.length == 1) {
        ctx.lineTo(first_point.x, first_point.y);
      }

      ctx.stroke();
    }
  } else if (command.type == "sticker") {
    ctx.font = `${command.size}px serif`;
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(command.symbol, command.x, command.y);
  }

  ctx.restore();
}

// Render a list of saved drawing commands onto any canvas context
function render_commands(
  ctx: CanvasRenderingContext2D,
  commands: readonly draw_command[],
): void {
  for (const command of commands) {
    draw_command(ctx, command);
  }
}

// Redraw the interactive canvas
function redraw(): void {
  context.clearRect(0, 0, canvas_width, canvas_height);

  render_commands(context, document_commands);

  // Draw the temporary stroke separately
  if (active_stroke) {
    draw_command(context, active_stroke);
  }
}

// Create PNG export button
const export_button = document.createElement("button");
export_button.textContent = "Export PNG";
app.appendChild(export_button);

// Export the current document at twice the canvas resolution
function export_png(): void {
  const scale = 2;

  // Create a separate offscreen canvas
  const export_canvas = document.createElement("canvas");
  export_canvas.width = canvas_width * scale;
  export_canvas.height = canvas_height * scale;

  const export_context = export_canvas.getContext("2d");

  if (!export_context) {
    return;
  }

  export_context.fillStyle = "white";
  export_context.fillRect(
    0,
    0,
    export_canvas.width,
    export_canvas.height,
  );

  export_context.save();
  export_context.scale(scale, scale);

  render_commands(export_context, document_commands);

  export_context.restore();

  export_canvas.toBlob((blob) => {
    if (!blob) {
      console.error("PNG export failed");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "drawing.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

// Download the PNG when the button is clicked
export_button.addEventListener("click", export_png);

// create undo/redo buttons
const undo_button = document.createElement("button");
undo_button.textContent = "Undo";
app.appendChild(undo_button);

const redo_button = document.createElement("button");
redo_button.textContent = "Redo";
app.appendChild(redo_button);

// create clear button
const clear_button = document.createElement("button");
clear_button.textContent = "Clear";
app.appendChild(clear_button);

// disable buttons when no actions are available
function update_history_buttons(): void {
  undo_button.disabled = document_commands.length === 0;
  redo_button.disabled = undo_commands.length === 0;
}

// Refresh the drawing and history buttons
function refresh_display(): void {
  redraw();
  update_history_buttons();
}

// Add a completed drawing command to the document
function commit_command(command: draw_command): void {
  document_commands.push(command);

  undo_commands.length = 0;

  refresh_display();
}

// Undo the most recent drawing command
function undo_command(): void {
  const last_command = document_commands.pop();

  if (last_command) {
    undo_commands.push(last_command);
    refresh_display();
  }
}

// Redo the most recently undone command
function redo_command(): void {
  const last_command = undo_commands.pop();

  if (last_command) {
    document_commands.push(last_command);
    refresh_display();
  }
}

// Clear all committed drawing commands and history
function clear_commands(): void {
  document_commands.length = 0;
  undo_commands.length = 0;

  refresh_display();
}

// undo the most recent completed stroke
undo_button.addEventListener("click", () => {
  undo_command();
});

// redo the most recent undone stroke
redo_button.addEventListener("click", () => {
  redo_command();
});

// clear all drawing commands and reset history
clear_button.addEventListener("click", () => {
  if (
    document_commands.length === 0 &&
    undo_commands.length === 0 &&
    !active_stroke
  ) {
    return;
  }

  const pointer_id = active_pointer_id;
  active_stroke = null;
  active_pointer_id = null;

  if (pointer_id !== null && canvas.hasPointerCapture(pointer_id)) {
    canvas.releasePointerCapture(pointer_id);
  }

  clear_commands();
});

canvas.addEventListener("pointerdown", (event) => {
  if (active_stroke) {
    return;
  }

  event.preventDefault();

  const point = get_point(event);

  if (selected_tool.type == "sticker") {
    const sticker: Sticker = {
      type: "sticker",
      x: point.x,
      y: point.y,
      symbol: selected_tool.symbol,
      size: selected_tool.size,
    };

    commit_command(sticker);
    return;
  }

  active_stroke = {
    type: "stroke",
    points: [point],
    width: selected_tool.width,
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

  const completed_stroke = active_stroke;

  active_stroke = null;
  active_pointer_id = null;

  commit_command(completed_stroke);
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

// Discard unfinished strokes if pointer capture is unexpectedly lost
canvas.addEventListener("lostpointercapture", (event) => {
  if (event.pointerId !== active_pointer_id) {
    return;
  }

  active_stroke = null;
  active_pointer_id = null;
  redraw();
});

update_history_buttons();
