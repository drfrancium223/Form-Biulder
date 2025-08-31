// ===== formbuilder.core.js =====
// Core part: define the FormBuilder class and attach prototype methods

// --- FormBuilder Class Definition ---
class FormBuilder {
  constructor() {
    this.formData = {
      title: "فرم جدید",
      description: "",
      elements: [],
      showQuestionNumbers: true,
      theme: "default"
    };
    this.rules = [];
    this.translations = {
      "fa": {},
      "en": {}
    };
    this.selectedElement = null;
  }
  
  init() {
    this.loadFromLocalStorage();
    this.setupTabs();
    this.setupEventListeners();
    
    // رندر اولیه المان‌ها
    if (typeof this.renderFormElements === 'function') {
      this.renderFormElements();
    }
    
    // رندر پیش‌نمایش
    if (typeof this.renderPreview === 'function') {
      this.renderPreview();
    }
    
    // رندر JSON
    if (typeof this.renderJSON === 'function') {
      this.renderJSON();
    }
  }
}

// --- Tabs ---
FormBuilder.prototype.setupTabs = function() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset ? tab.dataset.tab : null;
      if (name) this.switchTab(name);
    });
  });
};
FormBuilder.prototype.switchTab = function(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset && t.dataset.tab === tabName));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === `${tabName}-tab`));
  if (tabName === 'preview' && typeof this.renderPreview === 'function') this.renderPreview();
  if (tabName === 'json' && typeof this.renderJSON === 'function') this.renderJSON();
  if (tabName === 'logic' && typeof this.renderLogic === 'function') this.renderLogic();
  if (tabName === 'translations' && typeof this.renderTranslations === 'function') this.renderTranslations();
  
  // --- اصلاح جدید: به‌روزرسانی UI در زمان تغییر تب ---
  this.updateUI();
};
// --- Preview ---
FormBuilder.prototype.renderPreview = function() {
  const frame = document.getElementById('previewFrame');
  if (!frame) return;
  frame.innerHTML = `
    <h2 style="margin:0 0 8px 0;">${this.formData.title}</h2>
    ${this.formData.description ? `<p style="margin:0 0 12px 0;">${this.formData.description}</p>` : ''}
    <form class="preview-form">
      ${this.formData.elements.map((element, index) => `
        <div class="preview-element" data-id="${element.id}">
          <label class="preview-label">
            ${this.formData.showQuestionNumbers ? `<span class="preview-number">${index + 1}.</span>` : ''}
            ${element.title} ${element.required ? '<span style="color: #c00;">*</span>' : ''}
          </label>
          ${element.description ? `<div class="preview-desc">${element.description}</div>` : ''}
          ${this.renderElementInput(element)}
        </div>
      `).join('')}
      <div style="margin-top:16px;"><button type="submit" class="btn-primary">ارسال فرم</button></div>
    </form>
  `;
};
FormBuilder.prototype.renderElementInput = function(element) {
  switch (element.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
    case 'date':
    case 'time':
    case 'number':
      return `<input type="${element.type}" name="${element.name}" class="form-input" placeholder="${element.placeholder || ''}" ${element.required ? 'required' : ''}>`;
    case 'textarea':
      return `<textarea name="${element.name}" class="form-textarea" rows="${element.rows || 4}" placeholder="${element.placeholder || ''}" ${element.required ? 'required' : ''}></textarea>`;
    case 'radio':
      return `<div class="options-group">${(element.options || []).map(opt => `<label class="option-item"><input type="radio" name="${element.name}" value="${opt.value}" ${element.required ? 'required' : ''}> ${opt.text}</label>`).join('')}</div>`;
    case 'checkbox':
      return `<div class="options-group">${(element.options || []).map(opt => `<label class="option-item"><input type="checkbox" name="${element.name}" value="${opt.value}"> ${opt.text}</label>`).join('')}</div>`;
    case 'dropdown':
      return `<select name="${element.name}" class="form-select" ${element.required ? 'required' : ''}><option value="">انتخاب کنید...</option>${(element.options || []).map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('')}</select>`;
    case 'file':
      return `<input type="file" name="${element.name}" ${element.multiple ? 'multiple' : ''} accept="${element.accept || '*'}">`;
    // --- اصلاح جدید: افزودن پشتیبانی برای انواع جدید ---
    case 'rating':
      const min = element.min || 1;
      const max = element.max || 5;
      return `
        <div class="rating-stars">
          ${Array.from({length: max}, (_, i) => i + 1).map(star => `
            <span class="rating-star ${star <= (element.value || 0) ? 'active' : ''}" 
                  data-value="${star}">
              <i class="fas fa-star"></i>
            </span>
          `).join('')}
        </div>
        <input type="hidden" name="${element.name}" value="${element.value || 0}">
      `;
    case 'slider':
      const sliderMin = element.min || 0;
      const sliderMax = element.max || 100;
      const sliderStep = element.step || 1;
      const sliderValue = element.value || Math.floor((sliderMin + sliderMax) / 2);
      
      return `
        <div class="slider-container">
          <input type="range" name="${element.name}" class="slider-input" 
                 min="${sliderMin}" max="${sliderMax}" step="${sliderStep}" 
                 value="${sliderValue}">
          <span class="slider-value">${sliderValue}</span>
        </div>
      `;
    case 'signature':
      return `
        <div class="signature-pad">
          <canvas width="400" height="150"></canvas>
          <button class="signature-clear btn-secondary">پاک کردن</button>
        </div>
        <input type="hidden" name="${element.name}">
      `;
    default:
      // fallback to preview element (enabled)
      return this.renderElementPreview(element);
  }
};
// --- JSON Editor ---
FormBuilder.prototype.renderJSON = function() {
  const editor = document.getElementById('jsonEditor');
  if (!editor) return;
  editor.value = JSON.stringify(this.formData, null, 2);
};
FormBuilder.prototype.formatJSON = function() {
  const editor = document.getElementById('jsonEditor');
  if (!editor) return;
  try {
    const j = JSON.parse(editor.value);
    editor.value = JSON.stringify(j, null, 2);
    this.showToast('JSON فرمت‌بندی شد', 'success');
  } catch (e) {
    this.showToast('خطا: JSON نامعتبر', 'error');
  }
};
FormBuilder.prototype.validateJSON = function() {
  const editor = document.getElementById('jsonEditor');
  if (!editor) return;
  try {
    JSON.parse(editor.value);
    this.showToast('JSON معتبر است', 'success');
  } catch (e) {
    this.showToast('JSON نامعتبر است', 'error');
  }
};
// --- Element Preview ---
FormBuilder.prototype.renderElementPreview = function(element) {
  switch (element.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
    case 'date':
    case 'time':
    case 'number':
      return `<input type="${element.type}" class="form-input" placeholder="${element.placeholder || ''}" disabled>`;
    case 'textarea':
      return `<textarea class="form-textarea" rows="${element.rows || 4}" placeholder="${element.placeholder || ''}" disabled></textarea>`;
    case 'radio':
      return `<div class="options-group">${(element.options || []).map(opt => `<label class="option-item"><input type="radio" disabled> ${opt.text}</label>`).join('')}</div>`;
    case 'checkbox':
      return `<div class="options-group">${(element.options || []).map(opt => `<label class="option-item"><input type="checkbox" disabled> ${opt.text}</label>`).join('')}</div>`;
    case 'dropdown':
      return `<select class="form-select" disabled><option>انتخاب کنید...</option>${(element.options || []).map(opt => `<option>${opt.text}</option>`).join('')}</select>`;
    case 'rating':
      const min = element.min || 1;
      const max = element.max || 5;
      return `
        <div class="rating-stars">
          ${Array.from({length: max}, (_, i) => i + 1).map(star => `
            <span class="rating-star ${star <= 3 ? 'active' : ''}">
              <i class="fas fa-star"></i>
            </span>
          `).join('')}
        </div>
      `;
    case 'slider':
      const sliderMin = element.min || 0;
      const sliderMax = element.max || 100;
      const sliderStep = element.step || 1;
      const sliderValue = element.value || Math.floor((sliderMin + sliderMax) / 2);
      
      return `
        <div class="slider-container">
          <input type="range" class="slider-input" 
                 min="${sliderMin}" max="${sliderMax}" step="${sliderStep}" 
                 value="${sliderValue}" disabled>
          <span class="slider-value">${sliderValue}</span>
        </div>
      `;
    case 'signature':
      return `
        <div class="signature-pad" style="height: 80px; background: #f8fafc; border-radius: 4px;"></div>
      `;
    case 'file':
      return `
        <div class="file-upload-area" data-multiple="${element.multiple ? 'true' : 'false'}" style="height: 100px;">
          <i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 10px;"></i>
          <p>فایل‌ها را اینجا بکشید و رها کنید</p>
        </div>
      `;
    default:
      return `<div class="preview-element-content">${element.title || 'بدون عنوان'}</div>`;
  }
};
FormBuilder.prototype.applyJSON = function() {
  const editor = document.getElementById('jsonEditor');
  if (!editor) return;
  try {
    const j = JSON.parse(editor.value);
    // basic validation shape
    if (!j || typeof j !== 'object' || !Array.isArray(j.elements)) {
      this.showToast('فرمت JSON صحیح نیست: المان‌ها یافت نشد', 'error');
      return;
    }
    this.formData = j;
    if (typeof this.renderFormElements === 'function') this.renderFormElements();
    if (typeof this.saveToLocalStorage === 'function') this.saveToLocalStorage();
    this.showToast('تغییرات اعمال شد', 'success');
  } catch (e) {
    this.showToast('خطا در پردازش JSON', 'error');
  }
};
// --- Logic rules (simple placeholder CRUD) ---
FormBuilder.prototype.renderLogic = function() {
  const container = document.getElementById('rulesList');
  if (!container) return;
  if (!this.rules || this.rules.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#666;">هیچ قانونی تعریف نشده است</p>';
    return;
  }
  container.innerHTML = this.rules.map(r => `
    <div class="rule-item" data-id="${r.id}">
      <div class="rule-header">
        <strong>${r.condition}</strong>
        <div class="rule-actions">
          <button class="btn-secondary" onclick="formBuilder.editRule(\'${r.id}\')">ویرایش</button>
          <button class="btn-secondary" onclick="formBuilder.deleteRule(\'${r.id}\')">حذف</button>
        </div>
      </div>
      <div class="rule-body">عمل: ${r.action} — هدف: ${r.target}</div>
    </div>
  `).join('');
};
FormBuilder.prototype.addRule = function() {
  const rule = {
    id: this.generateId(),
    condition: 'اگر سؤال 1 برابر با مقدار X باشد',
    action: 'نمایش',
    target: 'سؤال 2'
  };
  this.rules.push(rule);
  if (typeof this.renderLogic === 'function') this.renderLogic();
  if (typeof this.saveToLocalStorage === 'function') this.saveToLocalStorage();
  this.showToast('قانون جدید اضافه شد', 'success');
};
FormBuilder.prototype.editRule = function(ruleId) {
  // Placeholder: real UI modal/edit form can be implemented
  this.showToast('ویرایش قانون (پیاده‌سازی نشده)', 'info');
};
FormBuilder.prototype.deleteRule = function(ruleId) {
  const idx = this.rules.findIndex(r => r.id === ruleId);
  if (idx > -1) {
    this.rules.splice(idx, 1);
    if (typeof this.renderLogic === 'function') this.renderLogic();
    if (typeof this.saveToLocalStorage === 'function') this.saveToLocalStorage();
    this.showToast('قانون حذف شد', 'info');
  }
};
// --- Translations ---
FormBuilder.prototype.renderTranslations = function() {
  const grid = document.getElementById('translationsGrid');
  if (!grid) return;
  const language = document.getElementById('languageSelect') ? document.getElementById('languageSelect').value : 'fa';
  const translations = this.translations[language] || {};
  grid.innerHTML = this.formData.elements.map(el => `
    <div class="translation-item">
      <span class="translation-key">${el.name}</span>
      <input class="translation-value" data-key="${el.name}" data-lang="${language}" value="${translations[el.name] || el.title}" placeholder="${el.title}">
    </div>
  `).join('');
  grid.querySelectorAll('.translation-value').forEach(input => {
    input.addEventListener('change', (e) => {
      const t = e.target;
      const key = t.dataset.key;
      const lang = t.dataset.lang;
      if (!key || !lang) return;
      if (!this.translations[lang]) this.translations[lang] = {};
      this.translations[lang][key] = t.value;
      if (typeof this.saveToLocalStorage === 'function') this.saveToLocalStorage();
    });
  });
};
// --- Event listeners for UI (buttons, theme cards, preview device buttons, etc.) ---
FormBuilder.prototype.setupEventListeners = function() {
  // add question shortcut
  const addBtn = document.getElementById('addQuestionBtn');
  if (addBtn) addBtn.addEventListener('click', () => this.addElement('text'));
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', () => this.saveForm());
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.addEventListener('click', () => this.exportJSON());
  const formatBtn = document.getElementById('formatJsonBtn');
  if (formatBtn) formatBtn.addEventListener('click', () => this.formatJSON());
  const validateBtn = document.getElementById('validateJsonBtn');
  if (validateBtn) validateBtn.addEventListener('click', () => this.validateJSON());
  const applyBtn = document.getElementById('applyJsonBtn');
  if (applyBtn) applyBtn.addEventListener('click', () => this.applyJSON());
  const addRuleBtn = document.getElementById('addRuleBtn');
  if (addRuleBtn) addRuleBtn.addEventListener('click', () => this.addRule());
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) langSelect.addEventListener('change', () => this.renderTranslations());
  // preview device buttons
  const mobileBtn = document.getElementById('mobilePreview');
  const tabletBtn = document.getElementById('tabletPreview');
  const desktopBtn = document.getElementById('desktopPreview');
  const previewFrame = document.getElementById('previewFrame');
  if (mobileBtn && previewFrame) {
    mobileBtn.addEventListener('click', () => {
      previewFrame.className = 'preview-frame mobile';
      document.querySelectorAll('.preview-actions button').forEach(b => b.classList.remove('active'));
      mobileBtn.classList.add('active');
    });
  }
  if (tabletBtn && previewFrame) {
    tabletBtn.addEventListener('click', () => {
      previewFrame.className = 'preview-frame tablet';
      document.querySelectorAll('.preview-actions button').forEach(b => b.classList.remove('active'));
      tabletBtn.classList.add('active');
    });
  }
  if (desktopBtn && previewFrame) {
    desktopBtn.addEventListener('click', () => {
      previewFrame.className = 'preview-frame';
      document.querySelectorAll('.preview-actions button').forEach(b => b.classList.remove('active'));
      desktopBtn.classList.add('active');
    });
  }
  // theme cards
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const theme = card.dataset ? card.dataset.theme : null;
      if (theme) {
        this.formData.theme = theme;
        document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (typeof this.saveToLocalStorage === 'function') this.saveToLocalStorage();
        this.showToast(`تم "${card.textContent.trim()}" انتخاب شد`, 'success');
      }
    });
  });
  // context menu on right click of element
  document.addEventListener('contextmenu', (e) => {
    const el = e.target.closest && e.target.closest('.form-element');
    if (el) {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY, el.dataset.id || '');
    }
  });
  // hide context on click elsewhere
  document.addEventListener('click', () => this.hideContextMenu());
  const modalClose = document.getElementById('modalClose');
  if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
};

