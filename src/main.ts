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
tool_name_input.ariaPlaceholder = "Tool name";

const tool_symbol_input = document.createElement("input");
tool_symbol_input.ariaPlaceholder = "Emoji/Text";

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
    x: (event.clientX - rect.left) * canvas_width / rect.width,
    y: (event.clientY - rect.top) * canvas_height / rect.height,
  };
}

//Draws a stroke from within the stroke list
function draw_command(command: draw_command): void {
  if (command.type == "stroke") {
    context.beginPath();
    context.lineWidth = command.width;
    context.lineCap = "round";
    context.lineJoin = "round";

    const first_point = command.points[0];

    if (!first_point) {
      return;
    }

    context.moveTo(first_point.x, first_point.y);

    for (const point of command.points.slice(1)) {
      context.lineTo(point.x, point.y);
    }

    if (command.points.length == 1) {
      context.lineTo(first_point.x, first_point.y);
    }
    context.stroke();
  } else if (command.type == "sticker") {
    context.font = `${command.size}px serif`;
    context.textAlign = "center",
      context.textBaseline = "middle",
      context.fillText(command.symbol, command.x, command.y);
  }
}

//draws all strokes within the stroke list and any active strokes
function redraw(): void {
  context.clearRect(0, 0, canvas_width, canvas_height);

  for (const command of document_commands) {
    draw_command(command);
  }

  if (active_stroke) {
    draw_command(active_stroke);
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
  undo_button.disabled = document_commands.length === 0;
  redo_button.disabled = undo_commands.length === 0;
}

// undo the most recent completed stroke
undo_button.addEventListener("click", () => {
  const last_command = document_commands.pop();

  if (last_command) {
    undo_commands.push(last_command);
    redraw();
    update_history_buttons();
  }
});

// redo the most recent undone stroke
redo_button.addEventListener("click", () => {
  const last_command = undo_commands.pop();

  if (last_command) {
    document_commands.push(last_command);
    redraw();
    update_history_buttons();
  }
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

    document_commands.push(sticker);
    undo_commands.length = 0;

    redraw();
    update_history_buttons();
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

  document_commands.push(active_stroke);
  active_stroke = null;
  active_pointer_id = null;

  // new committed drawing clears redo history
  undo_commands.length = 0;

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

update_history_buttons();
