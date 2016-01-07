var STYLEV = STYLEV || {};

STYLEV.popup = {
	execute: function() {

		var that = this;
		that.setParameters();
		that.bindEvents();
		that.modifyValue();
	},
	setParameters: function() {

		var that = this;

		that.formParts = document.querySelectorAll('.popup-form-parts');
		that.isFirst = true;
		that.options = {};
	},
	bindEvents: function() {

		var that = this;

		for(var i = 0, len = that.formParts.length; i < len; i++) {

			var target = that.formParts[i];

			target.addEventListener('keyup', that.modifyValue.bind(that), false);
			target.addEventListener('blur', that.modifyValue.bind(that), false);
			target.addEventListener('change', that.modifyValue.bind(that), false);
		}
	},
	modifyValue: function() {

		var that = this;

		for(var i = 0, len = that.formParts.length; i < len; i++) {

			var target = that.formParts[i];
			var type = target.type;
			var id = target.id;
			var checkbox = type === 'radio' || type === 'checkbox';
			var textbox = type === 'text';
			var isChecked = checkbox ? target.checked : false;
			var name = target.name;
			var value = target.value;

			if(localStorage.getItem(id) !== null && that.isFirst) {

				if(checkbox) {

					target.checked = !!(localStorage.getItem(id) === 'true');
				}
				if(textbox) {

					target.value = localStorage.getItem(id);
				}

			} else {

				if(checkbox) {

					that.options[id] = isChecked;
					localStorage.setItem(id, isChecked);
				}
				if(textbox) {

					that.options[id] = value;
					localStorage.setItem(id, value);
				}
			}


			if(id === 'scopeSelectors' || id === 'ignoreSelectors') {

				var defineBox = document.querySelector('#' + id + 'Text');
				defineBox.disabled = !isChecked;
			}
		}

		//初期表示を終わりクリックした時
		if(!that.isFirst) {
			chrome.storage.sync.set({'options': that.options});
		}

		that.isFirst = false;
	}
};
STYLEV.popup.execute();