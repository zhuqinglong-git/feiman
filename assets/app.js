const state = {
  activeSubject: "brain",
  creationMode: "ai",
  contentType: "question",
  imagePreviewSrc: "",
  imageUploaded: false,
  selectedImageName: "",
  storyImageFile: true,
  storyVideoFile: true,
  aiGenerated: false,
  ruleConfirmed: false,
  ruleInputMode: "text",
  imageRuleFile: false,
  voiceRuleFile: false,
  videoRuleFile: false,
  bankRuleVideoFile: false,
  isGeneratingRule: false,
  ruleGenerationTimer: null,
  ruleTypingTimer: null,
  thinkingTypingTimer: null,
  activeRuleOutput: null,
  activeThinkingOutput: null,
  selectedQuestion: "q1",
  questionPickerOpen: false,
  questionAdded: false,
};

const subjectLabels = {
  brain: "脑力与思维",
  bilingual: "双语故事表演",
};

const bankQuestions = [
  {
    label: "题1",
    text: "一个长5dm、宽3dm、高5dm的长方体玻璃缸内盛有2dm深的水，放入一个石块后，水深2.2dm，这个石块的体积是多少？",
    image: "assets/question-volume-water.png",
    alt: "长方体玻璃缸水深变化题",
  },
  {
    label: "题2",
    text: "妈妈过生日，红红为妈妈准备了一份礼物。捆扎这个礼盒，如果接头处用去25厘米长的彩带，那么至少需要多长的彩带？",
    image: "assets/question-gift-ribbon.png",
    alt: "礼盒彩带长度题",
  },
];

function getCreationVariant() {
  if (state.creationMode === "teacher") return "teacher";
  return state.activeSubject === "bilingual" ? "bilingual" : "brain";
}

const generatedRuleLines = [
  "学生需要先按长度、质量、面积、人民币、时间五类单位家族进行分类说明。",
  "AI 判断学生是否说清“大单位变小单位用乘法，小单位变大单位用除法”。",
  "若学生混淆面积换算，AI 追问“为什么面积相邻单位之间通常是 100 倍”。",
  "学生至少完成一个例题示范，例如 2.45 千米 = 2450 米或 1450 克 = 1.45 千克。",
  "报告中按单位分类、进率记忆、换算方法、例题表达和追问应答五项评分。",
];

const bilingualRuleLines = [
  "学生需要围绕老师布置的英语题目，用语音或视频讲清完整做题方法，而不是只给出选项答案。",
  "AI 判断学生是否准确读出或复述题干关键信息，并说明题目考查的语法点、时态或固定搭配。",
  "学生需要明确指出错误选项错在哪里，并解释为什么正确选项更符合句意和语法规则。",
  "若学生只说答案、不讲原因，AI 追问“你是根据哪个关键词或语法结构判断的？”",
  "报告中按题意理解、语法依据、错因分析、英文表达清晰度、追问应答五项评分，并给出老师后续讲评建议。",
];

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

function formatMessageTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function openNameDialog() {
  const dialog = qs("#name-dialog");
  const input = qs("#practice-name");
  if (!dialog || !input) return;
  input.value = getDefaultPracticeName();
  dialog.hidden = false;
  input.focus();
}

function closeNameDialog() {
  const dialog = qs("#name-dialog");
  if (dialog) dialog.hidden = true;
}

function setActiveSubject(subject) {
  state.activeSubject = subject;
  qsa("[data-subject-entry]").forEach((entry) => {
    entry.classList.toggle("active", entry.dataset.subjectEntry === subject);
  });
  setText("#workspace-subject-label", subjectLabels[subject] || "脑力与思维");
}

function closeNewMenu() {
  const menu = qs(".new-menu");
  if (menu) menu.classList.remove("open");
}

function openFeynmanNameDialog(mode) {
  state.creationMode = mode;
  closeNewMenu();
  openNameDialog();
}

function getDefaultPracticeName() {
  if (state.creationMode === "ai" && state.activeSubject === "bilingual") return "双语知识点讲解";
  return "动物城单位换算秘籍";
}

function getCreationTitleSuffix() {
  const variant = getCreationVariant();
  if (variant === "teacher") return "费曼练习(教师)";
  if (variant === "bilingual") return "双语故事表演";
  return "脑力与思维";
}

