# D2 Visual Drawing App

A simple drawing application built using TypeScript and Canvas 2D. Users can draw with different marker sizes, place stickers, create their own sticker tools, and export their drawings as PNG images.

**[Open Visual Drawing App](https://aatan21.github.io/cmpm-121-d2/)**

## How to Use

### Drawing

- Select one of the Thin, Medium, or Thick Marker tools above the canvas.
- Click and drag inside the canvas to draw a stroke.
- Release the mouse to finish the stroke.

### Stickers and Custom Tools

- Select one of the premade stickers above the canvas, then click on the canvas to place it.
- To create your own sticker tool, enter a name in the Tool name box and an emoji or short text in the Emoji/Text box.
- Click Create Tool. The new tool will appear alongside the premade tools.
- Select your created tool to place its sticker on the canvas. You can create multiple custom tools.

### Undo, Redo, and Clear

- **Undo:** Removes the most recently completed stroke or sticker placement. Multiple actions can be undone.
- **Redo:** Restores the most recently undone action. Drawing something new after undoing will clear the redo history.
- **Clear:** Removes all drawings and resets undo/redo history. This action cannot be undone, but custom tools remain available.

### Export PNG

- Click Export PNG below the canvas to download your drawing as `drawing.png`.
- The exported image has a resolution of 1600 × 1200 pixels, twice the interactive canvas's resolution in each direction.
- Only completed drawing commands are included. Undone actions and unfinished strokes are excluded.
- The exported image has a white background.

Drawings and custom tools are stored only during the current session. Refreshing the page will reset them.

## Running the Project Locally

### Requirements

- [Git](https://git-scm.com/downloads)
- [Deno 2.9.7](https://docs.deno.com/runtime/getting_started/installation/)
- A modern web browser

### Setup and Running

1. Clone the repository using `git clone https://github.com/aatan21/cmpm-121-d2.git`.
2. Navigate into the project folder using `cd cmpm-121-d2`.
3. Run `deno task setup` to install the project's Git pre-commit hooks. This only needs to be done once per clone.
4. Run `deno task dev` to start the Vite development server.
5. Open the local URL printed in the terminal to use the application.

### Build and Preview

- Run `deno task ci` to check formatting, linting, TypeScript, and build the project into the `dist/` folder.
- Run `deno task preview` to serve the latest production build locally.
- Run `deno task fmt` if formatting corrections are needed.

The project uses Deno, TypeScript, and Vite. An internet connection is needed for the initial repository download, installation of Deno, and downloading uncached dependencies. After the dependencies are cached, the local development server and build can run without internet access. The drawing application itself does not make runtime network requests or require external image assets. The hosted version requires an internet connection to load initially.

## Developer Documentation

### How the Application Works

Most of the application's implementation is located in [src/main.ts](https://github.com/aatan21/cmpm-121-d2/blob/main/src/main.ts).

The application separates completed drawing commands from temporary interaction state. `document_commands` stores completed strokes and stickers, while `active_stroke` represents a stroke currently being drawn.

Each drawing command records its geometry and appearance, allowing the artwork to be reconstructed instead of relying on existing canvas pixels.

The `draw_command()` function interprets individual commands using a supplied Canvas 2D context. `render_commands()` replays the stored commands, while `redraw()` updates the interactive canvas and includes the active stroke preview.

For exporting, `export_png()` creates a separate higher-resolution canvas and uses `render_commands()` to replay the saved commands. This means interactive drawing and PNG export use the same rendering logic.

### Adding a New Tool Kind: Rectangle Tool

As an example, a future developer could add a rectangle tool that lets users click and drag to create rectangles. This would require changes to the following parts of [src/main.ts](https://github.com/aatan21/cmpm-121-d2/blob/main/src/main.ts).

**1. Tool Definition and Registration**

In the [tool definitions and tools array](https://github.com/aatan21/cmpm-121-d2/blob/main/src/main.ts#L28-L99), create a new `Rectangle_tool` type containing properties such as its name, border color, and line width. Add it to the existing `tool` union and register a rectangle tool definition in the `tools` array.

The existing `add_tool_button()` and `update_tools()` functions would handle its palette button and selection automatically because they already use the shared tool definitions. The current `create_tool()` form only creates sticker tools and would not need changing to add a built-in rectangle tool.

**2. Input and Gesture Handling**

In the [pointer event handlers](https://github.com/aatan21/cmpm-121-d2/blob/main/src/main.ts#L398-L470), add a branch for the rectangle tool.

On `pointerdown`, record the rectangle's starting position. During `pointermove`, update its width and height based on the current pointer position. On `pointerup`, finish the rectangle and commit it to the document.

A temporary `active_rectangle` state could be used to display the rectangle while dragging. Like `active_stroke`, it should be discarded on `pointercancel` or unexpected loss of pointer capture without changing history.

**3. Recorded Drawing Command**

In the [drawing command types](https://github.com/aatan21/cmpm-121-d2/blob/main/src/main.ts#L28-L44), create a `Rectangle` type with properties such as `type: "rectangle"`, `x`, `y`, `width`, `height`, `color`, and `lineWidth`.

Add `Rectangle` to the existing `draw_command` union. Each completed rectangle would then store its own position, dimensions, and appearance rather than depending on the currently selected tool.

**4. Rendering**

In [draw_command()](https://github.com/aatan21/cmpm-121-d2/blob/main/src/main.ts#L195-L232), add another branch for rectangle commands. It could use `ctx.strokeRect()` to draw the rectangle using its recorded properties.

Update `redraw()` to display the temporary rectangle preview while dragging, separately from the committed document. The existing `ctx.save()` and `ctx.restore()` calls would continue isolating each command's drawing settings.

**5. Undo/Redo and Export**

The existing [history functions](https://github.com/aatan21/cmpm-121-d2/blob/main/src/main.ts#L322-L367) would not need to change. Once the finished rectangle is passed to `commit_command()`, it becomes part of `document_commands` like strokes and stickers.

Similarly, [render_commands() and export_png()](https://github.com/aatan21/cmpm-121-d2/blob/main/src/main.ts#L233-L307) would continue working without modifications. Since they replay the same recorded command list, rectangle commands would automatically be included in the exported PNG once `draw_command()` supports them.

### Design Revision

Originally, marker and sticker event handlers separately added commands to the document, cleared redo history, and updated the display. This duplicated logic across different tool types.

We refactored the implementation to use shared functions such as `commit_command()`, `undo_command()`, `redo_command()`, and `clear_commands()`.

This improves separation of responsibilities by keeping document-history operations out of individual tool input handlers. Adding a new drawing tool is easier because it can use `commit_command()` without duplicating history logic.

## Credits

Tooling adapted from the [CMPM 121 Fall 2026 D1 starter](https://github.com/ucsc-cmpm-121-f26/d1-starter/tree/d949e744b0f9fb7c133a5316f86f2b7fe54529ad), derived from the [S01 starter](https://github.com/ucsc-cmpm-121-f26/s01-starter/tree/8974888efb6537be82e8eb069db139ea885039da). Those repositories have no explicit repository license; no new license is assigned to that material. The D2 scaffold was authored with OpenCode/OpenAI GPT-6.1 Sol assistance. Dependencies retain their respective licenses.
