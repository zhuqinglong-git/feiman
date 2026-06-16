const state = {
  contentType: "image",
  imagePreviewSrc: "",
  imageUploaded: false,
  selectedImageName: "",
  aiGenerated: false,
  ruleConfirmed: false,
  ruleInputMode: "text",
  voiceRuleFile: false,
  videoRuleFile: false,
  bankRuleVideoFile: false,
  selectedQuestion: "q1",
  questionPickerOpen: false,
};

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function on(selector, eventName, handler) {
  const element = qs(selector);
  if (element) element.addEventListener(eventName, handler);
}

function setText(selector, value) {
  const element = qs(selector);
  if (element) element.textContent = value;
}

function setClass(selector, value) {
  const element = qs(selector);
  if (element) element.className = value;
}

function showToast(message) {
  const toast = qs("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function openNameDialog() {
  const dialog = qs("#name-dialog");
  const input = qs("#practice-name");
  if (!dialog || !input) return;
  dialog.hidden = false;
  input.focus();
}

function closeNameDialog() {
  const dialog = qs("#name-dialog");
  if (dialog) dialog.hidden = true;
}

function openCreationModal() {
  const input = qs("#practice-name");
  const modal = qs("#creation-modal");
  if (!input || !modal) return;
  const name = input.value.trim() || "未命名费曼练习";
  setText("#creation-title", `新建费曼练习-${name}`);
  closeNameDialog();
  modal.hidden = false;
  showToast("已进入费曼练习创建");
}

function closeCreationModal() {
  const modal = qs("#creation-modal");
  if (modal) modal.hidden = true;
}

function toggleNewMenu() {
  const menu = qs(".new-menu");
  if (menu) menu.classList.toggle("open");
}

function toggleGroupPractice() {
  const toggle = qs("#group-practice-toggle");
  const children = qs("#group-practice-children");
  if (!toggle || !children) return;
  const willExpand = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(willExpand));
  toggle.classList.toggle("expanded", willExpand);
  children.hidden = !willExpand;
}

function updateStudentPreview() {
  const promptInput = qs("#student-prompt-input");
  const questionInput = qs("#question-content-input");
  const prompt = qs("#preview-prompt");
  const preview = qs("#preview-media");
  if (prompt) prompt.textContent = promptInput ? promptInput.value : "";
  if (!preview) return;

  preview.className = `practice-material ${state.contentType}`;
  preview.innerHTML = "";

  if (state.contentType === "image") {
    if (!state.imagePreviewSrc) {
      const empty = document.createElement("span");
      empty.textContent = "未上传图片";
      preview.classList.add("empty");
      preview.appendChild(empty);
      return;
    }
    const image = document.createElement("img");
    image.src = state.imagePreviewSrc;
    image.alt = state.selectedImageName || "上传图片";
    preview.appendChild(image);
    return;
  }

  if (state.contentType === "question") {
    const text = document.createElement("p");
    text.textContent = questionInput ? questionInput.value : "题目内容";
    preview.appendChild(text);
    return;
  }

  const video = document.createElement("div");
  video.className = "practice-video-thumb";
  video.innerHTML = "<span>▶</span><strong>视频素材</strong><em>课程片段 / 老师示范讲解</em>";
  preview.appendChild(video);
}

function setContentType(type) {
  state.contentType = type;
  qsa("[data-content-type]").forEach((button) => {
    button.classList.toggle("active", button.dataset.contentType === type);
  });
  qsa("[data-content-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.contentPanel !== type;
  });

  updateStudentPreview();
  updateQuestionPicker();
}

function updateQuestionPicker() {
  const source = qs("#question-source");
  const picker = qs("[data-question-picker]");
  const modal = qs("#creation-modal .creation-modal");
  const showPicker = state.contentType === "question" && source && source.value === "bank" && state.questionPickerOpen;
  if (picker) picker.hidden = !showPicker;
  if (modal) modal.classList.toggle("question-picker-mode", showPicker);
  updateBankRuleVideo();
}

