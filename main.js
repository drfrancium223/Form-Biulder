// ===== FormBuilder - Pure JavaScript (converted from TypeScript) =====
// All TypeScript-specific types, interfaces, and casts have been removed.

class FormBuilder {
  constructor() {
    // ===== State =====
    this.formData = {
      title: 'فرم جدید',
      description: '',
      elements: [],
      theme: 'default',
      language: 'fa',
      showProgressBar: true,
      showQuestionNumbers: true
    };

    this.selectedElement = null;
    this.draggedElement = null;
    this.draggedType = null;
    this.rules = [];
    this.translations = { fa: {}, en: {}, ar: {} };

    // For element reordering
    this.draggedElementIndex = -1;

    this.init();
  }

  // ===== Init =====
  init() {
    this.setupDragAndDrop();
    this.setupTabs();
    this.setupEventListeners();
    this.loadFromLocalStorage();
    this.updateUI();
  }

  // ===== Drag and Drop (Toolbox to Canvas) =====
  setupDragAndDrop() {
    // Setup toolbox items
    const toolboxItems = document.querySelectorAll('.toolbox-item');
    toolboxItems.forEach(item => {
      item.addEventListener('dragstart', (e) => this.handleDragStart(e));
      item.addEventListener('dragend', () => this.handleDragEnd());
    });

    // Setup drop zone
    const formContainer = document.getElementById('formElements');
    if (formContainer) {
      formContainer.addEventListener('dragover', (e) => this.handleDragOver(e));
      formContainer.addEventListener('drop', (e) => this.handleDrop(e));
      formContainer.addEventListener('dragleave', () => this.handleDragLeave());
    }

    // Empty state drop
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
      emptyState.addEventListener('dragover', (e) => this.handleDragOver(e));
      emptyState.addEventListener('drop', (e) => this.handleDrop(e));
    }
  }

  handleDragStart(e) {
    const target = e.target;
    this.draggedElement = target;
    this.draggedType = target?.dataset?.type || null;
    if (target) target.classList.add('dragging');

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', this.draggedType || '');
    }
  }

  handleDragEnd() {
    if (this.draggedElement) {
      this.draggedElement.classList.remove('dragging');
    }
    this.draggedElement = null;
    this.draggedType = null;
  }

  handleDragOver(e) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }

    const container = e.currentTarget;
    if (container) container.classList.add('drag-over');
  }

  handleDragLeave() {
    const containers = document.querySelectorAll('.drag-over');
    containers.forEach(c => c.classList.remove('drag-over'));
  }

  handleDrop(e) {
    e.preventDefault();
    const container = e.currentTarget;
    if (container) container.classList.remove('drag-over');

    if (this.draggedType) {
      this.addElement(this.draggedType);
    }
  }

  // ===== Element Management =====
  addElement(type) {
    const element = {
      id: this.generateId(),
      type,
      title: this.getDefaultTitle(type),
      name: `field_${this.formData.elements.length + 1}`,
      required: false
    };

    // Default props by type
    switch (type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        element.placeholder = 'متن خود را وارد کنید';
        break;
      case 'textarea':
        element.placeholder = 'متن خود را وارد کنید';
        element.rows = 4;
        break;
      case 'number':
        element.min = 0;
        element.max = 100;
        break;
      case 'radio':
      case 'checkbox':
      case 'dropdown':
        element.options = [
          { value: 'option1', text: 'گزینه 1' },
          { value: 'option2', text: 'گزینه 2' },
          { value: 'option3', text: 'گزینه 3' }
        ];
        break;
      case 'rating':
        element.min = 1;
        element.max = 5;
        break;
      case 'slider':
        element.min = 0;
        element.max = 100;
        element.value = 50;
        break;
      case 'file':
        element.accept = '*';
        element.multiple = false;
        break;
    }

    this.formData.elements.push(element);
    this.renderFormElements();
    this.selectElement(element);
    this.saveToLocalStorage();
    this.showToast('المان جدید اضافه شد', 'success');
  }

  getDefaultTitle(type) {
    const titles = {
      text: 'سؤال متنی',
      textarea: 'سؤال متن بلند',
      number: 'سؤال عددی',
      email: 'آدرس ایمیل',
      phone: 'شماره تلفن',
      url: 'آدرس وب',
      date: 'تاریخ',
      time: 'زمان',
      radio: 'انتخاب تکی',
      checkbox: 'انتخاب چندگانه',
      dropdown: 'لیست کشویی',
      rating: 'رتبه‌بندی',
      slider: 'اسلایدر',
      boolean: 'بله/خیر',
      file: 'آپلود فایل',
      signature: 'امضا',
      'image-picker': 'انتخاب تصویر',
      ranking: 'رتبه‌بندی آیتم‌ها',
      location: 'موقعیت مکانی',
      panel: 'پنل',
      'dynamic-panel': 'پنل پویا',
      matrix: 'ماتریکس',
      'dynamic-matrix': 'ماتریکس پویا',
      html: 'محتوای HTML',
      image: 'تصویر',
      expression: 'عبارت محاسباتی'
    };
    return titles[type] || 'سؤال جدید';
  }

  generateId() {
    return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  selectElement(element) {
    this.selectedElement = element;

    document.querySelectorAll('.form-element').forEach(el => {
      el.classList.remove('selected');
      if (el.dataset.id === element.id) {
        el.classList.add('selected');
      }
    });

    this.renderProperties();
  }

  deleteElement(elementId) {
    const index = this.formData.elements.findIndex(e => e.id === elementId);
    if (index > -1) {
      this.formData.elements.splice(index, 1);
      this.selectedElement = null;
      this.renderFormElements();
      this.renderProperties();
      this.saveToLocalStorage();
      this.showToast('المان حذف شد', 'info');
    }
  }

  duplicateElement(elementId) {
    const element = this.formData.elements.find(e => e.id === elementId);
    if (element) {
      const newElement = { ...element, id: this.generateId(), name: element.name + '_copy' };
      const index = this.formData.elements.findIndex(e => e.id === elementId);
      this.formData.elements.splice(index + 1, 0, newElement);
      this.renderFormElements();
      this.selectElement(newElement);
      this.saveToLocalStorage();
      this.showToast('المان کپی شد', 'success');
    }
  }

  moveElement(elementId, direction) {
    const index = this.formData.elements.findIndex(e => e.id === elementId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= this.formData.elements.length) return;

    const temp = this.formData.elements[index];
    this.formData.elements[index] = this.formData.elements[newIndex];
    this.formData.elements[newIndex] = temp;

    this.renderFormElements();
    this.saveToLocalStorage();
  }

  // ===== Rendering: Canvas =====
  renderFormElements() {
    const container = document.getElementById('formElements');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    if (this.formData.elements.length === 0) {
      container.innerHTML = '';
      container.classList.remove('has-elements');
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    container.classList.add('has-elements');
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = this.formData.elements.map((element, index) => `
      <div class="form-element" data-id="${element.id}" draggable="true">
        <div class="element-controls">
          <button class="element-control" data-action="duplicate" data-id="${element.id}">
            <i class="fas fa-copy"></i>
          </button>
          <button class="element-control" data-action="delete" data-id="${element.id}">
            <i class="fas fa-trash"></i>
          </button>
          <button class="element-control" data-action="moveUp" data-id="${element.id}">
            <i class="fas fa-arrow-up"></i>
          </button>
          <button class="element-control" data-action="moveDown" data-id="${element.id}">
            <i class="fas fa-arrow-down"></i>
          </button>
        </div>
        <div class="element-header">
          ${this.formData.showQuestionNumbers ? `<span class="element-number">${index + 1}</span>` : ''}
          <span class="element-title">${element.title}</span>
          ${element.required ? '<span class="required-badge">*</span>' : ''}
        </div>
        <div class="element-body">
          ${this.renderElementPreview(element)}
        </div>
      </div>
    `).join('');

    // Click + reorder DnD
    container.querySelectorAll('.form-element').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const element = this.formData.elements.find(e => e.id === id);
        if (element) this.selectElement(element);
      });

      el.addEventListener('dragstart', (e) => this.handleElementDragStart(e));
      el.addEventListener('dragover', (e) => this.handleElementDragOver(e));
      el.addEventListener('drop', (e) => this.handleElementDrop(e));
      el.addEventListener('dragend', () => this.handleElementDragEnd());
    });

    // Control buttons
    container.querySelectorAll('.element-control').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = e.currentTarget;
        const action = target?.dataset?.action;
        const id = target?.dataset?.id;
        if (!id) return;
        switch (action) {
          case 'duplicate':
            this.duplicateElement(id); break;
          case 'delete':
            this.deleteElement(id); break;
          case 'moveUp':
            this.moveElement(id, 'up'); break;
          case 'moveDown':
            this.moveElement(id, 'down'); break;
        }
      });
    });
  }

  renderElementPreview(element) {
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
        return `
          <div class="options-group">
            ${(element.options || []).map(opt => `
              <div class="option-item">
                <input type="radio" name="${element.name}" disabled>
                <label>${opt.text}</label>
              </div>
            `).join('')}
          </div>
        `;

      case 'checkbox':
        return `
          <div class="options-group">
            ${(element.options || []).map(opt => `
              <div class="option-item">
                <input type="checkbox" disabled>
                <label>${opt.text}</label>
              </div>
            `).join('')}
          </div>
        `;

      case 'dropdown':
        return `
          <select class="form-select" disabled>
            <option>انتخاب کنید...</option>
            ${(element.options || []).map(opt => `
              <option>${opt.text}</option>
            `).join('')}
          </select>
        `;

      case 'rating':
        return `
          <div class="rating-stars">
            ${Array.from({ length: element.max || 5 }, (_, i) => `
              <i class="fas fa-star rating-star ${i < 3 ? 'active' : ''}"></i>
            `).join('')}
          </div>
        `;

      case 'slider':
        return `
          <div class="slider-container">
            <input type="range" class="slider-input" min="${element.min || 0}" max="${element.max || 100}" value="${element.value || 50}" disabled>
            <span class="slider-value">${element.value || 50}</span>
          </div>
        `;

      case 'boolean':
        return `
          <div class="option-item">
            <input type="checkbox" class="toggle-switch" disabled>
            <label>بله / خیر</label>
          </div>
        `;

      case 'file':
        return `
          <div class="file-upload-area">
            <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: var(--text-muted); margin-bottom: 10px;"></i>
            <p>فایل خود را اینجا بکشید یا کلیک کنید</p>
          </div>
        `;

      case 'signature':
        return `
          <div class="signature-pad">
            <button class="btn-secondary signature-clear">پاک کردن</button>
          </div>
        `;

      case 'html':
        return `<div style="padding: 10px; background: var(--bg-secondary); border-radius: 4px;">محتوای HTML</div>`;

      case 'image':
        return `<div style="padding: 20px; background: var(--bg-secondary); border-radius: 4px; text-align: center;"><i class="fas fa-image" style="font-size: 48px; color: var(--text-muted);"></i></div>`;

      default:
        return `<div style="padding: 10px; background: var(--bg-secondary); border-radius: 4px;">${element.type}</div>`;
    }
  }

  renderProperties() {
    const container = document.getElementById('propertiesContainer');
    if (!container) return;

    if (!this.selectedElement) {
      container.innerHTML = `
        <div class="properties-empty">
          <i class="fas fa-info-circle"></i>
          <p>یک المان را انتخاب کنید تا تنظیمات آن را ببینید</p>
        </div>
      `;
      return;
    }

    const element = this.selectedElement;

    container.innerHTML = `
      <div class="property-group">
        <div class="property-group-title">تنظیمات عمومی</div>

        <div class="property-item">
          <label class="property-label">عنوان سؤال</label>
          <input type="text" class="property-input" id="prop-title" value="${element.title}">
        </div>

        <div class="property-item">
          <label class="property-label">نام فیلد</label>
          <input type="text" class="property-input" id="prop-name" value="${element.name}">
        </div>

        <div class="property-item">
          <label class="property-label">توضیحات</label>
          <textarea class="property-textarea" id="prop-description">${element.description || ''}</textarea>
        </div>

        <div class="property-item">
          <div class="property-checkbox">
            <input type="checkbox" id="prop-required" ${element.required ? 'checked' : ''}>
            <label for="prop-required">فیلد اجباری</label>
          </div>
        </div>
      </div>

      ${this.renderTypeSpecificProperties(element)}
    `;

    container.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('change', () => this.updateElementProperty(input));
    });
  }

  renderTypeSpecificProperties(element) {
    let html = '';

    if (['text', 'textarea', 'email', 'phone', 'url'].includes(element.type)) {
      html += `
        <div class="property-group">
          <div class="property-group-title">تنظیمات متن</div>
          <div class="property-item">
            <label class="property-label">متن راهنما (Placeholder)</label>
            <input type="text" class="property-input" id="prop-placeholder" value="${element.placeholder || ''}">
          </div>
        </div>
      `;
    }

    if (element.type === 'textarea') {
      html += `
        <div class="property-item">
          <label class="property-label">تعداد خطوط</label>
          <input type="number" class="property-input" id="prop-rows" value="${element.rows || 4}" min="1" max="20">
        </div>
      `;
    }

    if (['number', 'slider', 'rating'].includes(element.type)) {
      html += `
        <div class="property-group">
          <div class="property-group-title">تنظیمات عددی</div>
          <div class="property-item">
            <label class="property-label">حداقل مقدار</label>
            <input type="number" class="property-input" id="prop-min" value="${element.min || 0}">
          </div>
          <div class="property-item">
            <label class="property-label">حداکثر مقدار</label>
            <input type="number" class="property-input" id="prop-max" value="${element.max || 100}">
          </div>
        </div>
      `;
    }

    if (['radio', 'checkbox', 'dropdown'].includes(element.type)) {
      html += `
        <div class="property-group">
          <div class="property-group-title">گزینه‌ها</div>
          <div id="options-container">
            ${(element.options || []).map((opt, index) => `
              <div class="property-item" style="display: flex; gap: 5px;">
                <input type="text" class="property-input" data-option-index="${index}" value="${opt.text}" style="flex: 1;">
                <button class="btn-secondary" onclick="formBuilder.removeOption('${element.id}', ${index})" style="padding: 8px;">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            `).join('')}
          </div>
          <button class="btn-primary" onclick="formBuilder.addOption('${element.id}')" style="width: 100%; margin-top: 10px;">
            <i class="fas fa-plus"></i>
            افزودن گزینه
          </button>
        </div>
      `;
    }

    if (element.type === 'file') {
      html += `
        <div class="property-group">
          <div class="property-group-title">تنظیمات فایل</div>
          <div class="property-item">
            <label class="property-label">نوع فایل‌های مجاز</label>
            <input type="text" class="property-input" id="prop-accept" value="${element.accept || '*'}" placeholder="مثال: .pdf,.jpg,.png">
          </div>
          <div class="property-item">
            <div class="property-checkbox">
              <input type="checkbox" id="prop-multiple" ${element.multiple ? 'checked' : ''}>
              <label for="prop-multiple">امکان انتخاب چند فایل</label>
            </div>
          </div>
        </div>
      `;
    }

    return html;
  }

  updateElementProperty(input) {
    if (!this.selectedElement) return;

    const prop = input.id.replace('prop-', '');
    let value = input.type === 'checkbox' ? input.checked : input.value;

    if (prop === 'min' || prop === 'max' || prop === 'rows') {
      value = parseInt(value, 10);
    }

    if (input.dataset.optionIndex !== undefined) {
      const index = parseInt(input.dataset.optionIndex, 10);
      if (this.selectedElement.options && this.selectedElement.options[index]) {
        this.selectedElement.options[index].text = value;
      }
    } else {
      this.selectedElement[prop] = value;
    }

    this.renderFormElements();
    this.saveToLocalStorage();
  }

  addOption(elementId) {
    const element = this.formData.elements.find(e => e.id === elementId);
    if (!element || !element.options) return;

    element.options.push({
      value: `option${element.options.length + 1}`,
      text: `گزینه ${element.options.length + 1}`
    });

    this.renderProperties();
    this.renderFormElements();
    this.saveToLocalStorage();
  }

  removeOption(elementId, index) {
    const element = this.formData.elements.find(e => e.id === elementId);
    if (!element || !element.options) return;

    element.options.splice(index, 1);

    this.renderProperties();
    this.renderFormElements();
    this.saveToLocalStorage();
  }

  // ===== Element Reordering (inside canvas) =====
  handleElementDragStart(e) {
    const element = e.currentTarget;
    const id = element?.dataset?.id;
    this.draggedElementIndex = this.formData.elements.findIndex(el => el.id === id);
    if (element) element.classList.add('dragging');

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id || '');
    }
  }

  handleElementDragOver(e) {
    
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    if (e.clientY < midpoint) {
      element.style.borderTop = '2px solid var(--primary-color)';
      element.style.borderBottom = '';
    } else {
      element.style.borderBottom = '2px solid var(--primary-color)';
      element.style.borderTop = '';
    }
  }

