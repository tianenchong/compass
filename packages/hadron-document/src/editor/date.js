const TypeChecker = require('hadron-type-checker');
const Element = require('../element');
const { fieldStringLen } = require('../utils');
const StandardEditor = require('./standard');

/**
 * CRUD editor for date values.
 */
class DateEditor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }

  /**
   * Complete the date edit by converting the valid string to a date
   * object or leaving as invalid.
   */
  complete() {
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(TypeChecker.cast(this._formattedValue(), 'Date'));
    }
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    try {
      const date = TypeChecker.cast(value, 'Date');
      if (date.toString() === 'Invalid Date') {
        this.element.setInvalid(value, 'Date', `${value} is not in a valid date format`);
      } else {
        this.element.currentValue = value;
        this.element.setValid();
        this.element._bubbleUp(Element.Events.Edited);
      }
    } catch (e) {
      this.element.setInvalid(value, this.element.currentType, e.message);
    }
  }

  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size(editMode) {
    const value = this.element.currentValue;
    if (editMode) {
      return fieldStringLen(value);
    }
    return this.element.isCurrentTypeValid() ? fieldStringLen(this._formattedValue()) : fieldStringLen(value);
  }

  /**
   * Start the date edit.
   *
   * @param {Object} value - The value in the field.
   */
  start() {
    if (this.element.isCurrentTypeValid()) {
      this.edit(this._formattedValue());
    }
  }

  /**
   * Get the value being edited.
   *
   * @param {Boolean} editMode - If the UI is in edit mode.
   *
   * @returns {String} The value.
   */
  value(editMode) {
    const value = this.element.currentValue;
    if (!editMode && this.element.isCurrentTypeValid()) {
      return this._formattedValue();
    }
    return value;
  }

  _formattedValue() {
    return new Date(this.element.currentValue).toISOString().replace('Z', '+00:00');
  }
}

module.exports = DateEditor;