function updateBankRuleVideo() {
  const source = qs("#question-source");
  const showVideo = state.contentType === "question" && source && source.value === "bank";
  state.bankRuleVideoFile = showVideo;
  if (showVideo) state.ruleInputMode = "video";
  updateRuleInputFiles();
}

function confirmQuestionFromBank() {
  const source = qs("#question-source");
  if (source) source.value = "bank";
  state.questionPickerOpen = false;
  updateQuestionPicker();
  showToast("从题库中引用试题成功");
}

function handleQuestionSourceChange(event) {
  state.questionPickerOpen = event.target.value === "bank";
  updateQuestionPicker();
}

function updateImageUploadState() {
  const card = qs("[data-image-upload]");
  const uploadButton = qs("#image-upload-button");
  const preview = qs("#image-preview");
  const pickButton = qs("#image-pick-button");
  if (!card) return;
  card.classList.toggle("has-file", Boolean(state.selectedImageName));
  card.classList.toggle("uploaded", state.imageUploaded);
  setText("#image-card-title", state.selectedImageName || "未上传图片");
  setText("#image-card-desc", state.selectedImageName ? "图片已选中，上传后学生可在小学堂中查看。" : "请先选择本地图片，上传后学生才会在小学堂中看到。");
  setText("#image-file-name", state.selectedImageName || "未选择图片");
  setText("#image-upload-status", state.imageUploaded ? "图片已上传，可继续更换。" : state.selectedImageName ? "图片已选中，等待上传。" : "选中图片后可上传。");
  if (preview) preview.hidden = !state.selectedImageName;
  if (pickButton) pickButton.textContent = state.selectedImageName ? "更换图片" : "选择图片";
  if (uploadButton) {
    uploadButton.hidden = !state.selectedImageName || state.imageUploaded;
    uploadButton.disabled = !state.selectedImageName || state.imageUploaded;
  }
}

function openImagePicker() {
  const input = qs("#image-file-input");
  if (input) input.click();
}

function handleImageSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  state.selectedImageName = file.name;
  state.imageUploaded = false;
  state.imagePreviewSrc = URL.createObjectURL(file);
  const preview = qs("#image-preview");
  if (preview) {
    preview.src = state.imagePreviewSrc;
    preview.alt = file.name;
  }
  if (state.contentType === "image") setContentType("image");
  updateImageUploadState();
  showToast("已选中图片，请点击上传图片");
}

function uploadSelectedImage() {
  if (!state.selectedImageName) {
    showToast("请先选中图片");
    return;
  }
  state.imageUploaded = true;
  updateImageUploadState();
  showToast("图片已上传");
}

function setDialogHidden(selector, hidden) {
  const dialog = qs(selector);
  if (dialog) dialog.hidden = hidden;
}

function openReportDialog(selector) {
  setDialogHidden(selector, false);
}

function closeReportDialog(selector) {
  setDialogHidden(selector, true);
}

function openVoiceRecordDialog() {
  setDialogHidden("#voice-record-dialog", false);
}

function closeVoiceRecordDialog() {
  setDialogHidden("#voice-record-dialog", true);
}

function openVideoUploadDialog() {
  if (state.bankRuleVideoFile) {
    showToast("已通过题库获取讲解视频");
    return;
  }
  setDialogHidden("#video-upload-dialog", false);
}

function closeVideoUploadDialog() {
  setDialogHidden("#video-upload-dialog", true);
}

function updateRuleInputFiles() {
  const voiceFile = qs("#rule-voice-file");
  const videoFile = qs("#rule-video-file");
  const bankVideoFile = qs("#bank-rule-video-file");
  if (voiceFile) voiceFile.hidden = !state.voiceRuleFile;
  if (videoFile) videoFile.hidden = !state.videoRuleFile;
  if (bankVideoFile) bankVideoFile.hidden = !state.bankRuleVideoFile;
  setText("#rule-video-source-title", state.bankRuleVideoFile ? "通过题库获取讲解视频" : "上传视频录入");
  setText("#rule-video-source-desc", state.bankRuleVideoFile ? "已自动带入题库讲解视频" : "上传讲解或示范视频");
}