// --- Context menu ---
FormBuilder.prototype.showContextMenu = function(x, y, elementId) {
  const menu = document.getElementById('contextMenu');
  if (!menu) return;
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  menu.classList.add('show');
  // remove previous handlers
  menu.querySelectorAll('.context-menu-item').forEach(item => item.replaceWith(item.cloneNode(true)));
  menu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', (ev) => {
      const action = ev.currentTarget.dataset ? ev.currentTarget.dataset.action : null;
      switch (action) {
        case 'duplicate': this.duplicateElement(elementId); break;
        case 'delete': this.deleteElement(elementId); break;
        case 'required': this.toggleRequired(elementId); break;
        case 'moveUp': this.moveElement(elementId, 'up'); break;
        case 'moveDown': this.moveElement(elementId, 'down'); break;
      }
      this.hideContextMenu();
    });
  });
};
FormBuilder.prototype.hideContextMenu = function() {
  const menu = document.getElementById('contextMenu');
  if (menu) menu.classList.remove('show');
};
FormBuilder.prototype.toggleRequired = function(elementId) {
  const element = this.formData.elements.find(e => e.id === elementId);
  if (!element) return;
  element.required = !element.required;
  if (this.selectedElement && this.selectedElement.id === elementId) this.renderProperties();
  if (typeof this.renderFormElements === 'function') this.renderFormElements();
  if (typeof this.saveToLocalStorage === 'function') this.saveToLocalStorage();
};

