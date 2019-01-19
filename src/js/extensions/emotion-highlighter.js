(function () {
    'use strict';

    var EmotionHighlighter = MediumEditor.extensions.form.extend({

        name: 'emotion-highlighter',

        aria: 'Emotion Highlighter',
        action: 'emotion-highlight',
        tagNames: ['mark'],
        contentDefault: '<b>EMOTION</b>',
        contentFA: '<i class="fa fa-smile-o" style="font-size:24px;letter-spacing:4px;"></i>' +
                   '<i class="fa fa-meh-o" style="font-size:24px;letter-spacing:4px;"></i>' +
                   '<i class="fa fa-frown-o" style="font-size:24px;"></i>',

        emotions: {
            'levels': ['global', 'intermediate', 'specific'],
            'emotions': {
                'benevolence': {
                    'emotions': {
                        'affection': {
                            'emotions': {
                                'love': {
                                },
                                'desire': {
                                },
                                'admiration': {
                                },
                                'attraction': {
                                }
                            }
                        },
                        'kindness': {
                            'emotions': {
                                'goodness': {
                                },
                                'sweetness': {
                                },
                                'patience': {
                                },
                                'humility': {
                                }
                            }
                        }
                    }
                },
                'malevolence': {
                    'emotions': {
                        'hate': {
                            'emotions': {
                                'resentment': {
                                },
                                'disgust': {
                                },
                                'contempt': {
                                },
                                'irritation': {
                                }
                            }
                        },
                        'aggressiveness': {
                            'emotions': {
                                'cruelty': {
                                },
                                'rage': {
                                },
                                'ire': {
                                },
                                'arrogance': {
                                }
                            }
                        }
                    }
                },
                'comfort': {
                    'emotions': {
                        'happiness': {
                            'emotions': {
                                'happy': {
                                },
                                'pleasure': {
                                },
                                'laugh': {
                                }
                            }
                        },
                        'lucidity': {
                            'emotions': {
                                'mental_health': {
                                },
                                'balance': {
                                }
                            }
                        },
                        'enthusiasm': {
                            'emotions': {
                                'joy': {
                                },
                                'vivacity': {
                                },
                                'alert': {
                                }
                            }
                        },
                        'relief': {
                            'emotions': {
                                'appease': {
                                },
                                'freedom': {
                                }
                            }
                        },
                        'satisfaction': {
                            'emotions': {
                                'esteem': {
                                },
                                'satiety': {
                                },
                                'like': {
                                }
                            }
                        }
                    }
                },
                'discomfort': {
                    'emotions': {
                        'suffering': {
                            'emotions': {
                                'drama': {
                                },
                                'pain': {
                                },
                                'cry': {
                                }
                            }
                        },
                        'madness': {
                            'emotions': {
                                'mental_disease': {
                                },
                                'imbalance': {
                                }
                            }
                        },
                        'depression': {
                            'emotions': {
                                'sadness': {
                                },
                                'fatigue': {
                                },
                                'apathy': {
                                }
                            }
                        },
                        'disturbance': {
                            'emotions': {
                                'agitation': {
                                },
                                'remorse': {
                                }
                            }
                        },
                        'dissatisfaction': {
                            'emotions': {
                                'humiliation': {
                                },
                                'frustration': {
                                },
                                'dislike': {
                                }
                            }
                        }
                    }
                },
                'safety': {
                    'emotions': {
                        'courage': {
                            'emotions': {
                                'audacity': {
                                },
                                'extroversion': {
                                }
                            }
                        },
                        'calm': {
                            'emotions': {
                                'tranquility': {
                                },
                                'relaxation': {
                                }
                            }
                        }
                    }
                },
                'anxiety': {
                    'emotions': {
                        'fear': {
                            'emotions': {
                                'dread': {
                                },
                                'introversion': {
                                }
                            }
                        },
                        'tension': {
                            'emotions': {
                                'anguish': {
                                },
                                'concern': {
                                }
                            }
                        }
                    }
                },
                'surprise': {
                },
                'indifference': {
                },
                'non_specific': {
                }
            }
        },

        _selection: [],

        init: function () {
            MediumEditor.extensions.form.prototype.init.apply(this, arguments);

            rangy.init(); // jshint ignore:line
        },

        handleClick: function (event) {
            event.preventDefault();
            event.stopPropagation();

            var range = MediumEditor.selection.getSelectionRange(this.document);

            if (range.startContainer.nodeName.toLowerCase() === 'mark' ||
                range.endContainer.nodeName.toLowerCase() === 'mark' ||
                MediumEditor.util.getClosestTag(MediumEditor.selection.getSelectedParentElement(range), 'mark')) {

                var mark;
                if ((mark = range.startContainer).nodeName.toLowerCase() === 'mark') {
                    this._removeEmotionHighlight(mark);
                }
                if ((mark = range.endContainer).nodeName.toLowerCase() === 'mark') {
                    this._removeEmotionHighlight(mark);
                }
                if ((mark = MediumEditor.util.getClosestTag(MediumEditor.selection.getSelectedParentElement(range), 'mark'))) {
                    this._removeEmotionHighlight(mark);
                }

                this.setInactive();

                return false;
            }

            var selectedMarks = MediumEditor.selection.getSelectedElements(this.document).filter(function (el) {
                return el.nodeName.toLowerCase() === 'mark';
            });
            selectedMarks.forEach(function (el) {
                MediumEditor.util.unwrap(el, this.document);

                // Ensure the editor knows about an html change so watchers are notified
                // ie: <textarea> elements depend on the editableInput event to stay synchronized
                this.base.checkContentChanged();
            }.bind(this));

            if (!this.isDisplayed()) {
                this.showForm();
            }

            this.setToolbarPosition();

            return false;
        },

        // Called when user hits the defined shortcut (CTRL / COMMAND + E)
        handleKeydown: function (event) {
            if (MediumEditor.util.isKey(event, MediumEditor.util.keyCode.E) && MediumEditor.util.isMetaCtrlKey(event) && !event.shiftKey) {
                this.handleClick(event);
            }
        },

        getForm: function () {
            if (!this.form) {
                this.form = this.createForm();
            }
            return this.form;
        },

        getTemplate: function () {
            var template = [],
                emotionsKeys = Object.keys(this._getCurrentSelectedEmotionObj().emotions);

            for (var i = 0; i < emotionsKeys.length; i++) {
                var emotion = emotionsKeys[i],
                    readableName = this._getEmotionLabel(emotion, this._selection),
                    classNames = 'medium-editor-action medium-editor-action-emotion';

                if (i === 0) { // is first?
                    classNames += ' medium-editor-button-first';
                }

                if (i === emotionsKeys.length - 1) { // is last?
                    classNames += ' medium-editor-button-last';
                }

                template.push(
                    '<li>',
                        '<button data-emotion="' + emotion + '" class="' + classNames + '" title="' + readableName + '">',
                            '<b>',
                                readableName,
                            '</b>',
                        '</button>',
                    '</li>'
                );
            }

            return template.join('');
        },

        isDisplayed: function () {
            return MediumEditor.extensions.form.prototype.isDisplayed.apply(this);
        },

        hideForm: function () {
            MediumEditor.extensions.form.prototype.hideForm.apply(this);

            this._selection = [];
        },

        showForm: function (opts) {
            opts = opts || { selection: [] };
            // TODO: This is for backwards compatability
            // We don't need to support the 'string' argument in 6.0.0
            if (typeof opts === 'string') {
                opts = {
                    value: opts
                };
            }

            this._selection = [];

            this.base.saveSelection();
            this.hideToolbarDefaultActions();

            if (this.hasForm) {
                this._resetForm();
            }

            MediumEditor.extensions.form.prototype.showForm.apply(this);

            this.setToolbarPosition();
        },

        // Called by core when tearing down medium-editor (destroy)
        destroy: function () {
            if (!this.form) {
                return false;
            }

            if (this.form.parentNode) {
                this.form.parentNode.removeChild(this.form);
            }

            delete this.form;
        },

        // core methods

        _getFormOpts: function () {
            // no notion of private functions? wanted `_getFormOpts`

            var opts = {
                selection: this._selection.slice()
            };

            return opts;
        },

        doFormSave: function () {
            var opts = this._getFormOpts();
            this.completeFormSave(opts);
        },

        completeFormSave: function (opts) {
            this.base.restoreSelection();

            var elementAttrs = {},
                labels = [];

            for (var i = 0; i < opts.selection.length; i++) {
                var emotion = opts.selection[i];
                elementAttrs['data-' + this.emotions.levels[i]] = emotion;
                labels.push(this._getEmotionLabel(emotion, opts.selection.slice(0, i)));
            }

            elementAttrs['data-preview'] = labels.join(' > ');

            rangy.createClassApplier('emotion-highlight', { // jshint ignore:line
                elementTagName: 'mark',
                elementAttributes: elementAttrs,
                normalize: true
            }).toggleSelection();

            // Ensure the editor knows about an html change so watchers are notified
            // ie: <textarea> elements depend on the editableInput event to stay synchronized
            this.base.checkContentChanged();

            this.base.checkSelection();

            this._selection = [];

            this.setActive();
        },

        doFormCancel: function () {
            this.base.restoreSelection();
            this.base.checkSelection();

            this._selection = [];
        },

        // form creation and event handling
        attachFormEvents: function (form) {
            var emotionBtns = form.querySelectorAll('button.medium-editor-action-emotion');

            // Handle clicks on the form itself
            this.on(form, 'click', this.handleFormClick.bind(this));

            emotionBtns.forEach(function (btn) {

                // Handle emotions' buttons clicks
                this.on(btn, 'click', this.handleEmotionButtonClick.bind(this));
            }.bind(this));
        },

        createForm: function () {
            var doc = this.document,
                form = doc.createElement('ul');

            // Emotion Highlighter Form (div)
            form.className = 'medium-editor-toolbar-actions medium-editor-toolbar-form emotion-selector';
            form.id = 'medium-editor-toolbar-form-emotion-' + this.getEditorId();
            form.setAttribute('data-level', this.emotions.levels[this._selection.length]);
            form.innerHTML = this.getTemplate();
            this.attachFormEvents(form);
            this.setToolbarPosition();

            return form;
        },

        getEmotionButtons: function () {
            return this.getForm().querySelectorAll('button.medium-editor-toolbar-emotion');
        },

        handleEmotionButtonClick: function (event) {
            event.preventDefault();

            var emotionStr = event.target.getAttribute('data-emotion');

            if (!emotionStr) {
                event.stopPropagation();
                return false;
            }

            // add selection
            this._selection.push(emotionStr);

            // show next selection step or highlight
            if (this._selection.length >= this.emotions.levels.length) {
                this.doFormSave();
                return true;
            }

            var emotion = this._getCurrentSelectedEmotionObj();

            if (!emotion.emotions) {
                this.doFormSave();
                return true;
            }

            // make sure not to hide form when clicking inside the form
            event.stopPropagation();

            this._resetForm();
        },

        handleFormClick: function (event) {
            // make sure not to hide form when clicking inside the form
            event.stopPropagation();
        },

        _getEmotionObj: function (levels) {
            var emotion = Object.assign({}, this.emotions);
            for (var i = 0; i < levels.length; i++) {
                var emotionKey = levels[i];
                emotion = emotion.emotions[emotionKey];
            }

            return emotion;
        },

        _getCurrentSelectedEmotionObj: function () {
            return this._getEmotionObj(this._selection);
        },

        _resetForm: function () {
            var form = document.querySelector('#medium-editor-toolbar-form-emotion-' + this.getEditorId());
            form.setAttribute('data-level', this.emotions.levels[this._selection.length]);
            form.innerHTML = this.getTemplate();
            this.attachFormEvents(form);
            this.setToolbarPosition();
        },

        _removeEmotionHighlight: function (el) {
            var elementAttrs = {};
            this.emotions.levels.forEach(function (level) {
                elementAttrs['data-' + level] = el.getAttribute('data-' + level);
            });
            elementAttrs['data-preview'] = el.getAttribute('data-preview');

            rangy.createClassApplier('emotion-highlight', { // jshint ignore:line
                elementTagName: 'mark',
                elementAttributes: elementAttrs,
                normalize: true
            }).toggleSelection();

            // Ensure the editor knows about an html change so watchers are notified
            // ie: <textarea> elements depend on the editableInput event to stay synchronized
            this.base.checkContentChanged();
        },

        _getEmotionLabel: function (emotion, parents) {

            if (!parents) {
                parents = [];
            }

            var levels = parents.slice();
            levels.push(emotion);

            var emotionObj = this._getEmotionObj(levels);

            return emotionObj.label || this._toTitle(emotion);
        },

        _toTitle: function (str) {
            return str.replace(/_/g, ' ').replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }
    });

    MediumEditor.extensions.emotionHighlighter = EmotionHighlighter;
}());

