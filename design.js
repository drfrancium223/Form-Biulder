// ===== formbuilder.design.js =====
// Design part: UI, Drag & Drop, element rendering and properties panel
// --- Render Form Elements ---
FormBuilder.prototype.renderFormElements = function() {
  const container = document.getElementById('formElements');
  const emptyState = document.getElementById('emptyState');
  
  if (!container) return;
  
  // نمایش حالت خالی اگر المانی وجود نداشته باشد
  if (!this.formData.elements || this.formData.elements.length === 0) {
    container.classList.remove('has-elements');
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }
  
  // نمایش المان‌ها
  container.innerHTML = this.formData.elements.map(element => `
    <div class="form-element ${this.selectedElement && this.selectedElement.id === element.id ? 'selected' : ''}" 
         data-id="${element.id}" draggable="true">
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
        <span class="element-number">${this.formData.showQuestionNumbers ? this.formData.elements.indexOf(element) + 1 : ''}</span>
        <span class="element-title">${element.title || 'بدون عنوان'}</span>
        ${element.required ? '<span class="required-badge">*</span>' : ''}
      </div>
      <div class="element-body">
        ${this.renderElementPreview(element)}
      </div>
    </div>
  `).join('');
  
  container.classList.add('has-elements');
  if (emptyState) emptyState.style.display = 'none';
  
  // افزودن رویدادهای لازم به المان‌ها
  this.setupElementEvents();
};

// --- Element Preview ---