// --- Storage ---
FormBuilder.prototype.saveToLocalStorage = function() {
  try {
    localStorage.setItem('formBuilderData', JSON.stringify(this.formData));
    localStorage.setItem('formBuilderRules', JSON.stringify(this.rules));
    localStorage.setItem('formBuilderTranslations', JSON.stringify(this.translations));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
};
FormBuilder.prototype.loadFromLocalStorage = function() {
  try {
    const d = localStorage.getItem('formBuilderData');
    if (d) this.formData = JSON.parse(d);
    const r = localStorage.getItem('formBuilderRules');
    if (r) this.rules = JSON.parse(r);
    const t = localStorage.getItem('formBuilderTranslations');
    if (t) this.translations = JSON.parse(t);
  } catch (e) {
    console.error('Error loading from localStorage', e);
  }
};
FormBuilder.prototype.saveForm = function() {
  this.saveToLocalStorage();
  this.showToast('فرم با موفقیت ذخیره شد', 'success');
};
FormBuilder.prototype.exportJSON = function() {
  const dataStr = JSON.stringify(this.formData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', 'form-data.json');
  document.body.appendChild(link);
  link.click();
  link.remove();
  this.showToast('فایل JSON دانلود شد', 'success');
};

// --- UI Helpers ---
FormBuilder.prototype.showToast = function(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }[type] || 'fa-info-circle';
  toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
  container.appendChild(toast);
  // animate & remove
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      try { toast.remove(); } catch (e) {}
    }, 300);
  }, 3000);
};
FormBuilder.prototype.showModal = function(title, content, footer) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalFooter = document.getElementById('modalFooter');
  if (!modal || !modalTitle || !modalBody) return;
  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  if (modalFooter && footer) modalFooter.innerHTML = footer;
  modal.classList.add('show');
};
FormBuilder.prototype.closeModal = function() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('show');
};