handleElementDrop(e) {
  e.preventDefault();
  const element = e.currentTarget;
  element.style.borderTop = '';
  element.style.borderBottom = '';
  
  const targetId = element.dataset.id;
  const targetIndex = this.formData.elements.findIndex(el => el.id === targetId);
  
  if (this.draggedElementIndex === -1 || targetIndex === -1 || this.draggedElementIndex === targetIndex) {
    return;
  }
  
  // تعیین اینکه المان بالای المان هدف قرار می‌گیرد یا پایین‌تر
  const rect = element.getBoundingClientRect();
  const isBelow = e.clientY > (rect.top + rect.height / 2);
  
  // محاسبه ایندکس جدید
  let newIndex = isBelow ? targetIndex + 1 : targetIndex;
  
  // تنظیم ایندکس با توجه به حذف المان اصلی
  if (this.draggedElementIndex < newIndex) {
    newIndex--;
  }
  
  // جابجایی المان
  const [movedElement] = this.formData.elements.splice(this.draggedElementIndex, 1);
  this.formData.elements.splice(newIndex, 0, movedElement);
  
  this.renderFormElements();
  this.saveToLocalStorage();
}

  handleElementDragEnd() {
    document.querySelectorAll('.form-element').forEach(el => {
      el.classList.remove('dragging');
      el.style.borderTop = '';
      el.style.borderBottom = '';
    });
    this.draggedElementIndex = -1;
  }

  // ===== Tabs =====
  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab?.dataset?.tab;
        if (tabName) this.switchTab(tabName);
      });
    });
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });

    if (tabName === 'preview') {
      this.renderPreview();
    } else if (tabName === 'json') {
      this.renderJSON();
    } else if (tabName === 'logic') {
      this.renderLogic();
    } else if (tabName === 'translations') {
      this.renderTranslations();
    }
  }

  // ===== Preview =====
  renderPreview() {
    const frame = document.getElementById('previewFrame');
    if (!frame) return;

    frame.innerHTML = `
      <h2>${this.formData.title}</h2>
      ${this.formData.description ? `<p>${this.formData.description}</p>` : ''}
      <form>
        ${this.formData.elements.map((element, index) => `
          <div class="preview-element">
            <label>
              ${this.formData.showQuestionNumbers ? `<span>${index + 1}.</span>` : ''}
              ${element.title}
              ${element.required ? '<span style="color: red;">*</span>' : ''}
            </label>
            ${element.description ? `<p style="font-size: 12px; color: var(--text-secondary);">${element.description}</p>` : ''}
            ${this.renderElementInput(element)}
          </div>
        `).join('')}
        <button type="submit" class="btn-primary" style="margin-top: 20px;">ارسال فرم</button>
      </form>
    `;
  }

  renderElementInput(element) {
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
        return `
          <div class="options-group">
            ${(element.options || []).map(opt => `
              <div class="option-item">
                <input type="radio" name="${element.name}" value="${opt.value}" ${element.required ? 'required' : ''}>
                <label>${opt.text}</label>
              </div>
            `).join('')}
          </div>
        `;

      case 'checkbox':
        return `
          <div class="options-group">
            ${(element.options || []).map(opt => `
              <div class="option-item">
                <input type="checkbox" name="${element.name}" value="${opt.value}">
                <label>${opt.text}</label>
              </div>
            `).join('')}
          </div>
        `;

      case 'dropdown':
        return `
          <select name="${element.name}" class="form-select" ${element.required ? 'required' : ''}>
            <option value="">انتخاب کنید...</option>
            ${(element.options || []).map(opt => `
              <option value="${opt.value}">${opt.text}</option>
            `).join('')}
          </select>
        `;

      default:
        return this.renderElementPreview(element).replace(/disabled/g, '');
    }
  }

  // ===== JSON Editor =====
  renderJSON() {
    const editor = document.getElementById('jsonEditor');
    if (editor) {
      editor.value = JSON.stringify(this.formData, null, 2);
    }
  }

  formatJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;

    try {
      const json = JSON.parse(editor.value);
      editor.value = JSON.stringify(json, null, 2);
      this.showToast('JSON فرمت‌بندی شد', 'success');
    } catch (e) {
      this.showToast('خطا در پردازش JSON', 'error');
    }
  }

  validateJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;

    try {
      JSON.parse(editor.value);
      this.showToast('JSON معتبر است', 'success');
    } catch (e) {
      this.showToast('JSON نامعتبر است', 'error');
    }
  }

  applyJSON() {
    const editor = document.getElementById('jsonEditor');
    if (!editor) return;

    try {
      const json = JSON.parse(editor.value);
      this.formData = json;
      this.renderFormElements();
      this.saveToLocalStorage();
      this.showToast('تغییرات اعمال شد', 'success');
    } catch (e) {
      this.showToast('خطا در اعمال تغییرات', 'error');
    }
  }

  // ===== Logic Rules =====
  renderLogic() {
    const container = document.getElementById('rulesList');
    if (!container) return;

    if (this.rules.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted);">هیچ قانونی تعریف نشده است</p>';
      return;
    }

    container.innerHTML = this.rules.map(rule => `
      <div class="rule-item">
        <div class="rule-header">
          <span class="rule-title">قانون: ${rule.condition}</span>
          <div class="rule-actions">
            <button class="btn-secondary" onclick="formBuilder.editRule('${rule.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-secondary" onclick="formBuilder.deleteRule('${rule.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <p>عملیات: ${rule.action} - هدف: ${rule.target}</p>
      </div>
    `).join('');
  }

  addRule() {
    const rule = {
      id: this.generateId(),
      condition: 'اگر سؤال 1 برابر با مقدار خاصی باشد',
      action: 'نمایش',
      target: 'سؤال 2'
    };

    this.rules.push(rule);
    this.renderLogic();
    this.saveToLocalStorage();
    this.showToast('قانون جدید اضافه شد', 'success');
  }

  editRule(ruleId) {
    // Placeholder for editing logic UI
    this.showToast('ویرایش قانون', 'info');
  }

  deleteRule(ruleId) {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index > -1) {
      this.rules.splice(index, 1);
      this.renderLogic();
      this.saveToLocalStorage();
      this.showToast('قانون حذف شد', 'info');
    }
  }

  // ===== Translations =====
  renderTranslations() {
    const grid = document.getElementById('translationsGrid');
    if (!grid) return;

    const language = document.getElementById('languageSelect')?.value || 'fa';
    const translations = this.translations[language] || {};

    grid.innerHTML = `
      ${this.formData.elements.map(element => `
        <div class="translation-item">
          <span class="translation-key">${element.name}</span>
          <input type="text" class="translation-value"
                 data-key="${element.name}"
                 data-lang="${language}"
                 value="${translations[element.name] || element.title}"
                 placeholder="${element.title}">
        </div>
      `).join('')}
    `;

    grid.querySelectorAll('.translation-value').forEach(input => {
      input.addEventListener('change', (e) => {
        const target = e.target;
        const key = target?.dataset?.key;
        const lang = target?.dataset?.lang;
        if (key && lang) {
          if (!this.translations[lang]) this.translations[lang] = {};
          this.translations[lang][key] = target.value;
          this.saveToLocalStorage();
        }
      });
    });
  }

  // ===== Event Listeners (UI) =====
  setupEventListeners() {
    const addBtn = document.getElementById('addQuestionBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addElement('text'));
    }

    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveForm());
    }

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportJSON());
    }

    const formatBtn = document.getElementById('formatJsonBtn');
    if (formatBtn) {
      formatBtn.addEventListener('click', () => this.formatJSON());
    }

    const validateBtn = document.getElementById('validateJsonBtn');
    if (validateBtn) {
      validateBtn.addEventListener('click', () => this.validateJSON());
    }

    const applyBtn = document.getElementById('applyJsonBtn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.applyJSON());
    }

    const addRuleBtn = document.getElementById('addRuleBtn');
    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => this.addRule());
    }

    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
      langSelect.addEventListener('change', () => this.renderTranslations());
    }

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

    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        const theme = card.getAttribute('data-theme');
        if (theme) {
          this.formData.theme = theme;
          document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          this.saveToLocalStorage();
          this.showToast(`تم ${card.textContent} انتخاب شد`, 'success');
        }
      });
    });

    document.addEventListener('contextmenu', (e) => {
      const element = e.target.closest('.form-element');
      if (element) {
        e.preventDefault();
        this.showContextMenu(e.clientX, e.clientY, element.dataset.id || '');
      }
    });

    document.addEventListener('click', () => {
      this.hideContextMenu();
    });

    const modalClose = document.getElementById('modalClose');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.closeModal());
    }
  }

  // ===== Context Menu =====
  showContextMenu(x, y, elementId) {
    const menu = document.getElementById('contextMenu');
    if (!menu) return;

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.add('show');

    menu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = e.currentTarget?.dataset?.action;
        switch (action) {
          case 'duplicate':
            this.duplicateElement(elementId); break;
          case 'delete':
            this.deleteElement(elementId); break;
          case 'required':
            this.toggleRequired(elementId); break;
          case 'moveUp':
            this.moveElement(elementId, 'up'); break;
          case 'moveDown':
            this.moveElement(elementId, 'down'); break;
        }
        this.hideContextMenu();
      });
    });
  }

  hideContextMenu() {
    const menu = document.getElementById('contextMenu');
    if (menu) menu.classList.remove('show');
  }

  toggleRequired(elementId) {
    const element = this.formData.elements.find(e => e.id === elementId);
    if (element) {
      element.required = !element.required;
      this.renderFormElements();
      if (this.selectedElement?.id === elementId) {
        this.renderProperties();
      }
      this.saveToLocalStorage();
    }
  }

  // ===== Storage =====
  saveToLocalStorage() {
    try {
      localStorage.setItem('formBuilderData', JSON.stringify(this.formData));
      localStorage.setItem('formBuilderRules', JSON.stringify(this.rules));
      localStorage.setItem('formBuilderTranslations', JSON.stringify(this.translations));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('formBuilderData');
      if (data) {
        this.formData = JSON.parse(data);
      }

      const rules = localStorage.getItem('formBuilderRules');
      if (rules) {
        this.rules = JSON.parse(rules);
      }

      const translations = localStorage.getItem('formBuilderTranslations');
      if (translations) {
        this.translations = JSON.parse(translations);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }

  saveForm() {
    this.saveToLocalStorage();
    this.showToast('فرم با موفقیت ذخیره شد', 'success');
  }

  exportJSON() {
    const dataStr = JSON.stringify(this.formData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = 'form-data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    this.showToast('فایل JSON دانلود شد', 'success');
  }

  // ===== UI Helpers =====
  showToast(message, type = 'info') {
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

    toast.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  showModal(title, content, footer) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    if (modal && modalTitle && modalBody) {
      modalTitle.textContent = title;
      modalBody.innerHTML = content;
      if (modalFooter && footer) {
        modalFooter.innerHTML = footer;
      }
      modal.classList.add('show');
    }
  }

  closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
      modal.classList.remove('show');
    }
  }

  updateUI() {
    this.renderFormElements();
    this.renderProperties();
  }
}

// Initialize the form builder and expose globally for inline handlers
const formBuilder = new FormBuilder();
window.formBuilder = formBuilder;
