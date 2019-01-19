(function () {
    'use strict';

    var EmotionPreview = MediumEditor.Extension.extend({
        name: 'emotion-preview',

        // Emotion Preview Options

        /* hideDelay: [number]
         * time in milliseconds to show the mark tag preview after the mouse has left the mark tag.
         */
        hideDelay: 500,

        /* previewValueSelector: [string]
         * the default selector to locate where to put the activeMark value in the preview
         */
        previewValueSelector: 'span',

        /* showWhenToolbarIsVisible: [boolean]
         * determines whether the emotion preview shows up when the toolbar is visible
         */
        showWhenToolbarIsVisible: false,

        init: function () {
            this.emotionPreview = this.createPreview();

            this.getEditorOption('elementsContainer').appendChild(this.emotionPreview);

            this.attachToEditables();
        },

        getInteractionElements: function () {
            return this.getPreviewElement();
        },

        // TODO: Remove this function in 6.0.0
        getPreviewElement: function () {
            return this.emotionPreview;
        },

        createPreview: function () {
            var el = this.document.createElement('div');

            el.id = 'medium-editor-emotion-preview-' + this.getEditorId();
            el.className = 'medium-editor-emotion-preview';
            el.innerHTML = this.getTemplate();

            this.on(el, 'click', this.handleClick.bind(this));

            return el;
        },

        getTemplate: function () {
            return '<div class="medium-editor-toolbar-emotion-preview" id="medium-editor-toolbar-emotion-preview">' +
                '    <span class="medium-editor-toolbar-emotion-preview-inner"></span>' +
                '</div>';
        },

        destroy: function () {
            if (this.emotionPreview) {
                if (this.emotionPreview.parentNode) {
                    this.emotionPreview.parentNode.removeChild(this.emotionPreview);
                }
                delete this.emotionPreview;
            }
        },

        hidePreview: function () {
            if (this.emotionPreview) {
                this.emotionPreview.classList.remove('medium-editor-emotion-preview-active');
            }
            this.activeMark = null;
        },

        showPreview: function (markEl) {
            if (this.emotionPreview.classList.contains('medium-editor-emotion-preview-active') ||
                    markEl.getAttribute('data-disable-preview')) {
                return true;
            }

            if (this.previewValueSelector) {
                this.emotionPreview.querySelector(this.previewValueSelector).textContent = markEl.attributes['data-preview'].value;
            }

            this.emotionPreview.classList.add('medium-toolbar-arrow-over');
            this.emotionPreview.classList.remove('medium-toolbar-arrow-under');

            if (!this.emotionPreview.classList.contains('medium-editor-emotion-preview-active')) {
                this.emotionPreview.classList.add('medium-editor-emotion-preview-active');
            }

            this.activeEmotion = markEl;

            this.positionPreview();
            this.attachPreviewHandlers();

            return this;
        },

        positionPreview: function (activeEmotion) {
            activeEmotion = activeEmotion || this.activeEmotion;
            var containerWidth = this.window.innerWidth,
                buttonHeight = this.emotionPreview.offsetHeight,
                boundary = activeEmotion.getBoundingClientRect(),
                diffLeft = this.diffLeft,
                diffTop = this.diffTop,
                elementsContainer = this.getEditorOption('elementsContainer'),
                elementsContainerAbsolute = ['absolute', 'fixed'].indexOf(window.getComputedStyle(elementsContainer).getPropertyValue('position')) > -1,
                relativeBoundary = {},
                halfOffsetWidth, defaultLeft, middleBoundary, elementsContainerBoundary, top;

            halfOffsetWidth = this.emotionPreview.offsetWidth / 2;
            var toolbarExtension = this.base.getExtensionByName('toolbar');
            if (toolbarExtension) {
                diffLeft = toolbarExtension.diffLeft;
                diffTop = toolbarExtension.diffTop;
            }
            defaultLeft = diffLeft - halfOffsetWidth;

            // If container element is absolute / fixed, recalculate boundaries to be relative to the container
            if (elementsContainerAbsolute) {
                elementsContainerBoundary = elementsContainer.getBoundingClientRect();
                ['top', 'left'].forEach(function (key) {
                    relativeBoundary[key] = boundary[key] - elementsContainerBoundary[key];
                });

                relativeBoundary.width = boundary.width;
                relativeBoundary.height = boundary.height;
                boundary = relativeBoundary;

                containerWidth = elementsContainerBoundary.width;

                // Adjust top position according to container scroll position
                top = elementsContainer.scrollTop;
            } else {
                // Adjust top position according to window scroll position
                top = this.window.pageYOffset;
            }

            middleBoundary = boundary.left + boundary.width / 2;
            top += buttonHeight + boundary.top + boundary.height - diffTop - this.emotionPreview.offsetHeight;

            this.emotionPreview.style.top = Math.round(top) + 'px';
            this.emotionPreview.style.right = 'initial';
            if (middleBoundary < halfOffsetWidth) {
                this.emotionPreview.style.left = defaultLeft + halfOffsetWidth + 'px';
                this.emotionPreview.style.right = 'initial';
            } else if ((containerWidth - middleBoundary) < halfOffsetWidth) {
                this.emotionPreview.style.left = 'auto';
                this.emotionPreview.style.right = 0;
            } else {
                this.emotionPreview.style.left = defaultLeft + middleBoundary + 'px';
                this.emotionPreview.style.right = 'initial';
            }
        },

        attachToEditables: function () {
            this.subscribe('editableMouseover', this.handleEditableMouseover.bind(this));
            this.subscribe('positionedToolbar', this.handlePositionedToolbar.bind(this));
        },

        handlePositionedToolbar: function () {
            // If the toolbar is visible and positioned, we don't need to hide the preview
            // when showWhenToolbarIsVisible is true
            if (!this.showWhenToolbarIsVisible) {
                this.hidePreview();
            }
        },

        handleClick: function (event) {
            var emotionHighlighterExtension = this.base.getExtensionByName('emotion-highlighter'),
                activeEmotion = this.activeEmotion;

            if (emotionHighlighterExtension && activeEmotion) {
                event.preventDefault();

                this.base.selectElement(this.activeEmotion);

                // Using setTimeout + delay because:
                // We may actually be displaying the mark form, which should be controlled by delay
                this.base.delay(function () {
                    if (activeEmotion) {
                        var opts = {
                            value: activeEmotion.attributes.href.value,
                            target: activeEmotion.getAttribute('target'),
                            buttonClass: activeEmotion.getAttribute('class')
                        };
                        emotionHighlighterExtension.showForm(opts);
                        activeEmotion = null;
                    }
                }.bind(this));
            }

            this.hidePreview();
        },

        handleEmotionMouseout: function () {
            this.markToPreview = null;
            this.off(this.activeEmotion, 'mouseout', this.instanceHandleEmotionMouseout);
            this.instanceHandleEmotionMouseout = null;
        },

        handleEditableMouseover: function (event) {
            var target = MediumEditor.util.getClosestTag(event.target, 'mark');

            if (false === target) {
                return;
            }

            // only show when toolbar is not present
            var toolbar = this.base.getExtensionByName('toolbar');
            if (!this.showWhenToolbarIsVisible && toolbar && toolbar.isDisplayed && toolbar.isDisplayed()) {
                return true;
            }

            // detach handler for other mark in case we hovered multiple marks quickly
            if (this.activeEmotion && this.activeEmotion !== target) {
                this.detachPreviewHandlers();
            }

            this.markToPreview = target;

            this.instanceHandleEmotionMouseout = this.handleEmotionMouseout.bind(this);
            this.on(this.markToPreview, 'mouseout', this.instanceHandleEmotionMouseout);
            // Using setTimeout + delay because:
            // - We're going to show the mark preview according to the configured delay
            //   if the mouse has not left the mark tag in that time
            this.base.delay(function () {
                if (this.markToPreview) {
                    this.showPreview(this.markToPreview);
                }
            }.bind(this));
        },

        handlePreviewMouseover: function () {
            this.lastOver = (new Date()).getTime();
            this.hovering = true;
        },

        handlePreviewMouseout: function (event) {
            if (!event.relatedTarget || !/emotion-preview/.test(event.relatedTarget.className)) {
                this.hovering = false;
            }
        },

        updatePreview: function () {
            if (this.hovering) {
                return true;
            }
            var durr = (new Date()).getTime() - this.lastOver;
            if (durr > this.hideDelay) {
                // hide the preview 1/2 second after mouse leaves the link
                this.detachPreviewHandlers();
            }
        },

        detachPreviewHandlers: function () {
            // cleanup
            clearInterval(this.intervalTimer);
            if (this.instanceHandlePreviewMouseover) {
                this.off(this.emotionPreview, 'mouseover', this.instanceHandlePreviewMouseover);
                this.off(this.emotionPreview, 'mouseout', this.instanceHandlePreviewMouseout);
                if (this.activeEmotion) {
                    this.off(this.activeEmotion, 'mouseover', this.instanceHandlePreviewMouseover);
                    this.off(this.activeEmotion, 'mouseout', this.instanceHandlePreviewMouseout);
                }
            }

            this.hidePreview();

            this.hovering = this.instanceHandlePreviewMouseover = this.instanceHandlePreviewMouseout = null;
        },

        // TODO: break up method and extract out handlers
        attachPreviewHandlers: function () {
            this.lastOver = (new Date()).getTime();
            this.hovering = true;

            this.instanceHandlePreviewMouseover = this.handlePreviewMouseover.bind(this);
            this.instanceHandlePreviewMouseout = this.handlePreviewMouseout.bind(this);

            this.intervalTimer = setInterval(this.updatePreview.bind(this), 200);

            this.on(this.emotionPreview, 'mouseover', this.instanceHandlePreviewMouseover);
            this.on(this.emotionPreview, 'mouseout', this.instanceHandlePreviewMouseout);
            this.on(this.activeEmotion, 'mouseover', this.instanceHandlePreviewMouseover);
            this.on(this.activeEmotion, 'mouseout', this.instanceHandlePreviewMouseout);
        }
    });

    MediumEditor.extensions.emotionPreview = EmotionPreview;
}());