// --- Element Management ---
// --- اصلاح جدید: توابع مدیریت المان‌ها ---
FormBuilder.prototype.addElement = function(type) {
  const newElement = {
    id: this.generateId(),
    type: type,
    title: this.getElementDefaultTitle(type),
    name: `field_${this.generateId().substr(-6)}`,
    required: false
  };
  
  // تنظیمات پیش‌فرض برای انواع مختلف المان‌ها
  switch(type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
    case 'date':
    case 'time':
    case 'number':
      newElement.placeholder = 'متن خود را وارد کنید';
      break;
      
    case 'textarea':
      newElement.rows = 4;
      newElement.placeholder = 'متن خود را وارد کنید';
      break;
      
    case 'radio':
    case 'checkbox':
    case 'dropdown':
      newElement.options = [
        { text: 'گزینه 1', value: 'option1' },
        { text: 'گزینه 2', value: 'option2' },
        { text: 'گزینه 3', value: 'option3' }
      ];
      break;
      
    case 'rating':
      newElement.min = 1;
      newElement.max = 5;
      break;
      
    case 'slider':
      newElement.min = 0;
      newElement.max = 100;
      newElement.step = 1;
      break;
      
    case 'file':
      newElement.multiple = false;
      newElement.accept = '*';
      break;
  }
  
  if (!this.formData.elements) {
    this.formData.elements = [];
  }
  
  this.formData.elements.push(newElement);
  this.selectedElement = newElement;
  
  if (typeof this.renderFormElements === 'function') {
    this.renderFormElements();
  }
  
  if (typeof this.renderProperties === 'function') {
    this.renderProperties();
  }
  
  if (typeof this.saveToLocalStorage === 'function') {
    this.saveToLocalStorage();
  }
  
  this.showToast(`المان ${this.getElementDefaultTitle(type)} اضافه شد`, 'success');
};

