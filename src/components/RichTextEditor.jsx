import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, ClipboardPaste, Code2, Copy, Scissors,
  ImagePlus, Indent, Italic, Link2, List, ListOrdered, Outdent, Quote,
  Redo2, Search, Strikethrough, Subscript, Superscript, Table2, Underline,
  Undo2, Unlink, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const toolbarGroups = [
  [
    { label: "Cut", icon: Scissors, action: "cut" },
    { label: "Copy", icon: Copy, action: "copy" },
    { label: "Paste", icon: ClipboardPaste, action: "paste" },
  ],
  [
    { label: "Undo", icon: Undo2, command: "undo" },
    { label: "Redo", icon: Redo2, command: "redo" },
    { label: "Search and replace", icon: Search, panel: "search" },
  ],
  [
    { label: "Bold", icon: Bold, command: "bold" },
    { label: "Italic", icon: Italic, command: "italic" },
    { label: "Underline", icon: Underline, command: "underline" },
    { label: "Strikethrough", icon: Strikethrough, command: "strikeThrough" },
    { label: "Subscript", icon: Subscript, command: "subscript" },
    { label: "Superscript", icon: Superscript, command: "superscript" },
  ],
  [
    { label: "Align left", icon: AlignLeft, command: "justifyLeft" },
    { label: "Align center", icon: AlignCenter, command: "justifyCenter" },
    { label: "Align right", icon: AlignRight, command: "justifyRight" },
    { label: "Justify", icon: AlignJustify, command: "justifyFull" },
  ],
  [
    { label: "Bulleted list", icon: List, command: "insertUnorderedList" },
    { label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
    { label: "Indent", icon: Indent, command: "indent" },
    { label: "Outdent", icon: Outdent, command: "outdent" },
  ],
  [
    { label: "Blockquote", icon: Quote, command: "formatBlock", value: "blockquote" },
    { label: "Insert link", icon: Link2, panel: "link" },
    { label: "Remove link", icon: Unlink, command: "unlink" },
    { label: "Insert image", icon: ImagePlus, panel: "image" },
    { label: "Insert table", icon: Table2, panel: "table" },
    { label: "Special characters", icon: Code2, panel: "special" },
  ],
];

const fontFamilies = ["Arial", "Georgia", "Impact", "Tahoma", "Times New Roman", "Verdana"];
const fontSizes = ["10px", "12px", "14px", "16px", "18px", "24px", "32px", "48px"];
const specialCharacters = ["©", "®", "™", "€", "£", "¥", "§", "¶", "•", "–", "—", "“", "”", "‘", "’", "…", "✓", "→"];
const allowedTags = new Set(["A", "B", "BLOCKQUOTE", "BR", "CODE", "DIV", "EM", "H1", "H2", "H3", "HR", "I", "IMG", "LI", "OL", "P", "PRE", "S", "SPAN", "STRIKE", "STRONG", "SUB", "SUP", "TABLE", "TBODY", "TD", "TH", "THEAD", "TR", "U", "UL"]);
const allowedLinkAttributes = new Set(["href", "src", "alt", "title", "colspan", "rowspan", "style", "target", "rel", "class", "id", "dir", "accesskey", "name", "hreflang", "tabindex", "type", "charset", "download"]);

function safeUrl(value, allowDataImage = false) {
  if (allowDataImage && /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value)) return value;
  try {
    const url = new URL(value, window.location.origin);
    return ["http:", "https:", "ftp:", "mailto:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function sanitizeHtml(html) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed.querySelectorAll("script,style,iframe,object,embed,form,svg,math").forEach((element) => element.remove());
  const elements = [...parsed.body.querySelectorAll("*")].reverse();
  for (const element of elements) {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...element.childNodes);
      continue;
    }
    for (const attribute of [...element.attributes]) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || !allowedLinkAttributes.has(name)) {
        element.removeAttribute(attribute.name);
      }
    }
    if (element.hasAttribute("href")) {
      const url = safeUrl(element.getAttribute("href"));
      if (url) element.setAttribute("href", url);
      else element.removeAttribute("href");
    }
    if (element.hasAttribute("src")) {
      const url = safeUrl(element.getAttribute("src"), true);
      if (url) element.setAttribute("src", url);
      else element.removeAttribute("src");
    }
    if (element.hasAttribute("rel")) {
      const relValues = element.getAttribute("rel").split(/\s+/).filter((value) => /^(alternate|author|bookmark|help|license|next|nofollow|noopener|noreferrer|prev|search|tag|ugc|sponsored)$/i.test(value));
      if (relValues.length) element.setAttribute("rel", [...new Set(relValues)].join(" "));
      else element.removeAttribute("rel");
    }
    if (element.hasAttribute("class")) {
      const classValues = element.getAttribute("class").split(/\s+/).filter((value) => /^[A-Za-z_][\w-]*$/.test(value));
      if (classValues.length) element.setAttribute("class", [...new Set(classValues)].join(" "));
      else element.removeAttribute("class");
    }
    if (element.hasAttribute("dir") && !["ltr", "rtl"].includes(element.getAttribute("dir").toLowerCase())) element.removeAttribute("dir");
    if (element.hasAttribute("target") && !["_blank", "_top", "_self", "_parent"].includes(element.getAttribute("target"))) element.removeAttribute("target");
    if (element.hasAttribute("tabindex") && !/^-?\d+$/.test(element.getAttribute("tabindex"))) element.removeAttribute("tabindex");
    for (const attribute of ["id", "name", "accesskey"]) {
      if (element.hasAttribute(attribute) && !/^[\w.-]*$/.test(element.getAttribute(attribute))) element.removeAttribute(attribute);
    }
    if (element.hasAttribute("style")) {
      const styles = element.getAttribute("style").split(";").map((part) => part.trim()).filter((part) => /^(text-align|font-family|font-size|font-weight|font-style|text-decoration|color|background-color|border-color|border-style|border-width|padding|padding-(top|right|bottom|left)|margin|margin-(top|right|bottom|left)|letter-spacing|line-height|text-transform)\s*:\s*[-#(),.%\w\s'"]+$/i.test(part));
      if (styles.length) element.setAttribute("style", styles.join("; "));
      else element.removeAttribute("style");
    }
  }
  return parsed.body.innerHTML;
}