function finishVoiceRecord() {
  state.voiceRuleFile = true;
  state.ruleInputMode = "voice";
  closeVoiceRecordDialog();
  updateRuleInputFiles();
  showToast("录音文件已生成");
}

function finishVideoUpload() {
  state.videoRuleFile = true;
  state.ruleInputMode = "video";
  closeVideoUploadDialog();
  updateRuleInputFiles();
  showToast("视频文件已上传");
}

function deleteVoiceRuleFile() {
  state.voiceRuleFile = false;
  if (state.ruleInputMode === "voice") state.ruleInputMode = state.videoRuleFile ? "video" : "text";
  updateRuleInputFiles();
  showToast("已删除录音文件");
}

function deleteVideoRuleFile() {
  state.videoRuleFile = false;
  if (state.ruleInputMode === "video") state.ruleInputMode = state.voiceRuleFile ? "voice" : "text";
  updateRuleInputFiles();
  showToast("已删除视频文件");
}

function deleteBankRuleVideoFile() {
  const source = qs("#question-source");
  state.bankRuleVideoFile = false;
  if (source && source.value === "bank") source.value = "manual";
  if (state.ruleInputMode === "video") state.ruleInputMode = state.videoRuleFile ? "video" : state.voiceRuleFile ? "voice" : "text";
  updateRuleInputFiles();
  showToast("已删除题库讲解视频");
}

function getRuleRequestText() {
  if (state.ruleInputMode === "voice" && state.voiceRuleFile) return "请根据录音文件生成费曼规则";
  if (state.ruleInputMode === "video" && (state.videoRuleFile || state.bankRuleVideoFile)) return "请根据视频文件生成费曼规则";
  return "请根据输入的文字生成费曼规则";
}

function autoResizeTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function autoResizeRuleDimensions() {
  qsa(".rule-dimension textarea").forEach((textarea) => {
    autoResizeTextarea(textarea);
    textarea.addEventListener("input", () => autoResizeTextarea(textarea));
  });
}

function generateRule() {
  const output = qs("#ai-rule-output");
  if (!output) return;
  const requestWrap = qs("#rule-generation-request-wrap");
  const request = qs("#rule-generation-request");
  const reply = qs("#rule-generated-reply");
  const generateButton = qs("#generate-rule");
  const generatedActions = qs("#rule-generated-actions");
  const prompt = qs("#rule-prompt");
  if (prompt && document.activeElement === prompt) state.ruleInputMode = "text";
  if (request) request.textContent = getRuleRequestText();
  if (requestWrap) requestWrap.hidden = false;
  if (reply) reply.hidden = false;
  output.innerHTML = `
    <div class="rule-dimension">
      <div class="rule-dimension-title">维度1：费曼内容检查策略</div>
      <textarea rows="8">学生需要先按长度、质量、面积、人民币、时间五类单位家族进行分类说明。
AI 判断学生是否说清“大单位变小单位用乘法，小单位变大单位用除法”。
若学生混淆面积换算，AI 追问“为什么面积相邻单位之间通常是 100 倍”。
学生至少完成一个例题示范，例如 2.45 千米 = 2450 米或 1450 克 = 1.45 千克。
报告中按单位分类、进率记忆、换算方法、例题表达和追问应答五项评分。</textarea>
    </div>
    <div class="rule-dimension">
      <div class="rule-dimension-title">维度2：AI 对练追问策略</div>
      <textarea rows="6">AI 先用开放问题让学生自由讲解，再根据回答选择追问路径：如果学生只背口诀，继续追问“为什么这样换算”；如果学生漏掉单位家族，先要求分类；如果学生能说出方法，则引导其用生活场景举例说明。</textarea>
    </div>
    <div class="rule-dimension">
      <div class="rule-dimension-title">维度3：报告评价与老师跟进</div>
      <textarea rows="6">报告按知识掌握、表达清晰度、纠错能力三个方向展示结果。对薄弱学生标记需要老师跟进的知识点，并给出下一次练习建议，例如重点复习面积单位进率、时间单位进率或小数点移动规则。</textarea>
    </div>
  `;
  state.aiGenerated = true;
  state.ruleConfirmed = false;
  if (generateButton) generateButton.hidden = true;
  if (generatedActions) generatedActions.hidden = false;
  autoResizeRuleDimensions();
  updateRuleState();
  showToast("AI 已生成规则草稿，请检查后确认");
}