FormBuilder.prototype.updateElementProperty = function(property, value) {
  if (!this.selectedElement || !property) return;
  
  this.selectedElement[property] = value;
  
  // به‌روزرسانی نام فیلد اگر عنوان تغییر کرد
  if (property === 'title' && !this.selectedElement.name) {
    this.selectedElement.name = this.generateFieldName(value);
  }
};

FormBuilder.prototype.addOption = function(elementId) {
  const element = this.formData.elements.find(e => e.id === elementId);
  if (!element || !element.options) return;
  
  const newIndex = element.options.length;
  element.options.push({
    text: `گزینه ${newIndex + 1}`,
    value: `option${newIndex + 1}`
  });
  
  if (this.selectedElement && this.selectedElement.id === elementId) {
    this.renderProperties();
  }
  
  if (typeof this.saveToLocalStorage === 'function') {
    this.saveToLocalStorage();
  }
};

FormBuilder.prototype.deleteOption = function(elementId, index) {
  const element = this.formData.elements.find(e => e.id === elementId);
  if (!element || !element.options || index < 0 || index >= element.options.length) return;
  
  element.options.splice(index, 1);
  
  if (this.selectedElement && this.selectedElement.id === elementId) {
    this.renderProperties();
  }
  
  if (typeof this.saveToLocalStorage === 'function') {
    this.saveToLocalStorage();
  }
};