function openCreationModal() {
  const input = qs("#practice-name");
  const modal = qs("#creation-modal");
  if (!input || !modal) return;
  const name = input.value.trim() || "未命名费曼任务";
  setText("#creation-title", `新建费曼任务-${name}-${getCreationTitleSuffix()}`);
  closeNameDialog();
  modal.hidden = false;
  applyCreationVariant();
  showToast("已进入费曼任务创建");
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

function setHidden(selector, hidden) {
  const element = qs(selector);
  if (element) element.hidden = hidden;
}

function applyCreationVariant() {
  const modal = qs("#creation-modal .creation-modal");
  const variant = getCreationVariant();
  const isBrain = variant === "brain";
  const isTeacher = variant === "teacher";
  const isStoryLike = variant === "bilingual" || isTeacher;
  if (modal) {
    modal.classList.toggle("variant-brain", isBrain);
    modal.classList.toggle("variant-bilingual", variant === "bilingual");
    modal.classList.toggle("variant-teacher", isTeacher);
    modal.classList.toggle("no-rule", isBrain || isTeacher);
  }

  setHidden("#content-type-segment", true);
  qsa("[data-content-type]").forEach((button) => {
    button.hidden = isBrain || isStoryLike || button.dataset.contentType === "question";
    button.classList.toggle("active", isBrain && button.dataset.contentType === "question");
  });
  setHidden("#shared-prompt-field", !isBrain);
  setHidden("#story-content-dialog", !isStoryLike);
  setHidden("#rule-section", isBrain || isTeacher);
  setHidden("#rail-rule-tab", isBrain || isTeacher);
  const footerText = qs("#preview-submit-section > span");
  if (footerText) footerText.hidden = true;

  qsa("[data-content-panel]").forEach((panel) => {
    panel.hidden = !isBrain || panel.dataset.contentPanel !== "question";
  });

  if (isBrain) {
    state.contentType = "question";
    const source = qs("#question-source");
    const promptInput = qs("#student-prompt-input");
    if (source) source.value = "bank";
    if (promptInput && !promptInput.dataset.brainInitialized) {
      promptInput.value = "请完成下面题目，并讲讲你的思路和解题方法。";
      promptInput.dataset.brainInitialized = "true";
    }
    updateQuestionStemCard();
  }

  if (variant === "bilingual") {
    const storyInput = qs("#story-prompt-input");
    const rulePrompt = qs("#rule-prompt");
    state.storyImageFile = true;
    state.storyVideoFile = true;
    if (storyInput && !storyInput.dataset.bilingualInitialized) {
      storyInput.value = "请根据老师布置的英语题目，用语音或视频讲清楚每道题的做题方法、判断依据，以及容易出错的地方。";
      storyInput.dataset.bilingualInitialized = "true";
    }
    if (rulePrompt && !rulePrompt.dataset.bilingualInitialized) {
      rulePrompt.value = "请围绕学生提交的英语题目讲解语音/视频，抽取一套费曼报告评分规则：重点判断学生是否讲清题意、语法依据、选项排除过程、错因分析和表达清晰度。";
      rulePrompt.dataset.bilingualInitialized = "true";
      updateSendButtonState();
    }
  }

  scrollToCreationSection("content-section");
  updateStoryAttachments();
  updateStudentPreview();
  updateQuestionPicker();
}

function getQuestionText() {
  const input = qs("#question-content-input");
  return input ? input.value.trim() : "";
}

function buildBankQuestionItems() {
  return bankQuestions
    .map(
      (question) => `
        <article class="bank-question-item">
          <strong>${question.label}</strong>
          <img src="${question.image}" alt="${question.alt}" />
        </article>
      `,
    )
    .join("");
}

function updateQuestionStemCard() {
  const card = qs("#question-stem-card");
  const input = qs("#question-content-input");
  if (!card) return;
  if (!state.questionAdded) {
    if (input) input.value = "";
    card.classList.add("empty");
    card.innerHTML = '<p>暂未选择题目，请点击“题库选题”添加题目。</p>';
    return;
  }
  if (input) input.value = bankQuestions.map((question) => `${question.label}：${question.text}`).join("\n");
  card.classList.remove("empty");
  card.innerHTML = buildBankQuestionItems();
}

function buildQuestionStemPreview() {
  if (!state.questionAdded) return '<span>暂未选择题目</span>';
  return `
    <article class="preview-question-card">
      ${bankQuestions
        .map(
          (question) => `
            <article class="bank-question-item text-only">
              <strong>${question.label}</strong>
              <p>${escapeHtml(question.text)}</p>
              ${
                question.label === "题2"
                  ? '<img class="preview-question-figure" src="assets/question-gift-preview.png" alt="礼盒尺寸图" />'
                  : ""
              }
            </article>
          `,
        )
        .join("")}
    </article>
  `;
}

function buildStoryPreview() {
  const parts = [];
  if (state.storyImageFile) {
    parts.push('<div class="preview-story-file image"><img src="assets/bilingual-assignment.png" alt="双语故事表演布置作业截图" /><strong>布置作业截图</strong></div>');
  }
  if (state.storyVideoFile) {
    parts.push('<div class="preview-story-file video"><span>▶</span><strong>学员作答视频.mp4</strong></div>');
  }
  if (!parts.length) return '<span>暂未添加图片或视频</span>';
  return `<div class="preview-story-files">${parts.join("")}</div>`;
}

function updateStudentPreview() {
  const promptInput = qs("#student-prompt-input");
  const questionInput = qs("#question-content-input");
  const storyInput = qs("#story-prompt-input");
  const prompt = qs("#preview-prompt");
  const preview = qs("#preview-media");
  if (!preview) return;
  const variant = getCreationVariant();

  if (variant === "brain") {
    if (prompt) prompt.textContent = promptInput ? promptInput.value : "请完成下面题目，并讲讲你的思路和解题方法。";
    preview.className = `practice-material question${state.questionAdded ? "" : " empty"}`;
    preview.innerHTML = buildQuestionStemPreview();
    return;
  }

  if (variant === "bilingual" || variant === "teacher") {
    if (prompt) prompt.textContent = storyInput ? storyInput.value : "";
    preview.className = `practice-material story${state.storyImageFile || state.storyVideoFile ? "" : " empty"}`;
    preview.innerHTML = buildStoryPreview();
    return;
  }

  if (prompt) prompt.textContent = promptInput ? promptInput.value : "";

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
  const showPicker = getCreationVariant() === "brain" && state.contentType === "question" && source && source.value === "bank" && state.questionPickerOpen;
  if (picker) picker.hidden = !showPicker;
  if (modal) modal.classList.toggle("question-picker-mode", showPicker);
  updateBankRuleVideo();
}

function updateBankRuleVideo() {
  state.bankRuleVideoFile = false;
  updateRuleInputFiles();
}

function confirmQuestionFromBank() {
  const source = qs("#question-source");
  if (source) source.value = "bank";
  state.questionAdded = true;
  state.questionPickerOpen = false;
  updateQuestionStemCard();
  updateStudentPreview();
  updateQuestionPicker();
  showToast("从题库中引用试题成功");
}

function handleQuestionPickerClick(event) {
  if (event.target.closest(".picker-footer .primary")) {
    confirmQuestionFromBank();
    return;
  }
  if (event.target.closest(".picker-footer button, .picker-head button")) {
    state.questionPickerOpen = false;
    updateQuestionPicker();
  }
}

function handleQuestionSourceChange(event) {
  state.questionPickerOpen = false;
  updateQuestionPicker();
}

function openQuestionPicker() {
  const source = qs("#question-source");
  if (source) source.value = "bank";
  state.questionPickerOpen = true;
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

function updateStoryAttachments() {
  const imageFile = qs("#story-image-file");
  const videoFile = qs("#story-video-file");
  const list = qs("#story-attachment-list");
  if (imageFile) imageFile.hidden = !state.storyImageFile;
  if (videoFile) videoFile.hidden = !state.storyVideoFile;
  if (list) list.hidden = !(state.storyImageFile || state.storyVideoFile);
  updateStudentPreview();
}

function addStoryImage() {
  state.storyImageFile = true;
  updateStoryAttachments();
  showToast("图片已添加到费曼内容");
}

function addStoryVideo() {
  state.storyVideoFile = true;
  updateStoryAttachments();
  showToast("视频已添加到费曼内容");
}

function deleteStoryImage() {
  state.storyImageFile = false;
  updateStoryAttachments();
  showToast("已删除图片");
}

function deleteStoryVideo() {
  state.storyVideoFile = false;
  updateStoryAttachments();
  showToast("已删除视频");
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

function openRuleImageDialog() {
  setDialogHidden("#image-upload-dialog", false);
}

function closeRuleImageDialog() {
  setDialogHidden("#image-upload-dialog", true);
}

function closeVideoUploadDialog() {
  setDialogHidden("#video-upload-dialog", true);
}

function updateRuleInputFiles() {
  const imageFile = qs("#rule-image-file");
  const voiceFile = qs("#rule-voice-file");
  const videoFile = qs("#rule-video-file");
  const bankVideoFile = qs("#bank-rule-video-file");
  const attachmentList = qs("#rule-attachment-list");
  if (imageFile) imageFile.hidden = !state.imageRuleFile;
  if (voiceFile) voiceFile.hidden = !state.voiceRuleFile;
  if (videoFile) videoFile.hidden = !state.videoRuleFile;
  if (bankVideoFile) bankVideoFile.hidden = !state.bankRuleVideoFile;
  if (attachmentList) attachmentList.hidden = !(state.imageRuleFile || state.voiceRuleFile || state.videoRuleFile || state.bankRuleVideoFile);
  setText("#rule-video-source-title", "上传视频");
  updateSendButtonState();
}

function finishRuleImageUpload() {
  state.imageRuleFile = true;
  closeRuleImageDialog();
  updateRuleInputFiles();
  updateSendButtonState();
  showToast("图片附件已添加");
}

function finishVoiceRecord() {
  state.voiceRuleFile = true;
  state.ruleInputMode = "voice";
  closeVoiceRecordDialog();
  updateRuleInputFiles();
  updateSendButtonState();
  showToast("录音文件已生成");
}

function finishVideoUpload() {
  state.videoRuleFile = true;
  state.ruleInputMode = "video";
  closeVideoUploadDialog();
  updateRuleInputFiles();
  updateSendButtonState();
  showToast("视频文件已上传");
}

function deleteVoiceRuleFile() {
  state.voiceRuleFile = false;
  if (state.ruleInputMode === "voice") state.ruleInputMode = state.videoRuleFile ? "video" : "text";
  updateRuleInputFiles();
  updateSendButtonState();
  showToast("已删除录音文件");
}

function deleteRuleImageFile() {
  state.imageRuleFile = false;
  updateRuleInputFiles();
  updateSendButtonState();
  showToast("已删除图片附件");
}

function deleteVideoRuleFile() {
  state.videoRuleFile = false;
  if (state.ruleInputMode === "video") state.ruleInputMode = state.voiceRuleFile ? "voice" : "text";
  updateRuleInputFiles();
  updateSendButtonState();
  showToast("已删除视频文件");
}

function deleteBankRuleVideoFile() {
  const source = qs("#question-source");
  state.bankRuleVideoFile = false;
  if (source && source.value === "bank") source.value = "manual";
  if (state.ruleInputMode === "video") state.ruleInputMode = state.videoRuleFile ? "video" : state.voiceRuleFile ? "voice" : "text";
  updateRuleInputFiles();
  updateSendButtonState();
  showToast("已删除题库讲解视频");
}

function getRulePromptText() {
  const prompt = qs("#rule-prompt");
  return prompt ? prompt.value.trim() : "";
}

function getRuleMessageAttachments() {
  const attachments = [];
  if (state.imageRuleFile) attachments.push({ type: "image", label: "规则说明图片.png", icon: "图" });
  if (state.voiceRuleFile) attachments.push({ type: "voice", label: "单位换算规则录音.m4a", icon: "音" });
  if (state.videoRuleFile) attachments.push({ type: "video", label: "单位换算规则说明.mp4", icon: "视" });
  if (state.bankRuleVideoFile) attachments.push({ type: "video", label: "题库讲解视频.mp4", icon: "视" });
  return attachments;
}

function getCurrentGeneratedRuleLines() {
  return getCreationVariant() === "bilingual" ? bilingualRuleLines : generatedRuleLines;
}

function clearRuleInputAttachments() {
  state.imageRuleFile = false;
  state.voiceRuleFile = false;
  state.videoRuleFile = false;
  state.bankRuleVideoFile = false;
  state.ruleInputMode = "text";
  updateRuleInputFiles();
}

function hasRuleInputContent() {
  return Boolean(getRulePromptText() || getRuleMessageAttachments().length);
}

function extractRewriteRule(text) {
  if (!text.includes("修改")) return "";
  const bracketMatch = text.match(/【([^】]+)】/);
  return bracketMatch ? bracketMatch[1].trim() : "";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
}

function buildMessageBubbleHtml(content) {
  return `<div class="rule-message-bubble"><div class="rule-message-content">${content}</div></div>`;
}

function buildTeacherMessageHtml(text, attachments) {
  const content = text ? `<p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>` : "";
  const files = attachments
    .map(
      (file) => `
        <div class="sent-attachment ${file.type}">
          <span>${file.icon}</span>
          <strong>${file.label}</strong>
        </div>
      `,
    )
    .join("");
  return buildMessageBubbleHtml(`${content}${files ? `<div class="sent-attachments">${files}</div>` : ""}`);
}

function ensureMessageMeta(message) {
  if (!message || message.querySelector(".rule-message-meta")) return;
  const bubble = message.querySelector(".rule-message-bubble");
  if (!bubble) return;
  const meta = document.createElement("div");
  meta.className = "rule-message-meta";
  meta.innerHTML = `<span>${formatMessageTime()}</span><button class="copy-ai-message" type="button" aria-label="复制">⧉</button>`;
  bubble.appendChild(meta);
}

function appendRuleMessage(role, html, beforeElement) {
  const chat = qs(".rule-chat-zone");
  if (!chat) return null;
  const message = document.createElement("div");
  message.className = `rule-message ${role}`;
  message.innerHTML = html;
  ensureMessageMeta(message);
  chat.insertBefore(message, beforeElement || null);
  chat.scrollTop = chat.scrollHeight;
  return message;
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast("已复制")).catch(() => showToast("复制失败"));
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  showToast(copied ? "已复制" : "复制失败");
}

function copyAiMessage(event) {
  const button = event.target.closest(".copy-ai-message");
  if (!button) return;
  const bubble = button.closest(".rule-message-bubble");
  if (!bubble) return;
  const content = bubble.querySelector(".rule-message-content");
  copyTextToClipboard((content || bubble).textContent.trim());
}

function hydrateMessageMeta() {
  qsa(".rule-message").forEach((message) => {
    const bubble = message.querySelector(".rule-message-bubble");
    if (bubble && !bubble.querySelector(".rule-message-content")) {
      const fragment = document.createElement("div");
      fragment.className = "rule-message-content";
      while (bubble.firstChild) fragment.appendChild(bubble.firstChild);
      bubble.appendChild(fragment);
    }
    ensureMessageMeta(message);
  });
}

function sendRuleMessage() {
  if (state.isGeneratingRule) {
    stopRuleGeneration();
    return;
  }
  const prompt = qs("#rule-prompt");
  const text = getRulePromptText();
  const attachments = getRuleMessageAttachments();
  if (!text && !attachments.length) {
    showToast("请先输入内容再发送");
    return;
  }
  appendRuleMessage("teacher", buildTeacherMessageHtml(text, attachments));
  state.ruleInputMode = state.voiceRuleFile ? "voice" : state.videoRuleFile || state.bankRuleVideoFile ? "video" : "text";
  if (prompt) prompt.value = "";
  clearRuleInputAttachments();
  updateSendButtonState();
  startRuleGenerationFlow(extractRewriteRule(text));
  showToast("已发送到对话区域");
}

function handleRulePromptKeydown(event) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  sendRuleMessage();
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

function finishRuleGeneration() {
  window.clearTimeout(state.ruleTypingTimer);
  state.ruleTypingTimer = null;
  state.isGeneratingRule = false;
  const output = state.activeRuleOutput;
  if (output) {
    const streamOutput = output.querySelector(".stream-rule-text");
    if (streamOutput) {
      const editable = document.createElement("textarea");
      editable.className = "editable-rule-output";
      editable.value = streamOutput.textContent;
      streamOutput.replaceWith(editable);
      autoResizeTextarea(editable);
      editable.addEventListener("input", () => autoResizeTextarea(editable));
    }
  }
  setSendButtonGenerating(false);
  state.aiGenerated = true;
  state.ruleConfirmed = true;
  updateRuleState();
  showToast("AI 已生成费曼规则");
}

function typeText(output, text, index, onDone) {
  if (!state.isGeneratingRule) return;
  output.textContent = text.slice(0, index);
  const chat = qs(".rule-chat-zone");
  if (chat) chat.scrollTop = chat.scrollHeight;
  if (index >= text.length) {
    if (onDone) onDone();
    return;
  }
  return window.setTimeout(() => typeText(output, text, index + 1, onDone), 24);
}

function typeRuleText(output, text) {
  state.ruleTypingTimer = typeText(output, text, 0, finishRuleGeneration);
}

function typeThinkingText(output, text) {
  state.thinkingTypingTimer = typeText(output, text, 0, null);
}

function setSendButtonGenerating(isGenerating) {
  const button = qs("#send-rule-message");
  if (!button) return;
  button.textContent = isGenerating ? "停止" : "↑";
  button.classList.toggle("is-stopping", isGenerating);
  button.setAttribute("aria-label", isGenerating ? "停止输出" : "发送");
  if (!isGenerating) updateSendButtonState();
}

function updateSendButtonState() {
  const button = qs("#send-rule-message");
  if (!button || state.isGeneratingRule) return;
  button.classList.toggle("is-disabled", !hasRuleInputContent());
}

function stopRuleGeneration() {
  const output = state.activeRuleOutput;
  window.clearTimeout(state.ruleGenerationTimer);
  window.clearTimeout(state.ruleTypingTimer);
  window.clearTimeout(state.thinkingTypingTimer);
  state.ruleGenerationTimer = null;
  state.ruleTypingTimer = null;
  state.thinkingTypingTimer = null;
  state.isGeneratingRule = false;
  if (output) output.innerHTML = "<p>已停止输出，可继续补充需求后再次生成。</p>";
  setSendButtonGenerating(false);
  updateRuleState();
  showToast("已停止输出");
}

function startRuleGenerationFlow(rewriteRule = "") {
  if (state.isGeneratingRule) {
    stopRuleGeneration();
    return;
  }
  const thinking = appendRuleMessage("ai", buildMessageBubbleHtml('<span class="thinking-stream"></span>'));
  const thinkingOutput = thinking ? thinking.querySelector(".thinking-stream") : null;
  const reply = appendRuleMessage("ai", buildMessageBubbleHtml('<div class="generated-rule-output"><p>正在思考...</p></div>'));
  const output = reply ? reply.querySelector(".generated-rule-output") : null;
  if (!output) return;
  state.activeRuleOutput = output;
  state.activeThinkingOutput = thinkingOutput;
  state.aiGenerated = false;
  state.ruleConfirmed = false;
  state.isGeneratingRule = true;
  setSendButtonGenerating(true);
  updateRuleState();
  state.thinkingTypingTimer = window.setTimeout(() => {
    if (thinkingOutput) typeThinkingText(thinkingOutput, "收到您输入的信息，接下来我将进行思考，抽取成可用的费曼规则...");
  }, 500);
  state.ruleGenerationTimer = window.setTimeout(() => {
    state.ruleGenerationTimer = null;
    const text = rewriteRule ? rewriteRule : getCurrentGeneratedRuleLines().map((line, index) => `${index + 1}. ${line}`).join("\n");
    const title = rewriteRule ? "收到，我将按照您的规则进行执行，费曼规则如下：" : "思考完毕，整理费曼规则如下：";
    output.innerHTML = `<div class="rule-dimension-title">${title}</div><pre class="stream-rule-text"></pre>`;
    const streamOutput = output.querySelector(".stream-rule-text");
    if (streamOutput) typeRuleText(streamOutput, text);
  }, 2000);
}

function confirmRule() {
  stopRuleGeneration();
}

function updateRuleState() {
  const publishButton = qs("#publish-button");
  if (publishButton) publishButton.disabled = false;
}

function scrollToCreationSection(sectionId) {
  const target = qs(`#${sectionId}`);
  if (target && target.hidden) return;
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
  on("#new-feynman-ai-entry", "click", () => openFeynmanNameDialog("ai"));
  on("#new-feynman-teacher-entry", "click", () => openFeynmanNameDialog("teacher"));
  on("#close-name-dialog", "click", closeNameDialog);
  on("#cancel-name", "click", closeNameDialog);
  on("#confirm-name", "click", openCreationModal);
  on("#close-creation-modal", "click", closeCreationModal);
  on("#save-draft", "click", () => {
    showToast("已取消创建");
    closeCreationModal();
  });
  on("#publish-button", "click", () => {
    showToast("费曼任务已完成创建");
    closeCreationModal();
  });
  on("#question-source", "change", handleQuestionSourceChange);
  on("#open-question-picker", "click", openQuestionPicker);
  on("[data-question-picker]", "click", handleQuestionPickerClick);
  on("#student-prompt-input", "input", updateStudentPreview);
  on("#question-content-input", "input", updateStudentPreview);
  on("#story-prompt-input", "input", updateStudentPreview);
  on("#story-image-upload", "click", addStoryImage);
  on("#story-video-upload", "click", addStoryVideo);
  on("#preview-story-image", "click", () => showToast("正在预览布置作业截图"));
  on("#play-story-video", "click", () => showToast("正在播放学员作答视频"));
  on("#delete-story-image", "click", deleteStoryImage);
  on("#delete-story-video", "click", deleteStoryVideo);
  on("#rule-prompt", "focus", () => {
    state.ruleInputMode = "text";
  });
  on("#rule-prompt", "input", () => {
    state.ruleInputMode = "text";
    updateSendButtonState();
  });
  on("#rule-prompt", "keydown", handleRulePromptKeydown);
  on("#rule-image-upload", "click", openRuleImageDialog);
  on("#close-image-dialog", "click", closeRuleImageDialog);
  on("#cancel-rule-image", "click", closeRuleImageDialog);
  on("#finish-rule-image", "click", finishRuleImageUpload);
  on("#rule-voice-record", "click", openVoiceRecordDialog);
  on("#rule-video-upload", "click", openVideoUploadDialog);
  on("#close-voice-dialog", "click", closeVoiceRecordDialog);
  on("#cancel-voice-record", "click", closeVoiceRecordDialog);
  on("#finish-voice-record", "click", finishVoiceRecord);
  on("#close-video-dialog", "click", closeVideoUploadDialog);
  on("#cancel-video-upload", "click", closeVideoUploadDialog);
  on("#finish-video-upload", "click", finishVideoUpload);
  on("#send-rule-message", "click", sendRuleMessage);
  const ruleChat = qs(".rule-chat-zone");
  if (ruleChat) ruleChat.addEventListener("click", copyAiMessage);
  on("#preview-rule-image", "click", () => showToast("正在预览图片附件"));
  on("#play-rule-voice", "click", () => showToast("正在播放录音文件"));
  on("#play-rule-video", "click", () => showToast("正在播放视频文件"));
  on("#play-bank-rule-video", "click", () => showToast("正在播放题库讲解视频"));
  on("#delete-rule-image", "click", deleteRuleImageFile);
  on("#delete-rule-voice", "click", deleteVoiceRuleFile);
  on("#delete-rule-video", "click", deleteVideoRuleFile);
  on("#delete-bank-rule-video", "click", deleteBankRuleVideoFile);
  on("#image-preview-box", "click", openImagePicker);
  on("#image-pick-button", "click", openImagePicker);
  on("#image-upload-button", "click", uploadSelectedImage);
  const imageInput = qs("#image-file-input");
  if (imageInput) imageInput.addEventListener("change", handleImageSelected);

  qsa("[data-subject-entry]").forEach((entry) => {
    entry.addEventListener("click", (event) => {
      event.preventDefault();
      setActiveSubject(entry.dataset.subjectEntry);
    });
  });
  qsa("[data-content-type]").forEach((button) => button.addEventListener("click", () => setContentType(button.dataset.contentType)));
  qsa("[data-question]").forEach((button) => button.addEventListener("click", () => selectQuestion(button.dataset.question)));
  qsa("[data-anchor-target]").forEach((button) => button.addEventListener("click", () => scrollToCreationSection(button.dataset.anchorTarget)));
}

function bindReportEvents() {
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
  hydrateMessageMeta();
  bindReportEvents();
  setActiveSubject(state.activeSubject);
  if (qsa("[data-content-type]").length) setContentType(state.contentType);
  applyCreationVariant();
  updateQuestionPicker();
  if (qsa("[data-question]").length) selectQuestion(state.selectedQuestion);
  updateImageUploadState();
  updateRuleInputFiles();
  updateRuleState();
  updateSendButtonState();
  if (qs("#report-status")) setReportPublished(false);
});
