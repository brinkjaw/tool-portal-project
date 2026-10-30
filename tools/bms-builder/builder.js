// BMS Interface Builder: place push buttons and toggle switches on a grid,
// try them in Use mode, and keep the layout in this browser.
(function () {
  var COLS = 6;
  var ROWS = 8;
  var STORAGE_KEY = "bms-builder-layout";
  var DRAG_THRESHOLD = 5; // pixels the mouse must move before a drag starts
  var TYPE_NAMES = { button: "push button", "switch": "toggle switch" };
  var DEFAULT_LABELS = { button: "Button", "switch": "Switch" };

  // ---- Data ----
  // items: [{ id, type: "button" | "switch", label, col, row, on }]
  var items = [];
  var nextNumber = 1;

  // ---- What the student is doing right now ----
  var mode = "edit";      // "edit" or "use"
  var pending = null;     // null, { kind: "add", type } or { kind: "move", id }
  var selectedId = null;
  var message = "";       // one-off hint text, e.g. after a refused drop

  // ---- Saving ----
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        nextNumber: nextNumber,
        items: items
      }));
    } catch (e) {
      // storage blocked: the tool still works, it just won't be remembered
    }
  }

  function load() {
    var data;
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch (e) {
      return;
    }
    if (!data || data.version !== 1 || !Array.isArray(data.items)) return;

    var taken = {};
    data.items.forEach(function (item) {
      if (!item || typeof item.id !== "string" || !TYPE_NAMES[item.type]) return;
      if (!isCell(item.col, item.row) || taken[item.col + "," + item.row]) return;
      taken[item.col + "," + item.row] = true;
      items.push({
        id: item.id,
        type: item.type,
        label: typeof item.label === "string" ? item.label.slice(0, 30) : "",
        col: item.col,
        row: item.row,
        on: item.on === true
      });
    });

    var highest = items.reduce(function (max, item) {
      var n = parseInt(item.id.replace(/\D/g, ""), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    nextNumber = Math.max(highest + 1, Number(data.nextNumber) || 1);
  }

  // ---- Data helpers ----
  function isCell(col, row) {
    return Number.isInteger(col) && Number.isInteger(row) &&
      col >= 1 && col <= COLS && row >= 1 && row <= ROWS;
  }

  function itemAt(col, row) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].col === col && items[i].row === row) return items[i];
    }
    return null;
  }

  function findItem(id) {
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) return items[i];
    }
    return null;
  }

  function displayLabel(item) {
    return item.label.trim() || "(no label)";
  }

  function addItem(type, col, row) {
    var item = {
      id: "c" + nextNumber,
      type: type,
      label: DEFAULT_LABELS[type] + " " + nextNumber,
      col: col,
      row: row,
      on: false
    };
    nextNumber++;
    items.push(item);
    save();
    return item;
  }

  function moveItem(item, col, row) {
    item.col = col;
    item.row = row;
    save();
  }

  function deleteItem(id) {
    items = items.filter(function (item) { return item.id !== id; });
    save();
  }

  // ---- Page elements ----
  var grid = document.getElementById("grid");
  var hint = document.getElementById("hint");
  var palette = document.getElementById("palette");
  var paletteButtons = palette.querySelectorAll(".palette-item");
  var panel = document.getElementById("selected-panel");
  var labelInput = document.getElementById("label-input");
  var moveButton = document.getElementById("move");
  var deleteButton = document.getElementById("delete");
  var editButton = document.getElementById("mode-edit");
  var useButton = document.getElementById("mode-use");
  var clearButton = document.getElementById("clear");

  // ---- Drawing ----
  function render() {
    renderGrid();
    renderControls();
    renderHint();
  }

  function renderGrid() {
    // Remember which grid element had keyboard focus, so it keeps it
    var focusKey = grid.contains(document.activeElement)
      ? document.activeElement.getAttribute("data-key")
      : null;

    grid.textContent = "";
    for (var row = 1; row <= ROWS; row++) {
      for (var col = 1; col <= COLS; col++) {
        var cell = document.createElement("div");
        cell.className = "cell";
        var item = itemAt(col, row);
        cell.appendChild(item ? createControl(item) : createEmptyCell(col, row));
        grid.appendChild(cell);
      }
    }

    if (focusKey) {
      var again = grid.querySelector('[data-key="' + focusKey + '"]');
      if (again) again.focus();
    }
  }

  function createEmptyCell(col, row) {
    var empty;
    if (mode === "edit") {
      empty = document.createElement("button");
      empty.type = "button";
      empty.setAttribute("aria-label", "Empty cell, row " + row + ", column " + col);
      empty.setAttribute("data-key", "cell-" + col + "-" + row);
    } else {
      empty = document.createElement("div");
    }
    empty.className = "cell-empty";
    empty.setAttribute("data-col", col);
    empty.setAttribute("data-row", row);
    return empty;
  }

  function createControl(item) {
    var control = document.createElement("button");
    control.type = "button";
    control.className = "control control-" + item.type;
    control.setAttribute("data-id", item.id);
    control.setAttribute("data-key", item.id);

    var label = document.createElement("span");
    label.className = "control-label";
    label.textContent = displayLabel(item);
    control.appendChild(label);

    if (item.type === "switch") {
      var state = document.createElement("span");
      state.className = "control-state";
      state.textContent = item.on ? "ON" : "OFF";
      state.setAttribute("aria-hidden", "true");
      control.appendChild(state);
    }

    if (mode === "use") {
      if (item.type === "switch") {
        control.setAttribute("role", "switch");
        control.setAttribute("aria-checked", String(item.on));
      }
    } else {
      var name = TYPE_NAMES[item.type] + ": " + displayLabel(item) +
        (item.type === "switch" ? (item.on ? ", on" : ", off") : "");
      if (item.id === selectedId) {
        control.classList.add("is-selected");
        name += ", selected";
      }
      if (pending && pending.kind === "move" && pending.id === item.id) {
        control.classList.add("is-moving");
      }
      control.setAttribute("aria-label", name);
      // Show the switch state in edit mode too, without making it clickable
      if (item.type === "switch") control.setAttribute("data-on", String(item.on));
    }
    return control;
  }

  function renderControls() {
    var editing = mode === "edit";
    editButton.setAttribute("aria-pressed", String(editing));
    useButton.setAttribute("aria-pressed", String(!editing));
    clearButton.disabled = items.length === 0;
    palette.hidden = !editing;

    paletteButtons.forEach(function (button) {
      var active = !!pending && pending.kind === "add" &&
        pending.type === button.getAttribute("data-type");
      button.setAttribute("aria-pressed", String(active));
    });

    var selected = editing ? findItem(selectedId) : null;
    panel.hidden = !selected;
    if (selected) {
      // Only overwrite the text box when it shows a different control,
      // so typing isn't interrupted
      if (labelInput.getAttribute("data-for") !== selected.id) {
        labelInput.value = selected.label;
        labelInput.setAttribute("data-for", selected.id);
      }
      moveButton.setAttribute("aria-pressed",
        String(!!pending && pending.kind === "move"));
    } else {
      labelInput.removeAttribute("data-for");
    }
  }

  function renderHint() {
    var text;
    if (message) {
      text = message;
    } else if (mode === "use") {
      text = "Use mode: press the buttons and flip the switches. " +
        "Choose Edit to change the layout.";
    } else if (pending && pending.kind === "add") {
      text = "Tap an empty cell to place the " + TYPE_NAMES[pending.type] +
        ". Press Esc to cancel.";
    } else if (pending && pending.kind === "move") {
      text = "Tap an empty cell to move “" + displayLabel(findItem(pending.id)) +
        "”. Press Esc to cancel.";
    } else if (selectedId) {
      text = "Use “Selected control” to rename, move or delete it. " +
        "Tap it again to deselect.";
    } else {
      text = "Choose a control under “Add a control”, then tap an empty cell. " +
        "On a computer you can also drag it onto the grid.";
    }
    hint.textContent = text;
    message = "";
  }

  // ---- Actions ----
  function setMode(next) {
    mode = next;
    pending = null;
    selectedId = null;
    render();
  }

  function chooseEmptyCell(col, row) {
    if (pending && pending.kind === "add") {
      selectedId = addItem(pending.type, col, row).id;
      pending = null;
    } else if (pending && pending.kind === "move") {
      moveItem(findItem(pending.id), col, row);
      pending = null;
    } else if (selectedId) {
      selectedId = null;
    } else {
      message = "Choose a control under “Add a control” first.";
    }
    render();
  }

  function chooseControlInEditMode(id) {
    if (pending && pending.kind === "move") {
      if (pending.id === id) {
        pending = null;
      } else {
        message = "That cell is taken. Choose an empty cell.";
      }
    } else {
      pending = null;
      selectedId = selectedId === id ? null : id;
    }
    render();
  }

  function useControl(control, id) {
    var item = findItem(id);
    if (item.type === "switch") {
      item.on = !item.on;
      save();
      message = "“" + displayLabel(item) + "” is " + (item.on ? "on" : "off") + ".";
      render();
    } else {
      // Push button: flash briefly, no lasting state
      control.classList.add("is-pressed");
      setTimeout(function () { control.classList.remove("is-pressed"); }, 300);
      hint.textContent = "“" + displayLabel(item) + "” pressed.";
    }
  }

  // Drop at the end of a mouse drag: source is { kind: "add", type } or { kind: "move", id }
  function dropOn(source, col, row) {
    if (!isCell(col, row)) return;
    if (itemAt(col, row)) {
      message = "That cell is taken. Choose an empty cell.";
      render();
      return;
    }
    pending = source;
    if (source.kind === "move") selectedId = source.id;
    chooseEmptyCell(col, row);
  }

  // ---- Clicks and taps ----
  palette.addEventListener("click", function (event) {
    var button = event.target.closest(".palette-item");
    if (!button || suppressClick) return;
    var type = button.getAttribute("data-type");
    var same = pending && pending.kind === "add" && pending.type === type;
    pending = same ? null : { kind: "add", type: type };
    selectedId = null;
    render();
  });

  grid.addEventListener("click", function (event) {
    if (suppressClick) return;
    var control = event.target.closest(".control");
    if (control) {
      var id = control.getAttribute("data-id");
      if (mode === "use") useControl(control, id);
      else chooseControlInEditMode(id);
      return;
    }
    var empty = event.target.closest("button.cell-empty");
    if (empty) {
      chooseEmptyCell(Number(empty.getAttribute("data-col")),
        Number(empty.getAttribute("data-row")));
    }
  });

  labelInput.addEventListener("input", function () {
    var item = findItem(selectedId);
    if (!item) return;
    item.label = labelInput.value;
    save();
    renderGrid();
  });

  moveButton.addEventListener("click", function () {
    var moving = pending && pending.kind === "move";
    pending = moving ? null : { kind: "move", id: selectedId };
    render();
  });

  deleteButton.addEventListener("click", function () {
    var item = findItem(selectedId);
    if (!item) return;
    message = "Deleted “" + displayLabel(item) + "”.";
    deleteItem(item.id);
    selectedId = null;
    pending = null;
    render();
  });

  editButton.addEventListener("click", function () { setMode("edit"); });
  useButton.addEventListener("click", function () { setMode("use"); });

  clearButton.addEventListener("click", function () {
    if (!window.confirm("Remove all controls from the dashboard?")) return;
    items = [];
    pending = null;
    selectedId = null;
    save();
    message = "Dashboard cleared.";
    render();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || mode !== "edit") return;
    if (pending) pending = null;
    else selectedId = null;
    render();
  });

  // ---- Mouse/pen dragging (touch uses tap-to-place instead) ----
  var drag = null;          // { source, startX, startY, ghost, target }
  var suppressClick = false; // stops the click that follows a drop

  function dragSourceFrom(element) {
    if (mode !== "edit") return null;
    var paletteItem = element.closest(".palette-item");
    if (paletteItem) {
      return {
        source: { kind: "add", type: paletteItem.getAttribute("data-type") },
        text: paletteItem.textContent
      };
    }
    var control = element.closest("#grid .control");
    if (control) {
      var item = findItem(control.getAttribute("data-id"));
      return { source: { kind: "move", id: item.id }, text: displayLabel(item) };
    }
    return null;
  }

  function cellUnder(x, y) {
    var element = document.elementFromPoint(x, y);
    return element ? element.closest("#grid .cell-empty") : null;
  }

  document.addEventListener("pointerdown", function (event) {
    if (event.pointerType === "touch" || event.button !== 0) return;
    var found = dragSourceFrom(event.target);
    if (!found) return;
    drag = {
      source: found.source,
      text: found.text,
      startX: event.clientX,
      startY: event.clientY,
      ghost: null,
      target: null
    };
  });

  document.addEventListener("pointermove", function (event) {
    if (!drag) return;
    if (!drag.ghost) {
      var dx = event.clientX - drag.startX;
      var dy = event.clientY - drag.startY;
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return;
      drag.ghost = document.createElement("div");
      drag.ghost.className = "drag-ghost";
      drag.ghost.textContent = drag.text;
      document.body.appendChild(drag.ghost);
    }
    drag.ghost.style.left = event.clientX + "px";
    drag.ghost.style.top = event.clientY + "px";

    var target = cellUnder(event.clientX, event.clientY);
    if (target !== drag.target) {
      if (drag.target) drag.target.classList.remove("is-drop-target");
      if (target) target.classList.add("is-drop-target");
      drag.target = target;
    }
  });

  function endDrag(event, cancelled) {
    if (!drag) return;
    var finished = drag;
    drag = null;
    if (!finished.ghost) return; // never moved far enough: treat as a click

    finished.ghost.remove();
    if (finished.target) finished.target.classList.remove("is-drop-target");
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    if (cancelled) return;

    var target = cellUnder(event.clientX, event.clientY);
    if (target) {
      dropOn(finished.source, Number(target.getAttribute("data-col")),
        Number(target.getAttribute("data-row")));
    } else {
      var element = document.elementFromPoint(event.clientX, event.clientY);
      var control = element && element.closest("#grid .control");
      var ownCell = control && finished.source.kind === "move" &&
        control.getAttribute("data-id") === finished.source.id;
      if (control && !ownCell) {
        message = "That cell is taken. Choose an empty cell.";
        render();
      }
    }
  }

  document.addEventListener("pointerup", function (event) { endDrag(event, false); });
  document.addEventListener("pointercancel", function (event) { endDrag(event, true); });

  // ---- Start ----
  load();
  render();
})();