FormBuilder.prototype.duplicateElement = function(elementId) {
  const elementIndex = this.formData.elements.findIndex(e => e.id === elementId);
  if (elementIndex === -1) return;
  
  const element = JSON.parse(JSON.stringify(this.formData.elements[elementIndex]));
  element.id = this.generateId();
  element.title = `${element.title} (کپی)`;
  
  this.formData.elements.splice(elementIndex + 1, 0, element);
  
  if (typeof this.renderFormElements === 'function') {
    this.renderFormElements();
  }
  
  if (typeof this.saveToLocalStorage === 'function') {
    this.saveToLocalStorage();
  }
  
  this.showToast('المان کپی شد', 'success');
};

FormBuilder.prototype.deleteElement = function(elementId) {
  const index = this.formData.elements.findIndex(e => e.id === elementId);
  if (index === -1) return;
  
  this.formData.elements.splice(index, 1);
  
  if (this.selectedElement && this.selectedElement.id === elementId) {
    this.selectedElement = null;
    if (typeof this.renderProperties === 'function') {
      this.renderProperties();
    }
  }
  
  if (typeof this.renderFormElements === 'function') {
    this.renderFormElements();
  }
  
  if (typeof this.saveToLocalStorage === 'function') {
    this.saveToLocalStorage();
  }
  
  this.showToast('المان حذف شد', 'info');
};

FormBuilder.prototype.moveElement = function(elementId, direction) {
  const index = this.formData.elements.findIndex(e => e.id === elementId);
  if (index === -1) return;
  
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  
  if (newIndex < 0 || newIndex >= this.formData.elements.length) return;
  
  const element = this.formData.elements[index];
  this.formData.elements.splice(index, 1);
  this.formData.elements.splice(newIndex, 0, element);
  
  if (typeof this.renderFormElements === 'function') {
    this.renderFormElements();
  }
  
  if (typeof this.saveToLocalStorage === 'function') {
    this.saveToLocalStorage();
  }
  
  this.showToast('موقعیت المان‌ها تغییر کرد', 'success');
};

// --- Helper Functions ---
// --- اصلاح جدید: توابع کمکی ---
FormBuilder.prototype.generateId = function() {
  return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
};

FormBuilder.prototype.generateFieldName = function(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
};

FormBuilder.prototype.getElementDefaultTitle = function(type) {
  const titles = {
    'text': 'متن تک‌خطی',
    'email': 'آدرس ایمیل',
    'phone': 'شماره تلفن',
    'url': 'آدرس وب',
    'date': 'تاریخ',
    'time': 'زمان',
    'number': 'عدد',
    'textarea': 'متن چندخطی',
    'radio': 'دکمه رادیویی',
    'checkbox': 'چک‌باکس',
    'dropdown': 'لیست کشویی',
    'rating': 'رتبه‌بندی',
    'slider': 'اسلایدر',
    'file': 'آپلود فایل',
    'signature': 'امضا',
    // ... سایر انواع ...
  };
  return titles[type] || 'سؤال جدید';
};

FormBuilder.prototype.updateUI = function() {
  if (typeof this.renderFormElements === 'function') this.renderFormElements();
  if (typeof this.renderProperties === 'function') this.renderProperties();
  // if JSON tab visible, refresh json editor
  const jsonEditor = document.getElementById('jsonEditor');
  if (jsonEditor && document.getElementById('json-tab') && document.getElementById('json-tab').classList.contains('active')) {
    this.renderJSON();
  }
};

// --- Initialize instance (expose globally) ---
const formBuilder = new FormBuilder();
window.formBuilder = formBuilder;
// important: call init AFTER prototype methods are attached (we are in core file), so safe now
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => formBuilder.init());
} else {
  formBuilder.init();
}