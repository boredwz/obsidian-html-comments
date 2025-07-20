import { Editor, Plugin } from "obsidian";

// TODO:
//   1. "Keep original selection and cursor position" option (not available when multiple selecting)
//   2. ...
// Can be useful: /^[^\r\n]*?(\<\!-- )((?:.|[\r\n])*?)( --\>)[^\r\n]*?$/gm

export default class HtmlCommentsPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "boredwz-html-comments",
      name: "Toggle comment <!-- txt -->",
      editorCallback: (editor: Editor) => main(editor)
    });
  }
}

const COMMENT_START = "<!--";
const COMMENT_END = "-->";

function main(editor: Editor) {
  const totalSelections = editor.listSelections().length;
  const cursor = editor.getCursor();

  editor.listSelections().forEach((sel, i) => {
    const selPos = { anchor: { ...sel.anchor }, head: { ...sel.head } };
    
    // Fix reversed selection, ex: {2:10,1:0} -> {1:0,2:10}; {6:11,6:0} -> {6:0,6:11}
    if (sel.anchor.line > sel.head.line || (sel.anchor.line === sel.head.line && sel.anchor.ch > sel.head.ch)) {
      selPos.anchor = sel.head;
      selPos.head = sel.anchor;
    }
    
    // Get text from selection
    let selText = editor.getRange(selPos.anchor, selPos.head);
    
    // If no text selected, get entire line
    const isNotSelected = selText.length === 0;
    if (isNotSelected) {
      selText = editor.getLine(selPos.anchor.line);
      selPos.anchor.ch = 0;
      selPos.head.ch = selText.length;
    }

    // Replace text
    let txt = commentText(selText);
    let logJob = "Text -> Comment";
    let cursorChNew = cursor.ch + COMMENT_START.length + 1; // +space
    if (isCommented(selText)) {
      txt = uncommentText(selText);
      logJob = "Comment -> Text";
      cursorChNew = cursor.ch - COMMENT_START.length - 1;
    }
    editor.replaceRange(txt, selPos.anchor, selPos.head);

    // Restore cursor position (no selection only)
    if (isNotSelected && totalSelections === 1) {
		  editor.setCursor({line: cursor.line, ch: cursorChNew});
    }

    // Output debug info
    //console.log(`[${i + 1}/${totalSelections}] {${selPos.anchor.line}:${selPos.anchor.ch} ${selPos.head.line}:${selPos.head.ch}} ${logJob}`);
  });
}

function isCommented(text: string): boolean {
  return text.startsWith(COMMENT_START) && text.endsWith(COMMENT_END);
}

function commentText(text: string): string {
  return `${COMMENT_START} ${text} ${COMMENT_END}`;
}

function uncommentText(text: string): string {
  return text
    .slice(COMMENT_START.length, text.length - COMMENT_END.length)
    .trim();
}