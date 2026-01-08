define([
  'jquery',
  '../modern-keys',
  '../utils',
], function ($, KEYS, Utils) {
  function AllowClear () { }

  AllowClear.prototype.bind = function (decorated, container, $container) {
    var self = this;

    decorated.call(this, container, $container);

    if (this.placeholder == null) {
      if (this.options.get('debug') && window.console && console.error) {
        console.error(
          'Select2: The `allowClear` option should be used in combination ' +
          'with the `placeholder` option.'
        );
      }
    }

    const attachClickTo = this.options.get('multiple') ? this.$selection : container.$container;
    attachClickTo.on('click', '.select2-selection__clear',
      function (evt) {
        container._clearButtonActivated = true;
        self._handleClear(evt);
    });

    container.on('keypress', function (evt) {
      if (evt.key == KEYS.DELETE || evt.key == KEYS.BACKSPACE) {
        container._clearButtonActivated = true;
      }
      self._handleKeyboardClear(evt, container);
    });
  };

  AllowClear.prototype._handleClear = function (_, evt) {
    // Ignore the event if it is disabled
    if (this.isDisabled()) {
      return;
    }

    const parent = this.options.get('multiple') ? this.$selection : this.$selection.parent('.selection');
    var $clear = parent.find('.select2-selection__clear')

    // Ignore the event if nothing has been selected
    if ($clear.length === 0) {
      return;
    }

    evt.stopPropagation();

    var data = Utils.GetData($clear[0], 'data');

    var previousVal = this.$element.val();
    this.$element.val(this.placeholder.id);

    var unselectData = {
      data: data
    };
    this.trigger('clear', unselectData);
    if (unselectData.prevented) {
      this.$element.val(previousVal);
      return;
    }

    for (var d = 0; d < data.length; d++) {
      unselectData = {
        data: data[d],
        clearing: true
      };

      // Trigger the `unselect` event, so people can prevent it from being
      // cleared.
      this.trigger('unselect', unselectData);

      // If the event was prevented, don't clear it out.
      if (unselectData.prevented) {
        this.$element.val(previousVal);
        return;
      }
    }

    this.$element.trigger('input').trigger('change');

    this.trigger('toggle', {});
  };

  AllowClear.prototype._handleKeyboardClear = function (_, evt, container) {
    if (container.isOpen()) {
      return;
    }

    if (evt.key == KEYS.DELETE || evt.key == KEYS.BACKSPACE) {
      this._handleClear(evt);
    }
  };

  AllowClear.prototype.update = function (decorated, data) {
    decorated.call(this, data);

    if (this.$selection.find('.select2-selection__placeholder').length > 0 ||
        data.length === 0) {
      return;
    }

    var removeAll = this.options.get('translations').get('removeAllItems');
    var removeAllLabel  = this.options.get('removeAllLabel');
    var title = removeAllLabel ? removeAllLabel : removeAll();

    var $remove = $(
      `<button type="button" class="select2-selection__clear" aria-label="${title}">
        <span aria-hidden="true" class="select2-clear-icon">&times;</span>
      </button>`
    );

    $remove.attr('title', title);
    var self = this;
    $remove.on('focus', function (evt) {
      // remove focus from 'combobox' if clear button is focused
      self.container.trigger('blur', evt);
    });

    Utils.StoreData($remove[0], 'data', data);

    const clearParent = this._getClearParentForInsert();
    // Remove any existing clear buttons first to prevent duplicates
    clearParent.find('.select2-selection__clear').remove();
    // prepend in the original location for multiple select
    // and append above "combobox" role so screen readers read it without remove button label
    this.options.get('multiple') ? clearParent.prepend($remove) : clearParent.append($remove)
  };


  AllowClear.prototype._getClearParentForInsert = function () {
    if (this.options.get('multiple')) {
      return this.$selection.find('.select2-selection__rendered');
    }

    return this.$selection.parent('.selection');
  };

  return AllowClear;
});