// --- Properties Panel ---
FormBuilder.prototype.renderProperties = function() {
  if (!this.selectedElement) {
    document.getElementById('propertiesContainer').innerHTML = `
      <div class="properties-empty">
        <i class="fas fa-info-circle"></i>
        <p>یک المان را انتخاب کنید تا تنظیمات آن را ببینید</p>
      </div>
    `;
    return;
  }

  const element = this.selectedElement;
  const container = document.getElementById('propertiesContainer');
  
  if (!container) return;
  
  // ساختار اصلی پنل تنظیمات
  let html = `
    <div class="property-group">
      <div class="property-group-title">تنظیمات اصلی</div>
      <div class="property-item">
        <label class="property-label">عنوان سؤال</label>
        <input type="text" class="property-input" value="${element.title || ''}" 
               data-property="title" placeholder="عنوان سؤال را وارد کنید">
      </div>
      <div class="property-item">
        <label class="property-label">توضیحات</label>
        <textarea class="property-textarea" data-property="description" 
                  placeholder="توضیحات اختیاری">${element.description || ''}</textarea>
      </div>
      <div class="property-item property-checkbox">
        <input type="checkbox" id="required-${element.id}" ${element.required ? 'checked' : ''} 
               data-property="required">
        <label for="required-${element.id}">اجباری</label>
      </div>
      ${element.placeholder ? `
      <div class="property-item">
        <label class="property-label">متن نمونه</label>
        <input type="text" class="property-input" value="${element.placeholder || ''}" 
               data-property="placeholder" placeholder="متن نمونه">
      </div>
      ` : ''}
    </div>
  `;
  
  // تنظیمات خاص برای انواع مختلف المان‌ها
  switch(element.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
    case 'date':
    case 'time':
    case 'number':
      html += `
        <div class="property-group">
          <div class="property-group-title">تنظیمات ورودی</div>
          <div class="property-item">
            <label class="property-label">نام فیلد</label>
            <input type="text" class="property-input" value="${element.name || ''}" 
                   data-property="name" placeholder="نام فیلد">
          </div>
        </div>
      `;
      break;
      
    case 'textarea':
      html += `
        <div class="property-group">
          <div class="property-group-title">تنظیمات ورودی</div>
          <div class="property-item">
            <label class="property-label">تعداد خطوط</label>
            <input type="number" class="property-input" value="${element.rows || 4}" 
                   data-property="rows" min="2" max="20">
          </div>
          <div class="property-item">
            <label class="property-label">نام فیلد</label>
            <input type="text" class="property-input" value="${element.name || ''}" 
                   data-property="name" placeholder="نام فیلد">
          </div>
        </div>
      `;
      break;
      
    case 'radio':
    case 'checkbox':
    case 'dropdown':
      html += `
        <div class="property-group">
          <div class="property-group-title">گزینه‌ها</div>
          <div class="property-item">
            <label class="property-label">گزینه‌ها</label>
            <div id="optionsContainer">
              ${(element.options || []).map((opt, index) => `
                <div class="option-item" style="display:flex; gap:5px; margin-bottom:5px;">
                  <input type="text" class="property-input" value="${opt.text}" 
                         data-option-index="${index}" data-option-prop="text" 
                         placeholder="متن گزینه" style="flex:1;">
                  <input type="text" class="property-input" value="${opt.value}" 
                         data-option-index="${index}" data-option-prop="value" 
                         placeholder="مقدار" style="width:100px;">
                  <button class="btn-secondary" style="width:30px;" 
                          onclick="formBuilder.deleteOption('${element.id}', ${index})">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              `).join('')}
              <button class="btn-secondary" style="margin-top:10px;" 
                      onclick="formBuilder.addOption('${element.id}')">
                <i class="fas fa-plus"></i> افزودن گزینه
              </button>
            </div>
          </div>
          <div class="property-item">
            <label class="property-label">نام فیلد</label>
            <input type="text" class="property-input" value="${element.name || ''}" 
                   data-property="name" placeholder="نام فیلد">
          </div>
        </div>
      `;
      break;
      
    case 'rating':
      html += `
        <div class="property-group">
          <div class="property-group-title">تنظیمات رتبه‌بندی</div>
          <div class="property-item">
            <label class="property-label">حداقل امتیاز</label>
            <input type="number" class="property-input" value="${element.min || 1}" 
                   data-property="min" min="1" max="10">
          </div>
          <div class="property-item">
            <label class="property-label">حداکثر امتیاز</label>
            <input type="number" class="property-input" value="${element.max || 5}" 
                   data-property="max" min="2" max="10">
          </div>
          <div class="property-item">
            <label class="property-label">نام فیلد</label>
            <input type="text" class="property-input" value="${element.name || ''}" 
                   data-property="name" placeholder="نام فیلد">
          </div>
        </div>
      `;
      break;
      
    case 'slider':
      html += `
        <div class="property-group">
          <div class="property-group-title">تنظیمات اسلایدر</div>
          <div class="property-item">
            <label class="property-label">حداقل مقدار</label>
            <input type="number" class="property-input" value="${element.min || 0}" 
                   data-property="min">
          </div>
          <div class="property-item">
            <label class="property-label">حداکثر مقدار</label>
            <input type="number" class="property-input" value="${element.max || 100}" 
                   data-property="max">
          </div>
          <div class="property-item">
            <label class="property-label">گام</label>
            <input type="number" class="property-input" value="${element.step || 1}" 
                   data-property="step" min="1">
          </div>
          <div class="property-item">
            <label class="property-label">نام فیلد</label>
            <input type="text" class="property-input" value="${element.name || ''}" 
                   data-property="name" placeholder="نام فیلد">
          </div>
        </div>
      `;
      break;
  }
  
  container.innerHTML = html;
  
  // اضافه کردن رویدادهای تغییرات
  container.querySelectorAll('[data-property]').forEach(input => {
    input.addEventListener('change', (e) => {
      const prop = e.target.dataset.property;
      let value = e.target.value;
      
      // تبدیل به عدد برای برخی از مقادیر
      if (prop === 'rows' || prop === 'min' || prop === 'max' || prop === 'step') {
        value = parseInt(value) || 0;
      }
      
      // تبدیل چک‌باکس‌ها
      if (e.target.type === 'checkbox') {
        value = e.target.checked;
      }
      
      this.updateElementProperty(prop, value);
      this.updateUI();
    });
  });
};

