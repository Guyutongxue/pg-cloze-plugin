function getText(selector) {
  const html = $(selector).html();
  $(selector).html(html.replace(/<br\s*[\/]?>/gi, "\n"));
  return $(selector)
    .text()
    .replace(/\u00a0/g, " ");
}
function submitWithSnippet(originalHandler) {
  let origin = $("#sourceCode").val();
  let pre = getText("app-pre");
  let post = getText("app-post");
  $("#sourceCode").val(pre + origin + post);
  originalHandler();
  $("#sourceCode").val(origin);
}
function submitIdeWithSnippet(originalHandler) {
  if (!editor) return;
  const origin = editor.getValue();
  const pre = getText("app-pre");
  const post = getText("app-post");
  editor.setValue(pre + origin + post, -1);
  originalHandler();
  editor.setValue(origin, -1);
}
async function replaceClickHandler(selector, handler_name, replacement) {
  while (true) {
    const origin = $(selector)[0]
      ? $._data($(selector)[0], "events")?.click[0]?.handler
      : void 0;
    if (origin && origin.name === handler_name) {
      $(selector).off("click");
      $(selector).on("click", () => replacement(origin));
      console.log(`${selector} replaced.`);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
function addHint(selector) {
  $(`<pre class="cloze-hint" data-pos="pre">`)
    .html($("app-pre").html())
    .insertBefore($(selector));
  $(`<pre class="cloze-hint" data-pos="post">`)
    .html($("app-post").html())
    .insertAfter($(selector));
}
function addHintIde() {
  addHint("#editor");
  const toolbarTop = $("#editor_toolbar").css("top");
  const toolbarTopNum = Number(toolbarTop.substring(0, toolbarTop.length - 2));
  const bottomOffset = $(window).height() - toolbarTopNum;
  $(".cloze-hint[data-pos=post]").css({
    bottom: bottomOffset,
  });
  async function adjustEditor() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    $(".cloze-hint").css("left", $("#editor").css("left"));
    $("#editor").css({
      top: $(".cloze-hint[data-pos=pre]").height() + 44,
      height: "unset",
      bottom: $(".cloze-hint[data-pos=post]").height() + 19 + bottomOffset,
    });
    editor.resize();
  }
  setTimeout(adjustEditor, 100);
  $(window).resize(adjustEditor);
  $("#btnHoverDescription,#btnShowProblem").click(adjustEditor);
  console.log("Added cloze hint for ide.");
}
function replaceSolutionLoaded() {
  const originalOnSolutionLoaded = onSolutionLoaded;
  window.onSolutionLoaded = () => {
    const sourceCode = solution.sourceCode;
    const pre = getText("app-pre");
    const post = getText("app-post");
    if (sourceCode.startsWith(pre) && sourceCode.endsWith(post)) {
      solution.sourceCode = sourceCode.substring(pre.length, sourceCode.length - post.length);
      originalOnSolutionLoaded();
    }
  }
}
if (location.pathname.includes("ide.do")) {
  replaceClickHandler("#btnTest", "testCode", submitIdeWithSnippet);
  replaceClickHandler("#btnSubmit", "submitCode", submitIdeWithSnippet);
  addHintIde();
  replaceSolutionLoaded();
} else {
  replaceClickHandler("#sourceCode_submit", "do_submit", submitWithSnippet);
  addHint("#sourceCode");
}