function confirmRule() {
  if (!state.aiGenerated) {
    showToast("请先生成规则草稿");
    return;
  }
  state.ruleConfirmed = true;
  updateRuleState();
  showToast("费曼规则已确认");
}

function updateRuleState() {
  if (!qs("#rule-status")) return;
  setText("#rule-status", state.ruleConfirmed ? "已确认" : "待确认");
  setClass("#rule-status", state.ruleConfirmed ? "status ready" : "status waiting");

  const publishButton = qs("#publish-button");
  if (publishButton) publishButton.disabled = !state.ruleConfirmed;
}

function scrollToCreationSection(sectionId) {
  const target = qs(`#${sectionId}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  qsa("[data-anchor-target]").forEach((button) => button.classList.toggle("active", button.dataset.anchorTarget === sectionId));
}

function selectQuestion(questionId) {
  state.selectedQuestion = questionId;
  qsa("[data-question]").forEach((button) => {
    button.classList.toggle("active", button.dataset.question === questionId);
  });
  setText(
    "#answer-analysis",
    questionId === "q1"
      ? "答案解析：学生需要先区分长度、质量、面积、人民币、时间五类单位家族，再按“大单位变小单位用乘法，小单位变大单位用除法”进行换算；面积单位相邻进率通常是 100，时间和人民币需要单独记忆进率。"
      : "答案解析：学生需要把小数、整数与单位进率结合起来判断方向，例如千米到米乘 1000、克到千克除以 1000、厘米到米除以 100。",
  );
}

function setReportPublished(isPublished) {
  setText("#report-status", isPublished ? "已发布给家长" : "待老师确认");
  setClass("#report-status", isPublished ? "status ready" : "status waiting");
}

function adjustReportScore(button) {
  const target = qs(`#${button.dataset.scoreTarget}`);
  if (!target) return;
  const currentScore = Number.parseInt(target.textContent, 10) || 0;
  const delta = Number.parseInt(button.dataset.scoreDelta, 10) || 0;
  target.textContent = String(Math.max(0, Math.min(100, currentScore + delta)));
}

function finishTeacherVoiceRecord() {
  closeReportDialog("#teacher-record-dialog");
  const fileRow = qs("#teacher-voice-file");
  if (fileRow) fileRow.hidden = false;
  showToast("语音点评已生成");
}

function deleteTeacherVoiceRecord() {
  const fileRow = qs("#teacher-voice-file");
  if (fileRow) fileRow.hidden = true;
  showToast("已删除语音点评");
}

function bindTemplateEvents() {
  on("#group-practice-toggle", "click", toggleGroupPractice);
  on("#new-practice-btn", "click", toggleNewMenu);
  on("#new-feynman-entry", "click", () => {
    const menu = qs(".new-menu");
    if (menu) menu.classList.remove("open");
    openNameDialog();
  });
  on("#close-name-dialog", "click", closeNameDialog);
  on("#cancel-name", "click", closeNameDialog);
  on("#confirm-name", "click", openCreationModal);
  on("#close-creation-modal", "click", closeCreationModal);
  on("#generate-rule", "click", generateRule);
  on("#regenerate-rule", "click", generateRule);
  on("#confirm-ai-rule", "click", confirmRule);
  on("#save-draft", "click", () => showToast("已保存为草稿"));
  on("#publish-button", "click", () => {
    showToast("费曼练习已完成创建");
    closeCreationModal();
  });
  on("#question-source", "change", handleQuestionSourceChange);
  on("[data-question-picker]", "click", confirmQuestionFromBank);
  on("#student-prompt-input", "input", updateStudentPreview);
  on("#question-content-input", "input", updateStudentPreview);
  on("#rule-prompt", "focus", () => {
    state.ruleInputMode = "text";
  });
  on("#rule-prompt", "input", () => {
    state.ruleInputMode = "text";
  });
  on("#rule-voice-record", "click", openVoiceRecordDialog);
  on("#rule-video-upload", "click", openVideoUploadDialog);
  on("#close-voice-dialog", "click", closeVoiceRecordDialog);
  on("#cancel-voice-record", "click", closeVoiceRecordDialog);
  on("#finish-voice-record", "click", finishVoiceRecord);
  on("#close-video-dialog", "click", closeVideoUploadDialog);
  on("#cancel-video-upload", "click", closeVideoUploadDialog);
  on("#finish-video-upload", "click", finishVideoUpload);
  on("#delete-rule-voice", "click", deleteVoiceRuleFile);
  on("#delete-rule-video", "click", deleteVideoRuleFile);
  on("#delete-bank-rule-video", "click", deleteBankRuleVideoFile);
  on("#image-preview-box", "click", openImagePicker);
  on("#image-pick-button", "click", openImagePicker);
  on("#image-upload-button", "click", uploadSelectedImage);
  const imageInput = qs("#image-file-input");
  if (imageInput) imageInput.addEventListener("change", handleImageSelected);

  qsa("[data-content-type]").forEach((button) => button.addEventListener("click", () => setContentType(button.dataset.contentType)));
  qsa("[data-question]").forEach((button) => button.addEventListener("click", () => selectQuestion(button.dataset.question)));
  qsa("[data-anchor-target]").forEach((button) => button.addEventListener("click", () => scrollToCreationSection(button.dataset.anchorTarget)));
}

function bindReportEvents() {
  on("#report-save-draft", "click", () => showToast("审核意见已保存"));
  on("#report-publish", "click", () => {
    setReportPublished(true);
    showToast("报告已发布给家长");
  });
  on("#edit-report-result", "click", () => showToast("可编辑报告结论"));
  on("#open-original-audio", "click", () => openReportDialog("#original-audio-dialog"));
  on("#close-original-audio", "click", () => closeReportDialog("#original-audio-dialog"));
  on("#teacher-voice-record", "click", () => openReportDialog("#teacher-record-dialog"));
  on("#close-teacher-record", "click", () => closeReportDialog("#teacher-record-dialog"));
  on("#cancel-teacher-record", "click", () => closeReportDialog("#teacher-record-dialog"));
  on("#finish-teacher-record", "click", finishTeacherVoiceRecord);
  on("#play-teacher-voice", "click", () => showToast("正在播放老师语音点评"));
  on("#delete-teacher-voice", "click", deleteTeacherVoiceRecord);
  qsa("[data-score-target]").forEach((button) => button.addEventListener("click", () => adjustReportScore(button)));
}

document.addEventListener("DOMContentLoaded", () => {
  bindTemplateEvents();
  bindReportEvents();
  if (qsa("[data-content-type]").length) setContentType(state.contentType);
  updateQuestionPicker();
  if (qsa("[data-question]").length) selectQuestion(state.selectedQuestion);
  updateImageUploadState();
  updateRuleInputFiles();
  updateRuleState();
  if (qs("#report-status")) setReportPublished(false);
});