// --- Element Events ---
FormBuilder.prototype.setupElementEvents = function() {
  // انتخاب المان‌ها
  document.querySelectorAll('.form-element').forEach(element => {
    element.addEventListener('click', (e) => {
      // جلوگیری از انتخاب هنگام کلیک روی دکمه‌های کنترل
      if (e.target.closest('.element-controls')) return;
      
      const elementId = element.dataset.id;
      const elementData = this.formData.elements.find(el => el.id === elementId);
      
      if (elementData) {
        this.selectedElement = elementData;
        if (typeof this.renderProperties === 'function') {
          this.renderProperties();
        }
        
        // به‌روزرسانی کلاس‌ها
        document.querySelectorAll('.form-element').forEach(el => {
          el.classList.remove('selected');
        });
        element.classList.add('selected');
      }
    });
    
    // دکمه‌های کنترل
    element.querySelectorAll('.element-control').forEach(control => {
      control.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = control.dataset.action;
        const elementId = control.dataset.id;
        
        switch(action) {
          case 'duplicate':
            this.duplicateElement(elementId);
            break;
          case 'delete':
            this.deleteElement(elementId);
            break;
          case 'moveUp':
            this.moveElement(elementId, 'up');
            break;
          case 'moveDown':
            this.moveElement(elementId, 'down');
            break;
        }
      });
    });
  });
};

// --- Drag & Drop ---
FormBuilder.prototype.setupDragAndDrop = function() {
  // Drag & Drop برای جعبه ابزار
  const toolboxItems = document.querySelectorAll('.toolbox-item');
  toolboxItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('elementType', item.dataset.type);
      item.classList.add('dragging');
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
  });
  
  // Drag & Drop برای ناحیه طراحی
  const formContainer = document.getElementById('formContainer');
  const formElements = document.getElementById('formElements');
  
  if (formContainer) {
    formContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    
    formContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      
      const elementType = e.dataTransfer.getData('elementType');
      if (elementType) {
        this.addElement(elementType);
      }
    });
  }
  
  if (formElements) {
    // Drag & Drop برای تغییر ترتیب المان‌ها
    let draggedItem = null;
    
    formElements.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('form-element')) {
        draggedItem = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      }
    });
    
    formElements.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(formElements, e.clientY);
      const draggable = document.querySelector('.form-element.dragging');
      
      if (afterElement == null) {
        formElements.appendChild(draggable);
      } else {
        formElements.insertBefore(draggable, afterElement);
      }
    });
    
    formElements.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (draggedItem) {
        const elements = Array.from(formElements.querySelectorAll('.form-element'));
        const newOrder = elements.map(el => el.dataset.id);
        
        // به‌روزرسانی ترتیب المان‌ها در formData
        this.formData.elements = newOrder.map(id => 
          this.formData.elements.find(el => el.id === id)
        );
        
        draggedItem.classList.remove('dragging');
        draggedItem = null;
        
        if (typeof this.saveToLocalStorage === 'function') {
          this.saveToLocalStorage();
        }
        
        this.showToast('ترتیب المان‌ها تغییر کرد', 'success');
      }
    });
    
    formElements.addEventListener('dragend', () => {
      if (draggedItem) {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
      }
    });
  }
};

// --- Drag & Drop Helper ---
FormBuilder.prototype.getDragAfterElement = function(container, y) {
  const draggableElements = [...container.querySelectorAll('.form-element:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
};

// --- Context Menu ---
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

// --- Initialize Design Part ---
document.addEventListener('DOMContentLoaded', function() {
  if (typeof formBuilder !== 'undefined') {
    // افزودن رویدادهای طراحی
    formBuilder.setupDragAndDrop();
    
    // رندر اولیه المان‌ها
    if (typeof formBuilder.renderFormElements === 'function') {
      formBuilder.renderFormElements();
    }
    
    // رندر پنل تنظیمات اگر المانی انتخاب شده باشد
    if (formBuilder.selectedElement && typeof formBuilder.renderProperties === 'function') {
      formBuilder.renderProperties();
    }
  }
});