export default function RichTextEditor({ value, onChange, label = "News description", placeholder = "Write your story here..." }) {
  const editorRef = useRef(null);
  const urlInputRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [source, setSource] = useState(value || "");
  const [activePanel, setActivePanel] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogTab, setLinkDialogTab] = useState("Link Info");
  const [linkDisplayText, setLinkDisplayText] = useState("");
  const [linkType, setLinkType] = useState("url");
  const [linkProtocol, setLinkProtocol] = useState("https://");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkTarget, setLinkTarget] = useState("_blank");
  const [linkAdvanced, setLinkAdvanced] = useState({
    id: "",
    direction: "",
    accessKey: "",
    name: "",
    languageCode: "",
    tabIndex: "",
    title: "",
    contentType: "",
    classes: "",
    charset: "",
    relationship: "",
    style: "",
    forceDownload: false,
  });
  const [imageUrl, setImageUrl] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [tableRows, setTableRows] = useState("2");
  const [tableColumns, setTableColumns] = useState("2");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (sourceMode || !editorRef.current || document.activeElement === editorRef.current) return;
    const safeValue = sanitizeHtml(value || "");
    if (editorRef.current.innerHTML !== safeValue) editorRef.current.innerHTML = safeValue;
  }, [sourceMode, value]);

  useEffect(() => {
    if (!linkDialogOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") closeLinkDialog();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [linkDialogOpen]);

  useEffect(() => {
    if (linkDialogOpen && linkDialogTab === "Link Info" && linkType === "url") {
      urlInputRef.current?.focus();
    }
  }, [linkDialogOpen, linkDialogTab, linkType]);

  function rememberSelection() {
    const selection = window.getSelection();
    if (!selection?.rangeCount || !editorRef.current?.contains(selection.anchorNode)) return;
    savedRangeRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const range = savedRangeRef.current;
    if (!range || !editorRef.current) {
      editorRef.current?.focus();
      return;
    }
    editorRef.current.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function emitChange() {
    if (editorRef.current) onChange(sanitizeHtml(editorRef.current.innerHTML));
    setMessage("");
  }

  function runCommand(command, commandValue) {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    rememberSelection();
    emitChange();
  }

  async function runClipboard(action) {
    restoreSelection();
    try {
      if (action === "paste") {
        const text = await navigator.clipboard.readText();
        document.execCommand("insertText", false, text);
      } else {
        const succeeded = document.execCommand(action, false);
        if (!succeeded) throw new Error("Clipboard command unavailable");
      }
      rememberSelection();
      emitChange();
    } catch {
      setMessage(action === "paste"
        ? "Paste access was denied by the browser. Use Ctrl+V inside the editor."
        : `${action === "cut" ? "Cut" : "Copy"} access is unavailable in this browser.`);
    }
  }

  function openPanel(panel) {
    rememberSelection();
    setActivePanel((current) => current === panel ? "" : panel);
    setMessage("");
  }

  function openLinkDialog() {
    rememberSelection();
    const selection = window.getSelection();
    setLinkDisplayText(selection?.rangeCount ? selection.getRangeAt(0).toString() : "");
    setLinkType("url");
    setLinkProtocol("https://");
    setLinkUrl("");
    setLinkError("");
    setLinkTarget("_blank");
    setLinkAdvanced({
      id: "",
      direction: "",
      accessKey: "",
      name: "",
      languageCode: "",
      tabIndex: "",
      title: "",
      contentType: "",
      classes: "",
      charset: "",
      relationship: "",
      style: "",
      forceDownload: false,
    });
    setLinkDialogTab("Link Info");
    setActivePanel("");
    setMessage("");
    setLinkDialogOpen(true);
  }

  function closeLinkDialog() {
    setLinkDialogOpen(false);
    window.requestAnimationFrame(restoreSelection);
  }

  function insertLink(event) {
    event?.preventDefault();
    const address = linkUrl.trim();
    const displayText = linkDisplayText.trim();
    if (!address || !displayText) {
      setLinkError(!displayText ? "Enter the text to display for this link." : "Enter a destination for this link.");
      return;
    }

    let destination = address;
    if (linkType === "email" && !/^mailto:/i.test(destination)) {
      destination = `mailto:${destination}`;
    } else if (linkType === "anchor" && !destination.startsWith("#")) {
      destination = `#${destination}`;
    } else if (linkType === "url" && linkProtocol !== "other" && !/^[a-z][a-z\d+.-]*:/i.test(destination)) {
      destination = `${linkProtocol}${destination}`;
    }
    const safeDestination = safeUrl(destination);
    if (!safeDestination) {
      setLinkError("Enter a valid http, https, ftp, or email link.");
      return;
    }

    restoreSelection();
    const range = savedRangeRef.current;
    if (!range || !editorRef.current) {
      setLinkError("Select a position in the editor for the link.");
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = safeDestination;
    if (linkTarget) anchor.target = linkTarget;
    const relationship = [linkAdvanced.relationship.trim(), linkTarget === "_blank" ? "noopener noreferrer" : ""].filter(Boolean).join(" ");
    if (relationship) anchor.rel = relationship;
    anchor.className = ["text-blue-600 underline font-medium", linkAdvanced.classes.trim()].filter(Boolean).join(" ");
    if (linkAdvanced.id.trim()) anchor.id = linkAdvanced.id.trim();
    if (linkAdvanced.direction) anchor.dir = linkAdvanced.direction;
    if (linkAdvanced.accessKey.trim()) anchor.accessKey = linkAdvanced.accessKey.trim();
    if (linkAdvanced.name.trim()) anchor.setAttribute("name", linkAdvanced.name.trim());
    if (linkAdvanced.languageCode.trim()) anchor.hreflang = linkAdvanced.languageCode.trim();
    if (linkAdvanced.tabIndex.trim()) anchor.setAttribute("tabindex", linkAdvanced.tabIndex.trim());
    if (linkAdvanced.title.trim()) anchor.title = linkAdvanced.title.trim();
    if (linkAdvanced.contentType.trim()) anchor.type = linkAdvanced.contentType.trim();
    if (linkAdvanced.charset.trim()) anchor.setAttribute("charset", linkAdvanced.charset.trim());
    if (linkAdvanced.style.trim()) anchor.setAttribute("style", linkAdvanced.style.trim());
    if (linkAdvanced.forceDownload) anchor.setAttribute("download", "");
    anchor.textContent = displayText;
    range.deleteContents();
    range.insertNode(anchor);
    const selection = window.getSelection();
    if (selection) {
      const caret = document.createRange();
      caret.selectNodeContents(anchor);
      caret.collapse(false);
      selection.removeAllRanges();
      selection.addRange(caret);
    }
    rememberSelection();
    emitChange();
    setLinkDialogOpen(false);
    window.requestAnimationFrame(restoreSelection);
  }

  function insertImage() {
    if (!imageUrl.trim()) return;
    try {
      const url = new URL(imageUrl.trim());
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("invalid protocol");
      restoreSelection();
      document.execCommand("insertImage", false, url.href);
      rememberSelection();
      emitChange();
      setActivePanel("");
      setImageUrl("");
    } catch {
      setMessage("Enter a valid http or https image URL.");
    }
  }

  function insertTable() {
    const rows = Math.max(1, Math.min(20, Number(tableRows) || 2));
    const columns = Math.max(1, Math.min(10, Number(tableColumns) || 2));
    const table = `<table><tbody>${Array.from({ length: rows }, (_, row) => `<tr>${Array.from({ length: columns }, () => row === 0 ? "<th>Heading</th>" : "<td>Content</td>").join("")}</tr>`).join("")}</tbody></table><p></p>`;
    runCommand("insertHTML", table);
    setActivePanel("");
  }

  function insertSpecial(character) {
    runCommand("insertText", character);
    setActivePanel("");
  }

  function applyFontSize(size) {
    const pixelSize = Number.parseInt(size, 10);
    restoreSelection();
    document.execCommand("fontSize", false, "7");
    editorRef.current?.querySelectorAll('font[size="7"]').forEach((font) => {
      const span = document.createElement("span");
      span.style.fontSize = `${pixelSize}px`;
      span.innerHTML = font.innerHTML;
      font.replaceWith(span);
    });
    rememberSelection();
    emitChange();
  }

  function searchReplace(replaceAll) {
    if (!findText) return;
    const root = editorRef.current;
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let replaced = 0;
    for (const node of nodes) {
      if (!node.nodeValue.includes(findText)) continue;
      if (replaceAll) {
        const count = node.nodeValue.split(findText).length - 1;
        node.nodeValue = node.nodeValue.split(findText).join(replaceText);
        replaced += count;
        continue;
      }
      const offset = node.nodeValue.indexOf(findText);
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + findText.length);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      savedRangeRef.current = range.cloneRange();
      root.focus();
      setMessage(`Found “${findText}”.`);
      return;
    }
    if (replaceAll && replaced) {
      emitChange();
      setMessage(`${replaced} occurrence${replaced === 1 ? "" : "s"} replaced.`);
    } else {
      setMessage(`No occurrence of “${findText}” found.`);
    }
  }

  function applyBlockStyle(valueToApply) {
    runCommand("formatBlock", valueToApply);
  }

  function applyFormat(valueToApply) {
    if (valueToApply === "pre") runCommand("formatBlock", "pre");
    else runCommand("removeFormat");
  }

  function applyFont(valueToApply) {
    runCommand("fontName", valueToApply);
  }

  function toggleSource() {
    if (!sourceMode) {
      setSource(editorRef.current?.innerHTML || value || "");
      setSourceMode(true);
      setActivePanel("");
    } else {
      const safeSource = sanitizeHtml(source);
      setSource(safeSource);
      onChange(safeSource);
      setSourceMode(false);
    }
  }

  return (
    <div className="rich-editor complete-rich-editor">
      <div className="editor-toolbar editor-toolbar-row" role="toolbar" aria-label="Text formatting tools">
        {toolbarGroups.map((group, groupIndex) => (
          <div className="editor-tool-group" key={groupIndex}>
            {group.map(({ label: toolLabel, icon: Icon, command, value: commandValue, action, panel }) => (
              <button
                type="button"
                key={toolLabel}
                title={toolLabel}
                aria-label={toolLabel}
                aria-pressed={panel ? activePanel === panel : undefined}
                className={panel && activePanel === panel ? "tool-active" : ""}
                onMouseDown={(event) => { rememberSelection(); event.preventDefault(); }}
                onClick={() => action ? runClipboard(action) : panel === "link" ? openLinkDialog() : panel ? openPanel(panel) : runCommand(command, commandValue)}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="editor-toolbar editor-toolbar-row editor-select-row" aria-label="Text styles">
        <label>Styles<select aria-label="Styles" defaultValue="p" onChange={(event) => applyBlockStyle(event.target.value)}><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option></select></label>
        <label>Format<select aria-label="Format" defaultValue="normal" onChange={(event) => applyFormat(event.target.value)}><option value="normal">Normal</option><option value="pre">Formatted</option></select></label>
        <label>Font<select aria-label="Font" defaultValue="Arial" onChange={(event) => applyFont(event.target.value)}>{fontFamilies.map((font) => <option key={font}>{font}</option>)}</select></label>
        <label>Size<select aria-label="Size" defaultValue="14px" onChange={(event) => applyFontSize(event.target.value)}>{fontSizes.map((size) => <option key={size}>{size}</option>)}</select></label>
        <button type="button" aria-label="Toggle HTML source" className={`source-toggle ${sourceMode ? "tool-active" : ""}`} onMouseDown={(event) => event.preventDefault()} onClick={toggleSource}><Code2 size={14} /> Source</button>
      </div>
      {activePanel && <div className="editor-popover">
        <button type="button" className="editor-popover-close" aria-label="Close editor tool" onClick={() => setActivePanel("")}><X size={15} /></button>
        {activePanel === "image" && <div className="editor-popover-fields"><label htmlFor="editor-image-url">Image URL</label><div><input id="editor-image-url" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://example.com/image.jpg" /><button type="button" className="button-primary" onClick={insertImage}>Insert image</button></div></div>}
        {activePanel === "search" && <div className="editor-popover-fields editor-search-fields"><label htmlFor="editor-find">Search and replace</label><input id="editor-find" value={findText} onChange={(event) => setFindText(event.target.value)} placeholder="Find text" /><input value={replaceText} onChange={(event) => setReplaceText(event.target.value)} placeholder="Replace with" /><div><button type="button" className="button-secondary" onClick={() => searchReplace(false)}>Find next</button><button type="button" className="button-primary" onClick={() => searchReplace(true)}>Replace all</button></div></div>}
        {activePanel === "table" && <div className="editor-popover-fields"><label>Insert table</label><div className="editor-table-controls"><label>Rows<input type="number" min="1" max="20" value={tableRows} onChange={(event) => setTableRows(event.target.value)} /></label><label>Columns<input type="number" min="1" max="10" value={tableColumns} onChange={(event) => setTableColumns(event.target.value)} /></label><button type="button" className="button-primary" onClick={insertTable}>Insert table</button></div></div>}
        {activePanel === "special" && <div className="editor-popover-fields"><label>Special characters</label><div className="special-character-grid">{specialCharacters.map((character) => <button type="button" key={character} onMouseDown={(event) => { rememberSelection(); event.preventDefault(); }} onClick={() => insertSpecial(character)}>{character}</button>)}</div></div>}
      </div>}
      {linkDialogOpen && <div
        className="link-dialog-backdrop"
        role="presentation"
        onMouseDown={(event) => { if (event.target === event.currentTarget) closeLinkDialog(); }}
      >
        <section className="link-dialog" role="dialog" aria-modal="true" aria-labelledby="link-dialog-title">
          <header className="link-dialog-header">
            <h2 id="link-dialog-title">Link</h2>
            <button type="button" aria-label="Close dialog" onClick={closeLinkDialog}><X size={18} /></button>
          </header>
          <div className="link-dialog-tabs" role="tablist" aria-label="Link settings">
            {["Link Info", "Target", "Advanced"].map((tab) => (
              <button
                type="button"
                role="tab"
                key={tab}
                id={`link-tab-${tab.toLowerCase().replace(" ", "-")}`}
                aria-selected={linkDialogTab === tab}
                aria-controls="link-dialog-panel"
                className={linkDialogTab === tab ? "link-dialog-tab-active" : ""}
                onClick={() => setLinkDialogTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.target === urlInputRef.current) insertLink(event);
            }}
          >
            <div className="link-dialog-content" id="link-dialog-panel" role="tabpanel" aria-labelledby={`link-tab-${linkDialogTab.toLowerCase().replace(" ", "-")}`}>
              {linkDialogTab === "Link Info" && <>
                <label className="link-dialog-field">
                  <span>Display Text</span>
                  <input value={linkDisplayText} onChange={(event) => { setLinkDisplayText(event.target.value); setLinkError(""); }} />
                </label>
                <label className="link-dialog-field">
                  <span>Link Type</span>
                  <select value={linkType} onChange={(event) => setLinkType(event.target.value)}>
                    <option value="url">URL</option>
                    <option value="anchor">Link to anchor in the text</option>
                    <option value="email">E-mail</option>
                  </select>
                </label>
                {linkType === "url" ? (
                  <div className="link-dialog-address-row">
                    <label className="link-dialog-field">
                      <span>Protocol</span>
                      <select value={linkProtocol} onChange={(event) => setLinkProtocol(event.target.value)}>
                        <option value="http://">http://</option>
                        <option value="https://">https://</option>
                        <option value="ftp://">ftp://</option>
                        <option value="other">&lt;other&gt;</option>
                      </select>
                    </label>
                    <label className="link-dialog-field link-dialog-url-field">
                      <span>URL</span>
                      <input ref={urlInputRef} type="url" value={linkUrl} onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }} placeholder={linkProtocol === "other" ? "https://example.com" : "example.com"} />
                    </label>
                  </div>
                ) : (
                  <label className="link-dialog-field">
                    <span>{linkType === "email" ? "E-mail Address" : "Anchor Name"}</span>
                    <input value={linkUrl} onChange={(event) => { setLinkUrl(event.target.value); setLinkError(""); }} placeholder={linkType === "email" ? "name@example.com" : "section-name"} />
                  </label>
                )}
              </>}
              {linkDialogTab === "Target" && (
                <label className="link-dialog-field link-dialog-target-field">
                  <span>Target</span>
                  <select value={linkTarget} onChange={(event) => setLinkTarget(event.target.value)}>
                    <option value="">&lt;not set&gt;</option>
                    <option value="_blank">New Window (_blank)</option>
                    <option value="_top">Top Window (_top)</option>
                    <option value="_self">Same Window (_self)</option>
                    <option value="_parent">Parent Window (_parent)</option>
                  </select>
                </label>
              )}
              {linkDialogTab === "Advanced" && <div className="link-dialog-advanced-grid">
                {[
                  ["id", "Id"],
                  ["direction", "Language Direction"],
                  ["accessKey", "Access Key"],
                  ["name", "Name"],
                  ["languageCode", "Language Code"],
                  ["tabIndex", "Tab Index"],
                  ["title", "Advisory Title"],
                  ["contentType", "Advisory Content Type"],
                  ["classes", "Stylesheet Classes"],
                  ["charset", "Linked Resource Charset"],
                  ["relationship", "Relationship"],
                  ["style", "Style"],
                ].map(([field, labelText]) => (
                  <label className={`link-dialog-advanced-field ${field === "style" ? "link-dialog-style-field" : ""}`} key={field}>
                    <span>{labelText}</span>
                    {field === "direction" ? (
                      <select value={linkAdvanced[field]} onChange={(event) => setLinkAdvanced((current) => ({ ...current, [field]: event.target.value }))}>
                        <option value="">&lt;not set&gt;</option><option value="ltr">LTR</option><option value="rtl">RTL</option>
                      </select>
                    ) : (
                      <input value={linkAdvanced[field]} onChange={(event) => setLinkAdvanced((current) => ({ ...current, [field]: event.target.value }))} />
                    )}
                  </label>
                ))}
                <label className="link-dialog-download-field">
                  <input type="checkbox" checked={linkAdvanced.forceDownload} onChange={(event) => setLinkAdvanced((current) => ({ ...current, forceDownload: event.target.checked }))} />
                  <span>Force Download</span>
                </label>
              </div>}
            </div>
            {linkError && <p className="link-dialog-error" role="alert">{linkError}</p>}
            <footer className="link-dialog-footer">
              <button type="button" className="link-dialog-ok" onClick={insertLink}>OK</button>
              <button type="button" className="link-dialog-cancel" onClick={closeLinkDialog}>Cancel</button>
            </footer>
          </div>
        </section>
      </div>}
      {message && <div className="editor-feedback" role="status">{message}</div>}
      {sourceMode ? (
        <textarea className="editor-content editor-source" aria-label={`${label} HTML source`} value={source} onChange={(event) => setSource(event.target.value)} />
      ) : (
        <div
          ref={editorRef}
          className="editor-content"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label={label}
          aria-multiline="true"
          data-placeholder={placeholder}
          onInput={emitChange}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onBlur={rememberSelection}
        />
      )}
    </div>
  );
}
